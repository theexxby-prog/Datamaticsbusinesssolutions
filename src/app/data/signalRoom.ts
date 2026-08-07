// ─── Signal Room — Relish enrichment intelligence ────────────────────────────
// The full output of a Datamatics enrichment run (20 contacts across 12
// accounts, sample of 252): raw per-contact and per-account enrichment, the
// per-contact intent synthesis (type, score, "why now", cross-field threads,
// play, risk), and the per-account insights (readiness, engagement sequence,
// gaps). Imported verbatim from the Signal Room deliverable so the portal
// shows exactly what a client receives. UNION preview only.

import raw from './signalRoomData.json';
import type { Lead } from '../mockData';

export type IntentType =
  | 'compliance-driven'
  | 'event-triggered'
  | 'company-driven'
  | 'personal-career'
  | 'weak-fit';

export type RoleClass = 'champion' | 'decision-maker' | 'influencer' | 'gatekeeper';

export const INTENT_TYPE_LABEL: Record<IntentType, string> = {
  'compliance-driven': 'Compliance-driven',
  'event-triggered': 'Event-triggered',
  'company-driven': 'Company-driven',
  'personal-career': 'Personal / career',
  'weak-fit': 'Weak fit',
};

/** Engagement Priority, per the delivered column's P1/P2/P3 vocabulary. */
export type EngagementPriority = 'P1' | 'P2' | 'P3';

// ── Field → delivered column map ─────────────────────────────────────────────
// The Relish Enrichment API v1.0 delivers 31 columns per record. Our identifiers
// are shorter than the delivered column names, so this records the correspondence
// rather than renaming ~1,900 lines of call sites. Grouping follows the doc.
//
//   Lead Identity (6)
//     contact.name            → Contact Name
//     contact.title           → Job Title
//     meta.leadFor.name       → Lead For Company      (the seller — see below)
//     meta.leadFor.domain     → Lead For Domain
//     account.name            → Lead Against Company
//     account.domain          → Lead Against Domain
//   Contact Intelligence (8)
//     contact.roleAnalysis    → Role Analysis
//     contact.influence       → Decision Influence
//     contact.painPoints      → Pain Points
//     contact.motivations     → Motivations
//     contact.commStyle       → Communication Style
//     contact.approach        → Recommended Approach
//     contact.talkingPoints   → Talking Points
//     contact.objections      → Objection Handling
//   Target Account Intelligence (15)
//     account.summary/industry/employees/revenue/hq
//                             → Target Summary / Industry / Employee Count (est.)
//                               / Revenue (est.) / Headquarters
//     account.painPoints      → Target Pain Points
//     account.buyingSignals   → Target Buying Signals
//     account.engagementPriority → Engagement Priority
//     account.sellerFit       → Seller Fit
//     account.competitiveOps  → Target Competitive Opportunities
//     account.currentVendors  → Likely Current Vendors
//     account.dmRoles         → Likely Decision-Maker Roles
//     account.techStack       → Target Technology Stack
//     account.securityPosture → Target Security Posture
//     account.recentNews      → Target Recent News
//   Verified Signals (2)
//     account.triggers        → Trigger Events
//     account.signalFreshness → Signal Freshness
//
// Seller Fit and Engagement Priority are account-level in the contract. They
// used to sit on SignalContact here, where sellerFit was duplicated verbatim
// across every contact at an account (Lonza carried the same string five times)
// and priority was the constant "High" on all 20 rows.

export interface SignalContact {
  id: number;
  srNo: string;
  name: string;
  first: string;
  title: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  company: string;
  companySlug: string;
  companyDomain: string;
  employees: string;
  roleAnalysis: string;
  commStyle: string;
  styleTags: string[];
  influence: string;
  influenceTags: string[];
  roleClass: RoleClass;
  approach: string;
  painPoints: string[];
  talkingPoints: string[];
  motivations: Array<{ kind: string; text: string }>;
  objections: Array<{ q: string; a: string }>;
  signalScore: number;
}

export interface SignalAccount {
  slug: string;
  name: string;
  domain: string;
  summary: string;
  industry: string;
  employees: string;
  revenue: string;
  hq: string;
  country: string;
  painPoints: string[];
  buyingSignals: string[];
  competitiveOps: string[];
  currentVendors: string[];
  dmRoles: string[];
  techStack: string[];
  securityPosture: string;
  recentNews: string[];
  triggers: Array<{ text: string; date?: string; source?: string; kind?: string }>;
  signalFreshness: string;
  sellerFit: string;
  engagementPriority: EngagementPriority;
  contactIds: number[];
}

export interface IntentSynthesis {
  intentType: IntentType;
  intentScore: number;
  headline: string;
  whyNow: string;
  threads: Array<{ nodes: string[]; insight: string }>;
  play: string;
  risk: string;
}

export interface AccountInsight {
  readiness: number;
  peak: number;
  wavg: number;
  readinessNote: string;
  sequence: Array<{ contactId: number; why: string }>;
  gaps: Array<{ role: string; note: string }>;
}

