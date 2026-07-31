import type { ReactNode } from 'react';
import { BarChart3, type LucideIcon } from 'lucide-react';

// Shared shell for chart sections — extracted from ReportsPage so the
// Programmatic dashboards and Reports share one card treatment.

export const CHART_COLORS = [
  'var(--color-primary)',
  'var(--color-primary-light)',
  'var(--color-error)',
  'var(--color-info)',
  'var(--color-success)',
  'var(--color-warning)',
];

export const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-surface-raised)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--color-text-primary)',
  boxShadow: 'var(--shadow-md)',
  padding: '8px',
} as const;

interface ChartCardProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  actions?: ReactNode;
}

export function ChartCard({ title, icon: Icon = BarChart3, children, actions }: ChartCardProps) {
  return (
    <div className="glass-card p-4 transition-all hover:shadow-lg animate-fadeIn">
      <div className="flex items-center justify-between mb-3">
        <h3
          className="flex items-center gap-2"
          style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}
        >
          <Icon className="w-4 h-4" />
          {title}
        </h3>
        {actions}
      </div>
      {children}
    </div>
  );
}
