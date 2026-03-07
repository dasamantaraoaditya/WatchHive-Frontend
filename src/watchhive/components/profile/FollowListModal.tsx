import React, { useState, useEffect } from 'react';
import { User } from '../../types/user.types';
import userService from '../../services/userService';
import { Avatar, Button } from '../common';
import { Link } from 'react-router-dom';
import './FollowListModal.css';

interface FollowListModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    type: 'followers' | 'following';
}

export const FollowListModal: React.FC<FollowListModalProps> = ({ isOpen, onClose, userId, type }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen, userId, type]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = type === 'followers'
                ? await userService.getFollowers(userId)
                : await userService.getFollowing(userId);
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="follow-modal-overlay" onClick={onClose}>
            <div className="follow-modal-content" onClick={e => e.stopPropagation()}>
                <div className="follow-modal-header">
                    <h3>{type === 'followers' ? 'Followers' : 'Following'}</h3>
                    <button className="follow-modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="follow-modal-body">
                    {loading ? (
                        <div className="follow-modal-spinner">Loading...</div>
                    ) : users.length === 0 ? (
                        <div className="follow-modal-empty">
                            {type === 'followers' ? 'No followers yet.' : 'Not following anyone.'}
                        </div>
                    ) : (
                        <div className="follow-user-list">
                            {users.map(user => (
                                <Link
                                    key={user.id}
                                    to={`/watch-hive/profile/${user.id}`}
                                    className="follow-user-item"
                                    onClick={onClose}
                                >
                                    <Avatar
                                        src={user.profilePictureUrl}
                                        name={user.displayName || user.username}
                                        size="md"
                                    />
                                    <div className="follow-user-info">
                                        <span className="follow-user-name">{user.displayName || user.username}</span>
                                        <span className="follow-user-handle">@{user.username}</span>
                                    </div>
                                    <Button size="sm" variant="secondary" className="view-profile-btn">
                                        View
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
