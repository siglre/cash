import { useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const COLORS = ['#5B8CFF', '#F0609E', '#2BD4A7', '#F5A340', '#9B6BFF', '#FFD60A'];

/** Маленькое конфетти на 2 секунды — когда цель достигнута. */
export function Confetti({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    const id = setTimeout(onDone, reduce ? 1200 : 2200);
    return () => clearTimeout(id);
  }, [onDone, reduce]);

  const pieces = useMemo(() => Array.from({ length: 48 }, (_, i) => ({
    x: (Math.random() - 0.5) * 360,
    y: -(220 + Math.random() * 260),
    r: Math.random() * 720 - 360,
    c: COLORS[i % COLORS.length],
    w: 6 + Math.random() * 6,
    d: Math.random() * 0.15,
  })), []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      {!reduce && pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute bottom-1/3 left-1/2 rounded-[2px]"
          style={{ width: p.w, height: p.w * 0.45, background: p.c }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 520], rotate: p.r, opacity: [1, 1, 0] }}
          transition={{ duration: 2, delay: p.d, ease: [0.2, 0.7, 0.4, 1], times: [0, 0.4, 1] }}
        />
      ))}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-dark absolute left-1/2 top-1/3 -translate-x-1/2 rounded-full px-5 py-2.5 text-[15px] font-semibold"
      >
        Цель достигнута 🎉
      </motion.div>
    </div>
  );
}
