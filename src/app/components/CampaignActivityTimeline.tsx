import { Truck, XCircle, RefreshCw, Flag, Edit, MessageSquare } from 'lucide-react';
import type { CampaignActivity } from '../data/campaignActivities';
import { parseDate } from '../utils/formatDate';

interface CampaignActivityTimelineProps {
  activities: CampaignActivity[];
  maxItems?: number;
}

const iconMap = {
  truck: Truck,
  'x-circle': XCircle,
  refresh: RefreshCw,
  flag: Flag,
  edit: Edit,
  message: MessageSquare,
};

const typeColors: Record<CampaignActivity['type'], { bg: string; fg: string }> = {
  delivery: { bg: 'var(--color-success-bg)', fg: 'var(--color-success)' },
  rejection: { bg: 'var(--color-error-bg)', fg: 'var(--color-error)' },
  replacement: { bg: 'var(--color-info-bg)', fg: 'var(--color-info)' },
  milestone: { bg: 'var(--color-primary-tint)', fg: 'var(--color-primary)' },
  status_change: { bg: 'var(--color-warning-bg)', fg: 'var(--color-warning)' },
  note: { bg: 'rgba(142,68,173,0.1)', fg: '#8E44AD' },
};

function formatTimestamp(iso: string) {
  const d = parseDate(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function CampaignActivityTimeline({ activities, maxItems = 8 }: CampaignActivityTimelineProps) {
  const displayed = activities.slice(0, maxItems);

  if (displayed.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div
        className="absolute left-4 top-4 bottom-4 w-px"
        style={{ background: 'var(--color-border)' }}
      />

      <div className="space-y-1">
        {displayed.map((activity, index) => {
          const Icon = iconMap[activity.icon];
          const colors = typeColors[activity.type];

          return (
            <div key={activity.id} className="flex items-start gap-3 relative pl-1">
              {/* Icon circle */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                style={{ background: colors.bg }}
              >
                <Icon className="w-4 h-4" style={{ color: colors.fg }} />
              </div>

              {/* Content */}
              <div
                className="flex-1 pb-4"
                style={{ borderBottom: index < displayed.length - 1 ? '1px solid var(--color-border)' : 'none' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                      {activity.title}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }} className="mt-0.5">
                      {activity.description}
                    </div>
                  </div>
                  <span
                    className="flex-shrink-0 whitespace-nowrap"
                    style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}
                  >
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
