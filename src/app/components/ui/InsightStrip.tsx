import { AlertTriangle, CheckCircle2, Info, type LucideIcon } from 'lucide-react';

// ─── Insight strip ───────────────────────────────────────────────────────────
// The consultant's dashboard puts a written "Read: … So what: …" callout under
// every chart. The idea is good, the execution is where we deliberately differ:
// his callouts recommend budget moves ("shift $90K into LinkedIn Doc Ads"),
// which is a media-buying opinion dressed up as a data readout.
//
// Ours state facts the data can prove and stop there. "32 named accounts have
// had no impression served" is checkable against the funnel above it; the
// decision about what to do stays with the person reading. That rule is what
// makes it safe to auto-generate these at all.
//
// Every strip is built by a rule in insights.ts, never hand-written per screen.

export type InsightTone = 'neutral' | 'watch' | 'good';

const TONES: Record<InsightTone, { fg: string; bg: string; Icon: LucideIcon }> = {
  neutral: { fg: 'var(--color-info)', bg: 'var(--color-info-bg)', Icon: Info },
  watch: { fg: 'var(--color-warning)', bg: 'var(--color-warning-bg)', Icon: AlertTriangle },
  good: { fg: 'var(--color-success)', bg: 'var(--color-success-bg)', Icon: CheckCircle2 },
};

export interface Insight {
  id: string;
  tone: InsightTone;
  /** The fact. One sentence, always checkable against the chart above it. */
  text: string;
}

export function InsightStrip({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;
  return (
    <div className="mt-3 space-y-1.5">
      {insights.map(insight => {
        const tone = TONES[insight.tone];
        return (
          <div
            key={insight.id}
            data-testid="insight"
            data-tone={insight.tone}
            className="flex items-start gap-2 rounded-lg px-2.5 py-2"
            style={{ background: tone.bg }}
          >
            <tone.Icon className="mt-px h-3.5 w-3.5 flex-shrink-0" style={{ color: tone.fg }} aria-hidden />
            <span className="text-xs leading-snug" style={{ color: 'var(--color-text-primary)' }}>
              {insight.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
