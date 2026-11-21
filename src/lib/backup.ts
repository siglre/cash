import type { Account, Category, Goal, Recurring, Settings, Transaction } from './types';

export interface Backup {
  app: 'kopilka';
  version: 1;
  exportedAt: string;
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  accounts: Account[];
  recurring: Recurring[];
  settings: Settings;
}

const isArr = (v: unknown): v is unknown[] => Array.isArray(v);

/** Проверяет файл бэкапа. Возвращает текст ошибки или null. */
export function validateBackup(data: unknown): string | null {
  if (!data || typeof data !== 'object') return 'Это не файл бэкапа';
  const b = data as Partial<Backup>;
  if (b.app !== 'kopilka') return 'Файл не от этого приложения';
  for (const k of ['transactions', 'categories', 'goals', 'accounts', 'recurring'] as const) {
    if (!isArr(b[k])) return `В файле нет раздела «${k}»`;
  }
  if (!b.settings || typeof b.settings !== 'object') return 'В файле нет настроек';
  for (const t of b.transactions!) {
    if (!t || typeof t.id !== 'string' || typeof t.amount !== 'number' || typeof t.date !== 'string') {
      return 'Повреждённая операция в файле';
    }
  }
  return null;
}

const TYPE_RU: Record<Transaction['type'], string> = {
  expense: 'Расход', income: 'Доход', to_goal: 'В цель', from_goal: 'Из цели', transfer: 'Перевод',
};

/** CSV операций для Excel/Numbers: «;» как разделитель (русская локаль), BOM для кириллицы. */
export function toCsv(
  txs: Transaction[], names: { cat: Map<string, string>; goal: Map<string, string>; acc: Map<string, string> },
): string {
  const esc = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const rows = [['Дата', 'Тип', 'Сумма', 'Категория / цель', 'Счёт', 'Куда', 'Заметка']];
  for (const t of txs.filter((x) => !x.deleted).sort((a, b) => a.date.localeCompare(b.date))) {
    const d = new Date(t.date);
    const date = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    const signed = t.type === 'expense' || t.type === 'to_goal' ? -t.amount : t.amount;
    rows.push([
      date, TYPE_RU[t.type], String(signed),
      (t.categoryId && names.cat.get(t.categoryId)) || (t.goalId && names.goal.get(t.goalId)) || '',
      (t.accountId && names.acc.get(t.accountId)) || '',
      (t.toAccountId && names.acc.get(t.toAccountId)) || '',
      t.note ?? '',
    ]);
  }
  return '﻿' + rows.map((r) => r.map(esc).join(';')).join('\n');
}
