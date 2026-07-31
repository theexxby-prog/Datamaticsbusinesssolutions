import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router';
import {
  LogOut,
  Sun,
  Moon,
  Pin,
  ChevronDown,
  Plus,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getAssignedClients } from '../data/mockClients';
import { LeadUploadModal } from './LeadUploadModal';
import { getNavForRole, useNavBadges, type NavItem } from '../config/navigation';
import { showFutureModules } from '../config/demo';
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
  const { currentUser, signOut } = useAuth();
  const { resolved: resolvedTheme, toggle: toggleTheme } = useTheme();

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

  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

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

  // Badge counts shared with the mobile shell — see config/navigation.ts.
  const badges = useNavBadges();

  // Role-based navigation from the shared config, decorated with the resolved
  // badge counts and the sidebar-only upload quick action. Memoized on role so
  // it doesn't recompute on every hover/tooltip re-render.
  type SidebarNavItem = NavItem & {
    badge?: number;
    badgeColor: string;
    hasQuickAction?: boolean;
    quickActionIcon?: LucideIcon;
    quickActionHandler?: () => void;
  };
  const navigation = useMemo(() => {
    return getNavForRole(currentUser?.role, showFutureModules(currentUser)).map((item): SidebarNavItem => {
      const count = item.badgeKey ? badges[item.badgeKey] : undefined;
      return {
        ...item,
        badge: count && count > 0 ? count : undefined,
        badgeColor: 'bg-[var(--color-primary)]',
        ...(item.path === '/internal/leads'
          ? {
              hasQuickAction: true,
              quickActionIcon: Plus,
              quickActionHandler: () => setShowUploadModal(true),
            }
          : {}),
      };
    });
  }, [currentUser, badges]);

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
        className={`flex-shrink-0 flex items-center border-b border-[var(--color-border)] ${
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
              className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors flex-shrink-0 ml-3"
              title={isPinned ? 'Collapse sidebar' : 'Keep sidebar expanded'}
            >
              <Pin
                className={`w-4 h-4 transition-all ${
                  isPinned ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
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
                      className={`flex items-center gap-2 w-full ${canCollapse ? 'cursor-pointer hover:text-[var(--color-text-secondary)]' : 'cursor-default'} transition-colors`}
                    >
                      <span 
                        className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider flex-1 text-left"
                        style={{ fontWeight: 600, letterSpacing: '0.08em' }}
                      >
                        {section}
                      </span>
                      {canCollapse && (
                        <motion.div
                          animate={{ rotate: isCollapsed ? -90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
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
                                ? 'bg-[var(--color-primary)]/[0.10] text-[var(--color-primary)] border-l-2 border-[var(--color-primary)]'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)]/[0.09] hover:text-[var(--color-primary)] border-l-2 border-transparent'
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
                                    ? 'text-[var(--color-primary)]'
                                    : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]'
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
                                className="bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center flex-shrink-0"
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
                                className="w-5 h-5 rounded-md bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white flex items-center justify-center transition-colors ml-1 cursor-pointer flex-shrink-0"
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
                              className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[var(--color-surface-inverse)] text-[var(--color-text-inverse)] rounded-lg whitespace-nowrap z-50 pointer-events-none"
                              style={{ fontSize: '12px', fontWeight: 500 }}
                            >
                              {item.name}
                              {item.badge && (
                                <span className="ml-2 bg-[var(--color-primary)] px-1.5 py-0.5 rounded-full" style={{ fontSize: '10px' }}>
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
                    className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider"
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
                    className={`w-full flex items-center gap-3 rounded-xl text-[14px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-all duration-100 ${
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
                      className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-[var(--color-surface-inverse)] text-[var(--color-text-inverse)] text-xs font-medium rounded-lg whitespace-nowrap z-50 pointer-events-none"
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
      <div className="border-t border-[var(--color-border)] px-3 pt-3 pb-3 space-y-1">
        {/* Notification Bell — client role only */}
        {currentUser?.role === 'client' && (
          <div className="relative">
            <button
              ref={notifButtonRef}
              onClick={() => setNotifPanelOpen(prev => !prev)}
              onMouseEnter={() => handleItemMouseEnter('Notifications')}
              onMouseLeave={handleItemMouseLeave}
              className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 hover:bg-[var(--color-surface)] ${
                isExpanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'
              }`}
              style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}
            >
              <div className="relative flex-shrink-0">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-white"
                    style={{ background: 'var(--color-primary)', fontSize: '10px', fontWeight: 700 }}
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
                className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[var(--color-surface-inverse)] text-[var(--color-text-inverse)] rounded-lg whitespace-nowrap z-50 pointer-events-none"
                style={{ fontSize: '12px', fontWeight: 500 }}
              >
                Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
              </motion.div>
            )}
          </div>
        )}

        {/* Theme toggle */}
        <div className="relative">
          <button
            onClick={toggleTheme}
            onMouseEnter={() => handleItemMouseEnter(resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode')}
            onMouseLeave={handleItemMouseLeave}
            aria-label="Toggle theme"
            className={`w-full flex items-center gap-3 rounded-xl transition-all duration-100 hover:bg-[var(--color-primary-tint)] ${
              isExpanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'
            }`}
            style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}
          >
            {resolvedTheme === 'dark'
              ? <Sun className="w-5 h-5 flex-shrink-0" />
              : <Moon className="w-5 h-5 flex-shrink-0" />}
            <AnimatePresence>
              {isExpanded && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Logout */}
        <div className="relative">
          <button
            onClick={() => {
              signOut();
              navigate('/');
            }}
            onMouseEnter={() => handleItemMouseEnter('Log Out')}
            onMouseLeave={handleItemMouseLeave}
            className={`w-full flex items-center gap-3 rounded-xl transition-all duration-100 hover:bg-[var(--color-primary)]/[0.09] ${
              isExpanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'
            }`}
            style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}
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
              className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[var(--color-surface-inverse)] text-[var(--color-text-inverse)] rounded-lg whitespace-nowrap z-50 pointer-events-none"
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
            className={`w-full flex items-center gap-3 rounded-xl hover:bg-[var(--color-surface)] transition-all duration-100 mt-1 pt-3 border-t border-[var(--color-surface)] ${
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
                  <div className="truncate" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {currentUser?.name || 'User'}
                  </div>
                  <div className="truncate" style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-text-muted)' }}>
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
              className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[var(--color-surface-inverse)] text-[var(--color-text-inverse)] rounded-lg whitespace-nowrap z-50 pointer-events-none"
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
          background: 'var(--color-sidebar-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid var(--color-sidebar-border)',
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