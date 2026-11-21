import { useMemo, type CSSProperties } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { AppData } from '../hooks';
import type { Transaction } from '../lib/types';
import { dayLabel, startOfDay } from '../lib/dates';
import { formatMoney } from '../lib/money';
import { TxRow } from '../components/TxRow';
import { ScreenTitle } from '../components/ScreenTitle';

const iconList = { '--sep-inset': '60px' } as CSSProperties;

/** Операции по дням. Тап по строке — изменить или удалить. */
export function History({ data, now, onEdit }: { data: AppData; now: Date; onEdit: (t: Transaction) => void }) {
  const groups = useMemo(() => {
    const map = new Map<number, Transaction[]>();
    for (const t of data.txs) {
      const k = startOfDay(new Date(t.date)).getTime();
      (map.get(k) ?? map.set(k, []).get(k)!).push(t);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [data.txs]);

  return (
    <div className="px-4">
      <ScreenTitle>История</ScreenTitle>
      {groups.length === 0 && <div className="ios-list px-4 py-5 text-center text-[15px] text-muted">Операций пока нет</div>}
      {groups.map(([day, list]) => {
        const spent = list.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
        return (
          <section key={day} className="mb-6">
            <div className="mb-1.5 flex items-baseline justify-between px-4 text-[12px] uppercase tracking-wide text-muted">
              <span>{dayLabel(new Date(day), now)}</span>
              {spent > 0 && <span className="normal-case tracking-normal">−{formatMoney(spent)}</span>}
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
