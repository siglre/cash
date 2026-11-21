import { useState } from 'react';
import type { Account } from '../lib/types';
import { archiveAccount, saveAccount } from '../db/repo';
import { FormSheet, Footnote, LinkRow, Row, groupDigits, inputRight, onlyDigits } from './Form';

const COLORS = ['#5B8CFF', '#F0609E', '#34C98B', '#F5A340', '#9B6BFF', '#35C4D8'];

/** Создание/редактирование счёта. Для кредитки вводится долг. */
export function AccountSheet({ account, balance, canDelete, onClose }: {
  account?: Account; balance: number; canDelete: boolean; onClose: () => void;
}) {
  const [name, setName] = useState(account?.name ?? '');
  const [kind, setKind] = useState<Account['kind']>(account?.kind ?? 'debit');
  const [amount, setAmount] = useState(String(Math.abs(balance) || ''));
  const [overpaid, setOverpaid] = useState(account?.kind === 'credit' && balance > 0);
  const isDebt = kind === 'credit' && !overpaid;

  const save = async () => {
    const v = Number(onlyDigits(amount)) || 0;
    await saveAccount({
      id: account?.id,
      name: name.trim() || (kind === 'credit' ? 'Кредитка' : 'Карта'),
      kind,
      emoji: account?.emoji ?? '💳',
      color: account?.color ?? COLORS[Math.floor(Math.random() * COLORS.length)],
      currentBalance: isDebt ? -v : v,
    });
    onClose();
  };

  const remove = async () => {
    if (!account || !confirm(`Удалить счёт «${account.name}»? Старые операции останутся в истории.`)) return;
    await archiveAccount(account.id);
    onClose();
  };

  return (
    <FormSheet title={account ? account.name : 'Новый счёт'} onCancel={onClose} onDone={save}>
      <ul className="ios-list bg-white">
        <Row label="Название">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'credit' ? 'Кредитка' : 'Карта'} className={inputRight} />
        </Row>
        <Row label="Тип">
          <div className="grid grid-cols-2 rounded-full bg-black/[0.06] p-0.5">
            {(['debit', 'credit'] as const).map((k) => (
              <button
                key={k} onClick={() => setKind(k)}
                className={`h-7 rounded-full px-2.5 text-[13px] ${kind === k ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-black/55'}`}
              >
                {k === 'debit' ? 'Дебетовая' : 'Кредитная'}
              </button>
            ))}
          </div>
        </Row>
        <Row label={isDebt ? 'Долг сейчас' : 'Сейчас на счёте'}>
          <input
            inputMode="numeric" value={groupDigits(amount)} onChange={(e) => setAmount(onlyDigits(e.target.value))}
            placeholder="0" autoFocus={!account} className={`${inputRight} text-fg`}
          />
          <span className="text-[15px] text-muted">₽</span>
        </Row>
        {kind === 'credit' && (
          <Row label="Долга нет, есть плюс">
            <input type="checkbox" checked={overpaid} onChange={(e) => setOverpaid(e.target.checked)} className="h-5 w-5 accent-black" />
          </Row>
        )}
      </ul>
      <Footnote>
        Укажи, сколько сейчас {isDebt ? 'должен по карте' : 'на счёте'}, как в приложении банка.
        Дальше остаток будет меняться сам от доходов, расходов и переводов.
      </Footnote>

      {account && canDelete && (
        <ul className="ios-list bg-white"><LinkRow label="Удалить счёт" tone="red" onClick={remove} /></ul>
      )}
    </FormSheet>
  );
}
