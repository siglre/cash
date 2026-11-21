import { motion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';
import { ArrowDownLeft, ArrowUpRight, PlusIcon } from './Icons';
import { formatMoney } from '../lib/money';

/** Тёмная карточка-«кошелёк»: баланс месяца и три действия. */
export function BalanceHero({ monthLabel, free, income, incomeIsPlan, expense, toGoals, empty, onAdd }: {
  monthLabel: string; free: number; income: number; incomeIsPlan: boolean;
  expense: number; toGoals: number; empty: boolean;
  onAdd: (t: 'expense' | 'income' | 'to_goal') => void;
}) {
  const negative = free < 0;
  return (
    <section className="hero mx-2 rounded-[40px] px-5 pb-7 pt-12 text-center">
      <div className="text-[17px] font-medium text-white/90">Свободно в {monthLabel}</div>
      <AnimatedNumber
        value={free}
        className="mt-3 block text-[58px] font-semibold leading-none tracking-tight"
        style={negative ? { color: '#ff6b61' } : {
          background: 'linear-gradient(90deg, #ffffff 30%, #9a9aa0 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        }}
      />
      <div className="mt-3 text-[15px] text-white/75">
        из {formatMoney(income)} дохода{incomeIsPlan ? ' (план)' : ''}
      </div>

      <div className="mt-10 flex items-center justify-center gap-3.5">
        <Pill label="Доход" onClick={() => onAdd('income')}><ArrowDownLeft size={17} /></Pill>
        <motion.button
          whileTap={{ scale: 0.9 }} onClick={() => onAdd('expense')} aria-label="Записать расход"
          className="glass-btn grid h-16 w-16 shrink-0 place-items-center rounded-full"
        >
          <PlusIcon size={28} />
        </motion.button>
        <Pill label="В цель" onClick={() => onAdd('to_goal')}><ArrowUpRight size={17} /></Pill>
      </div>

      <div className="mt-9 flex justify-center">
        <div className="glass-btn flex h-8 items-center gap-2 rounded-full px-3.5 text-[13px] text-white/90">
          <span className={`h-1.5 w-1.5 rounded-full ${negative ? 'bg-[#ff6b61]' : 'bg-[#4cd964]'}`} />
          {empty ? 'Нажми ＋, чтобы записать трату' : `Потрачено ${formatMoney(expense)} · В цели ${formatMoney(toGoals)}`}
        </div>
      </div>
    </section>
  );
}

function Pill({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }} onClick={onClick}
      className="glass-btn flex h-12 w-[112px] items-center justify-center gap-2 rounded-full text-[15px] font-medium"
    >
      {children}{label}
    </motion.button>
  );
}
