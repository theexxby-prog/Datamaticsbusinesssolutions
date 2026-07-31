import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Search,
  X,
  UserPlus,
  UserMinus,
  Users,
  Building2,
  Eye,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { allClients, Client } from '../data/mockClients';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { MobileCardList } from '../components/ui/MobileCardList';
import { useAuth } from '../context/AuthContext';

// Available team members for assignment
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'campaign_manager' | 'campaign_backup';
  currentClients: number;
}

const availableManagers: TeamMember[] = [
  { id: 'mgr_1', name: 'Brijesh Singh', email: 'brijesh.singh@datamaticsbpm.com', role: 'campaign_manager', currentClients: 3 },
  { id: 'mgr_2', name: 'Michael Chen', email: 'michael.chen@datamaticsbpm.com', role: 'campaign_manager', currentClients: 2 },
  { id: 'mgr_3', name: 'Emily Rodriguez', email: 'emily.rodriguez@datamaticsbpm.com', role: 'campaign_manager', currentClients: 1 },
];

const availableBackups: TeamMember[] = [
  { id: 'bkp_1', name: 'Arjun Patel', email: 'arjun.patel@datamaticsbpm.com', role: 'campaign_backup', currentClients: 3 },
  { id: 'bkp_2', name: 'Emily Rodriguez', email: 'emily.rodriguez@datamaticsbpm.com', role: 'campaign_backup', currentClients: 1 },
  { id: 'bkp_3', name: 'Michael Chen', email: 'michael.chen@datamaticsbpm.com', role: 'campaign_backup', currentClients: 2 },
];

