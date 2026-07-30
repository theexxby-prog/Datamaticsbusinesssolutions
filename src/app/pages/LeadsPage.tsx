import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TableRow } from '../components/TableRow';
import {
  Search, Filter, Download, Mail, Phone, Building2, CheckCircle, XCircle,
  Clock, FileText, UserCheck, MoreVertical, Star, Tag, Plus,
  TrendingUp, Users, Target, Award, Activity, Eye, X,
  ThumbsUp, ThumbsDown, Shield,
} from 'lucide-react';
import { mockLeads, type Lead } from '../mockData';
import { LeadDetailDrawer } from '../components/LeadDetailDrawer';
import { LeadScoreRing } from '../components/LeadScoreRing';
import { LeadAvatar } from '../components/LeadAvatar';
import { LeadDistributionChart } from '../components/LeadDistributionChart';
import { AdvancedFiltersPanel } from '../components/AdvancedFiltersPanel';
import { UnifiedKpiCard } from '../components/UnifiedKpiCard';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { EmptyState } from '../components/EmptyState';
import { TableSkeleton } from '../components/SkeletonLoader';
import { ConvertrQAStats } from '../components/ConvertrQAStatus';
import { exportLeadsToCSV } from '../utils/exportUtils';
import { allClients } from '../data/mockClients';
import { toast } from 'sonner';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

type SortField = 'leadScore' | 'deliveryDate' | 'company' | 'status';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'grid';

