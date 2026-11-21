import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Settings } from '../lib/types';
import { saveSettings } from '../db/repo';
import { CloseIcon } from './Icons';

const num = (s: string) => Math.max(0, Math.round(Number(s.replace(/\D/g, '')) || 0));

export function SettingsSheet({ settings, onClose }: { settings: Settings; onClose: () => void }) {
  const [income, setIncome] = useState(String(settings.monthlyIncome));
  const [startDay, setStartDay] = useState(String(settings.monthStartDay));
  const [costs, setCosts] = useState(settings.fixedCosts.map((c) => ({ name: c.name, amount: String(c.amount) })));

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const save = async () => {
    await saveSettings({
      monthlyIncome: num(income),
      monthStartDay: Math.min(28, Math.max(1, num(startDay) || 1)),
      fixedCosts: costs.filter((c) => c.name.trim() || num(c.amount)).map((c) => ({ name: c.name.trim() || 'Расход', amount: num(c.amount) })),
    });
    onClose();
  };

  const field = 'field w-full';

  return (
    <div className="fixed inset-0 z-50">
      <motion.div className="absolute inset-0 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        role="dialog" aria-modal="true" aria-label="Настройки"
        className="glass-strong absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] max-w-[520px] flex-col rounded-t-[32px]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="text-[20px] font-semibold">Настройки</h2>
          <button onClick={onClose} aria-label="Закрыть" className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.08]"><CloseIcon size={18} /></button>
        </div>

        <div className="overflow-y-auto px-5 pb-2 pt-3">
          <label className="block">
            <span className="text-[14px] font-medium">Доход в месяц, ₽</span>
            <span className="mb-2 block text-[12px] text-muted">Плановый. «Свободно» считается от него, пока не записан фактический доход побольше.</span>
            <input className={field} inputMode="numeric" value={income} onChange={(e) => setIncome(e.target.value)} />
          </label>

          <label className="mt-5 block">
            <span className="text-[14px] font-medium">Месяц начинается с числа</span>
            <span className="mb-2 block text-[12px] text-muted">От 1 до 28. Например, 25, если зарплата приходит 25-го.</span>
            <input className={field} inputMode="numeric" value={startDay} onChange={(e) => setStartDay(e.target.value)} />
          </label>

          <div className="mt-5">
            <div className="text-[14px] font-medium">Обязательные расходы в месяц</div>
            <div className="mb-2 text-[12px] text-muted">Квартира и т. п. Нужны, чтобы понять, сколько реально можно откладывать на цели. В «Свободно» не вычитаются: свои траты ты записываешь сам.</div>
            <div className="flex flex-col gap-2">
              {costs.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <input className="field min-w-0 flex-1" placeholder="Название" value={c.name}
                    onChange={(e) => setCosts(costs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <input className="field w-28 shrink-0" inputMode="numeric" placeholder="₽" value={c.amount}
                    onChange={(e) => setCosts(costs.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} />
                  <button aria-label="Убрать" onClick={() => setCosts(costs.filter((_, j) => j !== i))}
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/[0.07] text-muted"><CloseIcon size={16} /></button>
                </div>
              ))}
            </div>
            <button onClick={() => setCosts([...costs, { name: '', amount: '' }])}
              className="mt-2 h-11 rounded-full bg-white/[0.07] px-4 text-[15px] font-medium">+ Добавить расход</button>
          </div>
        </div>

        <div className="px-5 pt-3">
          <motion.button whileTap={{ scale: 0.98 }} onClick={save} className="h-14 w-full rounded-full bg-white text-[17px] font-semibold text-black">Сохранить</motion.button>
        </div>
      </motion.div>
    </div>
  );
}
