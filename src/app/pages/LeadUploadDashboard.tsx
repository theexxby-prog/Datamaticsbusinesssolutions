import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  Search,
  Filter,
  Download,
  Eye,
  X,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TableRow } from '../components/TableRow';
import { MobileCardList } from '../components/ui/MobileCardList';
import { LeadUploadModal } from '../components/LeadUploadModal';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { allClients, recentUploadBatches, type LeadUploadBatch } from '../data/mockClients';
import { useAuth } from '../context/AuthContext';

export default function LeadUploadDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [uploadFilter, setUploadFilter] = useState<'all' | 'processing' | 'completed' | 'failed' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPendingAlert, setShowPendingAlert] = useState(true);

  // Calculate metrics from upload batches
  const uploadMetrics = useMemo(() => {
    const processing = recentUploadBatches.filter(u => u.status === 'processing').length;
    const completed = recentUploadBatches.filter(u => u.status === 'completed').length;
    const failed = recentUploadBatches.filter(u => u.status === 'failed').length;
    const pending = recentUploadBatches.filter(u => u.status === 'pending').length;
    const totalLeadsToday = recentUploadBatches
      .filter(u => {
        const uploadDate = new Date(u.uploadedAt);
        const today = new Date();
        return uploadDate.toDateString() === today.toDateString();
      })
      .reduce((sum, u) => sum + u.successCount, 0);
    
    return { processing, completed, failed, pending, totalLeadsToday };
  }, []);

  // Filter uploads based on search and status
  const filteredUploads = useMemo(() => {
    let filtered = [...recentUploadBatches];

    // Filter by status
    if (uploadFilter !== 'all') {
      filtered = filtered.filter(u => u.status === uploadFilter);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(u =>
        u.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [uploadFilter, searchQuery]);

  // Group uploads by campaign
  const uploadsByCampaign = useMemo(() => {
    const grouped = new Map<string, LeadUploadBatch[]>();
    
    recentUploadBatches.forEach(upload => {
      const key = `${upload.campaignId}|${upload.campaignName}|${upload.clientName}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(upload);
    });

    return Array.from(grouped.entries()).map(([key, uploads]) => {
      const [campaignId, campaignName, clientName] = key.split('|');
      const totalLeads = uploads.reduce((sum, u) => sum + u.successCount, 0);
      const totalErrors = uploads.reduce((sum, u) => sum + u.errorCount, 0);
      const hasProcessing = uploads.some(u => u.status === 'processing');
      const hasFailed = uploads.some(u => u.status === 'failed');
      
      return {
        campaignId,
        campaignName,
        clientName,
        uploads,
        totalLeads,
        totalErrors,
        hasProcessing,
        hasFailed,
      };
    });
  }, []);

  const handleQuickUpload = (clientId: string, campaignId?: string) => {
    setSelectedClientId(clientId);
    setSelectedCampaignId(campaignId || null);
    setShowUploadModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-success)' }} />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" style={{ color: 'var(--color-error)' }} />;
      case 'pending':
        return <Clock className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />;
      default:
        return <FileText className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      processing: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
      completed: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
      failed: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
      pending: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const selectedClientData = selectedClientId ? allClients.find(c => c.id === selectedClientId) : null;
  const selectedCampaignData = selectedCampaignId && selectedClientData 
    ? selectedClientData.campaigns.find(c => c.id === selectedCampaignId) 
    : null;

  return (
    <>
      <div className="max-w-[1600px] mx-auto page-content">
        {/* Hero Header with Giant Upload Button */}
        <div className="mb-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 style={{ color: 'var(--color-text-primary)' }} className="mb-3">
                Lead Upload Center
              </h1>
              <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)' }}>
                Upload, track, and manage lead deliveries across all campaigns
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary px-8 py-4 flex items-center justify-center gap-3 w-full lg:w-auto shadow-lg hover:shadow-xl transition-all"
              style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}
            >
              <Upload className="w-6 h-6" />
              Upload New Leads
            </button>
          </div>
        </div>

        {/* Priority Alert for Failed/Pending Uploads */}
        {(uploadMetrics.failed > 0 || uploadMetrics.pending > 0) && showPendingAlert && (
          <div 
            className="mb-6 p-4 rounded-xl border flex items-center justify-between gap-4 animate-slideInUp"
            style={{
              backgroundColor: uploadMetrics.failed > 0 ? 'var(--color-error-bg)' : 'var(--color-warning-bg)',
              borderColor: uploadMetrics.failed > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(217,119,6,0.2)',
            }}
          >
            <div className="flex items-center gap-3 flex-1">
              <div 
                className="flex-shrink-0 p-2 rounded-lg" 
                style={{ 
                  backgroundColor: uploadMetrics.failed > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(217,119,6,0.1)' 
                }}
              >
                <AlertTriangle className={`w-5 h-5 ${uploadMetrics.failed > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-warning)]'}`} />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1" style={{ color: uploadMetrics.failed > 0 ? 'var(--color-error)' : 'var(--color-badge-paused-text)' }}>
                  {uploadMetrics.failed > 0 && `${uploadMetrics.failed} failed upload${uploadMetrics.failed > 1 ? 's' : ''} need${uploadMetrics.failed === 1 ? 's' : ''} attention`}
                  {uploadMetrics.failed > 0 && uploadMetrics.pending > 0 && ' • '}
                  {uploadMetrics.pending > 0 && `${uploadMetrics.pending} upload${uploadMetrics.pending > 1 ? 's' : ''} pending`}
                </p>
                <p className="text-sm" style={{ color: uploadMetrics.failed > 0 ? 'var(--color-error)' : 'var(--color-badge-paused-text)' }}>
                  Review and retry failed uploads to ensure all leads are delivered
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setUploadFilter('failed')}
                className="btn-primary px-4 py-2 text-sm"
              >
                View Failed
              </button>
              <button
                onClick={() => setShowPendingAlert(false)}
                className="btn-ghost p-2"
              >
                <X className={`w-4 h-4 ${uploadMetrics.failed > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-warning)]'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Upload Status Metrics - BIG and BOLD */}
        <div className="mb-8">
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }} className="mb-4">
            Upload Status
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 stagger-children">
            <div 
              className="kpi-card animate-slideInUp cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setUploadFilter('processing')}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-warning-bg)' }}>
                  <Clock className="w-6 h-6" style={{ color: 'var(--color-warning)' }} />
                </div>
              </div>
              <div className="kpi-card__number" style={{ fontSize: '2.5rem' }}>
                <AnimatedCounter value={uploadMetrics.processing} />
              </div>
              <div className="kpi-card__label">Processing Now</div>
            </div>

            <div 
              className="kpi-card animate-slideInUp cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setUploadFilter('pending')}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(156,163,175,0.1)' }}>
                  <Clock className="w-6 h-6 text-gray-600" />
                </div>
              </div>
              <div className="kpi-card__number" style={{ fontSize: '2.5rem' }}>
                <AnimatedCounter value={uploadMetrics.pending} />
              </div>
              <div className="kpi-card__label">Pending</div>
            </div>

            <div 
              className="kpi-card animate-slideInUp cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setUploadFilter('completed')}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-success-bg)' }}>
                  <CheckCircle2 className="w-6 h-6" style={{ color: 'var(--color-success)' }} />
                </div>
              </div>
              <div className="kpi-card__number" style={{ fontSize: '2.5rem' }}>
                <AnimatedCounter value={uploadMetrics.completed} />
              </div>
              <div className="kpi-card__label">Completed</div>
            </div>

            <div 
              className="kpi-card animate-slideInUp cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setUploadFilter('failed')}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-error-bg)' }}>
                  <AlertCircle className="w-6 h-6" style={{ color: 'var(--color-error)' }} />
                </div>
              </div>
              <div className="kpi-card__number" style={{ fontSize: '2.5rem' }}>
                <AnimatedCounter value={uploadMetrics.failed} />
              </div>
              <div className="kpi-card__label">Failed</div>
            </div>

            <div className="kpi-card animate-slideInUp">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-tint)' }}>
                  <TrendingUp className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                </div>
              </div>
              <div className="kpi-card__number" style={{ fontSize: '2.5rem' }}>
                <AnimatedCounter value={uploadMetrics.totalLeadsToday} />
              </div>
              <div className="kpi-card__label">Leads Today</div>
            </div>
          </div>
        </div>

        {/* Campaign Upload Status */}
        <div className="mb-8">
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }} className="mb-4">
            Uploads by Campaign
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {uploadsByCampaign.map((campaign, index) => (
              <motion.div
                key={campaign.campaignId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }} className="mb-1">
                      {campaign.campaignName}
                    </h3>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                      {campaign.clientName}
                    </p>
                  </div>
                  <button
                    onClick={() => handleQuickUpload(
                      allClients.find(c => c.companyName === campaign.clientName)?.id || '',
                      campaign.campaignId
                    )}
                    className="btn-primary px-4 py-2 flex items-center justify-center gap-2"
                    style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }} className="mb-1">
                      Total Leads Uploaded
                    </div>
                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-success)' }}>
                      {campaign.totalLeads.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }} className="mb-1">
                      Errors
                    </div>
                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: campaign.totalErrors > 0 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                      {campaign.totalErrors}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {campaign.hasProcessing && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-warning-bg)] text-[var(--color-warning)] inline-flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Processing
                    </span>
                  )}
                  {campaign.hasFailed && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-error-bg)] text-[var(--color-error)] inline-flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3" />
                      Has Failures
                    </span>
                  )}
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    {campaign.uploads.length} upload{campaign.uploads.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Upload Activity Table */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                Recent uploads
              </h2>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 md:flex-initial md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search uploads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-base w-full pl-10 pr-4 py-2"
                    style={{ fontSize: 'var(--font-size-sm)' }}
                  />
                </div>
                <select
                  value={uploadFilter}
                  onChange={(e) => setUploadFilter(e.target.value as any)}
                  className="input-base px-3 py-2"
                  style={{ fontSize: 'var(--font-size-sm)' }}
                >
                  <option value="all">All statuses</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setUploadFilter('all');
                  }}
                  className="btn-outline px-3 py-2"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead style={{ background: 'var(--color-border-light)', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  <th
                    className="text-left px-6 py-3"
                    style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)' }}
                  >
                    File name
                  </th>
                  <th
                    className="text-left px-6 py-3"
                    style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)' }}
                  >
                    Client / Campaign
                  </th>
                  <th
                    className="text-left px-6 py-3"
                    style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)' }}
                  >
                    Progress
                  </th>
                  <th
                    className="text-left px-6 py-3"
                    style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)' }}
                  >
                    Success / Errors
                  </th>
                  <th
                    className="text-left px-6 py-3"
                    style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)' }}
                  >
                    Status
                  </th>
                  <th
                    className="text-left px-6 py-3"
                    style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)' }}
                  >
                    Uploaded by
                  </th>
                  <th
                    className="text-left px-6 py-3"
                    style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)' }}
                  >
                    Time
                  </th>
                  <th
                    className="text-left px-6 py-3"
                    style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)' }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUploads.map((upload, index) => (
                  <TableRow
                    key={upload.id}
                    showHoverEffect={true}
                    animationDelay={index * 30}
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                          {upload.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div>
                        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                          {upload.clientName}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                          {upload.campaignName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }} className="mb-1">
                          {upload.processedRows} / {upload.totalRows} rows
                        </div>
                        <div className="w-full bg-[var(--color-border-light)] rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${(upload.processedRows / upload.totalRows) * 100}%`,
                              background: upload.status === 'failed' ? 'var(--color-error)' : 
                                         upload.status === 'completed' ? 'var(--color-success)' : 
                                         'var(--color-warning)'
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)' }}>
                        <span style={{ color: 'var(--color-success)', fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-lg)' }}>
                          {upload.successCount}
                        </span>
                        {' / '}
                        <span style={{ color: 'var(--color-error)', fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-lg)' }}>
                          {upload.errorCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${getStatusBadge(upload.status)}`}>
                        {getStatusIcon(upload.status)}
                        {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                        {upload.uploadedBy}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                        {formatTimeAgo(upload.uploadedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        {upload.status === 'failed' && (
                          <button
                            onClick={() => handleQuickUpload(upload.clientId, upload.campaignId)}
                            className="btn-primary px-3 py-1.5"
                            style={{ fontSize: 'var(--font-size-xs)' }}
                          >
                            Retry
                          </button>
                        )}
                        {upload.errorDetails && upload.errorDetails.length > 0 && (
                          <button
                            className="btn-ghost p-2"
                            title="View errors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>

          <MobileCardList
            className="md:hidden p-4"
            rows={filteredUploads}
            getRowId={(upload) => upload.id}
            title={(upload) => (
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                <span className="min-w-0 break-all">{upload.fileName}</span>
              </span>
            )}
            badge={(upload) => (
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${getStatusBadge(upload.status)}`}>
                {getStatusIcon(upload.status)}
                {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
              </span>
            )}
            fields={[
              { label: 'Client', value: (upload) => upload.clientName },
              { label: 'Campaign', value: (upload) => upload.campaignName },
              { label: 'Rows', value: (upload) => `${upload.processedRows} / ${upload.totalRows}` },
              {
                label: 'Success / Errors',
                value: (upload) => (
                  <span>
                    <span style={{ color: 'var(--color-success)', fontWeight: 'var(--font-weight-bold)' }}>
                      {upload.successCount}
                    </span>
                    {' / '}
                    <span style={{ color: 'var(--color-error)', fontWeight: 'var(--font-weight-bold)' }}>
                      {upload.errorCount}
                    </span>
                  </span>
                ),
              },
              { label: 'Uploaded', value: (upload) => `${formatTimeAgo(upload.uploadedAt)} · ${upload.uploadedBy}` },
            ]}
            actions={(upload) =>
              upload.status === 'failed' || (upload.errorDetails && upload.errorDetails.length > 0) ? (
                <>
                  {upload.status === 'failed' && (
                    <button
                      onClick={() => handleQuickUpload(upload.clientId, upload.campaignId)}
                      className="btn-primary px-4 py-2.5 min-h-[44px]"
                      style={{ fontSize: 'var(--font-size-xs)' }}
                    >
                      Retry
                    </button>
                  )}
                  {upload.errorDetails && upload.errorDetails.length > 0 && (
                    <button
                      className="btn-ghost px-3 py-2.5 min-h-[44px] flex items-center gap-1.5"
                      style={{ fontSize: 'var(--font-size-xs)' }}
                      title="View errors"
                    >
                      <Eye className="w-4 h-4" />
                      View errors
                    </button>
                  )}
                </>
              ) : null
            }
            emptyMessage="No uploads found. Try adjusting your filters."
          />

          {filteredUploads.length === 0 && (
            <div className="hidden md:block text-center py-10" style={{ color: 'var(--color-text-secondary)' }}>
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p style={{ fontSize: 'var(--font-size-base)' }}>No uploads found</p>
              <p style={{ fontSize: 'var(--font-size-sm)' }} className="mt-2">
                {searchQuery || uploadFilter !== 'all' ? 'Try adjusting your filters' : 'Upload your first batch of leads to get started'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lead Upload Modal */}
      <LeadUploadModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedClientId(null);
          setSelectedCampaignId(null);
        }}
        clientId={selectedClientId || undefined}
        clientName={selectedClientData?.companyName}
        campaignId={selectedCampaignId || undefined}
        campaignName={selectedCampaignData?.name}
      />
    </>
  );
}