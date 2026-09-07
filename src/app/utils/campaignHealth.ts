import type { Campaign } from '../data/mockClients';

export type HealthStatus = 'on-track' | 'at-risk' | 'behind';

export interface CampaignHealth {
  status: HealthStatus;
  label: string;
  color: string;
  bgColor: string;
  progressPercent: number;
  timeElapsedPercent: number;
  paceRatio: number; // >1 = ahead, <1 = behind
}

/**
 * Calculates campaign health based on delivery pace vs elapsed time.
 * - "on-track": pace ratio >= 0.85 (delivering at or above 85% of expected pace)
 * - "at-risk":  pace ratio between 0.6 and 0.85
 * - "behind":   pace ratio < 0.6
 */
export function getCampaignHealth(campaign: Campaign): CampaignHealth {
  const target = campaign.goalLeads || campaign.target || campaign.totalLeads || 1;
  const delivered = campaign.deliveredLeads || campaign.delivered || campaign.totalLeads || 0;
  const progressPercent = Math.min(100, Math.round((delivered / target) * 100));

  // Parse dates — mock data uses "Jan 15, 2026" format
  const startDate = campaign.startDate ? new Date(campaign.startDate) : null;
  const endDate = campaign.endDate ? new Date(campaign.endDate) : null;

  if (!startDate || !endDate || campaign.status === 'completed') {
    return {
      status: campaign.status === 'completed' ? 'on-track' : 'on-track',
      label: campaign.status === 'completed' ? 'Completed' : 'On track',
      color: 'var(--color-success)',
      bgColor: 'var(--color-success-bg)',
      progressPercent,
      timeElapsedPercent: campaign.status === 'completed' ? 100 : 0,
      paceRatio: 1,
    };
  }

  const now = new Date();
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = Math.max(0, now.getTime() - startDate.getTime());
  const timeElapsedPercent = Math.min(100, Math.round((elapsed / totalDuration) * 100));

  // Avoid division by zero
  const paceRatio = timeElapsedPercent > 0
    ? (progressPercent / timeElapsedPercent)
    : progressPercent > 0 ? 2 : 1;

  if (campaign.status === 'paused') {
    return {
      status: 'at-risk',
      label: 'Paused',
      color: 'var(--color-warning)',
      bgColor: 'var(--color-warning-bg)',
      progressPercent,
      timeElapsedPercent,
      paceRatio,
    };
  }

  let status: HealthStatus;
  let label: string;
  let color: string;
  let bgColor: string;

  if (paceRatio >= 0.85) {
    status = 'on-track';
    label = 'On track';
    color = 'var(--color-success)';
    bgColor = 'var(--color-success-bg)';
  } else if (paceRatio >= 0.6) {
    status = 'at-risk';
    label = 'At risk';
    color = 'var(--color-warning)';
    bgColor = 'var(--color-warning-bg)';
  } else {
    status = 'behind';
    label = 'Behind';
    color = 'var(--color-error)';
    bgColor = 'var(--color-error-bg)';
  }

  return { status, label, color, bgColor, progressPercent, timeElapsedPercent, paceRatio };
}
