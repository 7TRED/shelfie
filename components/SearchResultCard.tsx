import React from 'react';
import { SearchResult, MovieStatus } from '../types';
import { Plus, ImageOff, Star, Tv, Film, Check, CheckCircle, Book } from 'lucide-react';

interface SearchResultCardProps {
  result: SearchResult;
  onAdd: (status: MovieStatus) => void;
  status?: MovieStatus;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ result, onAdd, status }) => {
  // Logic to handle different image sources (TMDB uses relative path, Google Books uses absolute URL)
  let posterUrl = null;
  if (result.posterPath) {
      if (result.posterPath.startsWith('http')) {
          posterUrl = result.posterPath;
      } else {
          posterUrl = `https://image.tmdb.org/t/p/w200${result.posterPath}`;
      }
  }

  const getBadgeColor = () => {
      if (result.mediaType === 'book') return 'bg-amber-600/90 text-white';
      if (result.mediaType === 'tv') return 'bg-purple-600/90 text-white';
      return 'bg-indigo-600/90 text-white';
  };

  const getIcon = () => {
      if (result.mediaType === 'book') return <Book size={10} />;
      if (result.mediaType === 'tv') return <Tv size={10} />;
      return <Film size={10} />;
  };

  return (
    <div className={`flex gap-4 bg-slate-800 rounded-lg p-3 border transition-colors ${status ? 'border-indigo-500/30 bg-slate-800/80' : 'border-slate-700 hover:border-indigo-500/50'}`}>
      {/* Small Poster Preview */}
      <div className="flex-shrink-0 w-20 h-32 bg-slate-900 rounded overflow-hidden relative shadow-md">
        {posterUrl ? (
             <img src={posterUrl} alt={result.title} className="w-full h-full object-cover" />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-700">
                <ImageOff size={24} />
            </div>
        )}
        {/* Media Type Badge Overlay */}
        <div className={`absolute top-1 left-1 backdrop-blur-sm text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 uppercase ${getBadgeColor()}`}>
            {getIcon()}
            {result.mediaType === 'tv' ? 'TV' : result.mediaType === 'book' ? 'Book' : 'Movie'}
        </div>
      </div>

      <div className="flex flex-col flex-grow min-w-0">
        <div className="mb-1">
          <div className="flex justify-between items-start gap-2">
             <h4 className="font-bold text-white text-base leading-tight line-clamp-2">{result.title}</h4>
             {result.voteAverage > 0 && (
                 <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold whitespace-nowrap bg-yellow-500/10 px-1.5 py-0.5 rounded shrink-0">
                     <Star size={10} fill="currentColor" /> {result.voteAverage.toFixed(1)}
                 </div>
             )}
          </div>
          <p className="text-slate-400 text-xs mt-1">
              {result.year} {result.director && `• ${result.director}`}
          </p>
        </div>
        
        <p className="text-slate-500 text-xs mb-3 line-clamp-2 flex-grow">{result.description}</p>
        
        {status === 'watched' ? (
            <div className="mt-auto bg-emerald-900/20 text-emerald-400 border border-emerald-500/30 py-1.5 px-3 rounded text-center text-xs font-bold flex items-center justify-center gap-2 select-none">
                <CheckCircle size={14} /> Completed
            </div>
        ) : status === 'watchlist' ? (
             <div className="flex gap-2 mt-auto animate-in fade-in duration-300">
                <div className="flex-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded flex items-center justify-center gap-1.5 text-xs font-bold select-none cursor-default">
                    <Check size={14} /> Tracking
                </div>
                <button
                    onClick={() => onAdd('watched')}
                    className="flex-1 bg-slate-700 hover:bg-emerald-600 hover:text-white text-slate-200 py-1.5 rounded text-xs font-medium transition-all"
                >
                    Finish
                </button>
            </div>
        ) : (
            <div className="flex gap-2 mt-auto">
                <button
                    onClick={() => onAdd('watchlist')}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-all active:scale-95"
                >
                    <Plus size={14} /> Track
                </button>
                <button
                    onClick={() => onAdd('watched')}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-1.5 rounded text-xs font-medium transition-all active:scale-95"
                >
                    Finished
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultCard;
