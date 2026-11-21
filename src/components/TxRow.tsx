import { motion } from 'framer-motion';
import type { Transaction } from '../lib/types';
import type { AppData } from '../hooks';
import { describeTx } from '../lib/present';
import { formatMoney } from '../lib/money';
import { CatIcon } from './CatIcon';

/** Строка операции внутри .ios-list. Тап — редактирование. */
export function TxRow({ tx, data, now, onOpen }: {
  tx: Transaction; data: AppData; now: Date; onOpen: (t: Transaction) => void;
}) {
  const v = describeTx(tx, data.catMap, data.goalMap, data.accountMap, now);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
    >
      <button
        onClick={() => onOpen(tx)}
        className="flex min-h-[56px] w-full items-center gap-3 px-4 py-2 text-left transition-colors active:bg-black/5"
      >
        <CatIcon emoji={v.emoji} from={v.color} size={34} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] leading-tight">{v.title}</div>
          <div className="mt-0.5 truncate text-[12px] text-muted">{v.subtitle}</div>
        </div>
        <div className={`whitespace-nowrap text-[15px] ${v.positive ? 'text-pos' : ''}`}>
          {v.sign}{formatMoney(tx.amount)}
        </div>
      </button>
    </motion.li>
  );
}
