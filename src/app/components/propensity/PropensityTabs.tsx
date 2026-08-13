import { useEffect, useState, type ReactNode } from 'react';
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
  /** Which tab opens first. Defaults to the first in the array. */
  initialKey?: string;
  /** Fires when the visible tab changes, including the initial one. */
  onChange?: (key: string) => void;
  /**
   * Size tabs to their labels instead of splitting the row evenly. Two tabs
   * across a 1600px page read as two enormous buttons otherwise.
   */
  fitContent?: boolean;
}

export function PropensityTabs({ tabs, initialKey, onChange, fitContent = false }: PropensityTabsProps) {
  const [active, setActive] = useState<string>(initialKey ?? tabs[0]?.key ?? '');
  const current = tabs.find(tab => tab.key === active) ?? tabs[0];

  // Report the visible tab up. Callers that mirror it into their own state need
  // the opening tab too, not just later clicks — a deep link can land on the
  // second tab, and without this the caller would think the first was showing.
  useEffect(() => {
    if (current) onChange?.(current.key);
  }, [current?.key, onChange]);

  if (tabs.length === 0) return null;

  return (
    <div>
      <div
        className={`mb-5 flex gap-1 overflow-x-auto rounded-xl p-1 md:flex-wrap md:overflow-visible ${
          fitContent ? 'w-fit max-w-full' : ''
        }`}
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
              className={`flex flex-shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
                fitContent ? '' : 'md:flex-1'
              } ${
                selected
                  ? 'bg-[var(--color-primary-solid)] text-white shadow-sm'
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
