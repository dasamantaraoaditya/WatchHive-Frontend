/**
 * Resolves direct deep links / search URLs for popular streaming providers.
 * Correctly opens the movie / search page on both desktop and mobile web / app.
 */
export const getDirectProviderLink = (
    providerName: string | undefined | null,
    fallbackLink: string | undefined | null,
    title: string
): string => {
    const encodedTitle = encodeURIComponent(title || '');
    if (!providerName) {
        return fallbackLink || `https://www.google.com/search?q=${encodedTitle}+watch+online`;
    }

    const name = providerName.toLowerCase();

    // Netflix
    if (name.includes('netflix')) {
        return `https://www.netflix.com/search?q=${encodedTitle}`;
    }

    // Amazon Prime Video
    if (name.includes('amazon') || name.includes('prime')) {
        return `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodedTitle}`;
    }

    // Disney+ / Hotstar
    if (name.includes('hotstar') || name.includes('disney')) {
        return `https://www.hotstar.com/in/explore?q=${encodedTitle}`;
    }

    // JioCinema
    if (name.includes('jiocinema')) {
        return `https://www.jiocinema.com/search/${encodedTitle}`;
    }

    // Zee5
    if (name.includes('zee5')) {
        return `https://www.zee5.com/search?q=${encodedTitle}`;
    }

    // SonyLIV
    if (name.includes('sonyliv')) {
        return `https://www.sonyliv.com/search?query=${encodedTitle}`;
    }

    // Apple TV
    if (name.includes('apple')) {
        return `https://tv.apple.com/search?q=${encodedTitle}`;
    }

    // YouTube
    if (name.includes('youtube')) {
        return `https://www.youtube.com/results?search_query=${encodedTitle}+movie`;
    }

    // Google Play / Google TV
    if (name.includes('google play') || name.includes('google tv')) {
        return `https://play.google.com/store/search?q=${encodedTitle}&c=movies`;
    }

    // Hulu
    if (name.includes('hulu')) {
        return `https://www.hulu.com/search?q=${encodedTitle}`;
    }

    // HBO Max / Max
    if (name.includes('max') || name.includes('hbo')) {
        return `https://play.max.com/search?q=${encodedTitle}`;
    }

    // Paramount+
    if (name.includes('paramount')) {
        return `https://www.paramountplus.com/search/?q=${encodedTitle}`;
    }

    // Peacock
    if (name.includes('peacock')) {
        return `https://www.peacocktv.com/watch/search?q=${encodedTitle}`;
    }

    // Aha
    if (name.includes('aha')) {
        return `https://www.aha.video/search?q=${encodedTitle}`;
    }

    // MX Player
    if (name.includes('mx player')) {
        return `https://www.mxplayer.in/search?q=${encodedTitle}`;
    }

    // MUBI
    if (name.includes('mubi')) {
        return `https://mubi.com/search/films?query=${encodedTitle}`;
    }

    return fallbackLink || `https://www.google.com/search?q=${encodedTitle}+watch+online`;
};
