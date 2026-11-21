import { useMemo, useState } from 'react';
import type { AppData } from '../hooks';
import type { Category } from '../lib/types';
import { cumulativeDaily, monthlyTotals, shiftPeriod, spendingByCategory } from '../lib/calc';
import { monthGenitive, monthNominative, monthPeriod, monthPrepositional } from '../lib/dates';
import { formatMoney } from '../lib/money';
import { ScreenTitle } from '../components/ScreenTitle';

/**
 * Категориальная палитра для тёмной карточки (#1c1c1e), фиксированный порядок слотов.
 * Проверена validate_palette.js --mode dark: все проверки пройдены.
 */
const SERIES = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c', '#9085e9', '#e66767'];
const OTHER = '#5a5a5e';
const SURFACE = '#1c1c1e';
const TOP_N = 4;

const cap = (s: string) => s.replace(/^./, (c) => c.toUpperCase());

/** Цвет следует за категорией (её место в списке), а не за местом в рейтинге. 9+ — «Остальное». */
function categoryColor(cat: Category | undefined, expenseCats: Category[]): string {
  const i = cat ? expenseCats.findIndex((c) => c.id === cat.id) : -1;
  return i >= 0 && i < SERIES.length ? SERIES[i] : OTHER;
}

export function Overview({ data, now }: { data: AppData; now: Date }) {
  const sd = data.settings.monthStartDay;
  const period = monthPeriod(now, sd);
  const prev = shiftPeriod(period, -1, sd);
  const expenseCats = useMemo(() => data.categories.filter((c) => c.kind === 'expense').sort((a, b) => a.order - b.order), [data.categories]);

  const hasAny = data.txs.some((t) => t.type === 'expense');

  return (
    <div className="px-4">
      <ScreenTitle>Обзор</ScreenTitle>
      {!hasAny ? (
        <div className="ios-list px-4 py-5 text-center text-[15px] text-muted">Графики появятся после первых расходов</div>
      ) : (
        <div className="flex flex-col gap-3">
          <CategoryCard data={data} period={period} expenseCats={expenseCats} />
          <PaceCard data={data} now={now} period={period} prev={prev} />
          <MonthsCard data={data} now={now} />
        </div>
      )}
    </div>
  );
}

/* ───── 1. Куда ушли деньги: сегментная полоса + легенда ───── */

