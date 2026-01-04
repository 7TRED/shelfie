import React, { useState, useEffect } from 'react';
import { Movie, MovieStatus, Season } from '../types';
import { getWatchProviders, getTVShowDetails, getTVSeasonEpisodes } from '../services/movieService';
import StarRating from './StarRating';
import { ArrowLeft, Star, Share2, Trash2, Check, ChevronDown, ChevronUp, AlertTriangle, FileText, Tv, Loader2 } from 'lucide-react';

interface MovieDetailsProps {
  movie: Movie;
  onBack: () => void;
  onUpdate: (id: string, updates: Partial<Movie>) => void;
  onDelete: (id: string) => void;
}

const MovieDetails: React.FC<MovieDetailsProps> = ({ movie, onBack, onUpdate, onDelete }) => {
  const [status, setStatus] = useState<MovieStatus>(movie.status);
  const [rating, setRating] = useState(movie.rating || 0);
  const [review, setReview] = useState(movie.userReview || '');
  const [plannedDate, setPlannedDate] = useState(movie.plannedDate || '');
  
  // TV Specific State
  const [seasons, setSeasons] = useState<Season[]>(movie.seasons || []);
  const [activeSeasonNumber, setActiveSeasonNumber] = useState<number | null>(null);
  const [loadingSeason, setLoadingSeason] = useState(false);
  
  const [hasChanges, setHasChanges] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Watch Providers State
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Derived state
  const providers = movie.watchProviders || null;

  useEffect(() => {
    const isDifferent = 
        status !== movie.status || 
        rating !== (movie.rating || 0) || 
        review !== (movie.userReview || '') ||
        plannedDate !== (movie.plannedDate || '');
    
    setHasChanges(isDifferent);
  }, [status, rating, review, plannedDate, movie]);

  useEffect(() => {
    // Only fetch for Movie/TV if missing
    if (movie.watchProviders || movie.mediaType === 'book') return;

    const fetchProviders = async () => {
        if (movie.tmdbId) {
            setLoadingProviders(true);
            const data = await getWatchProviders(movie.tmdbId, movie.mediaType);
            if (data) {
                onUpdate(movie.id, { watchProviders: data });
            }
            setLoadingProviders(false);
        }
    };
    fetchProviders();
  }, [movie.id, movie.tmdbId, movie.mediaType, movie.watchProviders, onUpdate]);

  // Initial TV Data Fetch (Seasons List)
  useEffect(() => {
      if (movie.mediaType === 'tv' && movie.tmdbId && (!movie.seasons || movie.seasons.length === 0)) {
          const fetchTVData = async () => {
              const fetchedSeasons = await getTVShowDetails(movie.tmdbId!);
              if (fetchedSeasons.length > 0) {
                  setSeasons(fetchedSeasons);
                  onUpdate(movie.id, { seasons: fetchedSeasons });
              }
          };
          fetchTVData();
      }
  }, [movie.mediaType, movie.tmdbId, movie.seasons, movie.id, onUpdate]);

  const handleSave = () => {
    onUpdate(movie.id, {
        status,
        rating,
        userReview: review,
        plannedDate: plannedDate || undefined,
        seasons: seasons 
    });
    setHasChanges(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isDeleting) {
          onDelete(movie.id);
          onBack(); 
      } else {
          setIsDeleting(true);
          // Auto-reset after 3 seconds
          setTimeout(() => setIsDeleting(false), 3000);
      }
  };

  const handleShare = async () => {
    let url = window.location.href;
    if (movie.mediaType !== 'book' && movie.tmdbId) {
        url = `https://www.themoviedb.org/${movie.mediaType}/${movie.tmdbId}`;
    } else if (movie.openLibraryId) {
        url = `https://openlibrary.org${movie.openLibraryId}`;
    }

    const shareData = {
        title: `Check out ${movie.title}`,
        text: `I'm tracking "${movie.title}" on MediaShelf!`,
        url: url
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.log('Share canceled');
        }
    } else {
        navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('Link copied to clipboard!');
    }
  };

  // --- TV Logic ---
  const toggleSeason = async (seasonNum: number) => {
      if (activeSeasonNumber === seasonNum) {
          setActiveSeasonNumber(null);
          return;
      }
      setActiveSeasonNumber(seasonNum);

      // Check if we need to fetch episodes
      const seasonIndex = seasons.findIndex(s => s.season_number === seasonNum);
      if (seasonIndex >= 0 && !seasons[seasonIndex].episodes) {
          setLoadingSeason(true);
          const episodes = await getTVSeasonEpisodes(movie.tmdbId!, seasonNum);
          
          const updatedSeasons = [...seasons];
          updatedSeasons[seasonIndex] = { ...updatedSeasons[seasonIndex], episodes };
          
          setSeasons(updatedSeasons);
          onUpdate(movie.id, { seasons: updatedSeasons });
          setLoadingSeason(false);
      }
  };

  const toggleEpisodeWatched = (seasonNum: number, episodeId: number) => {
      const updatedSeasons = seasons.map(season => {
          if (season.season_number !== seasonNum || !season.episodes) return season;
          return {
              ...season,
              episodes: season.episodes.map(ep => 
                  ep.id === episodeId ? { ...ep, isWatched: !ep.isWatched } : ep
              )
          };
      });

      setSeasons(updatedSeasons);
      onUpdate(movie.id, { seasons: updatedSeasons });
  };

  const markSeasonWatched = (seasonNum: number, isWatched: boolean) => {
      const updatedSeasons = seasons.map(season => {
          if (season.season_number !== seasonNum || !season.episodes) return season;
          return {
              ...season,
              episodes: season.episodes.map(ep => ({ ...ep, isWatched }))
          };
      });
      setSeasons(updatedSeasons);
      onUpdate(movie.id, { seasons: updatedSeasons });
  };


  let posterUrl = `https://picsum.photos/seed/${movie.posterSeed}/300/450`;
  if (movie.posterPath) {
      if (movie.posterPath.startsWith('http')) {
          posterUrl = movie.posterPath;
      } else {
          posterUrl = `https://image.tmdb.org/t/p/w500${movie.posterPath}`;
      }
  }
  
  const backdropUrl = posterUrl;

  const getTypeColor = () => {
      if (movie.mediaType === 'book') return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
      if (movie.mediaType === 'tv') return 'text-purple-400 border-purple-500/50 bg-purple-500/10';
      return 'text-indigo-400 border-indigo-500/50 bg-indigo-500/10';
  };

  const getTypeName = () => {
      if (movie.mediaType === 'book') return 'Book';
      if (movie.mediaType === 'tv') return 'TV Series';
      return 'Movie';
  };

  const ProviderList = ({ title, items }: { title: string, items: any[] }) => {
      if (!items || items.length === 0) return null;
      return (
          <div className="mb-3">
              <span className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">{title}</span>
              <div className="flex flex-wrap gap-2">
                  {items.map(p => (
                      <div key={p.providerId} className="relative group/provider">
                         <img 
                           src={`https://image.tmdb.org/t/p/original${p.logoPath}`} 
                           alt={p.providerName} 
                           className="w-8 h-8 rounded-lg shadow-sm border border-white/5 cursor-help"
                         />
                      </div>
                  ))}
              </div>
          </div>
      )
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
      
      {/* 1. Cinematic Header / Backdrop */}
      <div className="relative w-full h-[35vh] md:h-[400px] overflow-hidden">
          {/* Blurred Backdrop */}
          <div className="absolute inset-0 bg-slate-900">
             <img src={backdropUrl} className="w-full h-full object-cover opacity-30 blur-xl scale-110" alt="" />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
          </div>

          {/* Nav Bar Overlay */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 bg-black/30 hover:bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full transition-all border border-white/10 text-sm font-medium"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <button 
                    onClick={handleShare}
                    className="p-2 bg-black/30 hover:bg-black/50 backdrop-blur-md text-white rounded-full transition-all border border-white/10"
                >
                    <Share2 size={18} />
                </button>
          </div>

          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-10 flex flex-row gap-4 md:gap-6 items-end z-10 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pt-20">
              {/* Poster (Visible on all sizes, resized for mobile) */}
              <div className="w-24 md:w-40 aspect-[2/3] rounded-lg shadow-2xl border border-white/10 overflow-hidden shrink-0 mb-1 md:mb-8">
                  <img src={posterUrl} className="w-full h-full object-cover" alt={movie.title} />
              </div>

              {/* Text Info */}
              <div className="flex-1 space-y-2 mb-2 min-w-0">
                   <div className="flex items-center gap-3 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getTypeColor()}`}>
                            {getTypeName()}
                        </span>
                        {movie.tmdbRating && (
                             <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                                 <Star size={12} fill="currentColor"/> {movie.tmdbRating.toFixed(1)}
                             </span>
                        )}
                   </div>
                   <h1 className="text-2xl md:text-5xl font-bold text-white leading-tight shadow-black drop-shadow-lg line-clamp-2 md:line-clamp-none">{movie.title}</h1>
                   <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-300 text-sm font-medium">
                       <span>{movie.year}</span>
                       <span>•</span>
                       <span className="line-clamp-1">{movie.genre.join(', ')}</span>
                       {movie.director && (
                           <>
                               <span className="hidden md:inline">•</span>
                               <span className="text-slate-400 hidden md:inline">{movie.director}</span>
                           </>
                       )}
                   </div>
              </div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6 md:pt-16 flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-8 md:gap-10">
          
          {/* Sidebar Area (Mobile: First, Desktop: Right) */}
          <div className="order-1 lg:order-2 space-y-6">
               
               {/* Stats / Metadata Box */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-5 space-y-4">
                      <div className="flex justify-between py-2 border-b border-slate-800/50">
                          <span className="text-slate-500 text-sm font-medium">Added</span>
                          <span className="text-slate-200 font-mono text-sm font-bold">{new Date(movie.addedAt).toLocaleDateString()}</span>
                      </div>
                      {movie.pageCount && (
                          <div className="flex justify-between py-2 border-b border-slate-800/50">
                              <span className="text-slate-500 text-sm font-medium">Pages</span>
                              <span className="text-slate-200 font-mono text-sm font-bold">{movie.pageCount}</span>
                          </div>
                      )}
                       {movie.director && (
                          <div className="flex justify-between py-2 border-b border-slate-800/50">
                              <span className="text-slate-500 text-sm font-medium">{movie.mediaType === 'book' ? 'Author' : 'Director'}</span>
                              <span className="text-slate-200 font-mono text-sm font-bold truncate max-w-[150px]">{movie.director}</span>
                          </div>
                      )}
                  </div>
                  
                  <button 
                        onClick={handleDeleteClick}
                        className={`w-full py-4 text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2
                            ${isDeleting 
                                ? 'bg-red-600 text-white hover:bg-red-700' 
                                : 'bg-slate-950 text-red-400 hover:bg-red-950/30 hover:text-red-300'
                            }
                        `}
                    >
                        {isDeleting ? (
                            <>
                                <AlertTriangle size={14} /> Confirm Delete?
                            </>
                        ) : (
                            <>
                                <Trash2 size={14} /> Delete from Library
                            </>
                        )}
                    </button>
              </div>

               {movie.mediaType !== 'book' && (loadingProviders || (providers && (providers.flatrate.length > 0 || providers.rent.length > 0 || providers.buy.length > 0))) && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                          <span>Where to Watch</span>
                      </h3>
                      
                      {loadingProviders ? (
                          <div className="flex gap-2 animate-pulse">
                              <div className="h-10 w-10 bg-slate-800 rounded-lg"></div>
                              <div className="h-10 w-10 bg-slate-800 rounded-lg"></div>
                          </div>
                      ) : providers ? (
                          <div className="space-y-4">
                            <ProviderList title="Stream" items={providers.flatrate} />
                            <ProviderList title="Rent" items={providers.rent} />
                            <ProviderList title="Buy" items={providers.buy} />
                          </div>
                      ) : null}
                  </div>
              )}
          </div>
          
          {/* Main Column (Mobile: Second, Desktop: Left) */}
          <div className="order-2 lg:order-1 space-y-8 md:space-y-10">
              
              {/* Overview */}
              <section>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><FileText size={18} className="text-indigo-400"/> Overview</h3>
                  <p className="text-slate-300 leading-relaxed text-base md:text-lg">
                      {movie.description}
                  </p>
              </section>

              {/* Status & Review Card */}
              <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Star size={100} className="text-white" />
                  </div>
                  
                  <div className="flex items-center justify-between mb-6 relative z-10">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2">
                           Your Review
                           {hasChanges && <span className="text-xs font-normal text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full animate-pulse">• Unsaved changes</span>}
                       </h3>
                       {hasChanges && (
                           <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all">
                               Save Changes
                           </button>
                       )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                      <div className="space-y-6">
                           <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                               <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                                   {(['watchlist', 'watched', 'dropped'] as MovieStatus[]).map(s => (
                                       <button
                                           key={s}
                                           onClick={() => {
                                               setStatus(s);
                                               if (s !== 'watchlist') setPlannedDate('');
                                           }}
                                           className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${
                                               status === s 
                                                   ? s === 'watched' ? 'bg-emerald-600 text-white shadow-lg' 
                                                   : s === 'watchlist' ? 'bg-blue-600 text-white shadow-lg' 
                                                   : 'bg-red-600 text-white shadow-lg'
                                                   : 'text-slate-400 hover:text-white'
                                           }`}
                                       >
                                           {s}
                                       </button>
                                   ))}
                               </div>
                           </div>
                           
                           <div className={`transition-all duration-300 ${status === 'watchlist' ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rating</label>
                               <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                                    <StarRating rating={rating} onChange={setRating} size={28} />
                                    <span className="text-xl font-bold text-white">{rating > 0 ? rating : '-'}</span>
                               </div>
                           </div>
                           
                           {status === 'watchlist' && (
                               <div className="animate-in fade-in slide-in-from-top-2">
                                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Planned Date</label>
                                   <input 
                                       type="date" 
                                       value={plannedDate}
                                       onChange={(e) => setPlannedDate(e.target.value)}
                                       className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                   />
                               </div>
                           )}
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes</label>
                          <textarea 
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                className="w-full h-full min-h-[160px] bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none leading-relaxed"
                                placeholder={status === 'watchlist' ? "Add notes about why you want to watch this..." : "Write your personal review..."}
                          />
                      </div>
                  </div>
              </section>

              {/* TV Seasons */}
              {movie.mediaType === 'tv' && seasons.length > 0 && (
                   <section>
                       <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Tv size={18} className="text-purple-400"/> Seasons & Episodes</h3>
                       <div className="space-y-3">
                            {seasons.map(season => {
                                 const isOpen = activeSeasonNumber === season.season_number;
                                 const watchedCount = season.episodes?.filter(e => e.isWatched).length || 0;
                                 const totalCount = season.episodes ? season.episodes.length : season.episode_count;
                                 const progress = totalCount > 0 ? (watchedCount / totalCount) * 100 : 0;
                                 const isFullyWatched = totalCount > 0 && watchedCount === totalCount;

                                 return (
                                     <div key={season.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                                         <button 
                                            onClick={() => toggleSeason(season.season_number)}
                                            className={`w-full flex items-center justify-between p-4 transition-colors ${isOpen ? 'bg-slate-800' : 'hover:bg-slate-800/50'}`}
                                         >
                                             <div className="flex items-center gap-4">
                                                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm border ${isFullyWatched ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                                     {isFullyWatched ? <Check size={18} /> : season.season_number}
                                                 </div>
                                                 <div className="text-left">
                                                     <div className="font-bold text-slate-200 text-sm md:text-base">{season.name}</div>
                                                     <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                                         <span>{season.episode_count} Episodes</span>
                                                         {season.episodes && (
                                                             <span className={isFullyWatched ? 'text-emerald-500' : 'text-indigo-400'}>
                                                                 • {watchedCount} / {totalCount} Watched
                                                             </span>
                                                         )}
                                                     </div>
                                                 </div>
                                             </div>
                                             {isOpen ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                                         </button>
                                         
                                         {(watchedCount > 0 || isOpen) && (
                                              <div className="h-0.5 bg-slate-800 w-full">
                                                  <div 
                                                    className={`h-full transition-all duration-500 ${isFullyWatched ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                                    style={{ width: `${progress}%` }} 
                                                  />
                                              </div>
                                         )}

                                         {isOpen && (
                                             <div className="p-0 border-t border-slate-800">
                                                 {loadingSeason ? (
                                                     <div className="flex justify-center py-8">
                                                         <Loader2 className="animate-spin text-indigo-500" size={24} />
                                                     </div>
                                                 ) : season.episodes ? (
                                                     <div>
                                                         <div className="p-3 bg-slate-950/50 flex justify-end border-b border-slate-800">
                                                             <button 
                                                                onClick={() => markSeasonWatched(season.season_number, !isFullyWatched)}
                                                                className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
                                                             >
                                                                 {isFullyWatched ? 'Mark Unwatched' : 'Mark All Watched'}
                                                             </button>
                                                         </div>
                                                         <div className="divide-y divide-slate-800">
                                                            {season.episodes.map(episode => (
                                                                <div 
                                                                    key={episode.id} 
                                                                    onClick={() => toggleEpisodeWatched(season.season_number, episode.id)}
                                                                    className={`flex gap-4 p-4 cursor-pointer transition-colors group ${episode.isWatched ? 'bg-emerald-900/5 hover:bg-emerald-900/10' : 'hover:bg-slate-800/50'}`}
                                                                >
                                                                    <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${episode.isWatched ? 'bg-emerald-500 border-emerald-500 scale-110' : 'border-slate-600 group-hover:border-slate-400'}`}>
                                                                        {episode.isWatched && <Check size={12} className="text-white" />}
                                                                    </div>
                                                                    <div className="flex-grow min-w-0">
                                                                        <div className="flex justify-between items-start">
                                                                            <span className={`font-medium text-sm ${episode.isWatched ? 'text-slate-500 line-through decoration-slate-600' : 'text-slate-200'}`}>
                                                                                {episode.episode_number}. {episode.name}
                                                                            </span>
                                                                            <span className="text-[10px] text-slate-600 font-mono">
                                                                                {episode.air_date ? new Date(episode.air_date).toLocaleDateString() : ''}
                                                                            </span>
                                                                        </div>
                                                                        {episode.overview && (
                                                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{episode.overview}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                         </div>
                                                     </div>
                                                 ) : (
                                                     <div className="text-center py-4 text-slate-500 text-sm">
                                                         Unable to load episodes.
                                                     </div>
                                                 )}
                                             </div>
                                         )}
                                     </div>
                                 );
                             })}
                       </div>
                   </section>
              )}
          </div>
      </div>
    </div>
  );
};

export default MovieDetails;