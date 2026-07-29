import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import {
  seedThreadEntries,
  latestTal,
  openRequestCount,
  type CampaignThreadEntry,
  type ThreadAttachment,
  type ThreadAuthor,
  type RequestStatus,
} from '../data/campaignThread';

// Persisted to sessionStorage rather than held in memory. The provider sits
// above the router, so switching persona in-app already preserved a thread —
// but a refresh or a pasted URL would have silently dropped whatever the
// client had just posted, which is precisely the handover this feature exists
// to make reliable. sessionStorage keeps it for the life of the tab and
// discards it when the tab closes, so the next demo starts from the seed.
const STORAGE_KEY = 'campaign-thread-entries';

function loadEntries(): CampaignThreadEntry[] {
  if (typeof window === 'undefined') return seedThreadEntries;
  try {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return seedThreadEntries;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : seedThreadEntries;
  } catch {
    // Corrupt or unavailable storage should never cost us the seeded demo.
    return seedThreadEntries;
  }
}

function saveEntries(entries: CampaignThreadEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota or private-mode failures are not worth breaking the page over.
  }
}

interface CampaignThreadContextValue {
  entriesFor: (campaignId: string) => CampaignThreadEntry[];
  addComment: (campaignId: string, author: ThreadAuthor, body: string) => void;
  addChangeRequest: (campaignId: string, author: ThreadAuthor, body: string) => void;
  addAttachment: (
    campaignId: string,
    author: ThreadAuthor,
    body: string,
    attachment: Omit<ThreadAttachment, 'id' | 'version'>,
  ) => void;
  setRequestStatus: (entryId: string, status: RequestStatus, by: string) => void;
  latestTalFor: (campaignId: string) => ReturnType<typeof latestTal>;
  openRequestsFor: (campaignId: string) => number;
}

const CampaignThreadContext = createContext<CampaignThreadContextValue | undefined>(undefined);

// Seeded from the clock so ids minted after a reload cannot collide with
// ones already restored from sessionStorage.
let seq = Date.now();
const nextId = (prefix: string) => `${prefix}_local_${++seq}`;

export function CampaignThreadProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<CampaignThreadEntry[]>(loadEntries);

  useEffect(() => { saveEntries(entries); }, [entries]);

  const byCampaign = useMemo(() => {
    const map = new Map<string, CampaignThreadEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.campaignId) ?? [];
      list.push(entry);
      map.set(entry.campaignId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    return map;
  }, [entries]);

  const entriesFor = useCallback(
    (campaignId: string) => byCampaign.get(campaignId) ?? [],
    [byCampaign],
  );

  const append = useCallback((entry: CampaignThreadEntry) => {
    setEntries(prev => [...prev, entry]);
  }, []);

  const addComment = useCallback((campaignId: string, author: ThreadAuthor, body: string) => {
    append({
      id: nextId('th'), campaignId, kind: 'comment', author, body,
      createdAt: new Date().toISOString(),
    });
  }, [append]);

  const addChangeRequest = useCallback((campaignId: string, author: ThreadAuthor, body: string) => {
    const at = new Date().toISOString();
    append({
      id: nextId('th'), campaignId, kind: 'change_request', author, body, createdAt: at,
      status: 'open',
      statusLog: [{ status: 'open', at, by: author.name }],
    });
  }, [append]);

  const addAttachment = useCallback((
    campaignId: string,
    author: ThreadAuthor,
    body: string,
    attachment: Omit<ThreadAttachment, 'id' | 'version'>,
  ) => {
    // A new target account list takes the next version number, so the header
    // can always name the live one without anyone having to remember.
    const existing = byCampaign.get(campaignId) ?? [];
    const currentTal = latestTal(existing);
    const version = attachment.kind === 'tal' ? (currentTal?.attachment.version ?? 0) + 1 : undefined;

    append({
      id: nextId('th'), campaignId, kind: 'attachment', author, body,
      createdAt: new Date().toISOString(),
      attachments: [{ ...attachment, id: nextId('att'), version }],
    });
  }, [append, byCampaign]);

  const setRequestStatus = useCallback((entryId: string, status: RequestStatus, by: string) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id !== entryId) return entry;
      return {
        ...entry,
        status,
        statusLog: [...(entry.statusLog ?? []), { status, at: new Date().toISOString(), by }],
      };
    }));
  }, []);

  const latestTalFor = useCallback(
    (campaignId: string) => latestTal(byCampaign.get(campaignId) ?? []),
    [byCampaign],
  );

  const openRequestsFor = useCallback(
    (campaignId: string) => openRequestCount(byCampaign.get(campaignId) ?? []),
    [byCampaign],
  );

  return (
    <CampaignThreadContext.Provider
      value={{ entriesFor, addComment, addChangeRequest, addAttachment, setRequestStatus, latestTalFor, openRequestsFor }}
    >
      {children}
    </CampaignThreadContext.Provider>
  );
}

export function useCampaignThread() {
  const ctx = useContext(CampaignThreadContext);
  if (!ctx) throw new Error('useCampaignThread must be used inside CampaignThreadProvider');
  return ctx;
}
