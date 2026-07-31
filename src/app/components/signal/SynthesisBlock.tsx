import { ArrowRight, Compass, ShieldAlert } from 'lucide-react';
import type { IntentSynthesis } from '../../data/signalRoom';
import { INTENT_META } from './signalMeta';

// The intent synthesis — the heart of a briefing: intent type + score, the
// "why now" narrative, the cross-field connection threads, the recommended
// play, and the most likely blocker.

export function SynthesisBlock({ synthesis }: { synthesis: IntentSynthesis }) {
  const meta = INTENT_META[synthesis.intentType];

  return (
    <div className="glass-card overflow-hidden">
      <div className="border-l-4 p-5" style={{ borderColor: meta.color }}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: meta.color }}>
              Intent synthesis — {meta.label}
            </div>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight leading-snug" style={{ color: 'var(--color-text-primary)' }}>
              {synthesis.headline}
            </h2>
          </div>
          <div className="flex-shrink-0 text-center">
            <div className="text-3xl font-extrabold leading-none" style={{ color: meta.color, fontVariantNumeric: 'tabular-nums' }}>
              {synthesis.intentScore}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              Intent score
            </div>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {synthesis.whyNow}
        </p>

        {/* Connection threads — facts from separate enrichment fields chained
            into one insight. This is what "making connections" looks like. */}
        <div className="mt-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>
            Connections — {synthesis.threads.length} across separate enrichment fields
          </div>
          <div className="space-y-3">
            {synthesis.threads.map(thread => (
              <div
                key={thread.insight}
                className="rounded-xl border p-3.5"
                style={{ borderColor: 'var(--color-border-light)', background: 'var(--color-surface)' }}
              >
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  {thread.nodes.map((node, i) => (
                    <span key={node} className="inline-flex items-center gap-1.5">
                      {i > 0 && <ArrowRight className="h-3 w-3 flex-shrink-0" style={{ color: meta.color }} />}
                      <span
                        className="rounded-md px-2 py-0.5 text-[11.5px] font-semibold"
                        style={{ background: meta.bg, color: 'var(--color-text-primary)' }}
                      >
                        {node}
                      </span>
                    </span>
                  ))}
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {thread.insight}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl p-3.5" style={{ background: 'var(--color-primary-tint)' }}>
            <h4 className="mb-1 flex items-center gap-1.5 text-[12px] font-bold" style={{ color: 'var(--color-primary)' }}>
              <Compass className="h-3.5 w-3.5" /> Recommended approach
            </h4>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>{synthesis.play}</p>
          </div>
          <div className="rounded-xl border p-3.5" style={{ borderColor: 'var(--color-border-light)' }}>
            <h4 className="mb-1 flex items-center gap-1.5 text-[12px] font-bold" style={{ color: 'var(--color-text-secondary)' }}>
              <ShieldAlert className="h-3.5 w-3.5" /> Most likely blocker
            </h4>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{synthesis.risk}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
