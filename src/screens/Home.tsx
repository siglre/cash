import { AnimatePresence } from 'framer-motion';
import type { AppData } from '../hooks';
import type { Transaction } from '../lib/types';
import { goalSaved, monthlyCapacity, monthSummary, nearestGoal, topCategory, totalNeededPerMonth, weeklySpend } from '../lib/calc';
import { monthPeriod, monthPrepositional } from '../lib/dates';
import { BalanceHero } from '../components/BalanceHero';
import { GoalTile, SaveTile, TopCategoryTile, WeekTile } from '../components/Bento';
import { TxRow } from '../components/TxRow';
import { SettingsIcon } from '../components/Icons';
import type { Tab } from '../components/TabBar';

export function Home({ data, now, onAdd, onEdit, onNavigate, onSettings }: {
  data: AppData; now: Date;
  onAdd: (t: 'expense' | 'income' | 'to_goal') => void;
  onEdit: (t: Transaction) => void;
  onNavigate: (t: Tab) => void;
  onSettings: () => void;
}) {
  const { txs, categories, goals, settings } = data;
  const period = monthPeriod(now, settings.monthStartDay);
  const sum = monthSummary(txs, settings, now);
  const goal = nearestGoal(goals, txs);

  return (
    <>
      <header className="flex items-center justify-between px-5 pt-3">
        <h1 className="text-[22px] font-semibold">Копилка</h1>
        <button onClick={onSettings} className="glass flex h-11 items-center gap-1.5 rounded-full pl-3.5 pr-4 text-[15px] font-medium">
          <SettingsIcon size={18} /> Настройки
        </button>
      </header>

      <BalanceHero
        monthLabel={monthPrepositional(period.start.getMonth())}
        free={sum.free} income={sum.incomeBase} incomeIsPlan={sum.income < settings.monthlyIncome}
        expense={sum.expense} toGoals={sum.toGoals} onAdd={onAdd}
      />

      <section className="mt-6 grid grid-cols-2 gap-3 px-4">
        <WeekTile week={weeklySpend(txs, now)} onOpen={() => onNavigate('history')} />
        <GoalTile goal={goal} saved={goal ? goalSaved(txs, goal.id) : 0} onOpen={() => onNavigate('goals')} />
        <SaveTile perMonth={totalNeededPerMonth(goals, txs, now)} capacity={monthlyCapacity(settings)} onOpen={() => onNavigate('goals')} />
        <TopCategoryTile top={topCategory(txs, categories, period)} onOpen={() => onNavigate('history')} />
      </section>

      <section className="mt-8 px-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[17px] font-semibold">Последние операции</h2>
          <button onClick={() => onNavigate('history')} className="h-11 px-2 text-[15px] text-muted">Вся история</button>
        </div>
        {txs.length === 0 ? (
          <div className="card p-6 text-center text-[15px] text-muted">Пока пусто. Нажми «Записать расход», чтобы добавить первую трату.</div>
        ) : (
          <ul className="card divide-y divide-line overflow-hidden">
            <AnimatePresence initial={false}>
              {txs.slice(0, 5).map((t) => <TxRow key={t.id} tx={t} data={data} now={now} onOpen={onEdit} />)}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </>
  );
}
