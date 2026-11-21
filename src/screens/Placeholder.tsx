export function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <section className="px-5 pt-6">
      <h1 className="pb-4 pt-2 text-[28px] font-semibold">{title}</h1>
      <div className="card p-6 text-center text-[15px] text-muted">{note}</div>
    </section>
  );
}
