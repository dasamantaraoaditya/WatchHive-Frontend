import apiClient from './api';
import { LoginCredentials, RegisterData, AuthResponse, RegisterResult } from '../types';

export const authService = {
    async register(data: RegisterData): Promise<RegisterResult> {
        return apiClient.post<RegisterResult>('/auth/register', data);
    },

    async verifyEmail(token: string, email?: string): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/auth/verify-email', { token, email });
        apiClient.setTokens(response.accessToken, response.refreshToken);
        return response;
    },

    async resendVerification(email: string): Promise<{ message: string }> {
        return apiClient.post<{ message: string }>('/auth/resend-verification', { email });
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

    /** Request a passwordless 6-digit sign-in code sent to email */
    async requestEmailOtp(email: string): Promise<{ message: string; email: string; isNewUser: boolean }> {
        return apiClient.post<{ message: string; email: string; isNewUser: boolean }>('/auth/email-code/request', { email });
    },

    /** Verify 6-digit email sign-in code and log in / register immediately */
    async verifyEmailOtp(email: string, code: string): Promise<AuthResponse & { isNewUser: boolean }> {
        const response = await apiClient.post<AuthResponse & { isNewUser: boolean }>('/auth/email-code/verify', { email, code });
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
    async forgotPassword(email: string): Promise<{ message: string; emailSent?: boolean }> {
        const res = await apiClient.post<{ message: string; emailSent?: boolean }>('/auth/forgot-password', { email });
        if (res && res.emailSent === false) {
            throw new Error(res.message || 'Failed to dispatch password reset email. The email service could not deliver the message.');
        }
        return res;
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
        return !!apiClient.getAccessToken() || !!localStorage.getItem('refreshToken');
    },
};

export default authService;
