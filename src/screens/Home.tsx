import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { AppData } from '../hooks';
import type { Goal, Transaction } from '../lib/types';
import { goalSaved, monthSummary, totalNeededPerMonth } from '../lib/calc';
import { monthGenitive, monthPeriod, monthPrepositional } from '../lib/dates';
import { formatMoney } from '../lib/money';
import { BalanceHero } from '../components/BalanceHero';
import { TxRow } from '../components/TxRow';
import { CatIcon } from '../components/CatIcon';
import { ChevronRight } from '../components/Icons';
import type { Tab } from '../components/TabBar';

export function Home({ data, now, onAdd, onEdit, onNavigate, onSettings }: {
  data: AppData; now: Date;
  onAdd: (t: 'expense' | 'income' | 'to_goal') => void;
  onEdit: (t: Transaction) => void;
  onNavigate: (t: Tab) => void;
  onSettings: () => void;
}) {
  const { txs, goals, settings } = data;
  const period = monthPeriod(now, settings.monthStartDay);
  const sum = monthSummary(txs, settings, now);
  const activeGoals = goals.filter((g) => !g.archived).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const perMonth = totalNeededPerMonth(goals, txs, now);

  return (
    <>
      <BalanceHero
        monthLabel={monthPrepositional(period.start.getMonth())}
        free={sum.free} income={sum.incomeBase} incomeIsPlan={sum.income < settings.monthlyIncome}
        expense={sum.expense} toGoals={sum.toGoals} empty={txs.length === 0}
        onAdd={onAdd} onSettings={onSettings}
      />

      <section className="mt-7 px-5">
        <SectionHeader title="Последние операции" onAll={() => onNavigate('history')} />
        {txs.length === 0 ? (
          <div className="row-card px-4 py-5 text-center text-[15px] text-muted">Операций пока нет</div>
        ) : (
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {txs.slice(0, 5).map((t) => <TxRow key={t.id} tx={t} data={data} now={now} onOpen={onEdit} />)}
            </AnimatePresence>
          </ul>
        )}
      </section>

      {activeGoals.length > 0 && (
        <section className="mt-7 px-5">
          <SectionHeader title="Цели" onAll={() => onNavigate('goals')} />
          {perMonth > 0 && (
            <p className="-mt-1 mb-3 text-[13px] text-muted">
              Чтобы успеть ко всем, откладывай {formatMoney(perMonth)} в месяц
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {activeGoals.map((g) => (
              <GoalRow key={g.id} goal={g} saved={goalSaved(txs, g.id)} onOpen={() => onNavigate('goals')} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function SectionHeader({ title, onAll }: { title: string; onAll: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      <button onClick={onAll} className="-mr-2 flex h-11 items-center gap-0.5 px-2 text-[15px] text-muted">
        Все <ChevronRight size={16} />
      </button>
    </div>
  );
}

function GoalRow({ goal, saved, onOpen }: { goal: Goal; saved: number; onOpen: () => void }) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, Math.round((saved / goal.target) * 100)));
  const dl = new Date(goal.deadline);
  return (
    <li>
      <motion.button whileTap={{ scale: 0.98 }} onClick={onOpen} className="row-card flex w-full items-center gap-3.5 px-4 py-3.5 text-left">
        <CatIcon emoji={goal.emoji} from={goal.gradient[0]} to={goal.gradient[1]} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[16px] font-medium">{goal.name}</span>
            <span className="shrink-0 text-[15px] font-semibold">{pct}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={reduce ? false : { width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${goal.gradient[0]}, ${goal.gradient[1]})` }}
            />
          </div>
          <div className="mt-1.5 text-[13px] text-muted">
            {formatMoney(saved)} из {formatMoney(goal.target)} · до {dl.getDate()} {monthGenitive(dl.getMonth())}
          </div>
        </div>
      </motion.button>
    </li>
  );
}
