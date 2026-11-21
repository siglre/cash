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
  const parts: [string, string][] = [
    ['На счетах', formatMoney(sum.onAccounts)],
    ...(sum.debt ? [['Долг', `−${formatMoney(sum.debt)}`] as [string, string]] : []),
    ...(sum.upcoming ? [['Платежи', `−${formatMoney(sum.upcoming)}`] as [string, string]] : []),
    ...(sum.inGoals ? [['В целях', `−${formatMoney(sum.inGoals)}`] as [string, string]] : []),
  ];
  return (
    <section className="hero mx-2 rounded-[36px] px-5 pb-9 pt-12 text-center">
      <div className="text-[14px] text-white/60">Свободно</div>
      <AnimatedNumber
        value={sum.free}
        className="mt-2 block text-[52px] font-semibold leading-none tracking-tight"
        style={negative ? { color: '#ff6b61' } : {
          background: 'linear-gradient(90deg, #ffffff 30%, #9a9aa0 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        }}
      />

      {/* Из чего складывается «Свободно» — только ненулевые слагаемые */}
      <div className="mx-auto mt-5 flex max-w-[360px] justify-center gap-5 text-[11px] text-white/45">
        {parts.map(([label, value]) => (
          <div key={label}>{label}<div className="mt-0.5 text-[13px] text-white/85">{value}</div></div>
        ))}
      </div>

      <div className="mt-9 flex items-center justify-center gap-3">
        <Pill label="Доход" onClick={() => onAdd('income')}><ArrowDownLeft size={15} /></Pill>
        <motion.button
          whileTap={{ scale: 0.9 }} onClick={() => onAdd('expense')} aria-label="Записать расход"
          className="glass-btn grid h-16 w-16 shrink-0 place-items-center rounded-full"
        >
          <PlusIcon size={26} />
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
      className="glass-btn flex h-12 w-[108px] items-center justify-center gap-1.5 rounded-full text-[14px]"
    >
      {children}{label}
    </motion.button>
  );
}
