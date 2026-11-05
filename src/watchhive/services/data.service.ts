import apiClient from './api.js';

export type ExportFormat = 'json' | 'csv';

export interface ImportResult {
    message: string;
    // Entries
    entriesImported?: number;
    entriesSkipped?: number;
    entriesErrors?: string[];
    // Lists
    listsImported?: number;
    listsSkipped?: number;
    itemsImported?: number;
    itemsSkipped?: number;
}

export interface PreviewEntry {
    originalTitle: string;
    title: string;
    year?: string | null;
    type: 'MOVIE' | 'TV_SHOW' | 'EPISODE';
    rating?: string | null;
    watchedAt?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
    review?: string | null;
    tags?: string[];
    isRewatch?: boolean;
    isWatching?: boolean;
    watchLocation?: string | null;
    tmdbId?: number | null;
    imdbId?: string | null;
    matchedTitle?: string | null;
    matchedYear?: string | null;
    posterPath?: string | null;
    matchStatus: 'MATCHED' | 'UNMATCHED';
    inWatchlist?: boolean;
    isDuplicate?: boolean;
    duplicateReason?: string;
}

export interface ImportPreviewResult {
    total: number;
    matchedCount: number;
    unmatchedCount: number;
    duplicateCount?: number;
    missingDateCount?: number;
    entries: PreviewEntry[];
    lists?: any[];
}

export interface ExportOptions {
    includeEntries: boolean;
    includeLists: boolean;
    format: ExportFormat;
}

// ─── CSV HELPER / PARSER ─────────────────────────────────────────────────────

/**
 * Robust RFC 4180 CSV parser that handles:
 * - UTF-8 BOM
 * - Quoted values with embedded commas
 * - Quoted values with embedded newlines
 * - Escaped double-quotes ("")
 */
export function parseCsv(input: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    const str = input.replace(/^\uFEFF/, '');

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const nextChar = str[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') {
                i++;
            }
            currentRow.push(currentCell.trim());
            if (currentRow.some(c => c.length > 0)) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(c => c.length > 0)) {
            rows.push(currentRow);
        }
    }

    return rows;
}

// ─── REGEX-BASED COLUMN CLASSIFIERS ──────────────────────────────────────────

/**
 * Explicitly identifies release dates/years to NEVER confuse with watch dates.
 * e.g., "Release Date", "Release Year", "Released", "Premiere", "Air Date", "First Air Date"
 */
export function isReleaseDateHeader(raw: string): boolean {
    const s = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    return /^(?:release(?:date|year)?|yearofrelease|released(?:date|at)?|airdate|aired(?:date)?|firstair(?:date)?|premiere(?:date)?|publicationdate|published(?:date)?|reldate|relyear)$/i.test(s) ||
        /(?:release|premiere|published|firstair|airdate)/i.test(s);
}

/**
 * Identifies Watch Date / Logged Date / Watched Year.
 * Strictly ignores any release date or premiere date columns.
 */
export function isWatchDateHeader(raw: string): boolean {
    if (isReleaseDateHeader(raw)) return false;
    const s = raw.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Explicit watch/logged/rated date variations (IMDb "Date Rated", Letterboxd "Watched Date", Trakt "Watched At" / "Rated At")
    if (/(?:watch(?:ed)?(?:date|at|time|year|day)?|date(?:watched|seen|logged|finished|completed|added|viewed|rated)|(?:logged|finished|completed|seen|viewed|rated)(?:date|at|time)?)/i.test(s)) {
        return true;
    }

    // Generic "date" or "watched" (and confirmed not release date)
    if (/^(?:date|watched|logged|viewed|finished|completed|timestamp)$/i.test(s)) {
        return true;
    }

    return false;
}

/**
 * Identifies dedicated Watch Time column.
 */
export function isWatchTimeHeader(raw: string): boolean {
    const s = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    return /^(?:watchtime|time|watchedtime|timewatched|hour|watchhour)$/i.test(s);
}

/**
 * Identifies Title / Name column.
 */
export function isTitleHeader(raw: string): boolean {
    const s = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    // Exclude columns that are people, categories, metadata, or IDs
    if (/(?:user|director|actor|writer|author|creator|genre|list|id|url|link|poster|backdrop|status|rating|date|year)/i.test(s)) {
        return false;
    }
    // Exact or strong matches
    if (/^(?:title|name|movie|film|show|series|item|entry|moviename|filmtitle|movietitle|showname|seriestitle|originaltitle|primarytitle|mediatitle)$/i.test(s)) {
        return true;
    }
    // Substring match e.g. "Movie / Show", "Film / Series"
    if (/(?:^|[\s_-])(title|name|movie|film|show|series)(?:$|[\s_-])/i.test(raw)) {
        return true;
    }
    return false;
}

/**
 * Identifies Rating / Score column.
 */
export function isRatingHeader(raw: string): boolean {
    const s = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    // Exclude aggregate / external rating sources (unless it's the user's personal rating)
    if (/^(?:imdbrating|tmdb(?:rating|vote)?|metacritic|rottentomatoes|community|average|avg|numvotes)$/i.test(s)) {
        return false;
    }
    return /^(?:rating|score|myrating|myscore|personalrating|stars?|grade|rate|userrating|yourrating)$/i.test(s) ||
        /(?:my_?rating|user_?rating|your_?rating|score|stars?)/i.test(s);
}

