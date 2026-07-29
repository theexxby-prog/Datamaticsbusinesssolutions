import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface AppNotification {
  id: string;
  campaignId: string;
  campaignName: string;
  event: string;
  description: string;
  timestamp: Date;
  read: boolean;
  link: string;
}

export type MilestoneEvent = 'campaign_live' | '25_percent' | '50_percent' | '75_percent' | '100_percent' | 'invoice_generated';

export interface NotificationPreferences {
  campaign_live: boolean;
  '25_percent': boolean;
  '50_percent': boolean;
  '75_percent': boolean;
  '100_percent': boolean;
  invoice_generated: boolean;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAllRead: () => void;
  markOneRead: (id: string) => void;
  setPreferences: (prefs: NotificationPreferences) => void;
}

const DEFAULT_PREFS: NotificationPreferences = {
  campaign_live: true,
  '25_percent': true,
  '50_percent': true,
  '75_percent': true,
  '100_percent': true,
  invoice_generated: true,
};

// Seed some initial mock notifications so the bell is non-empty on first load
const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_seed_1',
    campaignId: '46888',
    campaignName: 'Lenovo Intel FIFA AI',
    event: '50_percent',
    description: 'Weekly digest ready — Lenovo Intel FIFA AI',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    link: '/campaigns/46888',
  },
  {
    id: 'notif_seed_2',
    campaignId: '46888',
    campaignName: 'Lenovo Intel FIFA AI',
    event: 'invoice_generated',
    description: 'Invoice INV-2026-001042 is now available',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: false,
    link: '/invoices',
  },
  {
    id: 'notif_seed_3',
    campaignId: '46873',
    campaignName: 'Uptime Solutions CRN2 - Lead Gen',
    event: '75_percent',
    description: '12 new leads accepted across your campaigns',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    read: false,
    link: '/leads',
  },
  {
    id: 'notif_seed_4',
    campaignId: '46888',
    campaignName: 'Lenovo Intel FIFA AI',
    event: 'campaign_live',
    description: 'Job card awaiting your signature — Lenovo Intel FIFA AI',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
    link: '/documents',
  },
];


const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED_NOTIFICATIONS);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...n,
      id: `notif_${Date.now()}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const markOneRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, preferences, addNotification, markAllRead, markOneRead, setPreferences }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}