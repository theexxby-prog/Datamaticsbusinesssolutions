import { useMemo, useState } from 'react';
import {
  Building2, Power, Filter, UsersRound, Search, Plus, Eye, Pencil, Trash2, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { allClients } from '../data/mockClients';
import { mockTeamMembers } from '../mockData';
import { MobileCardList } from '../components/ui/MobileCardList';

// Production parity: Admin Management = client onboarding, Convertr configuration,
// and manager mapping (replaces the old Team Management + Client Assignment split).

interface AdminClientRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  campaignManager: string;
  opsManager: string;
  backupManager: string;
  passwordSet: boolean;
  status: 'Active' | 'Paused' | 'Completed';
  updated: string;
  analyticsVisible: boolean;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Same pill markup the tables render inline — shared by the mobile card views.
function StatusPill({ status }: { status: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full"
      style={{
        fontSize: '11px',
        fontWeight: 600,
        background: status === 'Active' ? 'var(--color-badge-active-bg, rgba(5,150,105,0.12))' : 'var(--color-badge-paused-bg, rgba(217,119,6,0.12))',
        color: status === 'Active' ? 'var(--color-badge-active-text)' : 'var(--color-badge-paused-text)',
      }}
    >
      {status}
    </span>
  );
}

export default function AdminManagementPage() {
  useDocumentTitle('Admin Management');

  const [activeTab, setActiveTab] = useState<'clients' | 'team'>('clients');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [teamCompanyFilter, setTeamCompanyFilter] = useState('All');

  const [rows, setRows] = useState<AdminClientRow[]>(() =>
    allClients.map((c) => ({
      id: c.id,
      name: c.companyName,
      slug: `${c.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${1781082500000 + Math.floor(Math.random() * 400000)}`,
      type: c.leadAcceptanceMethod === 'convertr' ? 'Convertr' : 'Manual',
      campaignManager: c.campaignManager,
      opsManager: 'Praful Sanil',
      backupManager: c.backupManager,
      passwordSet: true,
      status: c.status === 'active' ? 'Active' : c.status === 'paused' ? 'Paused' : 'Completed',
      updated: c.lastActivity,
      analyticsVisible: true,
    })),
  );

  const filteredRows = useMemo(() => {
    let r = rows;
    if (typeFilter !== 'All') r = r.filter((x) => x.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((x) => x.name.toLowerCase().includes(q) || x.slug.includes(q));
    }
    return r;
  }, [rows, typeFilter, search]);

  const teamMembers = useMemo(() => {
    if (teamCompanyFilter === 'All') return mockTeamMembers;
    return mockTeamMembers.filter((m) => m.assignedClients.includes(teamCompanyFilter));
  }, [teamCompanyFilter]);

  const toggleAnalytics = (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, analyticsVisible: !r.analyticsVisible } : r)));
  };

  const togglePower = (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: r.status === 'Active' ? 'Paused' : 'Active' } : r)));
    toast.success('Client status updated');
  };

  const stats = [
    { label: 'Clients', value: rows.length, icon: Building2, color: 'var(--color-primary)' },
    { label: 'Active Clients', value: rows.filter((r) => r.status === 'Active').length, icon: Power, color: 'var(--color-success)' },
    { label: 'Convertr Clients', value: rows.filter((r) => r.type === 'Convertr').length, icon: Filter, color: 'var(--color-info)' },
  ];

  return (
    <>
      <div className="max-w-[1440px] mx-auto page-content animate-fadeIn">
        {/* Header */}
        <div className="mb-4">
          <h1 style={{ color: 'var(--color-text-primary)', marginBottom: '4px' }}>Admin Management</h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Client onboarding, Convertr configuration, and manager mapping.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 stagger-children">
          {stats.map(({ label, value, icon: Icon, color }, i) => (
            <div key={label} className="kpi-card animate-slideInUp" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="flex items-center justify-between mb-4">
                <Icon className="w-5 h-5" style={{ color }} />
                <span className="kpi-card__label" style={{ marginTop: 0 }}>{label}</span>
              </div>
              <div className="kpi-card__number"><span>{value}</span></div>
            </div>
          ))}
          {/* Team Members card with company filter */}
          <div className="kpi-card animate-slideInUp" style={{ animationDelay: '210ms' }}>
            <div className="flex items-center justify-between mb-3">
              <UsersRound className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
              <span className="kpi-card__label" style={{ marginTop: 0 }}>Team Members</span>
            </div>
            <select
              value={teamCompanyFilter}
              onChange={(e) => setTeamCompanyFilter(e.target.value)}
              className="input-base w-full mb-3"
              style={{ padding: '7px 10px', fontSize: '13px' }}
            >
              <option value="All">All Companies</option>
              {rows.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <div className="kpi-card__number"><span>{teamMembers.filter((m) => m.role !== 'Operations Manager').length}</span></div>
          </div>
        </div>

        {/* Tabs + Add Client */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex gap-1 p-1 rounded-full" style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}>
            {([
              { key: 'clients', label: 'Clients' },
              { key: 'team', label: 'Team Members' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="px-4 py-2 rounded-full transition-colors"
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  background: activeTab === key ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === key ? '#fff' : 'var(--color-text-secondary)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {activeTab === 'clients' && (
            <button onClick={() => toast.info('Client onboarding flow — coming with backend wiring')} className="btn-primary px-4 py-2 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Client
            </button>
          )}
        </div>

        {activeTab === 'clients' ? (
          <div className="glass-card overflow-hidden">
            {/* Search + type filter */}
            <div className="p-4 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search clients"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-base w-full pl-10"
                  style={{ padding: '10px 14px 10px 38px', fontSize: '14px' }}
                />
              </div>
              <div className="relative md:w-40">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="input-base w-full appearance-none"
                  style={{ padding: '10px 14px', fontSize: '14px' }}
                >
                  <option value="All">All Types</option>
                  <option value="Convertr">Convertr</option>
                  <option value="Manual">Manual</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full" style={{ fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderTop: '1px solid var(--color-border-light)', borderBottom: '1px solid var(--color-border-light)' }}>
                    {['Client', 'Type', 'Campaign Manager', 'Ops Manager', 'Backup Manager', 'Client Password', 'Status', 'Updated', 'Analytics', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => (
                    <tr key={r.id} style={{ borderTop: '1px solid var(--color-border-light)' }}>
                      <td className="px-4 py-3">
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{r.slug}</div>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-text-primary)' }}>{r.type}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-text-primary)' }}>{r.campaignManager}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-text-primary)' }}>{r.opsManager}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-text-primary)' }}>{r.backupManager}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-text-primary)' }}>{r.passwordSet ? 'Set' : '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full"
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            background: r.status === 'Active' ? 'var(--color-badge-active-bg, rgba(5,150,105,0.12))' : 'var(--color-badge-paused-bg, rgba(217,119,6,0.12))',
                            color: r.status === 'Active' ? 'var(--color-badge-active-text, var(--color-badge-active-text))' : 'var(--color-badge-paused-text, var(--color-badge-paused-text))',
                          }}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>{fmtDate(r.updated)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleAnalytics(r.id)} className="flex items-center gap-2" aria-label="Toggle analytics visibility">
                          <span
                            className="relative inline-block w-9 h-5 rounded-full transition-colors"
                            style={{ background: r.analyticsVisible ? 'var(--color-primary)' : 'var(--color-border)' }}
                          >
                            <span
                              className="absolute top-0.5 w-4 h-4 rounded-full bg-[var(--color-surface-raised)] transition-all"
                              style={{ left: r.analyticsVisible ? '18px' : '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                            />
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {r.analyticsVisible ? 'Visible' : 'Hidden'}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3" style={{ color: 'var(--color-text-muted)' }}>
                          <button aria-label="View client" onClick={() => toast.info(`${r.name} — client detail coming with backend wiring`)}><Eye className="w-4 h-4" /></button>
                          <button aria-label="Edit client" onClick={() => toast.info(`${r.name} — edit flow coming with backend wiring`)}><Pencil className="w-4 h-4" /></button>
                          <button aria-label="Toggle client status" onClick={() => togglePower(r.id)}><Power className="w-4 h-4" /></button>
                          <button aria-label="Delete client" onClick={() => toast.error('Delete is disabled in the demo build')} style={{ color: 'var(--color-error)' }}><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <MobileCardList
              className="md:hidden p-4"
              rows={filteredRows}
              getRowId={(r) => r.id}
              title={(r) => r.name}
              badge={(r) => <StatusPill status={r.status} />}
              fields={[
                { label: 'Type', value: (r) => r.type },
                { label: 'Campaign Manager', value: (r) => r.campaignManager },
                { label: 'Backup Manager', value: (r) => r.backupManager },
                { label: 'Updated', value: (r) => fmtDate(r.updated) },
                {
                  label: 'Analytics',
                  value: (r) => (
                    <button onClick={() => toggleAnalytics(r.id)} className="flex items-center gap-2 py-2" aria-label="Toggle analytics visibility">
                      <span
                        className="relative inline-block w-9 h-5 rounded-full transition-colors"
                        style={{ background: r.analyticsVisible ? 'var(--color-primary)' : 'var(--color-border)' }}
                      >
                        <span
                          className="absolute top-0.5 w-4 h-4 rounded-full bg-[var(--color-surface-raised)] transition-all"
                          style={{ left: r.analyticsVisible ? '18px' : '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                        />
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {r.analyticsVisible ? 'Visible' : 'Hidden'}
                      </span>
                    </button>
                  ),
                },
              ]}
              actions={(r) => (
                <>
                  <button
                    aria-label="View client"
                    onClick={() => toast.info(`${r.name} — client detail coming with backend wiring`)}
                    className="w-11 h-11 flex items-center justify-center rounded-lg"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    aria-label="Edit client"
                    onClick={() => toast.info(`${r.name} — edit flow coming with backend wiring`)}
                    className="w-11 h-11 flex items-center justify-center rounded-lg"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    aria-label="Toggle client status"
                    onClick={() => togglePower(r.id)}
                    className="w-11 h-11 flex items-center justify-center rounded-lg"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    aria-label="Delete client"
                    onClick={() => toast.error('Delete is disabled in the demo build')}
                    className="w-11 h-11 flex items-center justify-center rounded-lg"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-error)' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              emptyMessage="No clients match your search."
            />

            <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--color-border-light)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              <span>Page 1 of 1</span>
              <div className="flex gap-4">
                <button style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Previous</button>
                <button style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Next</button>
              </div>
            </div>
          </div>
        ) : (
          /* Team Members tab */
          <div className="glass-card overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full" style={{ fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    {['Member', 'Role', 'Assigned Clients', 'Active Campaigns', 'Status'].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((m) => (
                    <tr key={m.id} style={{ borderTop: '1px solid var(--color-border-light)' }}>
                      <td className="px-5 py-3">
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{m.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{m.email}</div>
                      </td>
                      <td className="px-5 py-3" style={{ color: 'var(--color-text-primary)' }}>{m.role}</td>
                      <td className="px-5 py-3" style={{ color: 'var(--color-text-primary)' }}>{m.assignedClients.join(', ')}</td>
                      <td className="px-5 py-3" style={{ color: 'var(--color-text-primary)' }}>{m.activeCampaigns}</td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full"
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            background: m.status === 'Active' ? 'var(--color-badge-active-bg, rgba(5,150,105,0.12))' : 'var(--color-badge-paused-bg, rgba(217,119,6,0.12))',
                            color: m.status === 'Active' ? 'var(--color-badge-active-text, var(--color-badge-active-text))' : 'var(--color-badge-paused-text, var(--color-badge-paused-text))',
                          }}
                        >
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <MobileCardList
              className="md:hidden p-4"
              rows={teamMembers}
              getRowId={(m) => m.id}
              title={(m) => m.name}
              badge={(m) => <StatusPill status={m.status} />}
              fields={[
                { label: 'Email', value: (m) => <span className="break-all">{m.email}</span> },
                { label: 'Role', value: (m) => m.role },
                { label: 'Assigned Clients', value: (m) => m.assignedClients.join(', ') },
                { label: 'Active Campaigns', value: (m) => m.activeCampaigns },
              ]}
              emptyMessage="No team members for this company."
            />
          </div>
        )}
      </div>
    </>
  );
}
