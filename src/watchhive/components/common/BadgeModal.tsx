import React from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '../../types';
import './BadgeModal.css';

interface BadgeModalProps {
    isOpen: boolean;
    onClose: () => void;
    userBadges: Badge[];
}

const ALL_BADGES = [
    { id: 'pioneer', name: 'Start-up', description: 'Log your first watch entry', icon: 'rocket' },
    { id: 'cinephile', name: 'Movie Buff', description: 'Log 10 movies', icon: 'movie' },
    { id: 'binge_master', name: 'Series Seeker', description: 'Log 10 TV show entries', icon: 'tv' },
    { id: 'social_bee', name: 'Buzz Maker', description: 'Receive 10 likes', icon: 'hive' },
    { id: 'critic', name: 'Log Review', description: 'Write 5 reviews', icon: 'edit_note' }
];

export const BadgeModal: React.FC<BadgeModalProps> = ({ isOpen, onClose, userBadges }) => {
    if (!isOpen) return null;

    const earnedBadgeIds = new Set(userBadges.map(b => b.id));

    const modalContent = (
        <div className="wh-badge-modal">
            <div className="wh-badge-modal__container" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="wh-badge-modal__header">
                    <div>
                        <h2 className="wh-badge-modal__title">Badge Collection</h2>
                        <p className="wh-badge-modal__subtitle">Unlock milestones to grow the hive</p>
                    </div>
                    <button onClick={onClose} className="wh-badge-modal__close">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="wh-badge-modal__content">
                    <div className="wh-badge-grid">
                        {ALL_BADGES.map((badge) => {
                            const isEarned = earnedBadgeIds.has(badge.id);
                            const earnedInfo = userBadges.find(b => b.id === badge.id);

                            return (
                                <div 
                                    key={badge.id}
                                    className={`wh-badge-item ${isEarned ? 'wh-badge-item--earned' : 'wh-badge-item--locked'}`}
                                >
                                    <div className={`wh-badge-item__icon-box ${isEarned ? 'wh-badge-item__icon-box--earned' : 'wh-badge-item__icon-box--locked'}`}>
                                        <span className="material-symbols-outlined">
                                            {isEarned ? badge.icon : 'lock_open'}
                                        </span>
                                    </div>

                                    <div className="wh-badge-item__details">
                                        <div className="wh-badge-item__header">
                                            <h3 className={`wh-badge-item__name ${!isEarned ? 'wh-badge-item__name--locked' : ''}`}>
                                                {badge.name}
                                            </h3>
                                            {isEarned && earnedInfo && (
                                                <span className="wh-badge-item__tag">EARNED</span>
                                            )}
                                        </div>
                                        <p className={`wh-badge-item__description ${!isEarned ? 'wh-badge-item__description--locked' : ''}`}>
                                            {badge.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="wh-badge-modal__footer">
                    <p className="wh-badge-modal__footer-text">Higher Levels Unlock Secret Badges • Keep Streaming</p>
                </div>
            </div>
            {/* Backdrop close */}
            <div className="wh-badge-modal__backdrop" onClick={onClose} />
        </div>
    );

    return createPortal(modalContent, document.body);
};
