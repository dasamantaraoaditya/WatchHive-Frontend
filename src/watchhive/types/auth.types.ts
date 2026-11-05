import { User } from './user.types';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    displayName?: string;
}

export interface GoogleLoginData {
    idToken: string;
}

export interface RegisterResult {
    requiresVerification: boolean;
    email: string;
    username: string;
    message: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    isNewUser?: boolean;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<RegisterResult>;
    verifyEmail: (token: string, email?: string) => Promise<AuthResponse>;
    resendVerification: (email: string) => Promise<{ message: string }>;
    googleLogin: (idToken: string) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
    setPassword: (newPassword: string) => Promise<{ message: string }>;
    forgotPassword: (email: string) => Promise<{ message: string }>;
    resetPassword: (token: string, email: string, newPassword: string) => Promise<{ message: string }>;
    requestEmailOtp: (email: string) => Promise<{ message: string; email: string; isNewUser: boolean }>;
    verifyEmailOtp: (email: string, code: string) => Promise<AuthResponse & { isNewUser: boolean }>;
}

