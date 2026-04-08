import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Modal, BeeLoader, ErrorState } from '../common';
import apiClient from '../../services/api';
import { useWatchlist } from '../../contexts/WatchlistContext';
import { EntryForm } from '../entries/EntryForm';
import { SuggestUserSelector } from '../suggestions/SuggestUserSelector';

interface MovieDetails {
    id: number;
    title?: string;
    name?: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
    genres: { id: number; name: string }[];
    runtime?: number;
    episode_run_time?: number[];
    number_of_seasons?: number;
    tagline?: string;
}

interface MovieDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    tmdbId: number | null;
    mediaType: 'movie' | 'tv' | null;
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
    isOpen,
    onClose,
    tmdbId,
    mediaType
}) => {
    const [details, setDetails] = useState<MovieDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'details' | 'log' | 'suggest'>('details');

    const { addToList, removeFromList, isInWatchlist } = useWatchlist();
    const inWatchlist = tmdbId ? isInWatchlist(tmdbId) : false;

    useEffect(() => {
        if (isOpen && tmdbId && mediaType) {
            setView('details');
            fetchDetails();
        } else {
            setDetails(null);
            setError(null);
            setView('details');
        }
    }, [isOpen, tmdbId, mediaType]);

    const handleWatchlistToggle = async () => {
        if (!tmdbId) return;
        try {
            if (inWatchlist) {
                await removeFromList(tmdbId);
            } else {
                await addToList(tmdbId, mediaType || 'movie');
            }
        } catch (err) {
            console.error('Watchlist action failed', err);
        }
    };

    const handleShare = async () => {
        if (!details) return;
        const shareData = {
            title: title,
            text: `Check out ${title} on WatchHive!`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            console.error('Share failed', err);
        }
    };
    const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const endpoint = mediaType === 'movie' ? `/tmdb/movie/${tmdbId}` : `/tmdb/tv/${tmdbId}`;
            const data: any = await apiClient.get(endpoint);
            setDetails(data);
        } catch (err) {
            console.error('Failed to fetch movie details:', err);
            setError('Failed to load cinematic details. The hive is a bit busy.');
        } finally {
            setLoading(false);
        }
    };

    const title = details?.title || details?.name || 'Loading...';
    const year = (details?.release_date || details?.first_air_date || '').substring(0, 4);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-4xl"
        >
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                    <BeeLoader size="large" message="Sourcing cinematic intelligence..." />
                </div>
            ) : error ? (
                <div className="py-12">
                    <ErrorState message={error} onRetry={fetchDetails} />
                </div>
            ) : details ? (
                <div className="flex flex-col gap-8">
                    {view === 'details' ? (
                        <>
                            {/* Hero Section with Backdrop */}
                            <div className="relative -mx-8 -mt-8 h-64 md:h-96 overflow-hidden">
                                {details.backdrop_path ? (
                                    <img 
                                        src={`https://image.tmdb.org/t/p/original${details.backdrop_path}`} 
                                        alt="" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-[#2D2926]/5 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-6xl text-[#2D2926]/10">movie</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
                            </div>

                            {/* Content Section */}
                            <div className="flex flex-col md:flex-row gap-8 relative -mt-32 md:-mt-48 z-10">
                                {/* Poster Area (No Sidebar) */}
                                <div className="w-48 md:w-64 flex-shrink-0 mx-auto md:mx-0">
                                    <motion.div 
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white"
                                    >
                                        {details.poster_path ? (
                                            <img 
                                                src={`https://image.tmdb.org/t/p/w500${details.poster_path}`} 
                                                alt={title} 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-[#2D2926]/5 text-[#2D2926]/20 font-black">
                                                NO POSTER
                                            </div>
                                        )}
                                    </motion.div>
                                </div>

                                {/* Text Info */}
                                <div className="flex-1 flex flex-col pt-4 md:pt-16">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <span className="px-3 py-1 rounded-full bg-[#ffb700] text-white text-[10px] font-black uppercase tracking-widest">
                                            {mediaType === 'tv' ? 'TV SERIES' : 'MOVIE'}
                                        </span>
                                        {year && (
                                            <span className="text-sm font-bold text-[#2D2926]/40">{year}</span>
                                        )}
                                        <div className="flex items-center gap-1 text-[#ffb700]">
                                            <span className="material-symbols-outlined text-base filled">star</span>
                                            <span className="text-sm font-black">{details.vote_average.toFixed(1)}</span>
                                        </div>
                                    </div>

                                    <h2 className="text-3xl md:text-5xl font-black text-[#2D2926] leading-tight mb-2 tracking-tight">
                                        {title}
                                    </h2>
                                    
                                    {details.tagline && (
                                        <p className="text-lg font-bold text-[#ffb700] italic mb-6">"{details.tagline}"</p>
                                    )}

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {details.genres.map(genre => (
                                            <span key={genre.id} className="px-3 py-1.5 rounded-lg bg-[#2D2926]/5 text-[#2D2926]/40 text-[9px] font-black uppercase tracking-widest border border-[#2D2926]/5">
                                                {genre.name}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Streamlined Action Row */}
                                    <div className="flex items-center gap-4 py-4 px-1 border-y border-[#2D2926]/5 mb-8">
                                        <button 
                                            onClick={handleWatchlistToggle}
                                            className={`flex items-center gap-2 group transition-all`}
                                        >
                                            <span className={`material-symbols-outlined text-2xl transition-all ${inWatchlist ? 'text-[#ffb700] filled' : 'text-[#2D2926]/20 group-hover:text-[#ffb700]'}`}>
                                                {inWatchlist ? 'bookmark_added' : 'bookmark_add'}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${inWatchlist ? 'text-[#ffb700]' : 'text-[#2D2926]/60'}`}>
                                                {inWatchlist ? 'Saved' : 'Watchlist'}
                                            </span>
                                        </button>

                                        <div className="w-px h-6 bg-[#2D2926]/5" />

                                        <button 
                                            onClick={() => setView('log')}
                                            className="flex items-center gap-2 group transition-all"
                                        >
                                            <span className="material-symbols-outlined text-2xl text-[#2D2926]/20 group-hover:text-[#2D2926] transition-all">edit_note</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#2D2926]/60">Log</span>
                                        </button>

                                        <div className="w-px h-6 bg-[#2D2926]/5" />

                                        <button 
                                            onClick={() => setView('suggest')}
                                            className="flex items-center gap-2 group transition-all"
                                        >
                                            <span className="material-symbols-outlined text-2xl text-[#2D2926]/20 group-hover:text-[#ffb700] transition-all">send</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#2D2926]/60">Suggest</span>
                                        </button>

                                        <div className="w-px h-6 bg-[#2D2926]/5" />

                                        <button 
                                            onClick={handleShare}
                                            className="flex items-center gap-2 group transition-all"
                                        >
                                            <span className="material-symbols-outlined text-2xl text-[#2D2926]/20 group-hover:text-blue-500 transition-all">share</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#2D2926]/60">Share</span>
                                        </button>
                                    </div>

                                    <div className="mb-8">
                                        <h4 className="text-[10px] font-black text-[#2D2926]/30 uppercase tracking-[0.2em] mb-3">The Narrative</h4>
                                        <p className="text-[#2D2926]/70 leading-relaxed font-medium text-lg">
                                            {details.overview || "No transmission available for this cinematic entry."}
                                        </p>
                                    </div>

                                    {/* Additional Stats */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-6 border-t border-[#2D2926]/5">
                                        {details.runtime ? (
                                            <div>
                                                <h5 className="text-[9px] font-black text-[#2D2926]/30 uppercase tracking-widest mb-1">Duration</h5>
                                                <p className="font-bold text-[#2D2926]">{details.runtime} mins</p>
                                            </div>
                                        ) : details.episode_run_time?.[0] ? (
                                            <div>
                                                <h5 className="text-[9px] font-black text-[#2D2926]/30 uppercase tracking-widest mb-1">Runtime</h5>
                                                <p className="font-bold text-[#2D2926]">{details.episode_run_time[0]} mins</p>
                                            </div>
                                        ) : null}
                                        
                                        {details.number_of_seasons && (
                                            <div>
                                                <h5 className="text-[9px] font-black text-[#2D2926]/30 uppercase tracking-widest mb-1">Seasons</h5>
                                                <p className="font-bold text-[#2D2926]">{details.number_of_seasons}</p>
                                            </div>
                                        )}

                                        <div>
                                            <h5 className="text-[9px] font-black text-[#2D2926]/30 uppercase tracking-widest mb-1">Status</h5>
                                            <p className="font-bold text-[#2D2926]">Released</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : view === 'log' ? (
                        <div className="animate-[fade-in_0.3s_ease-out]">
                             <div className="flex items-center gap-4 mb-8">
                                <button 
                                    onClick={() => setView('details')}
                                    className="w-10 h-10 rounded-full flex items-center justify-center bg-[#2D2926]/5 text-[#2D2926] hover:bg-[#2D2926]/10 transition-colors"
                                >
                                    <span className="material-symbols-outlined">arrow_back</span>
                                </button>
                                <div>
                                    <h3 className="text-2xl font-black text-[#2D2926]">Log Your Watch</h3>
                                    <p className="text-xs font-bold text-[#2D2926]/40 uppercase tracking-widest">Adding entry for {title}</p>
                                </div>
                            </div>

                            <EntryForm 
                                prefillData={{
                                    tmdbId: tmdbId!,
                                    title: title,
                                    type: mediaType === 'tv' ? 'TV_SHOW' : 'MOVIE',
                                    posterPath: details.poster_path,
                                    overview: details.overview
                                }}
                                isModal={true}
                                onSuccess={() => onClose()}
                                onCancel={() => setView('details')}
                            />
                        </div>
                    ) : (
                        <div className="animate-[fade-in_0.3s_ease-out]">
                            <SuggestUserSelector 
                                tmdbId={tmdbId!}
                                mediaType={mediaType || 'movie'}
                                title={title}
                                onBack={() => setView('details')}
                                onSuccess={() => {
                                    alert(`Suggestion for ${title} sent!`);
                                    onClose();
                                }}
                            />
                        </div>
                    )}
                </div>
            ) : null}
        </Modal>
    );
};
