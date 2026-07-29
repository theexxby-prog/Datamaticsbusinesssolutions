import type { InvoiceRecord } from '../types';
import { tccTaxInvoices } from './tccTaxInvoices';

const MONTHS: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

/** 'Feb-2026' -> '2026-02' */
function billingPeriod(forMonth: string): string {
  const [m, y] = forMonth.split('-');
  return `${y}-${MONTHS[m] ?? '01'}`;
}

/**
 * The client's invoice list is derived from the issued invoices rather than
 * duplicated, so the list, the rendered document and the PDF are guaranteed to
 * agree on every figure. Line items carry the real description, records and
 * rate; a paid invoice gets its settlement recorded.
 */
const tccRecords: InvoiceRecord[] = tccTaxInvoices.map((inv) => ({
  id: `inv_${inv.invoiceNumber}`,
  invoiceNumber: inv.invoiceNumber,
  clientId: 'client_1',
  clientCompany: 'The Channel Company',
  billingPeriod: billingPeriod(inv.forMonth),
  grouping: 'consolidated',
  lineItems: inv.lineItems.map((l, i) => ({
    campaignId: `${inv.invoiceNumber}-${i + 1}`,
    campaignName: l.description,
    jobCardId: l.po,
    geo: 'NAM',
    billableLeads: l.qty,
    cpl: l.rate,
    amount: l.amount,
  })),
  subtotal: inv.total,
  total: inv.total,
  currency: 'USD',
  stage: inv.status === 'due' ? 'overdue' : 'sent',
  issueDate: inv.issueDate,
  dueDate: inv.dueDate,
  raisedBy: 'Kartik',
  validatedBy: 'Kartik',
  validatedAt: `${inv.issueDate}T08:30:00Z`,
  tally: {
    invoiceEntry: 'synced',
    paymentEntry: 'not_synced',
    voucherId: `TLY-${inv.invoiceNumber.slice(-6)}`,
  },
  history: [
    { at: `${inv.issueDate}T06:00:00Z`, actor: 'System', action: `Draft generated from ${inv.forMonth} billable records` },
    { at: `${inv.issueDate}T08:30:00Z`, actor: 'Kartik', action: 'Validated amount' },
    { at: `${inv.issueDate}T09:00:00Z`, actor: 'System', action: 'Invoice sent to client' },
  ],
}));

export const mockInvoiceRecords: InvoiceRecord[] = [
  ...tccRecords,

  // ── Other clients — internal pipeline coverage only (never client-visible) ──
  // Draft awaiting Accounts validation.
  {
    id: 'inv_103',
    invoiceNumber: 'INV-2026-001312',
    clientId: 'client_2',
    clientCompany: 'TechCo Ltd',
    billingPeriod: '2026-06',
    grouping: 'consolidated',
    lineItems: [
      { campaignId: 'camp_2a', campaignName: 'Enterprise Outreach – North America Q1 2026', jobCardId: 'JC-2026-0044', geo: 'NAM', billableLeads: 212, cpl: 42, amount: 8904 },
    ],
    subtotal: 8904,
    total: 8904,
    currency: 'USD',
    stage: 'pending_validation',
    raisedBy: 'Kartik',
    tally: { invoiceEntry: 'not_synced', paymentEntry: 'not_synced' },
    history: [
      { at: '2026-07-02T06:00:00Z', actor: 'System', action: 'Draft generated from June billable leads' },
      { at: '2026-07-02T09:14:00Z', actor: 'Kartik', action: 'Moved to validation' },
    ],
  },

  // Approved, Tally sync in progress.
  {
    id: 'inv_104',
    invoiceNumber: 'INV-2026-001315',
    clientId: 'client_2',
    clientCompany: 'TechCo Ltd',
    billingPeriod: '2026-06',
    grouping: 'geo_split',
    geo: 'APAC',
    lineItems: [
      { campaignId: 'camp_2b', campaignName: 'APAC SaaS Appointment Setting – Q2 2026', jobCardId: 'JC-2026-0044', geo: 'APAC', billableLeads: 71, cpl: 36, amount: 2556 },
    ],
    subtotal: 2556,
    total: 2556,
    currency: 'USD',
    stage: 'approved',
    raisedBy: 'Hema',
    validatedBy: 'Hema',
    validatedAt: '2026-07-05T10:00:00Z',
    tally: { invoiceEntry: 'syncing', paymentEntry: 'not_synced' },
    history: [
      { at: '2026-07-02T06:00:00Z', actor: 'System', action: 'Draft generated from June billable leads (APAC)' },
      { at: '2026-07-05T10:00:00Z', actor: 'Hema', action: 'Validated amount — Tally sync in progress' },
    ],
  },

  // Overdue — kept on another client so the collections view still has a case.
  {
    id: 'inv_105',
    invoiceNumber: 'INV-2026-001244',
    clientId: 'client_3',
    clientCompany: 'Meridian Group',
    billingPeriod: '2026-04',
    grouping: 'per_campaign',
    lineItems: [
      { campaignId: 'camp_3a', campaignName: 'Financial Services Decision Makers – Q1 2026', geo: 'NAM', billableLeads: 130, cpl: 40, amount: 5200 },
    ],
    subtotal: 5200,
    total: 5200,
    currency: 'USD',
    stage: 'overdue',
    issueDate: '2026-05-02',
    dueDate: '2026-06-01',
    raisedBy: 'Kartik',
    validatedBy: 'Kartik',
    validatedAt: '2026-05-02T09:00:00Z',
    tally: { invoiceEntry: 'synced', paymentEntry: 'not_synced', voucherId: 'TLY-7C0PX3' },
    history: [
      { at: '2026-05-01T06:00:00Z', actor: 'System', action: 'Draft generated from April billable leads' },
      { at: '2026-05-02T09:00:00Z', actor: 'Kartik', action: 'Validated amount' },
      { at: '2026-05-02T09:30:00Z', actor: 'System', action: 'Invoice sent to client' },
      { at: '2026-06-02T00:00:00Z', actor: 'System', action: 'Marked overdue' },
    ],
  },

  // Tally sync failure — retry affordance for Accounts.
  {
    id: 'inv_106',
    invoiceNumber: 'INV-2026-001316',
    clientId: 'client_2',
    clientCompany: 'TechCo Ltd',
    billingPeriod: '2026-06',
    grouping: 'per_campaign',
    lineItems: [
      { campaignId: 'camp_2a', campaignName: 'Enterprise Outreach – North America Q1 2026', jobCardId: 'JC-2026-0044', geo: 'NAM', billableLeads: 164, cpl: 24, amount: 3936 },
    ],
    subtotal: 3936,
    total: 3936,
    currency: 'USD',
    stage: 'approved',
    raisedBy: 'Hema',
    validatedBy: 'Hema',
    validatedAt: '2026-07-04T11:20:00Z',
    tally: { invoiceEntry: 'failed', paymentEntry: 'not_synced', error: 'Tally gateway unreachable — retry pending' },
    history: [
      { at: '2026-07-02T06:00:00Z', actor: 'System', action: 'Draft generated from June billable leads' },
      { at: '2026-07-04T11:20:00Z', actor: 'Hema', action: 'Validated amount' },
      { at: '2026-07-04T11:22:00Z', actor: 'System', action: 'Tally sync failed — gateway unreachable' },
    ],
  },
];
