import { useEffect, useRef, type CSSProperties } from 'react';
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from 'framer-motion';
import { formatMoney } from '../lib/money';

/** Число, которое плавно «докручивается» до нового значения. */
export function AnimatedNumber({ value, format = formatMoney, className, style }: {
  value: number; format?: (n: number) => string; className?: string; style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const initial = useRef(format(value)).current; // React не перезаписывает DOM между анимацией
  const mv = useMotionValue(value);

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      if (ref.current) ref.current.textContent = format(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.8, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);

  useMotionValueEvent(mv, 'change', (v) => {
    if (ref.current) ref.current.textContent = format(Math.round(v));
  });

  return <span ref={ref} className={className} style={style}>{initial}</span>;
}
