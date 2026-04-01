import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Modal, BeeLoader, ErrorState } from '../common';
import apiClient from '../../services/api';

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

    useEffect(() => {
        if (isOpen && tmdbId && mediaType) {
            fetchDetails();
        } else {
            setDetails(null);
            setError(null);
        }
    }, [isOpen, tmdbId, mediaType]);

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
                        {/* Poster */}
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

                            <div className="flex flex-wrap gap-2 mb-8">
                                {details.genres.map(genre => (
                                    <span key={genre.id} className="px-4 py-2 rounded-xl bg-[#2D2926]/5 text-[#2D2926]/60 text-[10px] font-black uppercase tracking-widest border border-[#2D2926]/5">
                                        {genre.name}
                                    </span>
                                ))}
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
                                ) : details.number_of_seasons ? (
                                    <div>
                                        <h5 className="text-[9px] font-black text-[#2D2926]/30 uppercase tracking-widest mb-1">Seasons</h5>
                                        <p className="font-bold text-[#2D2926]">{details.number_of_seasons} Seasons</p>
                                    </div>
                                ) : null}
                                
                                <div>
                                    <h5 className="text-[9px] font-black text-[#2D2926]/30 uppercase tracking-widest mb-1">Status</h5>
                                    <p className="font-bold text-[#2D2926]">Released</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </Modal>
    );
};
