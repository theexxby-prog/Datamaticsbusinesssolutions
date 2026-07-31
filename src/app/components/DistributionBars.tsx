import { motion, useReducedMotion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';

// Uniform horizontal-bar card for a distribution dimension — extracted from
// ReportsPage (where it renders the four demographic breakdowns) so the
// Programmatic dashboards share the same treatment. Single brand color,
// length encodes value; bars are normalised against the first (largest) row.

export interface DistributionDatum {
  name: string;
  percentage: number;
}

interface DistributionBarsProps {
  title: string;
  data: DistributionDatum[];
  chipBg: string;
  chipColor: string;
  icon: LucideIcon;
}

export function DistributionBars({ title, data, chipBg, chipColor, icon: Icon }: DistributionBarsProps) {
  const reduce = useReducedMotion();
  const maxPct = data && data.length ? data[0].percentage || 1 : 1;
  return (
    <div className="glass-card p-4">
      <h3
        className="flex items-center gap-2 mb-4"
        style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}
      >
        <span
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ width: 24, height: 24, background: chipBg, color: chipColor }}
        >
          <Icon className="w-3.5 h-3.5" />
        </span>
        {title}
      </h3>
      {(!data || data.length === 0) ? (
        <div className="text-sm py-6 text-center" style={{ color: 'var(--color-text-secondary)' }}>
          No data entered yet.
        </div>
      ) : (
        <div>
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-3 my-2">
              <span className="text-xs flex-shrink-0 truncate" style={{ width: 116, color: 'var(--color-text-secondary)' }}>
                {d.name}
              </span>
              <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--background-muted)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: i === 0 ? 'var(--color-primary)' : '#3E5C8A' }}
                  initial={reduce ? false : { width: 0 }}
                  whileInView={{ width: `${Math.max(3, Math.round((d.percentage / maxPct) * 100))}%` }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
                />
              </div>
              <span
                className="text-xs font-semibold text-right flex-shrink-0"
                style={{ width: 46, color: 'var(--color-text-primary)' }}
              >
                {d.percentage}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
