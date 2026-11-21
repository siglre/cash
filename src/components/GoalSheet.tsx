import { useState } from 'react';
import type { Goal } from '../lib/types';
import { toDateInput } from '../lib/dates';
import { deleteGoal, saveGoal, setGoalArchived } from '../db/repo';
import { FormSheet, Footnote, LinkRow, Row, groupDigits, inputRight, onlyDigits, Caption } from './Form';

const GRADIENTS: [string, string][] = [
  ['#5B8CFF', '#9B6BFF'], ['#F0609E', '#FF9A6B'], ['#2BD4A7', '#35A7D8'],
  ['#F5A340', '#F0609E'], ['#7A7CFF', '#35C4D8'], ['#34C98B', '#C6E35B'],
];
const EMOJIS = ['🎯', '📱', '🎧', '🎮', '📺', '💻', '✈️', '🚗', '🏠', '🎁', '🛋️', '🩺'];

/** Создание и редактирование цели. */
export function GoalSheet({ goal, saved, onClose }: { goal?: Goal; saved: number; onClose: () => void }) {
  const [name, setName] = useState(goal?.name ?? '');
  const [target, setTarget] = useState(goal ? String(goal.target) : '');
  const [deadline, setDeadline] = useState(() => {
    if (goal) return toDateInput(new Date(goal.deadline));
    const d = new Date(); d.setMonth(d.getMonth() + 6);
    return toDateInput(d);
  });
  const [emoji, setEmoji] = useState(goal?.emoji ?? '🎯');
  const [gradient, setGradient] = useState<[string, string]>(goal?.gradient ?? GRADIENTS[0]);

  const amount = Number(onlyDigits(target)) || 0;
  const valid = name.trim() !== '' && amount > 0 && deadline !== '';

  const save = async () => {
    if (!valid) return;
    const [y, m, d] = deadline.split('-').map(Number);
    await saveGoal({
      id: goal?.id, name: name.trim(), target: amount,
      deadline: new Date(y, m - 1, d).toISOString(), emoji, gradient, archived: goal?.archived,
    });
    onClose();
  };

  const remove = async () => {
    if (!goal) return;
    const msg = saved > 0
      ? 'По цели есть операции, поэтому она уйдёт в архив, а отложенные на неё деньги снова станут свободными. Продолжить?'
      : `Удалить цель «${goal.name}»?`;
    if (!confirm(msg)) return;
    await deleteGoal(goal.id);
    onClose();
  };

  return (
    <FormSheet title={goal ? 'Цель' : 'Новая цель'} onCancel={onClose} onDone={save} doneDisabled={!valid}>
      <ul className="ios-list bg-white">
        <Row label="Название">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, отпуск" autoFocus={!goal} className={inputRight} />
        </Row>
        <Row label="Сумма">
          <input inputMode="numeric" value={groupDigits(target)} onChange={(e) => setTarget(onlyDigits(e.target.value))} placeholder="0" className={inputRight} />
          <span className="text-[15px] text-muted">₽</span>
        </Row>
        <Row label="Накопить до">
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="bg-transparent text-right text-[16px] text-muted outline-none" />
        </Row>
      </ul>

      <Caption>Иконка</Caption>
      <div className="ios-list grid grid-cols-6 gap-1 bg-white p-2">
        {EMOJIS.map((e) => (
          <button key={e} onClick={() => setEmoji(e)} aria-pressed={emoji === e}
            className={`grid h-11 place-items-center rounded-xl text-[22px] ${emoji === e ? 'bg-black/[0.08]' : ''}`}>{e}</button>
        ))}
      </div>

      <Caption>Цвет карточки</Caption>
      <div className="ios-list mb-6 grid grid-cols-6 gap-2 bg-white p-3">
        {GRADIENTS.map((g) => {
          const on = g[0] === gradient[0] && g[1] === gradient[1];
          return (
            <button key={g.join()} onClick={() => setGradient(g)} aria-label="Цвет" aria-pressed={on}
              className={`h-10 rounded-full ${on ? 'ring-2 ring-black ring-offset-2' : ''}`}
              style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }} />
          );
        })}
      </div>

      {goal && (
        <>
          <ul className="ios-list bg-white">
            <LinkRow label={goal.archived ? 'Вернуть из архива' : 'Перенести в архив'} tone="blue"
              onClick={async () => { await setGoalArchived(goal.id, !goal.archived); onClose(); }} />
            <LinkRow label="Удалить цель" tone="red" onClick={remove} />
          </ul>
          <Footnote>В архиве цель не считается в «Свободно» и «Нужно отложить».</Footnote>
        </>
      )}
    </FormSheet>
  );
}
