import { useEffect, useMemo, useState } from 'react';
import { useIsMobile } from './ui/use-mobile';
import {
  Search, Plus, FileText, Filter, Grid3x3, List, Download, Trash2,
  Eye, Star, Calendar, User, FolderOpen, Upload, X, Check,
  FileSpreadsheet, ChevronDown, MoreVertical, Lock,
} from 'lucide-react';
import { DocumentViewerModal } from './DocumentViewerModal';
import { UploadZoneModal } from './UploadZoneModal';
import { TableRow } from './TableRow';
import { toast } from 'sonner';
import { AnimatedCounter } from './AnimatedCounter';
import { EmptyState } from './EmptyState';
import { formatDate } from '../utils/formatDate';
import { useCampaignThread } from '../context/CampaignThreadContext';
import { allClients } from '../data/mockClients';
import { ATTACHMENT_KIND_LABEL, type CampaignThreadEntry } from '../data/campaignThread';

interface Document {
  id: string;
  name: string;
  type: 'Contract' | 'SOW' | 'NDA' | 'Invoice' | 'Report' | 'Campaign' | 'Other';
  uploadedBy: string;
  uploadDate: string;
  size: string;
  status: 'Active' | 'Expired' | 'Pending' | 'Archived';
  campaign?: string;
  tags?: string[];
}

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Master Service Agreement - Q1 2026.pdf',
    type: 'Contract',
    uploadedBy: 'Vishal Mehta',
    uploadDate: '2026-01-15',
    size: '2.4 MB',
    status: 'Active',
    campaign: 'Lenovo Intel FIFA AI',
    tags: ['Legal', 'Important'],
  },
  {
    id: '2',
    name: 'Statement of Work - Uptime Solutions CRN2.pdf',
    type: 'SOW',
    uploadedBy: 'Vishal Mehta',
    uploadDate: '2026-02-01',
    size: '1.8 MB',
    status: 'Active',
    campaign: 'Uptime Solutions CRN2 - Lead Gen',
    tags: ['Active', 'Q1'],
  },
  {
    id: '3',
    name: 'Non-Disclosure Agreement.pdf',
    type: 'NDA',
    uploadedBy: 'Vishal Mehta',
    uploadDate: '2025-12-10',
    size: '980 KB',
    status: 'Active',
    tags: ['Legal'],
  },
  {
    id: '4',
    name: 'Campaign Performance Report - Jun 2026.xlsx',
    type: 'Report',
    uploadedBy: 'Data Analytics Team',
    uploadDate: '2026-02-05',
    size: '4.2 MB',
    status: 'Active',
    campaign: 'Multiple Campaigns',
    tags: ['Report', 'Analytics'],
  },
  {
    id: '5',
    name: 'Invoice INV-2026-001271.pdf',
    type: 'Invoice',
    uploadedBy: 'Billing Department',
    uploadDate: '2026-01-30',
    size: '320 KB',
    status: 'Active',
    tags: ['Billing', 'Q1'],
  },
  {
    id: '6',
    name: 'Eaton FY2026 Q3 SOW.pdf',
    type: 'SOW',
    uploadedBy: 'Brijesh Singh',
    uploadDate: '2026-02-10',
    size: '1.1 MB',
    status: 'Active',
    campaign: 'Eaton 2026 Full Year 1_Q3',
    tags: ['Active'],
  },
  {
    id: '7',
    name: 'Q2 2026 Campaign Completion Report.pdf',
    type: 'Report',
    uploadedBy: 'Data Analytics Team',
    uploadDate: '2026-01-05',
    size: '3.8 MB',
    status: 'Archived',
    tags: ['Report', 'Archived'],
  },
];

