import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppData, useNow } from './hooks';
import { TabBar, type Tab } from './components/TabBar';
import { AddSheet, type SheetState } from './components/AddSheet';
import { Toast } from './components/Toast';
import { Home } from './screens/Home';
import { History } from './screens/History';
import { Goals } from './screens/Goals';
import { Settings } from './screens/Settings';
import { restoreTransaction } from './db/repo';

export default function App() {
  const data = useAppData();
  const now = useNow();
  const [tab, setTab] = useState<Tab>('home');
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [deletedId, setDeletedId] = useState<string | null>(null);

  if (!data) return <div className="min-h-dvh bg-bg" />;

  const go = (t: Tab) => { setTab(t); window.scrollTo(0, 0); };

  return (
    <div
      className="mx-auto min-h-dvh max-w-[520px]"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)' }}
    >
      {tab === 'home' && (
        <Home
          data={data} now={now} onNavigate={go}
          onAdd={(type) => setSheet({ kind: 'add', type })}
          onEdit={(tx) => setSheet({ kind: 'edit', tx })}
        />
      )}
      {tab === 'history' && <History data={data} now={now} onEdit={(tx) => setSheet({ kind: 'edit', tx })} />}
      {tab === 'goals' && <Goals data={data} now={now} onMove={(goalId, type) => setSheet({ kind: 'goal', type, goalId })} />}
      {tab === 'settings' && <Settings settings={data.settings} />}

      <TabBar tab={tab} onChange={go} />

      <AnimatePresence>
        {deletedId && (
          <Toast
            key={deletedId} text="Операция удалена"
            onUndo={() => { restoreTransaction(deletedId); setDeletedId(null); }}
            onDone={() => setDeletedId(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sheet && (
          <AddSheet key="sheet" state={sheet} data={data} onClose={() => setSheet(null)} onDeleted={setDeletedId} />
        )}
      </AnimatePresence>
    </div>
  );
}
