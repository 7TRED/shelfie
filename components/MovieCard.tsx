import React from 'react';
import { Movie } from '../types';
import { Tv, Film, Star, CheckCircle, Clock, Calendar, Book, Plus, X } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
  onStatusChange?: (movie: Movie) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, onStatusChange }) => {
  let posterUrl = `https://picsum.photos/seed/${movie.posterSeed}/200/300`;

  if (movie.posterPath) {
      // Check if it's a full URL (Google Books) or partial (TMDB)
      if (movie.posterPath.startsWith('http')) {
          posterUrl = movie.posterPath;
      } else {
          posterUrl = `https://image.tmdb.org/t/p/w200${movie.posterPath}`;
      }
  }
    
  const scheduledDate = movie.plannedDate 
    ? new Date(movie.plannedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
    : null;

  const getTypeIcon = () => {
    switch (movie.mediaType) {
        case 'book': return <Book size={10} />;
        case 'tv': return <Tv size={10} />;
        default: return <Film size={10} />;
    }
  };

  const getTypeColor = () => {
    switch (movie.mediaType) {
        case 'book': return 'bg-amber-600/90';
        case 'tv': return 'bg-purple-600/90';
        default: return 'bg-indigo-600/90';
    }
  };

  const handleStatusClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onStatusChange) {
          onStatusChange(movie);
      }
  };

  const isWatchlist = movie.status === 'watchlist';
  const isWatched = movie.status === 'watched';
  const isDropped = movie.status === 'dropped';

  return (
    <div 
      onClick={() => onClick(movie)}
      className="group flex gap-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl p-3 transition-all cursor-pointer shadow-sm hover:shadow-md h-full relative"
    >
      {/* Poster Image */}
      <div className="relative flex-shrink-0 w-24 sm:w-28 aspect-[2/3] rounded-lg overflow-hidden bg-slate-950 shadow-inner">
        <img 
          src={posterUrl} 
          alt={movie.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-1 left-1">
             <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase backdrop-blur-md shadow-sm text-white ${getTypeColor()}`}>
                {getTypeIcon()}
            </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow min-w-0 py-1">
        <div className="flex justify-between items-start gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-tight truncate pr-2 group-hover:text-indigo-300 transition-colors">
                {movie.title}
            </h3>
            {movie.rating > 0 && (
                <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded text-yellow-500 text-xs font-bold whitespace-nowrap border border-yellow-500/20">
                    <Star size={10} fill="currentColor" /> {movie.rating}
                </div>
            )}
        </div>

        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>{movie.year}</span>
            {movie.director && (
                <>
                    <span className="w-0.5 h-0.5 bg-slate-600 rounded-full"/>
                    <span className="truncate max-w-[150px]">{movie.director}</span>
                </>
            )}
        </div>

        <div className="flex flex-wrap gap-1 mt-2 mb-2">
            {movie.genre.slice(0, 3).map(g => (
                <span key={g} className="text-[10px] px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">
                    {g}
                </span>
            ))}
        </div>

        <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-auto">
            {movie.description}
        </p>

        {/* Footer Status Indicator */}
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
             {/* Quick Action Button */}
             {onStatusChange ? (
                <button
                    onClick={handleStatusClick}
                    className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm
                        ${isWatchlist 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 group/btn' 
                            : isWatched
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 group/btn'
                                : isDropped
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 group/btn'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-500 border border-transparent shadow-indigo-500/20'
                        }
                    `}
                >
                    {isWatchlist && (
                        <>
                            <Clock size={14} className="group-hover/btn:hidden" />
                            <CheckCircle size={14} className="hidden group-hover/btn:block" />
                            <span className="group-hover/btn:hidden">In Watchlist</span>
                            <span className="hidden group-hover/btn:inline">Mark Completed</span>
                        </>
                    )}
                    {isWatched && (
                        <>
                            <CheckCircle size={14} className="group-hover/btn:hidden" />
                            <Plus size={14} className="hidden group-hover/btn:block" />
                            <span className="group-hover/btn:hidden">Completed</span>
                            <span className="hidden group-hover/btn:inline">Re-add Watchlist</span>
                        </>
                    )}
                    {isDropped && (
                        <>
                            <X size={14} className="group-hover/btn:hidden" />
                            <Plus size={14} className="hidden group-hover/btn:block" />
                            <span className="group-hover/btn:hidden">Dropped</span>
                            <span className="hidden group-hover/btn:inline">Re-add Watchlist</span>
                        </>
                    )}
                    {!isWatchlist && !isWatched && !isDropped && (
                         <>
                            <Plus size={14} />
                            Add to Watchlist
                        </>
                    )}
                </button>
             ) : (
                <div className={`text-xs font-medium flex items-center gap-1.5 ${
                    isWatched ? 'text-emerald-400' : 
                    isWatchlist ? 'text-blue-400' : 
                    isDropped ? 'text-red-400' : 'text-slate-500'
                }`}>
                    {isWatched ? <CheckCircle size={12}/> : 
                     isDropped ? <X size={12}/> : <Clock size={12}/>}
                    <span className="capitalize">{isWatched ? 'Completed' : movie.status}</span>
                </div>
             )}

            {scheduledDate && (
                <span className="flex items-center gap-1 text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 text-[10px] font-bold">
                    <Calendar size={10} /> {scheduledDate}
                </span>
            )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;