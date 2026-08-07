import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Layers, Sparkles, ArrowRight, AlertCircle, FilePenLine, ClipboardList,
  TrendingDown, LayoutGrid, Truck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { unionClient, UNION_CLIENT_ID } from '../data/unionClient';
import { mockInvoiceRecords } from '../data/mockInvoiceRecords';
import { mockJobCards } from '../data/mockJobCards';
import {
  getAccountsByReadiness, getSignalContact, signalLeadId, getTriggerTimeline,
  type SignalAccount,
} from '../data/signalRoom';
import {
  getLeadOutcomes, getCampaignForecasts, getUpcomingEvents, getPeriodStats,
  campaignTypeFor, type StatPeriod,
} from '../data/outcomes';
import { useUnionPrefs } from '../config/unionPrefs';
import { mockLeads } from '../mockData';
import { formatDateShort } from '../utils/formatDate';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatMoney as fmtMoney } from '../utils/format';

// ─── UNION dashboard ─────────────────────────────────────────────────────────
// This page answers three questions and then stops:
//
//   1. Am I getting what I paid for?   → the commitment band
//   2. Does anything need me?          → exceptions, and only when true
//   3. What is the best next move?     → campaigns + next moves
//
// Everything else belongs on its module page. A dashboard that summarises all
// nine pages competes with all nine and wins against none — the previous
// version carried ten sections, eighteen KPIs and twelve exits, and repeated
// the same figures two and three times over. Anything the sidebar already
// reaches in one click is not repeated here.
//
// Sizes come from the five-step scale in components.css (t-hero → t-micro).
// Do not reintroduce ad-hoc px sizes: the eleven-size spread this page used to
// carry is what made it read as noise.

/**
 * One step of what became of the delivered leads. The hero above already states
 * the delivered figure, so the progression starts at Accepted — printing
 * "Delivered" again here would repeat a number that is 40px away, which is the
 * habit this rewrite exists to break.
 */
function OutcomeStep({
  label, value, money, pct, last,
}: { label: string; value: number; money?: number; pct: number; last?: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-baseline gap-1.5">
        <span className="t-title t-num">{value.toLocaleString('en-US')}</span>
        <span className="t-meta t-num">{pct}%</span>
        {money !== undefined && (
          <span className="t-meta" style={{ color: 'var(--color-success)' }}>{fmtMoney(money)}</span>
        )}
      </div>
      <span className="t-micro truncate">{label}</span>
      <span className="h-1 overflow-hidden rounded-full" style={{ background: 'var(--background-muted)' }}>
        <span
          className="block h-full rounded-full"
          style={{
            width: `${Math.max(2, pct)}%`,
            background: last ? 'var(--color-success)' : 'var(--gradient-primary)',
          }}
        />
      </span>
    </div>
  );
}

