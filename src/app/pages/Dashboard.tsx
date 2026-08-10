import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp, DollarSign, CheckCircle2, Layers, Plus, ChevronDown,
  BarChart2, Building2, Briefcase, Activity, UserRound, Calendar, FolderOpen,
  Check, Pause, Clock, X,
} from 'lucide-react';
import { getAccountTeam, allClients } from '../data/mockClients';
import { getPortalClient } from '../data/unionClient';
import { showFutureModules } from '../config/demo';
import { campaignTypeFor } from '../data/outcomes';
import { NewCampaignModal, CampaignFormData } from '../components/NewCampaignModal';
import { AccountTeam } from '../components/AccountTeam';
import { DataTable, type Column } from '../components/ui/DataTable';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getPersonPhoto } from '../data/personPhotos';

type Row = {
  id: string;
  name: string;
  advertiser: string;
  status: string;
  delivered: number;
  target: number;
  manager: string;
  endDate: string;
};

const DOTS = ['var(--color-primary)', 'var(--color-info)', 'var(--color-accent-purple)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-info)'];

// ─── Reporting window ────────────────────────────────────────────────────────
// One control drives the whole KPI strip. The previous dashboard gave each card
// its own day/week/month/year switcher, which put three identical controls on
// screen and let the cards disagree about the period they were showing.

type Period = '1d' | '1w' | '1m' | '1y';

const PERIODS: { key: Period; label: string; suffix: string }[] = [
  { key: '1d', label: 'Day', suffix: 'today' },
  { key: '1w', label: 'Week', suffix: 'this week' },
  { key: '1m', label: 'Month', suffix: 'this month' },
  { key: '1y', label: 'Year', suffix: 'this year' },
];

const PERIOD_MULTIPLIER: Record<Period, number> = { '1d': 0.033, '1w': 0.25, '1m': 1, '1y': 12 };

