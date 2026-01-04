import { Movie, SearchResult, MediaType, WatchProvidersData, Season, Episode } from "../types";
import * as db from "./db";

// --- Configuration ---
// Local Dev Key (optional, for direct access during development)
const LOCAL_API_KEY = import.meta.env?.VITE_TMDB_API_KEY; 

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
// Open Library Search URL
const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_COVER_URL = 'https://covers.openlibrary.org/b/id';

// --- API Helper ---

/**
 * Fetches data from TMDB.
 * Strategy:
 * 1. If a local VITE_TMDB_API_KEY exists, call TMDB directly (Client-side).
 * 2. If no local key, call the Vercel Serverless Proxy (/api/tmdb).
 */
const fetchTMDB = async (endpoint: string, params: Record<string, string> = {}) => {
  if (LOCAL_API_KEY) {
    // Direct Client-Side Call (Dev Mode)
    const queryParams = new URLSearchParams({
      api_key: LOCAL_API_KEY,
      language: 'en-US',
      ...params
    });
    const res = await fetch(`${TMDB_BASE_URL}/${endpoint}?${queryParams}`);
    if (!res.ok) {
        throw new Error(`TMDB API Error: ${res.statusText}`);
    }
    return res.json();
  } else {
    // Proxy Call (Production Mode - Secure)
    // We pass the intended endpoint and params to our own API
    const queryParams = new URLSearchParams({
      endpoint: endpoint,
      language: 'en-US',
      ...params
    });
    
    try {
        const res = await fetch(`/api/tmdb?${queryParams}`);
        
        // Handle HTML responses (fallback from Vite dev server 404s)
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") === -1) {
            throw new Error("Proxy endpoint not found. If running locally, ensure VITE_TMDB_API_KEY is set in .env");
        }

        if (!res.ok) throw new Error('Proxy request failed');
        return res.json();
    } catch (error) {
        console.error("Fetch TMDB Error:", error);
        throw error;
    }
  }
};

// --- Persistence (IndexedDB) ---

export const initStorage = async () => {
  await db.initDB();
  await db.persistStorage();
  await db.migrateFromLocalStorage();
};

export const getLibrary = async (): Promise<Movie[]> => {
  return await db.getAllMovies();
};

export const saveMovie = async (movie: Movie) => {
  await db.saveMovie(movie);
};

export const deleteMovie = async (id: string) => {
  await db.deleteMovie(id);
};

export const overwriteLibrary = async (movies: Movie[]) => {
  await db.bulkSaveMovies(movies);
};

// --- Data Management (Export/Import) ---

