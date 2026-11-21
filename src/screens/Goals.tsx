import { motion, useReducedMotion } from 'framer-motion';
import type { AppData } from '../hooks';
import type { Goal } from '../lib/types';
import { goalSaved, goalStatus, monthlyCapacity, neededPerMonth } from '../lib/calc';
import { monthGenitive } from '../lib/dates';
import { formatMoney } from '../lib/money';
import { ScreenTitle } from '../components/ScreenTitle';

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

export function Goals({ data, now, onMove, onEdit }: {
  data: AppData; now: Date;
  onMove: (goalId: string, type: 'to_goal' | 'from_goal') => void;
  /** undefined — новая цель */
  onEdit: (g?: Goal) => void;
}) {
  const goals = data.goals.filter((g) => !g.archived).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const archived = data.goals.filter((g) => g.archived);
  const capacity = monthlyCapacity(data.settings, data.recurring);
  const totalSaved = goals.reduce((a, g) => a + goalSaved(data.txs, g.id), 0);
  const totalTarget = goals.reduce((a, g) => a + g.target, 0);

  return (
    <div className="px-4">
      <div className="flex items-end justify-between">
        <ScreenTitle>Цели</ScreenTitle>
        <button onClick={() => onEdit()} className="mb-3 h-11 px-1 text-[15px] text-[#007aff]">Новая цель</button>
      </div>
      {goals.length > 0 ? (
        <p className="-mt-1 px-1 pb-4 text-[13px] text-muted">
          Отложено {formatMoney(totalSaved)} из {formatMoney(totalTarget)}
        </p>
      ) : (
        <div className="ios-list px-4 py-5 text-center text-[15px] text-muted">Активных целей нет</div>
      )}
      <div className="flex flex-col gap-3">
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} data={data} now={now} capacity={capacity} onMove={onMove} onEdit={() => onEdit(g)} />
        ))}
      </div>

      {archived.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-1.5 px-4 text-[12px] uppercase tracking-wide text-muted">Архив</h2>
          <ul className="ios-list">
            {archived.map((g) => (
              <li key={g.id}>
                <button onClick={() => onEdit(g)} className="flex min-h-[46px] w-full items-center gap-3 px-4 text-left text-[15px] active:bg-black/5">
                  <span aria-hidden="true">{g.emoji}</span>
                  <span className="min-w-0 flex-1 truncate">{g.name}</span>
                  <span className="text-muted">{formatMoney(g.target)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function GoalCard({ goal, data, now, capacity, onMove, onEdit }: {
  goal: Goal; data: AppData; now: Date; capacity: number;
  onMove: (goalId: string, type: 'to_goal' | 'from_goal') => void;
  onEdit: () => void;
}) {
  const reduce = useReducedMotion();
  const saved = goalSaved(data.txs, goal.id);
  const pct = Math.max(0, Math.min(100, Math.round((saved / goal.target) * 100)));
  const status = goalStatus(goal, saved, now, capacity, recentPace(data, goal.id, now));
  const dl = new Date(goal.deadline);
  const [c1, c2] = goal.gradient;

  const chip = {
    done: { text: 'Цель достигнута', dot: '#4cd964' },
    on_track: { text: 'Успеваешь', dot: '#4cd964' },
    need: { text: `Нужно ${formatMoney(status.kind === 'need' ? status.perMonth : 0)} в месяц`, dot: '#ffd60a' },
    behind: { text: `Не успеваешь · нужно ${formatMoney(neededPerMonth(goal, saved, now))} в месяц`, dot: '#ff6b61' },
  }[status.kind];

  return (
    <div
      className="relative overflow-hidden rounded-[28px] p-4 text-white"
      style={{
        background: `radial-gradient(120% 90% at 0% 0%, ${c1} 0%, transparent 62%), radial-gradient(110% 100% at 100% 100%, ${c2} 0%, transparent 66%), linear-gradient(160deg, ${c1}, ${c2})`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4), inset 0 0 0 1px rgba(255,255,255,.18), 0 14px 34px rgba(0,0,0,.14)',
      }}
    >
      {/* мягкий блик для «стеклянности» */}
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/25 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="text-[26px] leading-none drop-shadow" aria-hidden="true">{goal.emoji}</div>
          <div className="min-w-0">
            <div className="truncate text-[17px] font-semibold">{goal.name}</div>
            <div className="mt-0.5 text-[12px] text-white/75">до {dl.getDate()} {monthGenitive(dl.getMonth())} {dl.getFullYear()}</div>
          </div>
        </div>
        <button onClick={onEdit} className="glass-btn h-8 shrink-0 rounded-full px-3 text-[13px]">Изменить</button>
      </div>

      <div className="relative mt-5 text-[22px] font-semibold leading-none">
        {formatMoney(saved)} <span className="text-[13px] font-normal text-white/70">из {formatMoney(goal.target)}</span>
      </div>
      <div className="relative mt-2.5 h-1.5 overflow-hidden rounded-full bg-black/20">
        <motion.div
          initial={reduce ? false : { width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-white"
        />
      </div>
      <div className="relative mt-1.5 flex justify-between text-[12px] text-white/85">
        <span>{pct}%</span>
        <span>осталось {formatMoney(Math.max(0, goal.target - saved))}</span>
      </div>

      <div className="glass-btn relative mt-4 inline-flex h-7 items-center gap-2 rounded-full px-3 text-[12px]">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: chip.dot }} />
        {chip.text}
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2.5">
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onMove(goal.id, 'to_goal')}
          className="h-11 rounded-full bg-white text-[15px] font-semibold text-black">Отложить</motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onMove(goal.id, 'from_goal')} disabled={saved <= 0}
          className="glass-btn h-11 rounded-full text-[15px] font-medium disabled:opacity-50">Снять</motion.button>
      </div>
    </div>
  );
}
