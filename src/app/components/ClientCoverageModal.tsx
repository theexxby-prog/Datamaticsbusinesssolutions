/**
 * ClientCoverageModal — Client Coverage & Assignment Manager
 *
 * Matches the site's existing modal pattern (TeamMemberModals / ExportModal):
 *  - Solid white background (no semi-transparent glass bleed)
 *  - Centred overlay with dark backdrop + blur
 *  - Wide enough to show the full table (max-w-5xl)
 *  - Table-row layout matching ClientAssignmentPage / TeamManagementPage style
 *  - Fully responsive: columns stack on mobile
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Shield, AlertTriangle, CheckCircle2, AlertCircle,
  ChevronDown, Search, Zap, RotateCcw, Save, Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Client } from '../data/mockClients';
import { TeamMember } from '../mockData';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Draft {
  manager: string;
  backup: string;
}

type UrgencyLevel = 'high' | 'medium' | 'ok';
type FilterLevel  = 'all' | 'high' | 'medium' | 'ok';

interface UrgencyResult {
  level: UrgencyLevel;
  reasons: string[];
}

// ─── Urgency helpers ────────────────────────────────────────────────────────────

function computeManagerLoads(
  clients: Client[],
  drafts: Record<string, Draft>,
): Record<string, number> {
  const loads: Record<string, number> = {};
  clients.forEach(c => {
    const mgr = drafts[c.id]?.manager ?? c.campaignManager;
    if (mgr && mgr !== '—') loads[mgr] = (loads[mgr] ?? 0) + 1;
  });
  return loads;
}

function computeBackupLoads(
  clients: Client[],
  drafts: Record<string, Draft>,
): Record<string, number> {
  const loads: Record<string, number> = {};
  clients.forEach(c => {
    const bak = drafts[c.id]?.backup ?? c.backupManager;
    if (bak && bak !== '—') loads[bak] = (loads[bak] ?? 0) + 1;
  });
  return loads;
}

function getUrgency(
  client: Client,
  drafts: Record<string, Draft>,
  mgrLoads: Record<string, number>,
): UrgencyResult {
  const manager = drafts[client.id]?.manager ?? client.campaignManager;
  const backup  = drafts[client.id]?.backup  ?? client.backupManager;
  const reasons: string[] = [];
  let level: UrgencyLevel = 'ok';

  const noBackup      = !backup || backup === '—' || backup.trim() === '';
  const sameAsMgr     = backup === manager;
  const mgrOverloaded = (mgrLoads[manager] ?? 0) > 3;

  if (noBackup)  { reasons.push('No backup assigned');            level = 'high';   }
  if (sameAsMgr) { reasons.push('Backup same as manager');        level = 'high';   }
  if (mgrOverloaded && level === 'ok') {
    reasons.push(`Manager has ${mgrLoads[manager]} clients`);
    level = 'medium';
  }
  return { level, reasons };
}

// ─── Colour config ──────────────────────────────────────────────────────────────

const URGENCY: Record<UrgencyLevel, {
  dot: string; border: string; rowBg: string;
  badge: string; badgeText: string; label: string;
}> = {
  high: {
    dot: 'var(--color-error)', border: 'var(--color-error)', rowBg: 'rgba(220,38,38,0.03)',
    badge: 'rgba(220,38,38,0.10)', badgeText: 'var(--color-error)', label: 'Unprotected',
  },
  medium: {
    dot: 'var(--color-warning)', border: 'var(--color-warning-bg)', rowBg: 'rgba(217,119,6,0.02)',
    badge: 'rgba(217,119,6,0.10)', badgeText: 'var(--color-warning)', label: 'At Risk',
  },
  ok: {
    dot: 'var(--color-success)', border: 'transparent', rowBg: 'transparent',
    badge: 'rgba(5,150,105,0.10)', badgeText: 'var(--color-success)', label: 'Covered',
  },
};

const FILTER_LABELS: Record<FilterLevel, string> = {
  all: 'All', high: 'Unprotected', medium: 'At Risk', ok: 'Covered',
};

// ─── Inline select ──────────────────────────────────────────────────────────────

function AssignSelect({
  value, options, onChange, placeholder, danger, modified,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
  danger?: boolean;
  modified?: boolean;
}) {
  const ref = useRef<HTMLSelectElement>(null);

  return (
    <div className="relative">
      <select
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none',
          width: '100%',
          padding: '7px 30px 7px 10px',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: value ? 500 : 400,
          color: value ? (danger ? 'var(--color-error)' : 'var(--color-text-primary)') : 'var(--color-text-secondary)',
          background: 'white',
          border: `1.5px solid ${
            danger    ? 'rgba(220,38,38,0.45)' :
            modified  ? 'var(--color-primary)' :
            'var(--color-border)'
          }`,
          boxShadow: modified ? '0 0 0 3px rgba(186,32,39,0.07)' : 'none',
          outline: 'none',
          cursor: 'pointer',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown
        className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: danger ? 'var(--color-error)' : 'var(--color-text-secondary)' }}
      />
      {modified && (
        <span
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
          style={{ background: 'var(--color-primary)' }}
        />
      )}
    </div>
  );
}

// ─── Client row ─────────────────────────────────────────────────────────────────

interface RowProps {
  client: Client;
  draft: Draft | undefined;
  members: TeamMember[];
  mgrLoads: Record<string, number>;
  bakLoads: Record<string, number>;
  urgency: UrgencyResult;
  onChangeMgr: (v: string) => void;
  onChangeBak: (v: string) => void;
  onReset: () => void;
  index: number;
}

function ClientRow({
  client, draft, members, mgrLoads, bakLoads,
  urgency, onChangeMgr, onChangeBak, onReset, index,
}: RowProps) {
  const cfg = URGENCY[urgency.level];

  const currentMgr = draft?.manager ?? client.campaignManager;
  const currentBak = draft?.backup  ?? client.backupManager;
  const modifiedMgr = draft?.manager !== undefined && draft.manager !== client.campaignManager;
  const modifiedBak = draft?.backup  !== undefined && draft.backup  !== client.backupManager;
  const isModified  = modifiedMgr || modifiedBak;
  const noBackup    = !currentBak || currentBak === '—' || currentBak === currentMgr;

  const active = members.filter(m => (m.status as string) !== 'Inactive');

  const mgrOpts = active.map(m => ({
    value: m.name,
    label: `${m.name}${mgrLoads[m.name] ? ` (${mgrLoads[m.name]})` : ''}`,
  }));
  const bakOpts = active
    .filter(m => m.name !== currentMgr)
    .map(m => ({
      value: m.name,
      label: `${m.name}${bakLoads[m.name] ? ` (${bakLoads[m.name]})` : ''}`,
    }));

  const mgrLoad = mgrLoads[currentMgr] ?? 0;
  const bakLoad = bakLoads[currentBak] ?? 0;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      style={{
        borderBottom: '1px solid var(--color-border)',
        background: cfg.rowBg,
        borderLeft: urgency.level !== 'ok' ? `3px solid ${cfg.dot}` : '3px solid transparent',
      }}
    >
      {/* Client — vertically centred */}
      <td className="px-4 py-4 align-middle">
        <div className="flex items-center gap-2.5">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: cfg.dot,
              boxShadow: urgency.level === 'high' ? `0 0 0 3px ${cfg.dot}25` : 'none',
            }}
          />
          <div className="min-w-0">
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
              {client.companyName}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 1 }}>
              {client.industry}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>
              {client.campaigns.filter(c => c.status === 'active').length} active
            </div>
          </div>
        </div>
      </td>

      {/* Campaign Manager — select + load count below */}
      <td className="px-4 py-4 align-middle" style={{ minWidth: 200 }}>
        <AssignSelect
          value={currentMgr}
          options={mgrOpts}
          onChange={onChangeMgr}
          placeholder="— Assign manager —"
          modified={modifiedMgr}
        />
        <div
          className="flex items-center gap-1 mt-1.5"
          style={{ fontSize: 12, color: mgrLoad > 3 ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}
        >
          {mgrLoad > 3 && <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
          <span>{mgrLoad > 0 ? `${mgrLoad} client${mgrLoad !== 1 ? 's' : ''}` : 'No clients yet'}</span>
          {mgrLoad > 3 && <span style={{ fontWeight: 600 }}> · Overloaded</span>}
        </div>
      </td>

      {/* Backup Manager — same structure as Campaign Manager column */}
      <td className="px-4 py-4 align-middle" style={{ minWidth: 200 }}>
        <AssignSelect
          value={noBackup ? '' : currentBak}
          options={bakOpts}
          onChange={onChangeBak}
          placeholder="— Assign backup —"
          danger={urgency.level === 'high'}
          modified={modifiedBak}
        />
        <div className="mt-1.5" style={{ fontSize: 12 }}>
          {urgency.level === 'high' ? (
            <span className="flex items-center gap-1" style={{ color: 'var(--color-error)', fontWeight: 600 }}>
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {!currentBak || currentBak === '—' ? 'No backup set' : 'Same as manager'}
            </span>
          ) : (
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {bakLoad > 0 ? `${bakLoad} assignment${bakLoad !== 1 ? 's' : ''}` : 'No assignments yet'}
            </span>
          )}
        </div>
      </td>

      {/* Coverage badge + reset — vertically centred */}
      <td className="px-4 py-4 align-middle">
        <div className="flex flex-col items-start gap-2">
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-lg"
            style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
              background: cfg.badge, color: cfg.badgeText,
            }}
          >
            {cfg.label}
          </span>
          {isModified && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg transition-colors"
              style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-border-light)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Mobile client card (used below md breakpoint) ──────────────────────────────

