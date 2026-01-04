import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ViewState, Movie, SearchResult, MovieStatus, MediaType } from './types';
import * as movieService from './services/movieService';
import MovieCard from './components/MovieCard';
import MovieDetails from './components/MovieDetails';
import Planner from './components/Planner';
import SearchResultCard from './components/SearchResultCard';
import ManualEntryModal from './components/ManualEntryModal';
import Stats from './components/Stats';
import { Search, Library, Clock, BarChart2, Film, AlertCircle, Loader2, PlusCircle, Tv, Filter, X, ChevronRight, Book, CalendarDays, Settings, Download, Upload, Share2, Layers, PlayCircle, BookOpen, Check } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.LIBRARY);
  const [previousView, setPreviousView] = useState<ViewState>(ViewState.LIBRARY);
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'visual' | 'book'>('visual');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Selection & Details
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);

  // Filters
  const [mediaFilter, setMediaFilter] = useState<'all' | 'movie' | 'tv' | 'book'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'watchlist' | 'watched' | 'dropped'>('all');
  const [genreFilter, setGenreFilter] = useState<string>('All');
  
  // Pagination State
  const [displayLimit, setDisplayLimit] = useState(24);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize DB
  useEffect(() => {
    const init = async () => {
        try {
            await movieService.initStorage();
            const loaded = await movieService.getLibrary();
            setMovies(loaded);
        } catch (e) {
            console.error("Failed to load library", e);
        } finally {
            setIsLoading(false);
        }
    };
    init();
  }, []);

  useEffect(() => {
    if (view !== ViewState.DETAILS) {
        setMediaFilter('all');
        setStatusFilter('all');
        setGenreFilter('All');
        setSearchQuery('');
        setSearchResults([]);
        setSearchScope('visual');
    }
  }, [view]);

  // Reset pagination when view or filters change
  useEffect(() => {
    setDisplayLimit(24);
  }, [view, mediaFilter, statusFilter, genreFilter, searchQuery]);

  // --- Derived Data ---

  const selectedMovie = useMemo(() => 
    movies.find(m => m.id === selectedMovieId), 
  [movies, selectedMovieId]);

  const availableGenres = useMemo(() => {
    if (view === ViewState.SEARCH || view === ViewState.STATS || view === ViewState.DETAILS || view === ViewState.PLANNER) return [];

    // Library now includes everything, Watchlist is filtered
    const relevantItems = view === ViewState.WATCHLIST 
        ? movies.filter(m => m.status === 'watchlist') 
        : movies;
    
    const genreSet = new Set<string>();
    relevantItems.forEach(item => {
        item.genre.forEach(g => genreSet.add(g));
    });
    
    return ['All', ...Array.from(genreSet).sort()];
  }, [movies, view]);

  const displayedMovies = useMemo(() => {
    let filtered = movies;

    if (view === ViewState.LIBRARY) {
        // Apply Status Filter in Library View
        if (statusFilter !== 'all') {
            filtered = filtered.filter(m => m.status === statusFilter);
        }
    } else if (view === ViewState.WATCHLIST) {
        filtered = filtered.filter(m => m.status === 'watchlist');
    } else if (view === ViewState.DETAILS || view === ViewState.PLANNER) {
         return [];
    } else {
        return [];
    }

    if (mediaFilter !== 'all') {
        filtered = filtered.filter(m => m.mediaType === mediaFilter);
    }

    if (genreFilter !== 'All') {
        filtered = filtered.filter(m => m.genre.includes(genreFilter));
    }

    // Sort by addedAt desc for consistency
    return filtered.sort((a, b) => b.addedAt - a.addedAt);
  }, [movies, view, mediaFilter, genreFilter, statusFilter]);

  // Infinite Scroll Pagination Slicing
  const visibleMovies = useMemo(() => {
      if (view === ViewState.LIBRARY || view === ViewState.WATCHLIST) {
          return displayedMovies.slice(0, displayLimit);
      }
      return displayedMovies;
  }, [displayedMovies, displayLimit, view]);

  // Infinite Scroll Observer Setup
  useEffect(() => {
    if ((view !== ViewState.LIBRARY && view !== ViewState.WATCHLIST) || visibleMovies.length === displayedMovies.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting) {
                setDisplayLimit((prev) => prev + 24);
            }
        },
        { threshold: 0.1, rootMargin: '200px' }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
        observer.observe(currentRef);
    }

    return () => {
        if (currentRef) observer.unobserve(currentRef);
    };
  }, [view, visibleMovies.length, displayedMovies.length]);

  const upNext = useMemo(() => {
      if (view !== ViewState.LIBRARY && view !== ViewState.WATCHLIST) return null;
      
      const watchlist = movies.filter(m => m.status === 'watchlist');
      
      const getTop = (types: MediaType[]) => {
          const items = watchlist.filter(m => types.includes(m.mediaType));
          return items.sort((a, b) => {
              // Priority 1: Planned Date (Soonest first)
              if (a.plannedDate && b.plannedDate) return a.plannedDate.localeCompare(b.plannedDate);
              // Priority 2: Planned items come before unplanned
              if (a.plannedDate && !b.plannedDate) return -1;
              if (!a.plannedDate && b.plannedDate) return 1;
              // Priority 3: Added Date (Oldest first)
              return a.addedAt - b.addedAt;
          })[0];
      };

      return {
          visual: getTop(['movie', 'tv']),
          book: getTop(['book'])
      };
  }, [movies, view]);


  // --- Handlers ---

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setView(ViewState.SEARCH);
    
    let results: SearchResult[] = [];
    
    if (searchScope === 'book') {
        results = await movieService.searchBooksOpenLibrary(searchQuery);
    } else {
        results = await movieService.searchMoviesTMDB(searchQuery);
    }
    
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleAddMovie = async (result: SearchResult, targetStatus: MovieStatus) => {
    // Generate UUID or use timestamp if numeric ID provided
    const newId = crypto.randomUUID();
    
    const newMovie: Movie = {
        id: newId,
        tmdbId: typeof result.id === 'number' ? result.id : undefined,
        openLibraryId: typeof result.id === 'string' ? result.id : undefined,
        title: result.title,
        year: result.year,
        genre: result.genre,
        description: result.description,
        director: result.director,
        status: targetStatus,
        rating: 0,
        posterPath: result.posterPath,
        posterSeed: Math.floor(Math.random() * 1000),
        addedAt: Date.now(),
        mediaType: result.mediaType,
        tmdbRating: result.voteAverage,
        pageCount: result.pageCount
    };

    let movieToSave: Movie | undefined;

    setMovies(prev => {
        // Check for duplicates
        const existingIndex = prev.findIndex(m => 
            (m.tmdbId && m.tmdbId === newMovie.tmdbId) || 
            (m.openLibraryId && m.openLibraryId === newMovie.openLibraryId)
        );

        if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], status: targetStatus };
            movieToSave = updated[existingIndex];
            return updated;
        }
        
        movieToSave = newMovie;
        return [newMovie, ...prev];
    });

    if (movieToSave) {
        await movieService.saveMovie(movieToSave);
    }
  };

  const updateMovieDetails = async (id: string, updates: Partial<Movie>) => {
    let updatedMovie: Movie | undefined;
    setMovies(prev => prev.map(m => {
        if (m.id === id) {
            updatedMovie = { ...m, ...updates };
            return updatedMovie;
        }
        return m;
    }));

    if (updatedMovie) {
        await movieService.saveMovie(updatedMovie);
    }
  };

  const handleQuickStatusUpdate = async (movie: Movie) => {
      // Toggle logic:
      // If NOT in watchlist -> Move to Watchlist
      // If IN watchlist -> Mark as Watched
      const newStatus: MovieStatus = movie.status === 'watchlist' ? 'watched' : 'watchlist';
      const updates: Partial<Movie> = { status: newStatus };
      if (newStatus === 'watched') {
          updates.plannedDate = undefined; // Clear plan if watched
      }
      
      await updateMovieDetails(movie.id, updates);
  };

  const deleteMovie = async (id: string) => {
      setMovies(prev => prev.filter(m => m.id !== id));
      await movieService.deleteMovie(id);
  };

  const handleOpenDetails = (movie: Movie) => {
      setSelectedMovieId(movie.id);
      setPreviousView(view); 
      setView(ViewState.DETAILS);
  };

  const handleBackFromDetails = () => {
      setSelectedMovieId(null);
      setView(previousView === ViewState.SEARCH ? ViewState.LIBRARY : previousView);
  };
  
  const handleExport = () => {
      movieService.exportData(movies);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          const importedMovies = await movieService.importData(file);
          if (confirm(`Found ${importedMovies.length} items. Replace library?`)) {
              setMovies(importedMovies);
              await movieService.overwriteLibrary(importedMovies);
              setIsSettingsOpen(false);
          }
      } catch (err) {
          alert('Failed to import file.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (isLoading) {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin mb-4 text-indigo-500" size={40} />
              <p>Loading Shelfie...</p>
          </div>
      )
  }

  const NavItem = ({ targetView, icon: Icon, label }: any) => {
    const isActive = (view === targetView) || (view === ViewState.DETAILS && previousView === targetView);
    return (
        <button
        onClick={() => setView(targetView)}
        className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-full
            ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}
        `}
        >
        {isActive && (
            <span className="absolute inset-0 bg-slate-800 rounded-full -z-10 animate-in fade-in zoom-in-95 duration-200" />
        )}
        <Icon size={18} className={isActive ? 'text-indigo-400' : ''} />
        {label}
        </button>
    );
  };

  const MobileNavItem = ({ targetView, icon: Icon, label }: any) => {
    const isActive = (view === targetView) || (view === ViewState.DETAILS && previousView === targetView);
    return (
        <button
            onClick={() => setView(targetView)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
            }`}
        >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="transition-transform active:scale-95"/>
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
        </button>
    );
  };

  const UpNextCard = ({ item, type }: { item: Movie, type: 'visual' | 'book' }) => {
      let posterUrl = `https://picsum.photos/seed/${item.posterSeed}/200/300`;
      if (item.posterPath) {
          if (item.posterPath.startsWith('http')) {
              posterUrl = item.posterPath;
          } else {
              posterUrl = `https://image.tmdb.org/t/p/w200${item.posterPath}`;
          }
      }
      
      const isBook = type === 'book';

      return (
          <div 
            onClick={() => handleOpenDetails(item)}
            className={`flex-1 flex gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
                isBook 
                ? 'bg-amber-900/10 border-amber-500/20 hover:bg-amber-900/20 hover:border-amber-500/40' 
                : 'bg-indigo-900/10 border-indigo-500/20 hover:bg-indigo-900/20 hover:border-indigo-500/40'
            }`}
          >
             <div className="w-12 h-16 shrink-0 rounded-md overflow-hidden bg-slate-950 shadow-sm">
                 <img src={posterUrl} className="w-full h-full object-cover" alt={item.title}/>
             </div>
             <div className="flex flex-col justify-center min-w-0">
                 <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1 ${
                     isBook ? 'text-amber-400' : 'text-indigo-400'
                 }`}>
                     {isBook ? <BookOpen size={10}/> : <PlayCircle size={10}/>}
                     Next to {isBook ? 'Read' : 'Watch'}
                 </span>
                 <h4 className="font-bold text-slate-100 text-sm truncate leading-tight">{item.title}</h4>
                 <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                     {item.plannedDate ? (
                         <span className="text-emerald-400 flex items-center gap-1">
                             <CalendarDays size={10}/> 
                             {new Date(item.plannedDate).toLocaleDateString('en-US', {month:'short', day:'numeric'})}
                         </span>
                     ) : (
                         <span>Added {new Date(item.addedAt).toLocaleDateString()}</span>
                     )}
                 </div>
             </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 pb-24 md:pb-0">
      
      {/* 1. Global Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo */}
            <div 
                className="flex items-center gap-2.5 cursor-pointer group" 
                onClick={() => setView(ViewState.LIBRARY)}
            >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
                    <Layers className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-lg font-bold tracking-tight text-slate-100">
                    Shelfie
                </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1 bg-slate-900/50 p-1 rounded-full border border-white/5">
                <NavItem targetView={ViewState.LIBRARY} icon={Library} label="Library" />
                <NavItem targetView={ViewState.WATCHLIST} icon={Clock} label="Backlog" />
                <NavItem targetView={ViewState.PLANNER} icon={CalendarDays} label="Planner" />
                <NavItem targetView={ViewState.STATS} icon={BarChart2} label="Stats" />
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2">
                 <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                 >
                     <Settings size={20} />
                 </button>

                 <button 
                    onClick={() => setIsManualModalOpen(true)}
                    className="md:hidden p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
                 >
                    <PlusCircle size={24} />
                 </button>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-8">
        
        {/* Search & Command Bar */}
        {view !== ViewState.DETAILS && view !== ViewState.PLANNER && (
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/10 blur-3xl -z-10 rounded-full opacity-50" />
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                    
                    {/* Search Input */}
                    <form onSubmit={handleSearch} className="flex-grow relative group z-10 flex gap-2">
                        {/* Unified Search Bar Container */}
                        <div className="flex flex-grow shadow-lg shadow-black/10 rounded-2xl">
                             <div className="relative flex-grow min-w-0">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={searchScope === 'book' ? "Search Open Library..." : "Search movies & TV..."}
                                    className="block w-full pl-11 pr-2 py-3.5 bg-slate-900/80 border border-slate-800 rounded-l-2xl rounded-r-none text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                            </div>
                            
                            {/* Scope Toggle */}
                            <div className="bg-slate-900/80 border-y border-r border-slate-800 flex items-center px-1 rounded-r-2xl shrink-0">
                                 <button
                                    type="button" 
                                    onClick={() => setSearchScope('visual')}
                                    className={`p-2.5 rounded-xl transition-all ${searchScope === 'visual' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                    title="Movies & TV"
                                 >
                                     <Film size={18} />
                                 </button>
                                 <button 
                                    type="button" 
                                    onClick={() => setSearchScope('book')}
                                    className={`p-2.5 rounded-xl transition-all ${searchScope === 'book' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                    title="Books"
                                 >
                                     <Book size={18} />
                                 </button>
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={isSearching || !searchQuery}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-4 rounded-2xl transition-colors disabled:opacity-50 shrink-0 flex items-center justify-center"
                        >
                            {isSearching ? <Loader2 className="animate-spin" size={20}/> : <ChevronRight size={20} />}
                        </button>
                    </form>

                    <button 
                        onClick={() => setIsManualModalOpen(true)}
                        className="hidden md:flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-5 py-3.5 rounded-2xl font-medium shadow-lg"
                    >
                        <PlusCircle size={18} />
                        <span>Custom</span>
                    </button>
                </div>
            </div>
        )}

        {/* Filter Toolbar */}
        {(view === ViewState.LIBRARY || view === ViewState.WATCHLIST) && (
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-white/5">
                    <div>
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                           {view === ViewState.LIBRARY ? 'Library' : 'Backlog'}
                           <span className="text-base font-normal text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                               {displayedMovies.length}
                           </span>
                        </h2>
                        <p className="text-slate-400 mt-1">
                           {view === ViewState.LIBRARY 
                             ? "All your tracked media in one place." 
                             : "Your queue of media to consume."}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 w-full sm:w-auto">
                        {/* Status Filter (Library Only) */}
                        {view === ViewState.LIBRARY && (
                             <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 w-full sm:w-auto overflow-x-auto scrollbar-hide">
                                <button onClick={() => setStatusFilter('all')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${statusFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}>All</button>
                                <button onClick={() => setStatusFilter('watchlist')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${statusFilter === 'watchlist' ? 'bg-blue-600/20 text-blue-300' : 'text-slate-400 hover:text-slate-200'}`}>Watchlist</button>
                                <button onClick={() => setStatusFilter('watched')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${statusFilter === 'watched' ? 'bg-emerald-600/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'}`}>Completed</button>
                                <button onClick={() => setStatusFilter('dropped')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${statusFilter === 'dropped' ? 'bg-red-600/20 text-red-300' : 'text-slate-400 hover:text-slate-200'}`}>Dropped</button>
                             </div>
                        )}

                        {/* Type Filter */}
                        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 w-full sm:w-auto overflow-x-auto scrollbar-hide">
                            <button onClick={() => setMediaFilter('all')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${mediaFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}>All</button>
                            <button onClick={() => setMediaFilter('movie')} className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${mediaFilter === 'movie' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-200'}`}><Film size={14}/> Movie</button>
                            <button onClick={() => setMediaFilter('tv')} className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${mediaFilter === 'tv' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-slate-200'}`}><Tv size={14}/> TV</button>
                            <button onClick={() => setMediaFilter('book')} className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${mediaFilter === 'book' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}><Book size={14}/> Book</button>
                        </div>
                    </div>
                </div>

                {availableGenres.length > 0 && (
                     <>
                        {/* Mobile/Compact View: Button to open modal */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsGenreModalOpen(true)}
                                className={`
                                    flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border transition-all w-full justify-between
                                    ${genreFilter !== 'All' 
                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
                                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}
                                `}
                            >
                                <div className="flex items-center gap-2">
                                    <Filter size={16} />
                                    <span>{genreFilter === 'All' ? 'Filter by Genre' : genreFilter}</span>
                                </div>
                                <ChevronRight size={16} className="rotate-90 text-slate-500" />
                            </button>
                        </div>

                        {/* Desktop View: Horizontal Scroll */}
                        <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide mask-gradient-right">
                            <div className="flex items-center gap-2 pr-4">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0 sticky left-0 bg-slate-950 z-10 pr-2">
                                    <Filter size={12} /> Genres
                                </span>
                                <div className="h-4 w-px bg-slate-800 mx-1 shrink-0" />
                                {availableGenres.map(genre => (
                                    <button
                                        key={genre}
                                        onClick={() => setGenreFilter(genre)}
                                        className={`
                                            whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-all shrink-0
                                            ${genreFilter === genre 
                                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
                                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'}
                                        `}
                                    >
                                        {genre}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        )}

        {/* Content Views */}
        
        {view === ViewState.SEARCH && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">
                        {searchScope === 'book' ? 'Open Library Results' : 'Movie & TV Results'}
                    </h2>
                    <button onClick={() => setView(ViewState.LIBRARY)} className="text-sm text-slate-400 hover:text-white underline">Cancel</button>
                </div>
                
                {isSearching ? (
                   <div className="flex flex-col items-center justify-center py-20">
                     <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
                     <p className="text-slate-400 animate-pulse">Searching...</p>
                   </div>
                ) : searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.map((result) => (
                            <SearchResultCard 
                                key={result.id} 
                                result={result} 
                                onAdd={(status) => handleAddMovie(result, status)}
                                status={
                                    movies.find(m => 
                                        (m.tmdbId && m.tmdbId === result.id) || 
                                        (m.openLibraryId && m.openLibraryId === result.id)
                                    )?.status
                                }
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                        <AlertCircle className="mx-auto text-slate-600 mb-2" size={32} />
                        <p className="text-slate-500">No results found.</p>
                        <button onClick={() => setIsManualModalOpen(true)} className="mt-2 text-indigo-400 hover:text-indigo-300 font-medium">
                            Add manually?
                        </button>
                    </div>
                )}
            </div>
        )}

        {view === ViewState.STATS && (
           <Stats movies={movies} />
        )}

        {view === ViewState.PLANNER && (
            <Planner 
                movies={movies}
                onUpdate={updateMovieDetails}
                onOpenDetails={handleOpenDetails}
            />
        )}
        
        {view === ViewState.DETAILS && selectedMovie && (
            <MovieDetails 
                movie={selectedMovie} 
                onBack={handleBackFromDetails}
                onUpdate={updateMovieDetails}
                onDelete={deleteMovie}
            />
        )}

        {(view === ViewState.LIBRARY || view === ViewState.WATCHLIST) && (
            <div className="animate-in fade-in duration-300 space-y-6">
                 {/* Up Next Section */}
                 {upNext && (upNext.visual || upNext.book) && (
                     <div className="flex flex-col sm:flex-row gap-4 mb-4">
                         {upNext.visual && <UpNextCard item={upNext.visual} type="visual" />}
                         {upNext.book && <UpNextCard item={upNext.book} type="book" />}
                     </div>
                 )}

                 {displayedMovies.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {visibleMovies.map(movie => (
                                <MovieCard 
                                    key={movie.id} 
                                    movie={movie} 
                                    onClick={handleOpenDetails}
                                    onStatusChange={handleQuickStatusUpdate}
                                />
                            ))}
                        </div>
                        {/* Loading Sentinel */}
                        {visibleMovies.length < displayedMovies.length && (
                            <div ref={loadMoreRef} className="h-20 flex justify-center items-center">
                                <Loader2 className="animate-spin text-slate-600" size={24} />
                            </div>
                        )}
                    </>
                 ) : (
                    <div className="flex flex-col items-center justify-center py-32 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                        <div className="bg-slate-800 p-4 rounded-full mb-4">
                            <Layers className="text-slate-600" size={32} />
                        </div>
                        <h3 className="text-slate-200 font-semibold text-lg mb-1">No items found</h3>
                        <button onClick={() => { setMediaFilter('all'); setStatusFilter('all'); setGenreFilter('All'); }} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium">Clear filters</button>
                    </div>
                 )}
            </div>
        )}
      </main>

      {/* Mobile Fixed Bottom Nav */}
      {view !== ViewState.DETAILS && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-white/10 safe-area-pb">
            <div className="flex justify-around items-center h-16 pb-1">
                <MobileNavItem targetView={ViewState.LIBRARY} icon={Library} label="Library" />
                <MobileNavItem targetView={ViewState.WATCHLIST} icon={Clock} label="Backlog" />
                <MobileNavItem targetView={ViewState.PLANNER} icon={CalendarDays} label="Planner" />
                <MobileNavItem targetView={ViewState.STATS} icon={BarChart2} label="Stats" />
            </div>
        </div>
      )}

      {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl p-6">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings size={20}/> Settings</h2>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                 </div>
                 <div className="space-y-4">
                     <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                         <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Share2 size={16} /> Data</h3>
                         <p className="text-xs text-slate-400 mb-4">Stored locally via IndexedDB.</p>
                         <div className="flex gap-3">
                             <button onClick={handleExport} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2"><Download size={14} /> Export</button>
                             <button onClick={handleImportClick} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2"><Upload size={14} /> Import</button>
                             <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleFileChange}/>
                         </div>
                     </div>
                 </div>
             </div>
          </div>
      )}

      {isGenreModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-md rounded-t-2xl md:rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in slide-in-from-bottom-10 duration-200">
                 <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Filter size={18} className="text-indigo-500"/> Select Genre
                    </h2>
                    <button onClick={() => setIsGenreModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                        <X size={20} />
                    </button>
                 </div>
                 
                 <div className="p-2 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 gap-1">
                        {availableGenres.map(genre => (
                            <button
                                key={genre}
                                onClick={() => {
                                    setGenreFilter(genre);
                                    setIsGenreModalOpen(false);
                                }}
                                className={`
                                    flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors
                                    ${genreFilter === genre 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                                `}
                            >
                                <span>{genre}</span>
                                {genreFilter === genre && <Check size={16} />}
                            </button>
                        ))}
                    </div>
                 </div>
                 
                 <div className="p-4 border-t border-slate-800 bg-slate-900/50 shrink-0">
                     <button 
                        onClick={() => setIsGenreModalOpen(false)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-xl transition-colors"
                     >
                        Close
                     </button>
                 </div>
            </div>
        </div>
      )}

      <ManualEntryModal 
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAdd={(result) => { handleAddMovie(result, 'watched'); setView(ViewState.LIBRARY); }}
      />
    </div>
  );
}