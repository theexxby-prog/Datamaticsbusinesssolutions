import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Plus, ChevronDown,
  Clock, CheckCircle2, AlertTriangle, MessageSquareDiff,
  MoreVertical, Copy, Eye,
} from 'lucide-react';
import type { Campaign, CampaignStatus, CampaignSubmission, ServiceType } from '../types';
import { mockCampaigns, mockCampaignSubmissions } from '../mockData';
import { ProgressBar } from '../components/ProgressBar';
import { TableRow } from '../components/TableRow';
import { AppLayout } from '../components/AppLayout';
import { StatusBadge } from '../components/StatusBadge';
import { NewCampaignModal, type CampaignFormData } from '../components/NewCampaignModal';
import { CloneCampaignModal } from '../components/CloneCampaignModal';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// ─── Submission status timeline helper ───────────────────────────────────────
function SubmissionTracker({ submissions }: { submissions: CampaignSubmission[] }) {
  if (submissions.length === 0) return null;

  const pendingCount = submissions.filter(s => s.status === 'Pending Approval').length;
  const changesCount = submissions.filter(s => s.status === 'Changes Requested').length;

  return (
    <div
      className="mb-6 rounded-2xl overflow-hidden"
      style={{
        border: '1.5px solid rgba(186,32,39,0.25)',
        boxShadow: '0 4px 20px rgba(186,32,39,0.08)',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Coloured header banner */}
      <div
        className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap"
        style={{ background: 'linear-gradient(135deg, #BA2027 0%, #8B1219 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-white" style={{ fontSize: '15px' }}>
              Submitted for Approval
            </p>
            <p className="text-white/70" style={{ fontSize: '12px' }}>
              {submissions.length} campaign{submissions.length > 1 ? 's' : ''} awaiting your team's review
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {pendingCount > 0 && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white"
              style={{ fontSize: '12px', fontWeight: 600 }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              {pendingCount} Pending
            </span>
          )}
          {changesCount > 0 && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/30 text-amber-100"
              style={{ fontSize: '12px', fontWeight: 600 }}
            >
              <AlertTriangle className="w-3 h-3" />
              {changesCount} Needs Action
            </span>
          )}
        </div>
      </div>

      {/* Submission rows */}
      <div className="divide-y divide-black/[0.05]">
        {submissions.map(sub => {
          const isPending = sub.status === 'Pending Approval';
          const isChanges = sub.status === 'Changes Requested';

          const steps = [
            { label: 'Submitted', done: true },
            {
              label: isPending ? 'Under Review' : isChanges ? 'Changes Needed' : 'Reviewed',
              done: !isPending,
              active: isPending,
              warning: isChanges,
            },
            { label: 'Goes Live', done: false },
          ];

          return (
            <div
              key={sub.id}
              className="px-6 py-5"
              style={{
                background: isChanges ? 'rgba(251,191,36,0.04)' : 'transparent',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Campaign info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <StatusBadge status={sub.status} />
                    <span className="text-xs text-[#9CA3AF]">
                      {sub.serviceType} · Submitted {new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="font-semibold text-[#1F2937]" style={{ fontSize: '14px' }}>
                    {sub.campaignName}
                  </p>
                  <p className="text-[#6B7280] mt-0.5" style={{ fontSize: '12px' }}>
                    Assigned to <span className="font-medium text-[#374151]">{sub.assignedManager}</span>
                  </p>
                </div>

                {/* Timeline stepper */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{
                            background: step.done
                              ? '#059669'
                              : step.active
                              ? '#BA2027'
                              : step.warning
                              ? '#F59E0B'
                              : 'rgba(0,0,0,0.08)',
                            boxShadow: (step.active || step.warning)
                              ? `0 0 0 3px ${step.warning ? 'rgba(245,158,11,0.15)' : 'rgba(186,32,39,0.15)'}`
                              : 'none',
                          }}
                        >
                          {step.done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          ) : step.warning ? (
                            <AlertTriangle className="w-3 h-3 text-white" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-white/60" />
                          )}
                        </div>
                        <span
                          className="text-center whitespace-nowrap"
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: step.done ? '#059669' : step.active ? '#BA2027' : step.warning ? '#B45309' : '#9CA3AF',
                          }}
                        >
                          {step.label}
                        </span>
                      </div>
                      {i < steps.length - 1 && (
                        <div
                          className="w-8 h-px mb-4"
                          style={{ background: step.done ? '#D1FAE5' : 'rgba(0,0,0,0.1)' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Changes Requested manager feedback callout */}
              {isChanges && sub.managerNotes && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 rounded-xl p-3 flex items-start gap-2.5"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
                >
                  <MessageSquareDiff className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800 mb-0.5" style={{ fontSize: '12px' }}>
                      Feedback from {sub.reviewedBy || sub.assignedManager}
                    </p>
                    <p className="text-amber-900 leading-relaxed" style={{ fontSize: '12px' }}>
                      {sub.managerNotes}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function CampaignList() {
  useDocumentTitle('Campaigns');
  
  const location = useLocation();
  // Deep-link: honour ?statusFilter passed via navigate() state from dashboard cards
  const initialStatusFilter = (location.state as { statusFilter?: string } | null)?.statusFilter ?? 'All';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [dateRange, setDateRange] = useState<string>('All time');
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [clonePrefill, setClonePrefill] = useState<Partial<CampaignFormData> | undefined>(undefined);
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [clientSubmissions, setClientSubmissions] = useState<CampaignSubmission[]>(
    mockCampaignSubmissions.filter(s => s.clientId === 'client_1')
  );
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  // Clone modal state
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [campaignToClone, setCampaignToClone] = useState<typeof mockCampaigns[0] | null>(null);
  // Action menu (three-dot) state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Close three-dot menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handler = () => setOpenMenuId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openMenuId]);

  const handleCloneClick = (campaign: typeof mockCampaigns[0]) => {
    setCampaignToClone(campaign);
    setCloneModalOpen(true);
    setOpenMenuId(null);
  };

  const handleCloneConfirm = () => {
    if (!campaignToClone) return;
    setCloneModalOpen(false);
    // Build prefill from source campaign
    const prefill: Partial<CampaignFormData> = {
      name: `${campaignToClone.name} — Copy`,
      type: campaignToClone.serviceType as string,
    };
    setClonePrefill(prefill);
    setIsNewCampaignModalOpen(true);
  };

  const handleNewCampaignSubmit = (formData: CampaignFormData) => {
    const newCampaign = {
      id: `${campaigns.length + 1}`,
      name: formData.name,
      clientCompany: 'The Channel Company',
      serviceType: formData.type as ServiceType,
      status: 'Pending Approval' as CampaignStatus,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      delivered: 0,
      target: 0,
      accepted: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
      geo: `${formData.geography} (${formData.locations.slice(0, 3).join(', ')}${formData.locations.length > 3 ? '...' : ''})`,
      industry: 'TBD',
      revenueRange: formData.revenueSizeMin && formData.revenueSizeMax
        ? `${formData.revenueSizeMin} - ${formData.revenueSizeMax}`
        : 'TBD',
      employeeSize: `${formData.employeeSizeMin} - ${formData.employeeSizeMax}`,
      jobTitles: formData.titles.join(', '),
      pricingModel: `Per lead ($${formData.cpl}/lead)`,
      clientDetails: {
        name: 'The Channel Company',
        address: '350 Jericho Turnpike | Ste 310, Jericho, NY 11753',
        contact: 'Renuka Lawless, rlawless@thechannelcompany.com',
      },
      scopeOfWork: [
        `Campaign type: ${formData.type}`,
        `Target geography: ${formData.geography}`,
        `Locations: ${formData.locations.join(', ')}`,
        `Job titles: ${formData.titles.join(', ')}`,
        formData.additionalInfo || 'Additional requirements to be confirmed',
      ],
      terms: 'Campaign pending approval. Job card will be sent for signature upon campaign manager approval.',
    };

    // Add to local campaign list
    setCampaigns([newCampaign, ...campaigns]);

    // Add to submissions tracker
    const newSubmission: CampaignSubmission = {
      id: `sub_new_${Date.now()}`,
      campaignName: formData.name,
      clientId: 'client_1',
      clientCompany: 'The Channel Company',
      submittedBy: 'Renuka Lawless',
      submittedAt: new Date().toISOString(),
      assignedManager: 'Brijesh Singh',
      assignedManagerEmail: 'brijesh.singh@datamaticsbpm.com',
      status: 'Pending Approval',
      serviceType: formData.type,
      geography: formData.geography,
      locations: formData.locations,
      targetLeads: 0,
      cpl: Number(formData.cpl) || 0,
      jobTitles: formData.titles,
      employeeSize: `${formData.employeeSizeMin} - ${formData.employeeSizeMax}`,
      industry: 'TBD',
      additionalInfo: formData.additionalInfo,
    };
    setClientSubmissions(prev => [newSubmission, ...prev]);

    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  // Historical filter keys off the campaign START date (when it began),
  // not the end date — "last 3 months" means started in that window.
  const matchesDateRange = (startDateStr: string): boolean => {
    if (dateRange === 'All time') return true;
    const start = new Date(startDateStr);
    if (isNaN(start.getTime())) return true;
    const now = new Date();
    if (dateRange === 'This month') {
      return start.getFullYear() === now.getFullYear() && start.getMonth() === now.getMonth();
    }
    if (dateRange === 'Last 3 months') {
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      return start >= cutoff;
    }
    if (dateRange === 'This year') {
      return start.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || campaign.status === statusFilter;
    // Client view: only show The Channel Company campaigns (demo client)
    const matchesClient = campaign.clientCompany === 'The Channel Company';
    const matchesDate = matchesDateRange(campaign.startDate);
    return matchesSearch && matchesStatus && matchesClient && matchesDate;
  });

  // Only show submissions that are still actionable (not yet approved/declined)
  const activeSubmissions = clientSubmissions.filter(
    s => s.status === 'Pending Approval' || s.status === 'Changes Requested'
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto page-content">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8 gap-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Your Campaigns</h1>
          <button
            onClick={() => setIsNewCampaignModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#BA2027] text-white rounded-xl hover:bg-[#9A1A21] active:bg-[#7A1419] transition-all shadow-md hover:shadow-lg font-semibold w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            Submit a Campaign
          </button>
        </div>

        {/* Submissions Tracker — shown when there are pending/changes-requested submissions */}
        <SubmissionTracker submissions={activeSubmissions} />

        {/* Success Message */}
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 rounded-xl p-4 flex items-start gap-3"
              style={{ background: 'rgba(5,150,105,0.07)', border: '1px solid rgba(5,150,105,0.2)' }}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900" style={{ fontSize: '14px' }}>
                  Campaign Submitted for Approval
                </p>
                <p className="text-emerald-800 mt-0.5" style={{ fontSize: '13px' }}>
                  Your campaign request has been sent to your campaign manager for review. You can track its status in the "Submitted for Approval" section above.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="glass-card p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by campaign name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-base w-full pl-10 pr-4 py-2"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-base px-4 py-2 pr-10 appearance-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Changes Requested">Changes Requested</option>
                <option value="Not started">Not started</option>
                <option value="In progress">In progress</option>
                <option value="Paused">Paused</option>
                <option value="Completed">Completed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="input-base px-4 py-2 pr-10 appearance-none cursor-pointer"
              >
                <option value="All time">All time</option>
                <option value="This month">This month</option>
                <option value="Last 3 months">Last 3 months</option>
                <option value="This year">This year</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Campaign Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: 'var(--color-border-light)', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  {['Campaign Name', 'Service Type', 'Status', 'Start Date', 'End Date', 'Delivered vs Target', 'Last Updated', 'Action'].map(col => (
                    <th key={col} className="text-left px-6 py-4 table-th">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign, index) => {
                  const isActive = campaign.status === 'In progress';
                  const isPaused = campaign.status === 'Paused';
                  const isCompleted = campaign.status === 'Completed';
                  const pct = campaign.target > 0 ? Math.min(Math.round((campaign.delivered / campaign.target) * 100), 100) : 0;

                  return (
                    <TableRow
                      key={campaign.id}
                      showHoverEffect={true}
                      animationDelay={index * 100}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#1F2937]" style={{ fontSize: '14px' }}>{campaign.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap table-td">{campaign.serviceType}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={campaign.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap table-td">
                        {new Date(campaign.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap table-td">
                        {new Date(campaign.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      {/* ── Animated Live Lead Counter ── */}
                      <td className="px-6 py-4" style={{ minWidth: '200px' }}>
                        <div className="flex items-center gap-2 mb-1">
                          {/* Status dot */}
                          {isActive && (
                            <span className="relative flex h-2 w-2 flex-shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#22c55e' }} />
                              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#22c55e' }} />
                            </span>
                          )}
                          {isPaused && (
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#BA2027' }} />
                          )}
                          {isCompleted && (
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#6B7280' }} />
                          )}
                          {/* Animated count */}
                          <motion.span
                            key={campaign.delivered}
                            initial={{ opacity: 0.6, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                            style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}
                          >
                            {campaign.delivered.toLocaleString()}
                          </motion.span>
                          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                            of {campaign.target.toLocaleString()} leads
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(186,32,39,0.10)' }}>
                          <motion.div
                            className="h-1.5 rounded-full"
                            style={{ background: 'rgba(186,32,39,0.70)' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: index * 0.05 }}
                          />
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                          {pct}% delivered
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap table-td">
                        {new Date(campaign.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      {/* Action cell with three-dot menu */}
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/campaigns/${campaign.id}`}
                            className="btn-outline px-3 py-1.5"
                            style={{ fontSize: '13px' }}
                          >
                            View details
                          </Link>
                          {/* Three-dot menu */}
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === campaign.id ? null : campaign.id)}
                              className="btn-ghost p-1.5"
                              title="More actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            <AnimatePresence>
                              {openMenuId === campaign.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                  transition={{ duration: 0.14 }}
                                  className="absolute right-0 top-full mt-1 w-40 rounded-xl overflow-hidden z-50"
                                  style={{
                                    background: 'rgba(255,255,255,0.98)',
                                    border: '1px solid var(--color-border)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                  }}
                                >
                                  <Link
                                    to={`/campaigns/${campaign.id}`}
                                    className="flex items-center gap-2 px-3 py-2.5 w-full text-left hover:bg-[rgba(186,32,39,0.05)] transition-colors"
                                    style={{ fontSize: '13px', color: 'var(--color-text-primary)', textDecoration: 'none' }}
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    View Details
                                  </Link>
                                  <button
                                    onClick={() => handleCloneClick(campaign)}
                                    className="flex items-center gap-2 px-3 py-2.5 w-full text-left hover:bg-[rgba(186,32,39,0.05)] transition-colors"
                                    style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                    Clone Campaign
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </td>
                    </TableRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredCampaigns.length === 0 && (
          <div className="glass-card py-16 text-center">
            <p className="text-[#6B7280]">No campaigns found matching your filters.</p>
          </div>
        )}
      </div>

      <NewCampaignModal
        isOpen={isNewCampaignModalOpen}
        onClose={() => { setIsNewCampaignModalOpen(false); setClonePrefill(undefined); }}
        onSubmit={handleNewCampaignSubmit}
        prefill={clonePrefill}
      />

      <CloneCampaignModal
        isOpen={cloneModalOpen}
        campaignName={campaignToClone?.name ?? ''}
        onClose={() => setCloneModalOpen(false)}
        onConfirm={handleCloneConfirm}
      />
    </AppLayout>
  );
}