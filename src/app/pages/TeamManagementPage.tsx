import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, BarChart3, Upload, Settings, Mail, Phone,
  MoreVertical, UserPlus, Edit, Building2, Clock,
  ArrowRight, PowerOff, RefreshCw, ChevronDown, ChevronUp,
  AlertCircle, LayoutGrid, Shield,
} from 'lucide-react';
import { mockTeamMembers, TeamMember, TeamMemberRecord } from '../mockData';
import { allClients, Client } from '../data/mockClients';
import { useAuth } from '../context/AuthContext';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { PersonAvatar } from '../components/PersonAvatar';
import { TableRow } from '../components/TableRow';
import {
  EditMemberModal,
  AddMemberModal,
  DeactivateModal,
  ActivityLogModal,
  BulkReassignModal,
} from '../components/TeamMemberModals';
import { ClientCoverageModal } from '../components/ClientCoverageModal';

// ─── Types ──────────────────────────────────────────────────────────────────────

type ModalType =
  | 'edit'
  | 'coverage'
  | 'add-member'
  | 'deactivate'
  | 'activity'
  | 'bulk-reassign'
  | null;

type ExtendedMember = TeamMemberRecord;

// ─── Role badge ─────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, React.CSSProperties> = {
    'Campaign Manager':  { background: 'rgba(37,99,235,0.08)',  color: 'var(--color-info)', border: '1px solid rgba(37,99,235,0.2)'  },
    'Campaign Backup':   { background: 'rgba(124,58,237,0.08)', color: 'var(--color-accent-purple)', border: '1px solid rgba(124,58,237,0.2)' },
    'Operations Manager':{ background: 'rgba(186,32,39,0.08)',  color: 'var(--color-primary)', border: '1px solid rgba(186,32,39,0.2)'  },
  };
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-lg"
      style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', ...styles[role] ?? {} }}
    >
      {role}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const colour = status === 'Active' ? 'var(--color-success)' : status === 'Inactive' ? 'var(--color-text-muted)' : 'var(--color-warning)';
  return (
    <span className="inline-flex items-center gap-1.5" style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: colour, display: 'inline-block' }} />
      {status}
    </span>
  );
}

// ─── Action Dropdown ────────────────────────────────────────────────────────────

interface ActionMenuProps {
  member: ExtendedMember;
  isSelf: boolean;
  onAction: (type: ModalType) => void;
}

