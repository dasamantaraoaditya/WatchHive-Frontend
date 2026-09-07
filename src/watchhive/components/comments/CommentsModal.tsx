import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, BeeLoader } from '../common';
import { interactionService, Comment } from '../../services/interaction.service';
import { useAuth, useCustomAlert } from '../../contexts';

interface CommentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    entryId: string;
    entryTitle?: string;
    entryAuthorId?: string;
    onCommentAdded?: (newCount?: number) => void;
    onCommentDeleted?: (newCount?: number) => void;
}

const formatRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const CommentsModal: React.FC<CommentsModalProps> = ({
    isOpen,
    onClose,
    entryId,
    entryTitle,
    entryAuthorId,
    onCommentAdded,
    onCommentDeleted,
}) => {
    const { user } = useAuth();
    const { confirm, alert } = useCustomAlert();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen && entryId) {
            setReplyingTo(null);
            setNewComment('');
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

    const startReply = (comment: Comment) => {
        setReplyingTo(comment);
        setTimeout(() => {
            textareaRef.current?.focus();
        }, 50);
    };

    const cancelReply = () => {
        setReplyingTo(null);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const text = newComment.trim();
        if (!text || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const parentId = replyingTo?.id;
            const data = await interactionService.addComment(entryId, text, parentId);

            if (parentId) {
                // Append reply to the parent comment's replies
                setComments(prev =>
                    prev.map(c => {
                        if (c.id === parentId) {
                            return {
                                ...c,
                                replies: [...(c.replies || []), data.comment],
                            };
                        }
                        return c;
                    })
                );
                setReplyingTo(null);
            } else {
                setComments(prev => [{ ...data.comment, replies: [] }, ...prev]);
            }

            setNewComment('');
            if (onCommentAdded) onCommentAdded(data.commentCount);
        } catch (error) {
            console.error('Failed to post comment', error);
            await alert('Could not post comment. Please try again.', {
                title: 'Error',
                severity: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string, parentCommentId?: string) => {
        const isReply = !!parentCommentId;
        const confirmed = await confirm(
            'Are you sure you want to delete this comment? This action cannot be undone.',
            {
                title: isReply ? 'Delete Reply' : 'Delete Comment',
                confirmText: 'Delete',
                severity: 'danger',
            }
        );
        if (!confirmed) return;

        try {
            const res = await interactionService.deleteComment(commentId);
            if (parentCommentId) {
                setComments(prev =>
                    prev.map(c => {
                        if (c.id === parentCommentId) {
                            return {
                                ...c,
                                replies: (c.replies || []).filter(r => r.id !== commentId),
                            };
                        }
                        return c;
                    })
                );
            } else {
                setComments(prev => prev.filter(c => c.id !== commentId));
            }

            if (onCommentDeleted) onCommentDeleted(res.commentCount);
        } catch (error) {
            console.error('Failed to delete comment', error);
            await alert('Could not delete comment. Please try again.', {
                title: 'Error',
                severity: 'error',
            });
        }
    };

    if (!isOpen) return null;

    const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2926]/40 backdrop-blur-sm p-4 sm:p-6"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg bg-[#FFF9F0] rounded-3xl shadow-2xl flex flex-col font-sans text-[#2D2926] max-h-[90vh] overflow-hidden border border-[#ffb700]/20"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#ffb700]/15 flex items-center justify-between bg-white/60 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#ffb700]/15 text-[#ffb700] flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black text-[#2D2926]">Discussion</h3>
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#ffb700]/15 text-[#2D2926]">
                                    {totalCount}
                                </span>
                            </div>
                            {entryTitle && (
                                <p className="text-xs text-[#2D2926]/50 truncate max-w-[240px] sm:max-w-xs">
                                    {entryTitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#ffb700]/10 text-[#2D2926]/50 hover:text-[#2D2926] transition-colors shrink-0"
                        onClick={onClose}
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Body / Comments List */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <BeeLoader size="small" message="Loading discussion..." />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                            <div className="w-14 h-14 rounded-full bg-[#ffb700]/10 flex items-center justify-center mb-3 text-[#ffb700]">
                                <span className="material-symbols-outlined text-[28px]">
                                    forum
                                </span>
                            </div>
                            <h4 className="text-base font-bold text-[#2D2926] mb-1">No comments yet</h4>
                            <p className="text-xs text-[#2D2926]/60 max-w-xs">
                                Start the conversation by sharing your thoughts on this watch! 🐝
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5">
                            {comments.map(comment => {
                                const canDeleteComment =
                                    user?.id === comment.userId || (entryAuthorId && user?.id === entryAuthorId);
                                const authorId = comment.user?.id || comment.userId;
                                const authorName = comment.user?.displayName || comment.user?.username || 'User';

                                return (
                                    <div key={comment.id} className="flex flex-col gap-2 group">
                                        {/* Top-Level Comment */}
                                        <div className="flex gap-3.5">
                                            <div className="shrink-0 mt-0.5">
                                                <Link
                                                    to={authorId ? `/watch-hive/profile/${authorId}` : '#'}
                                                    onClick={onClose}
                                                    className="block hover:opacity-90 transition-opacity"
                                                >
                                                    <Avatar
                                                        src={comment.user?.profilePictureUrl || undefined}
                                                        name={authorName}
                                                        size="sm"
                                                    />
                                                </Link>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <div className="flex items-center gap-1.5 truncate">
                                                        <Link
                                                            to={authorId ? `/watch-hive/profile/${authorId}` : '#'}
                                                            onClick={onClose}
                                                            className="font-bold text-[#2D2926] text-[13.5px] truncate hover:text-[#ffb700] hover:underline transition-colors"
                                                        >
                                                            {authorName}
                                                        </Link>
                                                        <span className="text-[11px] font-medium text-[#2D2926]/40 whitespace-nowrap">
                                                            · {formatRelativeTime(comment.createdAt)}
                                                        </span>
                                                    </div>
                                                    {canDeleteComment && (
                                                        <button
                                                            type="button"
                                                            className="p-1 rounded-lg text-[#2D2926]/35 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                                                            onClick={() => handleDelete(comment.id)}
                                                            title="Delete Comment"
                                                            aria-label="Delete Comment"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px] block">
                                                                delete_outline
                                                            </span>
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-[#ffb700]/15 shadow-sm text-[14px] text-[#2D2926]/85 leading-relaxed whitespace-pre-wrap break-words">
                                                    {comment.content}
                                                </div>

                                                {/* Action Bar */}
                                                <div className="flex items-center gap-4 mt-1.5 px-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => startReply(comment)}
                                                        className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#ffb700] hover:text-[#d49900] hover:underline transition-colors cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[13px]">
                                                            reply
                                                        </span>
                                                        <span>Reply</span>
                                                    </button>
                                                    {comment.replies && comment.replies.length > 0 && (
                                                        <span className="text-[11px] font-semibold text-[#2D2926]/40">
                                                            {comment.replies.length}{' '}
                                                            {comment.replies.length === 1 ? 'reply' : 'replies'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Threaded Replies */}
                                        {comment.replies && comment.replies.length > 0 && (
                                            <div className="ml-8 sm:ml-10 pl-3.5 sm:pl-4 border-l-2 border-[#ffb700]/30 flex flex-col gap-2.5 mt-1.5">
                                                {comment.replies.map(reply => {
                                                    const canDeleteReply =
                                                        user?.id === reply.userId ||
                                                        (entryAuthorId && user?.id === entryAuthorId);
                                                    const replyAuthorId = reply.user?.id || reply.userId;
                                                    const replyAuthorName =
                                                        reply.user?.displayName ||
                                                        reply.user?.username ||
                                                        'User';

                                                    return (
                                                        <div key={reply.id} className="flex gap-3 group/reply">
                                                            <div className="shrink-0 mt-0.5">
                                                                <Link
                                                                    to={
                                                                        replyAuthorId
                                                                            ? `/watch-hive/profile/${replyAuthorId}`
                                                                            : '#'
                                                                    }
                                                                    onClick={onClose}
                                                                    className="block hover:opacity-90 transition-opacity"
                                                                >
                                                                    <Avatar
                                                                        src={reply.user?.profilePictureUrl || undefined}
                                                                        name={replyAuthorName}
                                                                        size="xs"
                                                                    />
                                                                </Link>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                                    <div className="flex items-center gap-1.5 truncate">
                                                                        <Link
                                                                            to={
                                                                                replyAuthorId
                                                                                    ? `/watch-hive/profile/${replyAuthorId}`
                                                                                    : '#'
                                                                            }
                                                                            onClick={onClose}
                                                                            className="font-bold text-[#2D2926] text-[13px] truncate hover:text-[#ffb700] hover:underline transition-colors"
                                                                        >
                                                                            {replyAuthorName}
                                                                        </Link>
                                                                        <span className="text-[11px] font-medium text-[#2D2926]/40 whitespace-nowrap">
                                                                            · {formatRelativeTime(reply.createdAt)}
                                                                        </span>
                                                                    </div>
                                                                    {canDeleteReply && (
                                                                        <button
                                                                            type="button"
                                                                            className="p-1 rounded-lg text-[#2D2926]/35 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                                                                            onClick={() =>
                                                                                handleDelete(reply.id, comment.id)
                                                                            }
                                                                            title="Delete Reply"
                                                                            aria-label="Delete Reply"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[15px] block">
                                                                                delete_outline
                                                                            </span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="bg-white/80 px-3.5 py-2.5 rounded-2xl rounded-tl-none border border-[#ffb700]/10 shadow-xs text-[13.5px] text-[#2D2926]/85 leading-relaxed whitespace-pre-wrap break-words">
                                                                    {reply.content}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer / Input Area */}
                <div className="border-t border-[#ffb700]/15 bg-white shadow-[0_-4px_20px_rgba(255,183,0,0.03)] rounded-b-3xl">
                    {/* Replying banner */}
                    {replyingTo && (
                        <div className="px-5 py-2.5 bg-[#ffb700]/10 border-b border-[#ffb700]/15 flex items-center justify-between text-xs font-semibold text-[#2D2926]">
                            <div className="flex items-center gap-1.5 truncate">
                                <span className="material-symbols-outlined text-[16px] text-[#ffb700]">reply</span>
                                <span className="text-[#2D2926]/60 font-medium">Replying to</span>
                                <span className="font-bold text-[#2D2926] truncate">
                                    @{replyingTo.user?.displayName || replyingTo.user?.username || 'user'}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={cancelReply}
                                className="p-1 text-[#2D2926]/50 hover:text-[#2D2926] rounded-full hover:bg-black/5 transition-colors shrink-0"
                                title="Cancel reply"
                                aria-label="Cancel reply"
                            >
                                <span className="material-symbols-outlined text-[16px] block">close</span>
                            </button>
                        </div>
                    )}

                    <form className="p-4 sm:p-5 flex items-end gap-3" onSubmit={handleSubmit}>
                        <div className="flex-1 relative">
                            <textarea
                                ref={textareaRef}
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                placeholder={
                                    replyingTo
                                        ? 'Write a reply...'
                                        : 'Share your thoughts on this watch...'
                                }
                                disabled={isSubmitting}
                                rows={Math.min(3, Math.max(1, newComment.split('\n').length))}
                                className="w-full bg-[#FFF9F0] border border-[#ffb700]/20 rounded-2xl px-4 py-3 text-[14px] font-medium text-[#2D2926] placeholder:text-[#2D2926]/35 focus:outline-none focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/10 transition-all resize-none block"
                                style={{ minHeight: '46px', maxHeight: '120px' }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || !newComment.trim()}
                            className="shrink-0 h-11 px-5 bg-[#ffb700] hover:brightness-105 disabled:opacity-40 disabled:hover:brightness-100 text-white font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <span>{replyingTo ? 'Reply' : 'Post'}</span>
                                    <span className="material-symbols-outlined text-[18px]">
                                        {replyingTo ? 'reply' : 'arrow_upward'}
                                    </span>
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
