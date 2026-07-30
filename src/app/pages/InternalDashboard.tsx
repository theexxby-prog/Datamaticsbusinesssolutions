import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { AppLayout } from '../components/AppLayout';
import { TableRow } from '../components/TableRow';
import {
  TrendingUp, Users, Target, Activity, BarChart3, Briefcase,
  Upload, ArrowUpRight, CheckCircle2, Clock, AlertCircle, Eye,
} from 'lucide-react';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { allClients, recentUploadBatches } from '../data/mockClients';
import { LeadUploadModal } from '../components/LeadUploadModal';
import { useState } from 'react';

export default function InternalDashboard() {
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Derive all campaign metrics from allClients (single source of truth)
  const allCampaigns = allClients.flatMap(c => c.campaigns);
  const totalCampaigns = allCampaigns.length;
  const activeCampaigns = allCampaigns.filter(c => c.status === 'active').length;
  const completedCampaigns = allCampaigns.filter(c => c.status === 'completed').length;
  const totalLeads = allCampaigns.reduce((sum, c) => sum + (c.delivered ?? c.totalLeads ?? 0), 0);
  const totalClients = allClients.length;

  // Upload metrics from recentUploadBatches
  const processingUploads = recentUploadBatches.filter(u => u.status === 'processing').length;
  const failedUploads = recentUploadBatches.filter(u => u.status === 'failed').length;

  // Recent 5 campaigns (latest by lastActivity)
  const recentCampaigns = [...allCampaigns]
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    .slice(0, 5)
    .map(camp => {
      const client = allClients.find(cl => cl.campaigns.some(c => c.id === camp.id));
      return { ...camp, clientName: client?.companyName ?? '' };
    });

  // Top clients by leads
  const topClients = [...allClients]
    .sort((a, b) => b.totalLeads - a.totalLeads)
    .slice(0, 4);

  const getUploadStatusStyle = (status: string) => {
    switch (status) {
      case 'processing': return { bg: 'var(--color-warning-bg)', text: 'var(--color-warning)', label: 'Processing' };
      case 'completed': return { bg: 'var(--color-success-bg)', text: 'var(--color-success)', label: 'Completed' };
      case 'failed': return { bg: 'var(--color-error-bg)', text: 'var(--color-error)', label: 'Failed' };
      default: return { bg: 'rgba(107,114,128,0.1)', text: 'var(--color-text-secondary)', label: 'Pending' };
    }
  };

  return (
    <AppLayout>
      <div className="max-w-[1440px] mx-auto page-content">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 style={{ color: 'var(--color-text-primary)' }} className="mb-1">Internal Dashboard</h1>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Operations and management overview
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary px-5 py-2.5 flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Upload className="w-4 h-4" />
            Upload Leads
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 stagger-children">
          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-info-bg)' }}>
                <Briefcase className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
              </div>
            </div>
            <div className="kpi-card__number"><AnimatedCounter value={totalCampaigns} /></div>
            <div className="kpi-card__label">Total Campaigns</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-success-bg)' }}>
                <Activity className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
              </div>
            </div>
            <div className="kpi-card__number"><AnimatedCounter value={activeCampaigns} /></div>
            <div className="kpi-card__label">Active</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(107,114,128,0.1)' }}>
                <CheckCircle2 className="w-5 h-5 text-gray-500" />
              </div>
            </div>
            <div className="kpi-card__number"><AnimatedCounter value={completedCampaigns} /></div>
            <div className="kpi-card__label">Completed</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-tint)' }}>
                <Target className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              </div>
            </div>
            <div className="kpi-card__number"><AnimatedCounter value={totalLeads} /></div>
            <div className="kpi-card__label">Total Leads</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-info-bg)' }}>
                <Users className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
              </div>
            </div>
            <div className="kpi-card__number"><AnimatedCounter value={totalClients} /></div>
            <div className="kpi-card__label">Clients</div>
          </div>

          <div className="kpi-card animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-success-bg)' }}>
                <TrendingUp className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
              </div>
            </div>
            <div className="kpi-card__number">+18%</div>
            <div className="kpi-card__label">Growth</div>
          </div>
        </div>

        {/* Upload Alert Banner */}
        {(processingUploads > 0 || failedUploads > 0) && (
          <div
            className="mb-6 p-4 rounded-xl border flex items-center gap-4 animate-slideInUp cursor-pointer"
            style={{
              backgroundColor: failedUploads > 0 ? 'var(--color-error-bg)' : 'var(--color-warning-bg)',
              borderColor: failedUploads > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(217,119,6,0.2)',
            }}
            onClick={() => navigate('/internal/leads')}
          >
            <div
              className="flex-shrink-0 p-2 rounded-lg"
              style={{ backgroundColor: failedUploads > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(217,119,6,0.1)' }}
            >
              {failedUploads > 0
                ? <AlertCircle className="w-5 h-5 text-red-600" />
                : <Clock className="w-5 h-5 text-orange-500" />
              }
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ fontSize: 'var(--font-size-sm)', color: failedUploads > 0 ? 'var(--color-error)' : 'var(--color-badge-paused-text)' }}>
                {failedUploads > 0 && `${failedUploads} failed upload${failedUploads > 1 ? 's' : ''} need attention`}
                {failedUploads > 0 && processingUploads > 0 && ' • '}
                {processingUploads > 0 && `${processingUploads} upload${processingUploads > 1 ? 's' : ''} currently processing`}
              </p>
              <p style={{ fontSize: 'var(--font-size-xs)', color: failedUploads > 0 ? 'var(--color-error)' : 'var(--color-badge-paused-text)' }}>
                Click to view details in the Lead Upload Center
              </p>
            </div>
            <ArrowUpRight className={`w-4 h-4 flex-shrink-0 ${failedUploads > 0 ? 'text-red-600' : 'text-orange-500'}`} />
          </div>
        )}

        {/* Main Grid: Recent Campaigns + Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Recent Campaigns Table */}
          <div className="lg:col-span-2 glass-card overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                Recent Campaigns
              </h2>
              <button
                onClick={() => navigate('/internal/campaigns')}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 600 }}
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="table-header">
                  <tr>
                    <th className="table-th">Campaign</th>
                    <th className="table-th">Progress</th>
                    <th className="table-th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCampaigns.map((campaign, index) => (
                    <TableRow key={campaign.id} animationDelay={index * 50}>
                      <td className="table-td">
                        <div className="t1">
                          {campaign.name.length > 36 ? `${campaign.name.substring(0, 36)}…` : campaign.name}
                        </div>
                        <div className="t3">
                          {campaign.delivered.toLocaleString()} / {campaign.target.toLocaleString()}
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-2" style={{ minWidth: '100px' }}>
                          <div className="progress-bar flex-1">
                            <div
                              className={`progress-bar__fill ${campaign.status === 'completed' ? 'progress-bar__fill--completed' : ''}`}
                              style={{ width: `${campaign.target > 0 ? Math.min(Math.round((campaign.delivered / campaign.target) * 100), 100) : 0}%` }}
                            />
                          </div>
                          <span className="t2" style={{ minWidth: '28px' }}>
                            {campaign.target > 0 ? Math.min(Math.round((campaign.delivered / campaign.target) * 100), 100) : 0}%
                          </span>
                        </div>
                      </td>
                      <td className="table-td">
                        <span className={`badge ${
                          campaign.status === 'active' ? 'badge-active' :
                          campaign.status === 'completed' ? 'badge-completed' :
                          'badge-paused'
                        }`}>
                          {campaign.status}
                        </span>
                      </td>
                    </TableRow>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions + Performance */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="glass-card p-5">
              <h2 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }} className="mb-4">
                Quick Actions
              </h2>
              <div className="space-y-2">
                {[
                  { label: 'Upload Leads', path: '/internal/leads', icon: Upload, color: 'var(--color-primary)' },
                  { label: 'View All Campaigns', path: '/internal/campaigns', icon: BarChart3, color: 'var(--color-info)' },
                  { label: 'Internal Reports', path: '/internal/reports', icon: TrendingUp, color: 'var(--color-success)' },
                  { label: 'Client Assignments', path: '/internal/client-assignment', icon: Users, color: 'var(--color-warning)' },
                  { label: 'Team Management', path: '/dashboard/ops/team', icon: Briefcase, color: 'var(--color-accent-purple)' },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.path}
                      onClick={() => navigate(action.path)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.01]"
                      style={{ background: 'var(--color-border-light)' }}
                      whileHover={{ x: 3 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${action.color}18` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: action.color }} />
                      </div>
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                        {action.label}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 ml-auto" style={{ color: 'var(--color-text-muted)' }} />
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="glass-card p-5">
              <h2 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }} className="mb-4">
                Performance Benchmarks
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Avg Campaign Performance', value: '87%' },
                  { label: 'Avg Lead Quality Score', value: '8.2/10' },
                  { label: 'Client Satisfaction', value: '94%' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }}>
                      {stat.label}
                    </span>
                    <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Clients + Recent Uploads */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Clients */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                Top Clients by Leads
              </h2>
              <button
                onClick={() => navigate('/dashboard/ops')}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 600 }}
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {topClients.map((client, index) => {
                const maxLeads = topClients[0].totalLeads;
                const barWidth = Math.round((client.totalLeads / maxLeads) * 100);
                return (
                  <div key={client.id} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0"
                      style={{ background: ['var(--color-primary)', 'var(--color-info)', 'var(--color-success)', 'var(--color-warning)'][index], fontSize: '11px', fontWeight: 700 }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }} className="truncate">
                          {client.companyName}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', flexShrink: 0, marginLeft: '8px' }}>
                          {client.totalLeads.toLocaleString()}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-bar__fill" style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Uploads */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                Recent Uploads
              </h2>
              <button
                onClick={() => navigate('/internal/leads')}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 600 }}
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {recentUploadBatches.slice(0, 4).map((upload) => {
                const s = getUploadStatusStyle(upload.status);
                return (
                  <div
                    key={upload.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl cursor-pointer hover:bg-black/[0.02] transition-colors"
                    style={{ background: 'var(--color-border-light)' }}
                    onClick={() => navigate('/internal/leads')}
                  >
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }} className="truncate">
                        {upload.fileName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }} className="mt-0.5 truncate">
                        {upload.clientName} · {upload.campaignName}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className="px-2 py-0.5 rounded-full inline-flex items-center"
                        style={{ fontSize: '11px', fontWeight: 600, background: s.bg, color: s.text }}
                      >
                        {s.label}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                        {upload.successCount} leads
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <LeadUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </AppLayout>
  );
}