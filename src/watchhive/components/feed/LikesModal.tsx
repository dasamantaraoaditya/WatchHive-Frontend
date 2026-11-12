import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Avatar, UserListSkeleton } from '../common';
import { interactionService, LikedUser } from '../../services/interaction.service';
import { useUI } from '../../contexts';

interface LikesModalProps {
    isOpen: boolean;
    onClose: () => void;
    entryId: string;
    entryTitle?: string;
    initialLikeCount?: number;
}

const INITIAL_LIMIT = 3;
const LOAD_MORE_BATCH_SIZE = 10;

export const LikesModal: React.FC<LikesModalProps> = ({
    isOpen,
    onClose,
    entryId,
    entryTitle,
    initialLikeCount = 0,
}) => {
    const { registerModal } = useUI();
    const [users, setUsers] = useState<LikedUser[]>([]);
    const [total, setTotal] = useState<number>(initialLikeCount);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        return registerModal();
    }, [isOpen, registerModal]);

    const fetchLikes = useCallback(
        async (limit: number, offset: number, append: boolean) => {
            if (append) {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
                setError(null);
            }

            try {
                const res = await interactionService.getEntryLikes(entryId, limit, offset);
                const incoming = res.likes || [];
                const totalCount = res.pagination?.total ?? incoming.length;
                const moreAvailable =
                    res.pagination?.hasMore !== undefined
                        ? res.pagination.hasMore
                        : offset + incoming.length < totalCount;

                setTotal(totalCount);
                setHasMore(moreAvailable);

                if (append) {
                    setUsers(prev => {
                        const existingIds = new Set(prev.map(u => u.id));
                        const uniqueNew = incoming.filter(u => !existingIds.has(u.id));
                        return [...prev, ...uniqueNew];
                    });
                } else {
                    setUsers(incoming);
                }
            } catch (err) {
                console.error('Failed to load liked users:', err);
                setError('Could not load likes. Please try again.');
            } finally {
                setIsLoading(false);
                setIsLoadingMore(false);
            }
        },
        [entryId]
    );

    useEffect(() => {
        if (isOpen && entryId) {
            setUsers([]);
            setTotal(initialLikeCount);
            setHasMore(false);
            fetchLikes(INITIAL_LIMIT, 0, false);
        }
    }, [isOpen, entryId, initialLikeCount, fetchLikes]);

    // Body scroll lock
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            document.body.setAttribute('data-modal-open', 'true');
            return () => {
                document.body.style.overflow = originalOverflow;
                document.body.removeAttribute('data-modal-open');
            };
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleLoadMore = () => {
        if (isLoadingMore || !hasMore) return;
        fetchLikes(LOAD_MORE_BATCH_SIZE, users.length, true);
    };

    const remainingCount = Math.max(0, total - users.length);

    return createPortal(
        <div
            className="fixed inset-0 z-[3500] flex items-end sm:items-center justify-center bg-[#2D2926]/60 backdrop-blur-sm p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-[#FFF9F0] rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col font-sans text-[#2D2926] max-h-[82dvh] sm:max-h-[75vh] overflow-hidden border-t sm:border border-[#ffb700]/25 relative animate-[slide-up_0.25s_cubic-bezier(0.16,1,0.3,1)]"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Users who liked this post"
            >
                {/* Mobile Drag Handle Pill */}
                <div className="w-10 h-1 rounded-full bg-[#2D2926]/20 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

                {/* Header */}
                <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-[#ffb700]/15 flex items-center justify-between bg-white/75 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                            <span
                                className="material-symbols-outlined text-[20px]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                favorite
                            </span>
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black text-[#2D2926]">Liked by</h3>
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#ffb700]/20 text-[#2D2926]">
                                    {total}
                                </span>
                            </div>
                            {entryTitle && (
                                <p className="text-xs text-[#2D2926]/55 truncate max-w-[230px] sm:max-w-[260px]">
                                    {entryTitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#ffb700]/15 text-[#2D2926]/55 hover:text-[#2D2926] transition-colors shrink-0 cursor-pointer"
                        onClick={onClose}
                        aria-label="Close likes list"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 bg-[#FFF9F0]/60 min-h-[200px]">
                    {isLoading ? (
                        <div className="p-1">
                            <UserListSkeleton count={INITIAL_LIMIT} />
                        </div>
                    ) : error && users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
                            <span className="material-symbols-outlined text-3xl text-rose-500">error_outline</span>
                            <p className="text-sm font-semibold text-[#2D2926]/70">{error}</p>
                            <button
                                type="button"
                                onClick={() => fetchLikes(INITIAL_LIMIT, 0, false)}
                                className="px-4 py-2 rounded-xl bg-[#ffb700] hover:bg-[#e59700] text-[#2D2926] text-xs font-black transition-colors cursor-pointer"
                            >
                                Retry
                            </button>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-[#ffb700]/15 flex items-center justify-center text-[#2D2926]/60 mb-1">
                                <span className="material-symbols-outlined text-2xl">favorite_border</span>
                            </div>
                            <h4 className="text-base font-bold text-[#2D2926]">No likes yet</h4>
                            <p className="text-xs text-[#2D2926]/55 max-w-xs">
                                Be the first to show some love for this watch!
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1.5">
                            {users.map(u => {
                                const displayName = u.displayName || u.username;
                                return (
                                    <Link
                                        key={u.id}
                                        to={`/watch-hive/profile/${u.id}`}
                                        onClick={onClose}
                                        className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white/80 hover:bg-white border border-black/5 hover:border-[#ffb700]/35 shadow-2xs hover:shadow-xs transition-all group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 pr-2">
                                            <div className="ring-2 ring-transparent group-hover:ring-[#ffb700]/40 rounded-full transition-all shrink-0">
                                                <Avatar
                                                    src={u.profilePictureUrl}
                                                    name={displayName}
                                                    size="md"
                                                />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[14.5px] font-bold text-[#2D2926] group-hover:text-[#E59700] transition-colors truncate">
                                                    {displayName}
                                                </span>
                                                <span className="text-[12.5px] font-semibold text-[#2D2926]/50 truncate">
                                                    @{u.username}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="px-3.5 py-1.5 rounded-full border border-[#ffb700]/40 bg-[#ffb700]/10 group-hover:bg-[#ffb700] text-[#2D2926] text-[11.5px] font-extrabold transition-colors shrink-0">
                                            View
                                        </div>
                                    </Link>
                                );
                            })}

                            {/* Skeleton batch while loading more */}
                            {isLoadingMore && (
                                <div className="mt-1">
                                    <UserListSkeleton count={3} />
                                </div>
                            )}

                            {/* See More (batches of 10) */}
                            {!isLoadingMore && hasMore && (
                                <div className="pt-2 pb-1 flex flex-col items-center">
                                    <button
                                        type="button"
                                        onClick={handleLoadMore}
                                        className="w-full py-2.5 px-4 rounded-xl bg-[#ffb700] hover:bg-[#e59700] text-[#2D2926] text-xs font-black tracking-wide transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">expand_more</span>
                                        <span>
                                            See more ({remainingCount > LOAD_MORE_BATCH_SIZE ? `next ${LOAD_MORE_BATCH_SIZE} of ${remainingCount}` : remainingCount})
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes slide-up { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
            `}</style>
        </div>,
        document.body
    );
};

export default LikesModal;
