import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services';
import { AuthContextType, LoginCredentials, RegisterData, AuthResponse } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthResponse['user'] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const checkAuth = () => {
            const isAuth = authService.isAuthenticated();
            if (!isAuth) {
                setIsLoading(false);
                return;
            }

            // If we have a token, we consider the user authenticated
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        try {
            const response = await authService.login(credentials);
            setUser(response.user);
            localStorage.setItem('user', JSON.stringify(response.user));
        } catch (error) {
            throw error;
        }
    };

    const register = async (data: RegisterData) => {
        try {
            const response = await authService.register(data);
            setUser(response.user);
            localStorage.setItem('user', JSON.stringify(response.user));
        } catch (error) {
            throw error;
        }
    };

    const googleLogin = async (idToken: string) => {
        try {
            const response = await authService.googleLogin(idToken);
            setUser(response.user);
            localStorage.setItem('user', JSON.stringify(response.user));
        } catch (error) {
            throw error;
        }
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

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
        updateUser,
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
