import { motion } from 'framer-motion';
import { HomeIcon, ListIcon, TargetIcon } from './Icons';

export type Tab = 'home' | 'history' | 'goals';

const tabs: { id: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { id: 'home', label: 'Главная', Icon: HomeIcon },
  { id: 'history', label: 'История', Icon: ListIcon },
  { id: 'goals', label: 'Цели', Icon: TargetIcon },
];

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      className="pointer-events-none fixed inset-x-0 z-30 flex justify-center"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
    >
      <div className="glass-strong pointer-events-auto flex gap-1 rounded-full p-1.5">
        {tabs.map(({ id, label, Icon }) => {
          const active = id === tab;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              aria-current={active ? 'page' : undefined}
              className="relative flex h-[54px] w-[92px] flex-col items-center justify-center gap-0.5 rounded-full"
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-full bg-white"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <span className={`relative flex flex-col items-center gap-0.5 ${active ? 'text-black' : 'text-white/70'}`}>
                <Icon size={22} />
                <span className="text-[11px] font-medium leading-none">{label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
