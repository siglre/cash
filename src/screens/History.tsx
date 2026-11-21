import { useMemo, useState, type CSSProperties } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { AppData } from '../hooks';
import type { Transaction } from '../lib/types';
import { dayLabel, inPeriod, monthNominative, monthPeriod, startOfDay } from '../lib/dates';
import { formatMoney } from '../lib/money';
import { TxRow } from '../components/TxRow';
import { ScreenTitle } from '../components/ScreenTitle';
import { ChevronRight } from '../components/Icons';

const iconList = { '--sep-inset': '60px' } as CSSProperties;
const GOALS = '__goals';
const TRANSFERS = '__transfers';

/** Операции месяца по дням, с фильтром по категории. Тап по строке — изменить или удалить. */
export function History({ data, now, onEdit }: { data: AppData; now: Date; onEdit: (t: Transaction) => void }) {
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState<string | null>(null);

  const sd = data.settings.monthStartDay;
  const period = useMemo(() => {
    const cur = monthPeriod(now, sd).start;
    return monthPeriod(new Date(cur.getFullYear(), cur.getMonth() + offset, cur.getDate()), sd);
  }, [now, sd, offset]);

  const monthTxs = useMemo(() => data.txs.filter((t) => inPeriod(t.date, period)), [data.txs, period]);

  // Чипы фильтра: только то, что встречается в этом месяце
  const chips = useMemo(() => {
    const ids = new Set(monthTxs.map((t) => t.categoryId).filter(Boolean) as string[]);
    const list = data.categories.filter((c) => ids.has(c.id)).map((c) => ({ id: c.id, label: `${c.emoji} ${c.name}` }));
    if (monthTxs.some((t) => t.goalId)) list.push({ id: GOALS, label: '🎯 Цели' });
    if (monthTxs.some((t) => t.type === 'transfer')) list.push({ id: TRANSFERS, label: '⇄ Переводы' });
    return list;
  }, [monthTxs, data.categories]);

  const shown = monthTxs.filter((t) =>
    !filter ? true : filter === GOALS ? !!t.goalId : filter === TRANSFERS ? t.type === 'transfer' : t.categoryId === filter);

  const groups = useMemo(() => {
    const map = new Map<number, Transaction[]>();
    for (const t of shown) {
      const k = startOfDay(new Date(t.date)).getTime();
      (map.get(k) ?? map.set(k, []).get(k)!).push(t);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [shown]);

  const spent = shown.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const earned = shown.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const m = period.start;
  const label = monthNominative(m.getMonth()).replace(/^./, (c) => c.toUpperCase())
    + (m.getFullYear() !== now.getFullYear() ? ` ${m.getFullYear()}` : '');

  const shift = (d: number) => { setOffset(offset + d); setFilter(null); };

  return (
    <div className="px-4">
      <ScreenTitle>История</ScreenTitle>

      {/* Месяц */}
      <div className="-mt-1 mb-3 flex items-center justify-between">
        <button onClick={() => shift(-1)} aria-label="Предыдущий месяц" className="grid h-11 w-11 place-items-center rounded-full text-black/60 active:bg-black/5">
          <ChevronRight size={18} className="rotate-180" />
        </button>
        <div className="text-center">
          <div className="text-[15px] font-semibold">{label}</div>
          <div className="text-[12px] text-muted">
            {spent || earned ? `Расходы ${formatMoney(spent)}${earned ? ` · Доходы ${formatMoney(earned)}` : ''}` : 'Нет операций'}
          </div>
        </div>
        <button onClick={() => shift(1)} disabled={offset >= 0} aria-label="Следующий месяц" className="grid h-11 w-11 place-items-center rounded-full text-black/60 active:bg-black/5 disabled:opacity-20">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Фильтр */}
      {chips.length > 1 && (
        <div className="no-scrollbar -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4">
          {[{ id: null as string | null, label: 'Все' }, ...chips].map((c) => (
            <button
              key={c.id ?? 'all'} onClick={() => setFilter(c.id)}
              className={`h-8 shrink-0 rounded-full px-3 text-[13px] ${filter === c.id ? 'bg-black text-white' : 'bg-group text-black'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {groups.length === 0 && <div className="ios-list px-4 py-5 text-center text-[15px] text-muted">Операций нет</div>}
      {groups.map(([day, list]) => {
        const daySpent = list.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
        return (
          <section key={day} className="mb-6">
            <div className="mb-1 flex items-baseline justify-between px-4 text-[12px] uppercase tracking-wide text-muted">
              <span>{dayLabel(new Date(day), now)}</span>
              {daySpent > 0 && <span className="normal-case tracking-normal">−{formatMoney(daySpent)}</span>}
            </div>
            <ul className="ios-list" style={iconList}>
              <AnimatePresence initial={false}>
                {list.map((t) => <TxRow key={t.id} tx={t} data={data} now={now} onOpen={onEdit} />)}
              </AnimatePresence>
            </ul>
          </section>
        );
      })}
    </div>
  );
}