function ActionMenu({ member, isSelf, onAction }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isInactive = (member.status as string) === 'Inactive';

  const items = [
    { key: 'edit'          as ModalType, label: 'Edit Profile',               icon: <Edit className="w-4 h-4" />,       show: true },
    { key: 'coverage'      as ModalType, label: 'Manage Client Assignments',   icon: <Building2 className="w-4 h-4" />,  show: !isSelf && !isInactive },
    { key: 'bulk-reassign' as ModalType, label: 'Bulk Reassign Clients',       icon: <ArrowRight className="w-4 h-4" />, show: !isSelf && member.clientsAssigned > 0 },
    { key: 'activity'      as ModalType, label: 'View Activity Log',           icon: <Clock className="w-4 h-4" />,      show: true },
  ].filter(i => i.show);

  const dangerItems = [
    {
      key:    'deactivate' as ModalType,
      label:  isInactive ? 'Reactivate Member' : 'Deactivate Member',
      icon:   isInactive ? <RefreshCw className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />,
      show:   !isSelf,
      colour: isInactive ? 'var(--color-success)' : 'var(--color-error)',
    },
  ].filter(i => i.show);

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
        style={{
          border:     open ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
          background: open ? 'rgba(186,32,39,0.06)' : 'transparent',
          color:      'var(--color-text-secondary)',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = 'var(--color-border)'; }}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.13 }}
            className="absolute right-0 z-40 py-1.5 min-w-[210px]"
            style={{
              top:         'calc(100% + 6px)',
              background:  'var(--glass-bg)',
              border:      '1px solid var(--glass-border)',
              borderRadius:'var(--radius-lg)',
              boxShadow:   'var(--card-shadow-lg)',
            }}
          >
            {items.map(item => (
              <button
                key={String(item.key)}
                onClick={() => { onAction(item.key); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(186,32,39,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ color: 'var(--color-text-secondary)' }}>{item.icon}</span>
                {item.label}
              </button>
            ))}

            {dangerItems.length > 0 && (
              <>
                <div className="my-1" style={{ height: 1, background: 'var(--color-border)' }} />
                {dangerItems.map(item => (
                  <button
                    key={String(item.key)}
                    onClick={() => { onAction(item.key); setOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                    style={{ fontSize: '13px', fontWeight: 500, color: item.colour, background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function TeamManagementPage() {
  const { currentUser, canManageTeam } = useAuth();
  const navigate = useNavigate();
  const isOpsManager = canManageTeam();

  // Local state — edits persist within the session
  const [members, setMembers] = useState<ExtendedMember[]>(
    mockTeamMembers.map(m => ({ ...m, status: m.status as 'Active' | 'Away' | 'Inactive' }))
  );
  const [clients, setClients] = useState<Client[]>([...allClients]);

  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder]  = useState<'asc' | 'desc'>('asc');

  const [modalType,     setModalType]     = useState<ModalType>(null);
  const [selectedMember, setSelectedMember] = useState<ExtendedMember | null>(null);

  function openModal(type: ModalType, member?: ExtendedMember) {
    setSelectedMember(member ?? null);
    setModalType(type);
  }
  function closeModal() { setModalType(null); setSelectedMember(null); }

  // ── Sort ────────────────────────────────────────────────────────────────────

  function handleSort(field: string) {
    if (sortField === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  }

  const sortedMembers = [...members].sort((a, b) => {
    const av = a[sortField as keyof ExtendedMember];
    const bv = b[sortField as keyof ExtendedMember];
    if (typeof av === 'string' && typeof bv === 'string')
      return sortOrder === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    if (typeof av === 'number' && typeof bv === 'number')
      return sortOrder === 'asc' ? av - bv : bv - av;
    return 0;
  });

  // ── Action handlers ─────────────────────────────────────────────────────────

  function handleEditSave(updated: TeamMember) {
    setMembers(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
  }

  /** Called by ClientCoverageModal when ops manager saves coverage assignments */
  function handleCoverageSave(updatedClients: Client[]) {
    setClients(updatedClients);
    // Recalculate clientsAssigned counts for each member
    setMembers(prev => prev.map(m => {
      const asManager = updatedClients.filter(c => c.campaignManager === m.name).length;
      const asBackup  = updatedClients.filter(c => c.backupManager  === m.name).length;
      const combined  = new Set([
        ...updatedClients.filter(c => c.campaignManager === m.name).map(c => c.companyName),
        ...updatedClients.filter(c => c.backupManager   === m.name).map(c => c.companyName),
      ]);
      return { ...m, clientsAssigned: combined.size, assignedClients: [...combined] };
    }));
  }

  function handleAddMember(newMember: Omit<TeamMember, 'id'>) {
    const id = `tm_${Date.now()}`;
    setMembers(prev => [...prev, { ...newMember, id, status: 'Active' } as ExtendedMember]);
  }

  function handleDeactivate(memberId: string, reassignToName: string | null) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const isCurrentlyInactive = (member.status as string) === 'Inactive';

    setMembers(prev => prev.map(m =>
      m.id === memberId ? { ...m, status: (isCurrentlyInactive ? 'Active' : 'Inactive') as any } : m
    ));

    if (!isCurrentlyInactive && reassignToName) {
      setClients(prev => prev.map(c => ({
        ...c,
        campaignManager: c.campaignManager === member.name ? reassignToName : c.campaignManager,
        backupManager:   c.backupManager   === member.name ? reassignToName : c.backupManager,
      })));
      setMembers(prev => {
        const withExtra = prev.map(m => {
          if (m.name !== reassignToName) return m;
          const extra = member.assignedClients.filter(c => !m.assignedClients.includes(c));
          return { ...m, assignedClients: [...m.assignedClients, ...extra], clientsAssigned: m.clientsAssigned + extra.length };
        });
        return withExtra.map(m => m.id === memberId ? { ...m, assignedClients: [], clientsAssigned: 0 } : m);
      });
    }
  }

  function handleBulkReassign(fromId: string, toName: string) {
    const from = members.find(m => m.id === fromId);
    if (!from) return;

    setClients(prev => prev.map(c => ({
      ...c,
      campaignManager: c.campaignManager === from.name ? toName : c.campaignManager,
      backupManager:   c.backupManager   === from.name ? toName : c.backupManager,
    })));

    setMembers(prev => prev.map(m => {
      if (m.id === fromId) return { ...m, assignedClients: [], clientsAssigned: 0 };
      if (m.name === toName) {
        const extra = from.assignedClients.filter(c => !m.assignedClients.includes(c));
        return { ...m, assignedClients: [...m.assignedClients, ...extra], clientsAssigned: m.clientsAssigned + extra.length };
      }
      return m;
    }));
  }

  // ── KPI Stats ───────────────────────────────────────────────────────────────

  const activeMembers = members.filter(m => (m.status as string) !== 'Inactive');

  const stats = [
    { label: 'Team Members',  value: members.length,                                                   icon: <Users className="w-5 h-5" />,    colour: 'var(--color-info)', bg: 'rgba(37,99,235,0.08)'   },
    { label: 'Managers',       value: activeMembers.filter(m => m.role === 'Campaign Manager').length,  icon: <BarChart3 className="w-5 h-5" />, colour: 'var(--color-success)', bg: 'rgba(5,150,105,0.08)'   },
    { label: 'Backups',        value: activeMembers.filter(m => m.role === 'Campaign Backup').length,   icon: <Shield className="w-5 h-5" />,    colour: 'var(--color-primary)', bg: 'rgba(186,32,39,0.08)'   },
    { label: 'Ops',            value: activeMembers.filter(m => m.role === 'Operations Manager').length,icon: <Settings className="w-5 h-5" />,  colour: 'var(--color-warning)', bg: 'rgba(217,119,6,0.08)'   },
  ];

  // ── Quick coverage health (for banner cue) ──────────────────────────────────

  const uncoveredClients = clients.filter(c =>
    !c.backupManager || c.backupManager === '—' || c.backupManager === c.campaignManager
  );

  // ── Sort header helpers ─────────────────────────────────────────────────────

  function SortTh({ field, label }: { field: string; label: string }) {
    const active = sortField === field;
    return (
      <th
        className="text-left px-6 py-4 cursor-pointer select-none"
        onClick={() => handleSort(field)}
        style={{ fontSize: '11px', fontWeight: 700, color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}
      >
        <span className="flex items-center gap-1">
          {label}
          {active && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
        </span>
      </th>
    );
  }

  function PlainTh({ label }: { label: string }) {
    return (
      <th className="text-left px-6 py-4" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
        {label}
      </th>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-6 py-6">

        {/* Page header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 style={{ color: 'var(--color-text-primary)', margin: 0 }}>Team Management</h1>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: 4 }}>
              {isOpsManager
                ? 'Manage team members, roles, client assignments and backup coverage.'
                : 'View team members and their permissions.'}
            </p>
          </div>

          {isOpsManager && (
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Client Coverage Manager — primary action */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openModal('coverage')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl relative"
                style={{
                  background: uncoveredClients.length > 0 ? 'var(--color-error)' : 'rgba(186,32,39,0.08)',
                  color:      uncoveredClients.length > 0 ? '#fff'    : 'var(--color-primary)',
                  fontWeight: 600,
                  fontSize:   '14px',
                  border:     `1.5px solid ${uncoveredClients.length > 0 ? 'var(--color-error)' : 'rgba(186,32,39,0.2)'}`,
                  cursor:     'pointer',
                }}
              >
                <LayoutGrid className="w-4 h-4" />
                Client Coverage
                {uncoveredClients.length > 0 && (
                  <motion.span
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                    className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full"
                    style={{ background: 'var(--color-surface-raised)', fontSize: '11px', fontWeight: 800 }}
                  >
                    {uncoveredClients.length}
                  </motion.span>
                )}
              </motion.button>

              {/* Add member — secondary */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openModal('add-member')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                style={{ background: 'var(--color-primary)', color: '#fff', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' }}
              >
                <UserPlus className="w-4 h-4" />
                Add Member
              </motion.button>
            </div>
          )}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
              className="rounded-2xl p-5"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'var(--card-shadow)' }}
            >
              <div className="mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg, color: s.colour }}>
                  {s.icon}
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>
                <AnimatedCounter value={s.value} />
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 6 }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Urgency banners */}
        <AnimatePresence>
          {uncoveredClients.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl cursor-pointer"
              style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}
              onClick={() => openModal('coverage')}
            >
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-error)' }} />
              </motion.div>
              <span style={{ fontSize: '13px', color: 'var(--color-error)' }}>
                <strong>{uncoveredClients.length} client{uncoveredClients.length !== 1 ? 's' : ''}</strong> {uncoveredClients.length !== 1 ? 'have' : 'has'} no backup coverage —{' '}
                <span style={{ textDecoration: 'underline', fontWeight: 600 }}>open Coverage Manager to fix</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {members.some(m => (m.status as string) === 'Inactive') && (
          <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl" style={{ background: 'rgba(217,119,6,0.05)', border: '1px solid rgba(217,119,6,0.2)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-warning)' }} />
            <span style={{ fontSize: '13px', color: 'var(--color-warning)' }}>
              {members.filter(m => (m.status as string) === 'Inactive').length} inactive member(s) — review client assignments.
            </span>
          </div>
        )}

        {/* Team table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, type: 'spring', stiffness: 300, damping: 28 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'var(--card-shadow)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                <tr>
                  <SortTh field="name" label="Name" />
                  <PlainTh label="Contact" />
                  <SortTh field="role" label="Role" />
                  <SortTh field="clientsAssigned" label="Clients" />
                  <PlainTh label="Status" />
                  {isOpsManager && <PlainTh label="Actions" />}
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map((member, index) => {
                  const isSelf     = currentUser.name === member.name;
                  const isInactive = (member.status as string) === 'Inactive';

                  return (
                    <TableRow key={member.id} showHoverEffect animationDelay={index * 60}>

                      {/* Name + avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <PersonAvatar name={member.name} size={42} />
                            {isInactive && (
                              <div className="absolute inset-0 rounded-xl" style={{ background: 'var(--color-surface-raised)' }} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span style={{ fontSize: '14px', fontWeight: 600, color: isInactive ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>
                                {member.name}
                              </span>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 rounded" style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(186,32,39,0.1)', color: 'var(--color-primary)' }}>YOU</span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: 1 }}>
                              {member.activeCampaigns} active campaign{member.activeCampaigns !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 mb-1" style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate" style={{ maxWidth: 180 }}>{member.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5" style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          {member.phone}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <RoleBadge role={member.role} />
                      </td>

                      {/* Client count */}
                      <td className="px-6 py-4">
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {member.clientsAssigned}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>assigned</div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusDot status={member.status} />
                      </td>

                      {/* Actions — ops only */}
                      {isOpsManager && (
                        <td className="px-6 py-4">
                          <ActionMenu
                            member={member}
                            isSelf={isSelf}
                            onAction={type => openModal(type, member)}
                          />
                        </td>
                      )}
                    </TableRow>
                  );
                })}
              </tbody>
            </table>
          </div>

          {isOpsManager && (
            <div className="px-6 py-3 flex flex-wrap items-center gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                Ops actions: <strong>Edit</strong> · <strong>Manage Client Assignments</strong> · <strong>Bulk Reassign</strong> · <strong>Activity Log</strong> · <strong>Deactivate / Reactivate</strong>
              </span>
            </div>
          )}
        </motion.div>

        {/* Live coverage summary table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, type: 'spring', stiffness: 300, damping: 28 }}
          className="rounded-2xl overflow-hidden mt-6"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'var(--card-shadow)' }}
        >
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <h2 style={{ color: 'var(--color-text-primary)', margin: 0 }}>Client Coverage Overview</h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                Live assignment view — updates immediately when you save changes
              </p>
            </div>
            {isOpsManager && (
              <button
                onClick={() => openModal('coverage')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
                style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)', border: '1.5px solid rgba(186,32,39,0.2)', background: 'rgba(186,32,39,0.05)', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(186,32,39,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(186,32,39,0.05)')}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Edit Assignments
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                <tr>
                  {['Client', 'Industry', 'Campaign Manager', 'Backup', 'Coverage', 'Active Campaigns'].map(h => (
                    <th key={h} className="text-left px-6 py-3" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((client, i) => {
                  const noBackup = !client.backupManager || client.backupManager === '—' || client.backupManager === client.campaignManager;
                  return (
                    <TableRow key={client.id} showHoverEffect={false} animationDelay={i * 50}>
                      <td className="px-6 py-3.5">
                        <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>{client.companyName}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{client.industry}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <PersonAvatar name={client.campaignManager} size={26} />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{client.campaignManager}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          {noBackup ? (
                            <span className="flex items-center gap-1.5" style={{ fontSize: '13px', color: 'var(--color-error)', fontWeight: 600 }}>
                              <AlertCircle className="w-3.5 h-3.5" /> No backup
                            </span>
                          ) : (
                            <>
                              <PersonAvatar name={client.backupManager} size={26} />
                              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{client.backupManager}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        {noBackup ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full" style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(220,38,38,0.1)', color: 'var(--color-error)', border: '1px solid rgba(220,38,38,0.2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Unprotected
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full" style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Covered
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {client.campaigns.filter(c => c.status === 'active').length}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}> / {client.campaigns.length}</span>
                      </td>
                    </TableRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────────── */}

      {/* Combined Client Coverage Manager */}
      {modalType === 'coverage' && (
        <ClientCoverageModal
          isOpen
          onClose={closeModal}
          clients={clients}
          members={members as unknown as TeamMember[]}
          onSave={handleCoverageSave}
        />
      )}

      {modalType === 'edit' && selectedMember && (
        <EditMemberModal isOpen onClose={closeModal} member={selectedMember} onSave={handleEditSave} />
      )}

      {modalType === 'add-member' && (
        <AddMemberModal isOpen onClose={closeModal} onSave={handleAddMember} />
      )}

      {modalType === 'deactivate' && selectedMember && (
        <DeactivateModal
          isOpen
          onClose={closeModal}
          member={selectedMember}
          allMembers={members}
          isDeactivating={(selectedMember.status as string) !== 'Inactive'}
          onConfirm={handleDeactivate}
        />
      )}

      {modalType === 'activity' && selectedMember && (
        <ActivityLogModal isOpen onClose={closeModal} member={selectedMember} />
      )}

      {modalType === 'bulk-reassign' && selectedMember && (
        <BulkReassignModal isOpen onClose={closeModal} member={selectedMember} allMembers={members} onSave={handleBulkReassign} />
      )}
    </>
  );
}
