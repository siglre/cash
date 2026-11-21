import { db } from './db';
import type { Transaction, TxType } from '../lib/types';

export interface NewTx {
  type: TxType;
  amount: number;
  categoryId?: string;
  goalId?: string;
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

/** Мягкое удаление — понадобится для синхронизации. */
export async function softDeleteTransaction(id: string) {
  await db.transactions.update(id, { deleted: true, updatedAt: new Date().toISOString() });
}
