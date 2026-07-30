import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCheck, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useNotifications, type AppNotification } from '../context/NotificationContext';

export interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Ref to the bell button — used to compute panel position */
  anchorRef: React.RefObject<HTMLElement | null>;
  isMobile?: boolean;
}

/* ─── helpers ─────────────────────────────────────────────── */

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function eventLabel(event: string): string {
  switch (event) {
    case 'campaign_live':     return '🟢 Campaign Live';
    case '25_percent':        return '📊 25% Delivered';
    case '50_percent':        return '📊 50% Delivered';
    case '75_percent':        return '📊 75% Delivered';
    case '100_percent':       return '✅ 100% Delivered';
    case 'invoice_generated': return '🧾 Invoice Generated';
    default:                  return '📣 Update';
  }
}

/* ─── notification item ───────────────────────────────────── */

function NotificationItem({
  notif,
  onNavigate,
}: {
  notif: AppNotification;
  onNavigate: (link: string, id: string) => void;
}) {
  return (
    <div
      className="px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors hover:bg-[rgba(186,32,39,0.04)]"
      style={{
        borderBottom: '1px solid var(--color-border)',
        background: notif.read ? 'transparent' : 'rgba(186,32,39,0.03)',
      }}
      onClick={() => onNavigate(notif.link, notif.id)}
    >
      <div
        className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full"
        style={{ background: notif.read ? 'transparent' : 'var(--color-primary)' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)' }}>
            {eventLabel(notif.event)}
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--color-text-primary)', lineHeight: '1.4' }} className="mb-1">
          {notif.description}
        </p>
        <div className="flex items-center justify-between gap-2">
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{timeAgo(notif.timestamp)}</span>
          <span className="flex items-center gap-0.5" style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>
            View <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── standalone bell badge (used in some spots) ─────────── */

export function NotificationBell() {
  const { unreadCount } = useNotifications();
  return (
    <div className="relative">
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center"
          style={{ background: 'var(--color-primary)', fontSize: '10px', fontWeight: 700, color: '#fff' }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );
}

/* ─── main panel ──────────────────────────────────────────── */

export function NotificationPanel({
  isOpen,
  onClose,
  anchorRef,
  isMobile = false,
}: NotificationPanelProps) {
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications();
  const navigate = useNavigate();

  // Fixed pixel position of the panel (desktop only)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Recompute position every time the panel opens
  useEffect(() => {
    if (!isOpen || isMobile) return;
    if (!anchorRef.current) return;

    const rect = anchorRef.current.getBoundingClientRect();
    const PANEL_W = 360;
    const PANEL_H = 480;
    const GAP = 12;

    let left = rect.right + GAP;
    let top  = rect.top;

    if (left + PANEL_W > window.innerWidth - GAP) {
      left = rect.left - PANEL_W - GAP;
    }
    if (top + PANEL_H > window.innerHeight - GAP) {
      top = window.innerHeight - PANEL_H - GAP;
    }
    if (top < GAP) top = GAP;

    setPos({ top, left });
  }, [isOpen, isMobile, anchorRef]);

  // Only render the instance that matches the current viewport
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobileViewport(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Skip rendering if this instance doesn't match the viewport
  if (isMobile !== isMobileViewport) return null;

  const handleNavigate = (link: string, notifId: string) => {
    markOneRead(notifId);
    onClose();
    navigate(link);
  };

  const handleClose = () => {
    markAllRead();
    onClose();
  };

  /* ── mobile full-screen ── */
  if (isMobile) {
    return createPortal(
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-[500] flex flex-col"
            style={{ background: 'var(--color-surface, #fff)' }}
          >
            <div
              className="flex items-center justify-between px-4 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-text-primary)' }}>Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--color-primary)', fontSize: '12px', fontWeight: 700 }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2" style={{ color: 'var(--color-text-muted)' }}>
                  <Bell className="w-8 h-8 opacity-30" />
                  <p style={{ fontSize: '14px' }}>No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <NotificationItem key={n.id} notif={n} onNavigate={handleNavigate} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  }

  /* ── desktop floating panel via portal ── */
  return createPortal(
    <>
      {/*
        Transparent backdrop — sits above everything except the panel.
        Clicking it closes the panel. No event-listener hackery needed.
      */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="notif-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0"
            style={{ zIndex: 498 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Panel — above backdrop */}
      <AnimatePresence>
        {isOpen && pos && (
          <motion.div
            key="notif-panel"
            initial={{ opacity: 0, x: -10, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed w-[360px] rounded-2xl overflow-hidden"
            style={{
              top: pos.top,
              left: pos.left,
              zIndex: 499,
              background: 'var(--color-surface-raised)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.14)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: 'var(--color-primary)', fontSize: '11px', fontWeight: 700 }}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2" style={{ color: 'var(--color-text-muted)' }}>
                  <Bell className="w-7 h-7 opacity-30" />
                  <p style={{ fontSize: '13px' }}>No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <NotificationItem key={n.id} notif={n} onNavigate={handleNavigate} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}