/**
 * Identifies Release Year / Release Date (used ONLY for disambiguating TMDb searches, never for watch date).
 */
export function isReleaseYearHeader(raw: string): boolean {
    if (isWatchDateHeader(raw)) return false;
    const s = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    return /^(?:releaseyear|yearofrelease|releasedate|relyear|release|year)$/i.test(s);
}

export function isTypeHeader(raw: string): boolean {
    const s = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    return /^(?:type|mediatype|format|category|kind|titletype)$/i.test(s);
}

export function isStatusHeader(raw: string): boolean {
    const s = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    return /^(?:status|state|watchstatus|progress|watchstate)$/i.test(s);
}

export function isReviewHeader(raw: string): boolean {
    const s = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    return /^(?:review|notes?|comments?|thoughts?|critique|memo|description)$/i.test(s);
}

export function isTagsHeader(raw: string): boolean {
    const s = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    return /^(?:tags?|genres?)$/i.test(s);
}

export function isRewatchHeader(raw: string): boolean {
    const s = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    return /^(?:rewatch|isrewatch|rewatched|repeat|plays)$/i.test(s);
}

export function isLocationHeader(raw: string): boolean {
    const s = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    return /^(?:location|watchlocation|platform|service|wheretowatch|streaming(?:service)?|cinema|theater)$/i.test(s);
}

export function isTmdbHeader(raw: string): boolean {
    const s = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    return /^(?:tmdbid|tmdb|tmdblink|tmdburl)$/i.test(s);
}

export function isImdbHeader(raw: string): boolean {
    const s = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    return /^(?:imdbid|imdb|imdblink|imdburl|const)$/i.test(s);
}

export function isUrlHeader(raw: string): boolean {
    const s = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    return /^(?:url|link|website)$/i.test(s);
}

/**
 * Parses rating from various external formats (Letterboxd, IMDb, Notion, Trakt):
 * - Star emojis: ⭐⭐⭐⭐ (4 stars out of 5 -> 8/10, or out of 10)
 * - Fractions: "4/5", "8.5/10", "4.5 / 5"
 * - 5-star scale (when isFiveStarScale = true, e.g. Letterboxd): 4.5 -> 9.0
 * - Standard numbers: "8.5", "9"
 */
function parseRating(raw: string, isFiveStarScale: boolean = false): string | null {
    if (!raw || !raw.trim()) return null;
    const s = raw.trim();

    // Check for stars
    const starMatches = s.match(/[⭐⭐️★🌟]/g);
    if (starMatches && starMatches.length > 0) {
        const count = starMatches.length;
        if (count <= 5) {
            return (count * 2).toFixed(1);
        }
        return Math.min(10, count).toFixed(1);
    }

    // Check for fractions like "4/5" or "8.5/10"
    const fracMatch = s.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
    if (fracMatch) {
        const num = parseFloat(fracMatch[1]);
        const denom = parseFloat(fracMatch[2]);
        if (denom > 0) {
            const normalized = (num / denom) * 10;
            return Math.min(10, Math.max(0, normalized)).toFixed(1);
        }
    }

    // Direct number
    const num = parseFloat(s);
    if (!isNaN(num)) {
        const finalNum = isFiveStarScale && num <= 5 ? num * 2 : num;
        return Math.min(10, Math.max(0, finalNum)).toFixed(1);
    }

    return null;
}

/**
 * Combines date string and optional time string, falling back to 12:00:00 (midday)
 * if time is omitted. Returns null if date is missing or invalid.
 * NOTE: Time can have a fallback, but Date cannot.
 */
function parseSingleDateWithTime(rawDate: string, rawTime?: string): Date | null {
    if (!rawDate || !rawDate.trim()) return null;
    let dStr = rawDate.trim().replace(/^@/, '').trim();
    const tStr = rawTime?.trim() || '';

    // Check if dStr already contains a time component
    const hasEmbeddedTime = /T\d{2}:\d{2}/i.test(dStr) || /\b\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]m)?\b/i.test(dStr);

    if (tStr && !hasEmbeddedTime) {
        const combined = new Date(`${dStr} ${tStr}`);
        if (!isNaN(combined.getTime())) {
            return combined;
        }
    }

    // Try parsing date string
    let parsed = new Date(dStr);

    // Standard ISO YYYY-MM-DD: set to 12:00:00 UTC to protect against date rollover across timezones
    if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
        parsed = new Date(`${dStr}T12:00:00Z`);
    } else if (!isNaN(parsed.getTime()) && !hasEmbeddedTime) {
        // Fallback time to 12:00:00 if time was completely omitted
        if (parsed.getHours() === 0 && parsed.getMinutes() === 0) {
            parsed.setHours(12, 0, 0, 0);
        }
    }

    if (!isNaN(parsed.getTime())) {
        return parsed;
    }

    return null;
}

/**
 * Parses date string (handles Notion @ mentions, ranges, ISO, formatted dates, and optional time)
 */
