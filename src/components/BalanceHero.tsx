import { motion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';
import { ArrowDownLeft, ArrowUpRight, PlusIcon } from './Icons';
import { formatMoney } from '../lib/money';

export function BalanceHero({ monthLabel, free, incomeBase, onAdd }: {
  monthLabel: string; free: number; incomeBase: number;
  onAdd: (t: 'expense' | 'income' | 'to_goal') => void;
}) {
  return (
    <section className="px-5 pt-6 text-center">
      <div className="text-[15px] text-muted">Свободно в {monthLabel}</div>
      <AnimatedNumber
        value={free}
        className={`mt-1 block text-[52px] font-semibold leading-[1.05] tracking-tight ${free < 0 ? 'text-neg' : ''}`}
      />
      <div className="mt-1 text-[13px] text-muted">из {formatMoney(incomeBase)} дохода</div>

      <div className="mt-6 flex items-end justify-center gap-7">
        <Action label="Доход" onClick={() => onAdd('income')}><ArrowDownLeft size={24} /></Action>
        <div className="flex flex-col items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onAdd('expense')}
            aria-label="Добавить расход"
            className="grid h-[76px] w-[76px] place-items-center rounded-full bg-white text-black shadow-[0_8px_30px_rgba(255,255,255,0.18),inset_0_1px_0_rgba(255,255,255,0.9)]"
          >
            <PlusIcon size={34} />
          </motion.button>
          <span className="text-[13px] text-muted">Расход</span>
        </div>
        <Action label="В цель" onClick={() => onAdd('to_goal')}><ArrowUpRight size={24} /></Action>
      </div>
    </section>
  );
}

function Action({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        whileTap={{ scale: 0.92 }} onClick={onClick} aria-label={label}
        className="glass grid h-14 w-14 place-items-center rounded-full"
      >
        {children}
      </motion.button>
      <span className="text-[13px] text-muted">{label}</span>
    </div>
  );
}
