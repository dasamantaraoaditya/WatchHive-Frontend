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

    isAuthenticated(): boolean {
        return !!apiClient.getAccessToken();
    },
};

export default authService;
