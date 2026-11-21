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
        name: 'cash',
        short_name: 'cash',
        description: 'Личный финансовый трекер',
        lang: 'ru',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f2f2f7',
        theme_color: '#f2f2f7',
        start_url: '/',
        // ?v= — версия значка (см. index.html)
        icons: [
          { src: 'pwa-192x192.png?v=2', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png?v=2', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        globIgnores: ['icon.png'], // исходник для генерации значков, в офлайн-кэш не нужен
        // новая версия сразу берёт управление, без «старой страницы» при первом открытии
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // ?v= у значков не должен мешать найти их в офлайн-кэше
        ignoreURLParametersMatching: [/^v$/, /^utm_/],
      },
    }),
  ],
  test: { environment: 'node' },
});
