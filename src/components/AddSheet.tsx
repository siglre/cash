import { useEffect, useMemo, useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import type { AppData } from '../hooks';
import type { Transaction, TxType } from '../lib/types';
import { accountBalance, goalSaved, lastUsedAccount, lastUsedRef, sortByUsage } from '../lib/calc';
import { dayLabel, startOfDay, toDateInput } from '../lib/dates';
import { formatMoney } from '../lib/money';
import { haptic } from '../lib/haptic';
import { addTransaction, softDeleteTransaction, updateTransaction } from '../db/repo';
import { BackspaceIcon } from './Icons';

export type SheetState =
  | { kind: 'add'; type: 'expense' | 'income' | 'to_goal' | 'transfer' }
  | { kind: 'goal'; type: 'to_goal' | 'from_goal'; goalId?: string; amount?: number }
  | { kind: 'edit'; tx: Transaction };

const SEGMENTS_ADD: { type: TxType; label: string }[] = [
  { type: 'expense', label: 'Расход' },
  { type: 'income', label: 'Доход' },
  { type: 'to_goal', label: 'В цель' },
  { type: 'transfer', label: 'Перевод' },
];
const SEGMENTS_GOAL: { type: TxType; label: string }[] = [
  { type: 'to_goal', label: 'Отложить' },
  { type: 'from_goal', label: 'Снять' },
];
const DONE_LABEL: Record<TxType, string> = {
  expense: 'Записать расход',
  income: 'Записать доход',
  to_goal: 'Отложить в цель',
  from_goal: 'Снять с цели',
  transfer: 'Перевести',
};
const EDIT_TITLE: Record<TxType, string> = {
  expense: 'Расход', income: 'Доход', to_goal: 'Отложено в цель', from_goal: 'Снято с цели', transfer: 'Перевод',
};
const MAX_DIGITS = 9;

const isGoalType = (t: TxType) => t === 'to_goal' || t === 'from_goal';

export function AddSheet({ state, data, onClose, onDeleted }: {
  state: SheetState; data: AppData; onClose: () => void; onDeleted: (id: string) => void;
}) {
  const editing = state.kind === 'edit' ? state.tx : undefined;
  const [type, setType] = useState<TxType>(editing?.type ?? (state as Exclude<SheetState, { kind: 'edit' }>).type);
  const [digits, setDigits] = useState(
    editing ? String(editing.amount) : state.kind === 'goal' && state.amount ? String(state.amount) : '',
  );
  const [chosen, setChosen] = useState<string | undefined>(
    editing ? (editing.categoryId ?? editing.goalId ?? editing.toAccountId) : state.kind === 'goal' ? state.goalId : undefined,
  );
  const [accountChoice, setAccountChoice] = useState<string | undefined>(editing?.accountId);
  const [note, setNote] = useState(editing?.note ?? '');
  const originalDate = editing ? toDateInput(new Date(editing.date)) : undefined;
  const [dateStr, setDateStr] = useState(() => originalDate ?? toDateInput(new Date()));
  const [saving, setSaving] = useState(false);
  const controls = useDragControls();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Счета (плюс архивный, если редактируем старую операцию)
  const accounts = useMemo(() => {
    const list = [...data.accounts];
    for (const id of [editing?.accountId, editing?.toAccountId]) {
      const a = id ? data.accountMap.get(id) : undefined;
      if (a && !list.includes(a)) list.push(a);
    }
    return list;
  }, [data, editing]);

  // Счёт «откуда»: явный выбор → последний для этого типа → первая дебетовая
  const accountId = accounts.find((a) => a.id === accountChoice)?.id
    ?? accounts.find((a) => a.id === lastUsedAccount(data.txs, type))?.id
    ?? (accounts.find((a) => a.kind === 'debit') ?? accounts[0])?.id;
  const account = accountId ? data.accountMap.get(accountId) : undefined;
  const cycleAccount = () => {
    if (accounts.length < 2) return;
    const i = accounts.findIndex((a) => a.id === accountId);
    setAccountChoice(accounts[(i + 1) % accounts.length].id);
  };

  const options = useMemo(() => {
    if (isGoalType(type)) {
      return data.goals
        .filter((g) => !g.archived || g.id === editing?.goalId)
        .map((g) => ({ id: g.id, emoji: g.emoji, name: g.name }));
    }
    if (type === 'transfer') {
      return accounts.filter((a) => a.id !== accountId).map((a) => ({ id: a.id, emoji: a.emoji, name: a.name }));
    }
    const cats = data.categories.filter((c) => c.kind === type);
    return sortByUsage(cats, data.txs.filter((t) => t.type === type))
      .map((c) => ({ id: c.id, emoji: c.emoji, name: c.name }));
  }, [type, data, editing, accounts, accountId]);

  const lastRef = useMemo(() => lastUsedRef(data.txs, type), [data.txs, type]);
  const selected = options.find((o) => o.id === chosen)?.id
    ?? options.find((o) => o.id === lastRef)?.id
    ?? options[0]?.id;

  const amount = digits ? Number(digits) : 0;

  // Для целей: сколько накоплено (при редактировании своя сумма не считается)
  const goal = isGoalType(type) && selected ? data.goalMap.get(selected) : undefined;
  let saved = goal ? goalSaved(data.txs, goal.id) : 0;
  if (goal && editing && editing.goalId === goal.id) {
    saved += editing.type === 'to_goal' ? -editing.amount : editing.amount;
  }
  const overdraw = type === 'from_goal' && amount > saved;
  const needsAccount = !isGoalType(type);

  const canSave = amount > 0 && !saving && !overdraw && !!selected && (!needsAccount || !!accountId);

  const press = (d: string) => setDigits((cur) => {
    if (cur === '' && (d === '0' || d === '000')) return cur;
    return (cur + d).slice(0, MAX_DIGITS);
  });

  const save = async () => {
    if (!canSave) return;
    haptic();
    setSaving(true);
    let iso: string;
    if (editing && dateStr === originalDate) {
      iso = editing.date;
    } else {
      const [y, m, d] = dateStr.split('-').map(Number);
      const now = new Date();
      iso = (startOfDay(new Date(y, m - 1, d)).getTime() === startOfDay(now).getTime()
        ? now : new Date(y, m - 1, d, now.getHours(), now.getMinutes())).toISOString();
    }
    const payload = {
      type, amount, note, date: iso,
      categoryId: type === 'expense' || type === 'income' ? selected : undefined,
      goalId: isGoalType(type) ? selected : undefined,
      accountId: needsAccount ? accountId : undefined,
      toAccountId: type === 'transfer' ? selected : undefined,
    };
    if (editing) await updateTransaction(editing.id, payload);
    else await addTransaction(payload);
    onClose();
  };

  const remove = async () => {
    if (!editing) return;
    await softDeleteTransaction(editing.id);
    onDeleted(editing.id);
    onClose();
  };

  const segments = state.kind === 'add' ? SEGMENTS_ADD : state.kind === 'goal' ? SEGMENTS_GOAL : null;
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];
  const [y, m, d] = dateStr.split('-').map(Number);
  const chipsLabel = isGoalType(type) ? 'Цель' : type === 'transfer' ? 'Куда' : 'Категория';

  let hint = '';
  if (goal) {
    hint = type === 'from_goal'
      ? `На цели «${goal.name}» накоплено ${formatMoney(saved)}`
      : `Накоплено ${formatMoney(saved)} из ${formatMoney(goal.target)}`;
  } else if (account) {
    const b = accountBalance(account, data.txs);
    hint = b < 0 ? `${account.name}: долг ${formatMoney(-b)}` : `${account.name}: ${formatMoney(b)}`;
  }

  return (
    <div className="fixed inset-0 z-50">
      <motion.div
        className="absolute inset-0 bg-black/30"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog" aria-modal="true"
        className="glass-light absolute inset-x-0 bottom-0 mx-auto flex max-h-[96dvh] max-w-[520px] flex-col rounded-t-[32px]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        drag="y" dragControls={controls} dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, i) => { if (i.offset.y > 120 || i.velocity.y > 600) onClose(); }}
      >
        {/* Ручка — потяни вниз, чтобы закрыть */}
        <div className="touch-none px-5 pb-1 pt-2" onPointerDown={(e) => controls.start(e)}>
          <div className="mx-auto h-1 w-9 rounded-full bg-black/20" />
        </div>
        <div className="px-5 pt-2">
          {segments ? (
            <div className="grid rounded-full bg-black/[0.06] p-1" style={{ gridTemplateColumns: `repeat(${segments.length}, 1fr)` }}>
              {segments.map((s) => (
                <button
                  key={s.type}
                  onClick={() => { setType(s.type); setChosen(state.kind === 'goal' ? state.goalId : undefined); }}
                  className={`h-8 rounded-full text-[14px] font-medium transition-colors ${s.type === type ? 'bg-white text-black shadow-[0_1px_4px_rgba(0,0,0,0.12)]' : 'text-black/55'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-[15px] font-semibold">{EDIT_TITLE[type]}</div>
          )}
        </div>

        <div className="px-5 pb-1 pt-4 text-center">
          <div className={`text-[44px] font-semibold leading-none tracking-tight ${amount ? '' : 'text-black/25'}`} aria-live="polite">
            {formatMoney(amount)}
          </div>
          <div className={`mt-2 h-5 text-[13px] ${overdraw ? 'text-neg' : 'text-muted'}`}>{hint}</div>
        </div>

        <div className="flex items-center gap-2 px-5">
          <input
            value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Заметка" maxLength={80} enterKeyHint="done"
            className="h-11 min-w-0 flex-1 rounded-full bg-black/[0.05] px-4 text-[16px] outline-none placeholder:text-muted"
          />
          {needsAccount && account && (
            <button
              onClick={cycleAccount} aria-label={`Счёт: ${account.name}. Нажми, чтобы сменить`}
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-black/[0.05] px-3 text-[14px]"
            >
              {type === 'transfer' && <span className="text-muted">Из</span>}
              <span aria-hidden="true">{account.emoji}</span>{account.name}
            </button>
          )}
          <label className="relative grid h-11 shrink-0 place-items-center rounded-full bg-black/[0.05] px-3 text-[14px]">
            {dayLabel(new Date(y, m - 1, d))}
            <input
              type="date" value={dateStr} max={toDateInput(new Date())}
              onChange={(e) => e.target.value && setDateStr(e.target.value)}
              aria-label="Дата"
              className="absolute inset-0 h-full w-full opacity-0"
            />
          </label>
        </div>

        <div className="mt-3 px-5 text-[11px] uppercase tracking-wide text-muted">{chipsLabel}</div>
        <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-5 py-1.5">
          {options.length === 0 && (
            <div className="py-3 text-[14px] text-muted">{type === 'transfer' ? 'Нужен второй счёт' : 'Нет активных целей'}</div>
          )}
          {options.map((o) => {
            const on = o.id === selected;
            return (
              <button
                key={o.id} onClick={() => setChosen(o.id)} aria-pressed={on}
                className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] transition-colors ${on ? 'bg-black text-white' : 'bg-black/[0.05] text-black'}`}
              >
                <span aria-hidden="true">{o.emoji}</span>{o.name}
              </button>
            );
          })}
        </div>

        <div className="mt-2 grid grid-cols-3 gap-x-2 gap-y-1 px-5">
          {keys.map((k) => (
            <NumKey key={k} k={k} onPress={() => (k === '⌫' ? setDigits((c) => c.slice(0, -1)) : press(k))} />
          ))}
        </div>

        <div className="flex gap-2 px-5 pt-3">
          {editing && (
            <button onClick={remove} className="h-12 shrink-0 rounded-full bg-neg/10 px-5 text-[15px] font-medium text-neg">
              Удалить
            </button>
          )}
          <motion.button
            whileTap={{ scale: 0.98 }} onClick={save} disabled={!canSave}
            className="h-12 min-w-0 flex-1 rounded-full bg-black text-[15px] font-semibold text-white transition-opacity disabled:opacity-30"
          >
            {editing ? 'Сохранить' : DONE_LABEL[type]}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

function NumKey({ k, onPress }: { k: string; onPress: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92, backgroundColor: 'rgba(0,0,0,0.06)' }}
      transition={{ duration: 0.08 }}
      onClick={onPress}
      aria-label={k === '⌫' ? 'Стереть' : k}
      className={`grid place-items-center rounded-2xl ${k === '000' ? 'text-[18px]' : 'text-[26px]'}`}
      style={{ height: 'clamp(42px, 6.4dvh, 56px)' }}
    >
      {k === '⌫' ? <BackspaceIcon size={22} /> : k}
    </motion.button>
  );
}
