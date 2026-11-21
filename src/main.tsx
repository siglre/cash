import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { ErrorBoundary, ErrorScreen } from './components/ErrorBoundary';
import { db } from './db/db';
import { requestPersistentStorage } from './lib/file';
import './index.css';

registerSW({ immediate: true });
// Просим браузер не удалять IndexedDB при нехватке места
requestPersistentStorage();

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Если база не открылась (например, упала миграция) — показать ошибку, а не пустой экран
db.open().catch((e: Error) => root.render(<ErrorScreen error={e} />));
