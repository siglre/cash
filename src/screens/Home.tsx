import type { CSSProperties } from 'react';
import type { AppData } from '../hooks';
import type { Account, Recurring } from '../lib/types';
import { accountBalance, freeMoney, neededThisMonth, recurringThisPeriod, upcomingTotal } from '../lib/calc';
import { monthGenitive, monthPeriod, monthPrepositional, startOfDay } from '../lib/dates';
import { formatMoney } from '../lib/money';
import { BalanceHero } from '../components/BalanceHero';
import { CatIcon } from '../components/CatIcon';
import { ChevronRight } from '../components/Icons';

const iconList = { '--sep-inset': '60px' } as CSSProperties;

/** Главная: свободно, сколько отложить в этом месяце, платежи, счета. */
export function Home({ data, now, onAdd, onSaveToGoal, onAccount, onPay }: {
  data: AppData; now: Date;
  onAdd: (t: 'expense' | 'income' | 'to_goal') => void;
  onSaveToGoal: (goalId: string, amount: number) => void;
  onAccount: (a?: Account) => void;
  onPay: (r: Recurring) => void;
}) {
  const { txs, goals, accounts, settings } = data;
  const payments = recurringThisPeriod(data.recurring, txs, now, settings.monthStartDay);
  const upcoming = upcomingTotal(payments);
  const sum = freeMoney(accounts, goals, txs, upcoming);
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
          <div className="px-4 pb-3 pt-3.5">
            <div className="text-[13px] text-muted">Нужно отложить в {month}</div>
            <div className="mt-0.5 text-[26px] font-semibold leading-tight tracking-tight">
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
                    className="flex min-h-[52px] w-full items-center gap-3 px-4 py-2 text-left transition-colors active:bg-black/5"
                  >
                    <CatIcon emoji={goal.emoji} from={goal.gradient[0]} to={goal.gradient[1]} size={34} />
                    <span className="min-w-0 flex-1 truncate text-[15px]">{goal.name}</span>
                    <span className="text-[15px] text-muted">{formatMoney(n)}</span>
                    <ChevronRight size={14} className="shrink-0 text-black/25" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Регулярные платежи этого месяца */}
      {payments.length > 0 && (
        <section className="mt-6 px-4">
          <h2 className="mb-1.5 flex justify-between px-4 text-[12px] uppercase tracking-wide text-muted">
            <span>Платежи в {month}</span>
            {upcoming > 0 && <span className="normal-case tracking-normal">осталось {formatMoney(upcoming)}</span>}
          </h2>
          <ul className="ios-list" style={iconList}>
            {payments.map(({ rec, due, paid }) => {
              const cat = rec.categoryId ? data.catMap.get(rec.categoryId) : undefined;
              const overdue = !paid && startOfDay(due) < startOfDay(now);
              return (
                <li key={rec.id}>
                  <button
                    onClick={() => !paid && onPay(rec)} disabled={paid}
                    className="flex min-h-[52px] w-full items-center gap-3 px-4 py-2 text-left transition-colors active:bg-black/5"
                  >
                    <CatIcon emoji={cat?.emoji ?? '🔁'} from={cat?.color ?? '#8E8E93'} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-[15px] ${paid ? 'text-muted line-through' : ''}`}>{rec.name}</div>
                      <div className={`text-[12px] ${overdue ? 'text-neg' : 'text-muted'}`}>
                        {paid ? 'Оплачено' : overdue ? `Просрочено, было ${due.getDate()}-го` : `${due.getDate()} ${monthGenitive(due.getMonth())}`}
                      </div>
                    </div>
                    <span className={`text-[15px] ${paid ? 'text-muted' : ''}`}>{formatMoney(rec.amount)}</span>
                    {paid
                      ? <span className="w-[14px] text-center text-[13px] text-pos">✓</span>
                      : <ChevronRight size={14} className="shrink-0 text-black/25" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 px-4 text-[12px] leading-snug text-muted">Нажми на платёж, когда оплатишь, — он запишется как расход.</p>
        </section>
      )}

      {/* Счета */}
      <section className="mt-6 px-4">
        <h2 className="mb-1.5 px-4 text-[12px] uppercase tracking-wide text-muted">Счета</h2>
        <ul className="ios-list" style={iconList}>
          {accounts.map((a) => {
            const b = accountBalance(a, txs);
            return (
              <li key={a.id}>
                <button onClick={() => onAccount(a)} className="flex min-h-[56px] w-full items-center gap-3 px-4 py-2 text-left transition-colors active:bg-black/5">
                  <CatIcon emoji={a.emoji} from={a.color} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px]">{a.name}</div>
                    <div className="text-[12px] text-muted">{a.kind === 'credit' ? 'Кредитная' : 'Дебетовая'}</div>
                  </div>
                  <div className={`text-right text-[15px] ${b < 0 ? 'text-neg' : ''}`}>
                    {b < 0 ? `−${formatMoney(-b)}` : formatMoney(b)}
                    {b < 0 && <div className="text-[11px] text-muted">долг</div>}
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-black/25" />
                </button>
              </li>
            );
          })}
          <li>
            <button onClick={() => onAccount()} className="flex min-h-[46px] w-full items-center px-4 text-[15px] text-[#007aff] active:bg-black/5">
              Добавить счёт
            </button>
          </li>
        </ul>
        <p className="mt-2 px-4 text-[12px] leading-snug text-muted">
          {notSetUp
            ? 'Для начала нажми на счёт и укажи, сколько на нём сейчас.'
            : 'Нажми на счёт, чтобы поправить остаток, если он разошёлся с банком.'}
        </p>
      </section>
    </div>
  );
}
