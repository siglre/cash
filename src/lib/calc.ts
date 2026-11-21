import type { Account, Category, Goal, Settings, Transaction } from './types';
import { addDays, inPeriod, monthPeriod, startOfDay, type Period } from './dates';

const live = (txs: Transaction[]) => txs.filter((t) => !t.deleted);
const sum = (txs: Transaction[]) => txs.reduce((a, t) => a + t.amount, 0);

export interface MonthSummary {
  income: number;
  expense: number;
  /** чистые переводы в цели: to_goal − from_goal */
  toGoals: number;
  /** база для «свободно»: большее из планового и фактического дохода */
  incomeBase: number;
  free: number;
}

/**
 * Свободно = доход − расходы − чистые переводы в цели.
 * Доход: max(плановый, фактический) — иначе в начале месяца было бы отрицательное «свободно».
 * Снятие с цели (from_goal) возвращает деньги в свободные.
 */
export function monthSummary(txs: Transaction[], settings: Settings, now: Date): MonthSummary {
  const p = monthPeriod(now, settings.monthStartDay);
  const m = live(txs).filter((t) => inPeriod(t.date, p));
  const income = sum(m.filter((t) => t.type === 'income'));
  const expense = sum(m.filter((t) => t.type === 'expense'));
  const toGoals = sum(m.filter((t) => t.type === 'to_goal')) - sum(m.filter((t) => t.type === 'from_goal'));
  const incomeBase = Math.max(settings.monthlyIncome, income);
  return { income, expense, toGoals, incomeBase, free: incomeBase - expense - toGoals };
}

export function goalSaved(txs: Transaction[], goalId: string): number {
  let s = 0;
  for (const t of live(txs)) {
    if (t.goalId !== goalId) continue;
    if (t.type === 'to_goal') s += t.amount;
    else if (t.type === 'from_goal') s -= t.amount;
  }
  return s;
}

/** Месяцев до срока: целое, не меньше 1 пока срок не прошёл; 0 если прошёл. */
export function monthsLeft(deadline: string, now: Date): number {
  const dl = new Date(deadline);
  if (dl.getTime() <= now.getTime()) return 0;
  const months = (dl.getFullYear() - now.getFullYear()) * 12 + (dl.getMonth() - now.getMonth()) + (dl.getDate() - now.getDate()) / 30;
  return Math.max(1, Math.ceil(months - 0.0001));
}

/** Сколько откладывать в месяц, чтобы успеть. 0 если цель достигнута. */
export function neededPerMonth(goal: Goal, saved: number, now: Date): number {
  const remaining = Math.max(0, goal.target - saved);
  if (remaining === 0) return 0;
  const m = monthsLeft(goal.deadline, now);
  return m === 0 ? remaining : Math.ceil(remaining / m);
}

/** Суммарно по всем активным целям. */
export function totalNeededPerMonth(goals: Goal[], txs: Transaction[], now: Date): number {
  return goals
    .filter((g) => !g.archived)
    .reduce((a, g) => a + neededPerMonth(g, goalSaved(txs, g.id), now), 0);
}

export type GoalStatus =
  | { kind: 'done' }
  | { kind: 'on_track' }
  | { kind: 'need'; perMonth: number }
  | { kind: 'behind' };

/**
 * done — накоплено ≥ цели.
 * behind — срок прошёл, либо нужная сумма в месяц больше возможностей (доход − фиксированные).
 * on_track — нужная сумма ≤ того, что реально откладывается (recentPace, ₽/мес).
 * need — иначе: «Нужно X ₽ в месяц».
 */
export function goalStatus(
  goal: Goal, saved: number, now: Date, capacity: number, recentPace = 0,
): GoalStatus {
  if (saved >= goal.target) return { kind: 'done' };
  const needed = neededPerMonth(goal, saved, now);
  if (monthsLeft(goal.deadline, now) === 0 || needed > capacity) return { kind: 'behind' };
  if (needed <= recentPace) return { kind: 'on_track' };
  return { kind: 'need', perMonth: needed };
}

export const monthlyCapacity = (s: Settings) =>
  s.monthlyIncome - s.fixedCosts.reduce((a, f) => a + f.amount, 0);

/** Ближайшая по сроку незавершённая цель. */
export function nearestGoal(goals: Goal[], txs: Transaction[]): Goal | undefined {
  return goals
    .filter((g) => !g.archived && goalSaved(txs, g.id) < g.target)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
}

/** Расходы за последние 7 дней (включая сегодня), от старого к новому. */
export function weeklySpend(txs: Transaction[], now: Date): { date: Date; amount: number }[] {
  const today = startOfDay(now);
  const days = Array.from({ length: 7 }, (_, i) => ({ date: addDays(today, i - 6), amount: 0 }));
  for (const t of live(txs)) {
    if (t.type !== 'expense') continue;
    const d = startOfDay(new Date(t.date)).getTime();
    const slot = days.find((x) => x.date.getTime() === d);
    if (slot) slot.amount += t.amount;
  }
  return days;
}

