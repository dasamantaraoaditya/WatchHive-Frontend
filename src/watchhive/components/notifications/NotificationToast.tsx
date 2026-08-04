import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Notification } from '../../services/notifications.service';
import { useNavigate } from 'react-router-dom';

interface NotificationToastProps {
    toast: {
        id: string;
        notification: Notification;
    } | null;
    onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toast, onClose }) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [toast, onClose]);

    if (!toast) return null;

    const { notification } = toast;
    const actor = notification.content?.actorName || 'Someone';

    const getIcon = () => {
        switch (notification.type) {
            case 'LIKE': return 'favorite';
            case 'COMMENT': return 'chat_bubble';
            case 'REPLY': return 'reply';
            case 'FOLLOW': return 'person_add';
            case 'FOLLOW_REQUEST': return 'person_add';
            case 'FOLLOW_ACCEPT': return 'how_to_reg';
            case 'SUGGESTION': return 'auto_awesome';
            default: return 'notifications';
        }
    };

    const getMessage = () => {
        switch (notification.type) {
            case 'LIKE':
                return `${actor} liked your entry "${notification.content.entryTitle || ''}"`;
            case 'COMMENT':
                return `${actor} commented on "${notification.content.entryTitle || ''}"`;
            case 'REPLY':
                return `${actor} replied to your comment`;
            case 'FOLLOW':
                return `${actor} started following you`;
            case 'FOLLOW_REQUEST':
                return `${actor} requested to follow you`;
            case 'FOLLOW_ACCEPT':
                return `${actor} accepted your follow request`;
            case 'SUGGESTION':
                return `${actor} suggested a title for you`;
            default:
                return `${actor} sent you a notification`;
        }
    };

    const handleClick = () => {
        onClose();
        if (['LIKE', 'COMMENT', 'REPLY'].includes(notification.type)) {
            navigate('/watch-hive/feed');
        } else {
            navigate('/watch-hive/notifications');
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onClick={handleClick}
                className="fixed top-4 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-sm z-50 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border-2 border-[#ffb700] shadow-xl cursor-pointer flex items-center gap-3 group hover:bg-[#FFF9F0] transition-colors"
            >
                <div className="w-10 h-10 rounded-xl bg-[#ffb700]/15 border border-[#ffb700]/30 flex items-center justify-center text-[#ffb700] shrink-0">
                    <span className="material-symbols-outlined text-xl">{getIcon()}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#ffb700]">Real-time Notification</span>
                        <span className="text-[9px] font-bold text-slate-400">Just now</span>
                    </div>
                    <p className="text-xs font-black text-[#2D2926] leading-snug truncate mt-0.5">
                        {getMessage()}
                    </p>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="text-slate-400 hover:text-[#2D2926] p-1 rounded-lg transition-colors shrink-0"
                >
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
            </motion.div>
        </AnimatePresence>
    );
};

export default NotificationToast;
