import { useNavigate } from 'react-router';
import {
  Users, Layers, TrendingUp, TrendingDown, Sparkles, Gauge, Radar, ArrowRight, AlertCircle,
  FilePenLine, Receipt, FolderOpen, ListOrdered, FileBarChart, Megaphone, ClipboardList,
  CalendarDays, Wallet, Truck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { unionClient, UNION_CLIENT_ID } from '../data/unionClient';
import { mockInvoiceRecords } from '../data/mockInvoiceRecords';
import { mockJobCards } from '../data/mockJobCards';
import {
  signalMeta, signalContacts, getSynthesis, getAccountsByReadiness,
  getSignalContact, signalLeadId, getTriggerTimeline,
} from '../data/signalRoom';
import { getAbmSummary, getBlendedSpend } from '../data/propensity';
import {
  getLeadOutcomes, getCampaignForecasts, getUpcomingEvents, getAcceptanceTrend, getBillingPosition,
} from '../data/outcomes';
import { mockLeads } from '../mockData';
import { getAccountTeam } from '../data/mockClients';
import { formatDate, formatDateShort } from '../utils/formatDate';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatMoney as fmtMoney } from '../utils/format';

// ─── UNION dashboard ─────────────────────────────────────────────────────────
// One compact view of the whole relationship: what needs attention right now,
// the numbers, syndication campaign delivery, invoices & documents,
// programmatic, and the enrichment intelligence — everything taps through to
// its module. Dense by design; nothing here should need a second screen on
// desktop beyond the signals feed.