export function topCategory(
  txs: Transaction[], categories: Category[], p: Period,
): { category: Category; amount: number } | undefined {
  const by = new Map<string, number>();
  for (const t of live(txs)) {
    if (t.type !== 'expense' || !t.categoryId || !inPeriod(t.date, p)) continue;
    by.set(t.categoryId, (by.get(t.categoryId) ?? 0) + t.amount);
  }
  let best: { category: Category; amount: number } | undefined;
  for (const [id, amount] of by) {
    const category = categories.find((c) => c.id === id);
    if (category && (!best || amount > best.amount)) best = { category, amount };
  }
  return best;
}

/** Категории по частоте использования (при равенстве — по order). */
export function sortByUsage(categories: Category[], txs: Transaction[]): Category[] {
  const count = new Map<string, number>();
  for (const t of live(txs)) if (t.categoryId) count.set(t.categoryId, (count.get(t.categoryId) ?? 0) + 1);
  return [...categories].sort((a, b) => (count.get(b.id) ?? 0) - (count.get(a.id) ?? 0) || a.order - b.order);
}

/* ───────────── Счета ───────────── */

/** Движение денег по счёту: доходы − расходы ± переводы. Цели счёт не трогают (резерв). */
export function accountFlow(accountId: string, txs: Transaction[]): number {
  let s = 0;
  for (const t of live(txs)) {
    if (t.type === 'income' && t.accountId === accountId) s += t.amount;
    else if (t.type === 'expense' && t.accountId === accountId) s -= t.amount;
    else if (t.type === 'transfer') {
      if (t.accountId === accountId) s -= t.amount;
      if (t.toAccountId === accountId) s += t.amount;
    }
  }
  return s;
}

export const accountBalance = (a: Account, txs: Transaction[]) => a.initialBalance + accountFlow(a.id, txs);

export interface FreeSummary {
  onAccounts: number; // сумма положительных остатков
  debt: number;       // сумма долгов (положительное число)
  inGoals: number;    // отложено в активные цели
  free: number;
}

/** Свободно = на счетах − долги − отложено в цели. */
export function freeMoney(accounts: Account[], goals: Goal[], txs: Transaction[]): FreeSummary {
  let onAccounts = 0, debt = 0;
  for (const a of accounts) {
    if (a.archived) continue;
    const b = accountBalance(a, txs);
    if (b >= 0) onAccounts += b; else debt -= b;
  }
  const inGoals = goals.filter((g) => !g.archived).reduce((s, g) => s + Math.max(0, goalSaved(txs, g.id)), 0);
  return { onAccounts, debt, inGoals, free: onAccounts - debt - inGoals };
}

/**
 * Сколько нужно отложить в текущем месяце.
 * План на месяц фиксируется от остатка на начало месяца; то, что уже отложено в этом месяце, вычитается.
 */
export function neededThisMonth(
  goals: Goal[], txs: Transaction[], now: Date, startDay = 1,
): { total: number; perGoal: { goal: Goal; need: number }[] } {
  const p = monthPeriod(now, startDay);
  const before = live(txs).filter((t) => new Date(t.date).getTime() < p.start.getTime());
  const during = live(txs).filter((t) => inPeriod(t.date, p));
  const perGoal = goals
    .filter((g) => !g.archived)
    .map((goal) => {
      const remaining = Math.max(0, goal.target - goalSaved(before, goal.id));
      if (remaining === 0) return { goal, need: 0 };
      const m = monthsLeft(goal.deadline, p.start);
      const plan = m === 0 ? remaining : Math.ceil(remaining / m);
      const done = goalSaved(during, goal.id);
      const remainingNow = Math.max(0, goal.target - goalSaved(txs, goal.id));
      return { goal, need: Math.max(0, Math.min(plan - done, remainingNow)) };
    })
    .sort((a, b) => a.goal.deadline.localeCompare(b.goal.deadline));
  return { total: perGoal.reduce((s, x) => s + x.need, 0), perGoal };
}

/** Счёт, с которым последний раз делали операцию этого типа. */
export function lastUsedAccount(txs: Transaction[], type: Transaction['type']): string | undefined {
  let best: Transaction | undefined;
  for (const t of live(txs)) {
    if (t.type !== type || !t.accountId) continue;
    if (!best || t.createdAt > best.createdAt) best = t;
  }
  return best?.accountId;
}

/** Последняя использованная категория/цель для данного типа операций. */
export function lastUsedRef(txs: Transaction[], type: Transaction['type']): string | undefined {
  let best: Transaction | undefined;
  for (const t of live(txs)) {
    if (t.type !== type) continue;
    if (!best || t.createdAt > best.createdAt) best = t;
  }
  return best ? (best.categoryId ?? best.goalId) : undefined;
}
