import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Users, Download, ShieldCheck, Building2,
  Check, X, Sparkles, CheckCircle2, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { mockLeads, type Lead } from '../mockData';
import { unionClient, renameLeadCampaign } from '../data/unionClient';
import { DataTable, type Column } from '../components/ui/DataTable';
import { SignalAccountsView } from '../components/signal/SignalAccountsView';
import { INTENT_META, RoleDot } from '../components/signal/signalMeta';
import {
  getSignalLeads, isSignalLeadId, signalContactFromLeadId, getSynthesis,
  getSignalAccount, signalMeta,
} from '../data/signalRoom';
import { useUnionPrefs } from '../config/unionPrefs';
import { CLIENT_DELIVERY_CHANNELS } from '../config/deliveryMethods';
import { exportLeadsToCSV } from '../utils/exportUtils';
import { formatDateShort } from '../utils/formatDate';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// ─── UNION Leads ─────────────────────────────────────────────────────────────
// The dense, intelligence-first Leads experience for the preview login: one
// compact header, a slim QA line, the Accounts lens (default) and one unified
// People list (campaign leads + enriched contacts). Every row opens a
// full-page lead view — no side panel.

type Lens = 'accounts' | 'people';

const STATUS_META: Record<string, { bg: string; color: string }> = {
  'Pending Review': { bg: 'rgba(217,119,6,0.10)', color: 'var(--color-warning)' },
  Accepted: { bg: 'rgba(5,150,105,0.10)', color: 'var(--color-success)' },
  Rejected: { bg: 'rgba(239,68,68,0.10)', color: 'var(--color-error)' },
  Contacted: { bg: 'rgba(8,145,178,0.10)', color: 'var(--color-info)' },
};

