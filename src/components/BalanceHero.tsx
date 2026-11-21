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
    <section className="hero mx-2 rounded-[34px] px-5 pb-6 pt-8 text-center">
      <div className="text-[13px] text-white/60">Свободно</div>
      <AnimatedNumber
        value={sum.free}
        className="mt-2 block text-[44px] font-semibold leading-none tracking-tight"
        style={negative ? { color: '#ff6b61' } : {
          background: 'linear-gradient(90deg, #ffffff 30%, #9a9aa0 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        }}
      />

      <div className="mx-auto mt-4 grid max-w-[320px] grid-cols-3 text-[11px] text-white/45">
        <div>На счетах<div className="mt-0.5 text-[13px] text-white/85">{formatMoney(sum.onAccounts)}</div></div>
        <div>Долг<div className="mt-0.5 text-[13px] text-white/85">{sum.debt ? `−${formatMoney(sum.debt)}` : formatMoney(0)}</div></div>
        <div>В целях<div className="mt-0.5 text-[13px] text-white/85">{sum.inGoals ? `−${formatMoney(sum.inGoals)}` : formatMoney(0)}</div></div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Pill label="Доход" onClick={() => onAdd('income')}><ArrowDownLeft size={15} /></Pill>
        <motion.button
          whileTap={{ scale: 0.9 }} onClick={() => onAdd('expense')} aria-label="Записать расход"
          className="glass-btn grid h-14 w-14 shrink-0 place-items-center rounded-full"
        >
          <PlusIcon size={24} />
        </motion.button>
        <Pill label="В цель" onClick={() => onAdd('to_goal')}><ArrowUpRight size={15} /></Pill>
      </div>
    </section>
  );
}

function Pill({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }} onClick={onClick}
      className="glass-btn flex h-11 w-[100px] items-center justify-center gap-1.5 rounded-full text-[14px]"
    >
      {children}{label}
    </motion.button>
  );
}
