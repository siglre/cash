import { useCallback, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppData, useNow } from './hooks';
import type { Account, Category, Goal, Recurring } from './lib/types';
import { accountBalance, goalSaved } from './lib/calc';
import { TabBar, type Tab } from './components/TabBar';
import { AddSheet, type SheetState } from './components/AddSheet';
import { AccountSheet } from './components/AccountSheet';
import { GoalSheet } from './components/GoalSheet';
import { RecurringSheet } from './components/RecurringSheet';
import { CategoriesSheet } from './components/CategoriesSheet';
import { Confetti } from './components/Confetti';
import { Toast } from './components/Toast';
import { Home } from './screens/Home';
import { History } from './screens/History';
import { Goals } from './screens/Goals';
import { Settings } from './screens/Settings';
import { restoreTransaction } from './db/repo';

/** Открытая форма. null у редактируемой сущности = создание новой. */
type Form =
  | { kind: 'account'; item: Account | null }
  | { kind: 'goal'; item: Goal | null }
  | { kind: 'recurring'; item: Recurring | null }
  | { kind: 'categories'; catKind: Category['kind'] };

type ToastState = { id: number; text: string; undoTxId?: string };

export default function App() {
  const data = useAppData();
  const now = useNow();
  const [tab, setTab] = useState<Tab>('home');
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confetti, setConfetti] = useState(false);

  const closeToast = useCallback(() => setToast(null), []);
  const closeConfetti = useCallback(() => setConfetti(false), []);
  const notify = useCallback((text: string) => setToast({ id: Date.now(), text }), []);

  if (!data) return <div className="min-h-dvh bg-bg" />;

  const go = (t: Tab) => { setTab(t); window.scrollTo(0, 0); };
  const closeForm = () => setForm(null);

  return (
    <div
      className="mx-auto min-h-dvh max-w-[520px]"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)' }}
    >
      {tab === 'home' && (
        <Home
          data={data} now={now}
          onAdd={(type) => setSheet({ kind: 'add', type })}
          onSaveToGoal={(goalId, amount) => setSheet({ kind: 'goal', type: 'to_goal', goalId, amount })}
          onAccount={(a) => setForm({ kind: 'account', item: a ?? null })}
          onPay={(rec) => setSheet({ kind: 'pay', type: 'expense', rec })}
        />
      )}
      {tab === 'history' && <History data={data} now={now} onEdit={(tx) => setSheet({ kind: 'edit', tx })} />}
      {tab === 'goals' && (
        <Goals
          data={data} now={now}
          onMove={(goalId, type) => setSheet({ kind: 'goal', type, goalId })}
          onEdit={(g) => setForm({ kind: 'goal', item: g ?? null })}
        />
      )}
      {tab === 'settings' && (
        <Settings
          data={data} notify={notify}
          onRecurring={(r) => setForm({ kind: 'recurring', item: r ?? null })}
          onCategories={(catKind) => setForm({ kind: 'categories', catKind })}
        />
      )}

      <TabBar tab={tab} onChange={go} />

      <AnimatePresence>
        {toast && (
          <Toast
            key={toast.id} text={toast.text} onDone={closeToast}
            onUndo={toast.undoTxId ? () => { restoreTransaction(toast.undoTxId!); setToast(null); } : undefined}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sheet && (
          <AddSheet
            key="sheet" state={sheet} data={data}
            onClose={() => setSheet(null)}
            onDeleted={(id) => setToast({ id: Date.now(), text: 'Операция удалена', undoTxId: id })}
            onGoalReached={() => setConfetti(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {form?.kind === 'account' && (
          <AccountSheet
            key="account" account={form.item ?? undefined}
            balance={form.item ? accountBalance(form.item, data.txs) : 0}
            canDelete={data.accounts.length > 1} onClose={closeForm}
          />
        )}
        {form?.kind === 'goal' && (
          <GoalSheet
            key="goal" goal={form.item ?? undefined}
            saved={form.item ? goalSaved(data.txs, form.item.id) : 0} onClose={closeForm}
          />
        )}
        {form?.kind === 'recurring' && (
          <RecurringSheet key="recurring" rec={form.item ?? undefined} data={data} onClose={closeForm} />
        )}
        {form?.kind === 'categories' && (
          <CategoriesSheet key="categories" kind={form.catKind} all={data.categories} onClose={closeForm} />
        )}
      </AnimatePresence>

      {confetti && <Confetti onDone={closeConfetti} />}
    </div>
  );
}
