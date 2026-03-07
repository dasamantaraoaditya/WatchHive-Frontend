// Authentication related types
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
    user: {
        id: string;
        username: string;
        email: string;
        displayName: string | null;
        profilePictureUrl: string | null;
    };
    accessToken: string;
    refreshToken: string;
    isNewUser?: boolean;
}

export interface AuthContextType {
    user: AuthResponse['user'] | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    googleLogin: (idToken: string) => Promise<void>;
    logout: () => void;
    updateUser: (user: AuthResponse['user']) => void;
}
