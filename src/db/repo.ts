import { db } from './db';
import type { Account, Settings, Transaction, TxType } from '../lib/types';
import { accountFlow } from '../lib/calc';

export interface NewTx {
  type: TxType;
  amount: number;
  categoryId?: string;
  goalId?: string;
  accountId?: string;
  toAccountId?: string;
  note?: string;
  date: string;
}

export async function addTransaction(input: NewTx): Promise<Transaction> {
  const now = new Date().toISOString();
  const tx: Transaction = {
    id: crypto.randomUUID(),
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
      id: crypto.randomUUID(), name: data.name, kind: data.kind, emoji: data.emoji, color: data.color,
      initialBalance: data.currentBalance, order,
    });
  }
}

export async function archiveAccount(id: string) {
  await db.accounts.update(id, { archived: true });
}
