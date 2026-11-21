/** Крупный заголовок экрана в стиле iOS. */
export function ScreenTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="px-1 pb-4 text-[34px] font-bold tracking-tight"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}
    >
      {children}
    </h1>
  );
}
