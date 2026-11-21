import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useLockScroll } from '../hooks';

/** Шторка-форма в стиле iOS: «Отмена · Заголовок · Готово». */
export function FormSheet({ title, onCancel, onDone, doneLabel = 'Готово', doneDisabled, children }: {
  title: string; onCancel: () => void; onDone: () => void;
  doneLabel?: string; doneDisabled?: boolean; children: ReactNode;
}) {
  useLockScroll();
  return (
    <div className="fixed inset-0 z-50">
      <motion.div className="absolute inset-0 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} />
      <motion.div
        role="dialog" aria-modal="true" aria-label={title}
        className="glass-light absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] max-w-[520px] flex-col rounded-t-[28px]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-2">
          <button onClick={onCancel} className="h-11 min-w-16 text-left text-[15px] text-[#007aff]">Отмена</button>
          <div className="truncate px-2 text-[15px] font-semibold">{title}</div>
          <button onClick={onDone} disabled={doneDisabled} className="h-11 min-w-16 text-right text-[15px] font-semibold text-[#007aff] disabled:opacity-30">
            {doneLabel}
          </button>
        </div>
        <div className="overflow-y-auto px-4 pb-2">{children}</div>
      </motion.div>
    </div>
  );
}

export function Caption({ children }: { children: ReactNode }) {
  return <div className="mt-2 px-4 pb-1.5 text-[12px] uppercase tracking-wide text-muted">{children}</div>;
}

export function Footnote({ children }: { children: ReactNode }) {
  return <p className="mb-6 mt-2 px-4 text-[12px] leading-snug text-muted">{children}</p>;
}

/** Строка формы: подпись слева, контрол справа. */
export function Row({ label, children }: { label: ReactNode; children?: ReactNode }) {
  return (
    <li className="flex min-h-[46px] items-center justify-between gap-3 px-4">
      <span className="shrink-0 text-[15px]">{label}</span>
      <span className="flex min-w-0 items-center justify-end gap-1">{children}</span>
    </li>
  );
}

/** Нажимаемая строка-ссылка. */
export function LinkRow({ label, value, onClick, tone }: {
  label: ReactNode; value?: ReactNode; onClick: () => void; tone?: 'blue' | 'red';
}) {
  const color = tone === 'blue' ? 'text-[#007aff]' : tone === 'red' ? 'text-neg' : '';
  return (
    <li>
      <button onClick={onClick} className={`flex min-h-[46px] w-full items-center justify-between gap-3 px-4 text-left text-[15px] active:bg-black/5 ${color}`}>
        <span className="min-w-0 truncate">{label}</span>
        {value !== undefined && <span className="shrink-0 text-muted">{value}</span>}
      </button>
    </li>
  );
}

/** Стили полей внутри строк. Шрифт 16px — иначе iOS зумит при фокусе. */
export const inputRight = 'min-w-0 flex-1 bg-transparent text-right text-[16px] text-muted outline-none focus:text-fg placeholder:text-black/25';
export const selectRight = 'max-w-[60%] appearance-none truncate bg-transparent text-right text-[16px] text-muted outline-none';

export const onlyDigits = (s: string) => s.replace(/\D/g, '');
export const groupDigits = (s: string) => onlyDigits(s).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
