import { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { UNION_COMPANY } from '../data/unionClient';

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
  /** True while UNION OPS is viewing the portal as the client (u9). */
  isPreviewingClient: boolean;
  /** Enter/exit the client preview. Only meaningful for the UNION OPS login. */
  setPreviewingClient: (on: boolean) => void;
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
  {
    // Preview persona: unlocks the in-progress Propensity ABM and Relish
    // intelligence modules (see config/demo.ts showFutureModules). Sees the
    // same TCC client data as Renuka otherwise. Kept LAST so the client demo
    // build's `find(role === 'client')` still resolves to Renuka.
    id: 'u9',
    name: 'UNION',
    email: 'union.preview@datamaticsbpm.com',
    role: 'client',
    assignedClients: [],
    company: UNION_COMPANY,
  },
  {
    // Operations mirror for the UNION preview: the pipeline that produces
    // everything the u9 client login sees (CSV/CRM intake → Relish enrichment
    // → publish to portal, Propensity pairing). Gated by isUnionOps in
    // config/demo.ts; can preview the client experience via previewClient.
    id: 'u10',
    name: 'UNION OPS',
    email: 'union.ops@datamaticsbpm.com',
    role: 'ops_manager',
    assignedClients: [],
    company: UNION_COMPANY,
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
// Per-tab flag: UNION OPS viewing the portal as the client. Kept separate from
// the persona key so a refresh mid-preview restores the same state.
const PREVIEW_KEY = 'union-ops-previewing';

function initialUser(): User {
  if (typeof window === 'undefined') return mockUsers[0];
  try {
    const id = window.sessionStorage.getItem(SESSION_KEY);
    return mockUsers.find(u => u.id === id) ?? mockUsers[0];
  } catch {
    return mockUsers[0];
  }
}

function initialPreviewing(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(PREVIEW_KEY) === '1';
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Defaults to the client persona; restored from the tab's session if set.
  const [actualUser, setCurrentUserState] = useState<User>(initialUser);
  const [previewing, setPreviewingState] = useState<boolean>(initialPreviewing);

  const setPreviewingClient = useCallback((on: boolean) => {
    setPreviewingState(on);
    try {
      if (on) window.sessionStorage.setItem(PREVIEW_KEY, '1');
      else window.sessionStorage.removeItem(PREVIEW_KEY);
    } catch {
      // Private mode — preview just won't survive a refresh.
    }
  }, []);

  const signOut = useCallback(() => {
    setCurrentUserState(mockUsers[0]);
    setPreviewingState(false);
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
      window.sessionStorage.removeItem(PREVIEW_KEY);
    } catch {
      // Nothing to clear if storage is unavailable.
    }
  }, []);

  const setCurrentUser = useCallback((user: User) => {
    setCurrentUserState(user);
    // Switching personas always leaves the preview — it belongs to UNION OPS.
    setPreviewingState(false);
    try {
      window.sessionStorage.setItem(SESSION_KEY, user.id);
      window.sessionStorage.removeItem(PREVIEW_KEY);
    } catch {
      // Private mode / quota — the persona just won't survive a refresh.
    }
  }, []);

  // While UNION OPS previews the client experience, the whole app sees the
  // UNION client persona (u9) — nav, gates, brand, and data all follow with
  // zero page-level changes. The preview flag only applies to the ops login.
  const isPreviewingClient = previewing && actualUser.id === 'u10';
  const currentUser = isPreviewingClient
    ? mockUsers.find(u => u.id === 'u9') ?? actualUser
    : actualUser;

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
        isPreviewingClient,
        setPreviewingClient,
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