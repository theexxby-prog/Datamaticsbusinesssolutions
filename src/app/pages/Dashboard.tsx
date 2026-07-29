import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Target,
  DollarSign,
  Search,
  Circle,
  CheckCircle2,
  Pause,
  Clock,
  FolderOpen,
  Plus,
  BarChart2,
  ChevronDown,
  X,
  ChevronUp,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { type Campaign, getAccountTeam, allClients } from '../data/mockClients';
import { AppLayout } from '../components/AppLayout';
import { TableRow } from '../components/TableRow';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { NewCampaignModal, CampaignFormData } from '../components/NewCampaignModal';
import { EmptyState } from '../components/EmptyState';
import { AccountTeam } from '../components/AccountTeam';
import { CampaignHealthBadge } from '../components/CampaignHealthBadge';
import { getCampaignHealth } from '../utils/campaignHealth';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { TableSkeleton } from '../components/SkeletonLoader';
import { getPersonPhoto } from '../data/personPhotos';

// Mock sparkline data for trend visualization
const generateSparklineData = (baseValue: number, trend: 'up' | 'down' = 'up') => {
  return Array.from({ length: 12 }, (_, i) => ({
    value: trend === 'up' 
      ? baseValue * (0.7 + (i * 0.025) + Math.random() * 0.1)
      : baseValue * (1.3 - (i * 0.025) + Math.random() * 0.1)
  }));
};

