import { motion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';
import { ArrowUpRight, PlusIcon } from './Icons';
import { formatMoney } from '../lib/money';

export function BalanceHero({ monthLabel, free, income, incomeIsPlan, expense, toGoals, onAdd }: {
  monthLabel: string; free: number; income: number; incomeIsPlan: boolean;
  expense: number; toGoals: number;
  onAdd: (t: 'expense' | 'income' | 'to_goal') => void;
}) {
  return (
    <section className="px-5 pt-5">
      <div className="text-center">
        <div className="text-[15px] text-muted">Свободно в {monthLabel}</div>
        <AnimatedNumber
          value={free}
          className={`mt-1 block text-[52px] font-semibold leading-[1.05] tracking-tight ${free < 0 ? 'text-neg' : ''}`}
        />
        <div className="mt-1 text-[13px] text-muted">доход − расходы − отложено на цели</div>
      </div>

      <div className="card mt-5 grid grid-cols-3 divide-x divide-line py-3 text-center">
        <Stat label={incomeIsPlan ? 'Доход (план)' : 'Доход'} value={formatMoney(income)} />
        <Stat label="Расходы" value={formatMoney(expense)} />
        <Stat label="Отложено" value={formatMoney(toGoals)} />
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }} onClick={() => onAdd('expense')}
        className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white text-[17px] font-semibold text-black shadow-[0_8px_30px_rgba(255,255,255,0.12)]"
      >
        <PlusIcon size={22} /> Записать расход
      </motion.button>
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onAdd('income')}
          className="glass flex h-12 items-center justify-center gap-1.5 rounded-full text-[15px] font-semibold">
          <PlusIcon size={18} /> Доход
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onAdd('to_goal')}
          className="glass flex h-12 items-center justify-center gap-1.5 rounded-full text-[15px] font-semibold">
          <ArrowUpRight size={18} /> Отложить в цель
        </motion.button>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-1">
      <div className="text-[12px] text-muted">{label}</div>
      <div className="mt-0.5 text-[15px] font-semibold">{value}</div>
    </div>
  );
}
