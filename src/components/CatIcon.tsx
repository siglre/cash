/** Квадратная иконка с градиентом и эмодзи. */
export function CatIcon({ emoji, from, to, size = 44 }: { emoji: string; from: string; to?: string; size?: number }) {
  const end = to ?? `color-mix(in oklab, ${from} 45%, black)`;
  return (
    <div
      className="grid shrink-0 place-items-center"
      style={{
        width: size, height: size, borderRadius: size * 0.32,
        background: `linear-gradient(140deg, ${from}, ${end})`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3), inset 0 0 0 1px rgba(255,255,255,.08)',
        fontSize: size * 0.46,
      }}
    >
      <span aria-hidden="true">{emoji}</span>
    </div>
  );
}