export default function ClientAssignmentPage() {
  const navigate = useNavigate();
  const { currentUser, canManageTeam } = useAuth();

  // Local state so assignment changes are reflected immediately in the table
  const [clients, setClients] = useState<Client[]>(allClients);

  // ALL hooks must be declared before any conditional return (Rules of Hooks)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'assign' | 'transfer' | 'revoke'>('assign');
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedBackup, setSelectedBackup] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned'>('all');

  // Redirect if not authorized — AFTER all hooks
  if (!canManageTeam()) {
    navigate('/dashboard');
    return null;
  }

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.campaignManager.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.backupManager.toLowerCase().includes(searchQuery.toLowerCase());

      const hasAssignment = client.campaignManagerEmail && client.backupManagerEmail;
      
      if (filterStatus === 'assigned' && !hasAssignment) return false;
      if (filterStatus === 'unassigned' && hasAssignment) return false;

      return matchesSearch;
    });
  }, [clients, searchQuery, filterStatus]);

  // Stats — derived from live clients state
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const assignedClients = clients.filter(c => c.campaignManagerEmail && c.backupManagerEmail).length;
    const activeClients = clients.filter(c => c.status === 'active').length;
    const unassignedClients = totalClients - assignedClients;

    return { totalClients, assignedClients, activeClients, unassignedClients };
  }, [clients]);

  // Handle assignment actions
  const handleOpenAssignModal = (client: Client, type: 'assign' | 'transfer' | 'revoke') => {
    setSelectedClient(client);
    setAssignmentType(type);
    
    if (type === 'transfer') {
      // Pre-populate with current assignments
      const currentManager = availableManagers.find(m => m.email === client.campaignManagerEmail);
      const currentBackup = availableBackups.find(b => b.email === client.backupManagerEmail);
      setSelectedManager(currentManager?.id || '');
      setSelectedBackup(currentBackup?.id || '');
    } else {
      setSelectedManager('');
      setSelectedBackup('');
    }
    
    setShowAssignModal(true);
  };

  const handleCloseModal = () => {
    setShowAssignModal(false);
    setSelectedClient(null);
    setSelectedManager('');
    setSelectedBackup('');
  };

  const handleSubmitAssignment = () => {
    if (assignmentType === 'revoke') {
      setClients(prev =>
        prev.map(c =>
          c.id === selectedClient?.id
            ? { ...c, campaignManager: '—', campaignManagerEmail: '', backupManager: '—', backupManagerEmail: '' }
            : c
        )
      );
      toast.success(`Assignment revoked for ${selectedClient?.companyName}`);
    } else {
      const mgr = availableManagers.find(m => m.id === selectedManager);
      const bak = availableBackups.find(b => b.id === selectedBackup);
      setClients(prev =>
        prev.map(c =>
          c.id === selectedClient?.id
            ? {
                ...c,
                campaignManager:      mgr?.name  ?? c.campaignManager,
                campaignManagerEmail: mgr?.email ?? c.campaignManagerEmail,
                backupManager:        bak?.name  ?? c.backupManager,
                backupManagerEmail:   bak?.email ?? c.backupManagerEmail,
              }
            : c
        )
      );
      toast.success(
        assignmentType === 'assign'
          ? `Team assigned to ${selectedClient?.companyName}`
          : `Assignment transferred for ${selectedClient?.companyName}`
      );
    }
    handleCloseModal();
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <div className="max-w-[1440px] mx-auto page-content">
        {/* Header */}
        <div className="mb-4">
          <h1 style={{ color: 'var(--color-text-primary)' }} className="mb-2">
            Client Assignment Management
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Assign clients to campaign managers and backups, transfer assignments, and manage team workload
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 stagger-children">
          <motion.div
            className="kpi-card animate-slideInUp"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-info-bg)' }}
              >
                <Building2 className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
              </div>
            </div>
            <div className="kpi-card__number">
              <AnimatedCounter value={stats.totalClients} />
            </div>
            <div className="kpi-card__label">Total Clients</div>
          </motion.div>

          <motion.div
            className="kpi-card animate-slideInUp"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-success-bg)' }}
              >
                <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
              </div>
            </div>
            <div className="kpi-card__number">
              <AnimatedCounter value={stats.assignedClients} />
            </div>
            <div className="kpi-card__label">Assigned Clients</div>
          </motion.div>

          <motion.div
            className="kpi-card animate-slideInUp"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-primary-tint)' }}
              >
                <Users className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              </div>
            </div>
            <div className="kpi-card__number">
              <AnimatedCounter value={stats.activeClients} />
            </div>
            <div className="kpi-card__label">Active Clients</div>
          </motion.div>

          <motion.div
            className="kpi-card animate-slideInUp"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-warning-bg)' }}
              >
                <AlertCircle className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
              </div>
            </div>
            <div className="kpi-card__number">
              <AnimatedCounter value={stats.unassignedClients} />
            </div>
            <div className="kpi-card__label">Unassigned</div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="glass-card mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--color-text-tertiary)' }}
              />
              <input
                type="text"
                placeholder="Search by company, industry, or manager..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border transition-all"
                style={{
                  background: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm)',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--color-border-light)] rounded transition-colors"
                >
                  <X className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2.5 rounded-lg transition-all ${
                  filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'
                }`}
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('assigned')}
                className={`px-4 py-2.5 rounded-lg transition-all ${
                  filterStatus === 'assigned' ? 'btn-primary' : 'btn-secondary'
                }`}
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                Assigned
              </button>
              <button
                onClick={() => setFilterStatus('unassigned')}
                className={`px-4 py-2.5 rounded-lg transition-all ${
                  filterStatus === 'unassigned' ? 'btn-primary' : 'btn-secondary'
                }`}
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                Unassigned
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Showing {filteredClients.length} of {allClients.length} clients
            </p>
          </div>
        </div>

        {/* Clients Table */}
        <div className="glass-card overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead
                style={{
                  background: 'var(--color-border-light)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <tr>
                  <th
                    className="text-left px-6 py-3"
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--letter-spacing-wide)',
                    }}
                  >
                    Client
                  </th>
                  <th
                    className="text-left px-6 py-3"
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--letter-spacing-wide)',
                    }}
                  >
                    Campaign Manager
                  </th>
                  <th
                    className="text-left px-6 py-3"
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--letter-spacing-wide)',
                    }}
                  >
                    Backup Manager
                  </th>
                  <th
                    className="text-left px-6 py-3"
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--letter-spacing-wide)',
                    }}
                  >
                    Status
                  </th>
                  <th
                    className="text-left px-6 py-3"
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--letter-spacing-wide)',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client, index) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-[var(--color-border-light)] transition-colors"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    {/* Client Info */}
                    <td className="px-6 py-3">
                      <div>
                        <div
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {client.companyName}
                        </div>
                        <div
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          {client.industry}
                        </div>
                        <div
                          className="mt-1"
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-text-tertiary)',
                          }}
                        >
                          {client.totalLeads.toLocaleString()} leads • Last active {formatDate(client.lastActivity)}
                        </div>
                      </div>
                    </td>

                    {/* Campaign Manager */}
                    <td className="px-6 py-3">
                      {client.campaignManagerEmail ? (
                        <div>
                          <div
                            style={{
                              fontSize: 'var(--font-size-sm)',
                              fontWeight: 'var(--font-weight-medium)',
                              color: 'var(--color-text-primary)',
                            }}
                          >
                            {client.campaignManager}
                          </div>
                          <div
                            className="flex items-center gap-1 mt-1"
                            style={{
                              fontSize: 'var(--font-size-xs)',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            <Mail className="w-3 h-3" />
                            {client.campaignManagerEmail}
                          </div>
                        </div>
                      ) : (
                        <span
                          className="badge"
                          style={{
                            background: 'var(--color-warning-bg)',
                            color: 'var(--color-warning)',
                          }}
                        >
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Backup Manager */}
                    <td className="px-6 py-3">
                      {client.backupManagerEmail ? (
                        <div>
                          <div
                            style={{
                              fontSize: 'var(--font-size-sm)',
                              fontWeight: 'var(--font-weight-medium)',
                              color: 'var(--color-text-primary)',
                            }}
                          >
                            {client.backupManager}
                          </div>
                          <div
                            className="flex items-center gap-1 mt-1"
                            style={{
                              fontSize: 'var(--font-size-xs)',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            <Mail className="w-3 h-3" />
                            {client.backupManagerEmail}
                          </div>
                        </div>
                      ) : (
                        <span
                          className="badge"
                          style={{
                            background: 'var(--color-warning-bg)',
                            color: 'var(--color-warning)',
                          }}
                        >
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-3">
                      <span
                        className={`badge badge-${client.status === 'active' ? 'active' : client.status === 'paused' ? 'paused' : 'completed'}`}
                      >
                        {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        {client.campaignManagerEmail && client.backupManagerEmail ? (
                          <>
                            <button
                              onClick={() => handleOpenAssignModal(client, 'transfer')}
                              className="btn-ghost p-2"
                              title="Transfer Assignment"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenAssignModal(client, 'revoke')}
                              className="btn-ghost p-2 hover:!text-red-600"
                              title="Revoke Assignment"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleOpenAssignModal(client, 'assign')}
                            className="btn-primary px-3 py-1.5"
                            style={{ fontSize: 'var(--font-size-xs)' }}
                          >
                            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                            Assign Team
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/internal/campaigns/${client.campaigns[0]?.id}`)}
                          className="btn-ghost p-2"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <MobileCardList
            className="md:hidden p-4"
            rows={filteredClients}
            getRowId={(client) => client.id}
            title={(client) => (
              <div>
                <div>{client.companyName}</div>
                <div className="text-xs font-normal" style={{ color: 'var(--color-text-secondary)' }}>
                  {client.industry}
                </div>
              </div>
            )}
            badge={(client) => (
              <span
                className={`badge badge-${client.status === 'active' ? 'active' : client.status === 'paused' ? 'paused' : 'completed'}`}
              >
                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </span>
            )}
            fields={[
              {
                label: 'Campaign Manager',
                value: (client) =>
                  client.campaignManagerEmail ? (
                    client.campaignManager
                  ) : (
                    <span className="badge" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
                      Unassigned
                    </span>
                  ),
              },
              {
                label: 'Backup Manager',
                value: (client) =>
                  client.backupManagerEmail ? (
                    client.backupManager
                  ) : (
                    <span className="badge" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
                      Unassigned
                    </span>
                  ),
              },
              { label: 'Campaigns', value: (client) => client.campaigns.length },
              { label: 'Leads', value: (client) => client.totalLeads.toLocaleString() },
            ]}
            actions={(client) => (
              <>
                {client.campaignManagerEmail && client.backupManagerEmail ? (
                  <>
                    <button
                      onClick={() => handleOpenAssignModal(client, 'transfer')}
                      className="btn-ghost px-3 py-2 flex items-center gap-1.5"
                      style={{ fontSize: 'var(--font-size-xs)' }}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Transfer
                    </button>
                    <button
                      onClick={() => handleOpenAssignModal(client, 'revoke')}
                      className="btn-ghost px-3 py-2 flex items-center gap-1.5 hover:!text-red-600"
                      style={{ fontSize: 'var(--font-size-xs)' }}
                    >
                      <UserMinus className="w-4 h-4" />
                      Revoke
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleOpenAssignModal(client, 'assign')}
                    className="btn-primary px-3 py-2"
                    style={{ fontSize: 'var(--font-size-xs)' }}
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Assign Team
                  </button>
                )}
                <button
                  onClick={() => navigate(`/internal/campaigns/${client.campaigns[0]?.id}`)}
                  className="btn-ghost px-3 py-2 flex items-center gap-1.5"
                  style={{ fontSize: 'var(--font-size-xs)' }}
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
              </>
            )}
          />

          {/* Empty State */}
          {filteredClients.length === 0 && (
            <div className="py-8 text-center">
              <Building2
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: 'var(--color-text-tertiary)' }}
              />
              <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                No clients found
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      <AnimatePresence>
        {showAssignModal && selectedClient && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
              onClick={handleCloseModal}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-[101]"
            >
              <div className="glass-card mx-4 p-6 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                      {assignmentType === 'assign' && 'Assign Client Team'}
                      {assignmentType === 'transfer' && 'Transfer Client Assignment'}
                      {assignmentType === 'revoke' && 'Revoke Client Assignment'}
                    </h2>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                      {selectedClient.companyName}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="btn-ghost p-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {assignmentType !== 'revoke' ? (
                  <div className="space-y-6">
                    {/* Campaign Manager Selection */}
                    <div>
                      <label
                        className="block mb-2"
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        Campaign Manager
                      </label>
                      <select
                        value={selectedManager}
                        onChange={(e) => setSelectedManager(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border transition-all"
                        style={{
                          background: 'var(--color-bg-primary)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-primary)',
                          fontSize: 'var(--font-size-sm)',
                        }}
                      >
                        <option value="">Select a campaign manager...</option>
                        {availableManagers.map((manager) => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name} ({manager.email}) - {manager.currentClients} clients
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Backup Manager Selection */}
                    <div>
                      <label
                        className="block mb-2"
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        Backup Manager
                      </label>
                      <select
                        value={selectedBackup}
                        onChange={(e) => setSelectedBackup(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border transition-all"
                        style={{
                          background: 'var(--color-bg-primary)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-primary)',
                          fontSize: 'var(--font-size-sm)',
                        }}
                      >
                        <option value="">Select a backup manager...</option>
                        {availableBackups.map((backup) => (
                          <option key={backup.id} value={backup.id}>
                            {backup.name} ({backup.email}) - {backup.currentClients} clients
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Current Assignment Info (for transfer) */}
                    {assignmentType === 'transfer' && (
                      <div
                        className="p-4 rounded-lg"
                        style={{
                          background: 'var(--color-info-bg)',
                          border: '1px solid var(--color-info)',
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle
                            className="w-5 h-5 flex-shrink-0 mt-0.5"
                            style={{ color: 'var(--color-info)' }}
                          />
                          <div>
                            <p
                              style={{
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 'var(--font-weight-semibold)',
                                color: 'var(--color-text-primary)',
                                marginBottom: '4px',
                              }}
                            >
                              Current Assignment
                            </p>
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                              Manager: {selectedClient.campaignManager}
                              <br />
                              Backup: {selectedClient.backupManager}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                      <button onClick={handleCloseModal} className="btn-secondary px-6 py-2.5">
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitAssignment}
                        disabled={!selectedManager || !selectedBackup}
                        className="btn-primary px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {assignmentType === 'assign' ? 'Assign Team' : 'Transfer Assignment'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Revoke Warning */}
                    <div
                      className="p-4 rounded-lg"
                      style={{
                        background: 'var(--color-error-bg)',
                        border: '1px solid var(--color-error)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle
                          className="w-5 h-5 flex-shrink-0 mt-0.5"
                          style={{ color: 'var(--color-error)' }}
                        />
                        <div>
                          <p
                            style={{
                              fontSize: 'var(--font-size-sm)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--color-text-primary)',
                              marginBottom: '4px',
                            }}
                          >
                            Are you sure you want to revoke this assignment?
                          </p>
                          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                            This will remove both the campaign manager and backup manager from {selectedClient.companyName}.
                            The client will become unassigned and no team member will have access to their campaigns.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Current Team */}
                    <div>
                      <p
                        className="mb-3"
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        Current Team
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--color-border-light)' }}>
                          <div>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                              {selectedClient.campaignManager}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                              Campaign Manager
                            </div>
                          </div>
                          <Mail className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--color-border-light)' }}>
                          <div>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                              {selectedClient.backupManager}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                              Backup Manager
                            </div>
                          </div>
                          <Mail className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                      <button onClick={handleCloseModal} className="btn-secondary px-6 py-2.5">
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitAssignment}
                        className="px-6 py-2.5 rounded-lg transition-all"
                        style={{
                          background: 'var(--color-error)',
                          color: 'white',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                        }}
                      >
                        Revoke Assignment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}