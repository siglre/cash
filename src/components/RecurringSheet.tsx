import { useState } from 'react';
import type { AppData } from '../hooks';
import type { Recurring } from '../lib/types';
import { archiveRecurring, saveRecurring } from '../db/repo';
import { FormSheet, Footnote, LinkRow, Row, groupDigits, inputRight, onlyDigits, selectRight } from './Form';

/** Регулярный платёж: квартира, подписка, кредит. */
export function RecurringSheet({ rec, data, onClose }: { rec?: Recurring; data: AppData; onClose: () => void }) {
  const cats = data.categories.filter((c) => c.kind === 'expense' && (!c.archived || c.id === rec?.categoryId));
  const [name, setName] = useState(rec?.name ?? '');
  const [amount, setAmount] = useState(rec ? String(rec.amount) : '');
  const [day, setDay] = useState(rec?.day ?? new Date().getDate());
  const [categoryId, setCategoryId] = useState(rec?.categoryId ?? 'exp-subs');
  const [accountId, setAccountId] = useState(rec?.accountId ?? data.accounts[0]?.id);

  const value = Number(onlyDigits(amount)) || 0;
  const valid = name.trim() !== '' && value > 0;

  const save = async () => {
    if (!valid) return;
    await saveRecurring({ id: rec?.id, name: name.trim(), amount: value, day, categoryId, accountId });
    onClose();
  };

  const remove = async () => {
    if (!rec || !confirm(`Удалить платёж «${rec.name}»? Прошлые оплаты останутся в истории.`)) return;
    await archiveRecurring(rec.id);
    onClose();
  };

  return (
    <FormSheet title={rec ? 'Платёж' : 'Новый платёж'} onCancel={onClose} onDone={save} doneDisabled={!valid}>
      <ul className="ios-list bg-white">
        <Row label="Название">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Яндекс Плюс" autoFocus={!rec} className={inputRight} />
        </Row>
        <Row label="Сумма в месяц">
          <input inputMode="numeric" value={groupDigits(amount)} onChange={(e) => setAmount(onlyDigits(e.target.value))} placeholder="0" className={inputRight} />
          <span className="text-[15px] text-muted">₽</span>
        </Row>
        <Row label="Списывается">
          <select value={day} onChange={(e) => setDay(Number(e.target.value))} className={selectRight}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}-го числа</option>)}
          </select>
        </Row>
        <Row label="Категория">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectRight}>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
        </Row>
        <Row label="Счёт">
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={selectRight}>
            {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Row>
      </ul>
      <Footnote>
        Пока платёж в этом месяце не оплачен, его сумма уже вычтена из «Свободно».
        Отметить оплату — на главной, в блоке «Платежи».
      </Footnote>
      {rec && <ul className="ios-list bg-white"><LinkRow label="Удалить платёж" tone="red" onClick={remove} /></ul>}
    </FormSheet>
  );
}