function parseDateString(raw: string, timeRaw?: string): { watchedAt: string; startedAt?: string; completedAt?: string } | null {
    if (!raw || !raw.trim()) return null;
    let s = raw.trim().replace(/^@/, '').trim();

    // Handle range e.g. "2024-01-01 -> 2024-01-05" or "May 1, 2024 to May 5, 2024"
    if (s.includes('->') || s.includes(' to ')) {
        const parts = s.split(/->|\bto\b/).map(p => p.trim());
        const d1 = parseSingleDateWithTime(parts[0], timeRaw);
        const d2 = parts[1] ? parseSingleDateWithTime(parts[1]) : null;
        if (d1) {
            const res: { watchedAt: string; startedAt?: string; completedAt?: string } = {
                watchedAt: d2 ? d2.toISOString() : d1.toISOString(),
                startedAt: d1.toISOString(),
            };
            if (d2) res.completedAt = d2.toISOString();
            return res;
        }
    }

    const d = parseSingleDateWithTime(s, timeRaw);
    if (d) {
        return { watchedAt: d.toISOString() };
    }

    return null;
}

/**
 * Extracts TMDb ID, IMDb ID, or type from links or IDs
 */
function parseLinksAndIds(raw: string): { tmdbId?: number; imdbId?: string; type?: 'MOVIE' | 'TV_SHOW' } {
    if (!raw || !raw.trim()) return {};
    const s = raw.trim();

    // Direct number
    if (/^\d+$/.test(s)) {
        return { tmdbId: parseInt(s, 10) };
    }

    // TMDb URL: e.g. themoviedb.org/movie/550 or themoviedb.org/tv/1399
    const tmdbMatch = s.match(/themoviedb\.org\/(movie|tv)\/(\d+)/i);
    if (tmdbMatch) {
        return {
            type: tmdbMatch[1].toLowerCase() === 'tv' ? 'TV_SHOW' : 'MOVIE',
            tmdbId: parseInt(tmdbMatch[2], 10),
        };
    }

    // IMDb URL: e.g. imdb.com/title/tt0137523 or tt0137523
    const imdbMatch = s.match(/(tt\d{7,10})/i);
    if (imdbMatch) {
        return { imdbId: imdbMatch[1] };
    }

    return {};
}

/**
 * Normalizes entry media type
 */
function parseMediaType(raw: string): 'MOVIE' | 'TV_SHOW' | 'EPISODE' {
    if (!raw) return 'MOVIE';
    const s = raw.toLowerCase().trim();
    if (s.includes('tv') || s.includes('series') || s.includes('show') || s.includes('drama') || s.includes('anime') || s.includes('season')) {
        return 'TV_SHOW';
    }
    if (s.includes('episode')) {
        return 'EPISODE';
    }
    return 'MOVIE';
}

/**
 * Parses CSV export file (Notion CSV, WatchHive CSV, or third-party CSV) into { entries, lists }
 */
