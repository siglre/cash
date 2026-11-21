import { motion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';
import { ArrowDownLeft, ArrowUpRight, PlusIcon } from './Icons';
import { formatMoney } from '../lib/money';
import type { FreeSummary } from '../lib/calc';

/** Тёмная карточка: сколько свободно и три действия. */
export function BalanceHero({ sum, onAdd }: {
  sum: FreeSummary;
  onAdd: (t: 'expense' | 'income' | 'to_goal') => void;
}) {
  const negative = sum.free < 0;
  return (
    <section className="hero mx-2 rounded-[40px] px-5 pb-7 pt-10 text-center">
      <div className="text-[17px] font-medium text-white/90">Свободно</div>
      <AnimatedNumber
        value={sum.free}
        className="mt-3 block text-[58px] font-semibold leading-none tracking-tight"
        style={negative ? { color: '#ff6b61' } : {
          background: 'linear-gradient(90deg, #ffffff 30%, #9a9aa0 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        }}
      />

      <div className="mx-auto mt-5 grid max-w-[340px] grid-cols-3 text-[12px] text-white/55">
        <div>На счетах<div className="mt-0.5 text-[14px] font-medium text-white/90">{formatMoney(sum.onAccounts)}</div></div>
        <div>Долг<div className="mt-0.5 text-[14px] font-medium text-white/90">{sum.debt ? `−${formatMoney(sum.debt)}` : formatMoney(0)}</div></div>
        <div>В целях<div className="mt-0.5 text-[14px] font-medium text-white/90">{sum.inGoals ? `−${formatMoney(sum.inGoals)}` : formatMoney(0)}</div></div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-3.5">
        <Pill label="Доход" onClick={() => onAdd('income')}><ArrowDownLeft size={17} /></Pill>
        <motion.button
          whileTap={{ scale: 0.9 }} onClick={() => onAdd('expense')} aria-label="Записать расход"
          className="glass-btn grid h-16 w-16 shrink-0 place-items-center rounded-full"
        >
          <PlusIcon size={28} />
        </motion.button>
        <Pill label="В цель" onClick={() => onAdd('to_goal')}><ArrowUpRight size={17} /></Pill>
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
