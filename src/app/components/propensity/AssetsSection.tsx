import { FileImage, Film, LayoutTemplate, Sparkles } from 'lucide-react';
import { DistributionBars } from '../DistributionBars';
import { DataTable, type Column } from '../ui/DataTable';
import { getAssetAnalytics, getAbmSummary, type AssetAnalytics, type AssetType } from '../../data/propensity';

// Asset Analytics: per-creative performance, plus each asset's share of total
// engagement so the "which content is pulling" story is one glance.

const TYPE_META: Record<AssetType, { label: string; icon: typeof FileImage }> = {
  display: { label: 'Display', icon: FileImage },
  native: { label: 'Native', icon: LayoutTemplate },
  video: { label: 'Video', icon: Film },
};

export function AssetsSection() {
  const assets = getAssetAnalytics();
  const campaignName = new Map(getAbmSummary().map(c => [c.id, c.name]));

  const totalEngagements = assets.reduce((s, a) => s + a.engagements, 0);
  const share = [...assets]
    .sort((a, b) => b.engagements - a.engagements)
    .map(a => ({ name: a.name, percentage: Math.round((a.engagements / totalEngagements) * 100) }));

  const columns: Column<AssetAnalytics>[] = [
    {
      key: 'name', header: 'Asset', icon: FileImage, primary: true,
      widthClass: 'w-[44%] lg:w-[30%] xl:w-[28%]',
      sortValue: a => a.name, text: a => a.name,
      render: a => (
        <div className="min-w-0">
          <div className="truncate font-bold" style={{ color: 'var(--color-text-primary)' }} title={a.name}>{a.name}</div>
          <div className="truncate" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{campaignName.get(a.abmCampaignId)}</div>
        </div>
      ),
    },
    {
      key: 'type', header: 'Type', widthClass: 'hidden lg:table-cell lg:w-[14%] xl:w-[12%]',
      sortValue: a => a.type, text: a => a.type,
      render: a => {
        const meta = TYPE_META[a.type];
        const Icon = meta.icon;
        return (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            <Icon className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
            {meta.label}
          </span>
        );
      },
    },
    {
      key: 'impressions', header: 'Impressions', align: 'right',
      widthClass: 'hidden lg:table-cell lg:w-[20%] xl:w-[17%]',
      sortValue: a => a.impressions, text: a => String(a.impressions),
      render: a => (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-primary)' }}>
          {a.impressions.toLocaleString('en-US')}
        </span>
      ),
    },
    {
      key: 'clicks', header: 'Clicks', align: 'right', mobileHidden: true,
      widthClass: 'hidden xl:table-cell xl:w-[14%]',
      sortValue: a => a.clicks, text: a => String(a.clicks),
      render: a => (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-secondary)' }}>
          {a.clicks.toLocaleString('en-US')}
        </span>
      ),
    },
    {
      key: 'ctr', header: 'CTR', align: 'right', widthClass: 'w-[24%] lg:w-[14%] xl:w-[12%]',
      sortValue: a => a.ctrPct, text: a => `${a.ctrPct}%`,
      render: a => (
        <span className="font-bold" style={{ color: a.ctrPct >= 1.4 ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
          {a.ctrPct.toFixed(2)}%
        </span>
      ),
    },
    {
      key: 'engagements', header: 'Engagements', align: 'right',
      widthClass: 'w-[32%] lg:w-[22%] xl:w-[17%]',
      sortValue: a => a.engagements, text: a => String(a.engagements),
      render: a => (
        <span className="font-bold" style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-primary)' }}>
          {a.engagements.toLocaleString('en-US')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DistributionBars
        title="Share of engagement by asset"
        data={share}
        icon={Sparkles}
        chipBg="var(--color-primary-tint)"
        chipColor="var(--color-primary)"
      />
      <DataTable
        columns={columns}
        rows={assets}
        getRowId={a => a.assetId}
        layout="fixed"
        searchPlaceholder="Search assets…"
        countLabel={n => `${n} creatives in flight`}
        empty={{ icon: FileImage, title: 'No assets yet', description: 'Creative performance appears once campaigns serve.' }}
      />
    </div>
  );
}