function CategoryCard({ data, period, expenseCats }: {
  data: AppData; period: ReturnType<typeof monthPeriod>; expenseCats: Category[];
}) {
  const rows = spendingByCategory(data.txs, period);
  const total = rows.reduce((a, r) => a + r.amount, 0);
  // Топ-N категорий со своим цветом; всё прочее (и категории без цветового слота) — в «Остальное»
  const top: { key: string; name: string; amount: number; color: string }[] = [];
  let rest = 0;
  for (const r of rows) {
    const cat = data.catMap.get(r.categoryId);
    const color = categoryColor(cat, expenseCats);
    if (top.length < TOP_N && color !== OTHER) top.push({ key: r.categoryId, name: cat!.name, amount: r.amount, color });
    else rest += r.amount;
  }
  const items = [...top, ...(rest > 0 ? [{ key: 'rest', name: 'Остальное', amount: rest, color: OTHER }] : [])];
  const pct = (v: number) => (total ? Math.round((v / total) * 1000) / 10 : 0);

  return (
    <section className="dark-card p-4">
      <div className="text-[14px] text-[var(--ink-2)]">Расходы в {monthPrepositional(period.start.getMonth())}</div>
      <div className="metal mt-1 inline-block text-[28px] font-semibold leading-none tracking-tight">{formatMoney(total)}</div>

      {total > 0 ? (
        <>
          {/* Сегменты: 2px зазор цвета фона, скругление 4px только на концах */}
          <div className="mt-4 flex h-2.5 gap-[2px] overflow-hidden rounded-[4px]" role="img"
            aria-label={items.map((i) => `${i.name} ${pct(i.amount)}%`).join(', ')}>
            {items.map((i) => (
              <div key={i.key} style={{ flexGrow: i.amount, background: i.color, minWidth: 3 }} title={`${i.name}: ${formatMoney(i.amount)}`} />
            ))}
          </div>
          <ul className="mt-3.5 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-4 gap-y-2">
            {items.map((i) => (
              <li key={i.key} className="flex min-w-0 items-center gap-2 text-[13px]">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: i.color }} />
                <span className="truncate text-[var(--ink-2)]">{i.name}</span>
                <span className="ml-auto tabular-nums text-[#f2f2f2]">{pct(i.amount)}%</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mt-3 text-[13px] text-[var(--ink-muted)]">В этом месяце расходов пока нет</div>
      )}
    </section>
  );
}

/* ───── 2. Темп трат: этот месяц против прошлого, накопительно ───── */

const W = 320, H = 150, PAD_L = 4, PAD_R = 4, PAD_T = 12, PAD_B = 20;

function PaceCard({ data, now, period, prev }: {
  data: AppData; now: Date; period: ReturnType<typeof monthPeriod>; prev: ReturnType<typeof monthPeriod>;
}) {
  const cur = cumulativeDaily(data.txs, period);
  const last = cumulativeDaily(data.txs, prev);
  const todayIdx = Math.min(cur.length - 1, Math.floor((now.getTime() - period.start.getTime()) / 86400000));
  const curShown = cur.slice(0, todayIdx + 1);
  const [sel, setSel] = useState<number | null>(null);
  const idx = sel ?? todayIdx;

  const days = Math.max(cur.length, last.length);
  const max = Math.max(1, ...curShown, ...last);
  const x = (i: number) => PAD_L + (i / (days - 1)) * (W - PAD_L - PAD_R);
  const y = (v: number) => PAD_T + (1 - v / max) * (H - PAD_T - PAD_B);
  const path = (arr: number[]) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');

  const curVal = cur[Math.min(idx, todayIdx)] ?? 0;
  const lastVal = last[Math.min(idx, last.length - 1)] ?? 0;
  const diff = lastVal ? Math.round(((curVal - lastVal) / lastVal) * 100) : null;
  const selDate = new Date(period.start.getFullYear(), period.start.getMonth(), period.start.getDate() + idx);

  const pick = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - r.left) / r.width) * W;
    setSel(Math.max(0, Math.min(days - 1, Math.round(((rel - PAD_L) / (W - PAD_L - PAD_R)) * (days - 1)))));
  };

  const CUR = SERIES[0], PREV = '#8e8e93';

  return (
    <section className="dark-card p-4">
      <div className="text-[14px] text-[var(--ink-2)]">Темп трат на {selDate.getDate()} {monthGenitive(selDate.getMonth())}</div>
      {/* Легенда со значениями в выбранный день */}
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[12px] text-[var(--ink-2)]">
            <span className="h-2 w-2 rounded-full" style={{ background: CUR }} />{cap(monthNominative(period.start.getMonth()))}
          </div>
          <div className="mt-0.5 text-[20px] font-semibold tabular-nums">{idx <= todayIdx ? formatMoney(curVal) : '—'}</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-[12px] text-[var(--ink-2)]">
            <span className="h-2 w-2 rounded-full border-[1.5px]" style={{ borderColor: PREV }} />{cap(monthNominative(prev.start.getMonth()))}
          </div>
          <div className="mt-0.5 text-[20px] font-semibold tabular-nums text-[var(--ink-2)]">{formatMoney(lastVal)}</div>
        </div>
      </div>
      {diff !== null && idx <= todayIdx && (
        <div className="mt-1 text-[12px] text-[var(--ink-muted)]">
          {diff === 0 ? 'Так же, как в прошлом месяце' : `${diff > 0 ? '▲' : '▼'} на ${Math.abs(diff)}% ${diff > 0 ? 'больше' : 'меньше'}, чем месяц назад к этому дню`}
        </div>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full touch-none select-none" role="img"
        aria-label={`Накопленные расходы: ${formatMoney(curVal)} в этом месяце против ${formatMoney(lastVal)} в прошлом`}
        onPointerDown={pick} onPointerMove={(e) => e.buttons && pick(e)}
      >
        {/* сетка: две волосяные линии + базовая */}
        {[0.5, 1].map((f) => (
          <line key={f} x1={0} x2={W} y1={y(max * f)} y2={y(max * f)} stroke="var(--grid)" strokeWidth={1} />
        ))}
        <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="var(--axis)" strokeWidth={1} />
        <text x={0} y={y(max) - 3} fill="var(--ink-muted)" fontSize={10}>{formatMoney(max)}</text>

        <path d={path(last)} fill="none" stroke={PREV} strokeWidth={2} strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d={path(curShown)} fill="none" stroke={CUR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* перекрестье выбранного дня */}
        <line x1={x(idx)} x2={x(idx)} y1={PAD_T - 4} y2={y(0)} stroke="var(--ink-muted)" strokeWidth={1} strokeDasharray="2 3" />
        {idx < last.length && <circle cx={x(idx)} cy={y(lastVal)} r={4} fill={PREV} stroke={SURFACE} strokeWidth={2} />}
        {idx <= todayIdx && <circle cx={x(idx)} cy={y(curVal)} r={4.5} fill={CUR} stroke={SURFACE} strokeWidth={2} />}

        <text x={PAD_L} y={H - 4} fill="var(--ink-muted)" fontSize={10}>1</text>
        <text x={x(cur.length - 1)} y={H - 4} fill="var(--ink-muted)" fontSize={10} textAnchor="end">{cur.length}</text>
      </svg>
      <div className="mt-1 text-[11px] text-[var(--ink-muted)]">Проведи пальцем по графику, чтобы сравнить другой день</div>
    </section>
  );
}

/* ───── 3. Расходы по месяцам ───── */

function MonthsCard({ data, now }: { data: AppData; now: Date }) {
  const months = monthlyTotals(data.txs, now, data.settings.monthStartDay, 6);
  const [sel, setSel] = useState(months.length - 1);
  const max = Math.max(1, ...months.map((m) => m.expense));
  const m = months[sel];
  const BAR = SERIES[0];

  return (
    <section className="dark-card p-4">
      <div className="text-[14px] text-[var(--ink-2)]">Расходы по месяцам</div>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <div className="text-[20px] font-semibold tabular-nums">{formatMoney(m.expense)}</div>
        <div className="text-[12px] text-[var(--ink-muted)]">
          {cap(monthNominative(m.period.start.getMonth()))}{m.income ? ` · доход ${formatMoney(m.income)}` : ''}
        </div>
      </div>

      <div className="mt-4 flex h-[120px] items-end gap-2" role="list">
        {months.map((mm, i) => {
          const h = mm.expense ? Math.max(4, (mm.expense / max) * 100) : 0;
          const on = i === sel;
          return (
            <button
              key={i} role="listitem" onClick={() => setSel(i)}
              aria-label={`${cap(monthNominative(mm.period.start.getMonth()))}: ${formatMoney(mm.expense)}`}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
            >
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className="w-full max-w-[28px] rounded-t-[4px] transition-opacity"
                  style={{ height: `${h}%`, background: BAR, opacity: on ? 1 : 0.45, minHeight: mm.expense ? 3 : 0 }}
                />
              </div>
              <div className="h-px w-full bg-[var(--axis)]" />
              <span className={`text-[11px] ${on ? 'text-[#f2f2f2]' : 'text-[var(--ink-muted)]'}`}>
                {monthNominative(mm.period.start.getMonth()).slice(0, 3)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
