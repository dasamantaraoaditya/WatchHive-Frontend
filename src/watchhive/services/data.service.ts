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

    // Explicit watch/logged date variations
    if (/(?:watch(?:ed)?(?:date|at|time|year|day)?|date(?:watched|seen|logged|finished|completed|added|viewed)|(?:logged|finished|completed|seen|viewed)(?:date|at|time)?)/i.test(s)) {
        return true;
    }

    // Generic "date" or "watched" (and confirmed not release date)
    if (/^(?:date|watched|logged|viewed|finished|completed|time|timestamp)$/i.test(s)) {
        return true;
    }

    return false;
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
    if (/^(?:title|name|movie|film|show|series|item|entry|moviename|filmtitle|movietitle|showname|seriestitle)$/i.test(s)) {
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
    // Exclude aggregate / external rating sources
    if (/(?:imdb|tmdb|metacritic|rottentomatoes|community|average|avg)/i.test(s)) {
        return false;
    }
    return /^(?:rating|score|myrating|myscore|personalrating|stars?|grade|rate|userrating)$/i.test(s) ||
        /(?:my_?rating|user_?rating|score|stars?)/i.test(s);
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
    return /^(?:type|mediatype|format|category|kind)$/i.test(s);
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
    return /^(?:rewatch|isrewatch|rewatched|repeat)$/i.test(s);
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
    return /^(?:imdbid|imdb|imdblink|imdburl)$/i.test(s);
}

export function isUrlHeader(raw: string): boolean {
    const s = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    return /^(?:url|link|website)$/i.test(s);
}

/**
 * Parses rating from various Notion and external formats:
 * - Star emojis: ⭐⭐⭐⭐ (4 stars out of 5 -> 8/10, or out of 10)
 * - Fractions: "4/5", "8.5/10", "4.5 / 5"
 * - Standard numbers: "8.5", "9"
 */
function parseRating(raw: string): string | null {
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
        return Math.min(10, Math.max(0, num)).toFixed(1);
    }

    return null;
}

/**
 * Parses date string (handles Notion @ mentions, ranges, ISO, formatted dates)
 */
function parseDateString(raw: string): { watchedAt: string; startedAt?: string; completedAt?: string } | null {
    if (!raw || !raw.trim()) return null;
    let s = raw.trim().replace(/^@/, '').trim();

    // Handle range e.g. "2024-01-01 -> 2024-01-05" or "May 1, 2024 to May 5, 2024"
    if (s.includes('->') || s.includes(' to ')) {
        const parts = s.split(/->|\bto\b/).map(p => p.trim());
        const d1 = new Date(parts[0]);
        const d2 = parts[1] ? new Date(parts[1]) : null;
        if (!isNaN(d1.getTime())) {
            const res: { watchedAt: string; startedAt?: string; completedAt?: string } = {
                watchedAt: d2 && !isNaN(d2.getTime()) ? d2.toISOString() : d1.toISOString(),
                startedAt: d1.toISOString(),
            };
            if (d2 && !isNaN(d2.getTime())) res.completedAt = d2.toISOString();
            return res;
        }
    }

    const d = new Date(s);
    if (!isNaN(d.getTime())) {
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
                        entries.push({
                            tmdbId: obj.tmdbid ? Number(obj.tmdbid) : undefined,
                            title: obj.title,
                            type: obj.type || 'MOVIE',
                            watchedAt: obj.watchedat || undefined,
                            rating: obj.rating || null,
                            review: obj.review || null,
                            tags: obj.tags ? String(obj.tags).split('|').filter(Boolean) : [],
                            isRewatch: obj.isrewatch === 'true' || obj.isrewatch === '1',
                            isWatching: obj.iswatching === 'true' || obj.iswatching === '1',
                            startedAt: obj.startedat || null,
                            completedAt: obj.completedat || null,
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

    // Otherwise, parse as Notion database CSV or general third-party CSV
    const rows = parseCsv(text);
    if (rows.length < 2) {
        throw new Error('CSV file contains no data rows.');
    }

    const rawHeaders = rows[0];

    // Find column indices with precision regex classifiers
    const titleIdx = rawHeaders.findIndex(isTitleHeader);
    const watchDateIdx = rawHeaders.findIndex(isWatchDateHeader);
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

        if (urlIdx !== -1 && row[urlIdx]) {
            const parsed = parseLinksAndIds(row[urlIdx]);
            if (parsed.tmdbId && !tmdbId) tmdbId = parsed.tmdbId;
            if (parsed.imdbId && !imdbId) imdbId = parsed.imdbId;
            if (parsed.type) detectedType = parsed.type;
        }

        // Determine type
        const typeRaw = typeIdx !== -1 ? row[typeIdx] : '';
        const type = detectedType || (typeRaw ? parseMediaType(typeRaw) : 'MOVIE');

        // Rating
        const ratingRaw = ratingIdx !== -1 ? row[ratingIdx] : '';
        const rating = ratingRaw ? parseRating(ratingRaw) : null;

        // Status
        const statusRaw = (statusIdx !== -1 ? row[statusIdx] : '').toLowerCase();
        const isWatching = statusRaw.includes('watching') || statusRaw.includes('in progress') || statusRaw.includes('current');
        const isWatchlist = statusRaw.includes('plan') || statusRaw.includes('to watch') || statusRaw.includes('want to watch') || statusRaw.includes('watchlist') || statusRaw.includes('queue') || statusRaw.includes('backlog');

        // Watch date: strictly ignores release date
        const dateRaw = watchDateIdx !== -1 ? row[watchDateIdx] : '';
        const dateInfo = dateRaw ? parseDateString(dateRaw) : null;

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

        // Rewatch
        let isRewatch = false;
        if (rewatchIdx !== -1 && row[rewatchIdx]) {
            const rw = row[rewatchIdx].toLowerCase().trim();
            isRewatch = rw === 'yes' || rw === 'true' || rw === '1' || rw === 'checked';
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
            watchedAt: dateInfo?.watchedAt || (isWatchlist ? null : null),
            startedAt: dateInfo?.startedAt || null,
            completedAt: dateInfo?.completedAt || null,
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
            description: 'Imported from Notion',
            items: watchlistItems,
        });
    }

    return { entries, lists: lists.length > 0 ? lists : undefined };
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

            if (Array.isArray(payload.entries)) body.entries = payload.entries;
            if (Array.isArray(payload.lists)) body.lists = payload.lists;

            if (!body.entries && !body.lists && Array.isArray(payload)) {
                body.entries = payload;
            }
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
export async function previewImport(file: File): Promise<ImportPreviewResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const text = (e.target?.result as string) || '';
                const isCsvFile = file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv');
                const parsedBody = parseImportFileContent(text, isCsvFile);

                const result = await apiClient.post<ImportPreviewResult>('/data/import/preview', parsedBody);
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
export async function commitImport(payload: { entries: any[]; lists?: any[] }): Promise<ImportResult> {
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
};

export default dataService;
