import { useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

// Tab row for the Programmatic page — same pill treatment as
// CampaignAnalyticsTabs, but a full-page variant: no card wrapper and no
// panel height cap (each section owns its cards and the page scrolls).
// On phones the row scrolls horizontally instead of wrapping.

export interface PropensityTab {
  key: string;
  label: string;
  Icon: LucideIcon;
  content: ReactNode;
}

interface PropensityTabsProps {
  tabs: PropensityTab[];
}

export function PropensityTabs({ tabs }: PropensityTabsProps) {
  const [active, setActive] = useState<string>(tabs[0]?.key ?? '');
  if (tabs.length === 0) return null;
  const current = tabs.find(tab => tab.key === active) ?? tabs[0];

  return (
    <div>
      <div
        className="mb-5 flex gap-1 overflow-x-auto rounded-xl p-1 md:flex-wrap md:overflow-visible"
        style={{ background: 'var(--background-muted)' }}
        role="tablist"
      >
        {tabs.map(tab => {
          const selected = tab.key === current.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(tab.key)}
              className={`flex flex-shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] md:flex-1 ${
                selected
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-tint)] hover:text-[var(--color-primary)]'
              }`}
            >
              <tab.Icon className="h-4 w-4 flex-shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">{current.content}</div>
    </div>
  );
}
