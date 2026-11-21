const MONTHS_NOM = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
const MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

const MONTHS_PREP = ['январе','феврале','марте','апреле','мае','июне','июле','августе','сентябре','октябре','ноябре','декабре'];

export const monthNominative = (m: number) => MONTHS_NOM[m];
export const monthPrepositional = (m: number) => MONTHS_PREP[m];
export const monthGenitive = (m: number) => MONTHS_GEN[m];

export interface Period { start: Date; end: Date } // [start, end)

/** Период «месяца» с учётом дня начала. now внутри [start, end). */
export function monthPeriod(now: Date, startDay = 1): Period {
  const sd = Math.min(Math.max(startDay, 1), 28);
  const y = now.getFullYear();
  let m = now.getMonth();
  if (now.getDate() < sd) m -= 1;
  return { start: new Date(y, m, sd), end: new Date(y, m + 1, sd) };
}

export function inPeriod(iso: string, p: Period): boolean {
  const t = new Date(iso).getTime();
  return t >= p.start.getTime() && t < p.end.getTime();
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** «только что», «2 часа назад», «Вчера», «18 ноября» */
export function relativeTime(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return 'только что';
  if (diffMin < 60) return `${diffMin} мин назад`;
  if (startOfDay(d).getTime() === startOfDay(now).getTime()) {
    const h = Math.floor(diffMin / 60);
    const mod10 = h % 10, mod100 = h % 100;
    const word = mod10 === 1 && mod100 !== 11 ? 'час' : mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20) ? 'часа' : 'часов';
    return `${h} ${word} назад`;
  }
  return dayLabel(d, now);
}

/** «Сегодня», «Вчера», «18 ноября» (+ год, если не текущий) */
export function dayLabel(d: Date, now = new Date()): string {
  const diff = Math.round((startOfDay(now).getTime() - startOfDay(d).getTime()) / 86400000);
  if (diff === 0) return 'Сегодня';
  if (diff === 1) return 'Вчера';
  const base = `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

/** Локальная дата YYYY-MM-DD для <input type="date"> */
export function toDateInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
