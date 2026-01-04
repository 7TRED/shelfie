import React, { useState } from 'react';
import { Movie } from '../types';
import { X, Film, Tv, Clock, AlertCircle } from 'lucide-react';

interface PlannerProps {
  movies: Movie[];
  onUpdate: (id: string, updates: Partial<Movie>) => void;
  onOpenDetails: (movie: Movie) => void;
}

const Planner: React.FC<PlannerProps> = ({ movies, onUpdate, onOpenDetails }) => {
  // Group movies
  const watchlist = movies.filter(m => m.status === 'watchlist');
  const scheduled = watchlist.filter(m => m.plannedDate).sort((a, b) => (a.plannedDate! > b.plannedDate! ? 1 : -1));
  const unscheduled = watchlist.filter(m => !m.plannedDate);

  // Generate timeline keys (Overdue, Today, Upcoming dates...)
  const today = new Date().toISOString().split('T')[0];
  
  const getTimeline = () => {
    const groups: Record<string, Movie[]> = {};
    
    // Seed with next 7 days
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        groups[dateStr] = [];
    }

    // Populate with scheduled movies
    scheduled.forEach(m => {
        if (!m.plannedDate) return;
        if (m.plannedDate < today) {
            if (!groups['overdue']) groups['overdue'] = [];
            groups['overdue'].push(m);
        } else {
            if (!groups[m.plannedDate]) groups[m.plannedDate] = [];
            groups[m.plannedDate].push(m);
        }
    });

    // Sort dates
    return Object.entries(groups).sort((a, b) => {
        if (a[0] === 'overdue') return -1;
        if (b[0] === 'overdue') return 1;
        return a[0].localeCompare(b[0]);
    });
  };

  const timeline = getTimeline();

  const handleDateChange = (id: string, date: string) => {
    onUpdate(id, { plannedDate: date });
  };

  const removeDate = (id: string) => {
      onUpdate(id, { plannedDate: undefined });
  };

  const formatDateLabel = (dateStr: string) => {
      if (dateStr === 'overdue') return 'Overdue / Previous';
      
      const todayDate = new Date();
      todayDate.setHours(0,0,0,0);
      
      // Reset time for accurate compare
      const d = new Date(dateStr + 'T00:00:00'); 
      
      if (dateStr === today) return 'Today';
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';

      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // --- Components ---

  const PlannerCard = ({ movie, isCompact = false }: { movie: Movie, isCompact?: boolean }) => {
      const [isEditing, setIsEditing] = useState(false);
      const tmdbBaseUrl = 'https://image.tmdb.org/t/p/w200';
      const posterUrl = movie.posterPath 
        ? `${tmdbBaseUrl}${movie.posterPath}`
        : `https://picsum.photos/seed/${movie.posterSeed}/200/300`;

      return (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 flex gap-3 group hover:border-indigo-500/50 transition-all shadow-sm">
              <div 
                onClick={() => onOpenDetails(movie)}
                className="w-12 h-16 flex-shrink-0 rounded bg-slate-900 overflow-hidden cursor-pointer"
              >
                  <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-grow min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-start">
                    <h4 
                        onClick={() => onOpenDetails(movie)}
                        className="font-bold text-slate-200 text-sm truncate cursor-pointer hover:text-indigo-400"
                    >
                        {movie.title}
                    </h4>
                    {!isCompact && (
                        <button 
                            onClick={() => removeDate(movie.id)}
                            className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Unschedule"
                        >
                            <X size={14} />
                        </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      {movie.mediaType === 'movie' ? <Film size={10}/> : <Tv size={10}/>}
                      <span>{movie.mediaType === 'movie' ? 'Movie' : 'TV'}</span>
                      <span>•</span>
                      <span>{movie.year}</span>
                  </div>

                  {/* Date Picker Overlay / Inline */}
                  <div className="mt-2">
                    {isCompact || isEditing ? (
                        <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                             <input 
                                type="date" 
                                className="bg-slate-900 border border-slate-600 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                                value={movie.plannedDate || ''}
                                onChange={(e) => {
                                    handleDateChange(movie.id, e.target.value);
                                    setIsEditing(false);
                                }}
                             />
                             {isEditing && (
                                 <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white"><X size={14}/></button>
                             )}
                        </div>
                    ) : (
                        // Not compact, not editing (Timeline view)
                         <div className="text-xs text-slate-400 font-mono">
                            {/* Actions if needed */}
                         </div>
                    )}
                    
                    {isCompact && !isEditing && (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="text-xs text-indigo-400 hover:text-white font-medium flex items-center gap-1"
                        >
                            <Clock size={12} /> Schedule
                        </button>
                    )}
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div className="mb-6 pb-6 border-b border-white/5">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            Planner
            <span className="text-base font-normal text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                {scheduled.length} Scheduled
            </span>
        </h2>
        <p className="text-slate-400 mt-1">
            Organize your watchlist and decide what to watch next.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Timeline */}
          <div className="flex-grow space-y-8">
              {timeline.map(([date, items]) => {
                  const label = formatDateLabel(date);
                  const isOverdue = date === 'overdue';
                  // Hide empty days that are not Today/Tomorrow if you prefer compact view
                  // But keeping 7 days visible encourages planning.
                  
                  return (
                      <div key={date} className={`relative pl-8 border-l-2 ${isOverdue ? 'border-red-500/30' : date === today ? 'border-indigo-500' : 'border-slate-800'}`}>
                          {/* Node on Timeline */}
                          <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${isOverdue ? 'bg-red-900 border-red-500' : date === today ? 'bg-indigo-900 border-indigo-500' : 'bg-slate-900 border-slate-700'}`} />
                          
                          <div className="mb-4">
                              <h3 className={`text-sm font-bold uppercase tracking-wide mb-3 ${isOverdue ? 'text-red-400' : date === today ? 'text-indigo-400' : 'text-slate-400'}`}>
                                  {label} <span className="text-slate-600 font-normal normal-case ml-2">{date !== 'overdue' ? date : ''}</span>
                              </h3>
                              
                              <div className="space-y-3">
                                  {items.length > 0 ? (
                                      items.map(movie => (
                                          <PlannerCard key={movie.id} movie={movie} />
                                      ))
                                  ) : (
                                      <div className="h-16 border-2 border-dashed border-slate-800/50 rounded-lg flex items-center justify-center text-slate-600 text-xs">
                                          Nothing scheduled
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>

          {/* Unscheduled Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0">
              <div className="sticky top-24 bg-slate-900/50 border border-slate-800 rounded-xl p-4 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
                  <h3 className="font-bold text-white mb-4 flex items-center justify-between">
                      <span>Unscheduled</span>
                      <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{unscheduled.length}</span>
                  </h3>
                  
                  {unscheduled.length > 0 ? (
                      <div className="space-y-3">
                          {unscheduled.map(movie => (
                              <PlannerCard key={movie.id} movie={movie} isCompact />
                          ))}
                      </div>
                  ) : (
                      <div className="text-center py-8 text-slate-500 text-sm">
                          <AlertCircle className="mx-auto mb-2 opacity-50" size={24}/>
                          Your watchlist is all planned out!
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Planner;