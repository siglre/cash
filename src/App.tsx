import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppData, useNow } from './hooks';
import { TabBar, type Tab } from './components/TabBar';
import { AddSheet } from './components/AddSheet';
import { Home } from './screens/Home';
import { History } from './screens/History';
import { Placeholder } from './screens/Placeholder';

type SheetType = 'expense' | 'income' | 'to_goal';

export default function App() {
  const data = useAppData();
  const now = useNow();
  const [tab, setTab] = useState<Tab>('home');
  const [sheet, setSheet] = useState<SheetType | null>(null);

  if (!data) return <div className="min-h-dvh bg-bg" />;

  return (
    <div
      className="mx-auto min-h-dvh max-w-[520px]"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 110px)',
      }}
    >
      {tab === 'home' && <Home data={data} now={now} onAdd={setSheet} onNavigate={setTab} />}
      {tab === 'history' && <History data={data} now={now} />}
      {tab === 'goals' && <Placeholder title="Цели" note="Карточки целей — на этапе 2." />}
      {tab === 'stats' && <Placeholder title="Статистика" note="Графики и прогноз — на этапе 4." />}

      <TabBar tab={tab} onChange={setTab} />

      <AnimatePresence>
        {sheet && <AddSheet key="sheet" initialType={sheet} data={data} onClose={() => setSheet(null)} />}
      </AnimatePresence>
    </div>
  );
}
