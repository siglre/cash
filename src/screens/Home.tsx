import { AnimatePresence } from 'framer-motion';
import type { AppData } from '../hooks';
import { goalSaved, monthlyCapacity, monthSummary, nearestGoal, topCategory, totalNeededPerMonth, weeklySpend } from '../lib/calc';
import { monthPeriod, monthPrepositional } from '../lib/dates';
import { BalanceHero } from '../components/BalanceHero';
import { GoalTile, SaveTile, TopCategoryTile, WeekTile } from '../components/Bento';
import { TxRow } from '../components/TxRow';
import { SettingsIcon } from '../components/Icons';
import type { Tab } from '../components/TabBar';

export function Home({ data, now, onAdd, onNavigate }: {
  data: AppData; now: Date;
  onAdd: (t: 'expense' | 'income' | 'to_goal') => void;
  onNavigate: (t: Tab) => void;
}) {
  const { txs, categories, goals, settings } = data;
  const period = monthPeriod(now, settings.monthStartDay);
  const sum = monthSummary(txs, settings, now);
  const goal = nearestGoal(goals, txs);

  return (
    <>
      <header className="flex items-center justify-between px-5 pt-3">
        <div className="glass grid h-11 w-11 place-items-center rounded-full text-[17px] font-semibold" aria-hidden="true">К</div>
        <button aria-label="Настройки" className="glass grid h-11 w-11 place-items-center rounded-full text-white/80">
          <SettingsIcon size={20} />
        </button>
      </header>

      <BalanceHero
        monthLabel={monthPrepositional(period.start.getMonth())}
        free={sum.free} incomeBase={sum.incomeBase} onAdd={onAdd}
      />

      <section className="mt-8 grid grid-cols-2 gap-3 px-4">
        <WeekTile week={weeklySpend(txs, now)} />
        <GoalTile goal={goal} saved={goal ? goalSaved(txs, goal.id) : 0} onOpen={() => onNavigate('goals')} />
        <SaveTile perMonth={totalNeededPerMonth(goals, txs, now)} capacity={monthlyCapacity(settings)} />
        <TopCategoryTile top={topCategory(txs, categories, period)} />
      </section>

      <section className="mt-8 px-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[17px] font-semibold">Последние операции</h2>
          <button onClick={() => onNavigate('history')} className="h-11 px-2 text-[15px] text-muted">Все</button>
        </div>
        {txs.length === 0 ? (
          <div className="card p-6 text-center text-[15px] text-muted">Пока пусто. Нажми ＋, чтобы записать первую трату.</div>
        ) : (
          <ul className="card divide-y divide-line overflow-hidden">
            <AnimatePresence initial={false}>
              {txs.slice(0, 5).map((t) => <TxRow key={t.id} tx={t} data={data} now={now} />)}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </>
  );
}
