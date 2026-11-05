import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, UIProvider, CustomAlertProvider, useCustomAlert, TourProvider } from './contexts';
import { Sidebar, QuickAddFAB, BottomNav, TopBar } from './components/layout';
import { DonationButton, OfflineBanner, Modal, AppLoadingScreen, InstallPromptBanner, OpenInAppBanner, SearchMediaModal, QuickCurrentlyWatchingModal } from './components/common';
import { SuggestMovieModal } from './components/suggestions/SuggestMovieModal';
import { WatchPreferencesModal } from './components/onboarding/WatchPreferencesModal';
import { EntryForm } from './components/entries/EntryForm';
import { useWatchlist, WatchlistProvider } from './contexts/WatchlistContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LoginPage, SignupPage, ProfilePage, FeedPage, EntriesPage, LandingPage, SearchUsersPage, UserProfilePage, MindLensPage, NotificationsPage, PrivacyPolicyPage, CinematicStacksPage, ForgotPasswordPage, ResetPasswordPage, MovieDetailsPage, WatchHistoryComparePage, SupportPage, VerifyEmailPage } from './pages';
import { ScrollToTop } from './components/common';
import './index.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <AppLoadingScreen message="Loading your hive..." submessage="Connecting to WatchersHive" />;
    }

    return isAuthenticated ? <>{children}</> : <Navigate to="/watch-hive/login" replace />;
};

// Public Route Component (redirect to feed if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <AppLoadingScreen message="Loading your hive..." submessage="Connecting to WatchersHive" />;
    }

    return !isAuthenticated ? <>{children}</> : <Navigate to="/watch-hive/feed" replace />;
};

// Route redirector for clean/legacy root paths -> /watch-hive/*
const LegacyUrlRedirect: React.FC = () => {
    const location = useLocation();
    return <Navigate to={`/watch-hive${location.pathname}${location.search}`} replace />;
};

// Route redirector for /watchers-hive/* or /watcher-hive/* -> /watch-hive/*
const WatchersHiveRedirect: React.FC = () => {
    const location = useLocation();
    const subpath = location.pathname.replace(/^\/watchers?-hive/, '');
    return <Navigate to={`/watch-hive${subpath}${location.search}`} replace />;
};

