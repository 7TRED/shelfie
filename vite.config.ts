import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Prompt user for update
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      devOptions: {
        enabled: true // Enable PWA in dev mode for testing
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false, // Critical: wait for user confirmation
      },
      manifest: {
        name: "Shelfie",
        short_name: "Shelfie",
        start_url: "/",
        display: "standalone",
        background_color: "#0f172a",
        theme_color: "#0f172a",
        description: "Personal Media Tracker for Movies, TV, and Books",
        icons: [
          {
            src: "https://cdn-icons-png.flaticon.com/512/2503/2503508.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "https://cdn-icons-png.flaticon.com/512/2503/2503508.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ],
});