export function parseCsvContent(text: string): { entries?: any[]; lists?: any[] } {
    // Check if it's WatchHive native CSV export with section headers
    if (text.includes('# WATCH ENTRIES') || text.includes('# WATCH LISTS')) {
        const entries: any[] = [];
        const lists: any[] = [];

        let entriesPart = '';
        let listsPart = '';

        if (text.includes('# WATCH LISTS')) {
            const parts = text.split(/# WATCH LISTS/i);
            entriesPart = parts[0].replace(/# WATCH ENTRIES/i, '').trim();
            listsPart = parts[1]?.trim() || '';
        } else {
            entriesPart = text.replace(/# WATCH ENTRIES/i, '').trim();
        }

        if (entriesPart) {
            const rows = parseCsv(entriesPart);
            if (rows.length > 1) {
                const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    const obj: Record<string, any> = {};
                    headers.forEach((h, idx) => {
                        obj[h] = row[idx];
                    });
                    if (obj.title) {
                        const dateInfo = obj.watchedat ? parseDateString(obj.watchedat, obj.watchedtime || obj.time) : null;
                        entries.push({
                            tmdbId: obj.tmdbid ? Number(obj.tmdbid) : undefined,
                            title: obj.title,
                            type: obj.type || 'MOVIE',
                            watchedAt: dateInfo?.watchedAt || obj.watchedat || undefined,
                            rating: obj.rating || null,
                            review: obj.review || null,
                            tags: obj.tags ? String(obj.tags).split('|').filter(Boolean) : [],
                            isRewatch: obj.isrewatch === 'true' || obj.isrewatch === '1',
                            isWatching: obj.iswatching === 'true' || obj.iswatching === '1',
                            startedAt: dateInfo?.startedAt || obj.startedat || null,
                            completedAt: dateInfo?.completedAt || obj.completedat || null,
                            watchLocation: obj.watchlocation || null,
                            inWatchlist: obj.inwatchlist === 'true' || obj.inwatchlist === '1',
                        });
                    }
                }
            }
        }

        if (listsPart) {
            const rows = parseCsv(listsPart);
            if (rows.length > 1) {
                const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
                const listMap = new Map<string, any>();
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    const obj: Record<string, any> = {};
                    headers.forEach((h, idx) => {
                        obj[h] = row[idx];
                    });
                    const name = obj.listname;
                    if (!name) continue;
                    if (!listMap.has(name)) {
                        listMap.set(name, {
                            name,
                            type: obj.listtype || 'WATCHLIST',
                            description: obj.listdescription || null,
                            isPublic: obj.ispublic === 'true' || obj.ispublic === '1',
                            items: [],
                        });
                    }
                    if (obj.tmdbid) {
                        listMap.get(name).items.push({
                            tmdbId: Number(obj.tmdbid),
                            mediaType: obj.mediatype || 'movie',
                            orderIndex: obj.orderindex ? Number(obj.orderindex) : undefined,
                        });
                    }
                }
                lists.push(...Array.from(listMap.values()));
            }
        }

        return { entries, lists };
    }

    // Otherwise, parse as Notion database CSV or general third-party CSV (Letterboxd, IMDb, Trakt, etc.)
    const rows = parseCsv(text);
    if (rows.length < 2) {
        throw new Error('CSV file contains no data rows.');
    }

    const rawHeaders = rows[0];

    // Detect platform origins
    const isLetterboxd = rawHeaders.some(h => /letterboxd/i.test(h));
    const isImdb = rawHeaders.some(h => /const/i.test(h)) || rawHeaders.some(h => /imdbrating/i.test(h));
    const isWatchlistExport = rawHeaders.some(h => /^position$/i.test(h.trim())) && isImdb;

    // Find column indices with precision regex classifiers
    const titleIdx = rawHeaders.findIndex(isTitleHeader);

    // Prefer explicit viewing/watch date over generic creation/log date (crucial for Letterboxd where "Date" is log date and "Watched Date" is viewing date)
    let watchDateIdx = rawHeaders.findIndex(h => {
        const s = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        return /(?:watch(?:ed)?(?:date|at)|datewatched|viewed(?:date|at)|seen(?:date|at))/i.test(s);
    });
    if (watchDateIdx === -1) {
        watchDateIdx = rawHeaders.findIndex(isWatchDateHeader);
    }

    const watchTimeIdx = rawHeaders.findIndex(isWatchTimeHeader);
    const releaseYearIdx = rawHeaders.findIndex(isReleaseYearHeader);
    const ratingIdx = rawHeaders.findIndex(isRatingHeader);
    const typeIdx = rawHeaders.findIndex(isTypeHeader);
    const statusIdx = rawHeaders.findIndex(isStatusHeader);
    const reviewIdx = rawHeaders.findIndex(isReviewHeader);
    const tagsIdx = rawHeaders.findIndex(isTagsHeader);
    const rewatchIdx = rawHeaders.findIndex(isRewatchHeader);
    const locationIdx = rawHeaders.findIndex(isLocationHeader);
    const tmdbIdx = rawHeaders.findIndex(isTmdbHeader);
    const imdbIdx = rawHeaders.findIndex(isImdbHeader);
    const urlIdx = rawHeaders.findIndex(isUrlHeader);

    if (titleIdx === -1) {
        throw new Error('Could not find a Title or Name column in the CSV file. Please make sure the first row contains a column like "Name", "Title", or "Movie".');
    }

    const entries: any[] = [];
    const watchlistItems: any[] = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const title = row[titleIdx]?.trim();
        if (!title) continue;

        // Extract IDs or links
        let tmdbId: number | undefined;
        let imdbId: string | undefined;
        let detectedType: 'MOVIE' | 'TV_SHOW' | undefined;

        if (tmdbIdx !== -1 && row[tmdbIdx]) {
            const parsed = parseLinksAndIds(row[tmdbIdx]);
            if (parsed.tmdbId) tmdbId = parsed.tmdbId;
        }

        if (imdbIdx !== -1 && row[imdbIdx]) {
            const parsed = parseLinksAndIds(row[imdbIdx]);
            if (parsed.imdbId) imdbId = parsed.imdbId;
        }

        // If IMDb ID wasn't in a dedicated header, check if any cell contains tt\d{7,10} (e.g. IMDb Const column)
        if (!imdbId) {
            for (const cell of row) {
                if (/^tt\d{7,10}$/i.test(cell?.trim())) {
                    imdbId = cell.trim();
                    break;
                }
            }
        }

        if (urlIdx !== -1 && row[urlIdx]) {
            const parsed = parseLinksAndIds(row[urlIdx]);
            if (parsed.tmdbId && !tmdbId) tmdbId = parsed.tmdbId;
            if (parsed.imdbId && !imdbId) imdbId = parsed.imdbId;
            if (parsed.type) detectedType = parsed.type;
        }

        // Determine type
        const typeRaw = typeIdx !== -1 ? row[typeIdx] : '';
        const type = detectedType || (typeRaw ? parseMediaType(typeRaw) : 'MOVIE');

        // Rating (Letterboxd 5-star ratings are automatically scaled 2x to 10-point scale)
        const ratingRaw = ratingIdx !== -1 ? row[ratingIdx] : '';
        const rating = ratingRaw ? parseRating(ratingRaw, isLetterboxd) : null;

        // Status & Watchlist detection
        const statusRaw = (statusIdx !== -1 ? row[statusIdx] : '').toLowerCase();
        const isWatching = statusRaw.includes('watching') || statusRaw.includes('in progress') || statusRaw.includes('current');
        const isWatchlist = isWatchlistExport || statusRaw.includes('plan') || statusRaw.includes('to watch') || statusRaw.includes('want to watch') || statusRaw.includes('watchlist') || statusRaw.includes('queue') || statusRaw.includes('backlog');

        // Watch date & time: date is required, time falls back to 12:00:00
        const dateRaw = watchDateIdx !== -1 ? row[watchDateIdx] : '';
        const timeRaw = watchTimeIdx !== -1 ? row[watchTimeIdx] : '';
        const dateInfo = dateRaw ? parseDateString(dateRaw, timeRaw) : null;

        // Release year: strictly used for TMDb search disambiguation, NEVER as watchedAt
        const releaseYearRaw = releaseYearIdx !== -1 ? row[releaseYearIdx]?.trim() : '';
        const releaseYear = releaseYearRaw ? (releaseYearRaw.match(/\b(19\d\d|20\d\d)\b/)?.[1] || null) : null;

        // Review / Notes
        const review = reviewIdx !== -1 ? row[reviewIdx]?.trim() || null : null;

        // Tags / Genres
        let tags: string[] = [];
        if (tagsIdx !== -1 && row[tagsIdx]) {
            tags = row[tagsIdx].split(/[,|;]/).map(t => t.trim()).filter(Boolean);
        }

        // Rewatch (Letterboxd "Yes", Trakt plays > 1, or boolean)
        let isRewatch = false;
        if (rewatchIdx !== -1 && row[rewatchIdx]) {
            const rw = row[rewatchIdx].toLowerCase().trim();
            const playCount = parseInt(rw, 10);
            isRewatch = rw === 'yes' || rw === 'true' || rw === '1' || rw === 'checked' || (!isNaN(playCount) && playCount > 1);
        }

        // Location
        const watchLocation = locationIdx !== -1 ? row[locationIdx]?.trim() || null : null;

        const entry: Record<string, any> = {
            title,
            type,
            tmdbId,
            imdbId,
            rating,
            review,
            tags,
            isRewatch,
            isWatching,
            watchLocation,
            year: releaseYear,
            watchedAt: dateInfo?.watchedAt || null,
            startedAt: dateInfo?.startedAt || null,
            completedAt: dateInfo?.completedAt || null,
            inWatchlist: isWatchlist,
        };

        entries.push(entry);

        if (isWatchlist) {
            watchlistItems.push({
                title,
                tmdbId,
                mediaType: type === 'TV_SHOW' ? 'tv' : 'movie',
            });
        }
    }

    const lists: any[] = [];
    if (watchlistItems.length > 0) {
        lists.push({
            name: 'Watchlist',
            type: 'WATCHLIST',
            description: isImdb ? 'Imported from IMDb' : (isLetterboxd ? 'Imported from Letterboxd' : 'Imported Watchlist'),
            items: watchlistItems,
        });
    }

    return { entries, lists: lists.length > 0 ? lists : undefined };
}

