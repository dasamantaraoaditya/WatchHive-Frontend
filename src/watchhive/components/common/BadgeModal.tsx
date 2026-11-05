import React from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '../../types';
import './BadgeModal.css';

interface BadgeModalProps {
    isOpen: boolean;
    onClose: () => void;
    userBadges: Badge[];
    watchStreak?: number;
    userName?: string;
}

export const HONEY_BADGES = [
    { id: 'pioneer', name: 'First Log', description: 'Log your first watch', icon: 'play_circle', emoji: '🎬' },
    { id: 'century_watcher', name: 'Century Watcher', description: 'Log your 100th watch', icon: 'military_tech', emoji: '💯' },
    { id: 'suggestion_starter', name: 'Suggestion Starter', description: 'Complete 1 suggestion', icon: 'recommend', emoji: '🤝' },
    { id: 'suggestion_veteran', name: 'Suggestion Veteran', description: 'Complete 100 suggestions', icon: 'stars', emoji: '🌟' },
    { id: 'streak_10', name: 'Serious Watcher', description: '10 days watching streak', icon: 'local_fire_department', emoji: '🔥' },
    { id: 'streak_20', name: 'Jobless', description: '20 days watching streak', icon: 'whatshot', emoji: '🌋' },
    { id: 'streak_30', name: 'Maniac', description: '30 days watching streak', icon: 'bolt', emoji: '⚡' },
];

export const BadgeModal: React.FC<BadgeModalProps> = ({
    isOpen,
    onClose,
    userBadges = [],
    watchStreak = 0,
    userName
}) => {
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.setAttribute('data-modal-open', 'true');
        } else {
            document.body.style.overflow = 'unset';
            document.body.removeAttribute('data-modal-open');
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.removeAttribute('data-modal-open');
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Set of earned IDs (also treat 'first_log' as alias of 'pioneer')
    const earnedBadgeIds = new Set(userBadges.map(b => b.id));
    if (earnedBadgeIds.has('first_log')) {
        earnedBadgeIds.add('pioneer');
    }

    // Merge standard Honey Badges with any additional unique badges earned by user
    const standardIds = new Set(HONEY_BADGES.map(b => b.id));
    const extraEarnedBadges = userBadges.filter(b => !standardIds.has(b.id) && b.id !== 'first_log');

    const allDisplayBadges = [
        ...HONEY_BADGES,
        ...extraEarnedBadges.map(b => ({
            id: b.id,
            name: b.name,
            description: b.description,
            icon: b.icon || 'military_tech',
            emoji: b.emoji || '🎖️'
        }))
    ];

    const earnedCount = allDisplayBadges.filter(b => earnedBadgeIds.has(b.id)).length;

    const modalContent = (
        <div 
            role="dialog"
            aria-modal="true"
            data-modal-open="true"
            className="wh-badge-modal"
            onClick={onClose}
        >
            <div className="wh-badge-modal__container" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="wh-badge-modal__header">
                    <div>
                        <h2 className="wh-badge-modal__title">{userName ? `${userName}'s Badges` : 'Honey Level Badges'}</h2>
                        <p className="wh-badge-modal__subtitle">
                            {earnedCount} of {allDisplayBadges.length} UNLOCKED
                        </p>
                    </div>
                    <button onClick={onClose} className="wh-badge-modal__close" aria-label="Close">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Streak Banner if active */}
                {watchStreak > 0 && (
                    <div className="wh-badge-modal__streak-banner">
                        <span className="wh-badge-modal__streak-icon">🔥</span>
                        <div className="wh-badge-modal__streak-text">
                            <strong>{watchStreak} {watchStreak === 1 ? 'Day' : 'Days'} Watch Streak!</strong>
                            <span>Keep streaming daily to level up your streak</span>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="wh-badge-modal__content">
                    <div className="wh-badge-grid">
                        {allDisplayBadges.map((badge) => {
                            const isEarned = earnedBadgeIds.has(badge.id);
                            const earnedInfo = userBadges.find(b => b.id === badge.id || (badge.id === 'pioneer' && b.id === 'first_log'));

                            return (
                                <div 
                                    key={badge.id}
                                    className={`wh-badge-item ${isEarned ? 'wh-badge-item--earned' : 'wh-badge-item--locked'}`}
                                >
                                    <div className={`wh-badge-item__icon-box ${isEarned ? 'wh-badge-item__icon-box--earned' : 'wh-badge-item__icon-box--locked'}`}>
                                        {isEarned ? (
                                            <span className="wh-badge-item__emoji">{badge.emoji}</span>
                                        ) : (
                                            <span className="material-symbols-outlined">lock</span>
                                        )}
                                    </div>

                                    <div className="wh-badge-item__details">
                                        <div className="wh-badge-item__header">
                                            <h3 className={`wh-badge-item__name ${!isEarned ? 'wh-badge-item__name--locked' : ''}`}>
                                                {badge.name}
                                            </h3>
                                            {isEarned && (
                                                <span className="wh-badge-item__tag">EARNED</span>
                                            )}
                                        </div>
                                        <p className={`wh-badge-item__description ${!isEarned ? 'wh-badge-item__description--locked' : ''}`}>
                                            {badge.description}
                                        </p>
                                        {isEarned && earnedInfo?.unlockedAt && (
                                            <span className="wh-badge-item__date">
                                                Unlocked {new Date(earnedInfo.unlockedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="wh-badge-modal__footer">
                    <p className="wh-badge-modal__footer-text">Honey Levels • Stream Daily to Grow Your Hive</p>
                </div>
            </div>
            {/* Backdrop close */}
            <div className="wh-badge-modal__backdrop" onClick={onClose} />
        </div>
    );

    return createPortal(modalContent, document.body);
};
