import { Component, type ReactNode } from 'react';

/** Вместо пустого экрана — понятное сообщение с текстом ошибки и кнопкой перезагрузки. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return <ErrorScreen error={error} />;
  }
}

export function ErrorScreen({ error }: { error: Error }) {
  {
    return (
      <div className="mx-auto max-w-[520px] px-5" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 40px)' }}>
        <h1 className="text-[22px] font-semibold">Что-то сломалось</h1>
        <p className="mt-2 text-[15px] text-muted">Данные на месте. Попробуй перезагрузить. Если не поможет — пришли текст ниже.</p>
        <pre className="mt-4 whitespace-pre-wrap break-words rounded-2xl bg-group p-4 text-[12px]">
          {error.name}: {error.message}
        </pre>
        <button onClick={() => location.reload()} className="mt-4 h-12 w-full rounded-full bg-black text-[15px] font-semibold text-white">
          Перезагрузить
        </button>
      </div>
    );
  }
}
