import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import apiClient from '../../services/api';

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

interface SearchMediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    onSelect: (tmdbId: number, mediaType: 'movie' | 'tv', title: string) => void;
}

export const SearchMediaModal: React.FC<SearchMediaModalProps> = ({
    isOpen,
    onClose,
    title,
}) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<TmdbResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reset when opened
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setSearchResults([]);
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
                .slice(0, 8);
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
        onClose();
        const mType = result.media_type === 'tv' ? 'tv' : 'movie';
        navigate(`/watch-hive/details/${mType}/${result.id}`);
    };

    const yearOf = (r: TmdbResult) => {
        const d = r.release_date || r.first_air_date;
        return d ? d.slice(0, 4) : '';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="flex flex-col gap-4">
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
        </Modal>
    );
};
