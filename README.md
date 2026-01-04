# Shelfie 📚🎬

A quirky, personal media tracker built for the web. **Shelfie** allows you to track Movies, TV Shows, and Books in one unified library, entirely local-first.

## ✨ Features

*   **Unified Library:** Track Movies, TV Series, and Books in a single interface.
*   **Search Integration:** 
    *   Movies & TV data sourced from [TMDB](https://www.themoviedb.org/).
    *   Book data sourced from [Open Library](https://openlibrary.org/).
*   **Planner:** Schedule content to watch or read with a timeline view.
*   **Up Next:** Smart suggestions based on your planned dates or backlog order (FIFO).
*   **Statistics:** Visual breakdown of your consumption habits by genre and media type.
*   **TV Tracking:** Track progress by seasons and individual episodes.
*   **Local First:** All data is stored in your browser's **IndexedDB**. No login required, total privacy.
*   **Data Management:** Export and Import your library as JSON backups.
*   **PWA Support:** Installable on mobile and desktop with offline caching capabilities.
*   **Responsive UI:** A beautiful, dark-themed interface built with Tailwind CSS.

## 🛠️ Tech Stack

*   **Frontend:** React 19, TypeScript, Vite
*   **Styling:** Tailwind CSS
*   **Icons:** Lucide React
*   **Charts:** Recharts
*   **Storage:** IndexedDB (via `idb`)
*   **API Proxy:** Vercel Serverless Functions (Node.js)

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   NPM or Yarn
*   A [TMDB API Key](https://www.themoviedb.org/documentation/api)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/shelfie.git
    cd shelfie
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory.
    
    *Option A: Local Development (Client-side API calls)*
    ```env
    VITE_TMDB_API_KEY=your_tmdb_api_key_here
    ```

    *Option B: Production (Using Vercel Proxy)*
    If deploying to Vercel, set `TMDB_API_KEY` in your Vercel Project Settings.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

## 📦 Deployment

This project includes a serverless function (`api/tmdb.js`) designed for Vercel.

1.  Push your code to a generic Git repository.
2.  Import the project into Vercel.
3.  Add the `TMDB_API_KEY` environment variable in the Vercel dashboard.
4.  Deploy!

## 📱 Progressive Web App

Shelfie is configured as a PWA. To test the Service Worker locally, you must build the app first:

```bash
npm run build
npm run preview
```

## 🔒 Privacy

Shelfie stores all your library data directly on your device using IndexedDB. We do not track your usage or store your data on our servers. When using the search feature, queries are sent to TMDB or Open Library (proxied via our backend to protect API keys).

## 📄 License

MIT
