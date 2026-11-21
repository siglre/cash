import type { Account, Category, Goal, Recurring, Settings } from '../lib/types';

export const seedRecurring: Recurring[] = [
  { id: 'rec-rent', name: 'Квартира', amount: 31000, day: 1, categoryId: 'exp-rent', accountId: 'acc-card', order: 0 },
];

export const seedAccounts: Account[] = [
  { id: 'acc-card', name: 'Карта', kind: 'debit', emoji: '💳', color: '#5B8CFF', initialBalance: 0, order: 0 },
  { id: 'acc-credit', name: 'Кредитка', kind: 'credit', emoji: '💳', color: '#F0609E', initialBalance: 0, order: 1 },
];

const exp = (id: string, name: string, emoji: string, color: string, order: number): Category =>
  ({ id, name, emoji, color, kind: 'expense', order });
const inc = (id: string, name: string, emoji: string, color: string, order: number): Category =>
  ({ id, name, emoji, color, kind: 'income', order });

export const seedCategories: Category[] = [
  exp('exp-rent', 'Квартира', '🏠', '#5B8CFF', 0),
  exp('exp-food', 'Еда', '🛒', '#34C98B', 1),
  exp('exp-cafe', 'Кафе', '☕', '#F5A340', 2),
  exp('exp-transport', 'Транспорт', '🚕', '#F2C94C', 3),
  exp('exp-subs', 'Связь и подписки', '📱', '#9B6BFF', 4),
  exp('exp-gifts', 'Подарки', '🎁', '#F0609E', 5),
  exp('exp-health', 'Здоровье', '🦷', '#35C4D8', 6),
  exp('exp-debt', 'Долги', '💳', '#EF5B5B', 7),
  exp('exp-fun', 'Развлечения', '🎮', '#7A7CFF', 8),
  exp('exp-other', 'Другое', '•', '#7C7C84', 9),
  inc('inc-salary', 'Зарплата', '💼', '#34C98B', 0),
  inc('inc-projects', 'Проекты', '🧩', '#5B8CFF', 1),
  inc('inc-other', 'Другое', '•', '#7C7C84', 2),
];

export const seedGoals: Goal[] = [
  { id: 'goal-airpods', name: 'AirPods (подарок)', target: 25000, deadline: new Date(2027, 2, 1).toISOString(), emoji: '🎧', gradient: ['#d55181', '#d55181'] },
  { id: 'goal-iphone', name: 'iPhone', target: 120000, deadline: new Date(2027, 4, 31).toISOString(), emoji: '📱', gradient: ['#3987e5', '#3987e5'] },
  { id: 'goal-tv-ps5', name: 'ТВ + PS5', target: 115000, deadline: new Date(2027, 7, 31).toISOString(), emoji: '🎮', gradient: ['#199e70', '#199e70'] },
];

export const seedSettings: Settings = {
  id: 'main',
  currency: 'RUB',
  monthlyIncome: 70000,
  fixedCosts: [],
  monthStartDay: 1,
};