export default function UnionDashboard() {
  useDocumentTitle('Dashboard');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // ── Relationship data (same sources the module pages use) ──────────────────
  const client = unionClient;
  const campaigns = client?.campaigns ?? [];
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const leadsThisMonth = campaigns.reduce((sum, c) => sum + (c.leadsThisMonth ?? 0), 0);
  const outcomes = getLeadOutcomes();
  const forecasts = getCampaignForecasts();
  const atRiskForecast = forecasts.find(f => f.atRisk);
  const pendingLeads = mockLeads.filter(l => l.status === 'Pending Review').length;
  const upcoming = getUpcomingEvents();
  const acceptanceTrend = getAcceptanceTrend();
  const billing = getBillingPosition();
  const team = getAccountTeam('client_1');

  const myInvoices = mockInvoiceRecords.filter(i => i.clientId === UNION_CLIENT_ID);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const billableMtd = myInvoices.filter(i => (i.issueDate ?? '').startsWith(thisMonth)).reduce((s, i) => s + i.total, 0);
  const overdueInvoices = myInvoices.filter(i => i.stage === 'overdue');
  const dueInvoices = myInvoices.filter(i => i.stage === 'sent');
  const openTotal = [...overdueInvoices, ...dueInvoices].reduce((s, i) => s + i.total, 0);
  const topOverdue = overdueInvoices[0];
  const latestInvoices = [...overdueInvoices, ...dueInvoices].slice(0, 2);

  const pendingSignatures = mockJobCards.filter(
    c => c.clientCompany === currentUser?.company && c.type === 'client_signature' && c.stage === 'sent_for_signature',
  );
  const topSignature = pendingSignatures[0];

  // ── Programmatic + intelligence ────────────────────────────────────────────
  const abm = getAbmSummary();
  const abmSpend = abm.reduce((s, c) => s + c.spendToDate, 0);
  const abmEngaged = abm.reduce((s, c) => s + c.engagedAccounts, 0);
  const blended = getBlendedSpend();
  const blendedRoi = blended[blended.length - 1]?.blendedRoi ?? 0;

  const scores = signalContacts.map(c => getSynthesis(c.id)?.intentScore ?? c.signalScore);
  const avgIntent = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  const ranked = getAccountsByReadiness();
  const latestTrigger = getTriggerTimeline()[0];
  // First resolvable step per account — sequences can name contacts outside
  // the enriched sample, so resolve before ranking/numbering.
  const nextActions = ranked
    .map(({ account, insight }) => {
      const step = insight.sequence.find(s => getSignalContact(s.contactId));
      const person = step ? getSignalContact(step.contactId) : undefined;
      return person ? { account, person } : null;
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .slice(0, 3);
  const topAction = nextActions[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // ── Needs attention — the few things that matter right now ─────────────────
  const attention = [
    pendingLeads > 0 && {
      icon: ClipboardList, tone: 'var(--color-primary)', bg: 'var(--color-primary-tint)',
      label: 'Leads awaiting review',
      text: `${pendingLeads} lead${pendingLeads === 1 ? '' : 's'} pending your accept/reject`,
      go: () => navigate('/leads?status=Pending%20Review&data=all'),
    },
    topOverdue && {
      icon: AlertCircle, tone: 'var(--color-error)', bg: 'rgba(239,68,68,0.07)',
      label: 'Overdue invoice',
      text: `${topOverdue.invoiceNumber} · ${fmtMoney(topOverdue.total)}`,
      go: () => navigate('/invoices'),
    },
    topSignature && {
      icon: FilePenLine, tone: 'var(--color-warning)', bg: 'rgba(217,119,6,0.08)',
      label: 'Signature required',
      text: `${topSignature.id} · ${topSignature.campaignName}`,
      go: () => navigate('/documents'),
    },
    atRiskForecast && {
      icon: TrendingDown, tone: 'var(--color-warning)', bg: 'rgba(217,119,6,0.08)',
      label: 'Delivery at risk',
      text: `${atRiskForecast.campaign.name} · projected ${atRiskForecast.projected} of ${atRiskForecast.target}`,
      go: () => navigate(`/campaigns/${atRiskForecast.campaign.id}`),
    },
    latestTrigger && {
      icon: Megaphone, tone: 'var(--color-info)', bg: 'rgba(8,145,178,0.08)',
      label: `Fresh signal · ${latestTrigger.account.name}`,
      text: latestTrigger.text,
      go: () => navigate(`/leads/account/${latestTrigger.account.slug}`),
    },
    topAction && {
      icon: ListOrdered, tone: 'var(--color-primary)', bg: 'var(--color-primary-tint)',
      label: 'Next best action',
      text: `Engage ${topAction.person.name} · ${topAction.account.name}`,
      go: () => navigate(`/leads/${signalLeadId(topAction.person.id)}`),
    },
  ].filter((x): x is NonNullable<typeof x> => Boolean(x));

  const stats = [
    { icon: Users, value: leadsThisMonth.toLocaleString('en-US'), label: 'Leads this month' },
    { icon: Layers, value: String(activeCampaigns), label: 'Active campaigns' },
    { icon: Receipt, value: fmtMoney(billableMtd), label: 'Billable MTD' },
    { icon: AlertCircle, value: String(overdueInvoices.length + dueInvoices.length), label: 'Open invoices' },
    { icon: FilePenLine, value: String(pendingSignatures.length), label: 'Awaiting signature' },
    { icon: Gauge, value: String(avgIntent), label: 'Avg intent score' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto page-content space-y-4">
      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 select-none items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)' }}
          >
            {currentUser?.name?.slice(0, 1) ?? 'U'}
          </div>
          <div>
            <div className="text-[17px] font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
              {greeting}, {currentUser?.name}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {currentUser?.company} · {today}
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/programmatic')}
          className="btn-outline inline-flex min-h-[38px] items-center gap-1.5 px-3.5 text-sm font-semibold"
        >
          <Radar className="h-4 w-4" /> Programmatic ABM
        </button>
      </div>

      {/* Needs attention — highlighted, horizontal snap on phones */}
      {attention.length > 0 && (
        <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:px-0 md:pb-0 xl:grid-cols-4">
          {attention.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.go}
                className="flex min-w-[240px] flex-shrink-0 snap-start items-start gap-2.5 rounded-xl border p-3 text-left transition-all hover:shadow-md md:min-w-0"
                style={{ borderColor: 'var(--color-border-light)', background: item.bg }}
              >
                <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: item.tone }} />
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-wide" style={{ color: item.tone }}>
                    {item.label}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-[12.5px] font-medium leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                    {item.text}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Six-stat strip */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 stagger-children">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="kpi-card animate-slideInUp" style={{ padding: '11px 13px' }}>
              <div className="mb-1 flex items-center justify-between">
                <Icon className="kpi-card__icon" style={{ width: '14px', height: '14px' }} />
              </div>
              <div className="kpi-card__number" style={{ fontSize: '19px', marginBottom: '1px' }}>{stat.value}</div>
              <div className="kpi-card__label" style={{ fontSize: '10px', marginTop: 0 }}>{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Coming up — the next dated things in the relationship */}
      {upcoming.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border px-3 py-2"
          style={{ borderColor: 'var(--color-border-light)', background: 'var(--color-surface-raised)' }}
        >
          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
            <CalendarDays className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
            Coming up
          </span>
          {upcoming.map(ev => (
            <button
              key={`${ev.date}-${ev.label}`}
              onClick={() => navigate(ev.href)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] transition-colors hover:bg-[var(--color-primary-tint)]"
            >
              {ev.kind === 'delivery'
                ? <Truck className="h-3.5 w-3.5" style={{ color: 'var(--color-success)' }} />
                : <Receipt className="h-3.5 w-3.5" style={{ color: 'var(--color-warning)' }} />}
              <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{formatDateShort(ev.date)}</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{ev.label}</span>
              <span className="hidden sm:inline" style={{ color: 'var(--color-text-muted)' }}>· {ev.sub}</span>
            </button>
          ))}
        </div>
      )}

      {/* Relationship row: syndication · invoices & documents · billing · programmatic */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {/* Content syndication campaigns */}
        <div className="glass-card p-4">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              <Layers className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
              Content syndication
            </h3>
            <button onClick={() => navigate('/campaigns')} className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
              Campaigns <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2.5">
            {forecasts.map(({ campaign: c, target, delivered, projected, projectedPct, atRisk }) => {
              const pct = target > 0 ? Math.min(100, Math.round((delivered / target) * 100)) : 0;
              const active = c.status === 'active';
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/campaigns/${c.id}`)}
                  className="w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-primary-tint)]"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-[12.5px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{c.name}</span>
                    <span className="flex-shrink-0 text-[11px] font-semibold" style={{ color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                      {delivered.toLocaleString('en-US')} / {target.toLocaleString('en-US')}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--background-muted)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.status === 'completed' ? 'var(--color-text-muted)' : 'var(--color-primary)' }} />
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[10.5px] font-semibold">
                    <span style={{ color: !active ? 'var(--color-text-muted)' : atRisk ? 'var(--color-warning)' : 'var(--color-success)' }}>
                      {!active
                        ? 'Flight complete'
                        : atRisk
                          ? `At risk · projected ${projected.toLocaleString('en-US')} of ${target.toLocaleString('en-US')}`
                          : `On pace · ${projected.toLocaleString('en-US')} by ${formatDateShort(c.endDate ?? '')}`}
                    </span>
                    {active && (
                      <span style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{projectedPct}% of goal</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Invoices & documents */}
        <div className="glass-card p-4">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              <Receipt className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
              Invoices &amp; documents
            </h3>
            <button onClick={() => navigate('/invoices')} className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
              Invoices <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </button>
          </div>
          <div className="mb-2.5 flex items-baseline gap-2">
            <span className="text-xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>{fmtMoney(openTotal)}</span>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              outstanding · {overdueInvoices.length} overdue
            </span>
          </div>
          <div className="space-y-1.5">
            {latestInvoices.map(inv => (
              <button
                key={inv.id}
                onClick={() => navigate('/invoices')}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-primary-tint)]"
              >
                <span className="truncate text-[12.5px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{inv.invoiceNumber}</span>
                <span className="flex flex-shrink-0 items-center gap-2 text-[12px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{fmtMoney(inv.total)}</span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                    style={inv.stage === 'overdue'
                      ? { background: 'rgba(239,68,68,0.10)', color: 'var(--color-error)' }
                      : { background: 'rgba(217,119,6,0.10)', color: 'var(--color-warning)' }}
                  >
                    {inv.stage === 'overdue' ? 'Overdue' : `Due ${formatDateShort(inv.dueDate)}`}
                  </span>
                </span>
              </button>
            ))}
            <button
              onClick={() => navigate('/documents')}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-primary-tint)]"
            >
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                <FolderOpen className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                Documents
              </span>
              <span className="text-[11px] font-semibold" style={{ color: pendingSignatures.length ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                {pendingSignatures.length ? `${pendingSignatures.length} awaiting signature` : 'All signed'}
              </span>
            </button>
          </div>
        </div>

        {/* Billing position */}
        <div className="glass-card p-4">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              <Wallet className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
              Billing position
            </h3>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>FY 2026</span>
          </div>
          <div className="mb-1.5 flex items-baseline gap-2">
            <span className="text-xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>{fmtMoney(billing.billed)}</span>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              billed of {fmtMoney(billing.contracted)} contracted
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--background-muted)' }}>
            <div className="h-full rounded-full" style={{ width: `${billing.pct}%`, background: 'var(--color-primary)' }} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold">
            <span style={{ color: 'var(--color-text-secondary)' }}>{billing.pct}% of commitment</span>
            <span style={{ color: 'var(--color-success)' }}>{fmtMoney(billing.remaining)} remaining</span>
          </div>
          <p className="mt-2.5 text-[11px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Billed figures reconcile with your Invoices page to the dollar.
          </p>
        </div>

        {/* Programmatic mini */}
        <div className="glass-card p-4">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              <Radar className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
              Programmatic ABM
            </h3>
            <button onClick={() => navigate('/programmatic')} className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
              Open <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { value: fmtMoney(abmSpend), label: 'Spend to date' },
              { value: `${blendedRoi}×`, label: 'Blended ROI' },
              { value: String(abmEngaged), label: 'Accounts engaged' },
            ].map(x => (
              <div key={x.label} className="rounded-xl border p-2.5" style={{ borderColor: 'var(--color-border-light)' }}>
                <div className="text-[15px] font-extrabold leading-tight" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>{x.value}</div>
                <div className="mt-0.5 text-[10px] font-semibold leading-tight" style={{ color: 'var(--color-text-muted)' }}>{x.label}</div>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {abm.length} ABM campaigns give your syndication programs air cover — spend, ROI and engaged accounts read as one story.
          </p>
        </div>
      </div>

      {/* Outcomes + intelligence row */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {/* Lead outcomes — what happened after delivery */}
        <div className="glass-card p-4">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              <TrendingUp className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
              Lead outcomes
            </h3>
            <button onClick={() => navigate('/reports')} className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
              Reports <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </button>
          </div>
          <div className="mb-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>{fmtMoney(outcomes.pipelineValue)}</span>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              pipeline influenced · {fmtMoney(outcomes.wonValue)} closed-won
            </span>
          </div>
          <div className="space-y-1.5">
            {([
              ['Delivered', outcomes.delivered],
              ['Accepted', outcomes.accepted],
              ['Synced to CRM', outcomes.synced],
              ['Opportunities', outcomes.opportunities],
              ['Closed-won', outcomes.closedWon],
            ] as const).map(([label, value]) => {
              const pct = Math.max(2, Math.round((value / Math.max(outcomes.delivered, 1)) * 100));
              return (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-[92px] flex-shrink-0 text-[11.5px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    {label}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--background-muted)' }}>
                    <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--color-primary)' }} />
                  </span>
                  <span className="w-[78px] flex-shrink-0 text-right text-[11.5px] font-bold" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {value.toLocaleString('en-US')}
                    <span className="ml-1 font-semibold" style={{ color: 'var(--color-text-muted)' }}>{pct}%</span>
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2 border-t pt-2" style={{ borderColor: 'var(--color-border-light)' }}>
            <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              Acceptance rate · 6 mo
            </span>
            <span className="flex items-center gap-2">
              <svg width="90" height="24" viewBox="0 0 90 24" aria-hidden="true">
                <polyline
                  fill="none"
                  stroke="var(--color-success)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={acceptanceTrend
                    .map((pt, i) => `${4 + (i * 82) / (acceptanceTrend.length - 1)},${20 - ((pt.value - 94.5) / 3) * 16}`)
                    .join(' ')}
                />
              </svg>
              <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                {acceptanceTrend[acceptanceTrend.length - 1].value}%
              </span>
            </span>
          </div>
          <p className="mt-2 text-[10.5px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Reported back through your CRM sync · updated daily
          </p>
        </div>

        {/* Accounts & next actions */}
        <div className="glass-card p-4">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              <Sparkles className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
              Enriched accounts · {signalMeta.rows} of {signalMeta.sampleOf} contacts
            </h3>
            <button onClick={() => navigate('/leads')} className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
              Leads <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </button>
          </div>
          <div className="space-y-0.5">
            {ranked.slice(0, 4).map(({ account, insight }) => (
              <button
                key={account.slug}
                onClick={() => navigate(`/leads/account/${account.slug}`)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-primary-tint)]"
              >
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {account.name}
                </span>
                <span className="h-1.5 w-20 flex-shrink-0 overflow-hidden rounded-full" style={{ background: 'var(--background-muted)' }}>
                  <span className="block h-full rounded-full" style={{ width: `${insight.readiness}%`, background: 'var(--color-primary)' }} />
                </span>
                <span className="w-7 flex-shrink-0 text-right text-[13px] font-extrabold" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {insight.readiness}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-2.5 border-t pt-2.5" style={{ borderColor: 'var(--color-border-light)' }}>
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              <ListOrdered className="h-3.5 w-3.5" /> Next best actions
            </div>
            <div className="space-y-0.5">
              {nextActions.map(({ account, person }, index) => {
                return (
                  <button
                    key={account.slug}
                    onClick={() => navigate(`/leads/${signalLeadId(person.id)}`)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-[var(--color-primary-tint)]"
                  >
                    <span
                      className="flex h-4.5 w-4.5 min-h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white"
                      style={{ background: 'var(--color-primary)' }}
                    >
                      {index + 1}
                    </span>
                    <span className="truncate text-[12.5px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {person.name}
                      <span className="ml-1.5 text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>{account.name}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fresh signals */}
        <div className="glass-card p-4">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              <FileBarChart className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
              Fresh signals
            </h3>
            <button onClick={() => navigate('/leads')} className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
              Timeline <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </button>
          </div>
          <div className="space-y-1">
            {getTriggerTimeline().slice(0, 5).map(item => (
              <button
                key={`${item.account.slug}-${item.date}-${item.text.slice(0, 16)}`}
                onClick={() => navigate(`/leads/account/${item.account.slug}`)}
                className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-primary-tint)]"
              >
                <span className="mt-0.5 w-[46px] flex-shrink-0 text-[10.5px] font-semibold" style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatDateShort(item.date)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {item.account.name}
                    {item.kind && (
                      <span className="ml-1.5 rounded px-1 py-px text-[9.5px] font-bold uppercase" style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}>
                        {item.kind}
                      </span>
                    )}
                  </span>
                  <span className="line-clamp-1 block text-[11.5px]" style={{ color: 'var(--color-text-secondary)' }}>{item.text}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Your team — the humans on the account */}
      <div
        className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border px-4 py-3"
        style={{ borderColor: 'var(--color-border-light)', background: 'var(--color-surface-raised)' }}
      >
        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
          <Users className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
          Your team
        </span>
        {[
          { name: team?.manager.name ?? 'Brijesh Singh', role: 'Campaign manager', email: team?.manager.email ?? '' },
          { name: team?.backup.name ?? 'Arjun Patel', role: 'Backup manager', email: team?.backup.email ?? '' },
          { name: 'Praful Sanil', role: 'Operations', email: 'praful.sanil@datamaticsbpm.com' },
        ].map(member => (
          <a
            key={member.name}
            href={member.email ? `mailto:${member.email}` : undefined}
            className="inline-flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-[var(--color-primary-tint)]"
          >
            <span
              className="flex h-6 w-6 flex-shrink-0 select-none items-center justify-center rounded-full text-[10px] font-extrabold text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              {member.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </span>
            <span className="leading-tight">
              <span className="block text-[12px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{member.name}</span>
              <span className="block text-[10.5px]" style={{ color: 'var(--color-text-muted)' }}>{member.role}</span>
            </span>
          </a>
        ))}
        <span
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Next business review · {formatDate('2026-08-14')}
        </span>
      </div>
    </div>
  );
}
