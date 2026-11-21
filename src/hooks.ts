import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';
import type { Account, Category, Goal, Settings, Transaction } from './lib/types';

export interface AppData {
  txs: Transaction[];
  categories: Category[];
  goals: Goal[];
  /** только активные счета */
  accounts: Account[];
  settings: Settings;
  catMap: Map<string, Category>;
  goalMap: Map<string, Goal>;
  /** все счета, включая архивные — для отображения старых операций */
  accountMap: Map<string, Account>;
}

/** Всё из IndexedDB, реактивно. undefined — пока грузится. */
export function useAppData(): AppData | undefined {
  const txs = useLiveQuery(
    async () => (await db.transactions.orderBy('date').reverse().toArray()).filter((t) => !t.deleted),
    [],
  );
  const categories = useLiveQuery(() => db.categories.orderBy('order').toArray(), []);
  const goals = useLiveQuery(() => db.goals.toArray(), []);
  const accounts = useLiveQuery(() => db.accounts.orderBy('order').toArray(), []);
  const settings = useLiveQuery(() => db.settings.get('main'), []);

  return useMemo(() => {
    if (!txs || !categories || !goals || !accounts || !settings) return undefined;
    return {
      txs, categories, goals, settings,
      accounts: accounts.filter((a) => !a.archived),
      catMap: new Map(categories.map((c) => [c.id, c])),
      goalMap: new Map(goals.map((g) => [g.id, g])),
      accountMap: new Map(accounts.map((a) => [a.id, a])),
    };
  }, [txs, categories, goals, accounts, settings]);
}

/** Текущее время, обновляется раз в минуту и при возврате в приложение. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, []);
  return now;
}