export default function LeadsPage() {
  useDocumentTitle('Leads');
  const { currentUser } = useAuth();

  const [leads, setLeads] = useState(mockLeads);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('leadScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [starred, setStarred] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(true);
  const [rejectingLeadId, setRejectingLeadId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [advancedFilters, setAdvancedFilters] = useState({
    scoreRange: [0, 100] as [number, number],
    dateRange: 'all',
    industry: [] as string[],
    tags: [] as string[]
  });

  // Determine lead acceptance method from the client
  const clientData = allClients.find(c => c.id === 'client_1'); // Current client
  const acceptanceMethod = clientData?.leadAcceptanceMethod || 'csv_manual';
  const isConvertr = acceptanceMethod === 'convertr';
  const showManualReview = acceptanceMethod === 'csv_manual' || acceptanceMethod === 'portal_review';

  // Automated QA snapshot across everything delivered to date (not just the
  // sample in the table below), so the percentages match the ~97% acceptance
  // rate reported on the campaigns and in the weekly digest.
  const deliveredToDate = clientData?.totalLeads ?? leads.length;
  const qaCaution = Math.round(deliveredToDate * 0.02);
  const qaInvalid = Math.round(deliveredToDate * 0.01);
  const convertrQAStats = {
    totalProcessed: deliveredToDate + qaCaution + qaInvalid,
    valid: deliveredToDate,
    caution: qaCaution,
    invalid: qaInvalid,
  };

  const rejectionReasons = [
    'Wrong job title',
    'Out of target geography',
    'Company size below threshold',
    'Duplicate — already in CRM',
    'Invalid contact information',
    'Not in target industry',
    'Insufficient BANT criteria',
    'Other',
  ];

  const handleAcceptLead = (id: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'Accepted' as Lead['status'] } : l));
    toast.success('Lead accepted');
  };

  const handleRejectLead = (id: string) => {
    if (!rejectionReason) {
      toast.error('Please select a rejection reason');
      return;
    }
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'Rejected' as Lead['status'], rejectionReason } : l));
    setRejectingLeadId(null);
    setRejectionReason('');
    toast.success('Lead rejected');
  };

  const handleBulkAccept = () => {
    setLeads(prev => prev.map(l => selectedLeads.includes(l.id) ? { ...l, status: 'Accepted' as Lead['status'] } : l));
    toast.success(`${selectedLeads.length} leads accepted`);
    setSelectedLeads([]);
  };

  const handleBulkReject = () => {
    setLeads(prev => prev.map(l => selectedLeads.includes(l.id) ? { ...l, status: 'Rejected' as Lead['status'], rejectionReason: 'Bulk rejection' } : l));
    toast.success(`${selectedLeads.length} leads rejected`);
    setSelectedLeads([]);
  };

  const handleExportLeads = () => {
    const leadsToExport = selectedLeads.length > 0
      ? leads.filter(l => selectedLeads.includes(l.id))
      : filteredLeads;
    exportLeadsToCSV(leadsToExport);
    toast.success(`Exported ${leadsToExport.length} leads to CSV`);
  };

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const handleStatusChange = (id: string, status: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: status as Lead['status'] } : l));
  };

  const leadsPerPage = viewMode === 'grid' ? 12 : 10;

  // Filter and sort leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesCampaign = campaignFilter === 'all' || lead.campaignId === campaignFilter;
    const matchesScore = lead.leadScore >= advancedFilters.scoreRange[0] && 
                        lead.leadScore <= advancedFilters.scoreRange[1];
    const matchesIndustry = advancedFilters.industry.length === 0 || 
                           advancedFilters.industry.includes(lead.industry);
    
    return matchesSearch && matchesStatus && matchesCampaign && matchesScore && matchesIndustry;
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'leadScore':
        comparison = a.leadScore - b.leadScore;
        break;
      case 'deliveryDate':
        comparison = new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
        break;
      case 'company':
        comparison = a.company.localeCompare(b.company);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * leadsPerPage,
    currentPage * leadsPerPage
  );

  // Statistics
  const stats = {
    total: filteredLeads.length,
    pending: filteredLeads.filter(l => l.status === 'Pending Review').length,
    accepted: filteredLeads.filter(l => l.status === 'Accepted').length,
    contacted: filteredLeads.filter(l => l.status === 'Contacted').length,
    avgScore: Math.round(filteredLeads.reduce((sum, l) => sum + l.leadScore, 0) / filteredLeads.length) || 0,
    hotLeads: filteredLeads.filter(l => l.leadScore >= 90).length
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusIcon = (status: Lead['status']) => {
    switch (status) {
      case 'Accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4" />;
      case 'Contacted':
        return <Mail className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'Accepted':
        return 'badge badge-active';
      case 'Rejected':
        return 'badge badge-paused';
      case 'Contacted':
        return 'badge badge-active';
      default:
        return 'badge badge-paused';
    }
  };

  const uniqueCampaigns = Array.from(new Set(leads.map(l => l.campaignId)));

  const handleLeadSelection = (leadId: string) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    } else {
      setSelectedLeads([...selectedLeads, leadId]);
    }
  };

  const handleLeadDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const toggleStar = (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (starred.includes(leadId)) {
      setStarred(starred.filter(id => id !== leadId));
      toast.success('Removed from favorites');
    } else {
      setStarred([...starred, leadId]);
      toast.success('Added to favorites');
    }
  };

  const fabActions = [
    {
      icon: <Plus className="w-5 h-5 text-white" />,
      label: 'New Lead',
      onClick: () => toast.info('New Lead form coming soon'),
      color: 'var(--color-primary)'
    },
    {
      icon: <FileText className="w-5 h-5 text-white" />,
      label: 'Import CSV',
      onClick: () => toast.info('CSV import coming soon'),
      color: 'var(--color-info)'
    },
    {
      icon: <Download className="w-5 h-5 text-white" />,
      label: 'Export my leads',
      onClick: handleExportLeads,
      color: 'var(--color-info)'
    }
  ];

  return (
    <>
      <div className="max-w-[1440px] mx-auto page-content animate-fadeIn">
        {/* Header with Stats */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 md:mb-6 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 style={{ color: 'var(--color-text-primary)' }}>Lead Management</h1>
              </div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                {stats.total} leads • {stats.pending} pending review • {stats.hotLeads} hot leads
              </p>
            </div>
            <button
              onClick={handleExportLeads}
              className="btn-primary px-4 py-2.5 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Leads (CSV)
            </button>
          </div>

          {/* Automated QA results (only for automated-delivery clients) */}
          {isConvertr && (
            <div className="mb-6">
              <ConvertrQAStats {...convertrQAStats} />
            </div>
          )}

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 stagger-children">
            {[
              { icon: <Users className="w-5 h-5" style={{ color: 'var(--color-info)' }} />, bg: 'var(--color-info-bg)', value: stats.total, label: 'Total Leads' },
              { icon: <Clock className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />, bg: 'var(--color-warning-bg)', value: stats.pending, label: 'Pending' },
              { icon: <TrendingUp className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />, bg: 'var(--color-primary-tint)', value: stats.hotLeads, label: 'Hot Leads' },
              { icon: <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />, bg: 'var(--color-success-bg)', value: stats.accepted, label: 'Accepted' },
              { icon: <Award className="w-5 h-5 text-purple-600" />, bg: 'rgba(142,68,173,0.1)', value: stats.avgScore, label: 'Avg Score' },
            ].map(({ icon, bg, value, label }) => (
              <div key={label} className="kpi-card kpi-card--flat animate-slideInUp">
                <div className="kpi-card__icon w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                  {icon}
                </div>
                <div>
                  <div className="kpi-card__number"><AnimatedCounter value={value} /></div>
                  <div className="kpi-card__label">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Highlight callout — count is derived from the table so the two can
            never disagree on screen. */}
        {showAlert && stats.hotLeads > 0 && (
          <div
            className="mb-5 p-3 rounded-xl border flex items-center justify-between gap-4 animate-slideInUp"
            style={{
              backgroundColor: 'var(--color-success-bg)',
              borderColor: 'var(--color-success)',
            }}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-shrink-0 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-success-bg)' }}>
                <TrendingUp className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>
                {stats.hotLeads} hot leads scored 90+ this week.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setSortField('leadScore')}
                className="btn-primary px-4 py-2 text-sm"
              >
                View Leads
              </button>
              <button
                onClick={() => setShowAlert(false)}
                className="btn-ghost p-2"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
              </button>
            </div>
          </div>
        )}

        {/* Filter Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
          <div className="lg:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search leads by name, email, company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base w-full h-[42px] pl-10 pr-4"
            />
          </div>

          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-base w-full h-[42px] px-4"
            >
              <option value="all">All Status</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Accepted">Accepted</option>
              <option value="Contacted">Contacted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="input-base w-full h-[42px] px-4"
            >
              <option value="all">All Campaigns</option>
              {uniqueCampaigns.map(campaignId => {
                const lead = leads.find(l => l.campaignId === campaignId);
                return (
                  <option key={campaignId} value={campaignId}>
                    {lead?.campaignName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="lg:col-span-3 flex gap-2">
            <button
              onClick={() => setShowFiltersPanel(true)}
              className="btn-outline flex-1 h-[42px] px-4 flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Advanced</span>
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
              className="btn-primary h-[42px] px-4"
            >
              {viewMode === 'table' ? 'Grid' : 'Table'}
            </button>
          </div>
        </div>

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="glass-card overflow-hidden animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="sticky top-0 z-10 table-header">
                  <tr>
                    <th className="table-th">
                      <input
                        type="checkbox"
                        checked={selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads(paginatedLeads.map(l => l.id));
                          } else {
                            setSelectedLeads([]);
                          }
                        }}
                      />
                    </th>
                    <th className="table-th">Lead Info</th>
                    <th className="table-th">Contact</th>
                    <th className="table-th">Company</th>
                    <th className="table-th cursor-pointer hover:text-[var(--color-primary)] transition-colors" onClick={() => handleSort('leadScore')}>Score</th>
                    <th className="table-th cursor-pointer hover:text-[var(--color-primary)] transition-colors" onClick={() => handleSort('status')}>Status</th>
                    <th className="table-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <TableSkeleton rows={8} columns={7} />
                  ) : paginatedLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState
                          icon={Users}
                          title="No leads found"
                          description="No leads match your current filters. Try adjusting your search or filter criteria."
                          actionLabel="Clear Filters"
                          onAction={() => { setSearchTerm(''); setStatusFilter('all'); setCampaignFilter('all'); }}
                        />
                      </td>
                    </tr>
                  ) : paginatedLeads.map((lead, index) => (
                    <TableRow
                      key={lead.id}
                      onClick={() => handleLeadDetail(lead)}
                      showHoverEffect={true}
                      animationDelay={index * 100}
                    >
                      <td className="table-td" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => handleLeadSelection(lead.id)}
                        />
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          <LeadAvatar firstName={lead.firstName} lastName={lead.lastName} size="md" />
                          <div>
                            <div className="t1">{lead.firstName} {lead.lastName}</div>
                            <div className="t2">{lead.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 t2">
                            <Mail className="w-3.5 h-3.5" />
                            {lead.email}
                          </div>
                          <div className="flex items-center gap-2 t2">
                            <Phone className="w-3.5 h-3.5" />
                            {lead.phone}
                          </div>
                        </div>
                      </td>
                      <td className="table-td">
                        <div>
                          <div className="flex items-center gap-2 t1">
                            <Building2 className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                            {lead.company}
                          </div>
                          <div className="t2">{lead.industry} • {lead.employeeSize}</div>
                        </div>
                      </td>
                      <td className="table-td">
                        <LeadScoreRing score={lead.leadScore} size={65} />
                      </td>
                      <td className="table-td">
                        <div className={getStatusColor(lead.status)}>
                          {getStatusIcon(lead.status)}
                          <span>{lead.status}</span>
                        </div>
                      </td>
                      <td className="table-td" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {/* Accept/Reject buttons — only for manual review clients with pending leads */}
                          {showManualReview && lead.status === 'Pending Review' && (
                            <>
                              <button
                                onClick={() => handleAcceptLead(lead.id)}
                                className="btn-ghost p-2"
                                title="Accept lead"
                              >
                                <ThumbsUp className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                              </button>
                              <button
                                onClick={() => setRejectingLeadId(lead.id)}
                                className="btn-ghost p-2"
                                title="Reject lead"
                              >
                                <ThumbsDown className="w-4 h-4" style={{ color: 'var(--color-error)' }} />
                              </button>
                            </>
                          )}
                          <button onClick={(e) => toggleStar(lead.id, e)} className="btn-ghost p-2" title="Star">
                            <Star className={`w-4 h-4 ${starred.includes(lead.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </button>
                          <button onClick={() => handleLeadDetail(lead)} className="btn-ghost p-2" title="View lead">
                            <Eye className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                          </button>
                        </div>
                        {/* Inline rejection reason dropdown */}
                        {rejectingLeadId === lead.id && (
                          <div className="mt-2 p-3 rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                            <select
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="input-base w-full mb-2 text-sm"
                            >
                              <option value="">Select reason...</option>
                              {rejectionReasons.map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRejectLead(lead.id)}
                                className="btn-primary px-3 py-1.5 text-xs flex-1"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => { setRejectingLeadId(null); setRejectionReason(''); }}
                                className="btn-outline px-3 py-1.5 text-xs flex-1"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </TableRow>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 gap-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                Showing {((currentPage - 1) * leadsPerPage) + 1} to {Math.min(currentPage * leadsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-outline px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        currentPage === page
                          ? 'btn-primary'
                          : 'btn-ghost'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-outline px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedLeads.map((lead, index) => (
              <div
                key={lead.id}
                onClick={() => handleLeadDetail(lead)}
                className="glass-card p-5 cursor-pointer transition-all hover:scale-105 animate-slideInUp"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <LeadAvatar firstName={lead.firstName} lastName={lead.lastName} size="lg" />
                  <button
                    onClick={(e) => toggleStar(lead.id, e)}
                    className="btn-ghost p-1.5"
                  >
                    <Star 
                      className={`w-4 h-4 ${
                        starred.includes(lead.id) 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-400'
                      }`} 
                    />
                  </button>
                </div>

                <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  {lead.firstName} {lead.lastName}
                </h3>
                <p className="mb-3" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  {lead.title}
                </p>

                <div className="flex items-center justify-center mb-4">
                  <LeadScoreRing score={lead.leadScore} size={80} />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                    <Building2 className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                    <span className="truncate">{lead.company}</span>
                  </div>
                  <div className="flex items-center gap-2" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                    <Mail className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                    <span className="truncate">{lead.email}</span>
                  </div>
                </div>

                <div className={`${getStatusColor(lead.status)} w-full justify-center`}>
                  {getStatusIcon(lead.status)}
                  <span>{lead.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedLeads.length > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 animate-slideInUp">
          <div className="glass-card-strong px-6 py-4 flex items-center gap-4">
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
              {selectedLeads.length} selected
            </span>
            <div className="h-6 w-px" style={{ background: 'var(--color-border)' }} />
            <button 
              onClick={handleExportLeads}
              className="btn-outline px-4 py-2 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            {showManualReview && (
              <>
                <button 
                  onClick={handleBulkAccept}
                  className="btn-outline px-4 py-2 flex items-center gap-2"
                  style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
                >
                  <ThumbsUp className="w-4 h-4" />
                  Accept All
                </button>
                <button 
                  onClick={handleBulkReject}
                  className="btn-outline px-4 py-2 flex items-center gap-2"
                  style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                >
                  <ThumbsDown className="w-4 h-4" />
                  Reject All
                </button>
              </>
            )}
            <button 
              onClick={() => setSelectedLeads([])}
              className="btn-ghost p-2"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Advanced Filters Panel */}
      <AdvancedFiltersPanel
        isOpen={showFiltersPanel}
        onClose={() => setShowFiltersPanel(false)}
        filters={advancedFilters}
        onFilterChange={setAdvancedFilters}
      />

      {/* Lead Detail Drawer */}
      <LeadDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        lead={selectedLead}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}