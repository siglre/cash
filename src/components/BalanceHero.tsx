import { motion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';
import { ArrowDownLeft, ArrowUpRight, PlusIcon, SettingsIcon } from './Icons';
import { formatMoney } from '../lib/money';

/** Верхний блок-«кошелёк»: баланс месяца и три действия. */
export function BalanceHero({ monthLabel, free, income, incomeIsPlan, expense, toGoals, empty, onAdd, onSettings }: {
  monthLabel: string; free: number; income: number; incomeIsPlan: boolean;
  expense: number; toGoals: number; empty: boolean;
  onAdd: (t: 'expense' | 'income' | 'to_goal') => void;
  onSettings: () => void;
}) {
  const negative = free < 0;
  return (
    <section
      className="rounded-b-[36px] px-5 pb-7"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 8px)',
        background: 'radial-gradient(140% 90% at 50% 0%, #2a2a2f 0%, #151518 55%, #0e0e10 100%)',
        boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex h-12 items-center justify-between">
        <span className="text-[17px] font-semibold">Копилка</span>
        <motion.button
          whileTap={{ scale: 0.92 }} onClick={onSettings} aria-label="Настройки"
          className="btn-glass grid h-11 w-11 place-items-center rounded-full"
        >
          <SettingsIcon size={20} />
        </motion.button>
      </div>

      <div className="mt-7 text-center">
        <div className="text-[15px] text-white/70">Свободно в {monthLabel}</div>
        <AnimatedNumber
          value={free}
          className="mt-2 block text-[56px] font-semibold leading-none tracking-tight"
          style={negative ? { color: 'var(--neg)' } : {
            background: 'linear-gradient(90deg, #ffffff 35%, #8e8e93 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          }}
        />
        <div className="mt-3 text-[15px] text-white/80">
          из {formatMoney(income)} дохода{incomeIsPlan ? ' (план)' : ''}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <Pill label="Доход" onClick={() => onAdd('income')}><ArrowDownLeft size={18} /></Pill>
        <motion.button
          whileTap={{ scale: 0.92 }} onClick={() => onAdd('expense')} aria-label="Записать расход"
          className="btn-glass grid h-16 w-16 shrink-0 place-items-center rounded-full"
        >
          <PlusIcon size={28} />
        </motion.button>
        <Pill label="В цель" onClick={() => onAdd('to_goal')}><ArrowUpRight size={18} /></Pill>
      </div>

      <div className="mt-7 flex justify-center">
        <div className="btn-glass flex h-8 items-center gap-2 rounded-full px-3.5 text-[13px] text-white/85">
          <span className={`h-1.5 w-1.5 rounded-full ${negative ? 'bg-neg' : 'bg-pos'}`} />
          {empty
            ? 'Нажми ＋, чтобы записать трату'
            : `Потрачено ${formatMoney(expense)} · В цели ${formatMoney(toGoals)}`}
        </div>
      </div>
    </section>
  );
}

function Pill({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }} onClick={onClick}
      className="btn-glass flex h-12 w-[118px] items-center justify-center gap-2 rounded-full text-[15px] font-medium"
    >
      {children}{label}
    </motion.button>
  );
}
