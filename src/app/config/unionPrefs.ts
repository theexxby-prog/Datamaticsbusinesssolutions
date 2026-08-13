import { useSyncExternalStore } from 'react';

// ─── UNION dashboard preferences ─────────────────────────────────────────────
// The dashboard is now three sections, and each is a genuine editorial choice
// rather than a switch standing in for a decision. Ten toggles was itself the
// symptom: four defaulted off, and the grid needed a span-absorption algorithm
// purely to survive arbitrary combinations of them.
//
// Retired: `attention` (exceptions are not optional — a warning list you can
// switch off is worthless, so it now renders whenever something is wrong and
// vanishes when nothing is), `outcomes` (merged into the commitment band),
// `freshSignals` (merged into Next moves), and `programmatic` / `comingUp` /
// `team` (module summaries the sidebar already reaches, or content that never
// changes and so does not belong on a page checked daily).
//
// `invoicesDocs` survives with a narrower job: it no longer draws a dashboard
// card, it governs whether the Invoices and Documents modules appear in the
// sidebar at all. `derivedIntel` still gates the Claude-derived scores.

export type UnionWidgetKey =
  | 'stats'
  | 'campaigns'
  | 'leadsIntel'
  | 'invoicesDocs';

export interface UnionPrefs {
  widgets: Record<UnionWidgetKey, boolean>;
  derivedIntel: boolean;
  /** The Signals count column on the Accounts list — off until scoring is real. */
  leadsSignalsColumn: boolean;
}

export const UNION_WIDGET_DESCRIPTIONS: Record<UnionWidgetKey, string> = {
  stats: 'Leads delivered this period, billing against the commitment, and what became of the leads — delivered, accepted, opportunities, closed-won.',
  campaigns: 'Per-campaign progress and pacing, plus the next scheduled delivery.',
  leadsIntel: 'Who to contact next at each enriched account, and the signal that makes now the moment.',
  invoicesDocs: 'Shows or hides the Invoices and Documents items in the sidebar.',
};

export const UNION_WIDGET_LABELS: Record<UnionWidgetKey, string> = {
  stats: 'Delivery & commitment',
  campaigns: 'Campaigns',
  leadsIntel: 'Next moves',
  invoicesDocs: 'Invoices & Documents modules',
};

const DEFAULTS: UnionPrefs = {
  widgets: {
    stats: true,
    campaigns: true,
    leadsIntel: true,
    invoicesDocs: false,
  },
  derivedIntel: false,
  leadsSignalsColumn: false,
};

const STORAGE_KEY = 'union-dashboard-prefs';

function load(): UnionPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<UnionPrefs>;
    // Spread the stored blob over the defaults, then keep only live keys —
    // a blob written before the retired widgets were removed would otherwise
    // reintroduce them into the object the settings screen iterates.
    const stored = parsed.widgets ?? {};
    const widgets = { ...DEFAULTS.widgets };
    for (const key of Object.keys(widgets) as UnionWidgetKey[]) {
      if (typeof stored[key] === 'boolean') widgets[key] = stored[key] as boolean;
    }
    return {
      widgets,
      derivedIntel: parsed.derivedIntel ?? DEFAULTS.derivedIntel,
      leadsSignalsColumn: parsed.leadsSignalsColumn ?? DEFAULTS.leadsSignalsColumn,
    };
  } catch {
    return DEFAULTS;
  }
}

let current = typeof window === 'undefined' ? DEFAULTS : load();
const listeners = new Set<() => void>();

/** Non-hook snapshot for non-component callers (nav building). Components that
 *  need reactivity subscribe via useUnionPrefs. */
export function getUnionPrefsSnapshot(): UnionPrefs {
  return current;
}

function emit() {
  listeners.forEach(l => l());
}

export function setUnionWidget(key: UnionWidgetKey, on: boolean) {
  current = { ...current, widgets: { ...current.widgets, [key]: on } };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  emit();
}

export function setLeadsSignalsColumn(on: boolean) {
  current = { ...current, leadsSignalsColumn: on };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  emit();
}

export function setDerivedIntel(on: boolean) {
  current = { ...current, derivedIntel: on };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  emit();
}

export function useUnionPrefs(): UnionPrefs {
  return useSyncExternalStore(
    cb => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => DEFAULTS,
  );
}