// ─── NESTED JSON METADATA EXTRACTOR ──────────────────────────────────────────

const VALID_TITLE_KEYS = [
    'title', 'name', 'movietitle', 'filmtitle', 'showname', 'showtitle',
    'seriestitle', 'mediatitle', 'entrytitle', 'originaltitle', 'primarytitle', 'headline'
];

const ENTITY_CONTAINER_KEYS = [
    'movie', 'show', 'tv', 'series', 'film', 'episode', 'media', 'item', 'details', 'metadata', 'content', 'info', 'data'
];

const cleanKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Searches an arbitrary JSON payload (array, object with entries/movies/items/data, etc.)
 * to locate the primary list of entry items.
 */
export function findEntryListInJson(payload: any): any[] {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];

    const priorityKeys = [
        'entries', 'movies', 'films', 'shows', 'history', 'watched',
        'items', 'data', 'results', 'watchlist', 'list', 'records'
    ];
    for (const key of priorityKeys) {
        if (Array.isArray(payload[key]) && payload[key].length > 0) {
            return payload[key];
        }
    }

    // Check all object keys for arrays of objects
    for (const key of Object.keys(payload)) {
        if (Array.isArray(payload[key]) && payload[key].length > 0 && typeof payload[key][0] === 'object') {
            return payload[key];
        }
    }

    // Check one level deeper (e.g. payload.data.items, payload.user.history)
    for (const key of Object.keys(payload)) {
        const sub = payload[key];
        if (sub && typeof sub === 'object' && !Array.isArray(sub)) {
            for (const subKey of priorityKeys) {
                if (Array.isArray(sub[subKey]) && sub[subKey].length > 0) {
                    return sub[subKey];
                }
            }
        }
    }

    return [];
}

/**
 * Robust parser utility that inspects arbitrary, flat, or deeply nested JSON objects
 * (e.g. Trakt, Letterboxd, Simkl, Plex, Notion) to extract all required WatchHive entry metadata.
 */
