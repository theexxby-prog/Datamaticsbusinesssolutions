import { TrendingUp, AlertTriangle, TrendingDown, CheckCircle } from 'lucide-react';
import type { CampaignHealth } from '../utils/campaignHealth';

interface CampaignHealthBadgeProps {
  health: CampaignHealth;
  showDetails?: boolean;
}

export function CampaignHealthBadge({ health, showDetails = false }: CampaignHealthBadgeProps) {
  const Icon = health.status === 'on-track' ? TrendingUp
    : health.status === 'at-risk' ? AlertTriangle
    : TrendingDown;

  return (
    <div className="flex items-center gap-2">
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
        style={{ background: health.bgColor, color: health.color, fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)' }}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{health.label}</span>
      </div>
      {showDetails && health.status !== 'on-track' && (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {Math.round(health.paceRatio * 100)}% of expected pace
        </span>
      )}
    </div>
  );
}

interface ReplacementTrackerProps {
  totalRejected: number;
  totalReplaced: number;
  remaining: number;
}

export function ReplacementTracker({ totalRejected, totalReplaced, remaining }: ReplacementTrackerProps) {
  if (totalRejected === 0) return null;

  const percent = totalRejected > 0 ? Math.round((totalReplaced / totalRejected) * 100) : 0;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: remaining > 0 ? 'var(--color-warning-bg)' : 'var(--color-success-bg)' }}>
          {remaining > 0
            ? <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
            : <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
          }
        </div>
        <div>
          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
            Lead replacements
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {remaining > 0 ? `${remaining} replacements still owed` : 'All replacements delivered'}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full mb-2" style={{ background: 'var(--color-bg-secondary)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percent}%`,
            background: remaining > 0 ? 'var(--color-warning)' : 'var(--color-success)',
          }}
        />
      </div>

      <div className="flex justify-between" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
        <span>{totalRejected} rejected</span>
        <span>{totalReplaced} replaced</span>
      </div>
    </div>
  );
}
