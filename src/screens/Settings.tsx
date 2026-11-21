import { useEffect, useRef, useState } from 'react';
import type { Settings as S } from '../lib/types';
import { saveSettings } from '../db/repo';
import { ScreenTitle } from '../components/ScreenTitle';

const digits = (s: string) => s.replace(/\D/g, '');
const num = (s: string) => Number(digits(s)) || 0;
/** «70000» -> «70 000» для поля ввода */
const group = (s: string) => digits(s).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

type Cost = { name: string; amount: string };

/** Настройки в стиле iOS: сгруппированные списки, всё сохраняется сразу. */
export function Settings({ settings }: { settings: S }) {
  const [income, setIncome] = useState(String(settings.monthlyIncome));
  const [startDay, setStartDay] = useState(settings.monthStartDay);
  const [costs, setCosts] = useState<Cost[]>(settings.fixedCosts.map((c) => ({ name: c.name, amount: String(c.amount) })));
  const first = useRef(true);

  // Автосохранение с небольшой задержкой
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const id = setTimeout(() => {
      saveSettings({
        monthlyIncome: num(income),
        monthStartDay: startDay,
        fixedCosts: costs
          .filter((c) => c.name.trim() || num(c.amount))
          .map((c) => ({ name: c.name.trim() || 'Без названия', amount: num(c.amount) })),
      });
    }, 300);
    return () => clearTimeout(id);
  }, [income, startDay, costs]);

  const totalFixed = costs.reduce((a, c) => a + num(c.amount), 0);
  const setCost = (i: number, patch: Partial<Cost>) => setCosts(costs.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  return (
    <div className="px-4">
      <ScreenTitle>Настройки</ScreenTitle>

      <Caption>Бюджет</Caption>
      <ul className="ios-list">
        <Row label="Доход в месяц">
          <input
            inputMode="numeric" value={group(income)} onChange={(e) => setIncome(digits(e.target.value))}
            className="w-32 bg-transparent text-right text-[16px] text-muted outline-none focus:text-fg"
            aria-label="Доход в месяц"
          />
          <span className="text-[15px] text-muted">₽</span>
        </Row>
        <Row label="Месяц начинается">
          <select
            value={startDay} onChange={(e) => setStartDay(Number(e.target.value))}
            className="appearance-none bg-transparent text-right text-[16px] text-muted outline-none"
            aria-label="Число начала месяца"
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}-го числа</option>)}
          </select>
        </Row>
      </ul>
      <Footnote>Доход нужен, чтобы оценить, успеваешь ли ты к целям. С какого числа начинается месяц — от этого считается «Нужно отложить в этом месяце».</Footnote>

      <Caption>Обязательные расходы</Caption>
      <ul className="ios-list">
        {costs.map((c, i) => (
          <li key={i} className="flex min-h-[46px] items-center gap-3 pl-3 pr-4">
            <button
              onClick={() => setCosts(costs.filter((_, j) => j !== i))} aria-label="Удалить"
              className="grid h-11 w-8 shrink-0 place-items-center"
            >
              <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-neg text-white">
                <span className="h-[2px] w-2.5 rounded bg-white" />
              </span>
            </button>
            <input
              value={c.name} placeholder="Название" onChange={(e) => setCost(i, { name: e.target.value })}
              className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
            />
            <input
              inputMode="numeric" value={group(c.amount)} placeholder="0"
              onChange={(e) => setCost(i, { amount: digits(e.target.value) })}
              className="w-24 bg-transparent text-right text-[16px] text-muted outline-none focus:text-fg"
              aria-label="Сумма"
            />
            <span className="text-[15px] text-muted">₽</span>
          </li>
        ))}
        <li>
          <button
            onClick={() => setCosts([...costs, { name: '', amount: '' }])}
            className="flex min-h-[46px] w-full items-center gap-3 pl-3 pr-4 text-left text-[15px] text-[#007aff] active:bg-black/5"
          >
            <span className="grid h-11 w-8 place-items-center">
              <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-pos text-[18px] leading-none text-white">+</span>
            </span>
            Добавить расход
          </button>
        </li>
      </ul>
      <Footnote>
        Всего {group(String(totalFixed)) || 0} ₽ в месяц. Нужны, чтобы понять, сколько реально можно откладывать на цели.
        Сами по себе из «Свободно» не вычитаются: когда заплатишь, запиши это как расход.
      </Footnote>

      <Caption>Данные</Caption>
      <ul className="ios-list">
        <Row label="Хранение"><span className="text-[15px] text-muted">На этом телефоне</span></Row>
      </ul>
      <Footnote>Синхронизация между устройствами и экспорт появятся позже.</Footnote>
    </div>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 px-4 pb-1.5 text-[12px] uppercase tracking-wide text-muted">{children}</div>;
}
function Footnote({ children }: { children: React.ReactNode }) {
  return <p className="mb-6 mt-2 px-4 text-[12px] leading-snug text-muted">{children}</p>;
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex min-h-[46px] items-center justify-between gap-3 px-4">
      <span className="text-[15px]">{label}</span>
      <span className="flex items-center gap-1">{children}</span>
    </li>
  );
}
