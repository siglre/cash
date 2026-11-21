import { useEffect, useRef, useState } from 'react';
import type { AppData } from '../hooks';
import type { Category, Recurring } from '../lib/types';
import { exportBackup, importBackup, saveSettings } from '../db/repo';
import { toCsv, validateBackup, type Backup } from '../lib/backup';
import { pickTextFile, requestPersistentStorage, saveFile } from '../lib/file';
import { formatMoney } from '../lib/money';
import { ScreenTitle } from '../components/ScreenTitle';
import { Caption, Footnote, LinkRow, Row, groupDigits, onlyDigits, selectRight } from '../components/Form';
import { ChevronRight } from '../components/Icons';

/** Настройки в стиле iOS. Поля бюджета сохраняются сразу. */
export function Settings({ data, onRecurring, onCategories, notify }: {
  data: AppData;
  onRecurring: (r?: Recurring) => void;
  onCategories: (kind: Category['kind']) => void;
  notify: (text: string) => void;
}) {
  const { settings } = data;
  const [income, setIncome] = useState(String(settings.monthlyIncome));
  const [startDay, setStartDay] = useState(settings.monthStartDay);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const first = useRef(true);

  useEffect(() => { requestPersistentStorage().then(setPersisted); }, []);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const id = setTimeout(() => saveSettings({ monthlyIncome: Number(income) || 0, monthStartDay: startDay }), 300);
    return () => clearTimeout(id);
  }, [income, startDay]);

  const totalRecurring = data.recurring.reduce((a, r) => a + r.amount, 0);
  const count = (kind: Category['kind']) => data.categories.filter((c) => c.kind === kind && !c.archived).length;
  const stamp = new Date().toISOString().slice(0, 10);

  const exportJson = async () => {
    await saveFile(`cash-${stamp}.json`, JSON.stringify(await exportBackup(), null, 1), 'application/json');
  };
  const exportCsv = async () => {
    const names = {
      cat: new Map(data.categories.map((c) => [c.id, c.name])),
      goal: new Map(data.goals.map((g) => [g.id, g.name])),
      acc: new Map([...data.accountMap.values()].map((a) => [a.id, a.name])),
    };
    await saveFile(`cash-${stamp}.csv`, toCsv(data.txs, names), 'text/csv');
  };
  const importJson = async () => {
    const text = await pickTextFile('application/json,.json');
    if (!text) return;
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { alert('Не получилось прочитать файл: это не JSON.'); return; }
    const err = validateBackup(parsed);
    if (err) { alert(err); return; }
    const b = parsed as Backup;
    const ok = confirm(
      `Заменить все данные на бэкап от ${new Date(b.exportedAt).toLocaleDateString('ru-RU')}? `
      + `В нём ${b.transactions.filter((t) => !t.deleted).length} операций. Текущие данные будут удалены.`,
    );
    if (!ok) return;
    await importBackup(b);
    // поля на экране — локальное состояние: подтянуть значения из бэкапа
    first.current = true;
    setIncome(String(b.settings.monthlyIncome ?? 0));
    setStartDay(b.settings.monthStartDay ?? 1);
    notify('Данные восстановлены');
  };

  return (
    <div className="px-4">
      <ScreenTitle>Настройки</ScreenTitle>

      <Caption>Бюджет</Caption>
      <ul className="ios-list">
        <Row label="Доход в месяц">
          <input
            inputMode="numeric" value={groupDigits(income)} onChange={(e) => setIncome(onlyDigits(e.target.value))}
            className="w-32 bg-transparent text-right text-[16px] text-muted outline-none focus:text-fg" aria-label="Доход в месяц"
          />
          <span className="text-[15px] text-muted">₽</span>
        </Row>
        <Row label="Месяц начинается">
          <select value={startDay} onChange={(e) => setStartDay(Number(e.target.value))} className={selectRight} aria-label="Число начала месяца">
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}-го числа</option>)}
          </select>
        </Row>
      </ul>
      <Footnote>Доход нужен, чтобы оценить, успеваешь ли ты к целям. От начала месяца считаются «Нужно отложить» и «Платежи».</Footnote>

      <Caption>Регулярные платежи</Caption>
      <ul className="ios-list">
        {data.recurring.map((r) => (
          <li key={r.id}>
            <button onClick={() => onRecurring(r)} className="flex min-h-[46px] w-full items-center gap-3 px-4 text-left active:bg-black/5">
              <span className="min-w-0 flex-1 truncate text-[15px]">{r.name}</span>
              <span className="text-[13px] text-muted">{r.day}-го</span>
              <span className="text-[15px] text-muted">{formatMoney(r.amount)}</span>
              <ChevronRight size={14} className="shrink-0 text-black/25" />
            </button>
          </li>
        ))}
        <LinkRow label="Добавить платёж" tone="blue" onClick={() => onRecurring()} />
      </ul>
      <Footnote>
        {totalRecurring > 0 ? `Всего ${formatMoney(totalRecurring)} в месяц. ` : ''}
        Квартира, подписки, кредит. Неоплаченные в этом месяце сразу вычитаются из «Свободно».
      </Footnote>

      <Caption>Категории</Caption>
      <ul className="ios-list">
        <LinkRow label="Расходы" value={<span className="flex items-center gap-2">{count('expense')}<ChevronRight size={14} className="text-black/25" /></span>} onClick={() => onCategories('expense')} />
        <LinkRow label="Доходы" value={<span className="flex items-center gap-2">{count('income')}<ChevronRight size={14} className="text-black/25" /></span>} onClick={() => onCategories('income')} />
      </ul>
      <div className="mb-6" />

      <Caption>Данные</Caption>
      <ul className="ios-list">
        <LinkRow label="Сохранить бэкап (JSON)" tone="blue" onClick={exportJson} />
        <LinkRow label="Выгрузить операции в CSV" tone="blue" onClick={exportCsv} />
        <LinkRow label="Восстановить из бэкапа" tone="blue" onClick={importJson} />
      </ul>
      <Footnote>
        Данные хранятся только на этом телефоне{persisted ? ' — браузер обещал их не удалять' : ''}.
        Делай бэкап раз в пару недель и сохраняй в «Файлы» или отправляй себе. CSV открывается в Excel и Numbers.
      </Footnote>
    </div>
  );
}
