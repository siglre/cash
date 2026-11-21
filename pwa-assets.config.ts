import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Исходник значка — public/icon.png (квадрат на белом фоне). Пересборка: npm run icons
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0.04, resizeOptions: { background: '#ffffff' } },
    // maskable: Android обрезает края по кругу/скруглению — пантере нужен запас
    maskable: { ...minimal2023Preset.maskable, padding: 0.22, resizeOptions: { background: '#ffffff' } },
    // iOS скругляет углы сам, запаса нужно немного
    apple: { ...minimal2023Preset.apple, padding: 0.1, resizeOptions: { background: '#ffffff' } },
  },
  images: ['public/icon.png'],
});
