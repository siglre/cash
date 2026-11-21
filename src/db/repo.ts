import { db } from './db';
import type { Account, Category, Goal, Recurring, Settings, Transaction, TxType } from '../lib/types';
import type { Backup } from '../lib/backup';
import { accountFlow } from '../lib/calc';
import { uuid } from '../lib/uuid';

export interface NewTx {
  type: TxType;
  amount: number;
  categoryId?: string;
  goalId?: string;
  accountId?: string;
  toAccountId?: string;
  recurringId?: string;
  note?: string;
  date: string;
}

export async function addTransaction(input: NewTx): Promise<Transaction> {
  const now = new Date().toISOString();
  const tx: Transaction = {
    id: uuid(),
    ...input,
    note: input.note?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  await db.transactions.add(tx);
  return tx;
}

export async function updateTransaction(id: string, input: NewTx) {
  await db.transactions.update(id, {
    ...input,
    note: input.note?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  });
}

/** Мягкое удаление — понадобится для синхронизации. */
export async function softDeleteTransaction(id: string) {
  await db.transactions.update(id, { deleted: true, updatedAt: new Date().toISOString() });
}

export async function restoreTransaction(id: string) {
  await db.transactions.update(id, { deleted: false, updatedAt: new Date().toISOString() });
}

export async function saveSettings(patch: Partial<Omit<Settings, 'id'>>) {
  await db.settings.update('main', patch);
}

/**
 * Сохранить счёт так, чтобы его ТЕКУЩИЙ остаток стал равен currentBalance.
 * История операций не меняется — подстраивается начальный остаток.
 */
export async function saveAccount(
  data: Pick<Account, 'name' | 'kind' | 'emoji' | 'color'> & { id?: string; currentBalance: number },
) {
  const txs = await db.transactions.toArray();
  if (data.id) {
    const initialBalance = data.currentBalance - accountFlow(data.id, txs);
    await db.accounts.update(data.id, { name: data.name, kind: data.kind, emoji: data.emoji, color: data.color, initialBalance });
  } else {
    const order = (await db.accounts.count()) + 1;
    await db.accounts.add({
      id: uuid(), name: data.name, kind: data.kind, emoji: data.emoji, color: data.color,
      initialBalance: data.currentBalance, order,
    });
  }
}

export async function archiveAccount(id: string) {
  await db.accounts.update(id, { archived: true });
}

/* ───── Цели ───── */

export async function saveGoal(goal: Omit<Goal, 'id'> & { id?: string }) {
  if (goal.id) await db.goals.update(goal.id, goal);
  else await db.goals.add({ ...goal, id: uuid() });
}

export async function setGoalArchived(id: string, archived: boolean) {
  await db.goals.update(id, { archived });
}

/** Удалить цель совсем можно, только если по ней не было операций — иначе в архив. */
export async function deleteGoal(id: string) {
  const used = await db.transactions.where('goalId').equals(id).filter((t) => !t.deleted).count();
  if (used) await setGoalArchived(id, true);
  else await db.goals.delete(id);
}

/* ───── Регулярные платежи ───── */

export async function saveRecurring(r: Omit<Recurring, 'id' | 'order'> & { id?: string }) {
  if (r.id) await db.recurring.update(r.id, r);
  else await db.recurring.add({ ...r, id: uuid(), order: await db.recurring.count() });
}

export async function archiveRecurring(id: string) {
  await db.recurring.update(id, { archived: true });
}

/* ───── Категории ───── */

/** Сохранить список категорий одного вида: новые добавить, изменённые обновить, убранные — в архив. */
export async function saveCategories(kind: Category['kind'], list: Category[]) {
  await db.transaction('rw', db.categories, async () => {
    const existing = await db.categories.where('kind').equals(kind).toArray();
    const keep = new Set(list.map((c) => c.id));
    for (const c of existing) if (!keep.has(c.id) && !c.archived) await db.categories.update(c.id, { archived: true });
    await db.categories.bulkPut(list.map((c, i) => ({ ...c, kind, order: i, archived: false })));
  });
}

/* ───── Бэкап ───── */

export async function exportBackup(): Promise<Backup> {
  return {
    app: 'kopilka',
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions: await db.transactions.toArray(),
    categories: await db.categories.toArray(),
    goals: await db.goals.toArray(),
    accounts: await db.accounts.toArray(),
    recurring: await db.recurring.toArray(),
    settings: (await db.settings.get('main'))!,
  };
}

/** Полная замена данных содержимым бэкапа (валидировать до вызова). */
export async function importBackup(b: Backup) {
  const tables = [db.transactions, db.categories, db.goals, db.accounts, db.recurring, db.settings];
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()));
    await db.transactions.bulkAdd(b.transactions);
    await db.categories.bulkAdd(b.categories);
    await db.goals.bulkAdd(b.goals);
    await db.accounts.bulkAdd(b.accounts);
    await db.recurring.bulkAdd(b.recurring);
    await db.settings.add({ ...b.settings, id: 'main' });
  });
}
