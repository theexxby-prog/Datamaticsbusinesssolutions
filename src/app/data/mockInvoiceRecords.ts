import type { InvoiceRecord } from '../types';

// Invoice records across every lifecycle stage and all three grouping modes.
// Amounts are always billable leads × CPL — never Delivered.

export const mockInvoiceRecords: InvoiceRecord[] = [
  // ── The Channel Company — exactly two client-visible invoices ──────────────
  // One settled (June billables) and one currently due (July billables, Net 30,
  // not yet past its due date). Amounts are always billable leads × CPL, and the
  // billable counts reconcile to the delivery schedules in data/mockClients.ts.

  // 1 — Paid: June billables, consolidated NAM.
  {
    id: 'inv_101',
    invoiceNumber: 'INV-2026-001271',
    clientId: 'client_1',
    clientCompany: 'The Channel Company',
    billingPeriod: '2026-06',
    grouping: 'consolidated',
    lineItems: [
      { campaignId: '46888', campaignName: 'Lenovo Intel FIFA AI', jobCardId: 'JC-2026-0041', geo: 'NAM', billableLeads: 138, cpl: 45, amount: 6210 },
      { campaignId: '46873', campaignName: 'Uptime Solutions CRN2 - Lead Gen', jobCardId: 'JC-2026-0042', geo: 'NAM', billableLeads: 29, cpl: 60, amount: 1740 },
      { campaignId: '46936', campaignName: 'Eaton 2026 Full Year 1_Q3', jobCardId: 'JC-2026-0043', geo: 'NAM', billableLeads: 6, cpl: 50, amount: 300 },
    ],
    subtotal: 8250,
    total: 8250,
    currency: 'USD',
    stage: 'paid',
    issueDate: '2026-07-02',
    dueDate: '2026-08-01',
    raisedBy: 'Hema',
    validatedBy: 'Hema',
    validatedAt: '2026-07-02T07:45:00Z',
    tally: { invoiceEntry: 'synced', paymentEntry: 'synced', voucherId: 'TLY-8D1QA7' },
    payment: { method: 'Bank transfer', reference: 'PAY-001271-8XKQ', paidAt: '2026-07-20T13:12:00Z' },
    history: [
      { at: '2026-07-01T06:00:00Z', actor: 'System', action: 'Draft generated from June billable leads' },
      { at: '2026-07-02T07:45:00Z', actor: 'Hema', action: 'Validated amount' },
      { at: '2026-07-02T08:00:00Z', actor: 'System', action: 'Invoice sent to client' },
      { at: '2026-07-20T13:12:00Z', actor: 'Renuka Lawless', action: 'Payment received' },
      { at: '2026-07-20T13:15:00Z', actor: 'System', action: 'Receipt voucher created in Tally' },
    ],
  },

  // 2 — Due: July billables, consolidated NAM, Net 30 (due Aug 27).
  {
    id: 'inv_102',
    invoiceNumber: 'INV-2026-001042',
    clientId: 'client_1',
    clientCompany: 'The Channel Company',
    billingPeriod: '2026-07',
    grouping: 'consolidated',
    lineItems: [
      { campaignId: '46888', campaignName: 'Lenovo Intel FIFA AI', jobCardId: 'JC-2026-0041', geo: 'NAM', billableLeads: 176, cpl: 45, amount: 7920 },
      { campaignId: '46873', campaignName: 'Uptime Solutions CRN2 - Lead Gen', jobCardId: 'JC-2026-0042', geo: 'NAM', billableLeads: 25, cpl: 60, amount: 1500 },
      { campaignId: '46936', campaignName: 'Eaton 2026 Full Year 1_Q3', jobCardId: 'JC-2026-0043', geo: 'NAM', billableLeads: 35, cpl: 50, amount: 1750 },
    ],
    subtotal: 11170,
    total: 11170,
    currency: 'USD',
    stage: 'sent',
    issueDate: '2026-07-28',
    dueDate: '2026-08-27',
    raisedBy: 'Kartik',
    validatedBy: 'Kartik',
    validatedAt: '2026-07-28T08:30:00Z',
    tally: { invoiceEntry: 'synced', paymentEntry: 'not_synced', voucherId: 'TLY-9F2KD1' },
    history: [
      { at: '2026-07-28T06:00:00Z', actor: 'System', action: 'Draft generated from July billable leads' },
      { at: '2026-07-28T08:30:00Z', actor: 'Kartik', action: 'Validated amount' },
      { at: '2026-07-28T08:32:00Z', actor: 'System', action: 'Sales voucher created in Tally' },
      { at: '2026-07-28T09:00:00Z', actor: 'System', action: 'Invoice sent to client' },
    ],
  },

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
