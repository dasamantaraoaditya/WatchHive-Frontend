import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationList from './NotificationList';
import './NotificationBell.css';

const NotificationBell: React.FC = () => {
    const { unreadCount } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    const toggleDropdown = () => setIsOpen(!isOpen);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="notification-bell-container" ref={bellRef}>
            <button
                className={`notification-bell-button ${isOpen ? 'active' : ''}`}
                onClick={toggleDropdown}
                aria-label="Toggle notifications"
            >
                <span className="bell-icon">🔔</span>
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <NotificationList onClose={() => setIsOpen(false)} />
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
