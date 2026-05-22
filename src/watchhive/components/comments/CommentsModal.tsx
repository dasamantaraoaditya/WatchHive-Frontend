import React, { useState, useEffect } from 'react';
import { Avatar, BeeLoader } from '../common';
import { interactionService, Comment } from '../../services/interaction.service';
import { useAuth, useCustomAlert } from '../../contexts';

interface CommentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    entryId: string;
    onCommentAdded?: () => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, onClose, entryId, onCommentAdded }) => {
    const { user } = useAuth();
    const { confirm } = useCustomAlert();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && entryId) {
            fetchComments();
        }
    }, [isOpen, entryId]);

    const fetchComments = async () => {
        setIsLoading(true);
        try {
            const data = await interactionService.getComments(entryId);
            setComments(data.comments);
        } catch (error) {
            console.error('Failed to fetch comments', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const data = await interactionService.addComment(entryId, newComment);
            setComments([data.comment, ...comments]);
            setNewComment('');
            if (onCommentAdded) onCommentAdded();
        } catch (error) {
            console.error('Failed to post comment', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        const confirmed = await confirm('Delete this comment?', {
            title: 'Delete Comment',
            confirmText: 'Delete',
            severity: 'danger'
        });
        if (!confirmed) return;
        try {
            await interactionService.deleteComment(commentId);
            setComments(comments.filter(c => c.id !== commentId));
        } catch (error) {
            console.error('Failed to delete comment', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2926]/40 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
            <div 
                className="w-full max-w-lg bg-[#FFF9F0] rounded-3xl shadow-2xl flex flex-col font-sans text-[#2D2926] max-h-[90vh] overflow-hidden border border-[#ffb700]/20" 
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#ffb700]/10 flex items-center justify-between bg-white/50 backdrop-blur-md">
                    <h3 className="text-xl font-black text-[#2D2926] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#ffb700]">chat_bubble</span>
                        Discussion
                    </h3>
                    <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#ffb700]/10 text-[#2D2926]/50 hover:text-[#2D2926] transition-colors"
                        onClick={onClose}
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Body / Comments List */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <BeeLoader size="small" message="Loading discussion..." />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <span className="material-symbols-outlined text-5xl text-[#ffb700] opacity-50 mb-4">forum</span>
                            <h4 className="text-lg font-bold text-[#2D2926] mb-1">No comments yet</h4>
                            <p className="text-sm font-medium text-[#2D2926]/50">Start the conversation by sharing your thoughts!</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5">
                            {comments.map(comment => (
                                <div key={comment.id} className="flex gap-4 group">
                                    <div className="shrink-0 mt-1">
                                        <Avatar
                                            src={comment.user.profilePictureUrl || undefined}
                                            name={comment.user.displayName || comment.user.username}
                                            size="sm"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-2 truncate">
                                                <span className="font-bold text-[#2D2926] truncate">
                                                    {comment.user.displayName || comment.user.username}
                                                </span>
                                                <span className="text-xs font-semibold text-[#2D2926]/40 whitespace-nowrap">
                                                    {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                                                </span>
                                            </div>
                                            {(user?.id === comment.userId) && (
                                                <button
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-all shrink-0"
                                                    onClick={() => handleDelete(comment.id)}
                                                    title="Delete Comment"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                </button>
                                            )}
                                        </div>
                                        <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-[#ffb700]/10 shadow-sm text-[15px] text-[#2D2926]/80 leading-relaxed whitespace-pre-wrap">
                                            {comment.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer / Input Area */}
                <div className="p-4 sm:p-5 border-t border-[#ffb700]/10 bg-white shadow-[0_-4px_20px_rgba(255,183,0,0.03)] rounded-b-3xl">
                    <form className="flex items-end gap-3" onSubmit={handleSubmit}>
                        <div className="flex-1 relative">
                            <textarea
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                disabled={isSubmitting}
                                rows={Math.min(3, Math.max(1, newComment.split('\n').length))}
                                className="w-full bg-[#FFF9F0] border border-[#ffb700]/20 rounded-2xl px-4 py-3 text-[15px] font-medium text-[#2D2926] placeholder:text-[#2D2926]/30 focus:outline-none focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/10 transition-all resize-none block"
                                style={{ minHeight: '48px', maxHeight: '120px' }}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting || !newComment.trim()}
                            className="shrink-0 h-12 px-6 bg-[#ffb700] hover:brightness-105 disabled:opacity-50 disabled:hover:brightness-100 text-white font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <span>Post</span>
                                    <span className="material-symbols-outlined text-[18px]">send</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CommentsModal;