const typeConfig: Record<Document['type'], { color: string; bg: string; icon: React.ElementType }> = {
  Contract: { color: 'var(--color-info)', bg: 'rgba(8,145,178,0.1)', icon: FileText },
  SOW: { color: 'var(--color-accent-purple)', bg: 'rgba(124,58,237,0.1)', icon: FileText },
  NDA: { color: 'var(--color-primary)', bg: 'rgba(186,32,39,0.1)', icon: Lock },
  Invoice: { color: 'var(--color-success)', bg: 'rgba(15,157,88,0.1)', icon: FileText },
  Report: { color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.1)', icon: FileSpreadsheet },
  Campaign: { color: 'var(--color-primary)', bg: 'rgba(186,32,39,0.1)', icon: FileSpreadsheet },
  Other: { color: 'var(--color-text-secondary)', bg: 'rgba(107,114,128,0.1)', icon: FileText },
};

const statusConfig: Record<Document['status'], { label: string; color: string; bg: string }> = {
  Active: { label: 'Active', color: 'var(--color-success)', bg: 'rgba(15,157,88,0.1)' },
  Expired: { label: 'Expired', color: 'var(--color-primary)', bg: 'rgba(186,32,39,0.1)' },
  Pending: { label: 'Pending', color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.1)' },
  Archived: { label: 'Archived', color: 'var(--color-text-secondary)', bg: 'rgba(107,114,128,0.1)' },
};


const campaignNameById = new Map(
  allClients.flatMap(client => client.campaigns.map(c => [c.id, c.name] as const)),
);

/**
 * Files attached to a campaign discussion are the same records shown here —
 * one upload, two views. Giving the library its own separate store would
 * recreate the shared folder this feature exists to replace.
 */
function attachmentsAsDocuments(entries: CampaignThreadEntry[]): Document[] {
  return entries.flatMap(entry =>
    (entry.attachments ?? []).map(attachment => ({
      id: `thread_${attachment.id}`,
      name: attachment.name,
      type: 'Campaign' as const,
      uploadedBy: entry.author.name,
      uploadDate: entry.createdAt.slice(0, 10),
      size: attachment.sizeLabel,
      status: 'Active' as const,
      campaign: campaignNameById.get(entry.campaignId) ?? entry.campaignId,
      tags: [
        ATTACHMENT_KIND_LABEL[attachment.kind],
        ...(attachment.version ? [`v${attachment.version}`] : []),
      ],
    })),
  );
}

