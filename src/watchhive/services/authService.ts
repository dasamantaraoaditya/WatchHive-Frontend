import apiClient from './api';
import { LoginCredentials, RegisterData, AuthResponse } from '../types';

export const authService = {
    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/auth/register', data);
        apiClient.setTokens(response.accessToken, response.refreshToken);
        return response;
    },

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
        apiClient.setTokens(response.accessToken, response.refreshToken);
        return response;
    },

    async googleLogin(idToken: string): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/auth/google', { idToken });
        apiClient.setTokens(response.accessToken, response.refreshToken);
        return response;
    },

    async logout(): Promise<void> {
        try {
            await apiClient.post('/auth/logout');
        } finally {
            apiClient.clearTokens();
        }
    },

    async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        const response = await apiClient.post<{ accessToken: string; refreshToken: string }>(
            '/auth/refresh',
            { refreshToken }
        );
        apiClient.setTokens(response.accessToken, response.refreshToken);
        return response;
    },

    /** Request a password reset email for the given address */
    async forgotPassword(email: string): Promise<{ message: string; devToken?: string }> {
        return apiClient.post<{ message: string; devToken?: string }>('/auth/forgot-password', { email });
    },

    /** Complete a password reset using the token from the reset email link */
    async resetPassword(token: string, email: string, newPassword: string): Promise<{ message: string }> {
        return apiClient.post<{ message: string }>('/auth/reset-password', { token, email, newPassword });
    },

    /** Set a backup password on a Google-only account (requires auth token) */
    async setPassword(newPassword: string): Promise<{ message: string }> {
        return apiClient.post<{ message: string }>('/auth/set-password', { newPassword });
    },

    isAuthenticated(): boolean {
        return !!apiClient.getAccessToken();
    },
};

export default authService;
