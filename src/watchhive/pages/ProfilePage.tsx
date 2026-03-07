import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts';
import { userService } from '../services';
import { Avatar, Card, Button } from '../components/common';
import { FollowListModal, WatchlistGrid } from '../components/profile';
import './ProfilePage.css';

export const ProfilePage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [stats, setStats] = useState<{ followersCount: number; followingCount: number } | null>(null);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; type: 'followers' | 'following' }>({ isOpen: false, type: 'followers' });

    useEffect(() => {
        if (user) {
            userService.getFollowStats(user.id).then(setStats).catch(console.error);
        }
    }, [user?.id]);

    if (!user) {
        return null;
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (5 MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be smaller than 5 MB');
            return;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            setError('Only JPEG, PNG, WebP, and GIF images are allowed');
            return;
        }

        setError(null);
        setSuccessMsg(null);
        setUploading(true);

        try {
            const updatedUser = await userService.uploadAvatar(file);
            // Update the auth context with new profile picture
            updateUser({
                ...user,
                profilePictureUrl: updatedUser.profilePictureUrl,
            });
            setSuccessMsg('Profile picture updated!');
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to upload image');
        } finally {
            setUploading(false);
            // Reset the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveAvatar = async () => {
        setError(null);
        setSuccessMsg(null);
        setUploading(true);

        try {
            await userService.deleteAvatar();
            updateUser({
                ...user,
                profilePictureUrl: null,
            });
            setSuccessMsg('Profile picture removed');
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to remove picture');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="profile-page">
            <div className="container">
                <div className="profile-page__header">
                    <h1>Profile</h1>
                </div>

                <div className="profile-page__content">
                    <Card variant="glass" className="profile-card">
                        <div className="profile-banner"></div>
                        <div className="profile-card__header">
                            <div className="profile-avatar-section">
                                <div className="profile-avatar-wrapper">
                                    <Avatar
                                        src={user.profilePictureUrl}
                                        name={user.displayName || user.username}
                                        size="xl"
                                        showBorder
                                        onClick={handleAvatarClick}
                                    />
                                    <div className="profile-avatar-overlay" onClick={handleAvatarClick}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                            <circle cx="12" cy="13" r="4" />
                                        </svg>
                                        <span>{uploading ? 'Uploading...' : 'Change'}</span>
                                    </div>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={handleFileChange}
                                    className="profile-avatar-input"
                                    aria-label="Upload profile picture"
                                />

                                <div className="profile-avatar-actions">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleAvatarClick}
                                        disabled={uploading}
                                    >
                                        {uploading ? 'Uploading...' : 'Upload Photo'}
                                    </Button>
                                    {user.profilePictureUrl && (
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={handleRemoveAvatar}
                                            disabled={uploading}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="profile-info">
                                <h2>{user.displayName || user.username}</h2>
                                <p className="profile-username">@{user.username}</p>
                                {stats && (
                                    <div className="profile-stats">
                                        <div className="stat-item" onClick={() => setModalConfig({ isOpen: true, type: 'followers' })}>
                                            <b>{stats.followersCount}</b>
                                            <span>Followers</span>
                                        </div>
                                        <div className="stat-item" onClick={() => setModalConfig({ isOpen: true, type: 'following' })}>
                                            <b>{stats.followingCount}</b>
                                            <span>Following</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {(error || successMsg) && (
                            <div className={`profile-alert ${error ? 'profile-alert--error' : 'profile-alert--success'}`}>
                                {error || successMsg}
                            </div>
                        )}

                        <div className="profile-card__body">
                            <div className="profile-field">
                                <label>Email</label>
                                <p>{user.email}</p>
                            </div>
                        </div>
                    </Card>

                    <div className="profile-page__section mt-8">
                        <h2>
                            <span>🔖</span> My Watchlist
                        </h2>
                        <WatchlistGrid />
                    </div>
                </div>
            </div>
            {user && (
                <FollowListModal
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                    userId={user.id}
                    type={modalConfig.type}
                />
            )}
        </div>
    );
};

export default ProfilePage;
