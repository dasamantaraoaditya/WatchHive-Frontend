import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, UIProvider, CustomAlertProvider, TourProvider } from './contexts';
import { Sidebar, QuickAddFAB, BottomNav, TopBar } from './components/layout';
import { DonationButton, OfflineBanner, Modal, BeeLoader, InstallPromptBanner, SearchMediaModal, MovieDetailsModal, QuickCurrentlyWatchingModal } from './components/common';
import { EntryForm } from './components/entries/EntryForm';
import { useWatchlist, WatchlistProvider } from './contexts/WatchlistContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LoginPage, SignupPage, ProfilePage, FeedPage, EntriesPage, LandingPage, SearchUsersPage, UserProfilePage, MindLensPage, NotificationsPage, PrivacyPolicyPage, CinematicStacksPage, ForgotPasswordPage, ResetPasswordPage, MovieDetailsPage } from './pages';
import { ScrollToTop } from './components/common';
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
    const { addToList } = useWatchlist();
    const [activeAction, setActiveAction] = React.useState<'log' | 'watching' | 'watchlist' | 'suggest' | null>(null);
    const [selectedMedia, setSelectedMedia] = React.useState<{ tmdbId: number; mediaType: 'movie' | 'tv' } | null>(null);

    const closeAll = () => {
        setActiveAction(null);
        setSelectedMedia(null);
    };

    const handleSearchSelect = async (tmdbId: number, mediaType: 'movie' | 'tv') => {
        if (activeAction === 'watchlist') {
            await addToList(tmdbId, mediaType);
            closeAll();
        } else if (activeAction === 'suggest') {
            setSelectedMedia({ tmdbId, mediaType });
        }
    };

    return (
        <div className="app-layout">
            <OfflineBanner />
            <InstallPromptBanner />
            {isAuthenticated && <Sidebar />}
            {/* Main content area needs to be pushed to the right to accommodate the 256px wide fixed sidebar */}
            <main className={`app-main ${isAuthenticated ? 'app-main--with-sidebar' : ''}`}>
                {isAuthenticated && <TopBar />}
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

                <Route
                    path="/watch-hive/forgot-password"
                    element={<ForgotPasswordPage />}
                />
                <Route
                    path="/watch-hive/reset-password"
                    element={<ResetPasswordPage />}
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
                <Route
                    path="/watch-hive/details/:mediaType/:tmdbId"
                    element={
                        <ProtectedRoute>
                            <MovieDetailsPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="/watch-hive/suggestions" element={<Navigate to="/watch-hive/entries" state={{ activeTab: 'suggestions' }} replace />} />

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
                        <QuickAddFAB 
                            onLogWatch={() => setActiveAction('log')}
                            onCurrentlyWatching={() => setActiveAction('watching')}
                            onWatchlist={() => setActiveAction('watchlist')}
                            onSuggest={() => setActiveAction('suggest')}
                        />

                        {/* Modals for Quick Actions */}
                        
                        <Modal
                            isOpen={activeAction === 'log'}
                            onClose={closeAll}
                            title="Log your latest watch"
                            maxWidth="max-w-4xl"
                        >
                            <EntryForm
                                onSuccess={closeAll}
                                onCancel={closeAll}
                                isModal={true}
                            />
                        </Modal>

                        <QuickCurrentlyWatchingModal
                            isOpen={activeAction === 'watching'}
                            onClose={closeAll}
                            onSuccess={closeAll}
                        />

                        <SearchMediaModal
                            isOpen={(activeAction === 'watchlist' || activeAction === 'suggest') && !selectedMedia}
                            onClose={closeAll}
                            title={activeAction === 'watchlist' ? 'Add to Watchlist' : 'Suggest to a Friend'}
                            onSelect={handleSearchSelect}
                        />

                        {selectedMedia && activeAction === 'suggest' && (
                            <MovieDetailsModal
                                isOpen={true}
                                onClose={closeAll}
                                tmdbId={selectedMedia.tmdbId}
                                mediaType={selectedMedia.mediaType}
                                initialView="suggest"
                            />
                        )}
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
            <ScrollToTop />
            <AuthProvider>
                <NotificationProvider>
                    <WatchlistProvider>
                        <CustomAlertProvider>
                            <UIProvider>
                                <TourProvider>
                                    <AppRoutes />
                                </TourProvider>
                            </UIProvider>
                        </CustomAlertProvider>
                    </WatchlistProvider>
                </NotificationProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default WatchHiveApp;
