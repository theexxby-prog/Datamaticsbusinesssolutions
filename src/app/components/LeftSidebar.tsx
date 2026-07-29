import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard,
  BarChart2,
  Globe,
  Users,
  FileBarChart,
  MessageCircle,
  Settings,
  Receipt,
  FolderOpen,
  LogOut,
  Upload,
  UsersRound,
  Pin,
  UserCircle,
  Building2,
  Layers,
  ChevronDown,
  ChevronRight,
  Plus,
  MessageSquare,
  ClipboardCheck,
  Bell,
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { getAssignedClients, recentUploadBatches, allClients } from '../data/mockClients';
import { LeadUploadModal } from './LeadUploadModal';
import { getPendingSubmissions } from '../mockData';
import { mockInvoiceRecords } from '../data/mockInvoiceRecords';
import { NotificationPanel } from './NotificationPanel';
import { useNotifications } from '../context/NotificationContext';
import { PersonAvatar } from './PersonAvatar';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
}

export function LeftSidebar({ collapsed: controlledCollapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // Hover state management
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(() => {
    const savedPinned = localStorage.getItem('sidebar-pinned');
    return savedPinned !== null ? savedPinned === 'true' : true;
  });
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  
  // Collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed-sections');
    return savedCollapsed ? JSON.parse(savedCollapsed) : { ORGANIZATION: false };
  });

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Feedback jiggle animation — fires every 5s to attract attention
  const [feedbackJiggle, setFeedbackJiggle] = useState(false);

  // Notification bell panel
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const notifButtonRef = useRef<HTMLButtonElement>(null);
  const { unreadCount } = useNotifications();

  const hoverTimeoutRef = useRef<NodeJS.Timeout>();
  const tooltipTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const interval = setInterval(() => {
      setFeedbackJiggle(true);
      setTimeout(() => setFeedbackJiggle(false), 700);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Save collapsed sections to localStorage when changed
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed-sections', JSON.stringify(collapsedSections));
  }, [collapsedSections]);

  // Handle hover with delay for collapse
  const handleMouseEnter = () => {
    if (!isPinned) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 350);
    }
  };

  // Pin toggle
  const togglePin = () => {
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    localStorage.setItem('sidebar-pinned', String(newPinned));
    if (newPinned) {
      setIsHovered(false);
    }
  };

  // Toggle section collapse
  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Determine if sidebar should be expanded
  const isExpanded = isPinned || isHovered;

  // Get user initials
  const userInitials = currentUser?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  // Calculate badges dynamically — memoized since source data is module-level constants.
  // Without memo, this iterates all clients/uploads on every render (hover, tooltip, jiggle…).
  const badges = useMemo(() => {
    const processingUploads = recentUploadBatches.filter(u => u.status === 'processing').length;
    const failedUploads = recentUploadBatches.filter(u => u.status === 'failed').length;
    const activeCampaigns = allClients.reduce((sum, c) => sum + c.campaigns.filter(camp => camp.status === 'active').length, 0);
    const totalLeads = allClients.reduce((sum, c) => sum + c.totalLeads, 0);
    const pendingApprovals = getPendingSubmissions().length;

    // Client-scoped: only count campaigns belonging to client_1 (The Channel Company)
    const clientData = allClients.find(c => c.id === 'client_1');
    const clientActiveCampaigns = clientData?.campaigns.filter(c => c.status === 'active').length ?? 0;
    const clientTotalLeads = clientData?.totalLeads ?? 0;

    // Derived rather than hardcoded so the badge can never contradict the
    // Invoices page.
    const unpaidInvoices = mockInvoiceRecords.filter(
      (inv) => inv.clientId === 'client_1' && (inv.stage === 'sent' || inv.stage === 'overdue'),
    ).length;

    // Matches the Support page's own "Active" count.
    const openSupportTickets = 1;

    return {
      processingUploads,
      failedUploads,
      activeCampaigns,
      totalLeads,
      unpaidInvoices,
      pendingApprovals,
      openSupportTickets,
      clientActiveCampaigns,
      clientTotalLeads,
    };
  }, []); // source arrays are module-level constants — never change at runtime

  // Role-based navigation — memoized on role + badge counts.
  // Re-computed only when the user's role changes, not on every hover/tooltip re-render.
  const navigation = useMemo(() => {
    const role = currentUser?.role;

    if (role === 'ops_manager') {
      // Mirrors production nav (pulse.datamaticsbpm.com): Dashboard, All Campaigns,
      // Admin Management, Metrics Override, Lead Demographics + the new Phase 2 modules.
      return [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/ops', section: 'PLATFORM' },
        { 
          name: 'All Campaigns', 
          icon: Layers, 
          path: '/internal/campaigns', 
          section: 'PLATFORM',
          badge: badges.activeCampaigns,
          badgeColor: 'bg-[#BA2027]'
        },
        { name: 'Admin Management', icon: UsersRound, path: '/internal/admin', section: 'PLATFORM' },
        { name: 'Metrics Override', icon: BarChart2, path: '/internal/ops-override', section: 'PLATFORM' },
        { name: 'Lead Demographics', icon: Globe, path: '/internal/demographics', section: 'PLATFORM' },
        { name: 'Job Cards', icon: FolderOpen, path: '/documents', section: 'PLATFORM' },
        { name: 'Invoices', icon: Receipt, path: '/invoices', section: 'PLATFORM' },
        { name: 'Settings', icon: Settings, path: '/account', section: 'ORGANIZATION' },
      ];
    }

    if (role === 'campaign_manager' || role === 'campaign_backup') {
      return [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/manager', section: 'PLATFORM' },
        { 
          name: 'Campaigns', 
          icon: BarChart2, 
          path: '/internal/campaigns', 
          section: 'PLATFORM',
          badge: badges.activeCampaigns,
          badgeColor: 'bg-[#BA2027]'
        },
        {
          name: 'Approvals',
          icon: ClipboardCheck,
          path: '/internal/approvals',
          section: 'PLATFORM',
          badge: badges.pendingApprovals,
          badgeColor: 'bg-[#BA2027]',
        },
        { 
          name: 'Upload Leads', 
          icon: Upload, 
          path: '/internal/leads', 
          section: 'PLATFORM',
          badge: badges.processingUploads > 0 ? badges.processingUploads : undefined,
          badgeColor: 'bg-[#BA2027]',
          hasQuickAction: true,
          quickActionIcon: Plus,
          quickActionHandler: () => setShowUploadModal(true)
        },
        { name: 'Reports', icon: FileBarChart, path: '/internal/reports', section: 'PLATFORM' },
        { name: 'Metrics Override', icon: BarChart2, path: '/internal/ops-override', section: 'PLATFORM' },
        { name: 'Lead Demographics', icon: Globe, path: '/internal/demographics', section: 'PLATFORM' },
        { name: 'Job Cards', icon: FolderOpen, path: '/documents', section: 'ORGANIZATION' },
        { name: 'Invoices', icon: Receipt, path: '/invoices', section: 'ORGANIZATION' },
        { name: 'Settings', icon: Settings, path: '/account', section: 'ORGANIZATION' },
        { name: 'Feedback', icon: MessageSquare, path: '/feedback', section: 'ORGANIZATION' },
      ];
    }

    if (role === 'account_manager') {
      return [
        { name: 'Job Cards', icon: FolderOpen, path: '/documents', section: 'PLATFORM' },
        { name: 'Invoices', icon: Receipt, path: '/invoices', section: 'PLATFORM' },
        { name: 'Campaigns', icon: BarChart2, path: '/internal/campaigns', section: 'PLATFORM' },
        { name: 'Settings', icon: Settings, path: '/account', section: 'ORGANIZATION' },
        { name: 'Feedback', icon: MessageSquare, path: '/feedback', section: 'ORGANIZATION' },
      ];
    }

    if (role === 'accounts') {
      return [
        { name: 'Invoices', icon: Receipt, path: '/invoices', section: 'PLATFORM' },
        { name: 'Job Cards', icon: FolderOpen, path: '/documents', section: 'PLATFORM' },
        { name: 'Settings', icon: Settings, path: '/account', section: 'ORGANIZATION' },
        { name: 'Feedback', icon: MessageSquare, path: '/feedback', section: 'ORGANIZATION' },
      ];
    }

    // Client role
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', section: 'PLATFORM' },
      { 
        name: 'Campaigns', 
        icon: BarChart2, 
        path: '/campaigns', 
        section: 'PLATFORM',
        badge: badges.clientActiveCampaigns > 0 ? badges.clientActiveCampaigns : undefined,
        badgeColor: 'bg-[#BA2027]'
      },
      // No count badge here: the sidebar total (all leads delivered to date)
      // and the Leads page header (the current lead table) legitimately differ,
      // and showing both side by side reads as a bug.
      { name: 'Leads', icon: Users, path: '/leads', section: 'PLATFORM' },
      { name: 'Reports', icon: FileBarChart, path: '/reports', section: 'PLATFORM' },
      { 
        name: 'Invoices', 
        icon: Receipt, 
        path: '/invoices', 
        section: 'ORGANIZATION',
        badge: badges.unpaidInvoices,
        badgeColor: 'bg-[#BA2027]'
      },
      { name: 'Documents', icon: FolderOpen, path: '/documents', section: 'ORGANIZATION' },
      {
        name: 'Support',
        icon: MessageSquare,
        path: '/support',
        section: 'ORGANIZATION',
        badge: badges.openSupportTickets > 0 ? badges.openSupportTickets : undefined,
        badgeColor: 'bg-[#BA2027]',
      },
      { name: 'Account', icon: UserCircle, path: '/account', section: 'ORGANIZATION' },
      { name: 'Feedback', icon: MessageSquare, path: '/feedback', section: 'ORGANIZATION' },
    ];
  }, [currentUser?.role, badges]);

  const groupedNav = useMemo(() => navigation.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof navigation>), [navigation]);

  // Get assigned clients for managers — memoized on user ID
  const assignedClients = useMemo(() =>
    currentUser?.role === 'campaign_manager' || currentUser?.role === 'campaign_backup'
      ? getAssignedClients(currentUser.id)
      : [],
  [currentUser?.role, currentUser?.id]);

  // Tooltip handlers
  const handleItemMouseEnter = (itemName: string) => {
    if (!isExpanded) {
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowTooltip(itemName);
      }, 400);
    }
  };

  const handleItemMouseLeave = () => {
    setShowTooltip(null);
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo + Pin — single unified header row */}
      <div
        className={`flex-shrink-0 flex items-center border-b border-[#EEECEC] ${
          isExpanded ? 'justify-between px-5' : 'justify-center px-3'
        }`}
        style={{ paddingTop: '28px', paddingBottom: '20px' }}
      >
        <Logo className="h-11" collapsed={!isExpanded} />

        <AnimatePresence>
          {isExpanded && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={togglePin}
              className="p-1.5 rounded-lg hover:bg-[#F3F4F6] transition-colors flex-shrink-0 ml-3"
              title={isPinned ? 'Collapse sidebar' : 'Keep sidebar expanded'}
            >
              <Pin
                className={`w-4 h-4 transition-all ${
                  isPinned ? 'text-[#BA2027]' : 'text-[#9CA3AF]'
                }`}
                style={{
                  transform: isPinned ? 'rotate(0deg)' : 'rotate(45deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {Object.entries(groupedNav).map(([section, items]) => {
          const isCollapsed = collapsedSections[section];
          const canCollapse = section === 'ORGANIZATION';

          return (
            <div key={section}>
              {/* Section Header - Collapsible for ORGANIZATION */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="px-3 mb-3"
                  >
                    <button
                      onClick={() => canCollapse && toggleSection(section)}
                      className={`flex items-center gap-2 w-full ${canCollapse ? 'cursor-pointer hover:text-[#6B7280]' : 'cursor-default'} transition-colors`}
                    >
                      <span 
                        className="text-[11px] text-[#9CA3AF] uppercase tracking-wider flex-1 text-left"
                        style={{ fontWeight: 600, letterSpacing: '0.08em' }}
                      >
                        {section}
                      </span>
                      {canCollapse && (
                        <motion.div
                          animate={{ rotate: isCollapsed ? -90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        </motion.div>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Section Items */}
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1"
                  >
                    {items.map((item) => {
                      const isActive =
                        location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                      const Icon = item.icon;
                      const QuickActionIcon = item.quickActionIcon;

                      return (
                        <div key={item.name} className="relative">
                          <motion.button
                            onClick={() => {
                              navigate(item.path);
                            }}
                            onMouseEnter={() => handleItemMouseEnter(item.name)}
                            onMouseLeave={handleItemMouseLeave}
                            className={`w-full flex items-center gap-3 rounded-xl relative group transition-all duration-100 ${
                              isExpanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'
                            } ${
                              isActive
                                ? 'bg-[#BA2027]/[0.10] text-[#BA2027] border-l-2 border-[#BA2027]'
                                : 'text-[#525252] hover:bg-[#BA2027]/[0.09] hover:text-[#BA2027] border-l-2 border-transparent'
                            }`}
                            style={{
                              fontSize: '14px',
                              fontWeight: isActive ? 600 : 450,
                              letterSpacing: '-0.01em',
                            }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                          >
                            <motion.div
                              animate={
                                item.name === 'Feedback' && feedbackJiggle
                                  ? { rotate: [0, -12, 12, -9, 9, -5, 5, 0], scale: [1, 1.15, 1.15, 1.1, 1.1, 1.05, 1.05, 1] }
                                  : { rotate: 0, scale: 1 }
                              }
                              transition={
                                item.name === 'Feedback' && feedbackJiggle
                                  ? { duration: 0.65, ease: 'easeInOut' }
                                  : { duration: 0.15, ease: 'easeOut' }
                              }
                            >
                              <Icon
                                className={`w-5 h-5 flex-shrink-0 transition-colors duration-100 ${
                                  isActive
                                    ? 'text-[#BA2027]'
                                    : 'text-[#9CA3AF] group-hover:text-[#BA2027]'
                                }`}
                              />
                            </motion.div>
                            
                            <AnimatePresence mode="wait">
                              {isExpanded && (
                                <motion.span
                                  initial={{ opacity: 0, width: 0 }}
                                  animate={{ opacity: 1, width: 'auto' }}
                                  exit={{ opacity: 0, width: 0 }}
                                  transition={{ duration: 0.2, ease: 'easeOut' }}
                                  className="flex-1 text-left overflow-hidden whitespace-nowrap"
                                >
                                  {item.name}
                                </motion.span>
                              )}
                            </AnimatePresence>

                            {/* Badge — single brand colour */}
                            {isExpanded && item.badge && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-[#BA2027] text-white rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ fontSize: '11px', fontWeight: 700, minWidth: '20px', height: '20px', padding: '0 6px' }}
                              >
                                {item.badge}
                              </motion.span>
                            )}

                            {/* Quick Action Button */}
                            {isExpanded && item.hasQuickAction && QuickActionIcon && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  item.quickActionHandler?.();
                                }}
                                className="w-5 h-5 rounded-md bg-[#BA2027] hover:bg-[#9A1A21] text-white flex items-center justify-center transition-colors ml-1 cursor-pointer flex-shrink-0"
                              >
                                <QuickActionIcon className="w-3 h-3" />
                              </motion.div>
                            )}
                          </motion.button>

                          {/* Tooltip for icon rail state */}
                          {!isExpanded && showTooltip === item.name && (
                            <motion.div
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#1C1C1E] text-white rounded-lg whitespace-nowrap z-50 pointer-events-none"
                              style={{ fontSize: '12px', fontWeight: 500 }}
                            >
                              {item.name}
                              {item.badge && (
                                <span className="ml-2 bg-[#BA2027] px-1.5 py-0.5 rounded-full" style={{ fontSize: '10px' }}>
                                  {item.badge}
                                </span>
                              )}
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* My Clients Section (for Campaign Managers) */}
        {assignedClients.length > 0 && (
          <div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="px-3 mb-3"
                >
                  <span 
                    className="text-[11px] text-[#9CA3AF] uppercase tracking-wider"
                    style={{ fontWeight: 600, letterSpacing: '0.08em' }}
                  >
                    MY CLIENTS
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="space-y-1">
              {assignedClients.map((client) => (
                <div key={client.id} className="relative">
                  <motion.button
                    onClick={() => {
                      navigate(`/client/${client.id}`);
                    }}
                    onMouseEnter={() => handleItemMouseEnter(client.name)}
                    onMouseLeave={handleItemMouseLeave}
                    className={`w-full flex items-center gap-3 rounded-xl text-[14px] text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F5F5F5] transition-all duration-100 ${
                      isExpanded ? 'px-3 py-3' : 'px-0 py-3 justify-center'
                    }`}
                    style={{ fontWeight: 400 }}
                    whileHover={{ x: isExpanded ? 4 : 0 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="flex-1 text-left truncate"
                        >
                          {client.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* Tooltip for icon rail state */}
                  {!isExpanded && showTooltip === client.name && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg whitespace-nowrap z-50 pointer-events-none"
                    >
                      {client.name}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section — Logout + User Profile */}
      <div className="border-t border-[#EEECEC] px-3 pt-3 pb-3 space-y-1">
        {/* Notification Bell — client role only */}
        {currentUser?.role === 'client' && (
          <div className="relative">
            <button
              ref={notifButtonRef}
              onClick={() => setNotifPanelOpen(prev => !prev)}
              onMouseEnter={() => handleItemMouseEnter('Notifications')}
              onMouseLeave={handleItemMouseLeave}
              className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 hover:bg-[#F5F5F5] ${
                isExpanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'
              }`}
              style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}
            >
              <div className="relative flex-shrink-0">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-white"
                    style={{ background: '#BA2027', fontSize: '10px', fontWeight: 700 }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="flex-1 flex items-center justify-between"
                  >
                    <span>Notifications</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Panel renders via Portal to document.body — no overflow clipping */}
            <NotificationPanel
              isOpen={notifPanelOpen}
              onClose={() => setNotifPanelOpen(false)}
              anchorRef={notifButtonRef}
              isMobile={false}
            />
            <NotificationPanel
              isOpen={notifPanelOpen}
              onClose={() => setNotifPanelOpen(false)}
              anchorRef={notifButtonRef}
              isMobile={true}
            />

            {!isExpanded && showTooltip === 'Notifications' && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#1C1C1E] text-white rounded-lg whitespace-nowrap z-50 pointer-events-none"
                style={{ fontSize: '12px', fontWeight: 500 }}
              >
                Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
              </motion.div>
            )}
          </div>
        )}

        {/* Logout */}
        <div className="relative">
          <button
            onClick={() => {
              navigate('/');
            }}
            onMouseEnter={() => handleItemMouseEnter('Log Out')}
            onMouseLeave={handleItemMouseLeave}
            className={`w-full flex items-center gap-3 rounded-xl transition-all duration-100 hover:bg-[#BA2027]/[0.09] ${
              isExpanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'
            }`}
            style={{ fontSize: '14px', fontWeight: 500, color: '#BA2027' }}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  Log Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          {!isExpanded && showTooltip === 'Log Out' && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#1C1C1E] text-white rounded-lg whitespace-nowrap z-50 pointer-events-none"
              style={{ fontSize: '12px', fontWeight: 500 }}
            >
              Log Out
            </motion.div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              navigate('/account');
            }}
            onMouseEnter={() => handleItemMouseEnter('Account')}
            onMouseLeave={handleItemMouseLeave}
            className={`w-full flex items-center gap-3 rounded-xl hover:bg-[#F5F5F5] transition-all duration-100 mt-1 pt-3 border-t border-[#F3F4F6] ${
              isExpanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'
            }`}
          >
            {/* Avatar — real photo, rounded-square */}
            <PersonAvatar name={currentUser?.name || ''} size={36} />
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="truncate" style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>
                    {currentUser?.name || 'User'}
                  </div>
                  <div className="truncate" style={{ fontSize: '11px', fontWeight: 400, color: '#9CA3AF' }}>
                    {currentUser?.role === 'client'
                      ? 'Client'
                      : currentUser?.role === 'campaign_manager'
                      ? 'Campaign Manager'
                      : currentUser?.role === 'campaign_backup'
                      ? 'Campaign Backup'
                      : currentUser?.role === 'account_manager'
                      ? 'Account Manager'
                      : currentUser?.role === 'accounts'
                      ? 'Accounts'
                      : 'Operations Manager'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          {!isExpanded && showTooltip === 'Account' && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#1C1C1E] text-white rounded-lg whitespace-nowrap z-50 pointer-events-none"
              style={{ fontSize: '12px', fontWeight: 500 }}
            >
              {currentUser?.name || 'Account'}
            </motion.div>
          )}
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Sidebar - Desktop */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="hidden md:flex flex-col h-screen overflow-hidden flex-shrink-0"
        style={{ 
          width: isPinned ? '260px' : (isHovered ? '260px' : '72px'),
          minWidth: isPinned ? '260px' : (isHovered ? '260px' : '72px'),
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: isExpanded ? '4px 0 24px rgba(0,0,0,0.06)' : '2px 0 8px rgba(0,0,0,0.03)',
          willChange: 'width',
          transform: 'translateZ(0)'
        }}
      >
        {sidebarContent}
      </div>

      {/* Lead Upload Modal */}
      <LeadUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </>
  );
}