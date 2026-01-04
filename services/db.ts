import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Movie } from '../types';

interface CineTrackDB extends DBSchema {
  movies: {
    key: string;
    value: Movie;
  };
}

const DB_NAME = 'shelfie-db';
const DB_VERSION = 1;
const STORE_NAME = 'movies';

let dbPromise: Promise<IDBPDatabase<CineTrackDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<CineTrackDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

// Check for legacy localStorage data and migrate it
export const migrateFromLocalStorage = async () => {
  const LOCAL_STORAGE_KEY = 'shelfie_library_v1';
  const legacyData = localStorage.getItem(LOCAL_STORAGE_KEY);
  
  if (legacyData) {
    try {
      const movies = JSON.parse(legacyData);
      if (Array.isArray(movies) && movies.length > 0) {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        for (const movie of movies) {
            // Ensure compatibility
            const normalized = {
                ...movie,
                mediaType: movie.mediaType || 'movie'
            };
            await store.put(normalized);
        }
        await tx.done;
        
        // Clear old storage after successful migration
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        console.log(`Migrated ${movies.length} items to IndexedDB`);
      }
    } catch (e) {
      console.error("Migration failed", e);
    }
  }
};

export const getAllMovies = async (): Promise<Movie[]> => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

export const saveMovie = async (movie: Movie) => {
  const db = await initDB();
  return db.put(STORE_NAME, movie);
};

export const deleteMovie = async (id: string) => {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
};

export const bulkSaveMovies = async (movies: Movie[]) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  // Optional: Clear before bulk import? 
  // For now, we overwrite existing IDs and add new ones
  await store.clear(); 
  for (const movie of movies) {
    await store.put(movie);
  }
  return tx.done;
};