export interface SignalRoomMeta {
  campaign: string;
  enrichedBy: string;
  rows: number;
  companies: number;
  sampleOf: number;
  /**
   * `companyFor` in the API — the seller the intelligence is generated *for*.
   * The contract is directional and warns that swapping it with the target
   * account "enriches every pair backwards", so it is worth naming on screen:
   * the talking points, seller fit, approach and objection handling are all
   * computed against this company, which is what separates them from generic
   * firmographics.
   *
   * One batch is one seller, so this lives on meta rather than being repeated
   * on every contact. The value is the seller this sample was actually run for
   * — every sellerFit string in the data names it.
   */
  leadFor: { name: string; domain: string };
}

const data = raw as unknown as {
  contacts: SignalContact[];
  accounts: SignalAccount[];
  meta: SignalRoomMeta;
  synth: Record<string, IntentSynthesis>;
  insights: Record<string, AccountInsight>;
};

export const signalContacts: SignalContact[] = data.contacts;
export const signalAccounts: SignalAccount[] = data.accounts;
export const signalMeta: SignalRoomMeta = data.meta;

const contactById = new Map(data.contacts.map(c => [c.id, c]));
const accountBySlug = new Map(data.accounts.map(a => [a.slug, a]));

export function getSignalContact(id: number): SignalContact | undefined {
  return contactById.get(id);
}

export function getSignalAccount(slug: string): SignalAccount | undefined {
  return accountBySlug.get(slug);
}

export function getSynthesis(contactId: number): IntentSynthesis | undefined {
  return data.synth[String(contactId)];
}

export function getAccountInsight(slug: string): AccountInsight | undefined {
  return data.insights[slug];
}

/** Committee for a contact's account, ranked by intent score (highest first). */
export function getCommittee(contact: SignalContact): SignalContact[] {
  const account = accountBySlug.get(contact.companySlug);
  if (!account) return [contact];
  return account.contactIds
    .map(id => contactById.get(id))
    .filter((c): c is SignalContact => Boolean(c))
    .sort((a, b) => (getSynthesis(b.id)?.intentScore ?? b.signalScore) - (getSynthesis(a.id)?.intentScore ?? a.signalScore));
}

/** All dated trigger events across accounts, newest first. */
export function getTriggerTimeline(): Array<{
  date: string;
  text: string;
  source?: string;
  kind?: string;
  account: SignalAccount;
}> {
  const items: Array<{ date: string; text: string; source?: string; kind?: string; account: SignalAccount }> = [];
  for (const account of data.accounts) {
    for (const trigger of account.triggers) {
      if (trigger.date) items.push({ date: trigger.date, text: trigger.text, source: trigger.source, kind: trigger.kind, account });
    }
  }
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

/** Accounts ranked by readiness, highest first. */
export function getAccountsByReadiness(): Array<{ account: SignalAccount; insight: AccountInsight }> {
  return data.accounts
    .map(account => ({ account, insight: data.insights[account.slug] }))
    .filter(x => x.insight)
    .sort((a, b) => b.insight.readiness - a.insight.readiness);
}

/** Intent mix across all synthesized contacts. */
export function getIntentMix(): Array<{ type: IntentType; count: number }> {
  const mix = new Map<IntentType, number>();
  for (const c of data.contacts) {
    const s = getSynthesis(c.id);
    if (s) mix.set(s.intentType, (mix.get(s.intentType) ?? 0) + 1);
  }
  return [...mix.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
}

// ── Leads-module integration ─────────────────────────────────────────────────
// Enriched contacts surface in the Leads list alongside the campaign leads.
// Their ids are prefixed so the existing drawer/status flows can tell them
// apart, and lead.leadScore carries the intent score so existing sorting works.

export const SIGNAL_CAMPAIGN_ID = 'sr_q3_2026';
export const SIGNAL_CAMPAIGN_NAME = 'Q3 2026 Enriched Campaign';
export const SIGNAL_LEAD_PREFIX = 'SR-';

export function signalLeadId(contactId: number): string {
  return `${SIGNAL_LEAD_PREFIX}${contactId}`;
}

export function signalContactFromLeadId(leadId: string): SignalContact | undefined {
  if (!leadId.startsWith(SIGNAL_LEAD_PREFIX)) return undefined;
  return contactById.get(Number(leadId.slice(SIGNAL_LEAD_PREFIX.length)));
}

export function isSignalLeadId(leadId: string): boolean {
  return leadId.startsWith(SIGNAL_LEAD_PREFIX);
}

/** The enriched contacts as Lead rows for the Leads table. */
export function getSignalLeads(): Lead[] {
  return data.contacts.map(c => {
    const [first, ...rest] = c.name.split(' ');
    const account = accountBySlug.get(c.companySlug);
    const synthesis = getSynthesis(c.id);
    return {
      id: signalLeadId(c.id),
      campaignId: SIGNAL_CAMPAIGN_ID,
      campaignName: SIGNAL_CAMPAIGN_NAME,
      firstName: first,
      lastName: rest.join(' '),
      title: c.title,
      company: c.company,
      industry: account?.industry ?? '—',
      email: c.email,
      phone: c.phone,
      country: c.country,
      employeeSize: c.employees,
      revenue: account?.revenue ?? '—',
      leadScore: synthesis?.intentScore ?? c.signalScore,
      status: 'Accepted',
      deliveryDate: account?.signalFreshness ?? '2026-07-23',
    };
  });
}
