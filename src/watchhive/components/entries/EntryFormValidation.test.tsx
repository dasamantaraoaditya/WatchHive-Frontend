import { describe, it, expect } from 'vitest';

// Test timezone-aware local ISO formatter logic
const toLocalISOString = (dateInput?: Date | string | number | null) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const offset = d.getTimezoneOffset() * 60000;
    const localTime = new Date(d.getTime() - offset);
    return localTime.toISOString().slice(0, 16);
};

// Test entry data normalization logic as used in EntryForm
const normalizeEntryFormData = (entry?: any) => {
    const rawRating = entry?.rating;
    const normalizedRating = rawRating != null && !isNaN(Number(rawRating)) && Number(rawRating) > 0
        ? Number(rawRating)
        : undefined;

    const rawTags = entry?.tags;
    const normalizedTags = Array.isArray(rawTags)
        ? rawTags
        : (typeof rawTags === 'string'
            ? rawTags.replace(/[{}]/g, '').split(',').map((t: string) => t.trim()).filter(Boolean)
            : []);

    const rawSeasons = entry?.seasons;
    const normalizedSeasons = Array.isArray(rawSeasons) && rawSeasons.length > 0
        ? rawSeasons.map(Number).filter((n: number) => !isNaN(n) && n > 0)
        : (entry?.currentSeason != null ? [Number(entry.currentSeason)] : undefined);

    const rawBuddies = entry?.watchBuddies;
    const normalizedBuddies = Array.isArray(rawBuddies) ? rawBuddies : [];

    return {
        rating: normalizedRating,
        tags: normalizedTags,
        seasons: normalizedSeasons,
        watchBuddies: normalizedBuddies,
    };
};

describe('Entry Form Data & Date Sanitization', () => {
    describe('toLocalISOString', () => {
        it('returns empty string for null, undefined, and empty string without defaulting to epoch 1970', () => {
            expect(toLocalISOString(null)).toBe('');
            expect(toLocalISOString(undefined)).toBe('');
            expect(toLocalISOString('')).toBe('');
        });

        it('returns empty string for invalid date values', () => {
            expect(toLocalISOString('invalid-date-string')).toBe('');
        });

        it('correctly formats valid date', () => {
            const date = new Date('2026-11-27T12:00:00.000Z');
            const result = toLocalISOString(date);
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
        });
    });

    describe('normalizeEntryFormData', () => {
        it('coerces postgres string rating ("8.5") to number (8.5)', () => {
            const result = normalizeEntryFormData({ rating: '8.5' });
            expect(result.rating).toBe(8.5);
            expect(typeof result.rating).toBe('number');
        });

        it('handles null, undefined, or 0 rating safely as undefined', () => {
            expect(normalizeEntryFormData({ rating: null }).rating).toBeUndefined();
            expect(normalizeEntryFormData({ rating: undefined }).rating).toBeUndefined();
            expect(normalizeEntryFormData({ rating: 0 }).rating).toBeUndefined();
            expect(normalizeEntryFormData({ rating: '0' }).rating).toBeUndefined();
        });

        it('handles tags properly whether array or postgres text format', () => {
            expect(normalizeEntryFormData({ tags: ['action', 'thriller'] }).tags).toEqual(['action', 'thriller']);
            expect(normalizeEntryFormData({ tags: '{action,thriller}' }).tags).toEqual(['action', 'thriller']);
            expect(normalizeEntryFormData({ tags: null }).tags).toEqual([]);
        });

        it('handles seasons safely', () => {
            expect(normalizeEntryFormData({ seasons: ['1', '2'] }).seasons).toEqual([1, 2]);
            expect(normalizeEntryFormData({ currentSeason: 3 }).seasons).toEqual([3]);
            expect(normalizeEntryFormData({ seasons: null }).seasons).toBeUndefined();
        });

        it('guarantees watchBuddies is always an array', () => {
            expect(normalizeEntryFormData({ watchBuddies: null }).watchBuddies).toEqual([]);
            expect(normalizeEntryFormData({ watchBuddies: [{ id: '1', username: 'alex' }] }).watchBuddies).toEqual([
                { id: '1', username: 'alex' },
            ]);
        });
    });
});
