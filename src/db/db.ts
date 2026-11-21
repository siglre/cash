import Dexie, { type EntityTable } from 'dexie';
import type { Account, Category, Goal, Recurring, Settings, Transaction } from '../lib/types';
import { seedAccounts, seedCategories, seedGoals, seedRecurring, seedSettings } from './seed';
import { uuid } from '../lib/uuid';
import { demoTransactions, isDemo } from './demo';

class AppDB extends Dexie {
  transactions!: EntityTable<Transaction, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  goals!: EntityTable<Goal, 'id'>;
  settings!: EntityTable<Settings, 'id'>;
  accounts!: EntityTable<Account, 'id'>;
  recurring!: EntityTable<Recurring, 'id'>;

  constructor() {
    super(isDemo ? 'kopilka-demo' : 'kopilka');
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
          id: uuid(),
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
    // v4: цели без градиентов — один акцентный цвет из проверенной палитры
    this.version(4).upgrade(async (tx) => {
      const remap: Record<string, string> = { '#F0609E': '#d55181', '#5B8CFF': '#3987e5', '#2BD4A7': '#199e70' };
      await tx.table('goals').toCollection().modify((g: Goal) => {
        const c = remap[g.gradient[0]] ?? g.gradient[0];
        g.gradient = [c, c];
      });
    });
    // Seed при первом создании базы
    this.on('populate', (tx) => {
      tx.table('categories').bulkAdd(seedCategories);
      tx.table('goals').bulkAdd(seedGoals);
      tx.table('settings').add(seedSettings);
      tx.table('accounts').bulkAdd(seedAccounts);
      tx.table('recurring').bulkAdd(seedRecurring);
      if (isDemo) {
        tx.table('transactions').bulkAdd(demoTransactions());
        tx.table('accounts').update('acc-card', { initialBalance: 60000 });
        tx.table('accounts').update('acc-credit', { initialBalance: -12000 });
      }
    });
  }
}

export const db = new AppDB();
