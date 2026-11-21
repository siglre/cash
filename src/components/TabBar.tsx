import { motion } from 'framer-motion';
import { ChartIcon, HomeIcon, ListIcon, SettingsIcon, TargetIcon } from './Icons';

export type Tab = 'home' | 'history' | 'overview' | 'goals' | 'settings';

const tabs: { id: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { id: 'home', label: 'Главная', Icon: HomeIcon },
  { id: 'history', label: 'История', Icon: ListIcon },
  { id: 'overview', label: 'Обзор', Icon: ChartIcon },
  { id: 'goals', label: 'Цели', Icon: TargetIcon },
  { id: 'settings', label: 'Настройки', Icon: SettingsIcon },
];

/** Тёмная стеклянная пилюля, активная вкладка — светлый круг. */
export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      className="pointer-events-none fixed inset-x-0 z-30 flex justify-center"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 14px)' }}
    >
      <div className="glass-dark pointer-events-auto flex gap-1.5 rounded-full p-1">
        {tabs.map(({ id, label, Icon }) => {
          const active = id === tab;
          return (
            <button
              key={id} onClick={() => onChange(id)}
              aria-label={label} aria-current={active ? 'page' : undefined}
              className="relative grid h-11 w-11 place-items-center rounded-full"
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-full bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <span className={`relative ${active ? 'text-white' : 'text-white/45'}`}><Icon size={20} /></span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
