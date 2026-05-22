import React, { useState, useEffect } from 'react';
import followsService from '../../services/follows.service';
import { Avatar, BeeLoader } from '../common';
import { Link } from 'react-router-dom';

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

    useEffect(() => {
        if (isOpen) {
            fetchRequests();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await followsService.getPendingRequests();
            setRequests(data);
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
            
            // Remove after brief delay for visual feedback
            setTimeout(() => {
                setRequests(prev => prev.filter(req => req.id !== requestId));
            }, 1000);
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
            
            // Remove after brief delay for visual feedback
            setTimeout(() => {
                setRequests(prev => prev.filter(req => req.id !== requestId));
            }, 1000);
        } catch (error) {
            console.error('Failed to reject request', error);
            // Revert on error
            setRequests(prev => prev.map(req => 
                req.id === requestId ? { ...req, actionState: undefined } : req
            ));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2926]/40 backdrop-blur-sm p-4 animate-[fade-in_0.2s_ease-out]" onClick={onClose}>
            <div 
                className="bg-[#FFF9F0] w-full max-w-md max-h-[85vh] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden border border-[#ffb700]/10 animate-[slide-up_0.3s_cubic-bezier(0.16,1,0.3,1)]" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#ffb700]/10 bg-white">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#ffb700] text-xl">lock_person</span>
                        <h3 className="text-xl font-black text-[#2D2926] tracking-tight">
                            Pending Requests
                        </h3>
                    </div>
                    <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#ffb700]/10 text-[#ffb700] hover:bg-[#ffb700]/20 hover:text-[#2D2926] transition-colors"
                        onClick={onClose}
                    >
                        <span className="material-symbols-outlined text-[18px] font-bold">close</span>
                    </button>
                </div>
                
                {/* Body */}
                <div className="flex-1 overflow-y-auto p-2 bg-[#FFF9F0]/50 no-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <BeeLoader size="small" message="Fetching pending requests..." />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-[#ffb700]/10 flex items-center justify-center text-[#ffb700] mb-2 relative">
                                <span className="absolute -inset-1 bg-[#ffb700]/10 rounded-full blur-sm opacity-50"></span>
                                <span className="material-symbols-outlined text-3xl z-10">done_all</span>
                            </div>
                            <h4 className="text-lg font-bold text-[#2D2926]">
                                All Caught Up!
                            </h4>
                            <p className="text-sm font-medium text-[#2D2926]/50">
                                You don't have any pending follow requests to review.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 p-2">
                            {requests.map(req => (
                                <div
                                    key={req.id}
                                    className={`flex flex-col gap-3 p-4 rounded-2xl bg-white border border-black/5 transition-all duration-300 ${
                                        req.actionState === 'accepted' ? 'border-emerald-500/20 bg-emerald-50/10' :
                                        req.actionState === 'rejected' ? 'border-rose-500/20 bg-rose-50/10' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <Link
                                            to={`/watch-hive/profile/${req.sender.id}`}
                                            className="flex items-center gap-3 group"
                                            onClick={onClose}
                                        >
                                            <div className="ring-2 ring-transparent group-hover:ring-[#ffb700]/30 rounded-full transition-all">
                                                <Avatar
                                                    src={req.sender.profilePictureUrl}
                                                    name={req.sender.displayName || req.sender.username}
                                                    size="md"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-bold text-[#2D2926] group-hover:text-[#ffb700] transition-colors line-clamp-1">
                                                    {req.sender.displayName || req.sender.username}
                                                </span>
                                                <span className="text-[12px] font-bold text-[#2D2926]/40">@{req.sender.username}</span>
                                            </div>
                                        </Link>

                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                            {new Date(req.createdAt).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 mt-1">
                                        {!req.actionState ? (
                                            <>
                                                <button
                                                    onClick={() => handleAccept(req.id)}
                                                    className="flex-1 py-2 bg-[#ffb700] hover:brightness-105 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                                                >
                                                    <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleReject(req.id)}
                                                    className="flex-1 py-2 border border-black/5 hover:bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                                >
                                                    <span className="material-symbols-outlined text-[14px] font-bold">close</span>
                                                    Decline
                                                </button>
                                            </>
                                        ) : (
                                            <div className={`w-full py-2 rounded-xl text-center text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 ${
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
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {/* Inline CSS for simple animations since Tailwind JIT might not catch custom keys */}
            <style>{`
                @keyframes slide-up { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

export default PendingRequestsModal;
