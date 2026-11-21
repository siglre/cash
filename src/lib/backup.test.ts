import { describe, expect, it } from 'vitest';
import { toCsv, validateBackup } from './backup';
import type { Transaction } from './types';

const t = (p: Partial<Transaction>): Transaction => ({
  id: '1', type: 'expense', amount: 100, date: new Date(2026, 10, 21).toISOString(),
  createdAt: '', updatedAt: '', ...p,
});
const ok = { app: 'kopilka', version: 1, transactions: [t({})], categories: [], goals: [], accounts: [], recurring: [], settings: {} };

describe('validateBackup', () => {
  it('принимает корректный', () => expect(validateBackup(ok)).toBeNull());
  it('отклоняет чужой и битый', () => {
    expect(validateBackup(null)).not.toBeNull();
    expect(validateBackup({ ...ok, app: 'x' })).toMatch(/не от этого/);
    expect(validateBackup({ ...ok, goals: undefined })).toMatch(/goals/);
    expect(validateBackup({ ...ok, transactions: [{ id: 1 }] })).toMatch(/Повреждённая/);
  });
});

describe('toCsv', () => {
  const names = { cat: new Map([['c', 'Еда']]), goal: new Map(), acc: new Map([['a', 'Карта']]) };
  it('строка расхода со знаком, экранирование, без удалённых', () => {
    const csv = toCsv([
      t({ categoryId: 'c', accountId: 'a', note: 'хлеб; молоко' }),
      t({ id: '2', deleted: true }),
    ], names);
    const lines = csv.replace('﻿', '').split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe('21.11.2026;Расход;-100;Еда;Карта;;"хлеб; молоко"');
  });
});
