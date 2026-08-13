import { BookOpen, Building, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { InsightStrip } from '../ui/InsightStrip';
import { getDeliveryInsights } from '../../data/insights';
import {
  getAssetPerformance, getLeadDisposition, getLeadQuality, getPublisherPerformance,
} from '../../data/syndicationPerformance';

// ─── Content syndication performance ─────────────────────────────────────────
// Four things a delivered-lead count doesn't tell you, and the biggest gap
// between Pulse and the consultant's dashboard. Syndication is the core
// business, so this is the tab that most needed the work.
//
// Order is deliberate. Disposition comes first because it is the only section
// that reports what happened AFTER we handed the leads over, and it is the one
// number a client can act on the same day. Assets and publishers explain where
// the leads came from; quality is the reassurance strip at the bottom.
//
// These are five- and six-row fixed lists, not long ones, so they use the
// bar-in-row idiom from DistributionBars rather than DataTable — the point is
// comparing rates at a glance, and a sortable table with a search box would
// bury five rows under its own chrome.

const DISPOSITION_TONE: Record<string, string> = {
  converted: 'var(--color-success)',
  working: 'var(--color-progress)',
  accepted: 'var(--color-info)',
  rejected: 'var(--color-text-muted)',
};

interface SyndicationPerformanceProps {
  campaignId: string;
  /** Delivered leads. Everything below is derived from this, so it all sums back. */
  totalLeads: number;
  /** Ops only — reveals cost per lead on the publisher table. */
  opsView?: boolean;
}

function SectionHeading({ icon: Icon, title, blurb }: {
  icon: typeof BookOpen; title: string; blurb: string;
}) {
  return (
    <>
      <h3
        className="mb-1 flex items-center gap-2"
        style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}
      >
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      <p className="mb-4" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
        {blurb}
      </p>
    </>
  );
}

export function SyndicationPerformance({ campaignId, totalLeads, opsView = false }: SyndicationPerformanceProps) {
  const disposition = getLeadDisposition(campaignId, totalLeads);
  const assets = getAssetPerformance(campaignId, totalLeads);
  const publishers = getPublisherPerformance(campaignId, totalLeads, opsView);
  const quality = getLeadQuality(campaignId, totalLeads);
  const insights = getDeliveryInsights(campaignId, totalLeads);
  if (!disposition || !quality) return null;

  const peakConversion = Math.max(...assets.map(a => a.conversionRate), 1);
  const peakLeads = Math.max(...publishers.map(p => p.leads), 1);

  return (
    <div className="space-y-4">
      {/* What sales did with the leads — the loop nothing else in Pulse closes. */}
      <div className="glass-card p-5">
        <SectionHeading
          icon={ClipboardCheck}
          title="What happened to the leads"
          blurb={`How your sales team has dispositioned the ${disposition.delivered.toLocaleString('en-US')} leads delivered so far`}
        />

        <div className="mb-4 flex h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--color-progress-track)' }}>
          {disposition.stages.map(stage => (
            <div
              key={stage.key}
              style={{ width: `${stage.pct}%`, background: DISPOSITION_TONE[stage.key] }}
              title={`${stage.label}: ${stage.leads}`}
            />
          ))}
        </div>

        <div className="space-y-2">
          {disposition.stages.map(stage => (
            <div
              key={stage.key}
              className="flex items-baseline gap-2.5"
              data-testid="disposition-stage"
              data-stage={stage.key}
              data-leads={stage.leads}
            >
              <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: DISPOSITION_TONE[stage.key] }} />
              <span className="min-w-0 flex-1 text-[12.5px]" style={{ color: 'var(--color-text-primary)' }}>
                {stage.label}
                <span className="ml-1.5 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{stage.hint}</span>
              </span>
              <span
                className="flex-shrink-0 text-[12.5px] font-bold"
                style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}
              >
                {stage.leads.toLocaleString('en-US')}
                <span className="ml-1 text-[11px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>{stage.pct}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Which asset earned them. Rate, not volume, is the column that matters. */}
      <div className="glass-card p-5">
        <SectionHeading
          icon={BookOpen}
          title="Asset performance"
          blurb="Volume tells you what we promoted; conversion rate tells you what worked"
        />
        <div className="space-y-3">
          {assets.map(asset => (
            <div key={asset.assetId} data-testid="asset-row" data-conversion={asset.conversionRate}>
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {asset.name}
                  <span className="ml-2 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{asset.type}</span>
                </span>
                <span
                  className="flex-shrink-0 text-[12.5px] font-bold"
                  style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {asset.conversionRate}%
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--background-muted)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(3, Math.round((asset.conversionRate / peakConversion) * 100))}%`,
                      background: 'var(--color-primary-solid)',
                    }}
                  />
                </div>
                <span
                  className="flex-shrink-0 text-[11px]"
                  style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {asset.leads.toLocaleString('en-US')} leads from {asset.views.toLocaleString('en-US')} views
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Where they came from. Ops sees what each source costs. */}
      <div className="glass-card p-5">
        <SectionHeading
          icon={Building}
          title="Publisher performance"
          blurb={opsView
            ? 'Volume against quality and cost, the trade-off that decides what gets renewed'
            : 'The sources the leads were generated through, and how many you accepted'}
        />
        <div className="space-y-3">
          {publishers.map(pub => (
            <div key={pub.publisher} className="flex items-center gap-3" data-testid="publisher-row">
              <span className="w-[34%] flex-shrink-0 truncate text-[12.5px]" style={{ color: 'var(--color-text-primary)' }}>
                {pub.publisher}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--background-muted)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(3, Math.round((pub.leads / peakLeads) * 100))}%`,
                    background: 'var(--color-progress)',
                  }}
                />
              </div>
              <span
                className="w-11 flex-shrink-0 text-right text-[12px] font-semibold"
                style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}
              >
                {pub.leads.toLocaleString('en-US')}
              </span>
              <span
                className="hidden w-[74px] flex-shrink-0 text-right text-[11.5px] sm:block"
                style={{ color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}
                title="Share of this source's leads you accepted"
              >
                {pub.acceptanceRate}% acc.
              </span>
              {pub.costPerLead !== undefined && (
                <span
                  className="w-[62px] flex-shrink-0 text-right text-[11.5px] font-semibold"
                  style={{ color: 'var(--color-warning)', fontVariantNumeric: 'tabular-nums' }}
                  title="Cost per lead — ops only"
                >
                  ${pub.costPerLead.toFixed(2)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* The reassurance strip. Rejections are safe to show beside replacements. */}
      <div className="glass-card p-5">
        <SectionHeading
          icon={ShieldCheck}
          title="Lead quality"
          blurb="Measured against the targeting criteria agreed on the job card"
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Title match', value: `${quality.titleMatchPct}%`, sub: 'against the agreed job titles' },
            { label: 'Firmographic match', value: `${quality.firmographicMatchPct}%`, sub: 'size, industry and geography' },
            { label: 'Delivered on time', value: `${quality.slaOnTimePct}%`, sub: 'on or before the scheduled date' },
            { label: 'Rejected and replaced', value: `${quality.rejected}`, sub: `all ${quality.replaced} replaced free` },
          ].map(tile => (
            <div key={tile.label}>
              <div
                className="text-[19px] font-extrabold leading-tight"
                style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}
              >
                {tile.value}
              </div>
              <div className="text-[11.5px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{tile.label}</div>
              <div className="text-[10.5px]" style={{ color: 'var(--color-text-muted)' }}>{tile.sub}</div>
            </div>
          ))}
        </div>
        <InsightStrip insights={insights} />
      </div>
    </div>
  );
}