export default function UnionDashboard() {
  useDocumentTitle('Dashboard');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const prefs = useUnionPrefs();

  const [period, setPeriod] = useState<StatPeriod>('month');
  const stats = getPeriodStats(period);
  const outcomes = getLeadOutcomes(stats.leads);

  const forecasts = getCampaignForecasts();
  // Reads every campaign, not the slice rendered below, so one cannot slip out
  // of the warning by falling off the list.
  const atRiskForecast = forecasts.find(f => f.atRisk);
  const recentForecasts = [...forecasts]
    .sort((a, b) => Date.parse(b.campaign.lastActivity) - Date.parse(a.campaign.lastActivity))
    .slice(0, 5);

  const nextDelivery = getUpcomingEvents().find(e => e.kind === 'delivery');

  const pendingLeads = mockLeads.filter(l => l.status === 'Pending Review').length;
  const topOverdue = mockInvoiceRecords.find(i => i.clientId === UNION_CLIENT_ID && i.stage === 'overdue');
  const topSignature = mockJobCards.find(
    c => c.clientCompany === currentUser?.company && c.type === 'client_signature' && c.stage === 'sent_for_signature',
  );

  // ── Question 2: does anything need me? ─────────────────────────────────────
  // Exceptions only — things that are wrong or owed. Opportunities live in
  // Next moves. This is the single place an exception appears on the page; the
  // sections below deliberately do not restate them. When nothing is wrong the
  // strip does not render at all, which is what makes its presence meaningful.
  const exceptions = [
    pendingLeads > 0 && {
      key: 'leads', icon: ClipboardList, tone: 'var(--color-primary)',
      label: 'Awaiting your review',
      text: `${pendingLeads} lead${pendingLeads === 1 ? '' : 's'} to accept or reject`,
      go: () => navigate('/leads?status=Pending%20Review&data=all'),
    },
    atRiskForecast && {
      key: 'pace', icon: TrendingDown, tone: 'var(--color-warning)',
      label: 'Delivery at risk',
      text: `${atRiskForecast.campaign.name} — projected ${atRiskForecast.projected.toLocaleString('en-US')} of ${atRiskForecast.target.toLocaleString('en-US')}`,
      go: () => navigate(`/campaigns/${atRiskForecast.campaign.id}`),
    },
    topOverdue && {
      key: 'invoice', icon: AlertCircle, tone: 'var(--color-error)',
      label: 'Invoice overdue',
      text: `${topOverdue.invoiceNumber} · ${fmtMoney(topOverdue.total)}`,
      go: () => navigate('/invoices'),
    },
    topSignature && {
      key: 'sign', icon: FilePenLine, tone: 'var(--color-warning)',
      label: 'Signature required',
      text: topSignature.campaignName,
      go: () => navigate('/documents'),
    },
  ].filter((x): x is NonNullable<typeof x> => Boolean(x));

  // ── Question 3: what is the best next move? ────────────────────────────────
  // One list, not two. "Top accounts" and "fresh signals" were separate cards
  // saying the same thing from two angles; an account, the person to contact
  // and the reason to call now belong on one row.
  const triggers = getTriggerTimeline();
  const newestFor = (account: SignalAccount) => triggers.find(t => t.account.slug === account.slug);
  const nextMoves = getAccountsByReadiness()
    .map(({ account, insight }) => {
      const step = insight.sequence.find(s => getSignalContact(s.contactId));
      const person = step ? getSignalContact(step.contactId) : undefined;
      return person ? { account, person, trigger: newestFor(account) } : null;
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .slice(0, 4);

  // Billed-to-date across FY26. stats.billed is period-scoped and stats.remainingYear
  // is not, so deriving the annual figure from the annual pair keeps the line honest.
  const billedYear = Math.max(0, stats.contracted - stats.remainingYear);
  const committedPct = stats.contracted > 0
    ? Math.min(100, Math.round((billedYear / stats.contracted) * 100))
    : 0;
  const pctOf = (n: number) => Math.round((n / Math.max(outcomes.delivered, 1)) * 100);

  const showCampaigns = prefs.widgets.campaigns;
  const showNextMoves = prefs.widgets.leadsIntel;
  const allOff = !prefs.widgets.stats && !showCampaigns && !showNextMoves;

  return (
    <div className="max-w-[1240px] mx-auto page-content space-y-4">
      {allOff && (
        <div className="glass-card flex flex-col items-center gap-2 p-10 text-center" data-testid="dashboard-empty-state">
          <LayoutGrid className="h-8 w-8" style={{ color: 'var(--color-text-muted)' }} />
          <div className="t-title">All dashboard sections are hidden</div>
          <p className="t-body max-w-sm">Turn sections back on under the Dashboard tab in Account settings.</p>
          <button onClick={() => navigate('/account?tab=dashboard')} className="btn-primary mt-1 px-4 py-2 text-sm">
            Open dashboard settings
          </button>
        </div>
      )}

      {/* Exceptions — absent entirely on a good day */}
      {exceptions.length > 0 && (
        <div className="flex flex-col gap-px overflow-hidden rounded-xl border" style={{ borderColor: 'var(--color-border-light)' }}>
          {exceptions.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={item.go}
                className="flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[var(--color-primary-tint)]"
                style={{ background: 'var(--color-surface-raised)' }}
              >
                <Icon className="h-4 w-4 flex-shrink-0" style={{ color: item.tone }} />
                <span className="t-meta w-[150px] flex-shrink-0" style={{ color: item.tone }}>{item.label}</span>
                <span className="t-body min-w-0 flex-1 truncate" style={{ color: 'var(--color-text-primary)' }}>{item.text}</span>
                <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
              </button>
            );
          })}
        </div>
      )}

      {/* ── Question 1: am I getting what I paid for? ────────────────────────
          One band. This replaced three KPI tiles and a five-row funnel that
          between them printed the delivered figure twice — the funnel's first
          row was literally the leads tile, re-derived. */}
      {prefs.widgets.stats && (
        <div className="glass-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="t-hero">{outcomes.delivered.toLocaleString('en-US')}</span>
                <span className="t-body">leads delivered this {period}</span>
              </div>
              {/* The commitment is annual and stays annual, whatever the period
                  switcher is showing. `contracted` is always FY26_COMMITMENT
                  while `billed` is period-scoped, so pairing the two read as
                  "$0 billed of $148,000 contracted" early in a month — a true
                  pair of numbers that together stated something false. */}
              <div className="t-meta mt-1.5">
                {fmtMoney(billedYear)} billed of {fmtMoney(stats.contracted)} committed for FY26
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span style={{ color: 'var(--color-success)' }}>{fmtMoney(stats.remainingYear)} remaining</span>
              </div>
              <div className="mt-2 h-1.5 w-full max-w-[420px] overflow-hidden rounded-full" style={{ background: 'var(--background-muted)' }}>
                <div className="h-full rounded-full" style={{ width: `${committedPct}%`, background: 'var(--gradient-primary)' }} />
              </div>
            </div>

            {/* One period control for the whole band. There used to be three,
                each rendering the same switcher bound to the same state. */}
            <div className="flex rounded-full p-0.5" style={{ background: 'var(--background-muted)' }} role="tablist">
              {(['month', 'quarter', 'year'] as const).map(p => (
                <button
                  key={p}
                  role="tab"
                  aria-selected={period === p}
                  onClick={() => setPeriod(p)}
                  className={`t-micro rounded-full px-3 py-1.5 transition-colors ${
                    period === p ? 'text-white' : 'hover:text-[var(--color-text-primary)]'
                  }`}
                  style={period === p ? { background: 'var(--gradient-primary)', color: '#fff' } : undefined}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* What happened to those leads. Four steps, not five: "synced to
              CRM" is plumbing rather than an outcome, and opportunities now
              carry their own pipeline value instead of it being a separate
              headline number. */}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 border-t pt-3.5" style={{ borderColor: 'var(--color-border-light)' }}>
            <OutcomeStep label="Accepted" value={outcomes.accepted} pct={pctOf(outcomes.accepted)} />
            <OutcomeStep label="Opportunities" value={outcomes.opportunities} money={outcomes.pipelineValue} pct={pctOf(outcomes.opportunities)} />
            <OutcomeStep label="Closed-won" value={outcomes.closedWon} money={outcomes.wonValue} pct={pctOf(outcomes.closedWon)} last />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Campaigns — the product itself, so it gets the larger share */}
        {showCampaigns && (
          <div className={`glass-card p-5 ${showNextMoves ? 'lg:col-span-3' : 'lg:col-span-5'}`}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="t-title flex items-center gap-2">
                <Layers className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                Campaigns
              </h2>
              <button onClick={() => navigate('/campaigns')} className="t-meta hover:underline" style={{ color: 'var(--color-primary)' }}>
                All {forecasts.length} <ArrowRight className="ml-0.5 inline h-3 w-3" />
              </button>
            </div>

            {nextDelivery && (
              <p className="t-meta mb-3 inline-flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" style={{ color: 'var(--color-success)' }} />
                Next delivery {formatDateShort(nextDelivery.date)} · {nextDelivery.sub}
              </p>
            )}

            <div className="space-y-3">
              {recentForecasts.map(({ campaign: c, target, delivered, projected, atRisk }) => {
                const pct = target > 0 ? Math.min(100, Math.round((delivered / target) * 100)) : 0;
                const active = c.status === 'active';
                const pace = c.status === 'pending_approval'
                  ? 'Awaiting approval'
                  : !active
                    ? 'Flight complete'
                    : atRisk
                      ? `At risk · ${projected.toLocaleString('en-US')} projected`
                      : `On pace · ${projected.toLocaleString('en-US')} by ${formatDateShort(c.endDate ?? '')}`;
                const paceTone = c.status === 'pending_approval'
                  ? 'var(--color-warning)'
                  : !active ? 'var(--color-text-muted)'
                  : atRisk ? 'var(--color-warning)' : 'var(--color-success)';
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/campaigns/${c.id}`)}
                    className="block w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-primary-tint)]"
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="t-body truncate font-semibold" style={{ color: 'var(--color-text-primary)' }}>{c.name}</span>
                        <span
                          className="t-micro flex-shrink-0 rounded-full px-1.5 py-0.5"
                          style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}
                        >
                          {campaignTypeFor(c.id)}
                        </span>
                      </span>
                      <span className="t-meta t-num flex-shrink-0">
                        {delivered.toLocaleString('en-US')} / {target.toLocaleString('en-US')}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--background-muted)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: c.status === 'completed' ? 'var(--color-text-muted)' : 'var(--gradient-primary)' }}
                      />
                    </div>
                    <span className="t-meta mt-1 block" style={{ color: paceTone }}>{pace}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Next moves — one row per account: who to call and why now */}
        {showNextMoves && (
          <div className={`glass-card p-5 ${showCampaigns ? 'lg:col-span-2' : 'lg:col-span-5'}`}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="t-title flex items-center gap-2">
                <Sparkles className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                Next moves
              </h2>
              <button onClick={() => navigate('/leads')} className="t-meta hover:underline" style={{ color: 'var(--color-primary)' }}>
                Leads <ArrowRight className="ml-0.5 inline h-3 w-3" />
              </button>
            </div>
            <div className="space-y-1">
              {nextMoves.map(({ account, person, trigger }, index) => (
                <button
                  key={account.slug}
                  onClick={() => navigate(`/leads/${signalLeadId(person.id)}`)}
                  className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--color-primary-tint)]"
                >
                  <span
                    className="t-micro mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ background: 'var(--gradient-primary)', color: '#fff', letterSpacing: 0 }}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="t-body block truncate font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {person.name}
                    </span>
                    <span className="t-meta block truncate">{account.name}</span>
                    {trigger && (
                      <span className="t-meta mt-0.5 block truncate" style={{ color: 'var(--color-text-secondary)' }}>
                        {trigger.text}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
