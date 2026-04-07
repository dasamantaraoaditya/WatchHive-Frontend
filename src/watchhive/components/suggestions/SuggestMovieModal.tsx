import React, { useState, useRef, useCallback } from 'react';
import { suggestionsApi } from '../../services/suggestions.service';
import apiClient from '../../services/api.js';
import { BeeLoader } from '../common';

interface SuggestMovieModalProps {
    toUserId: string;
    toUserName: string;
    onClose: () => void;
    onSuccess?: () => void;
}

interface TmdbResult {
    id: number;
    title?: string;
    name?: string;
    media_type?: string;
    poster_path: string | null;
    release_date?: string;
    first_air_date?: string;
    overview?: string;
}

export const SuggestMovieModal: React.FC<SuggestMovieModalProps> = ({ toUserId, toUserName, onClose, onSuccess }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<TmdbResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState<TmdbResult | null>(null);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
                .slice(0, 5);
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

    const handleSendSuggestion = async () => {
        if (!selectedMovie) return;
        setIsSending(true);
        setError(null);
        try {
            await suggestionsApi.sendSuggestion({
                toUserId,
                tmdbId: selectedMovie.id,
                title: selectedMovie.title || selectedMovie.name || 'Unknown',
                mediaType: selectedMovie.media_type as 'movie' | 'tv',
                message: message.trim() || undefined
            });
            onSuccess?.();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send suggestion');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2926]/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-[#ffb700]/20">
                <div className="p-6 border-b border-[#ffb700]/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-[#2D2926]">Suggest a Movie</h2>
                        <p className="text-sm text-[#2D2926]/50">To {toUserName}</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                        <span className="material-symbols-outlined text-[#2D2926]/40">close</span>
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    {/* Search Input */}
                    {!selectedMovie ? (
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-black uppercase tracking-widest text-[#2D2926]/40">Search for a title</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#ffb700]">search</span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    autoFocus
                                    className="w-full pl-12 pr-4 py-4 bg-[#FFF9F0]/50 border-2 border-[#ffb700]/20 rounded-2xl outline-none focus:border-[#ffb700] transition-all font-bold"
                                    placeholder="Inception, Breaking Bad..."
                                />
                                {isSearching && <div className="absolute right-4 top-1/2 -translate-y-1/2"><BeeLoader size="small" message="" className="py-0" /></div>}
                            </div>

                            {searchResults.length > 0 && (
                                <div className="mt-2 flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                                    {searchResults.map(r => (
                                        <button
                                            key={r.id}
                                            onClick={() => setSelectedMovie(r)}
                                            className="flex items-center gap-4 p-2 hover:bg-[#ffb700]/10 rounded-xl transition-colors text-left group"
                                        >
                                            {r.poster_path ? (
                                                <img src={`https://image.tmdb.org/t/p/w92${r.poster_path}`} className="w-10 h-14 object-cover rounded-lg shadow-sm" alt="" />
                                            ) : (
                                                <div className="w-10 h-14 bg-slate-100 rounded-lg flex items-center justify-center"><span className="material-symbols-outlined text-slate-300">movie</span></div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-[#2D2926] truncate">{r.title || r.name}</h4>
                                                <p className="text-xs text-[#2D2926]/40 font-bold uppercase tracking-widest">
                                                    {r.media_type === 'tv' ? 'TV Series' : 'Movie'} • { (r.release_date || r.first_air_date || '').slice(0, 4) }
                                                </p>
                                            </div>
                                            <span className="material-symbols-outlined text-[#ffb700] opacity-0 group-hover:opacity-100 transition-opacity">add_circle</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Selected Movie Preview & Message */
                        <div className="flex flex-col gap-6 animate-[fade-in_0.3s_ease-out]">
                            <div className="flex gap-4 p-4 bg-[#FFF9F0] border border-[#ffb700]/20 rounded-2xl relative">
                                {selectedMovie.poster_path && (
                                    <img src={`https://image.tmdb.org/t/p/w185${selectedMovie.poster_path}`} className="w-20 h-28 object-cover rounded-xl shadow-md" alt="" />
                                )}
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-[#2D2926]">{selectedMovie.title || selectedMovie.name}</h3>
                                    <p className="text-xs font-bold text-[#ffb700] uppercase tracking-widest mb-2">
                                        {selectedMovie.media_type === 'tv' ? 'TV Series' : 'Movie'}
                                    </p>
                                    <p className="text-xs text-[#2D2926]/60 line-clamp-2">{selectedMovie.overview}</p>
                                </div>
                                <button 
                                    onClick={() => { setSelectedMovie(null); setSearchResults([]); }}
                                    className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-black uppercase tracking-widest text-[#2D2926]/40">Add a message (Optional)</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full p-4 bg-white border border-[#ffb700]/20 rounded-2xl outline-none focus:border-[#ffb700] transition-all min-h-[100px] text-sm"
                                    placeholder="Why should they watch this?"
                                />
                            </div>
                        </div>
                    )}

                    {error && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
                </div>

                <div className="p-6 bg-[#FFF9F0]/30 border-t border-[#ffb700]/10">
                    <button
                        disabled={!selectedMovie || isSending}
                        onClick={handleSendSuggestion}
                        className="w-full py-4 bg-[#ffb700] text-white font-black text-lg rounded-2xl hover:brightness-105 shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale transition-all"
                    >
                        {isSending ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                Sending Suggestion...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">send</span>
                                Send Suggestion
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
