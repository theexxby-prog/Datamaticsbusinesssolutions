import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Eye, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { MobileCardList } from '../components/ui/MobileCardList';
import { allClients, type Campaign } from '../data/mockClients';
import { formatDate } from '../utils/formatDate';

type FlatCampaign = Campaign & { clientId: string; clientName: string; manager: string };


const statusLabel: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Ended',
  pending_approval: 'Pending',
};

export default function InternalCampaignList() {
  useDocumentTitle('All Campaigns');
  const navigate = useNavigate();

  const [clientFilter, setClientFilter] = useState(allClients[0]?.id ?? 'All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortAsc, setSortAsc] = useState(true);

  const allCampaigns: FlatCampaign[] = useMemo(
    () => allClients.flatMap((c) => c.campaigns.map((cp) => ({ ...cp, clientId: c.id, clientName: c.companyName, manager: c.campaignManager }))),
    [],
  );

  const filtered = useMemo(() => {
    let rows = allCampaigns;
    if (clientFilter !== 'All') rows = rows.filter((c) => c.clientId === clientFilter);
    if (statusFilter !== 'All') rows = rows.filter((c) => statusLabel[c.status] === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
    }
    return [...rows].sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
  }, [allCampaigns, clientFilter, statusFilter, searchQuery, sortAsc]);

  return (
    <>
      <div className="max-w-[1440px] mx-auto page-content animate-fadeIn">
        {/* Header */}
        <div className="mb-4">
          <h1 style={{ color: 'var(--color-text-primary)', marginBottom: '4px' }}>All Campaigns</h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {allCampaigns.length.toLocaleString('en-US')} campaigns found
          </p>
        </div>

        {/* Select Client */}
        <div className="mb-4 max-w-md">
          <label htmlFor="client-select" className="block" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
            Select Client
          </label>
          <div className="relative">
            <select
              id="client-select"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full appearance-none bg-[var(--color-surface-raised)]"
              style={{
                padding: '11px 14px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                border: '1.5px solid var(--color-primary)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <option value="All">All Clients</option>
              {allClients.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-primary)' }} />
          </div>
        </div>

        {/* Search + status */}
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search campaigns by name or ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base w-full pl-10"
              style={{ padding: '11px 14px 11px 38px', fontSize: '14px' }}
            />
          </div>
          <div className="relative md:w-64">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-base w-full appearance-none"
              style={{ padding: '11px 14px', fontSize: '14px' }}
            >
              {['All Status', 'Active', 'Ended', 'Paused', 'Pending'].map((sLbl) => (
                <option key={sLbl} value={sLbl === 'All Status' ? 'All' : sLbl}>{sLbl}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full" style={{ fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <th className="text-left px-5 py-3.5">
                    <button
                      onClick={() => setSortAsc((v) => !v)}
                      className="flex items-center gap-1"
                      style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--color-primary)', textTransform: 'uppercase' }}
                    >
                      Campaign <ChevronsUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  {['Status', 'Progress', 'Total Leads', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const target = c.target ?? c.goalLeads ?? 0;
                  const delivered = c.delivered ?? c.deliveredLeads ?? 0;
                  const pct = target > 0 ? Math.round((delivered / target) * 100) : 0;
                  const start = formatDate(c.startDate);
                  const end = formatDate(c.endDate);
                  return (
                    <tr key={c.id} style={{ background: i % 2 === 1 ? 'var(--color-main-bg)' : 'transparent', borderTop: '1px solid var(--color-border-light)' }}>
                      <td className="px-5 py-3">
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '2px' }}>{c.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          ID: {c.id.replace(/\D/g, '') || c.id}
                          {start && end && <span> · {start} → {end}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3" style={{ color: 'var(--color-text-primary)' }}>{statusLabel[c.status]}</td>
                      <td className="px-5 py-3" style={{ minWidth: '240px' }}>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border-light)' }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: 'var(--color-primary)' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{pct}%</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          {delivered.toLocaleString('en-US')} / {target.toLocaleString('en-US')} Billable Leads
                        </div>
                      </td>
                      <td className="px-5 py-3" style={{ color: 'var(--color-text-primary)' }}>{c.totalLeads.toLocaleString('en-US')}</td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => navigate(`/internal/campaigns/${c.id}`)}
                          aria-label={`View ${c.name}`}
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="hidden md:block px-5 py-10 text-center" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
              No campaigns match your filters.
            </div>
          )}
          <MobileCardList
            className="md:hidden p-4"
            rows={filtered}
            getRowId={(c) => c.id}
            title={(c) => c.name}
            badge={(c) => (
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                {statusLabel[c.status]}
              </span>
            )}
            fields={[
              { label: 'Client', value: (c) => c.clientName },
              {
                label: 'Delivered',
                value: (c) => {
                  const target = c.target ?? c.goalLeads ?? 0;
                  const delivered = c.delivered ?? c.deliveredLeads ?? 0;
                  return `${delivered.toLocaleString('en-US')} / ${target.toLocaleString('en-US')}`;
                },
              },
              {
                label: 'Progress',
                value: (c) => {
                  const target = c.target ?? c.goalLeads ?? 0;
                  const delivered = c.delivered ?? c.deliveredLeads ?? 0;
                  const pct = target > 0 ? Math.round((delivered / target) * 100) : 0;
                  return (
                    <span className="flex w-32 items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border-light)' }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: 'var(--color-primary)' }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{pct}%</span>
                    </span>
                  );
                },
              },
              { label: 'Manager', value: (c) => c.manager, hideWhenEmpty: true },
            ]}
            onClick={(c) => navigate(`/internal/campaigns/${c.id}`)}
            emptyMessage="No campaigns match your filters."
          />
        </div>
      </div>
    </>
  );
}
