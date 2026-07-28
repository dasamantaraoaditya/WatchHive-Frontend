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
    register: (data: RegisterData) => Promise<void>;
    googleLogin: (idToken: string) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
    setPassword: (newPassword: string) => Promise<{ message: string }>;
    forgotPassword: (email: string) => Promise<{ message: string; devToken?: string }>;
    resetPassword: (token: string, email: string, newPassword: string) => Promise<{ message: string }>;
}

