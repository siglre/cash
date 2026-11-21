import type { Category, Goal, Transaction } from './types';
import { relativeTime } from './dates';

export interface TxView {
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  /** знак и тип суммы для раскраски */
  sign: '+' | '−';
  positive: boolean;
}

/** Данные для строки операции: заголовок, иконка, знак суммы. */
export function describeTx(
  t: Transaction, cats: Map<string, Category>, goals: Map<string, Goal>, now = new Date(),
): TxView {
  const time = relativeTime(t.date, now);
  if (t.type === 'expense' || t.type === 'income') {
    const c = t.categoryId ? cats.get(t.categoryId) : undefined;
    const name = c?.name ?? 'Без категории';
    return {
      title: t.note || name,
      subtitle: t.note ? `${name} · ${time}` : time,
      emoji: c?.emoji ?? '•',
      color: c?.color ?? '#7C7C84',
      sign: t.type === 'income' ? '+' : '−',
      positive: t.type === 'income',
    };
  }
  const g = t.goalId ? goals.get(t.goalId) : undefined;
  const to = t.type === 'to_goal';
  return {
    title: g?.name ?? 'Цель',
    subtitle: `${to ? 'Отложено' : 'Снято с цели'}${t.note ? ` · ${t.note}` : ''} · ${time}`,
    emoji: g?.emoji ?? '🎯',
    color: g?.gradient[0] ?? '#7C7C84',
    sign: to ? '−' : '+',
    positive: !to,
  };
}
