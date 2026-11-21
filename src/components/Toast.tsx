import { useEffect } from 'react';
import { motion } from 'framer-motion';

/** Тост: исчезает через 5 секунд (с «Отменить») или 2.5 секунды (просто сообщение). */
export function Toast({ text, onUndo, onDone }: { text: string; onUndo?: () => void; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, onUndo ? 5000 : 2500);
    return () => clearTimeout(id);
  }, [onDone, onUndo]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className={`glass-dark fixed inset-x-4 z-40 mx-auto flex max-w-[480px] items-center justify-between rounded-full py-1.5 pl-5 ${onUndo ? 'pr-1.5' : 'min-h-[52px] pr-5'}`}
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 76px)' }}
      role="status"
    >
      <span className="text-[14px]">{text}</span>
      {onUndo && <button onClick={onUndo} className="h-10 rounded-full bg-white px-4 text-[14px] font-semibold text-black">Отменить</button>}
    </motion.div>
  );
}
