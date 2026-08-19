import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from './Modal';
import apiClient from '../../services/api';
import { entriesApi } from '../../services/entries.service';
import { useCustomAlert } from '../../contexts';

interface TmdbResult {
    id: number;
    title?: string;
    name?: string;
    media_type?: string;
    poster_path: string | null;
    release_date?: string;
    first_air_date?: string;
    overview?: string;
    vote_average?: number;
}

interface QuickCurrentlyWatchingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const QuickCurrentlyWatchingModal: React.FC<QuickCurrentlyWatchingModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<TmdbResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState<TmdbResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { alert } = useCustomAlert();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setSearchResults([]);
            setSelectedMovie(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const doSearch = useCallback(async (q: string) => {
        if (q.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const data: any = await apiClient.get(`/tmdb/search/multi?query=${encodeURIComponent(q)}`);
            const results: TmdbResult[] = (data.results || [])
                .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
                .slice(0, 6);
            setSearchResults(results);
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        setSearchQuery(q);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(q), 350);
    };

    const handleSelectResult = (result: TmdbResult) => {
        setSelectedMovie(result);
    };

    const handleConfirmStartWatching = async () => {
        if (!selectedMovie || isSubmitting) return;
        setIsSubmitting(true);

        const title = selectedMovie.title || selectedMovie.name || 'this title';
        try {
            const apiType = selectedMovie.media_type === 'tv' ? 'TV_SHOW' : 'MOVIE';
            
            // Create currently watching entry with default values
            await entriesApi.createEntry({
                tmdbId: selectedMovie.id,
                title,
                type: apiType,
                isWatching: true,
                startedAt: new Date().toISOString()
            });

            // Display beautiful success alert
            await alert(`"${title}" has been added to your Currently Watching log!`, {
                title: 'Marked as Watching',
                severity: 'success',
                confirmText: 'Awesome'
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('Failed to add to currently watching log', err);
            await alert(`Failed to add "${title}" to your log. Please try again.`, {
                title: 'Error',
                severity: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const yearOf = (r: TmdbResult) => {
        const d = r.release_date || r.first_air_date;
        return d ? d.slice(0, 4) : '';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Log Currently Watching">
            {!selectedMovie ? (
                <div className="flex flex-col gap-4">
                    <p className="text-[#2D2926]/60 text-xs font-bold uppercase tracking-wider mb-1">
                        Select a movie or TV show to add to your currently watching log:
                    </p>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#ffb700] text-[24px]">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-full pl-12 pr-4 py-4 bg-[#FFF9F0]/50 border-2 border-[#ffb700]/30 outline-none focus:border-[#ffb700] focus:ring-4 focus:ring-[#ffb700]/10 rounded-2xl text-lg font-bold text-[#2D2926] transition-all"
                            placeholder="Search movies or TV shows..."
                            autoComplete="off"
                            autoFocus
                        />
                        {isSearching && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#ffb700]"></div>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto flex flex-col gap-2">
                        {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                            <div className="text-center text-[#2D2926]/50 py-4 font-bold">No results found.</div>
                        )}
                        {searchResults.map((r) => (
                            <button
                                key={r.id}
                                type="button"
                                className="w-full flex items-center gap-4 p-2 hover:bg-[#ffb700]/10 rounded-xl transition-colors cursor-pointer text-left focus:outline-none"
                                onClick={() => handleSelectResult(r)}
                            >
                                {r.poster_path ? (
                                    <img src={`https://image.tmdb.org/t/p/w92${r.poster_path}`} alt="" className="w-12 h-16 object-cover rounded-md shadow-sm border border-[#2D2926]/5" />
                                ) : (
                                    <div className="w-12 h-16 bg-[#FFF9F0] border border-[#ffb700]/20 rounded-md flex items-center justify-center text-[#ffb700]/50">
                                        <span className="material-symbols-outlined">image_not_supported</span>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-[#2D2926] truncate">{r.title || r.name}</h4>
                                    <div className="flex items-center gap-2 text-xs text-[#2D2926]/50 mt-1 font-bold tracking-widest uppercase">
                                        <span className={r.media_type === 'tv' ? 'text-blue-500' : 'text-[#ffb700]'}>{r.media_type === 'tv' ? 'TV' : 'Movie'}</span>
                                        {yearOf(r) && <span>• {yearOf(r)}</span>}
                                        {r.vote_average != null && r.vote_average > 0 && <span className="flex items-center gap-1"> • ⭐ {(r.vote_average).toFixed(1)}</span>}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-5 p-1 animate-[fade-in_0.2s_ease-out]">
                    <div className="flex gap-4 p-4 bg-[#FFF9F0] border border-[#ffb700]/20 rounded-2xl relative shadow-sm items-start">
                        {selectedMovie.poster_path ? (
                            <img 
                                src={`https://image.tmdb.org/t/p/w185${selectedMovie.poster_path}`} 
                                alt={selectedMovie.title || selectedMovie.name} 
                                className="w-20 aspect-[2/3] object-cover rounded-xl shadow-md border border-white" 
                            />
                        ) : (
                            <div className="w-20 aspect-[2/3] bg-[#FFF9F0] border border-[#ffb700]/20 rounded-xl flex items-center justify-center text-[#ffb700]/50">
                                <span className="material-symbols-outlined text-3xl">image_not_supported</span>
                            </div>
                        )}
                        <div className="flex-1 pt-1 min-w-0">
                            <h3 className="font-black text-[#2D2926] text-base truncate">{selectedMovie.title || selectedMovie.name}</h3>
                            <div className="flex items-center gap-2 text-[10px] text-[#2D2926]/50 mt-1.5 font-black tracking-widest uppercase">
                                <span className={selectedMovie.media_type === 'tv' ? 'text-blue-500' : 'text-[#ffb700]'}>
                                    {selectedMovie.media_type === 'tv' ? 'TV SHOW' : 'MOVIE'}
                                </span>
                                {yearOf(selectedMovie) && <span>• {yearOf(selectedMovie)}</span>}
                            </div>
                            <p className="text-[11px] leading-relaxed text-[#2D2926]/60 mt-2 font-bold line-clamp-2">
                                {selectedMovie.overview || "No description available for this cinematic entry."}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ffb700]/10">
                        <button
                            type="button"
                            onClick={() => setSelectedMovie(null)}
                            disabled={isSubmitting}
                            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-[#2D2926] font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all disabled:opacity-50 focus:outline-none cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            Change
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmStartWatching}
                            disabled={isSubmitting}
                            className="flex items-center justify-center gap-1.5 px-6 py-3 bg-[#ffb700] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:brightness-105 shadow-md shadow-[#ffb700]/15 transition-all disabled:opacity-50 cursor-pointer active:scale-97"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-white"></div>
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm font-bold">visibility</span>
                                    Log Currently Watching
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};