function PeriodSwitch({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div
      className="inline-flex rounded-xl border p-1"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-raised)' }}
      role="group"
      aria-label="Reporting period"
    >
      {PERIODS.map(p => {
        const on = p.key === value;
        return (
          <button
            key={p.key}
            onClick={() => onChange(p.key)}
            aria-pressed={on}
            className="rounded-lg px-3.5 py-1.5 text-[13px] font-bold transition-colors"
            style={{
              background: on ? 'var(--color-primary)' : 'transparent',
              color: on ? '#FFFFFF' : 'var(--color-text-muted)',
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── KPI tile — the mockup's compact stat: icon, delta, value, label ─────────
function Kpi({ icon: Icon, tone, toneBg, value, label, delta, deltaTone }: {
  icon: typeof TrendingUp; tone: string; toneBg: string; value: string; label: string;
  delta?: string; deltaTone?: string;
}) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-raised)' }}>
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: toneBg }}>
          <Icon className="h-[18px] w-[18px]" style={{ color: tone }} />
        </div>
        {delta && <span className="text-xs font-bold" style={{ color: deltaTone }}>{delta}</span>}
      </div>
      <div className="text-[27px] font-extrabold leading-none tracking-tight" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div className="mt-1.5 text-[13px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: typeof Check }> = {
    active: { label: 'Active', cls: 'ok', Icon: Check },
    paused: { label: 'Paused', cls: 'warn', Icon: Pause },
    completed: { label: 'Completed', cls: 'off', Icon: X },
    pending_approval: { label: 'Pending', cls: 'brand', Icon: Clock },
  };
  const s = map[status] ?? map.paused;
  const styles: Record<string, { bg: string; fg: string }> = {
    ok: { bg: 'var(--color-badge-active-bg)', fg: 'var(--color-badge-active-text)' },
    warn: { bg: 'var(--color-badge-paused-bg)', fg: 'var(--color-badge-paused-text)' },
    off: { bg: 'var(--color-badge-completed-bg)', fg: 'var(--color-badge-completed-text)' },
    brand: { bg: 'var(--color-primary-tint)', fg: 'var(--color-primary)' },
  };
  const st = styles[s.cls];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-bold" style={{ background: st.bg, color: st.fg }}>
      <s.Icon className="h-3 w-3" strokeWidth={3} /> {s.label}
    </span>
  );
}

export default function Dashboard() {
  useDocumentTitle('My Campaigns');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [period, setPeriod] = useState<Period>('1m');
  const periodMeta = PERIODS.find(p => p.key === period)!;

  const accountTeam = getAccountTeam('client_1');
  const isClientRole = currentUser?.role === 'client';
  // UNION preview only: campaigns are sold bundled, so the list chips each
  // campaign's type. Renuka and the TCC build keep the plain name.
  const showTypeChip = isClientRole && showFutureModules(currentUser);
  // Self-serve campaign creation is hidden in the UNION preview until leadership
  // has had the wholesale-vs-retail conversation. Hidden, not deleted — every
  // other persona still gets the button.
  const hideSelfServe = isClientRole && showFutureModules(currentUser);
  const tccClient = getPortalClient(currentUser);
  const managerName = accountTeam?.manager.name ?? 'Brijesh Singh';

  const rows: Row[] = useMemo(() => {
    const source = isClientRole
      ? (tccClient?.campaigns ?? [])
      : allClients.flatMap(c => c.campaigns);
    return source.map(c => ({
      id: c.id,
      name: c.name,
      advertiser: c.name.split(/[\s_]/)[0],
      status: c.status,
      delivered: c.delivered ?? 0,
      target: c.target ?? 0,
      manager: managerName,
      endDate: c.endDate ?? '—',
    }));
  }, [isClientRole, tccClient, managerName]);

  const shown = statusFilter === 'All' ? rows : rows.filter(r => r.status === statusFilter);

  // KPI figures
  const active = rows.filter(r => r.status === 'active').length;
  // Volume metrics scale with the selected window; the acceptance rate is a
  // ratio and the campaign count is a live total, so neither is multiplied.
  const monthlyLeads = rows.reduce((s, r) => s + r.delivered, 0);
  const leads = Math.round(monthlyLeads * PERIOD_MULTIPLIER[period]);
  const billable = leads * 12; // $12 CPL, matches the demo elsewhere
  const acceptance = 91;

  const columns: Column<Row>[] = [
    {
      key: 'name', header: 'Campaign', icon: BarChart2, primary: true,
      sortValue: r => r.name, text: r => r.name,
      render: r => (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{r.name}</span>
          {showTypeChip && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide"
              style={{ background: 'var(--color-gray-100)', color: 'var(--color-text-secondary)' }}
            >
              {campaignTypeFor(r.id)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'advertiser', header: 'Advertiser', icon: Building2,
      sortValue: r => r.advertiser, text: r => r.advertiser,
      render: r => (
        <span className="inline-flex items-center gap-2 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="h-2 w-2 flex-none rounded-full" style={{ background: DOTS[r.advertiser.charCodeAt(0) % DOTS.length] }} />
          {r.advertiser}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status', icon: Briefcase,
      sortValue: r => r.status, text: r => r.status,
      render: r => <StatusPill status={r.status} />,
    },
    {
      key: 'delivered', header: 'Delivered', icon: Activity, align: 'right',
      sortValue: r => r.delivered, text: r => `${r.delivered} / ${r.target}`,
      render: r => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{r.delivered.toLocaleString()}</span>
          <span style={{ color: 'var(--color-text-muted)' }}> / {r.target.toLocaleString()}</span>
        </span>
      ),
    },
    {
      key: 'pacing', header: 'Pacing', icon: Activity, sortable: false,
      render: r => {
        const pct = r.target ? Math.min(100, Math.round((r.delivered / r.target) * 100)) : 0;
        return (
          <div className="flex items-center gap-2.5">
            <div className="h-1.5 w-[74px] overflow-hidden rounded-full" style={{ background: 'var(--color-progress-track)' }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: r.status === 'completed' ? 'var(--color-text-muted)' : 'var(--color-progress)' }} />
            </div>
            <span className="text-[13px] font-bold" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums', minWidth: 34 }}>{pct}%</span>
          </div>
        );
      },
    },
    {
      key: 'manager', header: 'Manager', icon: UserRound, mobileHidden: true,
      sortValue: r => r.manager, text: r => r.manager,
      render: r => (
        <span className="inline-flex items-center gap-2.5">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[11px] font-extrabold text-white" style={{ background: 'var(--color-primary)' }}>
            {r.manager.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </span>
          <span style={{ color: 'var(--color-text-secondary)' }}>{r.manager}</span>
        </span>
      ),
    },
    {
      key: 'endDate', header: 'End date', icon: Calendar, align: 'right', mobileHidden: true,
      sortValue: r => r.endDate, text: r => r.endDate,
      render: r => <span style={{ color: 'var(--color-text-muted)' }}>{r.endDate}</span>,
    },
  ];

  const statusFilterControl = (
    <div className="relative">
      <select
        value={statusFilter}
        onChange={e => setStatusFilter(e.target.value)}
        className="cursor-pointer appearance-none rounded-xl border py-2.5 pl-3.5 pr-9 text-sm font-medium outline-none"
        style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
      >
        <option value="All">All status</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="paused">Paused</option>
        <option value="pending_approval">Pending</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
    </div>
  );

  return (
    <>
      <div className="mx-auto max-w-[1600px] page-content">
        {/* Header */}
        <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1.5 inline-flex items-center gap-2 text-[12.5px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              <span className="h-2 w-2 rounded-full" style={{ background: 'var(--color-primary)' }} />
              Client Portal &middot; {tccClient?.companyName ?? 'The Channel Company'}
            </div>
            <h1 className="text-[26px] font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Campaign Dashboard</h1>
            <p className="mt-1 text-[15px] font-medium" style={{ color: 'var(--color-text-muted)' }}>Every active campaign, pacing, delivery and billing in one place.</p>
          </div>
          {!hideSelfServe && (
            <button
              onClick={() => setIsNewCampaignModalOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors sm:w-auto"
              style={{ background: 'var(--color-primary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-dark)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-primary)')}
            >
              <Plus className="h-4 w-4" strokeWidth={2.6} /> New campaign
            </button>
          )}
        </div>

        {/* KPI strip */}
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
            Showing {periodMeta.suffix}
          </span>
          <PeriodSwitch value={period} onChange={setPeriod} />
        </div>
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi icon={DollarSign} tone="var(--color-primary)" toneBg="var(--color-primary-tint)" value={`$${(billable / 1000).toFixed(1)}K`} label={`Billable ${periodMeta.suffix}`} delta="▲ 8%" deltaTone="var(--color-success)" />
          <Kpi icon={TrendingUp} tone="var(--color-info)" toneBg="var(--color-info-bg)" value={leads.toLocaleString()} label="Leads delivered" delta="▲ 12%" deltaTone="var(--color-success)" />
          <Kpi icon={CheckCircle2} tone="var(--color-success)" toneBg="var(--color-success-bg)" value={`${acceptance}%`} label="Acceptance rate" delta="= stable" deltaTone="var(--color-text-muted)" />
          <Kpi icon={Layers} tone="var(--color-warning)" toneBg="var(--color-warning-bg)" value={String(rows.length)} label="Campaigns" delta={`${active} active`} deltaTone="var(--color-primary)" />
        </div>

        {/* Campaigns table */}
        <DataTable<Row>
          columns={columns}
          rows={shown}
          getRowId={r => r.id}
          onRowClick={r => navigate(`/campaigns/${r.id}`)}
          searchPlaceholder="Search campaigns…"
          toolbar={statusFilterControl}
          pageSize={12}
          countLabel={n => `${n} campaign${n === 1 ? '' : 's'}`}
          empty={{ icon: FolderOpen, title: 'No campaigns found', description: 'Nothing matches your search or filter yet.' }}
        />

        {/* Account team */}
        {accountTeam && (
          <div className="mt-6">
            <AccountTeam
              manager={{
                name: accountTeam.manager.name, role: accountTeam.manager.role, email: accountTeam.manager.email,
                initials: accountTeam.manager.name.split(' ').map(n => n[0]).join(''),
                photo: getPersonPhoto(accountTeam.manager.name),
              }}
              backup={{
                name: accountTeam.backup.name, role: accountTeam.backup.role, email: accountTeam.backup.email,
                initials: accountTeam.backup.name.split(' ').map(n => n[0]).join(''),
                photo: getPersonPhoto(accountTeam.backup.name),
              }}
            />
          </div>
        )}
      </div>

      <NewCampaignModal
        isOpen={isNewCampaignModalOpen}
        onClose={() => setIsNewCampaignModalOpen(false)}
        onSubmit={(_formData: CampaignFormData) => setIsNewCampaignModalOpen(false)}
      />
    </>
  );
}
