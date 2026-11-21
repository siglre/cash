import { useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { AppData } from '../hooks';
import type { Transaction } from '../lib/types';
import { dayLabel, startOfDay } from '../lib/dates';
import { formatMoney } from '../lib/money';
import { TxRow } from '../components/TxRow';

/** Операции по дням. Тап по строке — редактирование/удаление. Фильтры — этап 2. */
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
    <section className="px-4 pt-4">
      <h1 className="px-1 pb-1 pt-2 text-[28px] font-semibold">История</h1>
      <p className="px-1 pb-4 text-[14px] text-muted">Нажми на операцию, чтобы изменить или удалить её.</p>
      {groups.length === 0 && <div className="card p-6 text-center text-[15px] text-muted">Операций пока нет</div>}
      {groups.map(([day, list]) => {
        const spent = list.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
        return (
          <div key={day} className="mb-5">
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 className="text-[15px] font-semibold">{dayLabel(new Date(day), now)}</h2>
              {spent > 0 && <span className="text-[13px] text-muted">потрачено {formatMoney(spent)}</span>}
            </div>
            <ul className="card divide-y divide-line overflow-hidden">
              <AnimatePresence initial={false}>
                {list.map((t) => <TxRow key={t.id} tx={t} data={data} now={now} onOpen={onEdit} />)}
              </AnimatePresence>
            </ul>
          </div>
        );
      })}
    </section>
  );
}
