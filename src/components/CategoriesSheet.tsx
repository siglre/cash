import { useState } from 'react';
import type { Category } from '../lib/types';
import { saveCategories } from '../db/repo';
import { FormSheet, Footnote } from './Form';

const COLORS = ['#5B8CFF', '#34C98B', '#F5A340', '#F2C94C', '#9B6BFF', '#F0609E', '#35C4D8', '#EF5B5B', '#7A7CFF'];

/** Редактор категорий одного вида: эмодзи, название, удалить, добавить. */
export function CategoriesSheet({ kind, all, onClose }: { kind: Category['kind']; all: Category[]; onClose: () => void }) {
  const [list, setList] = useState(() => all.filter((c) => c.kind === kind && !c.archived));
  const set = (i: number, patch: Partial<Category>) => setList(list.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const save = async () => {
    await saveCategories(kind, list.filter((c) => c.name.trim()).map((c) => ({ ...c, name: c.name.trim(), emoji: c.emoji.trim() || '•' })));
    onClose();
  };

  const add = () => setList([...list, {
    id: crypto.randomUUID(), name: '', emoji: '•', kind, order: list.length,
    color: COLORS[list.length % COLORS.length],
  }]);

  return (
    <FormSheet title={kind === 'expense' ? 'Категории расходов' : 'Категории доходов'} onCancel={onClose} onDone={save}>
      <ul className="ios-list bg-white">
        {list.map((c, i) => (
          <li key={c.id} className="flex min-h-[46px] items-center gap-2 pl-3 pr-4">
            <button onClick={() => setList(list.filter((_, j) => j !== i))} aria-label={`Удалить ${c.name}`} className="grid h-11 w-7 shrink-0 place-items-center">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-neg"><span className="h-0.5 w-2.5 rounded bg-white" /></span>
            </button>
            <input
              value={c.emoji} onChange={(e) => set(i, { emoji: [...e.target.value].slice(-2).join('') })}
              aria-label="Эмодзи" className="w-9 shrink-0 bg-transparent text-center text-[18px] outline-none"
            />
            <input
              value={c.name} onChange={(e) => set(i, { name: e.target.value })} placeholder="Название"
              className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-black/25"
            />
          </li>
        ))}
        <li>
          <button onClick={add} className="flex min-h-[46px] w-full items-center gap-2 pl-3 pr-4 text-left text-[15px] text-[#007aff] active:bg-black/5">
            <span className="grid h-11 w-7 place-items-center">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-pos text-[15px] leading-none text-white">+</span>
            </span>
            Добавить категорию
          </button>
        </li>
      </ul>
      <Footnote>Нажми на эмодзи, чтобы заменить его. Удалённые категории останутся у старых операций.</Footnote>
    </FormSheet>
  );
}
