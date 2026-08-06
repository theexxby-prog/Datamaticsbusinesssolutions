import { useSyncExternalStore } from 'react';

// ─── UNION dashboard preferences ─────────────────────────────────────────────
// Per Ben's direction the dashboard ships lean, but nothing is deleted: every
// section is a widget the client (or a demo driver) can toggle from Account
// settings. Defaults below ARE Ben's spec. `derivedIntel` gates the
// Claude-derived scores/synthesis (hidden until real signal scoring exists).

export type UnionWidgetKey =
  | 'attention'
  | 'stats'
  | 'campaigns'
  | 'outcomes'
  | 'leadsIntel'
  | 'freshSignals'
  | 'invoicesDocs'
  | 'programmatic'
  | 'comingUp'
  | 'team';

export interface UnionPrefs {
  widgets: Record<UnionWidgetKey, boolean>;
  derivedIntel: boolean;
  /** The Signals count column on the Accounts list — off until scoring is real. */
  leadsSignalsColumn: boolean;
}

export const UNION_WIDGET_LABELS: Record<UnionWidgetKey, string> = {
  attention: 'Needs-attention strip',
  stats: 'Key numbers (campaigns · leads · billing)',
  campaigns: 'Campaigns',
  outcomes: 'Lead outcomes',
  leadsIntel: 'Leads intelligence',
  freshSignals: 'Fresh signals',
  invoicesDocs: 'Invoices & documents',
  programmatic: 'Programmatic ABM summary',
  comingUp: 'Coming up',
  team: 'Your team',
};

const DEFAULTS: UnionPrefs = {
  widgets: {
    attention: false,
    stats: true,
    campaigns: true,
    outcomes: true,
    leadsIntel: true,
    freshSignals: false,
    invoicesDocs: false,
    programmatic: false,
    comingUp: true,
    team: true,
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
    return {
      widgets: { ...DEFAULTS.widgets, ...(parsed.widgets ?? {}) },
      derivedIntel: parsed.derivedIntel ?? DEFAULTS.derivedIntel,
      leadsSignalsColumn: parsed.leadsSignalsColumn ?? DEFAULTS.leadsSignalsColumn,
    };
  } catch {
    return DEFAULTS;
  }
}

let current = typeof window === 'undefined' ? DEFAULTS : load();
const listeners = new Set<() => void>();

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
