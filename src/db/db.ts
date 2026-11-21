import Dexie, { type EntityTable } from 'dexie';
import type { Category, Goal, Settings, Transaction } from '../lib/types';
import { seedCategories, seedGoals, seedSettings } from './seed';

class AppDB extends Dexie {
  transactions!: EntityTable<Transaction, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  goals!: EntityTable<Goal, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor() {
    super('kopilka');
    this.version(1).stores({
      transactions: 'id, type, date, categoryId, goalId, updatedAt',
      categories: 'id, kind, order',
      goals: 'id',
      settings: 'id',
    });
    // Seed при первом создании базы
    this.on('populate', (tx) => {
      tx.table('categories').bulkAdd(seedCategories);
      tx.table('goals').bulkAdd(seedGoals);
      tx.table('settings').add(seedSettings);
    });
  }
}

export const db = new AppDB();
