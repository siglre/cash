import { motion } from 'framer-motion';
import type { Transaction } from '../lib/types';
import type { AppData } from '../hooks';
import { describeTx } from '../lib/present';
import { formatMoney } from '../lib/money';
import { CatIcon } from './CatIcon';
import { ChevronRight } from './Icons';

/** Строка операции. Тап — редактирование. */
export function TxRow({ tx, data, now, onOpen }: {
  tx: Transaction; data: AppData; now: Date; onOpen: (t: Transaction) => void;
}) {
  const v = describeTx(tx, data.catMap, data.goalMap, now);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
    >
      <button onClick={() => onOpen(tx)} className="flex min-h-[64px] w-full items-center gap-3 px-4 py-2.5 text-left active:bg-white/[0.04]">
        <CatIcon emoji={v.emoji} from={v.color} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-medium leading-tight">{v.title}</div>
          <div className="mt-0.5 truncate text-[13px] text-muted">{v.subtitle}</div>
        </div>
        <div className={`whitespace-nowrap text-[16px] font-semibold ${v.positive ? 'text-pos' : ''}`}>
          {v.sign}{formatMoney(tx.amount)}
        </div>
        <ChevronRight size={16} className="shrink-0 text-muted/60" />
      </button>
    </motion.li>
  );
}
