import { formatDate } from '../../utils/formatDate';
import type { User } from '../../context/AuthContext';
import type { ThreadAuthor } from '../../data/campaignThread';

/** `Jul 24, 2026 · 10:15 AM` — house date format plus a time, which a thread needs. */
export function formatEntryTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${formatDate(iso.slice(0, 10))} · ${time}`;
}

/** Initials for the avatar tile — `Renuka Lawless` → `RL`. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}

const ROLE_TITLE: Record<string, string> = {
  ops_manager: 'Operations Manager',
  campaign_manager: 'Campaign Manager',
  campaign_backup: 'Campaign Backup',
  account_manager: 'Account Manager',
  accounts: 'Accounts',
};

/** Who the signed-in user posts as. */
export function authorFromUser(user: User): ThreadAuthor {
  if (user.role === 'client') {
    return { name: user.name, side: 'client', jobTitle: user.company ?? 'Client' };
  }
  return { name: user.name, side: 'datamatics', jobTitle: ROLE_TITLE[user.role] ?? 'Datamatics' };
}

/** Only the Datamatics side can move a change request along. */
export function canResolveRequests(user: User): boolean {
  return user.role !== 'client';
}
