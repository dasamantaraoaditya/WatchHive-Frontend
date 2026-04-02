import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts';
import { Sidebar, QuickAddFAB, BottomNav } from './components/layout';
import { DonationButton, OfflineBanner, Modal, BeeLoader, InstallPromptBanner } from './components/common';
import { EntryForm } from './components/entries/EntryForm';
import { WatchlistProvider } from './contexts/WatchlistContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LoginPage, SignupPage, ProfilePage, FeedPage, EntriesPage, LandingPage, SearchUsersPage, UserProfilePage, MindLensPage, NotificationsPage, PrivacyPolicyPage, CinematicStacksPage } from './pages';
import './index.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="loading-screen">
                <BeeLoader size="large" message="Loading your hive..." />
            </div>
        );
    }

    return isAuthenticated ? <>{children}</> : <Navigate to="/watch-hive/login" replace />;
};

// Public Route Component (redirect to feed if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="loading-screen">
                <BeeLoader size="large" message="Loading your hive..." />
            </div>
        );
    }

    return !isAuthenticated ? <>{children}</> : <Navigate to="/watch-hive/feed" replace />;
};

// App Routes Component
const AppRoutes: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [isQuickAddOpen, setIsQuickAddOpen] = React.useState(false);

    return (
        <div className="app-layout">
            <OfflineBanner />
            <InstallPromptBanner />
            {isAuthenticated && <Sidebar />}
            {/* Main content area needs to be pushed to the right to accommodate the 256px wide fixed sidebar */}
            <main className={`app-main ${isAuthenticated ? 'app-main--with-sidebar' : ''}`}>
                <Routes>
                {/* Public Routes */}
                <Route
                    path="/watch-hive/login"
                    element={
                        <PublicRoute>
                            <LoginPage />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/watch-hive/signup"
                    element={
                        <PublicRoute>
                            <SignupPage />
                        </PublicRoute>
                    }
                />

                {/* Protected Routes */}
                <Route
                    path="/watch-hive/feed"
                    element={
                        <ProtectedRoute>
                            <FeedPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/watch-hive/entries"
                    element={
                        <ProtectedRoute>
                            <EntriesPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/watch-hive/profile"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/watch-hive/profile/:id"
                    element={
                        <ProtectedRoute>
                            <UserProfilePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/watch-hive/search"
                    element={
                        <ProtectedRoute>
                            <SearchUsersPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/watch-hive/mindlens"
                    element={
                        <ProtectedRoute>
                            <MindLensPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/watch-hive/rankings"
                    element={
                        <ProtectedRoute>
                            <CinematicStacksPage />
                        </ProtectedRoute>
                    }
                />
                {/* Backward compat redirect */}
                <Route path="/watch-hive/stacks" element={<Navigate to="/watch-hive/rankings" replace />} />

                <Route
                    path="/watch-hive/notifications"
                    element={
                        <ProtectedRoute>
                            <NotificationsPage />
                        </ProtectedRoute>
                    }
                />

                {/* Landing Page — shown to unauthenticated visitors */}
                <Route
                    path="/watch-hive"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/watch-hive/feed" replace />
                        ) : (
                            <LandingPage />
                        )
                    }
                />

                <Route
                    path="/watch-hive/privacy"
                    element={<PrivacyPolicyPage />}
                />

                {/* Default Redirect */}
                <Route path="*" element={<Navigate to="/watch-hive" replace />} />
            </Routes>
                
                {isAuthenticated && (
                    <>
                        <QuickAddFAB onClick={() => setIsQuickAddOpen(true)} />

                        <Modal
                            isOpen={isQuickAddOpen}
                            onClose={() => setIsQuickAddOpen(false)}
                            title="Log your latest watch"
                        >
                            <EntryForm
                                onSuccess={() => setIsQuickAddOpen(false)}
                                onCancel={() => setIsQuickAddOpen(false)}
                                isModal={true}
                            />
                        </Modal>
                    </>
                )}

                {isAuthenticated && <BottomNav />}

                <DonationButton />
            </main>
        </div>
    );
};

// Main WatchHive App Component
export const WatchHiveApp: React.FC = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <NotificationProvider>
                    <WatchlistProvider>
                        <AppRoutes />
                    </WatchlistProvider>
                </NotificationProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default WatchHiveApp;
