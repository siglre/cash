import Dexie, { type EntityTable } from 'dexie';
import type { Account, Category, Goal, Recurring, Settings, Transaction } from '../lib/types';
import { seedAccounts, seedCategories, seedGoals, seedRecurring, seedSettings } from './seed';

class AppDB extends Dexie {
  transactions!: EntityTable<Transaction, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  goals!: EntityTable<Goal, 'id'>;
  settings!: EntityTable<Settings, 'id'>;
  accounts!: EntityTable<Account, 'id'>;
  recurring!: EntityTable<Recurring, 'id'>;

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
    // v3: регулярные платежи вместо «обязательных расходов» из настроек.
    this.version(3)
      .stores({ recurring: 'id, order' })
      .upgrade(async (tx) => {
        const s = (await tx.table('settings').get('main')) as Settings | undefined;
        const list: Recurring[] = (s?.fixedCosts ?? []).map((f, i) => ({
          id: crypto.randomUUID(),
          name: f.name,
          amount: f.amount,
          day: 1,
          categoryId: /квартир|аренд/i.test(f.name) ? 'exp-rent' : 'exp-other',
          accountId: 'acc-card',
          order: i,
        }));
        if (list.length) await tx.table('recurring').bulkAdd(list);
        await tx.table('settings').update('main', { fixedCosts: [] });
      });
    // Seed при первом создании базы
    this.on('populate', (tx) => {
      tx.table('categories').bulkAdd(seedCategories);
      tx.table('goals').bulkAdd(seedGoals);
      tx.table('settings').add(seedSettings);
      tx.table('accounts').bulkAdd(seedAccounts);
      tx.table('recurring').bulkAdd(seedRecurring);
    });
  }
}

export const db = new AppDB();
