import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, userService } from '../services';
import { AuthContextType, LoginCredentials, RegisterData, AuthResponse } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthResponse['user'] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const checkAuth = async () => {
            const isAuth = authService.isAuthenticated();
            if (!isAuth) {
                setIsLoading(false);
                return;
            }

            try {
                // Always sync with backend on load to get fresh stats/data (including hasGoogleLinked/hasPassword)
                const freshUser = await userService.getMe();
                setUser(freshUser);
                localStorage.setItem('user', JSON.stringify(freshUser));
            } catch (error) {
                console.error('Failed to sync user data on load', error);
                // Fallback to stored user if API fails
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        const response = await authService.login(credentials);
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
    };

    const register = async (data: RegisterData) => {
        return authService.register(data);
    };

    const verifyEmail = async (token: string, email?: string) => {
        const response = await authService.verifyEmail(token, email);
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response;
    };

    const resendVerification = async (email: string) => {
        return authService.resendVerification(email);
    };

    const googleLogin = async (idToken: string) => {
        const response = await authService.googleLogin(idToken);
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        localStorage.removeItem('user');
    };

    const updateUser = (updatedUser: AuthResponse['user']) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    /** Set a backup password on a Google-only account */
    const setPassword = async (newPassword: string) => {
        const result = await authService.setPassword(newPassword);
        // Refresh user data to update hasPassword flag
        try {
            const freshUser = await userService.getMe();
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
        } catch {
            // Best-effort refresh; if it fails the user can reload
        }
        return result;
    };

    /** Request a password reset email */
    const forgotPassword = async (email: string) => {
        return authService.forgotPassword(email);
    };

    /** Complete a password reset using the token from the reset link */
    const resetPassword = async (token: string, email: string, newPassword: string) => {
        return authService.resetPassword(token, email, newPassword);
    };

    /** Request a passwordless 6-digit sign-in code */
    const requestEmailOtp = async (email: string) => {
        return authService.requestEmailOtp(email);
    };

    /** Verify passwordless 6-digit code and authenticate */
    const verifyEmailOtp = async (email: string, code: string) => {
        const response = await authService.verifyEmailOtp(email, code);
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response;
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        verifyEmail,
        resendVerification,
        googleLogin,
        logout,
        updateUser,
        setPassword,
        forgotPassword,
        resetPassword,
        requestEmailOtp,
        verifyEmailOtp,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
