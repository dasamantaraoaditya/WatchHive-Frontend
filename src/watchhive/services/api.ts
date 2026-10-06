import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

export class ApiClient {
    public client: AxiosInstance;
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    private isRefreshing = false;
    private failedQueue: Array<{
        resolve: (token: string) => void;
        reject: (error: unknown) => void;
    }> = [];

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

    // HTTP methods
    async get<T>(url: string, config = {}) {
        const response = await this.client.get<T>(url, config);
        return response.data;
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
