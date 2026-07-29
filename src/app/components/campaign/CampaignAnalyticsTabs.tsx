import { useState, type ReactNode } from 'react';
import { Mail, CalendarDays, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Analytics, tabbed ───────────────────────────────────────────────────────
// Outreach analytics, the delivery schedule and QA used to stack as three
// separate cards totalling well over 1,600px, pushing everything below them off
// the screen. Nothing is dropped — they share one card and one click. Outreach
// is the default because it is the tab a client opens the page to read.

export interface AnalyticsTab {
  key: string;
  label: string;
  Icon: LucideIcon;
  content: ReactNode;
}

/** The icons the two campaign pages use, so callers don't each import them. */
export const TAB_ICONS = { performance: Mail, delivery: CalendarDays, quality: ShieldCheck } as const;

interface CampaignAnalyticsTabsProps {
  tabs: (AnalyticsTab | false | undefined | null)[];
}

export function CampaignAnalyticsTabs({ tabs: given }: CampaignAnalyticsTabsProps) {
  const tabs = given.filter(Boolean) as AnalyticsTab[];
  const [active, setActive] = useState<string | undefined>(tabs[0]?.key);
  if (tabs.length === 0) return null;

  const current = tabs.find(tab => tab.key === active) ?? tabs[0];

  return (
    <div className="glass-card p-5">
      <div
        className="mb-4 flex flex-wrap gap-1 rounded-xl p-1"
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
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
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

      {/* Capped and internally scrolled, so page height is the same whichever
          tab is open — Delivery lists every remaining week and would otherwise
          make this column half a screen taller than the other two. Sized to
          finish level with the discussion rail beside it. */}
      <div role="tabpanel" className="max-h-[calc(100vh-23rem)] min-h-[20rem] overflow-y-auto pr-1">
        {current.content}
      </div>
    </div>
  );
}
