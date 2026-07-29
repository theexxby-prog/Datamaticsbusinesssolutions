import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, User, Mail, Phone, Shield, Users, AlertTriangle,
  Clock, CheckCircle2, Upload, ChevronDown, UserPlus, Building2,
  ArrowRight, Activity, Briefcase, RefreshCw,
} from 'lucide-react';
import { TeamMember, TeamMemberRecord } from '../mockData';
import { Client } from '../data/mockClients';
import { PersonAvatar } from './PersonAvatar';

// ─── Shared ────────────────────────────────────────────────────────────────────

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--card-shadow-lg)',
            borderRadius: 'var(--radius-xl)',
          }}
          className="w-full relative"
        >
          {children}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function ModalHeader({ title, subtitle, icon, onClose }: { title: string; subtitle?: string; icon: React.ReactNode; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between p-6 pb-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-tint, rgba(186,32,39,0.08))' }}>
          <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
        </div>
        <div>
          <h2 style={{ color: 'var(--color-text-primary)', margin: 0, fontSize: '16px', fontWeight: 600 }}>{title}</h2>
          {subtitle && <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '13px', marginTop: 2 }}>{subtitle}</p>}
        </div>
      </div>
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
        style={{ color: 'var(--color-text-secondary)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-border-light, rgba(0,0,0,0.05))')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', margin: 0 }}>{label}</label>
      {children}
    </div>
  );
}

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    padding: '9px 12px',
    borderRadius: 'var(--radius-md)',
    border: `1.5px solid ${focused ? 'var(--color-primary)' : 'var(--color-border, rgba(186,32,39,0.12))'}`,
    background: 'var(--input-background)',
    color: 'var(--color-text-primary)',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.15s',
    boxShadow: focused ? '0 0 0 3px rgba(186,32,39,0.08)' : 'none',
  };
}

function PrimaryButton({ onClick, children, disabled, danger }: { onClick?: () => void; children: React.ReactNode; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
      style={{
        background: danger ? '#DC2626' : 'var(--color-primary)',
        color: '#fff',
        fontWeight: 600,
        fontSize: '14px',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: 'none',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.88'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = disabled ? '0.5' : '1'; }}
    >
      {children}
    </button>
  );
}

function GhostButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
      style={{
        background: 'transparent',
        color: 'var(--color-text-secondary)',
        fontWeight: 500,
        fontSize: '14px',
        border: '1.5px solid var(--color-border, rgba(186,32,39,0.12))',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  );
}

// ─── 1. Edit Member Modal ───────────────────────────────────────────────────────

export interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMemberRecord;
  onSave: (updated: TeamMemberRecord) => void;
}

export function EditMemberModal({ isOpen, onClose, member, onSave }: EditMemberModalProps) {
  const [form, setForm] = useState({ name: member.name, email: member.email, phone: member.phone, role: member.role });
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => { setForm({ name: member.name, email: member.email, phone: member.phone, role: member.role }); }, [member]);

  if (!isOpen) return null;

  const roles: TeamMember['role'][] = ['Campaign Manager', 'Campaign Backup', 'Operations Manager'];

  function handleSave() {
    onSave({ ...member, ...form });
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        <ModalHeader title="Edit Team Member" subtitle={`Editing profile for ${member.name}`} icon={<User className="w-5 h-5" />} onClose={onClose} />
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(186,32,39,0.04)', border: '1px solid rgba(186,32,39,0.1)' }}>
            <PersonAvatar name={member.name} size={44} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>{member.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{member.clientsAssigned} clients assigned</div>
            </div>
          </div>

          <FormField label="Full Name">
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              style={inputStyle(focused === 'name')}
              placeholder="Full name"
            />
          </FormField>

          <FormField label="Email Address">
            <input
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              style={inputStyle(focused === 'email')}
              placeholder="email@company.com"
            />
          </FormField>

          <FormField label="Phone">
            <input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              onFocus={() => setFocused('phone')}
              onBlur={() => setFocused(null)}
              style={inputStyle(focused === 'phone')}
              placeholder="+1 555-000-0000"
            />
          </FormField>

          <FormField label="Role">
            <div className="relative">
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as TeamMember['role'] }))}
                onFocus={() => setFocused('role')}
                onBlur={() => setFocused(null)}
                style={{ ...inputStyle(focused === 'role'), appearance: 'none', paddingRight: 36 }}
              >
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </FormField>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={handleSave} disabled={!form.name || !form.email}>
            <CheckCircle2 className="w-4 h-4" /> Save Changes
          </PrimaryButton>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── 2. Assign Clients Modal ────────────────────────────────────────────────────