export function extractEntryMetadata(rawItem: any): {
    title: string;
    type: 'MOVIE' | 'TV_SHOW' | 'EPISODE';
    year?: string;
    tmdbId?: number;
    imdbId?: string;
    watchedAt?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
    rating?: string | null;
    review?: string | null;
    tags?: string[];
    watchLocation?: string | null;
    isRewatch?: boolean;
    isWatching?: boolean;
    posterPath?: string | null;
} | null {
    if (!rawItem || typeof rawItem !== 'object') return null;

    // 1. EXTRACT TITLE
    let title = '';

    // Check top-level properties first
    for (const [k, v] of Object.entries(rawItem)) {
        if (typeof v === 'string' && v.trim() && VALID_TITLE_KEYS.includes(cleanKey(k))) {
            title = v.trim();
            break;
        }
    }

    // Check entity container objects (e.g. item.movie, item.show, item.media, item.item)
    let matchedContainer: Record<string, any> | null = null;
    if (!title) {
        for (const containerKey of ENTITY_CONTAINER_KEYS) {
            const container = (rawItem as any)[containerKey];
            if (container && typeof container === 'object' && !Array.isArray(container)) {
                matchedContainer = container;
                for (const [k, v] of Object.entries(container)) {
                    if (typeof v === 'string' && v.trim() && VALID_TITLE_KEYS.includes(cleanKey(k))) {
                        title = v.trim();
                        break;
                    }
                }
                if (title) break;
            }
        }
    }

    // Fallback: search any nested object property
    if (!title) {
        for (const [, propVal] of Object.entries(rawItem)) {
            if (propVal && typeof propVal === 'object' && !Array.isArray(propVal)) {
                for (const [k, v] of Object.entries(propVal)) {
                    if (typeof v === 'string' && v.trim() && VALID_TITLE_KEYS.includes(cleanKey(k))) {
                        title = v.trim();
                        matchedContainer = propVal as Record<string, any>;
                        break;
                    }
                }
                if (title) break;
            }
        }
    }

    if (!title) return null;

    // Helper to search root, matched container, and entity containers for a list of candidate keys
    const findValue = (keys: string[]): any => {
        const cleanedKeys = keys.map(cleanKey);
        // Check root
        for (const [k, v] of Object.entries(rawItem)) {
            if (v !== undefined && v !== null && cleanedKeys.includes(cleanKey(k))) {
                return v;
            }
        }
        // Check matched container
        if (matchedContainer) {
            for (const [k, v] of Object.entries(matchedContainer)) {
                if (v !== undefined && v !== null && cleanedKeys.includes(cleanKey(k))) {
                    return v;
                }
            }
        }
        // Check all other entity containers
        for (const containerKey of ENTITY_CONTAINER_KEYS) {
            const container = (rawItem as any)[containerKey];
            if (container && typeof container === 'object' && !Array.isArray(container)) {
                for (const [k, v] of Object.entries(container)) {
                    if (v !== undefined && v !== null && cleanedKeys.includes(cleanKey(k))) {
                        return v;
                    }
                }
            }
        }
        return undefined;
    };

    // 2. EXTRACT TMDB ID
    let tmdbId: number | undefined;
    const rawTmdb = findValue(['tmdbid', 'tmdb', 'tmdb_id', 'id_tmdb']);
    if (rawTmdb != null) {
        const parsed = parseInt(String(rawTmdb), 10);
        if (!isNaN(parsed) && parsed > 0) tmdbId = parsed;
    }
    // Check nested IDs objects: item.ids?.tmdb, item.movie?.ids?.tmdb, item.show?.ids?.tmdb
    if (!tmdbId) {
        const idsObj = rawItem.ids || matchedContainer?.ids || rawItem.movie?.ids || rawItem.show?.ids || rawItem.episode?.ids;
        if (idsObj && typeof idsObj === 'object') {
            const idVal = idsObj.tmdb || idsObj.tmdb_id || idsObj.tmdbId;
            if (idVal) {
                const parsed = parseInt(String(idVal), 10);
                if (!isNaN(parsed) && parsed > 0) tmdbId = parsed;
            }
        }
    }

    // 3. EXTRACT IMDB ID
    let imdbId: string | undefined;
    const rawImdb = findValue(['imdbid', 'imdb', 'imdb_id', 'id_imdb', 'const', 'imdb_const']);
    if (rawImdb && typeof rawImdb === 'string') {
        const match = rawImdb.match(/(tt\d{7,10})/i);
        if (match) imdbId = match[1];
    }
    if (!imdbId) {
        const idsObj = rawItem.ids || matchedContainer?.ids || rawItem.movie?.ids || rawItem.show?.ids || rawItem.episode?.ids;
        if (idsObj && typeof idsObj === 'object') {
            const idVal = idsObj.imdb || idsObj.imdb_id || idsObj.imdbId;
            if (idVal && typeof idVal === 'string') {
                const match = idVal.match(/(tt\d{7,10})/i);
                if (match) imdbId = match[1];
            }
        }
    }

    // 4. EXTRACT YEAR
    let year: string | undefined;
    const rawYear = findValue(['year', 'releaseyear', 'release_year', 'released', 'releasedate', 'release_date', 'firstairdate', 'first_air_date', 'airdate']);
    if (rawYear != null) {
        const match = String(rawYear).match(/\b(19\d\d|20\d\d)\b/);
        if (match) year = match[1];
    }

    // 5. EXTRACT MEDIA TYPE
    const rawType = findValue(['type', 'mediatype', 'media_type', 'kind', 'content_type']);
    let type: 'MOVIE' | 'TV_SHOW' | 'EPISODE' = 'MOVIE';
    if (rawType) {
        type = parseMediaType(String(rawType));
    } else if (rawItem.episode || matchedContainer === rawItem.episode) {
        type = 'EPISODE';
    } else if (rawItem.show || rawItem.tv || rawItem.series || matchedContainer === rawItem.show) {
        type = 'TV_SHOW';
    } else if (rawItem.movie || rawItem.film || matchedContainer === rawItem.movie) {
        type = 'MOVIE';
    }

    // 6. EXTRACT WATCH DATE
    const rawDate = findValue([
        'watchedat', 'watched_at', 'watcheddate', 'watchdate', 'watch_date',
        'date', 'viewedat', 'viewed_at', 'lastwatchedat', 'last_watched_at',
        'listedat', 'listed_at', 'loggedat', 'logged_at', 'actiondate', 'action_date',
        'ratedat', 'rated_at', 'timestamp', 'createdat', 'created_at'
    ]);
    const rawTime = findValue(['time', 'watchtime', 'watch_time', 'watchedtime']);
    const dateInfo = rawDate ? parseDateString(String(rawDate), rawTime ? String(rawTime) : undefined) : null;
    const watchedAt = dateInfo ? dateInfo.watchedAt : null;

    // 7. EXTRACT RATING
    const rawRating = findValue([
        'myrating', 'my_rating', 'rating', 'userrating', 'user_rating',
        'score', 'userscore', 'user_score', 'rate', 'stars', 'grade'
    ]);
    const rating = rawRating != null ? parseRating(String(rawRating)) : null;

    // 8. EXTRACT REVIEW / NOTES
    const rawReview = findValue(['review', 'notes', 'comment', 'comments', 'note', 'text', 'body', 'content']);
    const review = rawReview && typeof rawReview === 'string' && rawReview.trim() ? rawReview.trim() : null;

    // 9. EXTRACT TAGS / GENRES
    const rawTags = findValue(['tags', 'genres', 'genre', 'categories', 'keywords', 'labels']);
    let tags: string[] = [];
    if (Array.isArray(rawTags)) {
        tags = rawTags.map(String).filter(Boolean);
    } else if (typeof rawTags === 'string' && rawTags.trim()) {
        tags = rawTags.split(/[,|;]/).map(t => t.trim()).filter(Boolean);
    }

    // 10. EXTRACT LOCATION
    const rawLocation = findValue(['watchlocation', 'watch_location', 'location', 'platform', 'service', 'venue', 'theater', 'cinema']);
    const watchLocation = rawLocation && typeof rawLocation === 'string' && rawLocation.trim() ? rawLocation.trim() : null;

    // 11. REWATCH / CURRENTLY WATCHING
    const rawRewatch = findValue(['isrewatch', 'is_rewatch', 'rewatch', 're_watch', 'plays']);
    let isRewatch = false;
    if (rawRewatch != null) {
        const s = String(rawRewatch).toLowerCase().trim();
        const p = parseInt(s, 10);
        isRewatch = s === 'true' || s === 'yes' || s === '1' || (!isNaN(p) && p > 1);
    }

    const rawWatching = findValue(['iswatching', 'is_watching', 'watching']);
    const isWatching = rawWatching === true || rawWatching === 'true' || rawWatching === 1;

    // 12. POSTER PATH
    const rawPoster = findValue(['posterpath', 'poster_path', 'poster', 'image', 'banner', 'cover']);
    const posterPath = rawPoster && typeof rawPoster === 'string' ? rawPoster.trim() : null;

    return {
        title,
        type,
        year,
        tmdbId,
        imdbId,
        watchedAt,
        startedAt: dateInfo?.startedAt || null,
        completedAt: dateInfo?.completedAt || null,
        rating,
        review,
        tags,
        watchLocation,
        isRewatch,
        isWatching,
        posterPath,
    };
}

