import type { Transaction } from '../lib/types';

/** Демо-режим только в dev: http://localhost:5173/?demo — отдельная база с тестовыми данными. */
export const isDemo = import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo');

/** Детерминированный «рандом», чтобы скриншоты были одинаковые. */
function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

export function demoTransactions(now = new Date()): Transaction[] {
  const r = rng(42);
  const cats = ['exp-food', 'exp-cafe', 'exp-transport', 'exp-fun', 'exp-subs', 'exp-gifts', 'exp-health'];
  const weights = [0.35, 0.2, 0.15, 0.1, 0.08, 0.07, 0.05];
  const out: Transaction[] = [];
  let n = 0;
  const add = (p: Partial<Transaction> & Pick<Transaction, 'type' | 'amount' | 'date'>) => {
    out.push({ id: `demo-${++n}`, createdAt: p.date, updatedAt: p.date, accountId: 'acc-card', ...p });
  };
  for (let back = 150; back >= 0; back--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back, 13);
    if (d.getDate() === 5) add({ type: 'income', amount: 70000, categoryId: 'inc-salary', date: d.toISOString() });
    if (d.getDate() === 1) add({ type: 'expense', amount: 31000, categoryId: 'exp-rent', date: d.toISOString(), recurringId: 'rec-rent' });
    const k = Math.floor(r() * 3);
    for (let i = 0; i < k; i++) {
      let x = r(), ci = 0;
      while (x > weights[ci] && ci < weights.length - 1) { x -= weights[ci]; ci++; }
      add({ type: 'expense', amount: Math.round((200 + r() * 1800) / 10) * 10, categoryId: cats[ci], date: d.toISOString() });
    }
  }
  add({ type: 'to_goal', amount: 18000, goalId: 'goal-airpods', date: new Date(now.getTime() - 20 * 864e5).toISOString() });
  add({ type: 'to_goal', amount: 42000, goalId: 'goal-iphone', date: new Date(now.getTime() - 40 * 864e5).toISOString() });
  return out;
}