export interface AssignClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMemberRecord;
  allClients: Client[];
  onSave: (memberId: string, managerClientIds: string[], backupClientIds: string[]) => void;
}

export function AssignClientsModal({ isOpen, onClose, member, allClients, onSave }: AssignClientsModalProps) {
  const [tab, setTab] = useState<'manager' | 'backup'>('manager');

  const initialManagerIds = allClients.filter(c => c.campaignManager === member.name).map(c => c.id);
  const initialBackupIds = allClients.filter(c => c.backupManager === member.name).map(c => c.id);

  const [managerClientIds, setManagerClientIds] = useState<string[]>(initialManagerIds);
  const [backupClientIds, setBackupClientIds] = useState<string[]>(initialBackupIds);

  useEffect(() => {
    setManagerClientIds(allClients.filter(c => c.campaignManager === member.name).map(c => c.id));
    setBackupClientIds(allClients.filter(c => c.backupManager === member.name).map(c => c.id));
    setTab('manager');
  }, [member, allClients]);

  if (!isOpen) return null;

  const activeIds = tab === 'manager' ? managerClientIds : backupClientIds;
  const setActiveIds = tab === 'manager' ? setManagerClientIds : setBackupClientIds;

  function toggle(id: string) {
    setActiveIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ maxWidth: 520, width: '100%' }}>
        <ModalHeader title="Manage Client Assignments" subtitle={`Assign clients to ${member.name}`} icon={<Building2 className="w-5 h-5" />} onClose={onClose} />
        <div className="p-6 flex flex-col gap-4">
          {/* Tab switcher */}
          <div className="flex rounded-xl p-1 gap-1" style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid var(--color-border)' }}>
            {(['manager', 'backup'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                style={{
                  fontWeight: 600,
                  fontSize: '13px',
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {t === 'manager' ? <Briefcase className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                {t === 'manager' ? 'As Manager' : 'As Backup'}
                {t === 'manager'
                  ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px]" style={{ background: 'rgba(186,32,39,0.1)', color: 'var(--color-primary)' }}>{managerClientIds.length}</span>
                  : <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px]" style={{ background: 'rgba(186,32,39,0.1)', color: 'var(--color-primary)' }}>{backupClientIds.length}</span>}
              </button>
            ))}
          </div>

          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
            {tab === 'manager'
              ? 'Select clients where this person is the primary campaign manager.'
              : 'Select clients where this person provides backup coverage.'}
          </p>

          {/* Client list */}
          <div className="flex flex-col gap-2" style={{ maxHeight: 280, overflowY: 'auto' }}>
            {allClients.map(client => {
              const checked = activeIds.includes(client.id);
              return (
                <div
                  key={client.id}
                  onClick={() => toggle(client.id)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={{
                    border: `1.5px solid ${checked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: checked ? 'rgba(186,32,39,0.04)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!checked) e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }}
                  onMouseLeave={e => { if (!checked) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      border: `2px solid ${checked ? 'var(--color-primary)' : 'rgba(0,0,0,0.2)'}`,
                      background: checked ? 'var(--color-primary)' : 'transparent',
                    }}
                  >
                    {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>{client.companyName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {client.industry} · {client.campaigns.filter(c => c.status === 'active').length} active campaigns
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 text-right">
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Manager: {client.campaignManager}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Backup: {client.backupManager}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={() => { onSave(member.id, managerClientIds, backupClientIds); onClose(); }}>
            <CheckCircle2 className="w-4 h-4" /> Save Assignments
          </PrimaryButton>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── 3. Set Backup Modal ────────────────────────────────────────────────────────

export interface SetBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: TeamMember;
  allMembers: TeamMemberRecord[];
  onSave: (managerId: string, backupMemberName: string) => void;
}

export function SetBackupModal({ isOpen, onClose, manager, allMembers, onSave }: SetBackupModalProps) {
  const eligibleBackups = allMembers.filter(m => m.id !== manager.id && m.status !== 'Inactive' as any);
  const currentBackup = allMembers.find(m =>
    m.role === 'Campaign Backup' && m.assignedClients.some(c => manager.assignedClients.includes(c))
  );
  const [selectedId, setSelectedId] = useState<string>(currentBackup?.id ?? eligibleBackups[0]?.id ?? '');

  useEffect(() => { setSelectedId(currentBackup?.id ?? eligibleBackups[0]?.id ?? ''); }, [manager]);

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        <ModalHeader title="Set Backup Coverage" subtitle={`Choose who covers ${manager.name}'s clients`} icon={<Shield className="w-5 h-5" />} onClose={onClose} />
        <div className="p-6 flex flex-col gap-4">
          <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(186,32,39,0.04)', border: '1px solid rgba(186,32,39,0.1)' }}>
            <PersonAvatar name={manager.name} size={40} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>{manager.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {manager.assignedClients.length} clients need backup coverage
              </div>
            </div>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
            The selected person will be set as backup for all of {manager.name.split(' ')[0]}'s assigned clients.
          </p>

          <div className="flex flex-col gap-2" style={{ maxHeight: 260, overflowY: 'auto' }}>
            {eligibleBackups.map(m => {
              const isSelected = selectedId === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={{
                    border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: isSelected ? 'rgba(186,32,39,0.04)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{
                      border: `2px solid ${isSelected ? 'var(--color-primary)' : 'rgba(0,0,0,0.2)'}`,
                      background: isSelected ? 'var(--color-primary)' : 'transparent',
                    }}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <PersonAvatar name={m.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>{m.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{m.role} · {m.clientsAssigned} current clients</div>
                  </div>
                  {m.id === currentBackup?.id && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: 'rgba(5,150,105,0.1)', color: '#059669' }}>Current</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={() => { const sel = eligibleBackups.find(m => m.id === selectedId); if (sel) { onSave(manager.id, sel.name); onClose(); } }} disabled={!selectedId}>
            <Shield className="w-4 h-4" /> Set Backup
          </PrimaryButton>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── 4. Add New Member Modal ────────────────────────────────────────────────────

export interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<TeamMember, 'id'>) => void;
}

export function AddMemberModal({ isOpen, onClose, onSave }: AddMemberModalProps) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'Campaign Manager' as TeamMember['role'] });
  const [focused, setFocused] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const roles: TeamMember['role'][] = ['Campaign Manager', 'Campaign Backup', 'Operations Manager'];

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave({
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      assignedClients: [],
      activeCampaigns: 0,
      clientsAssigned: 0,
      status: 'Active',
    });
    setForm({ name: '', email: '', phone: '', role: 'Campaign Manager' });
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        <ModalHeader title="Add Team Member" subtitle="Onboard a new member to the operations team" icon={<UserPlus className="w-5 h-5" />} onClose={onClose} />
        <div className="p-6 flex flex-col gap-4">
          <FormField label="Full Name">
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              style={{ ...inputStyle(focused === 'name'), borderColor: errors.name ? '#DC2626' : (focused === 'name' ? 'var(--color-primary)' : 'var(--color-border)') }}
              placeholder="e.g. Priya Sharma"
            />
            {errors.name && <p style={{ fontSize: '12px', color: '#DC2626', margin: 0 }}>{errors.name}</p>}
          </FormField>

          <FormField label="Work Email">
            <input
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              style={{ ...inputStyle(focused === 'email'), borderColor: errors.email ? '#DC2626' : (focused === 'email' ? 'var(--color-primary)' : 'var(--color-border)') }}
              placeholder="name@datamaticsbpm.com"
            />
            {errors.email && <p style={{ fontSize: '12px', color: '#DC2626', margin: 0 }}>{errors.email}</p>}
          </FormField>

          <FormField label="Phone">
            <input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              onFocus={() => setFocused('phone')}
              onBlur={() => setFocused(null)}
              style={{ ...inputStyle(focused === 'phone'), borderColor: errors.phone ? '#DC2626' : (focused === 'phone' ? 'var(--color-primary)' : 'var(--color-border)') }}
              placeholder="+91 22 4040 0000"
            />
            {errors.phone && <p style={{ fontSize: '12px', color: '#DC2626', margin: 0 }}>{errors.phone}</p>}
          </FormField>

          <FormField label="Role">
            <div className="relative">
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as TeamMember['role'] }))}
                onFocus={() => setFocused('role')}
                onBlur={() => setFocused(null)}
                style={{ ...inputStyle(focused === 'role'), appearance: 'none', paddingRight: 36 }}
              >
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </FormField>

          <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)' }}>
            <Activity className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#2563EB' }} />
            <p style={{ fontSize: '12px', color: '#2563EB', margin: 0, lineHeight: '1.5' }}>
              The new member will be added as <strong>Active</strong>. You can assign clients to them after creation.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={handleSave}>
            <UserPlus className="w-4 h-4" /> Add Member
          </PrimaryButton>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── 5. Deactivate Modal ────────────────────────────────────────────────────────

export interface DeactivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMemberRecord;
  allMembers: TeamMemberRecord[];
  isDeactivating: boolean; // true = deactivate, false = reactivate
  onConfirm: (memberId: string, reassignToName: string | null) => void;
}

export function DeactivateModal({ isOpen, onClose, member, allMembers, isDeactivating, onConfirm }: DeactivateModalProps) {
  const [reassignTo, setReassignTo] = useState<string>('none');
  const eligible = allMembers.filter(m => m.id !== member.id && (m.status as string) !== 'Inactive');

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ maxWidth: 460, width: '100%' }}>
        <ModalHeader
          title={isDeactivating ? 'Deactivate Member' : 'Reactivate Member'}
          subtitle={isDeactivating ? 'This will suspend their access to the portal' : 'Restore this member\'s portal access'}
          icon={<AlertTriangle className="w-5 h-5" />}
          onClose={onClose}
        />
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ border: '1px solid var(--color-border)' }}>
            <PersonAvatar name={member.name} size={44} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>{member.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{member.role} · {member.clientsAssigned} clients assigned</div>
            </div>
          </div>

          {isDeactivating && member.clientsAssigned > 0 && (
            <>
              <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.15)' }}>
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#DC2626' }} />
                <p style={{ fontSize: '12px', color: '#DC2626', margin: 0, lineHeight: '1.5' }}>
                  This member has <strong>{member.clientsAssigned} active client{member.clientsAssigned !== 1 ? 's' : ''}</strong>. Consider reassigning them before deactivating.
                </p>
              </div>

              <FormField label="Reassign clients to (optional)">
                <div className="relative">
                  <select
                    value={reassignTo}
                    onChange={e => setReassignTo(e.target.value)}
                    style={{ ...inputStyle(false), appearance: 'none', paddingRight: 36 }}
                  >
                    <option value="none">— Do not reassign —</option>
                    {eligible.map(m => <option key={m.id} value={m.name}>{m.name} ({m.role})</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-secondary)' }} />
                </div>
              </FormField>
            </>
          )}

          {!isDeactivating && (
            <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.15)' }}>
              <RefreshCw className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#059669' }} />
              <p style={{ fontSize: '12px', color: '#059669', margin: 0, lineHeight: '1.5' }}>
                Reactivating <strong>{member.name}</strong> will restore their portal access. You can reassign clients to them afterward.
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton
            danger={isDeactivating}
            onClick={() => { onConfirm(member.id, reassignTo === 'none' ? null : reassignTo); onClose(); }}
          >
            {isDeactivating
              ? <><AlertTriangle className="w-4 h-4" /> Deactivate</>
              : <><RefreshCw className="w-4 h-4" /> Reactivate</>}
          </PrimaryButton>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── 6. Activity Log Modal ──────────────────────────────────────────────────────

export interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMemberRecord;
}

interface ActivityEntry {
  id: string;
  type: 'upload' | 'assignment' | 'login' | 'campaign' | 'approval';
  label: string;
  detail: string;
  time: string;
  status?: 'success' | 'warning' | 'error';
}

const ACTIVITY_BY_MEMBER: Record<string, ActivityEntry[]> = {
  tm_1: [
    { id: 'a1', type: 'upload', label: 'Uploaded leads batch', detail: 'tcc_lenovo_fifa_july_batch1.csv · 450 rows', time: 'Mar 2, 2026 · 10:30 AM', status: 'warning' },
    { id: 'a2', type: 'upload', label: 'Uploaded leads batch', detail: 'meridian_uk_bant_batch3.csv · 172 rows', time: 'Feb 28, 2026 · 1:00 PM', status: 'success' },
    { id: 'a3', type: 'campaign', label: 'Created new campaign', detail: 'AI-Powered SaaS Lead Generation Q2 2026', time: 'Feb 28, 2026 · 11:00 AM', status: 'success' },
    { id: 'a4', type: 'approval', label: 'Submitted for approval', detail: 'APAC Cloud Migration Leads – Q1 2026', time: 'Feb 26, 2026 · 9:15 AM', status: 'success' },
    { id: 'a5', type: 'login', label: 'Portal login', detail: 'From Mumbai, India · Chrome on macOS', time: 'Feb 25, 2026 · 8:45 AM', status: 'success' },
  ],
  tm_2: [
    { id: 'b1', type: 'upload', label: 'Uploaded leads batch', detail: 'global_innovations_batch4.csv · 234 rows', time: 'Mar 2, 2026 · 8:45 AM', status: 'success' },
    { id: 'b2', type: 'campaign', label: 'Paused campaign delivery', detail: 'Manufacturing Leads – North America Q1 2026', time: 'Feb 28, 2026 · 3:00 PM', status: 'warning' },
    { id: 'b3', type: 'assignment', label: 'Client assignment updated', detail: 'Added to Global Innovations Inc', time: 'Feb 15, 2026 · 10:00 AM', status: 'success' },
    { id: 'b4', type: 'login', label: 'Portal login', detail: 'From San Francisco, CA · Safari on macOS', time: 'Feb 14, 2026 · 9:00 AM', status: 'success' },
  ],
  tm_3: [
    { id: 'c1', type: 'upload', label: 'Uploaded leads batch', detail: 'nexus_medical_devices_batch3.xlsx · 567 rows', time: 'Mar 1, 2026 · 2:00 PM', status: 'success' },
    { id: 'c2', type: 'upload', label: 'Upload failed', detail: 'emea_industrial_batch2.csv · Invalid CSV structure', time: 'Mar 1, 2026 · 4:20 PM', status: 'error' },
    { id: 'c3', type: 'campaign', label: 'Created new campaign', detail: 'Healthcare IT BANT Qualification – EMEA', time: 'Feb 1, 2026 · 9:30 AM', status: 'success' },
    { id: 'c4', type: 'login', label: 'Portal login', detail: 'From New York, NY · Chrome on Windows', time: 'Mar 1, 2026 · 9:00 AM', status: 'success' },
  ],
  tm_4: [
    { id: 'd1', type: 'upload', label: 'Uploaded leads batch', detail: 'techco_na_batch5.xlsx · 823 rows', time: 'Mar 2, 2026 · 9:15 AM', status: 'success' },
    { id: 'd2', type: 'campaign', label: 'Reviewed campaign', detail: 'SMB SaaS Decision Makers – EMEA 2026', time: 'Feb 22, 2026 · 11:00 AM', status: 'success' },
    { id: 'd3', type: 'login', label: 'Portal login', detail: 'From Mumbai, India · Chrome on Android', time: 'Mar 2, 2026 · 8:45 AM', status: 'success' },
  ],
  tm_5: [
    { id: 'e1', type: 'assignment', label: 'Client assignments updated', detail: 'Reassigned Nexus Enterprises to Emily Rodriguez', time: 'Mar 1, 2026 · 3:00 PM', status: 'success' },
    { id: 'e2', type: 'assignment', label: 'New team member added', detail: 'Onboarded Emily Rodriguez as Campaign Manager', time: 'Feb 15, 2026 · 10:00 AM', status: 'success' },
    { id: 'e3', type: 'campaign', label: 'Approved campaign', detail: 'AI-Powered SaaS Lead Generation Q2 2026', time: 'Mar 1, 2026 · 1:00 PM', status: 'success' },
    { id: 'e4', type: 'login', label: 'Portal login', detail: 'From Mumbai, India · Chrome on macOS', time: 'Mar 3, 2026 · 9:00 AM', status: 'success' },
  ],
};

const ACTIVITY_ICONS: Record<ActivityEntry['type'], React.ReactNode> = {
  upload: <Upload className="w-3.5 h-3.5" />,
  assignment: <Users className="w-3.5 h-3.5" />,
  login: <User className="w-3.5 h-3.5" />,
  campaign: <Briefcase className="w-3.5 h-3.5" />,
  approval: <CheckCircle2 className="w-3.5 h-3.5" />,
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  success: { bg: 'rgba(5,150,105,0.1)', color: '#059669' },
  warning: { bg: 'rgba(217,119,6,0.1)', color: '#D97706' },
  error: { bg: 'rgba(220,38,38,0.1)', color: '#DC2626' },
};

export function ActivityLogModal({ isOpen, onClose, member }: ActivityLogModalProps) {
  if (!isOpen) return null;
  const entries = ACTIVITY_BY_MEMBER[member.id] ?? [];

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ maxWidth: 520, width: '100%' }}>
        <ModalHeader title="Activity Log" subtitle={`Recent actions by ${member.name}`} icon={<Clock className="w-5 h-5" />} onClose={onClose} />
        <div className="p-6">
          {entries.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>No activity found for this member.</div>
          ) : (
            <div className="relative flex flex-col gap-0" style={{ maxHeight: 360, overflowY: 'auto' }}>
              {/* Timeline line */}
              <div className="absolute left-4 top-4 bottom-4 w-px" style={{ background: 'var(--color-border)' }} />
              {entries.map((entry, i) => {
                const colors = STATUS_COLORS[entry.status ?? 'success'];
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex gap-4 pb-5 relative"
                  >
                    {/* Dot */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0"
                      style={{ background: colors.bg, color: colors.color, border: `2px solid ${colors.bg}` }}
                    >
                      {ACTIVITY_ICONS[entry.type]}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)' }}>{entry.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: 2 }}>{entry.detail}</div>
                      <div className="flex items-center gap-1 mt-1.5" style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                        <Clock className="w-3 h-3" />
                        {entry.time}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex justify-end px-6 pb-6">
          <GhostButton onClick={onClose}>Close</GhostButton>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── 7. Bulk Reassign Modal ─────────────────────────────────────────────────────

export interface BulkReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMemberRecord;
  allMembers: TeamMemberRecord[];
  onSave: (fromId: string, toName: string) => void;
}

export function BulkReassignModal({ isOpen, onClose, member, allMembers, onSave }: BulkReassignModalProps) {
  const eligible = allMembers.filter(m => m.id !== member.id && (m.status as string) !== 'Inactive');
  const [toId, setToId] = useState<string>(eligible[0]?.id ?? '');

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ maxWidth: 460, width: '100%' }}>
        <ModalHeader title="Bulk Reassign Clients" subtitle={`Transfer all of ${member.name.split(' ')[0]}'s clients to another member`} icon={<ArrowRight className="w-5 h-5" />} onClose={onClose} />
        <div className="p-6 flex flex-col gap-4">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(186,32,39,0.04)', border: '1px solid rgba(186,32,39,0.1)' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: 4 }}>Transferring from</div>
            <div className="flex items-center gap-2">
              <PersonAvatar name={member.name} size={32} />
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>{member.name}</div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>({member.clientsAssigned} clients)</span>
            </div>
          </div>

          <FormField label="Transfer all clients to">
            <div className="flex flex-col gap-2">
              {eligible.map(m => {
                const isSelected = toId === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setToId(m.id)}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                    style={{
                      border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: isSelected ? 'rgba(186,32,39,0.04)' : 'transparent',
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{
                        border: `2px solid ${isSelected ? 'var(--color-primary)' : 'rgba(0,0,0,0.2)'}`,
                        background: isSelected ? 'var(--color-primary)' : 'transparent',
                      }}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <PersonAvatar name={m.name} size={32} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>{m.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{m.role} · {m.clientsAssigned} current clients</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </FormField>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={() => { const sel = eligible.find(m => m.id === toId); if (sel) { onSave(member.id, sel.name); onClose(); } }} disabled={!toId}>
            <ArrowRight className="w-4 h-4" /> Transfer Clients
          </PrimaryButton>
        </div>
      </div>
    </ModalOverlay>
  );
}