export const exportData = async (movies: Movie[]) => {
  const dataStr = JSON.stringify(movies, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `shelfie-backup-${new Date().toISOString().slice(0,10)}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const importData = (file: File): Promise<Movie[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          resolve(json);
        } else {
          reject(new Error("Invalid file format: Not an array"));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
};

// --- Search Services ---

// Helper to map TMDB genre IDs
const genreMap: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
  10759: "Action & Adventure", 10762: "Kids", 10763: "News", 10764: "Reality",
  10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics"
};

export const searchMoviesTMDB = async (query: string): Promise<SearchResult[]> => {
  if (!query) return [];

  try {
    const data = await fetchTMDB('search/multi', {
      query: query,
      include_adult: 'false',
      page: '1'
    });

    if (!data.results) return [];

    return data.results
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .slice(0, 10)
      .map((item: any) => {
        const isMovie = item.media_type === 'movie';
        const title = isMovie ? item.title : item.name;
        const date = isMovie ? item.release_date : item.first_air_date;
        const year = date ? date.split('-')[0] : 'N/A';
        
        return {
          id: item.id,
          title: title,
          year: year,
          genre: item.genre_ids ? item.genre_ids.map((id: number) => genreMap[id] || 'Other').slice(0, 3) : [],
          description: item.overview,
          director: '', 
          posterPath: item.poster_path,
          mediaType: item.media_type as MediaType,
          voteAverage: item.vote_average || 0
        };
      });
  } catch (error) {
    console.error("TMDB Search Error:", error);
    // Return empty array instead of throwing to prevent UI crash
    return [];
  }
};

export const searchBooksOpenLibrary = async (query: string): Promise<SearchResult[]> => {
    if (!query) return [];
    
    try {
        // Query Open Library Search API
        const url = `${OPEN_LIBRARY_SEARCH_URL}?q=${encodeURIComponent(query)}&limit=10&fields=key,title,author_name,first_publish_year,cover_i,subject,number_of_pages_median,first_sentence`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.docs) return [];

        return data.docs.map((item: any) => {
            const coverUrl = item.cover_i 
                ? `${OPEN_LIBRARY_COVER_URL}/${item.cover_i}-L.jpg` 
                : null;
            
            // Format ID: Open Library uses /works/OLxxxxxx, we'll keep that as the ID
            return {
                id: item.key, 
                title: item.title,
                year: item.first_publish_year?.toString() || 'N/A',
                genre: item.subject ? item.subject.slice(0, 3) : ['Book'],
                // Open Library search results often don't have descriptions, use first sentence or fallback
                description: item.first_sentence?.[0] || 'No description available from Open Library.',
                director: item.author_name ? item.author_name.join(', ') : 'Unknown Author',
                posterPath: coverUrl, // Full URL
                mediaType: 'book' as MediaType,
                voteAverage: 0, // Not easily available in search
                pageCount: item.number_of_pages_median || 0
            };
        });
    } catch (error) {
        console.error("Open Library Search Error:", error);
        return [];
    }
}

export const getWatchProviders = async (tmdbId: number, mediaType: MediaType): Promise<WatchProvidersData | null> => {
  // Books don't have TMDB watch providers
  if (mediaType === 'book' || !tmdbId) return null;
  
  try {
    const endpoint = mediaType === 'movie' ? 'movie' : 'tv';
    // Use the proxy helper
    const data = await fetchTMDB(`${endpoint}/${tmdbId}/watch/providers`);

    const countryCode = 'US';
    const localeData = data.results?.[countryCode];

    if (!localeData) return null;

    const mapProvider = (p: any) => ({
        providerId: p.provider_id,
        providerName: p.provider_name,
        logoPath: p.logo_path
    });

    return {
      link: localeData.link,
      flatrate: localeData.flatrate?.map(mapProvider) || [],
      rent: localeData.rent?.map(mapProvider) || [],
      buy: localeData.buy?.map(mapProvider) || []
    };

  } catch (error) {
    console.error("Watch Providers Error:", error);
    return null;
  }
};

// --- TV Specific Services ---

export const getTVShowDetails = async (tmdbId: number): Promise<Season[]> => {
    if (!tmdbId) return [];

    try {
        const data = await fetchTMDB(`tv/${tmdbId}`);

        if (!data.seasons) return [];

        return data.seasons.map((s: any) => ({
            id: s.id,
            name: s.name,
            season_number: s.season_number,
            poster_path: s.poster_path,
            episode_count: s.episode_count,
            air_date: s.air_date,
            episodes: undefined // Not fetched yet
        })).filter((s: Season) => s.season_number > 0); // Exclude "Specials" (Season 0) usually
    } catch (error) {
        console.error("TV Details Error:", error);
        return [];
    }
};

export const getTVSeasonEpisodes = async (tmdbId: number, seasonNumber: number): Promise<Episode[]> => {
    if (!tmdbId) return [];

    try {
        const data = await fetchTMDB(`tv/${tmdbId}/season/${seasonNumber}`);

        if (!data.episodes) return [];

        return data.episodes.map((e: any) => ({
            id: e.id,
            name: e.name,
            episode_number: e.episode_number,
            air_date: e.air_date,
            overview: e.overview,
            still_path: e.still_path,
            vote_average: e.vote_average,
            isWatched: false // Default to unwatched
        }));
    } catch (error) {
        console.error("TV Season Error:", error);
        return [];
    }
}