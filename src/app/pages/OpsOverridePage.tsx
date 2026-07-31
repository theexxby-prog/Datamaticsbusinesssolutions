import { useState, useMemo, useEffect } from 'react';
import { TableRow } from '../components/TableRow';
import { MobileCardList } from '../components/ui/MobileCardList';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Edit3, 
  Save, 
  X, 
  Lock, 
  ShieldAlert, 
  CheckCircle2, 
  Mail, 
  Activity, 
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { allClients, saveCampaignOverride, applyCampaignOverrides, type Campaign } from '../data/mockClients';

// Flatten all campaigns from allClients with client data attached
type FlatCampaign = Campaign & { 
  clientName: string; 
  clientId: string; 
  clientIndustry: string;
  leadAcceptanceMethod: string;
};

function getAllCampaigns(): FlatCampaign[] {
  const result: FlatCampaign[] = [];
  for (const client of allClients) {
    for (const campaign of client.campaigns) {
      result.push({ 
        ...campaign, 
        clientName: client.companyName, 
        clientId: client.id, 
        clientIndustry: client.industry,
        leadAcceptanceMethod: client.leadAcceptanceMethod
      });
    }
  }
  return result;
}

function statusBadgeClass(s: string) {
  switch (s) {
    case 'active':           return 'badge badge-active';
    case 'completed':        return 'badge badge-completed';
    case 'paused':           return 'badge badge-paused';
    case 'pending_approval': return 'badge';
    default:                 return 'badge';
  }
}

function statusLabel(s: string) {
  switch (s) {
    case 'active':           return 'Active';
    case 'completed':        return 'Completed';
    case 'paused':           return 'Paused';
    case 'pending_approval': return 'Pending Approval';
    default:                 return s;
  }
}

