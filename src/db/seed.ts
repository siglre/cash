import type { Category, Goal, Settings } from '../lib/types';

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
  { id: 'goal-airpods', name: 'AirPods (подарок)', target: 25000, deadline: new Date(2027, 2, 1).toISOString(), emoji: '🎧', gradient: ['#F0609E', '#FF9A6B'] },
  { id: 'goal-iphone', name: 'iPhone', target: 120000, deadline: new Date(2027, 4, 31).toISOString(), emoji: '📱', gradient: ['#5B8CFF', '#9B6BFF'] },
  { id: 'goal-tv-ps5', name: 'ТВ + PS5', target: 115000, deadline: new Date(2027, 7, 31).toISOString(), emoji: '🎮', gradient: ['#2BD4A7', '#35A7D8'] },
];

export const seedSettings: Settings = {
  id: 'main',
  currency: 'RUB',
  monthlyIncome: 70000,
  fixedCosts: [{ name: 'Квартира', amount: 31000 }],
  monthStartDay: 1,
};
