import { AnimatePresence } from 'framer-motion';
import type { AppData } from '../hooks';
import { TxRow } from '../components/TxRow';

/** Черновая версия для этапа 1: плоский список. Группировка, фильтры, свайп — этап 2. */
export function History({ data, now }: { data: AppData; now: Date }) {
  return (
    <section className="px-4 pt-4">
      <h1 className="px-1 pb-4 pt-2 text-[28px] font-semibold">История</h1>
      {data.txs.length === 0 ? (
        <div className="card p-6 text-center text-[15px] text-muted">Операций пока нет</div>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          <AnimatePresence initial={false}>
            {data.txs.map((t) => <TxRow key={t.id} tx={t} data={data} now={now} />)}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