/**
 * Parses file content (JSON or CSV)
 */
export function parseImportFileContent(text: string, isCsvFileName: boolean): { entries?: any[]; lists?: any[] } {
    if (!text.trim()) {
        throw new Error('The uploaded file is empty.');
    }

    const body: Record<string, unknown> = {};
    let parsedJson = false;

    if (!isCsvFileName) {
        try {
            const payload = JSON.parse(text);
            parsedJson = true;

            const rawList = findEntryListInJson(payload);

            if (rawList.length > 0) {
                const extractedEntries: any[] = [];
                for (const item of rawList) {
                    const parsed = extractEntryMetadata(item);
                    if (parsed) {
                        extractedEntries.push(parsed);
                    }
                }
                if (extractedEntries.length > 0) {
                    body.entries = extractedEntries;
                }
            }

            if (Array.isArray(payload.lists)) body.lists = payload.lists;
        } catch {
            // Not valid JSON, fallback to CSV parsing below
        }
    }

    if (!parsedJson) {
        const csvResult = parseCsvContent(text);
        if (csvResult.entries) body.entries = csvResult.entries;
        if (csvResult.lists) body.lists = csvResult.lists;
    }

    if ((!body.entries || (body.entries as any[]).length === 0) &&
        (!body.lists || (body.lists as any[]).length === 0)) {
        throw new Error('No valid entries or watchlists found in file. Ensure the file contains title/name columns.');
    }

    return body as { entries?: any[]; lists?: any[] };
}

// ─── EXPORT ──────────────────────────────────────────────────────────────────