// App Routes Component
const AppRoutes: React.FC = () => {
    const { isAuthenticated, user } = useAuth();
    const { alert } = useCustomAlert();
    const { promptAddToWatchlist } = useWatchlist();
    const [activeAction, setActiveAction] = React.useState<'log' | 'watching' | 'watchlist' | 'suggest' | null>(null);
    const [showPreferencesModal, setShowPreferencesModal] = React.useState(false);

    // Auto-prompt onboarding preferences if user is authenticated but has not completed onboarding
    React.useEffect(() => {
        if (isAuthenticated && user) {
            const hasCompleted = user.hasCompletedOnboarding;
            const prefs = user.preferences;
            const hasPrefs = prefs && (
                (prefs.languages && prefs.languages.length > 0) ||
                (prefs.genres && prefs.genres.length > 0) ||
                (prefs.streamingPlatforms && prefs.streamingPlatforms.length > 0)
            );
            const promptedSession = sessionStorage.getItem(`watchhive_pref_prompted_${user.id}`);
            if (!hasCompleted && !hasPrefs && !promptedSession) {
                setShowPreferencesModal(true);
                sessionStorage.setItem(`watchhive_pref_prompted_${user.id}`, 'true');
            }
        }
    }, [isAuthenticated, user]);

    // Global event listener to open preferences from anywhere (e.g. ProfilePage)
    React.useEffect(() => {
        const handleOpenPrefs = () => setShowPreferencesModal(true);
        window.addEventListener('watchhive:open-preferences', handleOpenPrefs);
        return () => window.removeEventListener('watchhive:open-preferences', handleOpenPrefs);
    }, []);

    React.useEffect(() => {
        const handleOpenQuickAdd = (e: Event) => {
            const customEvent = e as CustomEvent<{ action: 'log' | 'watching' | 'watchlist' | 'suggest' }>;
            if (customEvent.detail?.action) {
                setActiveAction(customEvent.detail.action);
            }
        };
        window.addEventListener('watchhive:open-quick-add', handleOpenQuickAdd);
        return () => window.removeEventListener('watchhive:open-quick-add', handleOpenQuickAdd);
    }, []);

    const closeAll = () => {
        setActiveAction(null);
    };

    const handleSearchSelect = async (tmdbId: number, mediaType: 'movie' | 'tv') => {
        if (activeAction === 'watchlist') {
            promptAddToWatchlist({ tmdbId, mediaType });
            closeAll();
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#FFF9F0]">
            <OpenInAppBanner />
            <div className="app-layout flex-1">
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
                <Route
                    path="/watch-hive/verify-email"
                    element={<VerifyEmailPage />}
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
                    path="/watch-hive/compare/:targetUserId"
                    element={
                        <ProtectedRoute>
                            <WatchHistoryComparePage />
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
                <Route path="/watch-hive/suggestions" element={<Navigate to="/watch-hive/entries?tab=suggestions" replace />} />
                <Route path="/watch-hive/watchlist" element={<Navigate to="/watch-hive/entries?tab=watchlist" replace />} />
                <Route path="/watch-hive/entry/:entryId" element={<Navigate to="/watch-hive/feed" replace />} />

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
                <Route
                    path="/watch-hive/support"
                    element={<SupportPage />}
                />

                {/* Clean Root / Deep Link Redirect Aliases */}
                <Route path="/signup" element={<LegacyUrlRedirect />} />
                <Route path="/login" element={<LegacyUrlRedirect />} />
                <Route path="/verify-email" element={<LegacyUrlRedirect />} />
                <Route path="/privacy" element={<LegacyUrlRedirect />} />
                <Route path="/support" element={<LegacyUrlRedirect />} />
                <Route path="/feed" element={<LegacyUrlRedirect />} />
                <Route path="/rankings" element={<LegacyUrlRedirect />} />
                <Route path="/details/:mediaType/:tmdbId" element={<LegacyUrlRedirect />} />
                <Route path="/profile/:id" element={<LegacyUrlRedirect />} />

                {/* WatchersHive / WatcherHive path aliases */}
                <Route path="/watchers-hive" element={<Navigate to="/watch-hive/feed" replace />} />
                <Route path="/watchers-hive/*" element={<WatchersHiveRedirect />} />
                <Route path="/watcher-hive" element={<Navigate to="/watch-hive/feed" replace />} />
                <Route path="/watcher-hive/*" element={<WatchersHiveRedirect />} />

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
                            isOpen={activeAction === 'watchlist'}
                            onClose={closeAll}
                            title="Add to Watchlist"
                            onSelect={handleSearchSelect}
                        />

                        <SuggestMovieModal
                            isOpen={activeAction === 'suggest'}
                            onClose={closeAll}
                            onSuccess={() => {
                                closeAll();
                                alert('Suggestion sent successfully to your hive!', {
                                    title: 'Suggestion Sent',
                                    severity: 'success',
                                });
                            }}
                        />

                        {/* Watch Preferences Onboarding / Customization Modal */}
                        <WatchPreferencesModal
                            isOpen={showPreferencesModal}
                            onClose={() => setShowPreferencesModal(false)}
                            isEditing={Boolean(user?.hasCompletedOnboarding || (user?.preferences && Object.keys(user.preferences).length > 0))}
                        />
                    </>
                )}

                {isAuthenticated && <BottomNav />}

                <DonationButton />
            </main>
            </div>
            <OfflineBanner />
            <InstallPromptBanner />
        </div>
    );
};

// Main WatchHive App Component
export const WatchHiveApp: React.FC = () => {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <UIProvider>
                <AuthProvider>
                    <NotificationProvider>
                        <WatchlistProvider>
                            <CustomAlertProvider>
                                <TourProvider>
                                    <AppRoutes />
                                </TourProvider>
                            </CustomAlertProvider>
                        </WatchlistProvider>
                    </NotificationProvider>
                </AuthProvider>
            </UIProvider>
        </BrowserRouter>
    );
};

export default WatchHiveApp;
