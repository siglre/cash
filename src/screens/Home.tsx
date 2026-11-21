import type { CSSProperties } from 'react';
import type { AppData } from '../hooks';
import type { Account } from '../lib/types';
import { accountBalance, freeMoney, neededThisMonth } from '../lib/calc';
import { monthPeriod, monthPrepositional } from '../lib/dates';
import { formatMoney } from '../lib/money';
import { BalanceHero } from '../components/BalanceHero';
import { CatIcon } from '../components/CatIcon';
import { ChevronRight } from '../components/Icons';

const iconList = { '--sep-inset': '72px' } as CSSProperties;

/** Главная: свободно, сколько отложить в этом месяце, счета. */
export function Home({ data, now, onAdd, onSaveToGoal, onAccount }: {
  data: AppData; now: Date;
  onAdd: (t: 'expense' | 'income' | 'to_goal') => void;
  onSaveToGoal: (goalId: string, amount: number) => void;
  onAccount: (a?: Account) => void;
}) {
  const { txs, goals, accounts, settings } = data;
  const sum = freeMoney(accounts, goals, txs);
  const need = neededThisMonth(goals, txs, now, settings.monthStartDay);
  const month = monthPrepositional(monthPeriod(now, settings.monthStartDay).start.getMonth());
  const pending = need.perGoal.filter((x) => x.need > 0);
  const notSetUp = txs.length === 0 && accounts.every((a) => a.initialBalance === 0);

  return (
    <div style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}>
      <BalanceHero sum={sum} onAdd={onAdd} />

      {/* Нужно отложить */}
      <section className="mt-6 px-4">
        <div className="ios-list" style={iconList}>
          <div className="px-4 pb-3 pt-4">
            <div className="text-[15px] text-muted">Нужно отложить в {month}</div>
            <div className="mt-1 text-[34px] font-semibold leading-tight tracking-tight">
              {need.total > 0 ? formatMoney(need.total) : 'Всё отложено ✓'}
            </div>
          </div>
          {pending.length > 0 && <div className="ml-4 h-[0.5px] bg-sep" />}
          {pending.length > 0 && (
            <ul className="ios-list rounded-none" style={iconList}>
              {pending.map(({ goal, need: n }) => (
                <li key={goal.id}>
                  <button
                    onClick={() => onSaveToGoal(goal.id, n)}
                    className="flex min-h-[60px] w-full items-center gap-3.5 px-4 py-2 text-left transition-colors active:bg-black/5"
                  >
                    <CatIcon emoji={goal.emoji} from={goal.gradient[0]} to={goal.gradient[1]} size={42} />
                    <span className="min-w-0 flex-1 truncate text-[16px] font-medium">{goal.name}</span>
                    <span className="text-[16px] font-semibold">{formatMoney(n)}</span>
                    <span className="ml-1 rounded-full bg-black px-3 py-1.5 text-[13px] font-semibold text-white">Отложить</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Счета */}
      <section className="mt-7 px-4">
        <h2 className="mb-2 pl-1 text-[20px] font-semibold">Счета</h2>
        <ul className="ios-list" style={iconList}>
          {accounts.map((a) => {
            const b = accountBalance(a, txs);
            return (
              <li key={a.id}>
                <button onClick={() => onAccount(a)} className="flex min-h-[64px] w-full items-center gap-3.5 px-4 py-2 text-left transition-colors active:bg-black/5">
                  <CatIcon emoji={a.emoji} from={a.color} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[16px] font-medium">{a.name}</div>
                    <div className="text-[13px] text-muted">{a.kind === 'credit' ? 'Кредитная' : 'Дебетовая'}</div>
                  </div>
                  <div className={`text-right text-[16px] font-semibold ${b < 0 ? 'text-neg' : ''}`}>
                    {b < 0 ? `−${formatMoney(-b)}` : formatMoney(b)}
                    {b < 0 && <div className="text-[12px] font-normal text-muted">долг</div>}
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-black/25" />
                </button>
              </li>
            );
          })}
          <li>
            <button onClick={() => onAccount()} className="flex min-h-[52px] w-full items-center px-4 text-[16px] text-[#007aff] active:bg-black/5">
              Добавить счёт
            </button>
          </li>
        </ul>
        <p className="mt-2 px-4 text-[13px] leading-snug text-muted">
          {notSetUp
            ? 'Для начала нажми на счёт и укажи, сколько на нём сейчас.'
            : 'Нажми на счёт, чтобы поправить остаток, если он разошёлся с банком.'}
        </p>
      </section>
    </div>
  );
}