export default function UnionLeadsPage() {
  useDocumentTitle('Leads');
  const navigate = useNavigate();
  const { derivedIntel } = useUnionPrefs();

  // Enriched contacts and campaign leads in one list, highest score first so
  // the two datasets interleave naturally.
  const [leads, setLeads] = useState<Lead[]>(() =>
    [...getSignalLeads(), ...mockLeads.map(renameLeadCampaign)].sort((a, b) => b.leadScore - a.leadScore),
  );
  // Deep links (e.g. the dashboard's "leads awaiting review" chip) can preset
  // the filters; read once at mount. A filter deep link lands on the People
  // lens; otherwise Accounts is the default.
  const [searchParams] = useSearchParams();
  const [lens, setLens] = useState<Lens>(() =>
    searchParams.get('status') || searchParams.get('data') ? 'people' : 'accounts',
  );
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') ?? 'all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  // Enriched contacts are the product story — open on them; standard leads
  // are one select away.
  const [enrichFilter, setEnrichFilter] = useState(() => searchParams.get('data') ?? 'enriched');

  // Header stats + QA line (same sources the standard page uses)
  const clientData = unionClient;
  const deliveredToDate = clientData?.totalLeads ?? leads.length;
  const qaCaution = Math.round(deliveredToDate * 0.02);
  const qaInvalid = Math.round(deliveredToDate * 0.01);
  const qaTotal = deliveredToDate + qaCaution + qaInvalid;

  const stats = useMemo(() => {
    const scores = leads.map(l => l.leadScore);
    return {
      total: leads.length,
      pending: leads.filter(l => l.status === 'Pending Review').length,
      hot: leads.filter(l => l.leadScore >= 90).length,
      avg: Math.round(scores.reduce((s, v) => s + v, 0) / Math.max(scores.length, 1)),
    };
  }, [leads]);

  const campaigns = useMemo(() => {
    const seen = new Map<string, string>();
    leads.forEach(l => seen.set(l.campaignId, l.campaignName));
    return [...seen.entries()];
  }, [leads]);

  const filtered = useMemo(
    () => leads.filter(l =>
      (statusFilter === 'all' || l.status === statusFilter) &&
      (campaignFilter === 'all' || l.campaignId === campaignFilter) &&
      (enrichFilter === 'all' || (enrichFilter === 'enriched') === isSignalLeadId(l.id))),
    [leads, statusFilter, campaignFilter, enrichFilter],
  );

  const setStatus = (id: string, status: Lead['status']) => {
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, status } : l)));
    toast.success(status === 'Accepted' ? 'Lead accepted' : 'Lead rejected');
  };

  const columns: Column<Lead>[] = [
    {
      key: 'name', header: 'Lead', primary: true, widthClass: 'w-[32%] lg:w-[24%] xl:w-[22%]',
      sortValue: l => `${l.firstName} ${l.lastName}`, text: l => `${l.firstName} ${l.lastName} ${l.email}`,
      render: l => {
        const contact = isSignalLeadId(l.id) ? signalContactFromLeadId(l.id) : undefined;
        const committee = contact ? (getSignalAccount(contact.companySlug)?.contactIds.length ?? 1) : 1;
        return (
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {contact && <RoleDot roleClass={contact.roleClass} />}
              <span className="truncate font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {l.firstName} {l.lastName}
              </span>
              {committee > 1 && (
                <span
                  className="flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ background: 'var(--background-muted)', color: 'var(--color-text-secondary)' }}
                  title={`${committee} contacts on this buying committee`}
                >
                  +{committee - 1}
                </span>
              )}
            </div>
            <div className="truncate text-xs" style={{ color: 'var(--color-text-muted)' }}>{l.title}</div>
          </div>
        );
      },
    },
    {
      key: 'company', header: 'Company', widthClass: 'w-[26%] lg:w-[17%] xl:w-[14%]',
      sortValue: l => l.company, text: l => `${l.company} ${l.industry}`,
      render: l => (
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{l.company}</div>
          <div className="truncate text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{l.industry}</div>
        </div>
      ),
    },
    {
      key: 'campaign', header: 'Campaign', mobileHidden: true,
      widthClass: 'hidden xl:table-cell xl:w-[12%]',
      sortValue: l => l.campaignName, text: l => l.campaignName,
      render: l => (
        <span className="block truncate text-[12.5px]" style={{ color: 'var(--color-text-secondary)' }} title={l.campaignName}>
          {l.campaignName}
        </span>
      ),
    },
    {
      key: 'enrichment', header: 'Data', widthClass: 'hidden lg:table-cell lg:w-[15%] xl:w-[13.5%]',
      sortValue: l => {
        const synthesis = isSignalLeadId(l.id) ? getSynthesis(signalContactFromLeadId(l.id)!.id) : undefined;
        if (!synthesis) return '1';
        return derivedIntel ? `0-${synthesis.intentType}` : '0';
      },
      text: l => {
        const synthesis = isSignalLeadId(l.id) ? getSynthesis(signalContactFromLeadId(l.id)!.id) : undefined;
        if (!synthesis) return 'Standard';
        return derivedIntel ? `Enriched ${INTENT_META[synthesis.intentType].label}` : 'Enriched';
      },
      render: l => {
        const synthesis = isSignalLeadId(l.id) ? getSynthesis(signalContactFromLeadId(l.id)!.id) : undefined;
        if (!synthesis) {
          return <span className="text-[11.5px] font-medium" style={{ color: 'var(--color-text-muted)' }}>Standard</span>;
        }
        if (!derivedIntel) {
          return (
            <span
              className="inline-flex max-w-full items-center gap-1 overflow-hidden rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}
              title="Enriched — opens the full briefing: buying committee, talking points, account signals."
            >
              <Sparkles className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">Enriched</span>
            </span>
          );
        }
        const meta = INTENT_META[synthesis.intentType];
        return (
          <span
            className="inline-flex max-w-full items-center gap-1 overflow-hidden rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: meta.bg, color: meta.color }}
            title={`Enriched — ${meta.label} signal. Opens the full briefing: synthesis, buying committee, account signals.`}
          >
            <Sparkles className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{meta.label}</span>
          </span>
        );
      },
    },
    {
      key: 'score', header: 'Score', align: 'right', widthClass: 'w-[20%] lg:w-[13%] xl:w-[10.5%]',
      sortValue: l => l.leadScore, text: l => String(l.leadScore),
      render: l => (
        <div className="flex items-center justify-end gap-2">
          <div className="h-1.5 w-8 overflow-hidden rounded-full" style={{ background: 'var(--color-border)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${l.leadScore}%`, background: l.leadScore >= 85 ? 'var(--color-primary)' : 'var(--color-chart-2)' }}
            />
          </div>
          <span className="w-6 text-right text-[13px] font-extrabold" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {l.leadScore}
          </span>
        </div>
      ),
      mobileRender: l => <span className="font-bold">{l.leadScore} / 100</span>,
    },
    {
      key: 'status', header: 'Status', widthClass: 'w-[22%] lg:w-[17%] xl:w-[19%]',
      sortValue: l => l.status, text: l => l.status,
      render: l => {
        const meta = STATUS_META[l.status] ?? STATUS_META.Contacted;
        return (
          <span className="inline-flex flex-wrap items-center gap-1.5" onClick={e => e.stopPropagation()}>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: meta.bg, color: meta.color }}>
              {l.status}
            </span>
            {l.status === 'Pending Review' && (
              <span className="inline-flex gap-0.5">
                <button
                  onClick={() => setStatus(l.id, 'Accepted')}
                  className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-[var(--color-success)]/10"
                  title="Accept lead"
                >
                  <Check className="h-3.5 w-3.5" style={{ color: 'var(--color-success)' }} />
                </button>
                <button
                  onClick={() => setStatus(l.id, 'Rejected')}
                  className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-[var(--color-error)]/10"
                  title="Reject lead"
                >
                  <X className="h-3.5 w-3.5" style={{ color: 'var(--color-error)' }} />
                </button>
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: 'date', header: 'Date', align: 'right', mobileHidden: true,
      widthClass: 'hidden lg:table-cell lg:w-[14%] xl:w-[9%]',
      sortValue: l => l.deliveryDate, text: l => l.deliveryDate,
      render: l => (
        <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>{formatDateShort(l.deliveryDate)}</span>
      ),
    },
  ];

  const selectCls = 'input-base h-[38px] px-3 text-sm';

  return (
    <div className="max-w-[1600px] mx-auto page-content space-y-3">
      {/* Header — one row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight leading-tight" style={{ color: 'var(--color-text-primary)' }}>
            Leads
          </h1>
          <p className="text-[12.5px]" style={{ color: 'var(--color-text-secondary)' }}>
            {stats.total} leads · {stats.pending} pending review · {stats.hot} hot · {stats.avg} avg signal ·{' '}
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              {signalMeta.rows} enriched of {signalMeta.sampleOf}
            </span>
          </p>
        </div>
        <button
          onClick={() => { exportLeadsToCSV(filtered); toast.success('Leads exported'); }}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* How leads reach you. CSV is live today; the API and CRM push are
          deliberately non-interactive — they are on the roadmap, not in the
          September build, and a working connect flow here would overstate it. */}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-3 py-2"
        style={{ borderColor: 'var(--color-border-light)', background: 'var(--color-surface-raised)' }}
        data-testid="delivery-channels"
      >
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
          Delivery
        </span>
        {CLIENT_DELIVERY_CHANNELS.map(channel => {
          const live = channel.status === 'available';
          return (
            <span key={channel.key} className="inline-flex items-center gap-1.5">
              {live
                ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                : <Clock className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />}
              <span className="text-[12px] font-semibold" style={{ color: live ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                {channel.label}
              </span>
              <span className="hidden text-[11.5px] sm:inline" style={{ color: 'var(--color-text-muted)' }}>
                {channel.blurb}
              </span>
              {!live && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                  style={{ background: 'var(--background-muted)', color: 'var(--color-text-muted)' }}
                >
                  Coming next
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Slim automated-QA line — people-level QA, so it only renders on the
          People lens; on Accounts it's noise. */}
      {lens === 'people' && (
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border px-3 py-2"
        style={{ borderColor: 'var(--color-border-light)', background: 'var(--color-surface-raised)' }}
      >
        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
          <ShieldCheck className="h-4 w-4" style={{ color: 'var(--color-success)' }} />
          Automated QA
        </span>
        <span className="flex h-1.5 w-28 overflow-hidden rounded-full">
          <span style={{ width: '97%', background: 'var(--color-success)' }} />
          <span style={{ width: '2%', background: 'var(--color-warning)' }} />
          <span style={{ width: '1%', background: 'var(--color-error)' }} />
        </span>
        <span className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
          <b style={{ color: 'var(--color-success)' }}>{deliveredToDate.toLocaleString('en-US')}</b> valid (97%) ·{' '}
          <b style={{ color: 'var(--color-warning)' }}>{qaCaution}</b> caution ·{' '}
          <b style={{ color: 'var(--color-error)' }}>{qaInvalid}</b> invalid of {qaTotal.toLocaleString('en-US')} processed · accepted leads sync to your CRM in real time
        </span>
      </div>
      )}

      {/* Lens toggle */}
      <div
        className="grid grid-cols-2 gap-1 rounded-xl p-1 sm:inline-grid sm:min-w-[260px]"
        style={{ background: 'var(--background-muted)' }}
        role="tablist"
      >
        {([['accounts', 'Accounts', Building2], ['people', 'People', Users]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            role="tab"
            aria-selected={lens === key}
            onClick={() => setLens(key)}
            className={`flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors ${
              lens === key ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {lens === 'accounts' && <SignalAccountsView />}

      {lens === 'people' && (
        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={l => l.id}
          onRowClick={l => navigate(`/leads/${l.id}`)}
          searchPlaceholder="Search name, company, email…"
          pageSize={14}
          layout="fixed"
          countLabel={n => `${n} shown`}
          toolbar={
            <div className="flex gap-2">
              <select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)} className={selectCls}>
                <option value="all">All campaigns</option>
                {campaigns.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectCls}>
                <option value="all">All statuses</option>
                {['Pending Review', 'Accepted', 'Contacted', 'Rejected'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={enrichFilter} onChange={e => setEnrichFilter(e.target.value)} className={selectCls}>
                <option value="all">All data</option>
                <option value="enriched">Enriched only</option>
                <option value="standard">Standard only</option>
              </select>
            </div>
          }
          empty={{ icon: Users, title: 'No leads match', description: 'Try widening a filter or clearing the search.' }}
        />
      )}
    </div>
  );
}