export default function Dashboard() {
  useDocumentTitle('My Campaigns');
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState('All');
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  
  // Individual time period states for each card
  const [campaignsPeriod, setCampaignsPeriod] = useState<'1d' | '1w' | '1m' | '1y'>('1m');
  const [leadsPeriod, setLeadsPeriod] = useState<'1d' | '1w' | '1m' | '1y'>('1m');
  const [spendPeriod, setSpendPeriod] = useState<'1d' | '1w' | '1m' | '1y'>('1m');

  const accountTeam = getAccountTeam('client_1');

  // Get all campaigns flattened
  const allCampaignsFlat = useMemo(() => {
    const campaigns: Array<import('../data/mockClients').Campaign & { clientName: string }> = [];
    allClients.forEach(client => {
      client.campaigns.forEach(campaign => {
        campaigns.push({ ...campaign, clientName: client.companyName });
      });
    });
    return campaigns;
  }, []);
  
  // For client users, only show their own company's campaigns (The Channel Company = client_1)
  // NOTE: defined BEFORE baseCampaigns so KPI cards are correctly scoped to this client.
  const isClientRole = currentUser?.role === 'client';
  const tccClient = allClients.find(c => c.id === 'client_1');

  // Base data — scoped to the client's own campaigns when in client role
  const clientCampaigns = tccClient?.campaigns ?? [];
  const baseCampaigns = isClientRole
    ? clientCampaigns.filter((c) => c.status === 'active').length
    : allCampaignsFlat.filter((c) => c.status === 'active').length;
  const baseLeadsMonthly = isClientRole
    ? clientCampaigns.reduce((sum, c) => sum + (c.delivered || 0), 0)
    : allCampaignsFlat.reduce((sum, c) => sum + (c.delivered || 0), 0);
  const baseSpendMonthly = 24500;

  // Calculate metrics based on period
  const getMultiplier = (period: '1d' | '1w' | '1m' | '1y') => {
    return period === '1d' ? 0.033 : period === '1w' ? 0.25 : period === '1m' ? 1 : 12;
  };
  
  const getPeriodLabel = (period: '1d' | '1w' | '1m' | '1y') => {
    return period === '1d' ? 'TODAY' : period === '1w' ? 'THIS WEEK' : period === '1m' ? 'THIS MONTH' : 'THIS YEAR';
  };

  const activeCampaigns = Math.round(baseCampaigns * getMultiplier(campaignsPeriod));
  const totalLeadsDelivered = Math.round(baseLeadsMonthly * getMultiplier(leadsPeriod));
  const totalSpend = Math.round(baseSpendMonthly * getMultiplier(spendPeriod));

  // Sparkline data — memoized per period to avoid re-rolling Math.random() on unrelated re-renders
  const campaignsData = useMemo(() => generateSparklineData(activeCampaigns, 'up'), [activeCampaigns]);
  const leadsData = useMemo(() => generateSparklineData(totalLeadsDelivered / 12, 'up'), [totalLeadsDelivered]);
  const spendData = useMemo(() => generateSparklineData(totalSpend / 12, 'down'), [totalSpend]);

  // For client users, only show their own company's campaigns (The Channel Company = client_1)
  const visibleCampaigns = isClientRole
    ? (tccClient?.campaigns.map(c => ({ ...c, clientName: tccClient.companyName })) ?? [])
    : allCampaignsFlat;

  const filteredCampaigns = visibleCampaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesStatus = statusFilter === 'All' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pending approval campaigns for the banner
  const pendingApprovalCampaigns = visibleCampaigns.filter(c => c.status === 'pending_approval');

  const getStatusPill = (status: string) => {
    const config = {
      'active': {
        classes: 'badge badge-active',
        icon: Circle,
        hasPulse: true,
      },
      'completed': {
        classes: 'badge badge-completed',
        icon: CheckCircle2,
        hasPulse: false,
      },
      'paused': {
        classes: 'badge badge-paused',
        icon: Pause,
        hasPulse: false,
      },
      'pending_approval': {
        classes: 'badge',
        icon: Clock,
        hasPulse: true,
      },
    };

    const statusConfig = config[status as keyof typeof config] || config['paused'];
    const Icon = statusConfig.icon;

    if (status === 'pending_approval') {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: 'rgba(186,32,39,0.10)',
            color: '#BA2027',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <Icon className="w-3.5 h-3.5 animate-pulse" />
          Pending Approval
        </span>
      );
    }

    return (
      <span className={statusConfig.classes}>
        <Icon className={`w-3.5 h-3.5 ${statusConfig.hasPulse ? 'animate-pulse' : ''}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto page-content space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1>My Campaigns</h1>
            </div>
            <p className="text-sm text-[#6B7280]">
              Track and manage all your active campaigns
            </p>
          </div>
          <motion.button
            onClick={() => setIsNewCampaignModalOpen(true)}
            className="btn-primary flex items-center gap-2 px-6 py-3 w-full sm:w-auto justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            Start a Campaign
          </motion.button>
        </div>

        {/* KPI Cards - REDESIGNED WITH INTERACTIVITY */}
        <div className={`grid grid-cols-2 gap-4 md:gap-6 stagger-children ${pendingApprovalCampaigns.length > 0 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
          {/* Active Campaigns Card */}
          <motion.div 
            key={`campaigns-${campaignsPeriod}`}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-3 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">ACTIVE CAMPAIGNS</h5>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-blue-500" />
              </div>
            </div>

            {/* PROMINENT TIME SELECTOR */}
            <div className="flex items-center gap-0.5 mb-4 p-1 bg-[#F3F4F6] rounded-lg w-full">
              {(['1d', '1w', '1m', '1y'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => {
                    setCampaignsPeriod(period);
                  }}
                  className={`flex-1 py-1 rounded-md text-xs font-bold uppercase transition-all text-center ${ campaignsPeriod === period ? 'bg-[#BA2027] text-white shadow-md' : 'bg-transparent text-[#6B7280] hover:bg-[#BA2027] hover:text-white' }`}
                  style={{ fontSize: '9px' }}
                >
                  {period === '1d' ? 'Day' : period === '1w' ? 'Week' : period === '1m' ? 'Month' : 'Year'}
                </button>
              ))}
            </div>
            
            <div className="font-bold text-[#1A1A1A] tracking-tight leading-none mb-2" style={{ fontSize: 'clamp(22px, 5vw, 36px)' }}>
              <AnimatedCounter end={activeCampaigns} duration={1500} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#059669]">
                <TrendingUp className="w-3 h-3" />+8%
              </span>
              <span className="text-xs text-[#6B7280]">vs previous period</span>
            </div>
          </motion.div>

          {/* Total Leads Card - WITH INTERACTIVE BUTTONS */}
          <motion.div 
            key={`leads-${leadsPeriod}`}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-3 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider truncate mr-2">
                TOTAL LEADS {getPeriodLabel(leadsPeriod)}
              </h5>
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </div>

            {/* PROMINENT TIME SELECTOR */}
            <div className="flex items-center gap-0.5 mb-4 p-1 bg-[#F3F4F6] rounded-lg w-full">
              {(['1d', '1w', '1m', '1y'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => {
                    setLeadsPeriod(period);
                  }}
                  className={`flex-1 py-1 rounded-md text-xs font-bold uppercase transition-all text-center ${ leadsPeriod === period ? 'bg-[#BA2027] text-white shadow-md' : 'bg-transparent text-[#6B7280] hover:bg-[#BA2027] hover:text-white' }`}
                  style={{ fontSize: '9px' }}
                >
                  {period === '1d' ? 'Day' : period === '1w' ? 'Week' : period === '1m' ? 'Month' : 'Year'}
                </button>
              ))}
            </div>
            
            <div className="font-bold text-[#1A1A1A] tracking-tight leading-none mb-2" style={{ fontSize: 'clamp(22px, 5vw, 36px)' }}>
              <AnimatedCounter end={totalLeadsDelivered} duration={2000} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#059669]">
                <TrendingUp className="w-3 h-3" />+12%
              </span>
              <span className="text-xs text-[#6B7280]">vs previous period</span>
            </div>
          </motion.div>

          {/* Total Spend Card */}
          <motion.div 
            key={`spend-${spendPeriod}`}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-3 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">TOTAL SPEND</h5>
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-500" />
              </div>
            </div>

            {/* PROMINENT TIME SELECTOR */}
            <div className="flex items-center gap-0.5 mb-4 p-1 bg-[#F3F4F6] rounded-lg w-full">
              {(['1d', '1w', '1m', '1y'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => {
                    setSpendPeriod(period);
                  }}
                  className={`flex-1 py-1 rounded-md text-xs font-bold uppercase transition-all text-center ${ spendPeriod === period ? 'bg-[#BA2027] text-white shadow-md' : 'bg-transparent text-[#6B7280] hover:bg-[#BA2027] hover:text-white' }`}
                  style={{ fontSize: '9px' }}
                >
                  {period === '1d' ? 'Day' : period === '1w' ? 'Week' : period === '1m' ? 'Month' : 'Year'}
                </button>
              ))}
            </div>
            
            <div className="font-bold text-[#1A1A1A] tracking-tight leading-none mb-2" style={{ fontSize: 'clamp(22px, 5vw, 36px)' }}>
              $<AnimatedCounter end={totalSpend} duration={1800} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#BA2027]">
                <TrendingUp className="w-3 h-3 rotate-180" />-3%
              </span>
              <span className="text-xs text-[#6B7280]">vs previous period</span>
            </div>
          </motion.div>

          {/* Awaiting Approval Card — only shown when pending campaigns exist */}
          {pendingApprovalCampaigns.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="glass-card p-3 sm:p-6 flex flex-col"
              style={{ borderColor: 'rgba(186,32,39,0.18)' }}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">AWAITING APPROVAL</h5>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(186,32,39,0.08)' }}>
                  <Clock className="w-5 h-5 text-[#BA2027]" />
                </div>
              </div>

              {/* Count */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold tracking-tight leading-none" style={{ color: '#1A1A1A', fontSize: 'clamp(20px, 5vw, 36px)' }}>
                  {pendingApprovalCampaigns.length}
                </span>
                <span className="text-sm font-semibold" style={{ color: '#BA2027' }}>
                  pending
                </span>
              </div>
              <p className="text-xs text-[#6B7280] mb-5">Under review by your campaign manager</p>

              {/* Campaign list */}
              <div className="flex-1 space-y-2">
                {pendingApprovalCampaigns.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(186,32,39,0.05)', border: '1px solid rgba(186,32,39,0.10)' }}
                  >
                    <span
                      className="relative flex h-2 w-2 flex-shrink-0"
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#BA2027' }} />
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#BA2027' }} />
                    </span>
                    <p className="text-xs font-medium text-[#374151] truncate">{c.name}</p>
                  </div>
                ))}
              </div>

              {/* Submitted date note */}
              <p className="text-[10px] text-[#9CA3AF] mt-4">Submitted Mar 1, 2026</p>
            </motion.div>
          )}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base w-full pl-12 pr-4 py-3"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-base px-4 py-3 pr-10 appearance-none cursor-pointer w-full sm:w-auto"
            >
              <option value="All">All Status</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="active">In Progress</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] pointer-events-none" />
          </div>
        </div>

        {/* Campaign Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Campaign</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Progress</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign, index) => {
                  const progress = campaign.target && campaign.delivered 
                    ? ((campaign.delivered / campaign.target) * 100) 
                    : 0;
                  return (
                    <TableRow
                      key={campaign.id}
                      showHoverEffect={true}
                      animationDelay={index * 50}
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    >
                      <td className="table-td">
                        <div>
                          <div className="t1">{campaign.name}</div>
                          <div className="t3 mt-0.5">{campaign.clientName}</div>
                        </div>
                      </td>
                      <td className="table-td">
                        <span className="t2">Leads</span>
                      </td>
                      <td className="table-td">
                        <div className="flex flex-col gap-1.5">
                          {getStatusPill(campaign.status)}
                          {campaign.status === 'active' && (
                            <CampaignHealthBadge health={getCampaignHealth(campaign)} />
                          )}
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-3">
                            <div className="progress-bar flex-1">
                              <div
                                className="progress-bar__fill"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            <span className="t2" style={{ minWidth: '28px' }}>
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <div className="t3">
                            {(campaign.delivered || 0).toLocaleString()} / {(campaign.target || 0).toLocaleString()} leads
                          </div>
                        </div>
                      </td>
                      <td className="table-td" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/campaigns/${campaign.id}`);
                          }}
                          className="btn-ghost p-2"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </TableRow>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredCampaigns.length === 0 && (
            <div className="py-16">
              <EmptyState
                icon={FolderOpen}
                title="No campaigns found"
                description="We couldn't find any campaigns matching your search criteria"
                actionLabel="Create Campaign"
                onAction={() => setIsNewCampaignModalOpen(true)}
              />
            </div>
          )}
        </div>

        {/* Account Team */}
        {accountTeam && (
          <div className="mt-8">
            <AccountTeam
              manager={{
                name: accountTeam.manager.name,
                role: accountTeam.manager.role,
                email: accountTeam.manager.email,
                initials: accountTeam.manager.name
                  .split(' ')
                  .map((n) => n[0])
                  .join(''),
                photo: getPersonPhoto(accountTeam.manager.name),
              }}
              backup={{
                name: accountTeam.backup.name,
                role: accountTeam.backup.role,
                email: accountTeam.backup.email,
                initials: accountTeam.backup.name
                  .split(' ')
                  .map((n) => n[0])
                  .join(''),
                photo: getPersonPhoto(accountTeam.backup.name),
              }}
            />
          </div>
        )}
      </div>

      {/* Modal */}
      <NewCampaignModal
        isOpen={isNewCampaignModalOpen}
        onClose={() => setIsNewCampaignModalOpen(false)}
        onSubmit={(formData: CampaignFormData) => {
          setIsNewCampaignModalOpen(false);
        }}
      />
    </AppLayout>
  );
}