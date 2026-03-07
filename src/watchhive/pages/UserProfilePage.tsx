import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from '../types/user.types';
import userService from '../services/userService';
import EntryList from '../components/entries/EntryList';
import { Avatar, Button, Card } from '../components/common';
import { FollowListModal } from '../components/profile/FollowListModal';
import { useAuth } from '../contexts';
import './ProfilePage.css';

export const UserProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; type: 'followers' | 'following' }>({ isOpen: false, type: 'followers' });

    useEffect(() => {
        if (!id) return;
        if (currentUser && id === currentUser.id) {
            navigate('/profile');
            return;
        }

        const fetchUser = async () => {
            setLoading(true);
            try {
                const data = await userService.getUser(id);
                setProfileUser(data);
            } catch (err) {
                console.error(err);
                setError('User not found');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id, currentUser, navigate]);

    const handleFollowToggle = async () => {
        if (!profileUser) return;

        // Optimistic update
        const originalStatus = profileUser.isFollowing;
        setProfileUser(prev => prev ? ({ ...prev, isFollowing: !prev.isFollowing }) : null);

        try {
            if (originalStatus) {
                await userService.unfollowUser(profileUser.id);
            } else {
                await userService.followUser(profileUser.id);
            }
        } catch (err) {
            // Revert on error
            setProfileUser(prev => prev ? ({ ...prev, isFollowing: originalStatus }) : null);
            console.error('Failed to toggle follow');
        }
    };

    if (loading) return <div className="container p-8">Loading...</div>;
    if (error || !profileUser) return <div className="container p-8 text-error">{error || 'User not found'}</div>;

    const isPrivate = profileUser.isPrivate;
    // canView logic: if public, or if following, or if self (handled by redirect but just in case)
    const canViewEntries = !isPrivate || profileUser.isFollowing || (currentUser?.id === profileUser.id);

    return (
        <div className="profile-page">
            <div className="container">
                <div className="profile-page__header mb-8">
                    <Card className="profile-card">
                        <div className="profile-banner"></div>
                        <div className="profile-card__header">
                            <div className="profile-avatar-section">
                                <div className="profile-avatar-wrapper">
                                    <Avatar
                                        src={profileUser.profilePictureUrl}
                                        name={profileUser.displayName || profileUser.username}
                                        size="xl"
                                        showBorder
                                    />
                                </div>
                            </div>

                            <div className="profile-info">
                                <h2>{profileUser.displayName || profileUser.username}</h2>
                                <p className="profile-username">@{profileUser.username}</p>
                                {profileUser.bio && <p className="mt-2 text-primary">{profileUser.bio}</p>}

                                {profileUser._count && (
                                    <div className="profile-stats">
                                        <div className="stat-item" onClick={() => setModalConfig({ isOpen: true, type: 'followers' })}>
                                            <b>{profileUser._count.followers}</b>
                                            <span>Followers</span>
                                        </div>
                                        <div className="stat-item" onClick={() => setModalConfig({ isOpen: true, type: 'following' })}>
                                            <b>{profileUser._count.following}</b>
                                            <span>Following</span>
                                        </div>
                                        <div className="stat-item">
                                            <b>{profileUser._count.entries}</b>
                                            <span>Entries</span>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4">
                                    <Button
                                        variant={profileUser.isFollowing ? 'secondary' : 'primary'}
                                        onClick={handleFollowToggle}
                                    >
                                        {profileUser.isFollowing ? 'Unfollow' : 'Follow'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="profile-content">
                    {canViewEntries ? (
                        <div className="entries-section">
                            <h3 className="text-xl font-bold mb-4">Entries</h3>
                            <EntryList filters={{ userId: profileUser.id }} readOnly />
                        </div>
                    ) : (
                        <Card className="private-message-card p-12 text-center">
                            <div className="flex flex-col items-center">
                                <span className="text-4xl mb-4">🔒</span>
                                <h3 className="text-xl font-bold">This Account is Private</h3>
                                <p className="text-secondary mt-2">Follow this user to see their entries and activity.</p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
            {profileUser && (
                <FollowListModal
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                    userId={profileUser.id}
                    type={modalConfig.type}
                />
            )}
        </div>
    );
};

export default UserProfilePage;
