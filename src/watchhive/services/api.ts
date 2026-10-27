import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

interface TmdbCacheEntry {
    data: unknown;
    expiresAt: number;
}

const MAX_TMDB_CACHE_SIZE = 500;

function getTmdbTtlMs(url: string): number {
    const cleanUrl = url.toLowerCase();
    if (cleanUrl.includes('/season/')) {
        return 24 * 60 * 60 * 1000; // 24 hours for TV seasons
    }
    if (cleanUrl.includes('/movie/') || cleanUrl.includes('/tv/')) {
        return 6 * 60 * 60 * 1000; // 6 hours for movie/tv metadata
    }
    if (cleanUrl.includes('/trending') || cleanUrl.includes('/popular')) {
        return 30 * 60 * 1000; // 30 minutes for trending/popular lists
    }
    if (cleanUrl.includes('/search') || cleanUrl.includes('/discover')) {
        return 10 * 60 * 1000; // 10 minutes for search & discover
    }
    return 15 * 60 * 1000; // 15 minutes default
}

function buildCacheKey(url: string, params?: unknown): string {
    if (!params || typeof params !== 'object') return url;
    try {
        const sortedParams = Object.keys(params as Record<string, unknown>)
            .sort()
            .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String((params as Record<string, unknown>)[k]))}`)
            .join('&');
        if (!sortedParams) return url;
        return url.includes('?') ? `${url}&${sortedParams}` : `${url}?${sortedParams}`;
    } catch {
        return url;
    }
}

export interface RequestConfigWithCache extends AxiosRequestConfig {
    noCache?: boolean;
}

export class ApiClient {
    public client: AxiosInstance;
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    private isRefreshing = false;
    private failedQueue: Array<{
        resolve: (token: string) => void;
        reject: (error: unknown) => void;
    }> = [];

    // TMDb Cache & In-Flight Request Deduplication (prevents redundant API calls)
    private tmdbCache = new Map<string, TmdbCacheEntry>();
    private inFlightRequests = new Map<string, Promise<unknown>>();

    private processQueue(error: unknown, token: string | null = null) {
        this.failedQueue.forEach((prom) => {
            if (error) {
                prom.reject(error);
            } else if (token) {
                prom.resolve(token);
            }
        });
        this.failedQueue = [];
    }

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Load tokens from localStorage
        this.loadTokens();

        // Request interceptor to add auth token
        this.client.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                if (this.accessToken && config.headers) {
                    config.headers.Authorization = `Bearer ${this.accessToken}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor to handle token refresh
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

                // If error is 401 and request wasn't already retried and not the refresh endpoint itself
                if (
                    error.response?.status === 401 &&
                    !originalRequest._retry &&
                    !originalRequest.url?.includes('/auth/refresh')
                ) {
                    if (this.isRefreshing) {
                        return new Promise((resolve, reject) => {
                            this.failedQueue.push({
                                resolve: (token: string) => {
                                    if (originalRequest.headers) {
                                        originalRequest.headers.Authorization = `Bearer ${token}`;
                                    }
                                    resolve(this.client(originalRequest));
                                },
                                reject: (err: unknown) => {
                                    reject(err);
                                },
                            });
                        });
                    }

                    const currentRefreshToken = this.refreshToken || localStorage.getItem('refreshToken');
                    if (!currentRefreshToken) {
                        this.clearTokens();
                        return Promise.reject(error);
                    }

                    originalRequest._retry = true;
                    this.isRefreshing = true;

                    try {
                        // Refresh the token
                        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                            refreshToken: currentRefreshToken,
                        });

                        const { accessToken, refreshToken } = response.data;
                        this.setTokens(accessToken, refreshToken);

                        this.processQueue(null, accessToken);

                        // Retry the original request with new token
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                        }
                        return this.client(originalRequest);
                    } catch (refreshError) {
                        this.processQueue(refreshError, null);
                        // Refresh failed, clear tokens and redirect to login
                        this.clearTokens();
                        window.location.href = '/watch-hive/login';
                        return Promise.reject(refreshError);
                    } finally {
                        this.isRefreshing = false;
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    private loadTokens() {
        this.accessToken = localStorage.getItem('accessToken');
        this.refreshToken = localStorage.getItem('refreshToken');
    }

    setTokens(accessToken: string, refreshToken: string) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    }

    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    getAccessToken() {
        return this.accessToken;
    }

    getRefreshToken() {
        return this.refreshToken;
    }

    /**
     * Clear all cached TMDb responses in memory.
     */
    clearTmdbCache() {
        this.tmdbCache.clear();
        this.inFlightRequests.clear();
    }

    // HTTP methods
    async get<T>(url: string, config: RequestConfigWithCache = {}): Promise<T> {
        const isTmdb = url.includes('/tmdb/') || url.startsWith('tmdb/') || url.startsWith('/tmdb');
        const bypassCache = config.noCache || config.headers?.['Cache-Control'] === 'no-cache';

        // Direct pass-through for non-TMDb routes (user, feeds, comments, notifications are ALWAYS fresh)
        if (!isTmdb) {
            const response = await this.client.get<T>(url, config);
            return response.data;
        }

        const cacheKey = buildCacheKey(url, config.params);
        const now = Date.now();

        // 1. Return cached entry if fresh and not bypassed
        if (!bypassCache) {
            const cached = this.tmdbCache.get(cacheKey);
            if (cached && cached.expiresAt > now) {
                return cached.data as T;
            }
        }

        // 2. Single-flight request deduplication: reuse in-flight promise if identical request is pending
        const pending = this.inFlightRequests.get(cacheKey);
        if (pending) {
            return (await pending) as T;
        }

        // 3. Initiate network request with single-flight memoization
        const fetchPromise = (async () => {
            try {
                const response = await this.client.get<T>(url, config);
                const ttl = getTmdbTtlMs(url);

                // Evict oldest entry if cache exceeds bounds
                if (this.tmdbCache.size >= MAX_TMDB_CACHE_SIZE) {
                    const oldestKey = this.tmdbCache.keys().next().value;
                    if (oldestKey) {
                        this.tmdbCache.delete(oldestKey);
                    }
                }

                this.tmdbCache.set(cacheKey, {
                    data: response.data,
                    expiresAt: Date.now() + ttl,
                });

                return response.data;
            } catch (error) {
                // Graceful degradation: if network fails, use expired cache if available
                const stale = this.tmdbCache.get(cacheKey);
                if (stale && stale.data !== undefined) {
                    return stale.data as T;
                }
                throw error;
            } finally {
                this.inFlightRequests.delete(cacheKey);
            }
        })();

        this.inFlightRequests.set(cacheKey, fetchPromise);
        return (await fetchPromise) as T;
    }

    async post<T>(url: string, data?: unknown, config = {}) {
        const response = await this.client.post<T>(url, data, config);
        return response.data;
    }

    async put<T>(url: string, data?: unknown, config = {}) {
        const response = await this.client.put<T>(url, data, config);
        return response.data;
    }

    async patch<T>(url: string, data?: unknown, config = {}) {
        const response = await this.client.patch<T>(url, data, config);
        return response.data;
    }

    async delete<T>(url: string, config = {}) {
        const response = await this.client.delete<T>(url, config);
        return response.data;
    }
}

export const apiClient = new ApiClient();
export default apiClient;