export function DocumentLibraryTab() {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() =>
    isMobile ? 'grid' : 'table'
  );
  // Follow the viewport when it changes (rotate, resize) — grid is the only
  // usable mode on a phone; table is the natural default on desktop.
  useEffect(() => {
    setViewMode(isMobile ? 'grid' : 'table');
  }, [isMobile]);
  const [starred, setStarred] = useState<string[]>([]);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const { entriesFor } = useCampaignThread();
  const documents = useMemo(() => {
    const fromCampaigns = allClients
      .flatMap(client => client.campaigns)
      .flatMap(campaign => attachmentsAsDocuments(entriesFor(campaign.id)));
    // Newest first, so a TAL uploaded during the call appears at the top.
    return [...fromCampaigns, ...mockDocuments].sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));
  }, [entriesFor]);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.campaign?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesType = typeFilter === 'All' || doc.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
    const matchesStarred = !showStarredOnly || starred.includes(doc.id);
    return matchesSearch && matchesType && matchesStatus && matchesStarred;
  });

  const toggleStar = (id: string) => {
    setStarred((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleView = (doc: Document) => {
    setSelectedDocument(doc);
    setShowViewer(true);
  };

  const handleDownload = (doc: Document) => {
    toast.success(`Downloading ${doc.name}…`);
  };

  const handleDelete = (doc: Document) => {
    toast.success(`${doc.name} deleted`);
    setActiveMenu(null);
  };

  const totalActive = documents.filter((d) => d.status === 'Active').length;
  const totalContracts = documents.filter((d) => d.type === 'Contract' || d.type === 'SOW' || d.type === 'NDA').length;

  return (
    <>
      <div className="animate-fadeIn">
        {/* Upload action */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary px-4 py-2 flex items-center gap-2 w-full lg:w-auto justify-center"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 stagger-children">
          {[
            { label: 'Total Documents', value: documents.length, icon: FileText, color: 'var(--color-primary)', bg: 'var(--color-primary-tint)' },
            { label: 'Active', value: totalActive, icon: Check, color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
            { label: 'Contracts & Legal', value: totalContracts, icon: Lock, color: 'var(--color-accent-purple)', bg: 'rgba(124,58,237,0.1)' },
            { label: 'Reports', value: documents.filter(d => d.type === 'Report').length, icon: FileSpreadsheet, color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.1)' },
          ].map(({ label, value, icon: Icon, color, bg }, i) => (
            <div key={label} className="kpi-card animate-slideInUp" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
              </div>
              <div className="kpi-card__number"><AnimatedCounter value={value} /></div>
              <div className="kpi-card__label">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters + View Toggle */}
        <div className="glass-card p-4 mb-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Search documents…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-base w-full pl-9 pr-4 py-2"
                style={{ fontSize: 'var(--font-size-sm)' }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                </button>
              )}
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-base px-3 py-2 pr-8 appearance-none"
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                <option value="All">All Types</option>
                {(['Contract', 'SOW', 'NDA', 'Invoice', 'Report', 'Campaign', 'Other'] as const).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-base px-3 py-2 pr-8 appearance-none"
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                <option value="All">All Statuses</option>
                {(['Active', 'Expired', 'Pending', 'Archived'] as const).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
            </div>

            {/* Starred Filter */}
            <button
              onClick={() => setShowStarredOnly((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all"
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: showStarredOnly ? 600 : 400,
                borderColor: showStarredOnly ? 'var(--color-warning)' : 'var(--color-border)',
                background: showStarredOnly ? 'rgba(245,158,11,0.08)' : 'transparent',
                color: showStarredOnly ? 'var(--color-warning)' : 'var(--color-text-secondary)',
              }}
            >
              <Star
                className="w-4 h-4"
                style={{
                  color: showStarredOnly ? 'var(--color-warning)' : 'var(--color-text-muted)',
                  fill: showStarredOnly ? 'var(--color-warning)' : 'transparent',
                }}
              />
              Starred
              {starred.length > 0 && (
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full"
                  style={{ fontSize: '10px', fontWeight: 700, background: 'var(--color-warning)', color: 'white' }}
                >
                  {starred.length}
                </span>
              )}
            </button>
          </div>

          {/* View Toggle */}
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--color-border-light)' }}>
            <button
              onClick={() => setViewMode('table')}
              className="p-2 rounded-md transition-colors"
              style={{
                background: viewMode === 'table' ? 'white' : 'transparent',
                color: viewMode === 'table' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none',
              }}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className="p-2 rounded-md transition-colors"
              style={{
                background: viewMode === 'grid' ? 'white' : 'transparent',
                color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none',
              }}
              title="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results count */}
        <p className="mb-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found
        </p>

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead style={{ background: 'var(--color-border-light)', borderBottom: '1px solid var(--color-border)' }}>
                  <tr>
                    {['', 'Document', 'Type', 'Status', 'Uploaded By', 'Date', 'Size', ''].map((h, i) => (
                      <th
                        key={i}
                        className="text-left px-4 py-3"
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: 'var(--letter-spacing-wide)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState
                          icon={FolderOpen}
                          title="No documents found"
                          description="No documents match your current filters. Try adjusting your search or category."
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map((doc, index) => {
                      const cfg = typeConfig[doc.type];
                      const stsCfg = statusConfig[doc.status];
                      const DocIcon = cfg.icon;
                      const isStarred = starred.includes(doc.id);

                      return (
                        <TableRow key={doc.id} animationDelay={index * 50}>
                          {/* Star */}
                          <td className="px-4 py-3 w-8">
                            <button
                              onClick={() => toggleStar(doc.id)}
                              title={isStarred ? 'Remove from starred' : 'Star this document'}
                            >
                              <Star
                                className="w-4 h-4 transition-all"
                                style={{
                                  color: isStarred ? 'var(--color-warning)' : 'var(--color-text-muted)',
                                  fill: isStarred ? 'var(--color-warning)' : 'transparent',
                                }}
                              />
                            </button>
                          </td>

                          {/* Name + Campaign */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="min-w-0">
                                <div
                                  className="truncate max-w-[260px] cursor-pointer hover:underline"
                                  style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}
                                  onClick={() => handleView(doc)}
                                  title={doc.name}
                                >
                                  {doc.name}
                                </div>
                                {doc.campaign && (
                                  <div className="truncate max-w-[260px]" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                    {doc.campaign}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full"
                              style={{ fontSize: '12px', fontWeight: 600, color: cfg.color, background: cfg.bg, whiteSpace: 'nowrap' }}
                            >
                              {doc.type}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full"
                              style={{ fontSize: '12px', fontWeight: 600, color: stsCfg.color, background: stsCfg.bg, whiteSpace: 'nowrap' }}
                            >
                              {stsCfg.label}
                            </span>
                          </td>

                          {/* Uploaded By */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                                {doc.uploadedBy}
                              </span>
                            </div>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                                {formatDate(doc.uploadDate)}
                              </span>
                            </div>
                          </td>

                          {/* Size */}
                          <td className="px-4 py-3">
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                              {doc.size}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleView(doc)}
                                className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                              </button>
                              <button
                                onClick={() => handleDownload(doc)}
                                className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
                                title="Download"
                              >
                                <Download className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                              </button>
                              <div className="relative">
                                <button
                                  onClick={() => setActiveMenu(activeMenu === doc.id ? null : doc.id)}
                                  className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
                                >
                                  <MoreVertical className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                                </button>
                                {activeMenu === doc.id && (
                                  <div
                                    className="absolute right-0 top-full mt-1 w-36 rounded-xl shadow-xl z-10 overflow-hidden border"
                                    style={{ background: 'white', borderColor: 'var(--color-border)' }}
                                  >
                                    <button
                                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-black/5 transition-colors"
                                      style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}
                                      onClick={() => { handleDownload(doc); setActiveMenu(null); }}
                                    >
                                      <Download className="w-4 h-4" />
                                      Download
                                    </button>
                                    <button
                                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-red-50 transition-colors"
                                      style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-error)' }}
                                      onClick={() => handleDelete(doc)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </TableRow>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocuments.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  icon={FolderOpen}
                  title="No documents found"
                  description="No documents match your current filters. Try adjusting your search or category."
                />
              </div>
            ) : (
              filteredDocuments.map((doc, index) => {
                const cfg = typeConfig[doc.type];
                const stsCfg = statusConfig[doc.status];
                const DocIcon = cfg.icon;
                const isStarred = starred.includes(doc.id);

                return (
                  <div
                    key={doc.id}
                    className="glass-card p-4 flex flex-col gap-3 animate-slideInUp"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <button
                        onClick={() => toggleStar(doc.id)}
                        title={isStarred ? 'Remove from starred' : 'Star this document'}
                      >
                        <Star
                          className="w-4 h-4 transition-all"
                          style={{
                            color: isStarred ? 'var(--color-warning)' : 'var(--color-text-muted)',
                            fill: isStarred ? 'var(--color-warning)' : 'transparent',
                          }}
                        />
                      </button>
                    </div>

                    {/* Name */}
                    <div>
                      <div
                        className="line-clamp-2 cursor-pointer hover:underline"
                        style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}
                        onClick={() => handleView(doc)}
                      >
                        {doc.name}
                      </div>
                      {doc.campaign && (
                        <div className="mt-1 truncate" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                          {doc.campaign}
                        </div>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full"
                        style={{ fontSize: '11px', fontWeight: 600, color: cfg.color, background: cfg.bg }}
                      >
                        {doc.type}
                      </span>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full"
                        style={{ fontSize: '11px', fontWeight: 600, color: stsCfg.color, background: stsCfg.bg }}
                      >
                        {stsCfg.label}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {formatDate(doc.uploadDate)} · {doc.size}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleView(doc)}
                          className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedDocument && (
        <DocumentViewerModal
          isOpen={showViewer}
          onClose={() => { setShowViewer(false); setSelectedDocument(null); }}
          document={selectedDocument}
        />
      )}

      <UploadZoneModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />

      {/* Click-away to close menu */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </>
  );
}