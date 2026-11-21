import { motion, useReducedMotion } from 'framer-motion';
import type { Category, Goal } from '../lib/types';
import { formatMoney } from '../lib/money';
import { monthGenitive } from '../lib/dates';
import { CatIcon } from './CatIcon';
import { ChevronRight } from './Icons';

/** Плитка — всегда кнопка: тап ведёт на связанный экран. */
const Tile = ({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) => (
  <motion.button whileTap={{ scale: 0.97 }} onClick={onClick} className="card flex min-h-[168px] flex-col p-4 text-left">
    <div className="flex w-full items-center justify-between text-[13px] text-muted">
      <span>{title}</span><ChevronRight size={14} />
    </div>
    {children}
  </motion.button>
);

const DAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

export function WeekTile({ week, onOpen }: { week: { date: Date; amount: number }[]; onOpen: () => void }) {
  const reduce = useReducedMotion();
  const total = week.reduce((a, d) => a + d.amount, 0);
  const max = Math.max(...week.map((d) => d.amount), 1);
  return (
    <Tile title="Траты за 7 дней" onClick={onOpen}>
      <div className="mt-1 text-[22px] font-semibold leading-tight">{formatMoney(total)}</div>
      <div className="mt-auto flex h-[78px] items-end justify-between gap-1">
        {week.map((d, i) => {
          const h = Math.max(8, Math.round((d.amount / max) * 60));
          const today = i === week.length - 1;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <motion.div
                initial={reduce ? false : { height: 8 }} animate={{ height: h }}
                transition={{ type: 'spring', stiffness: 160, damping: 20, delay: i * 0.04 }}
                className="w-full max-w-[14px] rounded-full"
                style={{
                  background: d.amount ? 'linear-gradient(180deg,#9B6BFF,#2BD4A7)' : 'rgba(255,255,255,0.08)',
                  opacity: today || !d.amount ? 1 : 0.7,
                }}
              />
              <span className={`text-[10px] ${today ? 'text-white' : 'text-muted'}`}>{DAYS[d.date.getDay()]}</span>
            </div>
          );
        })}
      </div>
    </Tile>
  );
}

export function GoalTile({ goal, saved, onOpen }: { goal?: Goal; saved: number; onOpen: () => void }) {
  const reduce = useReducedMotion();
  if (!goal) {
    return <Tile title="Ближайшая цель" onClick={onOpen}><div className="mt-2 text-[15px] text-muted">Нет активных целей</div></Tile>;
  }
  const pct = Math.min(100, Math.round((saved / goal.target) * 100));
  const dl = new Date(goal.deadline);
  return (
    <Tile title="Ближайшая цель" onClick={onOpen}>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-[22px]" aria-hidden="true">{goal.emoji}</span>
        <span className="truncate text-[17px] font-semibold">{goal.name}</span>
      </div>
      <div className="mt-auto w-full">
        <div className="text-[28px] font-semibold leading-none">{pct}%</div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={reduce ? false : { width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${goal.gradient[0]}, ${goal.gradient[1]})` }}
          />
        </div>
        <div className="mt-2 text-[12px] leading-snug text-muted">
          осталось {formatMoney(Math.max(0, goal.target - saved))} · до {dl.getDate()} {monthGenitive(dl.getMonth())}
        </div>
      </div>
    </Tile>
  );
}

export function SaveTile({ perMonth, capacity, onOpen }: { perMonth: number; capacity: number; onOpen: () => void }) {
  const tooMuch = perMonth > capacity;
  return (
    <Tile title="Нужно откладывать" onClick={onOpen}>
      <div className="mt-1 text-[22px] font-semibold leading-tight">{formatMoney(perMonth)}<span className="text-[14px] font-medium text-muted"> / мес</span></div>
      <div className="mt-auto text-[12px] leading-snug text-muted">
        чтобы успеть ко всем целям в срок
        {capacity > 0 && perMonth > 0 && (
          <div className={`mt-1 ${tooMuch ? 'text-neg' : ''}`}>
            {tooMuch ? 'Больше, чем' : 'Из'} {formatMoney(capacity)}, что остаётся после обязательных расходов
          </div>
        )}
      </div>
    </Tile>
  );
}

export function TopCategoryTile({ top, onOpen }: { top?: { category: Category; amount: number }; onOpen: () => void }) {
  return (
    <Tile title="Больше всего трат" onClick={onOpen}>
      {top ? (
        <>
          <div className="mt-2"><CatIcon emoji={top.category.emoji} from={top.category.color} size={44} /></div>
          <div className="mt-auto">
            <div className="truncate text-[17px] font-semibold">{top.category.name}</div>
            <div className="text-[13px] text-muted">{formatMoney(top.amount)} за месяц</div>
          </div>
        </>
      ) : (
        <div className="mt-2 text-[15px] text-muted">В этом месяце трат пока нет</div>
      )}
    </Tile>
  );
}
