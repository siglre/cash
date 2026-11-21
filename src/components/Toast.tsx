import { useEffect } from 'react';
import { motion } from 'framer-motion';

/** Тост с «Отменить», исчезает через 5 секунд. */
export function Toast({ text, onUndo, onDone }: { text: string; onUndo: () => void; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 5000);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="glass-dark fixed inset-x-4 z-40 mx-auto flex max-w-[480px] items-center justify-between rounded-full py-1.5 pl-5 pr-1.5"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}
    >
      <span className="text-[15px]">{text}</span>
      <button onClick={onUndo} className="h-10 rounded-full bg-white px-4 text-[15px] font-semibold text-black">Отменить</button>
    </motion.div>
  );
}
