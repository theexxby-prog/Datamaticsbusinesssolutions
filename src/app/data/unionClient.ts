import type { Campaign, Client } from './mockClients';
import { allClients } from './mockClients';
import type { Lead } from '../mockData';
import type { User } from '../context/AuthContext';
import { showUnionIdentity } from '../config/demo';

// ─── The UNION login's client identity ───────────────────────────────────────
// The UNION preview is shown to partners and prospects, so it must not carry a
// real client's name on campaigns, invoices, or documents. This module derives
// a neutral fictional client from client_1's data: every volume, amount, date,
// and status is identical — only the identity changes. Renuka and the TCC
// client build read the original records untouched.

export const UNION_COMPANY = 'Northwind Technologies';
export const UNION_CLIENT_ID = 'client_union';

/** Neutral names for the seeded campaigns, keyed by campaign id. Every campaign
 *  on client_1 must have an entry — the lookup falls back to the real name. */
export const CAMPAIGN_RENAMES: Record<string, string> = {
  '46888': 'Atlas AI Infrastructure — Q3',
  '46873': 'Resilience Suite Lead Gen',
  '46936': 'GridWorks FY2026 — Q3',
  '46901': 'Beacon Secure Edge — NAM Q3',
  '46912': 'Harbor Data Resilience — EMEA',
  '46927': 'Skyline AI Device Refresh — APAC',
  '46944': 'Meridian Hybrid Cloud — Q1',
  '46952': 'Sentinel SecOps Modernization',
  '46967': 'Summit Cloud Platform — NAM Q2',
  '46974': 'Compass Zero Trust — EMEA Q2',
  '46989': 'Quarry Flash Storage — Q4',
  '46995': 'Foundry Private Cloud — Q4',
};

const sourceClient = allClients.find(c => c.id === 'client_1')!;

const RENAMES_BY_NAME: Record<string, string> = Object.fromEntries(
  sourceClient.campaigns
    .filter(c => CAMPAIGN_RENAMES[c.id])
    .map(c => [c.name, CAMPAIGN_RENAMES[c.id]]),
);

export function renameCampaignName(name: string): string {
  return RENAMES_BY_NAME[name] ?? name;
}

/** client_1 with the identity swapped; campaign ids (and therefore delivery
 *  schedules, activities, and detail routes) are unchanged. */
export const unionClient: Client = {
  ...sourceClient,
  id: UNION_CLIENT_ID,
  companyName: UNION_COMPANY,
  campaigns: sourceClient.campaigns.map(c => ({
    ...c,
    name: CAMPAIGN_RENAMES[c.id] ?? c.name,
  })),
};

/** The client whose data the portal shows for this login. */
export function getPortalClient(user: User | null): Client {
  return showUnionIdentity(user) ? unionClient : sourceClient;
}

/** Campaign lookup that applies the UNION identity when appropriate. */
export function resolveCampaignForUser(
  user: User | null,
  campaignId: string | undefined,
): { campaign: Campaign; client: Client } | null {
  for (const c of showUnionIdentity(user) ? [unionClient, ...allClients.filter(x => x.id !== 'client_1')] : allClients) {
    const campaign = c.campaigns.find(camp => camp.id === campaignId);
    if (campaign) return { campaign, client: c };
  }
  return null;
}

/** Campaign-lead display mapping for the UNION leads list. */
export function renameLeadCampaign(lead: Lead): Lead {
  const name = CAMPAIGN_RENAMES[lead.campaignId];
  return name ? { ...lead, campaignName: name } : lead;
}

// ─── Neutral invoice line descriptions ───────────────────────────────────────
// Real TCC line items name vendors and programs ("Huntress CRN6", "Sophos CRN
// ANZ 1"). Each is mapped deterministically to a neutral product line + the
// program type and region the original implies, so the invoice still reads
// like a real bill without identifying anyone.

const PRODUCT_LINES = ['Atlas', 'GridWorks', 'Resilience', 'Beacon', 'Skyline', 'Harbor', 'Summit', 'Compass'];

