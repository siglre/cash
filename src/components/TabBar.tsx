import { motion } from 'framer-motion';
import { ChartIcon, HomeIcon, ListIcon, TargetIcon } from './Icons';

export type Tab = 'home' | 'history' | 'goals' | 'stats';

const tabs: { id: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { id: 'home', label: 'Главная', Icon: HomeIcon },
  { id: 'history', label: 'История', Icon: ListIcon },
  { id: 'goals', label: 'Цели', Icon: TargetIcon },
  { id: 'stats', label: 'Статистика', Icon: ChartIcon },
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
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className="relative grid h-[52px] w-[60px] place-items-center rounded-full"
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-full bg-white"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <span className={`relative ${active ? 'text-black' : 'text-white/70'}`}>
                <Icon size={24} />
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
