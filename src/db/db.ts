import Dexie, { type EntityTable } from 'dexie';
import type { Account, Category, Goal, Settings, Transaction } from '../lib/types';
import { seedAccounts, seedCategories, seedGoals, seedSettings } from './seed';

class AppDB extends Dexie {
  transactions!: EntityTable<Transaction, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  goals!: EntityTable<Goal, 'id'>;
  settings!: EntityTable<Settings, 'id'>;
  accounts!: EntityTable<Account, 'id'>;

  constructor() {
    super('kopilka');
    this.version(1).stores({
      transactions: 'id, type, date, categoryId, goalId, updatedAt',
      categories: 'id, kind, order',
      goals: 'id',
      settings: 'id',
    });
    // v2: счета. Старые расходы/доходы привязываем к «Карте».
    this.version(2)
      .stores({
        transactions: 'id, type, date, categoryId, goalId, accountId, updatedAt',
        accounts: 'id, order',
      })
      .upgrade(async (tx) => {
        await tx.table('accounts').bulkAdd(seedAccounts);
        await tx.table('transactions').toCollection().modify((t: Transaction) => {
          if ((t.type === 'expense' || t.type === 'income') && !t.accountId) t.accountId = 'acc-card';
        });
      });
    // Seed при первом создании базы
    this.on('populate', (tx) => {
      tx.table('categories').bulkAdd(seedCategories);
      tx.table('goals').bulkAdd(seedGoals);
      tx.table('settings').add(seedSettings);
      tx.table('accounts').bulkAdd(seedAccounts);
    });
  }
}

export const db = new AppDB();
