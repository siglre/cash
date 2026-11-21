import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon-180x180.png', 'favicon.ico'],
      manifest: {
        name: 'Копилка',
        short_name: 'Копилка',
        description: 'Личный финансовый трекер',
        lang: 'ru',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0A0A0B',
        theme_color: '#0A0A0B',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,ico}'] },
    }),
  ],
  test: { environment: 'node' },
});
