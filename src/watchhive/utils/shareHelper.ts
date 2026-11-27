/**
 * Formatted social sharing helper for WatchersHive entries.
 */
export interface ShareWatchParams {
    title: string;
    rating?: number | null;
    review?: string | null;
    tmdbId?: number | null;
    mediaType?: string;
    username?: string;
    isWatching?: boolean;
    watchBuddies?: Array<{ username?: string; displayName?: string }> | string[] | null;
}

export const shareCompletedWatch = async (params: ShareWatchParams): Promise<boolean> => {
    const { title, rating, review, tmdbId, mediaType = 'movie', username, isWatching = false, watchBuddies } = params;
    const shareTitle = isWatching
        ? `WatchersHive: Currently watching ${title}`
        : `WatchersHive: Finished watching ${title}`;

    const buddiesNames = Array.isArray(watchBuddies)
        ? watchBuddies.map(b => (typeof b === 'string' ? b : (b?.displayName || b?.username || '')).trim()).filter(Boolean)
        : [];
    const withBuddies = buddiesNames.length > 0 ? ` with ${buddiesNames.join(', ')}` : '';

    const prefix = isWatching
        ? (username ? `${username} is currently watching${withBuddies}` : `Currently watching${withBuddies}`)
        : (username ? `${username} finished${withBuddies}` : `Just finished${withBuddies}`);
    let text = isWatching
        ? `📺 ${prefix} "${title}" on WatchersHive! 🐝\n`
        : `🍿 ${prefix} watching "${title}" on WatchersHive! 🐝\n`;

    if (rating != null && Number(rating) > 0) {
        text += `⭐️ Rating: ${Number(rating).toFixed(1)}/10\n`;
    }

    if (review && review.trim()) {
        const clean = review.trim();
        const snippet = clean.length > 140 ? `${clean.substring(0, 137)}...` : clean;
        text += `"${snippet}"\n`;
    }

    const shareUrl = tmdbId
        ? `${window.location.origin}/watch-hive/details/${mediaType.toLowerCase()}/${tmdbId}?source=story${username ? `&ref=${encodeURIComponent(username)}` : ''}`
        : window.location.origin;

    if (navigator.share) {
        try {
            await navigator.share({
                title: shareTitle,
                text,
                url: shareUrl,
            });
            return true;
        } catch (err: any) {
            if (err?.name !== 'AbortError') {
                console.error('Error sharing:', err);
            }
            return false;
        }
    } else {
        try {
            await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
            return true;
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            return false;
        }
    }
};
