import type { ReactNode } from 'react';

type P = { size?: number; className?: string };

const base = (children: ReactNode, { size = 24, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {children}
  </svg>
);

export const HomeIcon = (p: P) => base(<><path d="M4 11l8-7 8 7" /><path d="M6 10v9h12v-9" /></>, p);
export const ListIcon = (p: P) => base(<><path d="M8 6h12M8 12h12M8 18h12" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>, p);
export const TargetIcon = (p: P) => base(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r=".5" /></>, p);
export const ChartIcon = (p: P) => base(<><path d="M5 20V11M12 20V4M19 20v-6" /></>, p);
export const PlusIcon = (p: P) => base(<path d="M12 5v14M5 12h14" />, p);
export const ArrowDownLeft = (p: P) => base(<path d="M17 7L7 17M7 8v9h9" />, p);
export const ArrowUpRight = (p: P) => base(<path d="M7 17L17 7M8 7h9v9" />, p);
export const ChevronRight = (p: P) => base(<path d="M9 6l6 6-6 6" />, p);
export const CloseIcon = (p: P) => base(<path d="M6 6l12 12M18 6L6 18" />, p);
export const BackspaceIcon = (p: P) => base(<><path d="M21 5H9l-6 7 6 7h12a1 1 0 001-1V6a1 1 0 00-1-1z" /><path d="M16 9.5l-5 5M11 9.5l5 5" /></>, p);
export const SettingsIcon = (p: P) => base(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></>, p);
