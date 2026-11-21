import { useEffect, useMemo, useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import type { AppData } from '../hooks';
import type { TxType } from '../lib/types';
import { lastUsedRef, sortByUsage } from '../lib/calc';
import { dayLabel, startOfDay, toDateInput } from '../lib/dates';
import { formatMoney } from '../lib/money';
import { haptic } from '../lib/haptic';
import { addTransaction } from '../db/repo';
import { BackspaceIcon, CloseIcon } from './Icons';

type SheetType = Extract<TxType, 'expense' | 'income' | 'to_goal'>;
const TITLES: Record<SheetType, string> = { expense: 'Расход', income: 'Доход', to_goal: 'В цель' };
const MAX_DIGITS = 9;

export function AddSheet({ initialType, data, onClose }: {
  initialType: SheetType; data: AppData; onClose: () => void;
}) {
  const [type, setType] = useState<SheetType>(initialType);
  const [digits, setDigits] = useState('');
  const [chosen, setChosen] = useState<string | undefined>();
  const [note, setNote] = useState('');
  const [dateStr, setDateStr] = useState(() => toDateInput(new Date()));
  const [saving, setSaving] = useState(false);
  const controls = useDragControls();

  // Блокируем прокрутку страницы под шторкой
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Варианты для чипов: категории по частоте использования или активные цели
  const options = useMemo(() => {
    if (type === 'to_goal') {
      return data.goals.filter((g) => !g.archived).map((g) => ({ id: g.id, emoji: g.emoji, name: g.name }));
    }
    const cats = data.categories.filter((c) => c.kind === type);
    return sortByUsage(cats, data.txs.filter((t) => t.type === type))
      .map((c) => ({ id: c.id, emoji: c.emoji, name: c.name }));
  }, [type, data]);

  // Выбрано: явный выбор, иначе последнее использованное, иначе первое
  const lastRef = useMemo(() => lastUsedRef(data.txs, type), [data.txs, type]);
  const selected = options.find((o) => o.id === chosen)?.id
    ?? options.find((o) => o.id === lastRef)?.id
    ?? options[0]?.id;

  const amount = digits ? Number(digits) : 0;
  const canSave = amount > 0 && !saving && (type === 'to_goal' ? !!selected : true);

  const press = (d: string) => setDigits((cur) => {
    if (cur === '' && (d === '0' || d === '000')) return cur;
    return (cur + d).slice(0, MAX_DIGITS);
  });

  const save = async () => {
    if (!canSave) return;
    haptic(); // синхронно, пока жив жест пользователя
    setSaving(true);
    const [y, m, d] = dateStr.split('-').map(Number);
    const now = new Date();
    const when = startOfDay(new Date(y, m - 1, d)).getTime() === startOfDay(now).getTime()
      ? now
      : new Date(y, m - 1, d, now.getHours(), now.getMinutes());
    await addTransaction({
      type, amount,
      categoryId: type === 'to_goal' ? undefined : selected,
      goalId: type === 'to_goal' ? selected : undefined,
      note, date: when.toISOString(),
    });
    onClose();
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];
  const [y, m, d] = dateStr.split('-').map(Number);

  return (
    <div className="fixed inset-0 z-50">
      <motion.div
        className="absolute inset-0 bg-black/60"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog" aria-modal="true" aria-label={TITLES[type]}
        className="glass-strong absolute inset-x-0 bottom-0 flex max-h-[96dvh] flex-col rounded-t-[32px]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        drag="y" dragControls={controls} dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, i) => { if (i.offset.y > 120 || i.velocity.y > 600) onClose(); }}
      >
        {/* Ручка и заголовок — зона перетаскивания */}
        <div className="touch-none px-5 pt-2" onPointerDown={(e) => controls.start(e)}>
          <div className="mx-auto h-1 w-9 rounded-full bg-white/25" />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1 rounded-full bg-white/[0.06] p-1" onPointerDown={(e) => e.stopPropagation()}>
              {(Object.keys(TITLES) as SheetType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setType(t); setChosen(undefined); }}
                  className={`h-9 rounded-full px-3.5 text-[14px] font-semibold transition-colors ${t === type ? 'bg-white text-black' : 'text-white/70'}`}
                >
                  {TITLES[t]}
                </button>
              ))}
            </div>
            <button
              onClick={onClose} aria-label="Закрыть"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.08]"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        {/* Сумма */}
        <div className="px-5 pb-3 pt-4 text-center">
          <div
            className={`text-[56px] font-semibold leading-none tracking-tight ${amount ? '' : 'text-white/30'}`}
            aria-live="polite"
          >
            {formatMoney(amount)}
          </div>
        </div>

        {/* Заметка и дата */}
        <div className="flex items-center gap-2 px-5">
          <input
            value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Заметка" maxLength={80} enterKeyHint="done"
            className="h-11 min-w-0 flex-1 rounded-full bg-white/[0.07] px-4 text-[16px] outline-none placeholder:text-muted"
          />
          <label className="relative grid h-11 shrink-0 place-items-center rounded-full bg-white/[0.07] px-4 text-[15px] font-medium">
            {dayLabel(new Date(y, m - 1, d))}
            <input
              type="date" value={dateStr} max={toDateInput(new Date())}
              onChange={(e) => e.target.value && setDateStr(e.target.value)}
              aria-label="Дата"
              className="absolute inset-0 h-full w-full opacity-0"
            />
          </label>
        </div>

        {/* Категории / цели */}
        <div className="no-scrollbar mt-3 flex shrink-0 gap-2 overflow-x-auto px-5 py-1">
          {options.length === 0 && <div className="py-3 text-[14px] text-muted">Нет активных целей</div>}
          {options.map((o) => {
            const on = o.id === selected;
            return (
              <button
                key={o.id}
                onClick={() => setChosen(o.id)}
                aria-pressed={on}
                className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-[15px] font-medium transition-colors ${on ? 'bg-white text-black' : 'glass text-white'}`}
              >
                <span aria-hidden="true">{o.emoji}</span>{o.name}
              </button>
            );
          })}
        </div>

        {/* Numpad */}
        <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-1.5 px-5">
          {keys.map((k) => (
            <NumKey key={k} k={k} onPress={() => (k === '⌫' ? setDigits((c) => c.slice(0, -1)) : press(k))} />
          ))}
        </div>

        <div className="px-5 pt-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={save} disabled={!canSave}
            className="h-14 w-full rounded-full bg-white text-[17px] font-semibold text-black transition-opacity disabled:opacity-30"
          >
            Готово
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

function NumKey({ k, onPress }: { k: string; onPress: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92, backgroundColor: 'rgba(255,255,255,0.12)' }}
      transition={{ duration: 0.08 }}
      onClick={onPress}
      aria-label={k === '⌫' ? 'Стереть' : k}
      className={`grid place-items-center rounded-2xl ${k === '000' ? 'text-[22px]' : 'text-[30px]'} font-medium`}
      style={{ height: 'clamp(48px, 7.4dvh, 64px)' }}
    >
      {k === '⌫' ? <BackspaceIcon size={26} /> : k}
    </motion.button>
  );
}
