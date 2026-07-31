import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Eye, ChevronsUpDown } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { MobileCardList } from '../components/ui/MobileCardList';
import { allClients } from '../data/mockClients';

type Period = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

// Rough period scaling for the mock — MONTH is the base truth from client data.
const PERIOD_FACTOR: Record<Period, number> = { DAY: 0.045, WEEK: 0.24, MONTH: 1, YEAR: 9.2 };

export default function OpsOverviewPage() {
  useDocumentTitle('Operations Dashboard');
  const navigate = useNavigate();

  const [period, setPeriod] = useState<Period>('MONTH');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [sortAsc, setSortAsc] = useState(true);

  // ── Upload status roll-up from client data ──
  const totals = useMemo(() => {
    const monthLeads = allClients.reduce((s, c) => s + c.leadsThisMonth, 0);
    const delivered = Math.round(monthLeads * 0.875);
    const valid = Math.round(monthLeads * 0.881);
    const failed = monthLeads - delivered;
    return { monthLeads, delivered, valid, failed };
  }, []);

  const filteredTotal = useMemo(() => {
    const base = companyFilter === 'All'
      ? totals.monthLeads
      : allClients.find((c) => c.id === companyFilter)?.leadsThisMonth ?? 0;
    return Math.round(base * PERIOD_FACTOR[period]);
  }, [companyFilter, period, totals.monthLeads]);

  const clients = useMemo(() => {
    const rows = allClients.map((c) => ({
      id: c.id,
      name: c.companyName,
      source: c.leadAcceptanceMethod === 'convertr' ? 'convertr' : c.leadAcceptanceMethod,
      total: c.campaigns.length,
      active: c.campaigns.filter((cp) => cp.status === 'active').length,
      leadsDelivered: c.totalLeads,
      thisMonth: c.leadsThisMonth,
      manager: c.campaignManager,
    }));
    return rows.sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
  }, [sortAsc]);

  const statusCards = [
    { label: 'Delivered', value: totals.delivered, icon: CheckCircle2, color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
    { label: 'Valid', value: totals.valid, icon: Clock, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
    { label: 'Failed', value: totals.failed, icon: AlertCircle, color: 'var(--color-error)', bg: 'var(--color-error-bg)' },
  ];

  return (
    <>
      <div className="max-w-[1440px] mx-auto page-content animate-fadeIn">
        {/* Header — red accent bar, matching production */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div style={{ width: '4px', height: '28px', background: 'var(--color-primary)', borderRadius: '2px' }} />
            <h1 style={{ color: 'var(--color-text-primary)', margin: 0 }}>Operations Dashboard</h1>
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
            Lead upload management and client oversight
          </p>
        </div>

        {/* Section eyebrow */}
        <div className="flex items-center gap-3 mb-3">
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
            Lead Upload Status
          </span>
          <div className="flex-1" style={{ height: '1px', background: 'var(--color-border-light)' }} />
        </div>

        {/* Status cards + Total Leads card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 stagger-children">
          {statusCards.map(({ label, value, icon: Icon, color, bg }, i) => (
            <div key={label} className="kpi-card animate-slideInUp" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center mb-5" style={{ background: bg }}>
                <Icon className="w-4.5 h-4.5" style={{ color, width: '18px', height: '18px' }} />
              </div>
              <div className="kpi-card__number"><AnimatedCounter value={value} /></div>
              <div className="kpi-card__label">{label}</div>
            </div>
          ))}

          {/* Total Leads — period toggle + company filter */}
          <div className="kpi-card animate-slideInUp" style={{ animationDelay: '210ms' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="kpi-card__label" style={{ marginTop: 0 }}>Total Leads</span>
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <div className="flex gap-1 mb-3">
              {(['DAY', 'WEEK', 'MONTH', 'YEAR'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="px-2 py-1 rounded-full transition-colors"
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    background: period === p ? 'var(--color-primary)' : 'transparent',
                    color: period === p ? '#fff' : 'var(--color-text-muted)',
                    border: period === p ? 'none' : '1px solid var(--color-border-light)',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="input-base w-full mb-3"
              style={{ padding: '7px 10px', fontSize: '13px' }}
            >
              <option value="All">All Companies</option>
              {allClients.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
            <div className="flex items-baseline gap-2">
              <div className="kpi-card__number"><AnimatedCounter value={filteredTotal} /></div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-success)' }}>88% valid</span>
            </div>
          </div>
        </div>

        {/* Clients & Campaigns table */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Clients &amp; Campaigns</h2>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full" style={{ fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--color-main-bg)' }}>
                  <th className="text-left px-5 py-3">
                    <button
                      onClick={() => setSortAsc((v) => !v)}
                      className="flex items-center gap-1"
                      style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}
                    >
                      Client <ChevronsUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  {['Campaigns', 'Leads Delivered', 'This Month', 'Manager', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--color-border-light)' }}>
                    <td className="px-5 py-3">
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{c.source}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div style={{ color: 'var(--color-text-primary)' }}>{c.total} total</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{c.active} active</div>
                    </td>
                    <td className="px-5 py-3" style={{ color: 'var(--color-text-primary)' }}>{c.leadsDelivered.toLocaleString('en-US')}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--color-text-primary)' }}>{c.thisMonth.toLocaleString('en-US')}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--color-text-primary)' }}>{c.manager}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => navigate('/internal/campaigns')}
                        aria-label={`View ${c.name} campaigns`}
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <MobileCardList
            className="md:hidden p-4"
            rows={clients}
            getRowId={(c) => c.id}
            title={(c) => c.name}
            badge={(c) => (
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{c.source}</span>
            )}
            fields={[
              { label: 'Campaigns', value: (c) => `${c.total} total · ${c.active} active` },
              { label: 'Leads Delivered', value: (c) => c.leadsDelivered.toLocaleString('en-US') },
              { label: 'This Month', value: (c) => c.thisMonth.toLocaleString('en-US') },
              { label: 'Manager', value: (c) => c.manager, hideWhenEmpty: true },
            ]}
            onClick={() => navigate('/internal/campaigns')}
            emptyMessage="No clients to show."
          />
        </div>
      </div>
    </>
  );
}