export default function OpsOverridePage() {
  const { currentUser } = useAuth();
  const isOpsManager = currentUser.role === 'ops_manager';
  
  // Local list refresh trigger
  const [listTrigger, setListTrigger] = useState(0);
  
  // Grid filters and state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [clientFilter, setClientFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<string>('client');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Selected campaign for override drawer
  const [selectedCampaign, setSelectedCampaign] = useState<FlatCampaign | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Drawer form state
  const [emailsSent, setEmailsSent] = useState<string>('');
  const [emailsOpened, setEmailsOpened] = useState<string>('');
  const [emailsClicked, setEmailsClicked] = useState<string>('');
  const [uploadedLeads, setUploadedLeads] = useState<string>('');
  const [acceptedLeads, setAcceptedLeads] = useState<string>('');
  const [targetLeads, setTargetLeads] = useState<string>('');
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load all campaigns reactively on listTrigger change
  const campaignsList = useMemo(() => {
    return getAllCampaigns();
  }, [listTrigger]);

  // Unique client list for dropdown filtering
  const clientNames = useMemo(() => {
    return Array.from(new Set(campaignsList.map(c => c.clientName))).sort();
  }, [campaignsList]);

  // Handle Sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />;
  };

  // Filtered and sorted campaigns
  const filteredCampaigns = useMemo(() => {
    return campaignsList
      .filter(campaign => {
        const matchesSearch =
          campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          campaign.clientName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || campaign.status === statusFilter;
        const matchesClient = clientFilter === 'All' || campaign.clientName === clientFilter;
        return matchesSearch && matchesStatus && matchesClient;
      })
      .sort((a, b) => {
        let aVal: any, bVal: any;
        switch (sortField) {
          case 'name':     aVal = a.name;    bVal = b.name;    break;
          case 'client':   aVal = a.clientName; bVal = b.clientName; break;
          case 'status':   aVal = a.status;  bVal = b.status;  break;
          case 'method':   aVal = a.leadAcceptanceMethod; bVal = b.leadAcceptanceMethod; break;
          default:         return 0;
        }
        if (typeof aVal === 'string') {
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
  }, [campaignsList, searchQuery, statusFilter, clientFilter, sortField, sortOrder]);

  // Sync inputs with selected campaign when it changes
  useEffect(() => {
    if (selectedCampaign) {
      setEmailsSent(String(selectedCampaign.outreachMetrics?.emailsSent ?? 0));
      setEmailsOpened(String(selectedCampaign.outreachMetrics?.emailsOpened ?? 0));
      setEmailsClicked(String(selectedCampaign.outreachMetrics?.emailsClicked ?? 0));
      setUploadedLeads(String(selectedCampaign.convertrMetrics?.uploadedLeads ?? selectedCampaign.deliveredLeads ?? selectedCampaign.delivered ?? 0));
      setAcceptedLeads(String(selectedCampaign.convertrMetrics?.acceptedLeads ?? selectedCampaign.deliveredLeads ?? selectedCampaign.delivered ?? 0));
      setTargetLeads(String(selectedCampaign.target ?? selectedCampaign.goalLeads ?? 100));
    }
  }, [selectedCampaign]);

  // Live calculated rates
  const liveSent = Math.max(0, parseInt(emailsSent) || 0);
  const liveOpened = Math.max(0, parseInt(emailsOpened) || 0);
  const liveClicked = Math.max(0, parseInt(emailsClicked) || 0);
  const liveUploaded = Math.max(0, parseInt(uploadedLeads) || 0);
  const liveAccepted = Math.max(0, parseInt(acceptedLeads) || 0);
  const liveTarget = Math.max(1, parseInt(targetLeads) || 1);

  // Dynamic Funnel calculations
  const liveOpenRate = liveSent > 0 ? Math.round((liveOpened / liveSent) * 1000) / 10 : 0;
  const liveCTR = liveSent > 0 ? Math.round((liveClicked / liveSent) * 1000) / 10 : 0;
  const liveCTOR = liveOpened > 0 ? Math.round((liveClicked / liveOpened) * 1000) / 10 : 0;
  const liveAcceptanceRate = liveUploaded > 0 ? Math.round((liveAccepted / liveUploaded) * 100) : 0;
  const livePaceRate = liveTarget > 0 ? Math.round((liveAccepted / liveTarget) * 100) : 0;

  // Validation checks
  const validationErrors = useMemo(() => {
    const errs = {
      opened: '',
      clicked: '',
      accepted: ''
    };
    if (liveOpened > liveSent) {
      errs.opened = 'Emails Opened cannot exceed Emails Sent';
    }
    if (liveClicked > liveOpened) {
      errs.clicked = 'Emails Clicked cannot exceed Emails Opened';
    }
    if (liveAccepted > liveUploaded) {
      errs.accepted = 'Accepted Leads cannot exceed Uploaded Leads';
    }
    return errs;
  }, [liveSent, liveOpened, liveClicked, liveUploaded, liveAccepted]);

  const hasErrors = Object.values(validationErrors).some(err => err !== '');

  // Trigger Toast Notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Handle Save
  const handleSave = () => {
    if (!selectedCampaign || !isOpsManager || hasErrors) return;

    saveCampaignOverride(selectedCampaign.id, {
      deliveredLeads: liveAccepted,
      targetLeads: liveTarget,
      acceptanceRate: liveAcceptanceRate,
      outreachMetrics: {
        emailsSent: liveSent,
        emailsOpened: liveOpened,
        emailsClicked: liveClicked,
        openRate: liveOpenRate,
        clickRate: liveCTR,
      },
      convertrMetrics: {
        uploadedLeads: liveUploaded,
        acceptedLeads: liveAccepted,
      }
    });

    // Refresh memory
    applyCampaignOverrides();
    setListTrigger(prev => prev + 1);
    
    setIsDrawerOpen(false);
    triggerToast(`🎉 Metrics for "${selectedCampaign.name}" updated successfully! Client portals synced.`);
  };

  const openEditDrawer = (camp: FlatCampaign) => {
    setSelectedCampaign(camp);
    setIsDrawerOpen(true);
  };

  return (
    <>
      <div className="max-w-[1440px] mx-auto page-content relative min-h-screen">
        
        {/* Dynamic Toast Message */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-[var(--color-surface-inverse)]/95 border border-[var(--color-primary)]/40 shadow-2xl backdrop-blur-xl text-[var(--color-text-inverse)] px-6 py-4 rounded-2xl flex items-center gap-3.5 w-[calc(100vw-32px)] max-w-[500px] sm:w-auto sm:min-w-[320px]"
            >
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-xs font-semibold tracking-wide leading-relaxed">{toastMessage}</span>
              <button onClick={() => setToastMessage(null)} className="ml-auto text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Title Section */}
        <div className="mb-5">
          <h1 style={{ color: 'var(--color-text-primary)' }} className="mb-2">Campaign Metrics Override</h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Operations Override Center with live API data and backend persistence.
            {!isOpsManager && ' You have view-only rights (Read-Only Mode).'}
          </p>
        </div>

        {/* Filters Controls Panel */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search campaigns or clients…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base w-full pl-10 pr-4 py-3"
            />
          </div>

          <div className="md:col-span-3 relative">
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="input-base w-full px-4 py-3 appearance-none"
            >
              <option value="All">All Clients</option>
              {clientNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
          </div>

          <div className="md:col-span-3 relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-base w-full px-4 py-3 appearance-none"
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
          </div>
        </div>

        {/* Master Campaign Grid Table */}
        <div className="glass-card overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="table-header">
                <tr>
                  <th className="table-th cursor-pointer hover:text-[var(--color-primary)] transition-colors" onClick={() => handleSort('client')}>
                    <div className="flex items-center gap-1">Client <SortIcon field="client" /></div>
                  </th>
                  <th className="table-th cursor-pointer hover:text-[var(--color-primary)] transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">Campaign <SortIcon field="name" /></div>
                  </th>
                  <th className="table-th cursor-pointer hover:text-[var(--color-primary)] transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">Status <SortIcon field="status" /></div>
                  </th>
                  <th className="table-th cursor-pointer hover:text-[var(--color-primary)] transition-colors text-center" onClick={() => handleSort('method')}>
                    <div className="flex items-center justify-center gap-1">Method <SortIcon field="method" /></div>
                  </th>
                  <th className="table-th text-right">Outreach (Sent/Open/Click)</th>
                  <th className="table-th text-right">Leads (Upload/Accept)</th>
                  <th className="table-th text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((camp, index) => {
                  const sent = camp.outreachMetrics?.emailsSent ?? 0;
                  const opened = camp.outreachMetrics?.emailsOpened ?? 0;
                  const clicked = camp.outreachMetrics?.emailsClicked ?? 0;
                  
                  const uploaded = camp.convertrMetrics?.uploadedLeads ?? camp.deliveredLeads ?? camp.delivered ?? 0;
                  const accepted = camp.convertrMetrics?.acceptedLeads ?? camp.deliveredLeads ?? camp.delivered ?? 0;
                  const target = camp.target ?? camp.goalLeads ?? 100;

                  return (
                    <TableRow
                      key={camp.id}
                      showHoverEffect={true}
                      animationDelay={index * 30}
                      onClick={() => openEditDrawer(camp)}
                    >
                      <td className="table-td">
                        <div className="t1">{camp.clientName}</div>
                        <div className="t3 mt-0.5">{camp.clientIndustry}</div>
                      </td>
                      <td className="table-td">
                        <div className="t2 font-semibold">{camp.name}</div>
                        <div className="t3 mt-0.5">{camp.startDate || 'No start date'}</div>
                      </td>
                      <td className="table-td">
                        <span className={statusBadgeClass(camp.status)}>
                          {statusLabel(camp.status)}
                        </span>
                      </td>
                      <td className="table-td text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase ${
                          camp.leadAcceptanceMethod === 'convertr' 
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/20' 
                            : 'bg-gray-50 text-gray-700'
                        }`}>
                          {camp.leadAcceptanceMethod === 'convertr' ? '⚡ Convertr' : '📁 Manual'}
                        </span>
                      </td>
                      <td className="table-td text-right">
                        {sent > 0 ? (
                          <div>
                            <div className="t2 font-medium">{sent.toLocaleString()} sent</div>
                            <div className="t3 mt-0.5">
                              {opened.toLocaleString()} ({camp.outreachMetrics?.openRate ?? 0}%) · {clicked.toLocaleString()} ({camp.outreachMetrics?.clickRate ?? 0}%)
                            </div>
                          </div>
                        ) : (
                          <span className="text-[var(--color-text-muted)] text-xs italic">No email metrics</span>
                        )}
                      </td>
                      <td className="table-td text-right">
                        <div className="t2 font-medium">{accepted.toLocaleString()} / {target.toLocaleString()}</div>
                        <div className="t3 mt-0.5">
                          {uploaded > 0 ? `${uploaded.toLocaleString()} uploaded · ${camp.acceptanceRate}% accept` : 'No lead uploads'}
                        </div>
                      </td>
                      <td className="table-td text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEditDrawer(camp)}
                          className={`btn-ghost p-2 rounded-lg transition-all ${
                            isOpsManager ? 'hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10' : 'hover:text-blue-500 hover:bg-blue-500/10'
                          }`}
                          title={isOpsManager ? 'Edit Campaign Metrics' : 'View Campaign Metrics'}
                        >
                          {isOpsManager ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </td>
                    </TableRow>
                  );
                })}
              </tbody>
            </table>
          </div>

          <MobileCardList
            className="md:hidden p-4"
            rows={filteredCampaigns}
            getRowId={(camp) => camp.id}
            title={(camp) => camp.name}
            badge={(camp) => (
              <span className={statusBadgeClass(camp.status)}>
                {statusLabel(camp.status)}
              </span>
            )}
            fields={[
              { label: 'Client', value: (camp) => camp.clientName },
              {
                label: 'Method',
                value: (camp) => (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase ${
                    camp.leadAcceptanceMethod === 'convertr'
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/20'
                      : 'bg-gray-50 text-gray-700'
                  }`}>
                    {camp.leadAcceptanceMethod === 'convertr' ? '⚡ Convertr' : '📁 Manual'}
                  </span>
                ),
              },
              {
                label: 'Outreach',
                value: (camp) => {
                  const sent = camp.outreachMetrics?.emailsSent ?? 0;
                  const opened = camp.outreachMetrics?.emailsOpened ?? 0;
                  const clicked = camp.outreachMetrics?.emailsClicked ?? 0;
                  return sent > 0 ? (
                    <span>
                      <span className="font-medium">{sent.toLocaleString()} sent</span>
                      <span className="block text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {opened.toLocaleString()} ({camp.outreachMetrics?.openRate ?? 0}%) · {clicked.toLocaleString()} ({camp.outreachMetrics?.clickRate ?? 0}%)
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>No email metrics</span>
                  );
                },
              },
              {
                label: 'Leads',
                value: (camp) => {
                  const uploaded = camp.convertrMetrics?.uploadedLeads ?? camp.deliveredLeads ?? camp.delivered ?? 0;
                  const accepted = camp.convertrMetrics?.acceptedLeads ?? camp.deliveredLeads ?? camp.delivered ?? 0;
                  const target = camp.target ?? camp.goalLeads ?? 100;
                  return (
                    <span>
                      <span className="font-medium">{accepted.toLocaleString()} / {target.toLocaleString()}</span>
                      <span className="block text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {uploaded > 0 ? `${uploaded.toLocaleString()} uploaded · ${camp.acceptanceRate}% accept` : 'No lead uploads'}
                      </span>
                    </span>
                  );
                },
              },
            ]}
            onClick={(camp) => openEditDrawer(camp)}
            emptyMessage="No campaigns match your search filters."
          />

          {filteredCampaigns.length === 0 && (
            <div className="hidden md:block text-center py-10">
              <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                No campaigns match your search filters.
              </p>
            </div>
          )}
        </div>

        {/* Visual Edit Drawer (Sliding Sidebar Panel) */}
        <AnimatePresence>
          {isDrawerOpen && selectedCampaign && (
            <>
              {/* Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDrawerOpen(false)}
                className="fixed inset-0 bg-black z-40 backdrop-blur-xs"
              />

              {/* Drawer Sheet */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="fixed right-0 top-0 bottom-0 w-full max-w-[550px] bg-[var(--color-surface-raised)] border-l border-[var(--color-border)] z-50 shadow-2xl flex flex-col overflow-hidden"
              >
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between bg-gray-50/50">
                  <div>
                    <span className="text-[10px] font-bold text-[var(--color-primary)] tracking-wider uppercase">{selectedCampaign.clientName}</span>
                    <h2 className="text-lg font-bold truncate pr-4 max-w-[380px] mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                      {selectedCampaign.name}
                    </h2>
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content Container (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Security Alert Header */}
                  {isOpsManager ? (
                    <div className="p-4 rounded-xl bg-green-50/70 dark:bg-green-950/20 border border-green-200/30 flex gap-3">
                      <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <div className="text-xs font-bold text-green-800 dark:text-green-300">Live API Edit Mode</div>
                        <div className="text-[11px] text-green-700 dark:text-green-400/90 leading-relaxed mt-1">
                          Lead goal and validation metrics are read-only from backend. Only outreach metrics are editable.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/30 flex gap-3">
                      <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-blue-800 dark:text-blue-300">🔒 Read-Only Campaign View</div>
                        <div className="text-[11px] text-blue-700 dark:text-blue-400/90 leading-relaxed mt-1">
                          You are logged in as a Campaign Manager. You have view-only rights. Operations override adjustments must be done by **Praful Sanil**.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form - Input Controls */}
                  <div className="space-y-6">
                    
                    {/* Campaign Target Leads (Delivered Goal) */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Target Lead Goal</label>
                        <span className="text-xs font-bold text-[var(--color-primary)] dark:text-red-400">{liveTarget.toLocaleString()} / 5,000</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Read-only from backend (live API) — production parity */}
                        <input
                          type="range"
                          min="0"
                          max={5000}
                          disabled
                          value={Math.min(liveTarget, 5000)}
                          readOnly
                          className="flex-1 h-2 rounded-lg appearance-none bg-gray-200 accent-[var(--color-primary)] focus:outline-none disabled:opacity-40"
                        />
                        <input
                          type="number"
                          disabled
                          value={targetLeads}
                          readOnly
                          placeholder="0"
                          className="input-base w-28 px-3 py-2 text-center text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="border-t border-[var(--color-border)] my-4" />

                    {/* Email Outreach Performance Stats */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Mail className="w-4 h-4 text-indigo-500" />
                        <span>Email Outreach Metrics</span>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Emails Sent */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[11px] font-semibold text-gray-400">Emails Sent</label>
                            <span className="text-xs font-semibold text-gray-500">{liveSent.toLocaleString()} / 100,000</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              min="0"
                              max={100000}
                              disabled={!isOpsManager}
                              value={Math.min(liveSent, 100000)}
                              onChange={(e) => setEmailsSent(e.target.value)}
                              className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 accent-[var(--color-primary)] focus:outline-none"
                            />
                            <input
                              type="number"
                              disabled={!isOpsManager}
                              value={emailsSent}
                              onChange={(e) => setEmailsSent(e.target.value)}
                              className="input-base w-28 px-3 py-2 text-center text-sm font-semibold disabled:opacity-60"
                            />
                          </div>
                        </div>

                        {/* Emails Opened */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[11px] font-semibold text-gray-400">Emails Opened</label>
                            <span className="text-xs font-semibold text-gray-500">{liveOpened.toLocaleString()} / {liveSent.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              min="0"
                              max={liveSent}
                              disabled={!isOpsManager || liveSent === 0}
                              value={Math.min(liveOpened, liveSent)}
                              onChange={(e) => setEmailsOpened(e.target.value)}
                              className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 accent-[var(--color-primary)] focus:outline-none disabled:opacity-40"
                            />
                            <input
                              type="number"
                              disabled={!isOpsManager}
                              value={emailsOpened}
                              onChange={(e) => setEmailsOpened(e.target.value)}
                              className={`input-base w-28 px-3 py-2 text-center text-sm font-semibold disabled:opacity-60 ${
                                validationErrors.opened ? 'border-red-500 focus:ring-1 focus:ring-red-500' : ''
                              }`}
                            />
                          </div>
                        </div>

                        {/* Emails Clicked */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[11px] font-semibold text-gray-400">Emails Clicked</label>
                            <span className="text-xs font-semibold text-gray-500">{liveClicked.toLocaleString()} / {liveOpened.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              min="0"
                              max={liveOpened}
                              disabled={!isOpsManager || liveOpened === 0}
                              value={Math.min(liveClicked, liveOpened)}
                              onChange={(e) => setEmailsClicked(e.target.value)}
                              className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 accent-[var(--color-primary)] focus:outline-none disabled:opacity-40"
                            />
                            <input
                              type="number"
                              disabled={!isOpsManager}
                              value={emailsClicked}
                              onChange={(e) => setEmailsClicked(e.target.value)}
                              className={`input-base w-28 px-3 py-2 text-center text-sm font-semibold disabled:opacity-60 ${
                                validationErrors.clicked ? 'border-red-500 focus:ring-1 focus:ring-red-500' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Outreach Inline Errors */}
                      {(validationErrors.opened || validationErrors.clicked) && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/30 text-[11px] text-red-600 dark:text-red-400 flex items-start gap-2 leading-relaxed">
                          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                          <div className="flex-1">
                            {validationErrors.opened && <div>• {validationErrors.opened}</div>}
                            {validationErrors.clicked && <div>• {validationErrors.clicked}</div>}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[var(--color-border)] my-4" />

                    {/* Lead Validation & Delivery Stats */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        <span>Lead Validation Metrics (Read-Only)</span>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Uploaded Leads */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[11px] font-semibold text-gray-400">Uploaded Leads</label>
                            <span className="text-xs font-semibold text-gray-500">{liveUploaded.toLocaleString()} / 5,000</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              min="0"
                              max={5000}
                              disabled
                              value={Math.min(liveUploaded, 5000)}
                              readOnly
                              className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 accent-[var(--color-primary)] focus:outline-none"
                            />
                            <input
                              type="number"
                              disabled
                              value={uploadedLeads}
                              readOnly
                              className="input-base w-28 px-3 py-2 text-center text-sm font-semibold disabled:opacity-60"
                            />
                          </div>
                        </div>

                        {/* Accepted/Delivered Leads */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[11px] font-semibold text-gray-400">Accepted/Delivered Leads</label>
                            <span className="text-xs font-semibold text-gray-500">{liveAccepted.toLocaleString()} / {liveUploaded.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              min="0"
                              max={liveUploaded}
                              disabled
                              value={Math.min(liveAccepted, liveUploaded)}
                              readOnly
                              className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 accent-[var(--color-primary)] focus:outline-none disabled:opacity-40"
                            />
                            <input
                              type="number"
                              disabled
                              value={acceptedLeads}
                              readOnly
                              className={`input-base w-28 px-3 py-2 text-center text-sm font-semibold disabled:opacity-60 ${
                                validationErrors.accepted ? 'border-red-500 focus:ring-1 focus:ring-red-500' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Lead Inline Error */}
                      {validationErrors.accepted && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/30 text-[11px] text-red-600 dark:text-red-400 flex items-start gap-2 leading-relaxed">
                          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                          <div>• {validationErrors.accepted}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Real-time Client Dashboard Preview Funnel */}
                  <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Eye className="w-4 h-4" /> Live Client Funnel Preview
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400 bg-gray-200/50 px-2 py-0.5 rounded">
                        Calculated
                      </span>
                    </div>

                    {/* Vertical Funnel Visuals */}
                    <div className="space-y-2 text-xs font-semibold">
                      
                      {/* Sent */}
                      <div className="flex items-center gap-3">
                        <div className="w-20 text-[10px] text-gray-400 uppercase">1. Sent</div>
                        <div className="flex-1 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/10 rounded-xl p-3 flex justify-between items-center">
                          <span className="text-gray-800">{liveSent.toLocaleString()} emails</span>
                          <span className="text-indigo-600 dark:text-indigo-400 text-[11px]">100%</span>
                        </div>
                      </div>

                      {/* Opened */}
                      <div className="flex items-center gap-3">
                        <div className="w-20 text-[10px] text-gray-400 uppercase">2. Opened</div>
                        <div className="flex-1 ml-2 bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/10 rounded-xl p-3 flex justify-between items-center">
                          <span className="text-gray-800">{liveOpened.toLocaleString()} opens</span>
                          <span className="text-purple-600 dark:text-purple-400 text-[11px]">{liveOpenRate}% OR</span>
                        </div>
                      </div>

                      {/* Clicked */}
                      <div className="flex items-center gap-3">
                        <div className="w-20 text-[10px] text-gray-400 uppercase">3. Clicked</div>
                        <div className="flex-1 ml-4 bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border border-emerald-500/10 rounded-xl p-3 flex justify-between items-center">
                          <span className="text-gray-800">{liveClicked.toLocaleString()} clicks</span>
                          <div className="text-right">
                            <div className="text-emerald-600 dark:text-emerald-400 text-[11px]">{liveCTR}% CTR</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{liveCTOR}% CTOR</div>
                          </div>
                        </div>
                      </div>

                      {/* Delivered Leads */}
                      <div className="flex items-center gap-3">
                        <div className="w-20 text-[10px] text-gray-400 uppercase">4. Leads</div>
                        <div className="flex-1 ml-6 bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-primary-dark)]/10 border border-[var(--color-primary)]/15 rounded-xl p-3 flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-800">{liveAccepted.toLocaleString()} accepted</span>
                            <span className="text-[10px] bg-gray-200/40 text-gray-500 px-1.5 py-0.2 rounded font-normal">
                              Goal: {liveTarget}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-[var(--color-primary)] dark:text-red-400 text-[11px]">{liveAcceptanceRate}% Accept</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{livePaceRate}% of Goal</div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-[var(--color-border)] flex gap-3 bg-gray-50/50">
                  {isOpsManager ? (
                    <>
                      <button
                        onClick={() => setIsDrawerOpen(false)}
                        className="btn-ghost flex-1 py-3 text-sm font-semibold rounded-xl text-gray-700 border border-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={hasErrors}
                        className="btn flex-1 py-3 text-sm font-semibold rounded-xl text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsDrawerOpen(false)}
                      className="btn flex-1 py-3 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      Close Overview
                    </button>
                  )}
                </div>

              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}