export function neutralizeLineDescription(desc: string): string {
  const geo = /CEMEA|EMEA|\bUK\b|\bDE\b/i.test(desc) ? 'EMEA'
    : /CAPAC|APAC|ANZ|Asia/i.test(desc) ? 'APAC'
      : 'NAM';
  const program = /webinar/i.test(desc) ? 'Webinar Program'
    : /appointment/i.test(desc) ? 'Appointment Setting'
      : /accelerator/i.test(desc) ? 'Partner Accelerator'
        : /media/i.test(desc) ? 'Media Program'
          : /syndication/i.test(desc) ? 'Content Syndication'
            : 'Lead Generation';
  let h = 0;
  for (const ch of desc) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `${PRODUCT_LINES[h % PRODUCT_LINES.length]} ${program} — ${geo}`;
}

// ─── Deep text neutralization ────────────────────────────────────────────────
// Seeded content (notifications, campaign threads, support tickets, document
// library, account page) mentions the real client and its vendors in free
// text. The lens rewrites those terms wherever they appear; order matters —
// full campaign names first, then company/domain, then vendor tokens.

const TERM_MAP: Array<[RegExp, string]> = [
  [/Lenovo Intel FIFA AI/g, CAMPAIGN_RENAMES['46888']],
  [/Uptime Solutions CRN2 - Lead Gen/g, CAMPAIGN_RENAMES['46873']],
  [/Uptime Solutions CRN2/g, CAMPAIGN_RENAMES['46873']],
  [/Eaton 2026 Full Year 1_Q3/g, CAMPAIGN_RENAMES['46936']],
  [/Eaton FY2026 Q3/g, CAMPAIGN_RENAMES['46936']],
  [/Cisco Secure Edge CRN NAM - Q3/g, CAMPAIGN_RENAMES['46901']],
  [/Veeam Data Resilience CRN4 - EMEA/g, CAMPAIGN_RENAMES['46912']],
  [/Dell AI PC Refresh 2026 - APAC/g, CAMPAIGN_RENAMES['46927']],
  [/HPE GreenLake Hybrid Cloud - Q1/g, CAMPAIGN_RENAMES['46944']],
  [/Fortinet SecOps Modernization CRN1/g, CAMPAIGN_RENAMES['46952']],
  [/Nutanix Cloud Platform CRN NAM - Q2/g, CAMPAIGN_RENAMES['46967']],
  [/Zscaler Zero Trust Exchange - EMEA Q2/g, CAMPAIGN_RENAMES['46974']],
  [/Pure Storage FlashBlade CRN - Q4/g, CAMPAIGN_RENAMES['46989']],
  [/Broadcom VMware Cloud Foundation - Q4/g, CAMPAIGN_RENAMES['46995']],
  [/The Channel Company/g, UNION_COMPANY],
  [/thechannelcompany\.com/g, 'northwindtech.com'],
  [/thechannelco\.com/g, 'northwindtech.com'],
  [/Renuka Lawless/g, 'Jordan Blake'],
  [/rlawless@/g, 'j.blake@'],
  [/Lenovo/g, 'Atlas'],
  [/Uptime/g, 'Resilience'],
  [/Eaton/g, 'GridWorks'],
  [/Cisco/g, 'Beacon'],
  [/Veeam/g, 'Harbor'],
  [/Dell/g, 'Skyline'],
  [/HPE GreenLake/g, 'Meridian'],
  [/Fortinet/g, 'Sentinel'],
  [/Nutanix/g, 'Summit'],
  [/Zscaler/g, 'Compass'],
  [/Pure Storage FlashBlade/g, 'Quarry Flash'],
  [/Broadcom VMware/g, 'Foundry'],
  // No word boundaries: the token also appears inside filenames like
  // "Uptime_CRN2_Suppression.csv", where the underscores are word characters
  // and \b never matches.
  [/CRN(\d*)/g, 'Channel$1'],
];

export function neutralizeText(text: string): string {
  return TERM_MAP.reduce((s, [re, sub]) => s.replace(re, sub), text);
}

/** Recursively neutralize every string in a JSON-ish structure. */
export function neutralizeDeep<T>(value: T): T {
  if (typeof value === 'string') return neutralizeText(value) as unknown as T;
  if (Array.isArray(value)) return value.map(neutralizeDeep) as unknown as T;
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
    return value; // class instances (Dates handled above) pass through untouched
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, neutralizeDeep(v)]),
    ) as unknown as T;
  }
  return value;
}
