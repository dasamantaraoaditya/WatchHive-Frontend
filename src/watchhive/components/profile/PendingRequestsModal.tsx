import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import followsService from '../../services/follows.service';
import { Avatar, BeeLoader } from '../common';
import { useCustomAlert } from '../../contexts';

interface PendingRequestsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRequestsUpdated?: () => void;
}

interface PendingRequest {
    id: string; // follow request ID
    senderId: string;
    recipientId: string;
    status: string;
    createdAt: string;
    sender: {
        id: string;
        username: string;
        displayName: string | null;
        profilePictureUrl: string | null;
    };
    actionState?: 'accepting' | 'rejecting' | 'accepted' | 'rejected';
}

export const PendingRequestsModal: React.FC<PendingRequestsModalProps> = ({ isOpen, onClose, onRequestsUpdated }) => {
    const [requests, setRequests] = useState<PendingRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasHadRequests, setHasHadRequests] = useState(false);
    const { alert } = useCustomAlert();

    useEffect(() => {
        if (isOpen) {
            setHasHadRequests(false);
            fetchRequests();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Auto-close modal 1.5s after user finishes resolving all pending requests
    useEffect(() => {
        if (isOpen && hasHadRequests && requests.length === 0 && !loading) {
            const timer = setTimeout(() => {
                onClose();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [requests.length, hasHadRequests, isOpen, loading, onClose]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await followsService.getPendingRequests();
            setRequests(data);
            if (data && data.length > 0) {
                setHasHadRequests(true);
            }
        } catch (error) {
            console.error('Failed to fetch pending requests', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requestId: string) => {
        // Optimistic UI state
        setRequests(prev => prev.map(req => 
            req.id === requestId ? { ...req, actionState: 'accepted' } : req
        ));
        
        try {
            await followsService.acceptRequest(requestId);
            if (onRequestsUpdated) onRequestsUpdated();
            
            await alert("You have accepted the follow request!", { title: "Request Approved", severity: "success" });
            
            // Remove after brief delay for visual feedback
            setTimeout(() => {
                setRequests(prev => prev.filter(req => req.id !== requestId));
            }, 800);
        } catch (error) {
            console.error('Failed to accept request', error);
            // Revert on error
            setRequests(prev => prev.map(req => 
                req.id === requestId ? { ...req, actionState: undefined } : req
            ));
        }
    };

    const handleReject = async (requestId: string) => {
        // Optimistic UI state
        setRequests(prev => prev.map(req => 
            req.id === requestId ? { ...req, actionState: 'rejected' } : req
        ));
        
        try {
            await followsService.rejectRequest(requestId);
            if (onRequestsUpdated) onRequestsUpdated();
            
            await alert("You have declined the follow request.", { title: "Request Declined", severity: "warning" });
            
            // Remove after brief delay for visual feedback
            setTimeout(() => {
                setRequests(prev => prev.filter(req => req.id !== requestId));
            }, 800);
        } catch (error) {
            console.error('Failed to reject request', error);
            // Revert on error
            setRequests(prev => prev.map(req => 
                req.id === requestId ? { ...req, actionState: undefined } : req
            ));
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-[#2D2926]/40"
                />

                {/* Modal Container */}
                <motion.div 
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 270 }}
                    className="bg-[#FFF9F0] w-full max-w-md max-h-[80vh] rounded-[36px] shadow-2xl flex flex-col overflow-hidden border border-[#ffb700]/15 relative z-10" 
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-[#ffb700]/10 bg-white">
                        <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-[#ffb700] text-xl font-bold">lock_person</span>
                            <h3 className="text-lg font-black text-[#2D2926] tracking-tight">
                                Follow Requests
                            </h3>
                        </div>
                        <button 
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#ffb700]/10 text-[#ffb700] hover:bg-[#ffb700] hover:text-white transition-all transform hover:rotate-90 active:scale-95 cursor-pointer"
                            onClick={onClose}
                            title="Close"
                        >
                            <span className="material-symbols-outlined text-[18px] font-bold">close</span>
                        </button>
                    </div>
                    
                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-4 bg-[#FFF9F0]/40 no-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-14">
                                <BeeLoader size="small" message="Fetching requests..." />
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-3.5">
                                <div className="w-16 h-16 rounded-full bg-[#ffb700]/10 flex items-center justify-center text-[#ffb700] mb-2 relative">
                                    <span className="absolute -inset-1.5 bg-[#ffb700]/10 rounded-full blur-sm opacity-50 animate-pulse"></span>
                                    <span className="material-symbols-outlined text-3xl z-10 font-bold">done_all</span>
                                </div>
                                <h4 className="text-base font-black text-[#2D2926]">
                                    All Caught Up!
                                </h4>
                                <p className="text-xs font-bold text-[#2D2926]/40 leading-relaxed max-w-[260px]">
                                    {hasHadRequests ? "You've resolved all pending requests." : "No new follow requests to review at the moment."}
                                </p>
                                <button
                                    onClick={onClose}
                                    className="mt-2.5 px-6 py-2.5 bg-[#2D2926] text-white hover:bg-[#ffb700] hover:text-[#2D2926] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                                >
                                    Dismiss
                                </button>
                            </div>
                        ) : (
                            <motion.div layout className="flex flex-col gap-3">
                                <AnimatePresence mode="popLayout">
                                    {requests.map(req => (
                                        <motion.div
                                            key={req.id}
                                            layout
                                            initial={{ opacity: 0, y: 15, scale: 0.97 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                                            className={`flex flex-col gap-3.5 p-4.5 rounded-2xl bg-white border border-[#ffb700]/10 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#ffb700]/20 ${
                                                req.actionState === 'accepted' ? 'border-emerald-500/20 bg-emerald-50/5' :
                                                req.actionState === 'rejected' ? 'border-rose-500/20 bg-rose-50/5' : ''
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <Link
                                                    to={`/watch-hive/profile/${req.sender.id}`}
                                                    className="flex items-center gap-3.5 group"
                                                    onClick={onClose}
                                                >
                                                    <div className="ring-2 ring-transparent group-hover:ring-[#ffb700]/30 rounded-full transition-all flex-shrink-0">
                                                        <Avatar
                                                            src={req.sender.profilePictureUrl}
                                                            name={req.sender.displayName || req.sender.username}
                                                            size="md"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[13px] font-black text-[#2D2926] group-hover:text-[#ffb700] transition-colors truncate max-w-[160px]">
                                                            {req.sender.displayName || req.sender.username}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-[#2D2926]/40 truncate">@{req.sender.username}</span>
                                                    </div>
                                                </Link>

                                                <span className="text-[9px] font-black text-[#2D2926]/30 uppercase tracking-wider bg-slate-50 border border-slate-100 rounded-md px-2 py-0.5">
                                                    {new Date(req.createdAt).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {!req.actionState ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleAccept(req.id)}
                                                            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-500/10 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(req.id)}
                                                            className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-100 hover:border-rose-500 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px] font-bold">close</span>
                                                            Decline
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className={`w-full py-2.5 rounded-xl text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 ${
                                                        req.actionState === 'accepted' ? 'bg-emerald-500/10 text-emerald-600' :
                                                        req.actionState === 'rejected' ? 'bg-rose-500/10 text-rose-500' : 'text-slate-400'
                                                    }`}>
                                                        <span className="material-symbols-outlined text-[16px]">
                                                            {req.actionState === 'accepted' ? 'check_circle' : 'cancel'}
                                                        </span>
                                                        {req.actionState === 'accepted' ? 'Accepted' : 'Declined'}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer */}
                    {requests.length > 0 && (
                        <div className="px-6 py-4 border-t border-[#ffb700]/10 bg-white flex items-center justify-end">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-[#2D2926]/60 hover:text-[#2D2926] border border-black/5 hover:border-black/10 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all active:scale-95 cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default PendingRequestsModal;
