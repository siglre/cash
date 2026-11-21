import { motion, useReducedMotion } from 'framer-motion';
import type { AppData } from '../hooks';
import type { Goal } from '../lib/types';
import { goalSaved, goalStatus, monthlyCapacity, neededPerMonth } from '../lib/calc';
import { monthGenitive } from '../lib/dates';
import { formatMoney } from '../lib/money';

/** Накоплено на цель за последние 30 дней — «реальный темп» для статуса. */
function recentPace(data: AppData, goalId: string, now: Date): number {
  const from = now.getTime() - 30 * 86400000;
  let s = 0;
  for (const t of data.txs) {
    if (t.goalId !== goalId || new Date(t.date).getTime() < from) continue;
    s += t.type === 'to_goal' ? t.amount : t.type === 'from_goal' ? -t.amount : 0;
  }
  return s;
}

export function Goals({ data, now, onMove }: {
  data: AppData; now: Date; onMove: (goalId: string, type: 'to_goal' | 'from_goal') => void;
}) {
  const goals = data.goals.filter((g) => !g.archived);
  const capacity = monthlyCapacity(data.settings);
  const totalSaved = goals.reduce((a, g) => a + goalSaved(data.txs, g.id), 0);
  const totalTarget = goals.reduce((a, g) => a + g.target, 0);

  return (
    <section className="px-5" style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}>
      <h1 className="pb-1 text-[28px] font-semibold">Цели</h1>
      <p className="pb-5 text-[14px] text-muted">
        Всего отложено {formatMoney(totalSaved)} из {formatMoney(totalTarget)}
      </p>
      <div className="flex flex-col gap-4">
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} data={data} now={now} capacity={capacity} onMove={onMove} />
        ))}
      </div>
    </section>
  );
}

function GoalCard({ goal, data, now, capacity, onMove }: {
  goal: Goal; data: AppData; now: Date; capacity: number;
  onMove: (goalId: string, type: 'to_goal' | 'from_goal') => void;
}) {
  const reduce = useReducedMotion();
  const saved = goalSaved(data.txs, goal.id);
  const pct = Math.max(0, Math.min(100, Math.round((saved / goal.target) * 100)));
  const status = goalStatus(goal, saved, now, capacity, recentPace(data, goal.id, now));
  const dl = new Date(goal.deadline);
  const [c1, c2] = goal.gradient;

  const chip = {
    done: { text: 'Цель достигнута', cls: 'bg-pos/20 text-pos' },
    on_track: { text: 'Успеваешь', cls: 'bg-pos/20 text-pos' },
    need: { text: `Нужно ${formatMoney(status.kind === 'need' ? status.perMonth : 0)} в месяц`, cls: 'bg-warn/20 text-warn' },
    behind: { text: `Не успеваешь · нужно ${formatMoney(neededPerMonth(goal, saved, now))} в месяц`, cls: 'bg-neg/20 text-neg' },
  }[status.kind];

  return (
    <div
      className="relative overflow-hidden rounded-[28px] p-5"
      style={{
        background: `radial-gradient(120% 90% at 0% 0%, ${c1} 0%, transparent 60%), radial-gradient(110% 100% at 100% 100%, ${c2} 0%, transparent 65%), #15151a`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.28), inset 0 0 0 1px rgba(255,255,255,.12)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[20px] font-semibold">{goal.name}</div>
          <div className="mt-0.5 text-[13px] text-white/75">до {dl.getDate()} {monthGenitive(dl.getMonth())} {dl.getFullYear()}</div>
        </div>
        <div className="text-[34px] leading-none" aria-hidden="true">{goal.emoji}</div>
      </div>

      <div className="mt-6 text-[26px] font-semibold leading-none">
        {formatMoney(saved)} <span className="text-[16px] font-medium text-white/70">из {formatMoney(goal.target)}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
        <motion.div
          initial={reduce ? false : { width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-white"
        />
      </div>
      <div className="mt-2 flex justify-between text-[13px] text-white/80">
        <span>{pct}%</span>
        <span>осталось {formatMoney(Math.max(0, goal.target - saved))}</span>
      </div>

      <div className={`mt-4 inline-block rounded-full px-3 py-1.5 text-[13px] font-semibold backdrop-blur-md ${chip.cls}`}>{chip.text}</div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onMove(goal.id, 'to_goal')}
          className="h-12 rounded-full btn-primary text-[16px] font-semibold">Отложить</motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onMove(goal.id, 'from_goal')} disabled={saved <= 0}
          className="btn-glass h-12 rounded-full text-[16px] font-semibold disabled:opacity-40">Снять</motion.button>
      </div>
    </div>
  );
}
