
export type MovieStatus = 'watchlist' | 'watched' | 'dropped';
export type MediaType = 'movie' | 'tv' | 'book';

export interface WatchProvider {
  providerId: number;
  providerName: string;
  logoPath: string;
}

export interface WatchProvidersData {
  link: string;
  flatrate: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
}

export interface Episode {
  id: number;
  name: string;
  episode_number: number;
  air_date?: string;
  overview: string;
  still_path?: string | null;
  isWatched: boolean;
  vote_average?: number;
}

export interface Season {
  id: number;
  name: string;
  season_number: number;
  poster_path?: string | null;
  episode_count: number;
  air_date?: string;
  episodes?: Episode[]; // Fetched on demand
}

// Renamed from Movie to MediaItem to be inclusive
export interface Movie {
  id: string;
  tmdbId?: number; // For Movies/TV
  openLibraryId?: string; // For Books (formerly googleBooksId)
  title: string;
  year: string;
  genre: string[];
  description: string;
  director: string; // Used as "Author" for books
  status: MovieStatus;
  rating: number; // User rating 0-10
  userReview?: string;
  posterPath?: string | null; // TMDB path or Full URL for books
  posterSeed: number; // Fallback
  addedAt: number;
  mediaType: MediaType;
  tmdbRating?: number; // TMDB Average Vote
  pageCount?: number; // Specific to Books
  plannedDate?: string; // YYYY-MM-DD format
  watchProviders?: WatchProvidersData; // Persisted availability data
  seasons?: Season[]; // Specific to TV
}

export interface SearchResult {
  id: string | number; // String for Open Library (Key), Number for TMDB
  title: string;
  year: string;
  genre: string[];
  description: string;
  director: string; // Author for books
  posterPath: string | null;
  mediaType: MediaType;
  voteAverage: number;
  pageCount?: number;
}

export enum ViewState {
  LIBRARY = 'LIBRARY',
  WATCHLIST = 'WATCHLIST',
  SEARCH = 'SEARCH',
  STATS = 'STATS',
  DETAILS = 'DETAILS',
  PLANNER = 'PLANNER'
}
