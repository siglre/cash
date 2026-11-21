import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import Dexie from 'dexie';

/** Миграции на реальном (эмулированном) IndexedDB: данные из старых версий не теряются. */
describe('миграции базы', () => {
  it('v1 → v3: счета, привязка операций к карте, обязательные расходы → регулярные платежи', async () => {
    // База «как на телефоне» после первой версии приложения
    const old = new Dexie('kopilka');
    old.version(1).stores({
      transactions: 'id, type, date, categoryId, goalId, updatedAt',
      categories: 'id, kind, order', goals: 'id', settings: 'id',
    });
    await old.open();
    await old.table('settings').add({ id: 'main', currency: 'RUB', monthlyIncome: 70000, fixedCosts: [{ name: 'Квартира', amount: 31000 }], monthStartDay: 1 });
    await old.table('transactions').bulkAdd([
      { id: 't1', type: 'expense', amount: 500, categoryId: 'exp-food', date: '2026-11-20T10:00:00Z', createdAt: '', updatedAt: '' },
      { id: 't2', type: 'to_goal', amount: 1000, goalId: 'goal-iphone', date: '2026-11-20T10:00:00Z', createdAt: '', updatedAt: '' },
    ]);
    await old.table('categories').add({ id: 'exp-food', name: 'Еда', emoji: '🛒', color: '#000', kind: 'expense', order: 0 });
    old.close();

    const { db } = await import('./db');
    await db.open();

    expect((await db.accounts.toArray()).map((a) => a.id)).toEqual(['acc-card', 'acc-credit']);
    expect((await db.transactions.get('t1'))?.accountId).toBe('acc-card');
    expect((await db.transactions.get('t2'))?.accountId).toBeUndefined();
    const rec = await db.recurring.toArray();
    expect(rec).toHaveLength(1);
    expect(rec[0]).toMatchObject({ name: 'Квартира', amount: 31000, categoryId: 'exp-rent', accountId: 'acc-card' });
    expect((await db.settings.get('main'))?.fixedCosts).toEqual([]);
    expect(await db.categories.count()).toBe(1); // существующие категории не перезаписаны
    db.close();
  });

  it('новая установка: seed; бэкап → восстановление возвращает те же данные', async () => {
    const { db } = await import('./db');
    const repo = await import('./repo');
    await db.delete();
    await db.open();
    expect(await db.recurring.count()).toBe(1);
    expect(await db.goals.count()).toBe(3);
    expect(await db.categories.count()).toBe(13);

    await repo.addTransaction({ type: 'expense', amount: 700, categoryId: 'exp-cafe', accountId: 'acc-card', date: new Date().toISOString() });
    const backup = await repo.exportBackup();
    await db.transactions.clear();
    await db.goals.clear();
    await repo.importBackup(JSON.parse(JSON.stringify(backup)));
    expect(await db.transactions.count()).toBe(1);
    expect(await db.goals.count()).toBe(3);
    expect((await db.settings.get('main'))?.monthlyIncome).toBe(70000);
  });
});