function ClientMobileCard({
  client, draft, members, mgrLoads, bakLoads,
  urgency, onChangeMgr, onChangeBak, onReset, index,
}: RowProps) {
  const cfg = URGENCY[urgency.level];

  const currentMgr = draft?.manager ?? client.campaignManager;
  const currentBak = draft?.backup  ?? client.backupManager;
  const modifiedMgr = draft?.manager !== undefined && draft.manager !== client.campaignManager;
  const modifiedBak = draft?.backup  !== undefined && draft.backup  !== client.backupManager;
  const isModified  = modifiedMgr || modifiedBak;
  const noBackup    = !currentBak || currentBak === '—' || currentBak === currentMgr;

  const active  = members.filter(m => (m.status as string) !== 'Inactive');
  const mgrOpts = active.map(m => ({ value: m.name, label: `${m.name}${mgrLoads[m.name] ? ` (${mgrLoads[m.name]})` : ''}` }));
  const bakOpts = active.filter(m => m.name !== currentMgr).map(m => ({ value: m.name, label: `${m.name}${bakLoads[m.name] ? ` (${bakLoads[m.name]})` : ''}` }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className="border rounded-xl overflow-hidden mb-3"
      style={{
        borderColor: urgency.level !== 'ok' ? cfg.dot : 'var(--color-border)',
        background: 'white',
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--color-border)', background: cfg.rowBg }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: cfg.dot, boxShadow: urgency.level === 'high' ? `0 0 0 3px ${cfg.dot}25` : 'none' }}
          />
          <div className="min-w-0">
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }} className="truncate">
              {client.companyName}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {client.industry} · {client.campaigns.filter(c => c.status === 'active').length} active
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-lg"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: cfg.badge, color: cfg.badgeText }}
          >
            {cfg.label}
          </span>
          {isModified && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg transition-colors"
              style={{ fontSize: 11, color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer' }}
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Selects */}
      <div className="grid grid-cols-1 gap-3 px-4 py-3">
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 5 }}>
            Campaign Manager
          </div>
          <AssignSelect value={currentMgr} options={mgrOpts} onChange={onChangeMgr} placeholder="— Assign manager —" modified={modifiedMgr} />
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
            <Shield className="w-3 h-3" /> Backup
          </div>
          <AssignSelect
            value={noBackup ? '' : currentBak}
            options={bakOpts}
            onChange={onChangeBak}
            placeholder="— Assign backup —"
            danger={urgency.level === 'high'}
            modified={modifiedBak}
          />
          {urgency.level === 'high' && (
            <div className="flex items-center gap-1 mt-1" style={{ fontSize: 11, color: 'var(--color-error)', fontWeight: 600 }}>
              <AlertCircle className="w-3 h-3" />
              {!currentBak || currentBak === '—' ? 'No backup set' : 'Same as manager'}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────────

export interface ClientCoverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  members: TeamMember[];
  onSave: (updatedClients: Client[]) => void;
}

export function ClientCoverageModal({
  isOpen, onClose, clients, members, onSave,
}: ClientCoverageModalProps) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [filter, setFilter] = useState<FilterLevel>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) { setDrafts({}); setFilter('all'); setSearch(''); }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const mgrLoads = useMemo(() => computeManagerLoads(clients, drafts), [clients, drafts]);
  const bakLoads = useMemo(() => computeBackupLoads(clients, drafts),  [clients, drafts]);

  const urgencies = useMemo(
    () => Object.fromEntries(clients.map(c => [c.id, getUrgency(c, drafts, mgrLoads)])),
    [clients, drafts, mgrLoads]
  );

  const counts = useMemo(() => ({
    high:   clients.filter(c => urgencies[c.id]?.level === 'high').length,
    medium: clients.filter(c => urgencies[c.id]?.level === 'medium').length,
    ok:     clients.filter(c => urgencies[c.id]?.level === 'ok').length,
  }), [clients, urgencies]);

  const healthPct = clients.length > 0 ? Math.round((counts.ok / clients.length) * 100) : 100;

  const changesCount = useMemo(() =>
    Object.entries(drafts).filter(([clientId, d]) => {
      const c = clients.find(x => x.id === clientId);
      if (!c) return false;
      return d.manager !== c.campaignManager || d.backup !== c.backupManager;
    }).length,
    [drafts, clients]
  );

  const filteredClients = useMemo(() => {
    let list = clients;
    if (filter !== 'all') list = list.filter(c => urgencies[c.id]?.level === filter);
    if (search.trim())    list = list.filter(c =>
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.industry.toLowerCase().includes(search.toLowerCase())
    );
    return [...list].sort((a, b) => {
      const order: Record<UrgencyLevel, number> = { high: 0, medium: 1, ok: 2 };
      return order[urgencies[a.id]?.level ?? 'ok'] - order[urgencies[b.id]?.level ?? 'ok'];
    });
  }, [clients, filter, search, urgencies]);

  function setManager(clientId: string, value: string) {
    setDrafts(prev => ({
      ...prev,
      [clientId]: { manager: value, backup: prev[clientId]?.backup ?? clients.find(c => c.id === clientId)!.backupManager },
    }));
  }

  function setBackup(clientId: string, value: string) {
    setDrafts(prev => ({
      ...prev,
      [clientId]: { manager: prev[clientId]?.manager ?? clients.find(c => c.id === clientId)!.campaignManager, backup: value },
    }));
  }

  function resetClient(clientId: string) {
    setDrafts(prev => { const n = { ...prev }; delete n[clientId]; return n; });
  }

  function handleSave() {
    const updated = clients.map(c => {
      const d = drafts[c.id];
      if (!d) return c;
      const mgrM = members.find(m => m.name === d.manager);
      const bakM = members.find(m => m.name === d.backup);
      return {
        ...c,
        campaignManager:      d.manager,
        campaignManagerEmail: mgrM?.email ?? c.campaignManagerEmail,
        backupManager:        d.backup,
        backupManagerEmail:   bakM?.email ?? c.backupManagerEmail,
      };
    });
    onSave(updated);
    toast.success(`Coverage saved — ${changesCount} client${changesCount !== 1 ? 's' : ''} updated`);
    onClose();
  }

  if (!isOpen) return null;

  // Filter pill helper
  const pillStyle = (f: FilterLevel): React.CSSProperties => {
    const active  = filter === f;
    const colours = { all: 'var(--color-primary)', high: 'var(--color-error)', medium: 'var(--color-warning)', ok: 'var(--color-success)' };
    const c = colours[f];
    return {
      padding: '5px 12px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
      border: `1.5px solid ${active ? c : 'var(--color-border)'}`,
      background: active ? `${c}12` : 'transparent',
      color: active ? c : 'var(--color-text-secondary)',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap' as const,
    };
  };

  const rowProps = (client: Client, i: number) => ({
    client,
    draft: drafts[client.id],
    members,
    mgrLoads,
    bakLoads,
    urgency: urgencies[client.id] ?? { level: 'ok' as UrgencyLevel, reasons: [] },
    onChangeMgr: (v: string) => setManager(client.id, v),
    onChangeBak: (v: string) => setBackup(client.id, v),
    onReset:     () => resetClient(client.id),
    index: i,
  });

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50"
        style={{ background: 'var(--color-surface)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Modal panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 16 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="fixed z-50 inset-4 sm:inset-6 md:inset-8 flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxWidth: 1000,
          maxHeight: '92vh',
          margin: 'auto',
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
        >
          {/* Title row */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--color-primary-tint)' }}
              >
                <Building2 className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
                    Client Coverage Manager
                  </h2>
                  {counts.high > 0 && (
                    <motion.span
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.25)' }}
                    >
                      <Zap className="w-3 h-3" style={{ color: 'var(--color-error)' }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-error)' }}>{counts.high} urgent</span>
                    </motion.span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Assign campaign managers and backup coverage for all {clients.length} clients
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
              style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', background: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-border-light)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* KPI summary chips */}
          <div className="flex items-center flex-wrap gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{
                background: healthPct >= 80 ? 'rgba(5,150,105,0.08)' : 'rgba(217,119,6,0.08)',
                border: `1px solid ${healthPct >= 80 ? 'rgba(5,150,105,0.2)' : 'rgba(217,119,6,0.2)'}`,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: healthPct >= 80 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                {healthPct}% healthy
              </span>
            </div>
            {counts.high > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--color-error)' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-error)' }}>{counts.high} unprotected</span>
              </div>
            )}
            {counts.medium > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)' }}>
                <AlertCircle className="w-3.5 h-3.5" style={{ color: 'var(--color-warning)' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-warning)' }}>{counts.medium} at risk</span>
              </div>
            )}
            {counts.ok > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)' }}>
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-success)' }}>{counts.ok} covered</span>
              </div>
            )}
          </div>
        </div>

        {/* ── URGENT BANNER ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {counts.high > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-shrink-0 flex items-center gap-3 px-5 py-2.5"
              style={{ background: 'rgba(220,38,38,0.05)', borderBottom: '1px solid rgba(220,38,38,0.12)' }}
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-error)' }} />
              <span style={{ fontSize: 13, color: 'var(--color-error)', flex: 1 }}>
                <strong>{counts.high} client{counts.high !== 1 ? 's are' : ' is'} unprotected</strong> — assign a backup manager immediately to ensure continuity.
              </span>
              <button
                onClick={() => setFilter('high')}
                className="flex-shrink-0 px-3 py-1 rounded-lg transition-colors"
                style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-error)', border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.08)', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.14)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.08)')}
              >
                Show only
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FILTER + SEARCH ───────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center gap-2.5 px-5 py-3"
          style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'high', 'medium', 'ok'] as FilterLevel[]).map(f => (
              <button key={f} style={pillStyle(f)} onClick={() => setFilter(f)}>
                {FILTER_LABELS[f]}
                {f !== 'all' && (
                  <span
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full"
                    style={{ fontSize: 10, background: filter === f ? 'var(--color-surface)' : 'var(--color-surface)' }}
                  >
                    {counts[f as 'high'|'medium'|'ok']}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative sm:flex-1 sm:ml-auto" style={{ maxWidth: 280 }}>
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-secondary)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients…"
              style={{
                paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
                borderRadius: 10, fontSize: 13, width: '100%', outline: 'none',
                border: '1.5px solid var(--color-border)',
                background: 'white',
                color: 'var(--color-text-primary)',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
              onBlur={e  => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            />
          </div>

          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
            {filteredClients.length} of {clients.length}
          </div>
        </div>

        {/* ── CONTENT (table on md+, cards on mobile) ───────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Building2 className="w-10 h-10" style={{ color: 'var(--color-text-secondary)', opacity: 0.35 }} />
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>No clients match your filter</p>
              <button
                onClick={() => { setFilter('all'); setSearch(''); }}
                className="px-4 py-2 rounded-xl transition-colors"
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-border-light)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table — hidden on mobile */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      {['Client', 'Campaign Manager', 'Backup Manager', 'Coverage'].map(col => (
                        <th
                          key={col}
                          className="text-left px-4 py-3"
                          style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client, i) => (
                      <ClientRow key={client.id} {...rowProps(client, i)} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards — hidden on md+ */}
              <div className="md:hidden px-4 py-3">
                {filteredClients.map((client, i) => (
                  <ClientMobileCard key={client.id} {...rowProps(client, i)} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── FOOTER ────────────────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4"
          style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
        >
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {changesCount > 0 ? (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--color-primary)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {changesCount} unsaved change{changesCount !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setDrafts({})}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg ml-1 transition-colors"
                    style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-border-light)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <RotateCcw className="w-3 h-3" /> Reset all
                  </button>
                </motion.div>
              ) : (
                <motion.p
                  key="none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}
                >
                  No pending changes
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="btn-outline px-5 py-2.5 flex items-center gap-2"
              style={{ fontSize: 14 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={changesCount === 0}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontSize: 14 }}
            >
              <Save className="w-4 h-4" />
              Save {changesCount > 0 ? `(${changesCount})` : 'Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}