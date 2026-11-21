import type { Account, Category, Goal, Transaction } from './types';
import { relativeTime } from './dates';

export interface TxView {
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  sign: '+' | '−' | '';
  positive: boolean;
}

/** Данные для строки операции: заголовок, иконка, знак суммы. */
export function describeTx(
  t: Transaction, cats: Map<string, Category>, goals: Map<string, Goal>, accounts: Map<string, Account>, now = new Date(),
): TxView {
  const time = relativeTime(t.date, now);
  const acc = (id?: string) => (id ? accounts.get(id)?.name : undefined) ?? 'Счёт';

  if (t.type === 'expense' || t.type === 'income') {
    const c = t.categoryId ? cats.get(t.categoryId) : undefined;
    const name = c?.name ?? 'Без категории';
    const parts = [t.note ? name : null, acc(t.accountId), time].filter(Boolean);
    return {
      title: t.note || name,
      subtitle: parts.join(' · '),
      emoji: c?.emoji ?? '•',
      color: c?.color ?? '#7C7C84',
      sign: t.type === 'income' ? '+' : '−',
      positive: t.type === 'income',
    };
  }
  if (t.type === 'transfer') {
    return {
      title: t.note || 'Перевод',
      subtitle: `${acc(t.accountId)} → ${acc(t.toAccountId)} · ${time}`,
      emoji: '⇄',
      color: '#8E8E93',
      sign: '',
      positive: false,
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
