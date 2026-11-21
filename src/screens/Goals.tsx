import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { AppData } from '../hooks';
import type { Goal } from '../lib/types';
import { goalSaved, goalStatus, monthlyCapacity, neededPerMonth } from '../lib/calc';
import { monthGenitive } from '../lib/dates';
import { formatMoney } from '../lib/money';
import { ScreenTitle } from '../components/ScreenTitle';
import { Ring } from '../components/Ring';

const GOOD = '#30d158', WARN = '#ffd60a', BAD = '#ff6961';

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

/** Карточка цели: тёмная, плоская, кольцо прогресса и строки с плашками значений. */
function GoalCard({ goal, data, now, capacity, onMove, onEdit }: {
  goal: Goal; data: AppData; now: Date; capacity: number;
  onMove: (goalId: string, type: 'to_goal' | 'from_goal') => void;
  onEdit: () => void;
}) {
  const saved = goalSaved(data.txs, goal.id);
  const left = Math.max(0, goal.target - saved);
  const pct = Math.max(0, Math.min(100, Math.round((saved / goal.target) * 100)));
  const status = goalStatus(goal, saved, now, capacity, recentPace(data, goal.id, now));
  const perMonth = neededPerMonth(goal, saved, now);
  const dl = new Date(goal.deadline);
  const accent = goal.gradient[0];

  const st = {
    done: { text: 'Достигнута', color: GOOD },
    on_track: { text: 'Успеваешь', color: GOOD },
    need: { text: 'Нужно добавить темп', color: WARN },
    behind: { text: 'Не успеваешь', color: BAD },
  }[status.kind];

  return (
    <div className="dark-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[14px] text-[var(--ink-2)]">
            <span aria-hidden="true">{goal.emoji}</span>
            <span className="truncate">{goal.name}</span>
          </div>
          <div className="mt-1.5 text-[28px] font-semibold leading-none tracking-tight">{formatMoney(saved)}</div>
          <div className="mt-1 text-[12px] text-[var(--ink-muted)]">из {formatMoney(goal.target)} · {pct}%</div>
        </div>
        <Ring value={saved / goal.target} color={accent} />
      </div>

      <div className="hairline mb-1 mt-3.5" />
      <InfoRow label="Осталось"><Pill color={accent}>{formatMoney(left)}</Pill></InfoRow>
      <InfoRow label="Срок"><span className="text-[14px]">{dl.getDate()} {monthGenitive(dl.getMonth())} {dl.getFullYear()}</span></InfoRow>
      {status.kind !== 'done' && (
        <InfoRow label="Откладывать в месяц"><span className="text-[14px]">{formatMoney(perMonth)}</span></InfoRow>
      )}
      <InfoRow label="Статус"><Pill color={st.color}>{st.text}</Pill></InfoRow>

      <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onMove(goal.id, 'to_goal')}
          className="h-10 rounded-full bg-white text-[14px] font-semibold text-black">Отложить</motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onMove(goal.id, 'from_goal')} disabled={saved <= 0}
          className="h-10 rounded-full bg-white/10 text-[14px] disabled:opacity-40">Снять</motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onEdit}
          className="h-10 rounded-full bg-white/10 px-4 text-[14px]">Изменить</motion.button>
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[36px] items-center justify-between gap-3">
      <span className="text-[14px] text-[var(--ink-2)]">{label}</span>
      {children}
    </div>
  );
}

/** Плашка значения: цветной текст на приглушённом фоне того же цвета. */
function Pill({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="rounded-md px-2 py-0.5 text-[14px] font-medium tabular-nums"
      style={{ color, background: `color-mix(in oklab, ${color} 16%, transparent)` }}>
      {children}
    </span>
  );
}
