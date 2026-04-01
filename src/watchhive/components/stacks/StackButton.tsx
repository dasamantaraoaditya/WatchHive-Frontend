import React, { useState } from 'react';
import { listsApi, List } from '../../services/lists.service';
import { Modal, BeeLoader } from '../common';

interface StackButtonProps {
    tmdbId: number;
    mediaType?: 'movie' | 'tv';
    className?: string;
}

export const StackButton: React.FC<StackButtonProps> = ({
    tmdbId,
    mediaType = 'movie',
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [stacks, setStacks] = useState<List[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const loadStacks = async () => {
        setIsLoading(true);
        try {
            const allLists = await listsApi.getLists();
            setStacks(allLists.filter(l => l.type === 'RANKING_STACK'));
        } catch (err) {
            console.error('Failed to load stacks:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpen = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
        loadStacks();
    };

    const addToStack = async (listId: string) => {
        setIsSaving(true);
        try {
            await listsApi.addToStack(listId, tmdbId, mediaType);
            setIsOpen(false);
            // Optional: show a toast/success message
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to add to stack');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <button
                className={`w-8 h-8 rounded-full bg-white/90 text-[#2D2926]/40 hover:text-[#ffb700] flex items-center justify-center shadow-sm transition-colors ${className}`}
                onClick={handleOpen}
                title="Add to Rankings"
            >
                <span className="material-symbols-outlined text-[18px]">playlist_add</span>
            </button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Add to a Ranking"
            >
                <div className="p-2">
                    {isLoading ? (
                        <div className="py-8 flex justify-center">
                            <BeeLoader size="small" />
                        </div>
                    ) : stacks.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {stacks.map(stack => (
                                <button
                                    key={stack.id}
                                    onClick={() => addToStack(stack.id)}
                                    disabled={isSaving}
                                    className="flex items-center justify-between p-4 rounded-2xl bg-[#ffb700]/5 hover:bg-[#ffb700]/10 border border-[#ffb700]/10 transition-all font-black text-sm text-[#2D2926]"
                                >
                                    <span>{stack.name}</span>
                                    {isSaving ? (
                                        <BeeLoader size="small" />
                                    ) : (
                                        <span className="material-symbols-outlined text-[18px] text-[#ffb700]">add_circle</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            <p className="text-sm font-bold text-[#2D2926]/40 mb-4">No rankings yet. Create one first!</p>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    // Navigate to stacks page?
                                    window.location.href = '/watch-hive/rankings';
                                }}
                                className="bg-[#2D2926] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest"
                            >
                                Go to Rankings
                            </button>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};