export async function exportData(options: ExportOptions): Promise<void> {
    const { includeEntries, includeLists, format } = options;

    const includeParts: string[] = [];
    if (includeEntries) includeParts.push('entries');
    if (includeLists) includeParts.push('lists');
    if (includeParts.length === 0) throw new Error('Select at least one data type to export.');

    const response = await apiClient.client.get('/data/export', {
        params: { format, include: includeParts.join(',') },
        responseType: 'blob',
    });

    const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
    const blob = new Blob([response.data], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split('T')[0];
    const label = includeParts.length === 2 ? 'export' : includeParts[0];
    const filename = `watchershive_${label}_${date}.${format}`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ─── IMPORT & PREVIEW ────────────────────────────────────────────────────────

/**
 * Parses file and calls /data/import/preview to match TMDb IDs and return a preview result
 */
export async function previewImport(
    file: File,
    options?: { defaultToCurrentYear?: boolean }
): Promise<ImportPreviewResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const text = (e.target?.result as string) || '';
                const isCsvFile = file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv');
                const parsedBody = parseImportFileContent(text, isCsvFile);

                const result = await apiClient.post<ImportPreviewResult>('/data/import/preview', {
                    ...parsedBody,
                    defaultToCurrentYear: options?.defaultToCurrentYear ?? false,
                });
                resolve(result);
            } catch (err: any) {
                reject(err);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read the file.'));
        reader.readAsText(file);
    });
}

/**
 * Commits the verified and matched import payload to the backend
 */
export async function commitImport(payload: {
    entries: any[];
    lists?: any[];
    defaultToCurrentYear?: boolean;
}): Promise<ImportResult> {
    return apiClient.post<ImportResult>('/data/import', payload);
}

/**
 * Searches TMDb multi for title correction in the review modal
 */
export async function searchTmdb(query: string): Promise<any[]> {
    if (!query || !query.trim()) return [];
    try {
        const res = await apiClient.client.get('/tmdb/search/multi', {
            params: { query: query.trim() },
        });
        const results = res.data?.results || [];
        return results.filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv');
    } catch {
        return [];
    }
}

/**
 * Standard importData convenience method
 */
export async function importData(file: File): Promise<ImportResult> {
    const preview = await previewImport(file);
    return commitImport({ entries: preview.entries, lists: preview.lists });
}

// Convenience aliases kept for legacy callers
export const exportEntries = (format: ExportFormat) =>
    exportData({ includeEntries: true, includeLists: false, format });

export const exportLists = (format: ExportFormat) =>
    exportData({ includeEntries: false, includeLists: true, format });

export const importEntries = (file: File) => importData(file);
export const importLists = (file: File) => importData(file);

export const SAMPLE_IMPORT_JSON = {
    entries: [
        {
            title: "Inception",
            year: 2010,
            type: "MOVIE",
            tmdbId: 27205,
            watchedAt: "2024-03-15T20:30:00Z",
            rating: 9.5,
            review: "Mind-bending dream heist with an incredible Hans Zimmer score. The hallway sequence remains unmatched.",
            tags: ["sci-fi", "thriller", "favorites", "cinema"],
            isRewatch: false,
            watchLocation: "IMAX Theater",
            startedAt: "2024-03-15T20:30:00Z",
            completedAt: "2024-03-15T23:00:00Z",
        },
        {
            title: "Severance",
            year: 2022,
            type: "TV_SHOW",
            tmdbId: 97546,
            watchedAt: "2024-04-02T21:15:00Z",
            rating: 10.0,
            review: "Flawless workplace dystopian mystery. The tension in the season finale is breathtaking.",
            tags: ["mystery", "sci-fi", "apple-tv", "binge"],
            isRewatch: false,
            watchLocation: "Living Room TV",
        },
    ],
    lists: [
        {
            name: "All-Time Favorites",
            description: "Personal top-tier cinema and shows",
            type: "CUSTOM",
            isPublic: true,
            items: [
                { title: "Inception", tmdbId: 27205, mediaType: "movie" },
            ],
        },
    ],
};

export const AI_IMPORT_PROMPT = `Convert my movie/TV watch history notes into a valid WatchHive import JSON object.

Output MUST strictly follow this JSON format:
{
  "entries": [
    {
      "title": "Exact Title of the movie or show (Required)",
      "year": 2024,
      "type": "MOVIE" or "TV_SHOW",
      "watchedAt": "YYYY-MM-DDTHH:mm:ssZ (Watch date is mandatory. If exact time is unknown, use 12:00:00Z)",
      "rating": 8.5,
      "review": "Your review or reaction notes",
      "tags": ["sci-fi", "cinema", "action"],
      "isRewatch": false,
      "watchLocation": "Cinema / Home / Netflix"
    }
  ]
}

Key Rules:
1. "title" is mandatory for TMDb auto-matching.
2. "watchedAt" is required for timeline logs: format as ISO 8601 (e.g. "2024-05-12T20:30:00Z"). If time is omitted in my notes, default to 12:00:00Z. DO NOT invent dates if missing.
3. "rating" must be a number on a 0.0 to 10.0 scale (convert 5-star ratings by multiplying by 2).
4. Output ONLY valid JSON without Markdown backticks or commentary so I can save directly to a .json file.

Here is my watch history:
[PASTE YOUR NOTES OR LIST HERE]`;

export const dataService = {
    exportData,
    exportEntries,
    exportLists,
    previewImport,
    commitImport,
    searchTmdb,
    importData,
    importEntries,
    importLists,
    extractEntryMetadata,
    findEntryListInJson,
    SAMPLE_IMPORT_JSON,
    AI_IMPORT_PROMPT,
};

export default dataService;
