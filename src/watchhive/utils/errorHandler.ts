/**
 * Centralized error handler and sanitizer for WatchersHive web client.
 * Converts raw Axios errors, network failures, or unhandled exceptions
 * into clean, user-friendly messages with contextual guidance.
 */

export function formatUserFriendlyError(
    error: any,
    options?: {
        action?: string;
        defaultMessage?: string;
        resourceType?: 'post' | 'entry' | 'profile' | 'user' | 'movie' | 'comment' | 'general';
    }
): string {
    const defaultMsg = options?.defaultMessage || 'Something went wrong. Please try again.';
    if (!error) return defaultMsg;

    // 1. Handle Axios or HTTP response errors
    const status = error?.response?.status || error?.status;
    const responseData = error?.response?.data;
    const requestUrl = (error?.config?.url || '').toLowerCase();

    // Check backend-provided error message
    const backendMessage = extractBackendMessage(responseData);

    if (status === 404) {
        if (
            options?.resourceType === 'post' ||
            options?.resourceType === 'entry' ||
            requestUrl.includes('/entries') ||
            requestUrl.includes('/entry')
        ) {
            return formatWithAction('This post is no longer available or has been deleted.', options?.action);
        }
        if (
            options?.resourceType === 'profile' ||
            options?.resourceType === 'user' ||
            requestUrl.includes('/users') ||
            requestUrl.includes('/user')
        ) {
            return formatWithAction('This user profile could not be found.', options?.action);
        }
        if (
            options?.resourceType === 'movie' ||
            requestUrl.includes('/tmdb') ||
            requestUrl.includes('/movie') ||
            requestUrl.includes('/tv')
        ) {
            return formatWithAction('Movie or show details could not be found.', options?.action);
        }
        if (
            options?.resourceType === 'comment' ||
            requestUrl.includes('/comments')
        ) {
            return formatWithAction('This comment is no longer available.', options?.action);
        }
        return formatWithAction('This item is no longer available or could not be found.', options?.action);
    }

    if (status === 401) {
        return 'Your session has expired. Please log in again to continue.';
    }

    if (status === 403) {
        if (backendMessage && !backendMessage.toLowerCase().includes('forbidden')) {
            return backendMessage;
        }
        return 'This content is private or you do not have permission to view it.';
    }

    if (status === 400 && backendMessage) {
        return backendMessage;
    }

    if (status === 409) {
        return backendMessage || formatWithAction('This item is already added or in conflict.', options?.action);
    }

    if (status === 429) {
        return 'Too many requests. Please slow down and try again in a few moments.';
    }

    if (status >= 500) {
        return 'Our hive is experiencing high traffic. Please try again in a few moments.';
    }

    // 2. Handle Network or offline errors
    const rawString = String(error?.message || error || '').trim();
    const lower = rawString.toLowerCase();

    if (
        lower.includes('network error') ||
        lower.includes('failed to fetch') ||
        lower.includes('econnrefused') ||
        lower.includes('offline') ||
        !navigator.onLine
    ) {
        return 'Unable to connect to WatchersHive. Please check your internet connection and try again.';
    }

    if (lower.includes('timeout') || lower.includes('timed out')) {
        return 'The request timed out. Please check your connection and try again.';
    }

    // If backend returned a clear, non-technical message
    if (backendMessage && isCleanMessage(backendMessage)) {
        return formatWithAction(backendMessage, options?.action);
    }

    // 3. Fallback: sanitize any raw string or error
    return sanitizeString(rawString, options);
}

function extractBackendMessage(data: any): string | null {
    if (!data) return null;
    if (typeof data === 'string') {
        if (!data.startsWith('<') && !data.includes('<!DOCTYPE')) {
            return data.trim();
        }
        return null;
    }
    if (typeof data === 'object') {
        if (typeof data.error === 'string' && data.error.trim()) {
            return data.error.trim();
        }
        if (typeof data.message === 'string' && data.message.trim()) {
            return data.message.trim();
        }
        if (Array.isArray(data.errors) && data.errors.length > 0) {
            const first = data.errors[0];
            if (typeof first === 'string') return first.trim();
            if (typeof first?.message === 'string') return first.message.trim();
            if (typeof first?.msg === 'string') return first.msg.trim();
        }
    }
    return null;
}

function isCleanMessage(msg: string): boolean {
    const lower = msg.toLowerCase();
    if (
        lower.includes('syntaxerror') ||
        lower.includes('typeerror') ||
        lower.includes('internal server error') ||
        lower.includes('route not found') ||
        lower.includes('prisma') ||
        lower.includes('drizzle') ||
        lower.includes('sql') ||
        lower.includes('stack') ||
        lower.includes('exception') ||
        lower.includes('axios')
    ) {
        return false;
    }
    return true;
}

function sanitizeString(raw: string, options?: { action?: string; defaultMessage?: string }): string {
    const defaultMsg = options?.defaultMessage || 'Something went wrong. Please try again.';
    if (!raw) return defaultMsg;

    let cleaned = raw
        .replace(/^Error:\s*/i, '')
        .replace(/^AxiosError:\s*/i, '')
        .trim();

    const lower = cleaned.toLowerCase();
    if (
        lower.includes('route not found') ||
        lower.includes('not found') ||
        lower.includes('404')
    ) {
        return formatWithAction('This item is no longer available or could not be found.', options?.action);
    }

    if (
        lower.includes('internal server error') ||
        lower.includes('500') ||
        lower.includes('502') ||
        lower.includes('503')
    ) {
        return 'Our hive is experiencing high traffic. Please try again in a few moments.';
    }

    if (!isCleanMessage(cleaned)) {
        return defaultMsg;
    }

    if (cleaned.length > 100) {
        cleaned = `${cleaned.substring(0, 97)}...`;
    }

    return formatWithAction(cleaned, options?.action);
}

function formatWithAction(message: string, action?: string): string {
    if (action && action.trim()) {
        return `${action.trim()}: ${message}`;
    }
    return message;
}
