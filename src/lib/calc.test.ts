import { describe, expect, it } from 'vitest';
import { goalSaved, goalStatus, lastUsedRef, monthsLeft, monthSummary, neededPerMonth, sortByUsage, topCategory, totalNeededPerMonth, weeklySpend } from './calc';
import { monthPeriod, relativeTime } from './dates';
import { formatMoney } from './money';
import type { Category, Goal, Settings, Transaction } from './types';

const settings: Settings = { id: 'main', currency: 'RUB', monthlyIncome: 70000, fixedCosts: [{ name: 'Квартира', amount: 31000 }], monthStartDay: 1 };
const now = new Date(2026, 10, 21, 12, 0); // 21 ноября 2026

let n = 0;
const tx = (p: Partial<Transaction>): Transaction => ({
  id: String(++n), type: 'expense', amount: 100, date: now.toISOString(),
  createdAt: new Date(2026, 10, 1, 0, 0, n).toISOString(), updatedAt: now.toISOString(), ...p,
});
const goal = (p: Partial<Goal> = {}): Goal => ({ id: 'g', name: 'iPhone', target: 120000, deadline: new Date(2027, 4, 31).toISOString(), emoji: '📱', gradient: ['#000', '#fff'], ...p });
const cat = (id: string, order = 0): Category => ({ id, name: id, emoji: '•', color: '#fff', kind: 'expense', order });

describe('formatMoney', () => {
  it('форматирует с пробелами', () => expect(formatMoney(70000)).toBe('70 000 ₽'));
  it('минус и ноль', () => { expect(formatMoney(-500)).toBe('−500 ₽'); expect(formatMoney(0)).toBe('0 ₽'); });
});

describe('monthPeriod', () => {
  it('день старта 1', () => {
    const p = monthPeriod(now, 1);
    expect(p.start).toEqual(new Date(2026, 10, 1)); expect(p.end).toEqual(new Date(2026, 11, 1));
  });
  it('день старта 25, сейчас 21 → прошлый месяц', () => {
    const p = monthPeriod(now, 25);
    expect(p.start).toEqual(new Date(2026, 9, 25)); expect(p.end).toEqual(new Date(2026, 10, 25));
  });
});

describe('monthSummary', () => {
  it('пустой месяц: свободно = плановый доход', () => {
    expect(monthSummary([], settings, now).free).toBe(70000);
  });
  it('расходы и переводы в цели уменьшают, снятие возвращает', () => {
    const txs = [tx({ amount: 10000 }), tx({ type: 'to_goal', goalId: 'g', amount: 5000 }), tx({ type: 'from_goal', goalId: 'g', amount: 1000 })];
    expect(monthSummary(txs, settings, now).free).toBe(70000 - 10000 - 4000);
  });
  it('фактический доход больше планового', () => {
    expect(monthSummary([tx({ type: 'income', amount: 80000 })], settings, now).free).toBe(80000);
  });
  it('игнорирует удалённые и другие месяцы', () => {
    const txs = [tx({ amount: 999, deleted: true }), tx({ amount: 999, date: new Date(2026, 9, 31).toISOString() })];
    expect(monthSummary(txs, settings, now).free).toBe(70000);
  });
});

describe('goalSaved / neededPerMonth', () => {
  const txs = [tx({ type: 'to_goal', goalId: 'g', amount: 51000 }), tx({ type: 'from_goal', goalId: 'g', amount: 1000 }), tx({ type: 'to_goal', goalId: 'x', amount: 7 })];
  it('накоплено', () => expect(goalSaved(txs, 'g')).toBe(50000));
  it('нужно в месяц: остаток / месяцы', () => {
    expect(monthsLeft(goal().deadline, now)).toBe(7);
    expect(neededPerMonth(goal(), 50000, now)).toBe(10000);
  });
  it('цель достигнута → 0; срок прошёл → весь остаток', () => {
    expect(neededPerMonth(goal(), 120000, now)).toBe(0);
    expect(neededPerMonth(goal({ deadline: new Date(2026, 0, 1).toISOString() }), 20000, now)).toBe(100000);
  });
  it('суммарно по целям, архив не считается', () => {
    const gs = [goal({ id: 'a', target: 7000 }), goal({ id: 'b', target: 14000, archived: true })];
    expect(totalNeededPerMonth(gs, [], now)).toBe(1000);
  });
});

describe('goalStatus', () => {
  const cap = 39000;
  it('done', () => expect(goalStatus(goal(), 120000, now, cap).kind).toBe('done'));
  it('behind: срок прошёл', () => expect(goalStatus(goal({ deadline: new Date(2026, 0, 1).toISOString() }), 0, now, cap).kind).toBe('behind'));
  it('behind: не по силам', () => expect(goalStatus(goal({ target: 1_000_000 }), 0, now, cap).kind).toBe('behind'));
  it('on_track: темп покрывает', () => expect(goalStatus(goal(), 50000, now, cap, 10000).kind).toBe('on_track'));
  it('need: нужно X в месяц', () => expect(goalStatus(goal(), 50000, now, cap, 0)).toEqual({ kind: 'need', perMonth: 10000 }));
});

describe('виджеты главной', () => {
  it('weeklySpend: 7 дней, сегодня последний', () => {
    const w = weeklySpend([tx({ amount: 300 }), tx({ amount: 200, date: new Date(2026, 10, 19, 9).toISOString() }), tx({ amount: 5, date: new Date(2026, 10, 1).toISOString() })], now);
    expect(w).toHaveLength(7); expect(w[6].amount).toBe(300); expect(w[4].amount).toBe(200);
  });
  it('topCategory', () => {
    const txs = [tx({ categoryId: 'a', amount: 100 }), tx({ categoryId: 'b', amount: 500 }), tx({ categoryId: 'a', amount: 200 })];
    expect(topCategory(txs, [cat('a'), cat('b')], monthPeriod(now))?.category.id).toBe('b');
    expect(topCategory([], [cat('a')], monthPeriod(now))).toBeUndefined();
  });
  it('sortByUsage и lastUsedRef', () => {
    const txs = [tx({ categoryId: 'b' }), tx({ categoryId: 'b' }), tx({ categoryId: 'c' })];
    expect(sortByUsage([cat('a', 0), cat('c', 1), cat('b', 2)], txs).map((c) => c.id)).toEqual(['b', 'c', 'a']);
    expect(lastUsedRef(txs, 'expense')).toBe('c');
  });
});

describe('relativeTime', () => {
  it('минуты, часы, вчера, дата', () => {
    expect(relativeTime(new Date(2026, 10, 21, 11, 58).toISOString(), now)).toBe('2 мин назад');
    expect(relativeTime(new Date(2026, 10, 21, 10, 0).toISOString(), now)).toBe('2 часа назад');
    expect(relativeTime(new Date(2026, 10, 20, 10, 0).toISOString(), now)).toBe('Вчера');
    expect(relativeTime(new Date(2026, 10, 18, 10, 0).toISOString(), now)).toBe('18 ноября');
  });
});
