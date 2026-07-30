import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Upload, ChevronRight, TrendingUp, Clock, Users, Target,
  CheckCircle2, Activity, BarChart3, AlertCircle, Eye,
} from 'lucide-react';
import { TableRow } from '../components/TableRow';
import { MobileCardList } from '../components/ui/MobileCardList';
import { useAuth } from '../context/AuthContext';
import { getClientsForUser, Client } from '../data/mockClients';
import { LeadUploadModal } from '../components/LeadUploadModal';
import { AnimatedCounter } from '../components/AnimatedCounter';

export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const { currentUser, canUploadLeads } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCampaignId, setUploadCampaignId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'name' | 'status' | 'totalLeads' | 'acceptanceRate'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Get clients assigned to this user
  const myClients = useMemo(() => getClientsForUser(currentUser.email), [currentUser.email]);

  // Select first client by default
  const selectedClient = useMemo(() => {
    if (!selectedClientId && myClients.length > 0) {
      setSelectedClientId(myClients[0].id);
      return myClients[0];
    }
    return myClients.find((c) => c.id === selectedClientId) || myClients[0];
  }, [selectedClientId, myClients]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedCampaigns = useMemo(() => {
    if (!selectedClient) return [];
    return [...selectedClient.campaigns].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'name': aVal = a.name; bVal = b.name; break;
        case 'status': aVal = a.status; bVal = b.status; break;
        case 'totalLeads': aVal = a.totalLeads; bVal = b.totalLeads; break;
        case 'acceptanceRate': aVal = a.acceptanceRate; bVal = b.acceptanceRate; break;
        default: return 0;
      }
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [selectedClient, sortField, sortOrder]);

  if (!selectedClient) {
    return (
      <>
        <div className="flex items-center justify-center h-screen">
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)' }}>No clients assigned</p>
        </div>
      </>
    );
  }

  // Aggregated stats across all campaigns of selected client
  const totalLeads = selectedClient.campaigns.reduce((sum, c) => sum + c.totalLeads, 0);
  const activeCampaigns = selectedClient.campaigns.filter((c) => c.status === 'active').length;
  const avgAcceptance = selectedClient.campaigns.length > 0
    ? Math.round(selectedClient.campaigns.reduce((sum, c) => sum + c.acceptanceRate, 0) / selectedClient.campaigns.length)
    : 0;

  const getStatusBadge = (status: string) => {
    const config = {
      active: { bg: 'var(--color-badge-active-bg)', text: 'var(--color-badge-active-text)', label: 'Active' },
      completed: { bg: 'var(--color-badge-completed-bg)', text: 'var(--color-badge-completed-text)', label: 'Completed' },
      paused: { bg: 'var(--color-badge-paused-bg)', text: 'var(--color-badge-paused-text)', label: 'Paused' },
    };
    const c = config[status as keyof typeof config] || config.paused;
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full"
        style={{ fontSize: '11px', fontWeight: 600, background: c.bg, color: c.text }}
      >
        {c.label}
      </span>
    );
  };

  const SortHeader = ({ field, label }: { field: typeof sortField; label: string }) => (
    <th
      className="text-left px-6 py-4 cursor-pointer hover:text-[var(--color-primary)] transition-colors"
      style={{
        fontSize: 'var(--font-size-xs)',
        fontWeight: 'var(--font-weight-semibold)',
        color: sortField === field ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--letter-spacing-wide)',
      }}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && (
          <span style={{ fontSize: '10px' }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  );

  return (
    <>
      <div className="max-w-[1440px] mx-auto page-content">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
          <div>
            <h1 style={{ color: 'var(--color-text-primary)' }} className="mb-1">
              Campaign Manager Dashboard
            </h1>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Managing {myClients.length} client{myClients.length !== 1 ? 's' : ''}
            </p>
          </div>
          {canUploadLeads() && (
            <button
              onClick={() => { setUploadCampaignId(null); setShowUploadModal(true); }}
              className="btn-primary px-5 py-2.5 flex items-center justify-center gap-2 w-full lg:w-auto"
            >
              <Upload className="w-4 h-4" />
              Upload Leads
            </button>
          )}
        </div>

        {/* Client Selector */}
        <div className="mb-6">
          <label
            style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}
            className="block mb-2"
          >
            Select Client
          </label>
          <select
            value={selectedClientId || ''}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="input-base px-4 py-3 max-w-md w-full"
          >
            {myClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.companyName}
              </option>
            ))}
          </select>
        </div>

        {/* Client Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 stagger-children">
          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-info-bg)' }}>
                <BarChart3 className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
              </div>
            </div>
            <div className="kpi-card__number">
              <AnimatedCounter value={selectedClient.campaigns.length} />
            </div>
            <div className="kpi-card__label">Total Campaigns</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-success-bg)' }}>
                <Activity className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
              </div>
            </div>
            <div className="kpi-card__number">
              <AnimatedCounter value={activeCampaigns} />
            </div>
            <div className="kpi-card__label">Active Now</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-tint)' }}>
                <Target className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              </div>
            </div>
            <div className="kpi-card__number">
              <AnimatedCounter value={totalLeads} />
            </div>
            <div className="kpi-card__label">Total Leads</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
              </div>
            </div>
            <div className="kpi-card__number">{avgAcceptance}%</div>
            <div className="kpi-card__label">Avg Acceptance</div>
          </div>
        </div>

        {/* Client Overview Card */}
        <div className="glass-card p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h2
                style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}
                className="mb-3"
              >
                {selectedClient.companyName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div
                    style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }}
                    className="mb-1"
                  >
                    Industry
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                    {selectedClient.industry}
                  </div>
                </div>
                <div>
                  <div
                    style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }}
                    className="mb-1"
                  >
                    Campaign Manager
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                    {selectedClient.campaignManager}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    {selectedClient.campaignManagerEmail}
                  </div>
                </div>
                <div>
                  <div
                    style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }}
                    className="mb-1"
                  >
                    Backup Manager
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                    {selectedClient.backupManager}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    {selectedClient.backupManagerEmail}
                  </div>
                </div>
              </div>
            </div>
            {/* Status pill */}
            <div className="flex items-start gap-3">
              {getStatusBadge(selectedClient.status)}
              <div
                className="text-right"
                style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}
              >
                <div>Leads this month</div>
                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-success)' }}>
                  +{selectedClient.leadsThisMonth.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between">
              <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                Campaigns
              </h2>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                {sortedCampaigns.length} campaigns
              </span>
            </div>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead style={{ background: 'var(--color-border-light)', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  <SortHeader field="name" label="Campaign" />
                  <SortHeader field="status" label="Status" />
                  <th
                    className="text-left px-6 py-4"
                    style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }}
                  >
                    Progress
                  </th>
                  <SortHeader field="totalLeads" label="Total Leads" />
                  <SortHeader field="acceptanceRate" label="Acceptance" />
                  <th
                    className="text-left px-6 py-4"
                    style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedCampaigns.map((campaign, index) => {
                  const delivered = campaign.delivered || campaign.deliveredLeads || 0;
                  const target = campaign.target || campaign.goalLeads || 0;
                  const progress = target > 0 ? Math.min(Math.round((delivered / target) * 100), 100) : 0;

                  return (
                    <TableRow
                      key={campaign.id}
                      showHoverEffect={true}
                      animationDelay={index * 50}
                      onClick={() => navigate(`/internal/campaigns/${campaign.id}`)}
                    >
                      {/* Campaign Name */}
                      <td className="px-6 py-4">
                        <div>
                          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                            {campaign.name}
                          </div>
                          {campaign.startDate && (
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }} className="mt-0.5">
                              {campaign.startDate}
                              {campaign.endDate ? ` → ${campaign.endDate}` : ''}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {getStatusBadge(campaign.status)}
                      </td>

                      {/* Progress Bar */}
                      <td className="px-6 py-4">
                        {target > 0 ? (
                          <div className="space-y-1.5" style={{ minWidth: '140px' }}>
                            <div className="flex items-center gap-3">
                              <div className="progress-bar flex-1">
                                <div
                                  className={`progress-bar__fill ${campaign.status === 'completed' ? 'progress-bar__fill--completed' : ''}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', minWidth: '28px' }}>
                                {progress}%
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                              {delivered.toLocaleString()} / {target.toLocaleString()} leads
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Total Leads */}
                      <td className="px-6 py-4">
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                          {campaign.totalLeads.toLocaleString()}
                        </span>
                      </td>

                      {/* Acceptance Rate */}
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full"
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            background: campaign.acceptanceRate >= 90
                              ? 'var(--color-success-bg)'
                              : campaign.acceptanceRate >= 75
                              ? 'var(--color-warning-bg)'
                              : 'var(--color-error-bg)',
                            color: campaign.acceptanceRate >= 90
                              ? 'var(--color-success)'
                              : campaign.acceptanceRate >= 75
                              ? 'var(--color-warning)'
                              : 'var(--color-error)',
                          }}
                        >
                          {campaign.acceptanceRate}%
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {canUploadLeads() && campaign.status === 'active' && (
                            <button
                              onClick={() => {
                                setUploadCampaignId(campaign.id);
                                setShowUploadModal(true);
                              }}
                              className="btn-primary px-3 py-1.5 flex items-center gap-1.5"
                              style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)' }}
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Upload
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/internal/campaigns/${campaign.id}`)}
                            className="btn-ghost p-2"
                            title="View campaign"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </TableRow>
                  );
                })}
              </tbody>
            </table>
          </div>

          <MobileCardList
            className="md:hidden p-4"
            rows={sortedCampaigns}
            getRowId={(campaign) => campaign.id}
            title={(campaign) => (
              <span>
                {campaign.name}
                {campaign.startDate && (
                  <span className="block text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>
                    {campaign.startDate}
                    {campaign.endDate ? ` → ${campaign.endDate}` : ''}
                  </span>
                )}
              </span>
            )}
            badge={(campaign) => getStatusBadge(campaign.status)}
            fields={[
              {
                label: 'Progress',
                value: (campaign) => {
                  const delivered = campaign.delivered || campaign.deliveredLeads || 0;
                  const target = campaign.target || campaign.goalLeads || 0;
                  const progress = target > 0 ? Math.min(Math.round((delivered / target) * 100), 100) : 0;
                  return target > 0 ? (
                    <span className="inline-block w-40 space-y-1.5">
                      <span className="flex items-center gap-3">
                        <div className="progress-bar flex-1">
                          <div
                            className={`progress-bar__fill ${campaign.status === 'completed' ? 'progress-bar__fill--completed' : ''}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', minWidth: '28px' }}>
                          {progress}%
                        </span>
                      </span>
                      <span className="block" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {delivered.toLocaleString()} / {target.toLocaleString()} leads
                      </span>
                    </span>
                  ) : (
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>—</span>
                  );
                },
              },
              { label: 'Total Leads', value: (campaign) => campaign.totalLeads.toLocaleString() },
              {
                label: 'Acceptance',
                value: (campaign) => (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full"
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      background: campaign.acceptanceRate >= 90
                        ? 'var(--color-success-bg)'
                        : campaign.acceptanceRate >= 75
                        ? 'var(--color-warning-bg)'
                        : 'var(--color-error-bg)',
                      color: campaign.acceptanceRate >= 90
                        ? 'var(--color-success)'
                        : campaign.acceptanceRate >= 75
                        ? 'var(--color-warning)'
                        : 'var(--color-error)',
                    }}
                  >
                    {campaign.acceptanceRate}%
                  </span>
                ),
              },
            ]}
            actions={(campaign) => (
              <>
                {canUploadLeads() && campaign.status === 'active' && (
                  <button
                    onClick={() => {
                      setUploadCampaignId(campaign.id);
                      setShowUploadModal(true);
                    }}
                    className="btn-primary px-4 py-2.5 min-h-[44px] flex items-center gap-1.5"
                    style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)' }}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                  </button>
                )}
                <button
                  onClick={() => navigate(`/internal/campaigns/${campaign.id}`)}
                  className="btn-ghost px-3 py-2.5 min-h-[44px] flex items-center gap-1.5"
                  style={{ fontSize: 'var(--font-size-xs)' }}
                  title="View campaign"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
              </>
            )}
            onClick={(campaign) => navigate(`/internal/campaigns/${campaign.id}`)}
            emptyMessage="No campaigns found for this client"
          />

          {sortedCampaigns.length === 0 && (
            <div className="hidden md:block text-center py-12">
              <Target className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                No campaigns found for this client
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lead Upload Modal */}
      {showUploadModal && (
        <LeadUploadModal
          isOpen={showUploadModal}
          onClose={() => { setShowUploadModal(false); setUploadCampaignId(null); }}
          clientId={selectedClient.id}
          clientName={selectedClient.companyName}
          campaignId={uploadCampaignId || undefined}
          campaignName={uploadCampaignId
            ? selectedClient.campaigns.find(c => c.id === uploadCampaignId)?.name
            : undefined}
        />
      )}
    </>
  );
}