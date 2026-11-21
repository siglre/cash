# cash

Личный финансовый трекер (PWA). Vite + React + TS + Tailwind v4 + Dexie.

```
npm run dev       # dev-сервер, доступен по сети (--host) для проверки с телефона
npm test          # Vitest, логика в src/lib
npm run build     # прод-сборка + service worker
npm run icons     # пересобрать PWA-иконки из public/icon.png
```

## Деплой на Vercel
1. Залей репозиторий на GitHub.
2. vercel.com → Add New Project → импорт репозитория (пресет Vite определится сам: build `npm run build`, output `dist`).
3. Открой URL на iPhone в Safari → Поделиться → «На экран Домой».

Данные хранятся локально в IndexedDB устройства (синхронизация — этап 3).
