import { createContext, useContext, ReactNode, useState, useCallback } from 'react';

// ============================================
// TYPES
// ============================================

export type UserRole =
  | 'ops_manager'
  | 'campaign_manager'
  | 'campaign_backup'
  | 'client'
  | 'account_manager' // sales side — uploads won-campaign scope dumps, confirms job cards
  | 'accounts';       // finance — validates invoices, owns Tally reconciliation

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedClients: string[]; // Only relevant for campaign_manager and campaign_backup
  company?: string; // For client role
  logo?: string; // Client company logo URL
}

interface AuthContextValue {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  /** Clears the remembered persona so Log Out survives a refresh too. */
  signOut: () => void;
  canUploadLeads: () => boolean;
  canAccessOps: () => boolean;
  canManageTeam: () => boolean;
  canEditCampaigns: () => boolean;
  canUploadScopeDump: () => boolean;
  canConfirmJobCards: () => boolean;
  canValidateInvoices: () => boolean;
}

// ============================================
// MOCK USERS - Available for selection on login
// ============================================

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Renuka Lawless',
    email: 'rlawless@thechannelcompany.com',
    role: 'client',
    assignedClients: [],
    // No logo asset on hand for TCC — omitting the field renders the RL
    // initials avatar on the brand tile instead. Drop the file at
    // public/logos/tcc-logo.png and set TCC_LOGO_PATH in config/branding.ts
    // to switch every surface over at once.
    company: 'The Channel Company',
  },
  {
    id: 'u2',
    name: 'Brijesh Singh',
    email: 'brijesh.singh@datamaticsbpm.com',
    role: 'campaign_manager',
    assignedClients: ['client_1', 'client_2'],
  },
  {
    id: 'u3',
    name: 'Arjun Patel',
    email: 'arjun.patel@datamaticsbpm.com',
    role: 'campaign_backup',
    assignedClients: ['client_1', 'client_3'],
  },
  {
    id: 'u4',
    name: 'Praful Sanil',
    email: 'praful.sanil@datamaticsbpm.com',
    role: 'ops_manager',
    assignedClients: [],
  },
  {
    id: 'u5',
    name: 'Vishal Mehta',
    email: 'vishal.mehta@datamaticsbpm.com',
    role: 'account_manager',
    assignedClients: ['client_1'],
  },
  {
    id: 'u6',
    name: 'Gautam Gupta',
    email: 'gautam.gupta@datamaticsbpm.com',
    role: 'account_manager',
    assignedClients: ['client_2'],
  },
  {
    id: 'u7',
    name: 'Kartik',
    email: 'kartik@datamaticsbpm.com',
    role: 'accounts',
    assignedClients: [],
  },
  {
    id: 'u8',
    name: 'Hema',
    email: 'hema@datamaticsbpm.com',
    role: 'accounts',
    assignedClients: [],
  },
];

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// The signed-in persona is remembered for the life of the tab. Held purely in
// memory it survived in-app navigation but not a refresh — which silently
// dropped whoever was signed in back to the client, so an internal page would
// keep rendering while the viewer had quietly become someone else.
const SESSION_KEY = 'signed-in-user-id';

function initialUser(): User {
  if (typeof window === 'undefined') return mockUsers[0];
  try {
    const id = window.sessionStorage.getItem(SESSION_KEY);
    return mockUsers.find(u => u.id === id) ?? mockUsers[0];
  } catch {
    return mockUsers[0];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Defaults to the client persona; restored from the tab's session if set.
  const [currentUser, setCurrentUserState] = useState<User>(initialUser);

  const signOut = useCallback(() => {
    setCurrentUserState(mockUsers[0]);
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Nothing to clear if storage is unavailable.
    }
  }, []);

  const setCurrentUser = useCallback((user: User) => {
    setCurrentUserState(user);
    try {
      window.sessionStorage.setItem(SESSION_KEY, user.id);
    } catch {
      // Private mode / quota — the persona just won't survive a refresh.
    }
  }, []);

  // Permission helpers — wrapped in useCallback so their identity stays stable
  // across re-renders. This prevents all context consumers from re-rendering
  // whenever AuthProvider re-renders for any unrelated reason.
  const canUploadLeads = useCallback(() => {
    return currentUser.role === 'ops_manager' || currentUser.role === 'campaign_manager';
  }, [currentUser.role]);

  const canAccessOps = useCallback(() => {
    return currentUser.role === 'ops_manager';
  }, [currentUser.role]);

  const canManageTeam = useCallback(() => {
    return currentUser.role === 'ops_manager';
  }, [currentUser.role]);

  const canEditCampaigns = useCallback(() => {
    return currentUser.role === 'ops_manager' || currentUser.role === 'campaign_manager';
  }, [currentUser.role]);

  // Documents module: account managers upload won-campaign scope dumps.
  const canUploadScopeDump = useCallback(() => {
    return currentUser.role === 'account_manager';
  }, [currentUser.role]);

  // Documents module: both sides of the dual confirmation.
  const canConfirmJobCards = useCallback(() => {
    return ['account_manager', 'campaign_manager', 'campaign_backup'].includes(currentUser.role);
  }, [currentUser.role]);

  // Invoices module: Accounts validates amounts and owns Tally sync.
  const canValidateInvoices = useCallback(() => {
    return currentUser.role === 'accounts';
  }, [currentUser.role]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        signOut,
        canUploadLeads,
        canAccessOps,
        canManageTeam,
        canEditCampaigns,
        canUploadScopeDump,
        canConfirmJobCards,
        canValidateInvoices,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}