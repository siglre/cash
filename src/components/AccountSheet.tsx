import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Account } from '../lib/types';
import { archiveAccount, saveAccount } from '../db/repo';

const COLORS = ['#5B8CFF', '#F0609E', '#34C98B', '#F5A340', '#9B6BFF', '#35C4D8'];
const digits = (s: string) => s.replace(/\D/g, '');
const group = (s: string) => digits(s).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Создание/редактирование счёта. Для кредитки вводится долг. */
export function AccountSheet({ account, balance, canDelete, onClose }: {
  account?: Account; balance: number; canDelete: boolean; onClose: () => void;
}) {
  const [name, setName] = useState(account?.name ?? '');
  const [kind, setKind] = useState<Account['kind']>(account?.kind ?? 'debit');
  // Для кредитки показываем долг положительным числом
  const [amount, setAmount] = useState(String(Math.abs(balance) || ''));
  const [overpaid, setOverpaid] = useState(kind === 'credit' && balance > 0);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const save = async () => {
    const v = Number(digits(amount)) || 0;
    const currentBalance = kind === 'credit' && !overpaid ? -v : v;
    await saveAccount({
      id: account?.id,
      name: name.trim() || (kind === 'credit' ? 'Кредитка' : 'Карта'),
      kind,
      emoji: account?.emoji ?? '💳',
      color: account?.color ?? COLORS[Math.floor(Math.random() * COLORS.length)],
      currentBalance,
    });
    onClose();
  };

  const remove = async () => {
    if (!account) return;
    await archiveAccount(account.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <motion.div className="absolute inset-0 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        role="dialog" aria-modal="true" aria-label={account ? 'Счёт' : 'Новый счёт'}
        className="glass-light absolute inset-x-0 bottom-0 mx-auto flex max-w-[520px] flex-col rounded-t-[32px] px-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      >
        <div className="flex items-center justify-between pb-3 pt-3">
          <button onClick={onClose} className="h-11 px-1 text-[17px] text-[#007aff]">Отмена</button>
          <div className="text-[17px] font-semibold">{account ? account.name : 'Новый счёт'}</div>
          <button onClick={save} className="h-11 px-1 text-[17px] font-semibold text-[#007aff]">Готово</button>
        </div>

        <ul className="ios-list bg-white">
          <li className="flex min-h-[52px] items-center gap-3 px-4">
            <span className="text-[17px]">Название</span>
            <input
              value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'credit' ? 'Кредитка' : 'Карта'}
              className="min-w-0 flex-1 bg-transparent text-right text-[17px] text-muted outline-none focus:text-fg"
            />
          </li>
          <li className="flex min-h-[52px] items-center justify-between gap-3 px-4">
            <span className="text-[17px]">Тип</span>
            <div className="grid grid-cols-2 rounded-full bg-black/[0.06] p-0.5">
              {(['debit', 'credit'] as const).map((k) => (
                <button
                  key={k} onClick={() => setKind(k)}
                  className={`h-8 rounded-full px-3 text-[14px] font-medium ${kind === k ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-black/55'}`}
                >
                  {k === 'debit' ? 'Дебетовая' : 'Кредитная'}
                </button>
              ))}
            </div>
          </li>
          <li className="flex min-h-[52px] items-center gap-3 px-4">
            <span className="text-[17px]">{kind === 'credit' && !overpaid ? 'Долг сейчас' : 'Сейчас на счёте'}</span>
            <input
              inputMode="numeric" value={group(amount)} onChange={(e) => setAmount(digits(e.target.value))} placeholder="0"
              autoFocus={!account}
              className="min-w-0 flex-1 bg-transparent text-right text-[17px] outline-none"
            />
            <span className="text-[17px] text-muted">₽</span>
          </li>
          {kind === 'credit' && (
            <li className="flex min-h-[52px] items-center justify-between gap-3 px-4">
              <span className="text-[17px]">Долга нет, есть плюс</span>
              <input type="checkbox" checked={overpaid} onChange={(e) => setOverpaid(e.target.checked)} className="h-5 w-5 accent-black" />
            </li>
          )}
        </ul>
        <p className="mt-2 px-4 text-[13px] leading-snug text-muted">
          Укажи, сколько сейчас {kind === 'credit' && !overpaid ? 'должен по карте' : 'на счёте'} — как в приложении банка.
          Дальше остаток будет меняться сам от доходов, расходов и переводов.
        </p>

        {account && canDelete && (
          <ul className="ios-list mt-5 bg-white">
            <li>
              <button onClick={remove} className="h-[52px] w-full text-[17px] text-neg active:bg-black/5">Удалить счёт</button>
            </li>
          </ul>
        )}
      </motion.div>
    </div>
  );
}
