export type CampaignStatus =
  | 'Not started'
  | 'In progress'
  | 'Paused'
  | 'Completed'
  | 'Under review'
  | 'Pending Approval'
  | 'Changes Requested'
  | 'Cancelled'
  | 'Accepted'
  | 'Pending'
  | 'Rejected'
  | 'Overdue';

export type ServiceType = 'Leads' | 'Content Syndication' | 'BANT' | 'Appointments' | 'Single Touch' | 'Double Touch' | 'Appointment Setting' | 'Custom';

export interface Campaign {
  id: string;
  name: string;
  clientCompany: string;
  serviceType: ServiceType;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  delivered: number;
  target: number;
  accepted: number;
  lastUpdated: string;
  geo: string;
  industry: string;
  revenueRange: string;
  employeeSize: string;
  jobTitles: string;
  pricingModel: string;
  clientDetails: {
    name: string;
    address: string;
    contact: string;
  };
  scopeOfWork: string[];
  terms: string;
  outreachMetrics?: {
    emailsSent: number;
    emailsOpened: number;
    emailsClicked: number;
    openRate: number;
    clickRate: number;
  };
}

// ─── Campaign Approval Workflow ───────────────────────────────────────────────
export type SubmissionStatus = 'Pending Approval' | 'Changes Requested' | 'Approved' | 'Declined';

export interface CampaignSubmission {
  id: string;
  campaignName: string;
  clientId: string;
  clientCompany: string;
  submittedBy: string;
  submittedAt: string; // ISO date
  assignedManager: string;
  assignedManagerEmail: string;
  status: SubmissionStatus;
  // Campaign spec
  serviceType: string;
  geography: string;
  locations: string[];
  targetLeads: number;
  cpl: number;
  jobTitles: string[];
  employeeSize: string;
  industry: string;
  additionalInfo?: string;
  // Ops feedback
  managerNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
// ─────────────────────────────────────────────────────────────────────────────

export interface DailyProgress {
  date: string;
  leadsSourced: number;
  leadsValidated: number;
  leadsRejected: number;
  bantQualified: number;
  appointmentsSet: number;
}

export interface ActivityUpdate {
  title: string;
  message?: string;
  date: string;
  timestamp?: string;
  completed: boolean;
}
// ─── Documents Module: Job Card Workflow ──────────────────────────────────────
// Contract shared between frontend and backend. Vaibhav: the backend should
// persist JobCard and emit stage transitions; Salesforce / e-signature calls
// live behind utils/documentWorkflow.ts stubs.

export type JobCardType = 'client_signature' | 'internal_only' | 'msa_covered';

export type JobCardStage =
  | 'intake'                  // conversation dump uploaded, scope extraction running
  | 'sf_opportunity_created'  // opportunity pushed to Salesforce
  | 'pending_cm_review'       // client manager verifying opportunity details
  | 'jc_generated'            // job card built from template
  | 'pending_confirmations'   // awaiting Account Manager + Client Manager confirm
  | 'sent_for_signature'      // out with client for e-signature
  | 'signed'                  // client signed
  | 'completed'               // finalized (msa_covered short-circuits here)
  | 'declined';

export type IntegrationSyncStatus = 'not_synced' | 'syncing' | 'synced' | 'failed';

export type Geo = 'NAM' | 'EMEA' | 'APAC' | 'Global';

export interface ScopeSummary {
  serviceType: string;
  geography: Geo;
  targetLeads: number;
  cpl: number;
  startDate: string; // ISO
  endDate: string;   // ISO
  jobTitles: string[];
  industry: string;
  employeeSize: string;
  notes?: string;
}

export interface JobCardEvent {
  at: string;     // ISO timestamp
  actor: string;  // display name or 'System'
  action: string; // human-readable, e.g. "Confirmed job card accuracy"
}

export interface JobCard {
  id: string; // e.g. JC-2026-0042
  campaignName: string;
  clientId: string;
  clientCompany: string;
  type: JobCardType;
  stage: JobCardStage;
  createdAt: string;
  updatedAt: string;
  accountManager: string;
  clientManager: string;
  scope: ScopeSummary;
  scopeSource?: {
    fileName: string;   // the uploaded conversation dump
    uploadedAt: string;
    uploadedBy: string;
  };
  salesforce: {
    status: IntegrationSyncStatus;
    opportunityId?: string;
    syncedAt?: string;
    error?: string;
  };
  confirmations: {
    accountManager: { confirmed: boolean; at?: string };
    clientManager: { confirmed: boolean; at?: string };
  };
  signature?: {
    provider: 'DocuSign' | 'Zoho Sign' | 'Documenso';
    envelopeId?: string;
    sentAt?: string;
    signedAt?: string;
    signedBy?: string;
  };
  documentUrl?: string; // rendered JC PDF
  history: JobCardEvent[];
}

// ─── Invoices Module: Billing Workflow ────────────────────────────────────────
// "Billable" leads only — never "Delivered". Tally is the accounting source of
// truth; invoice + payment entries sync both ways via utils/invoiceWorkflow.ts.

export type InvoiceStage =
  | 'draft'               // generated from prior-month billable leads
  | 'pending_validation'  // awaiting Accounts sign-off on the amount
  | 'approved'            // validated; Tally entry being created
  | 'sent'                // visible to client, awaiting payment
  | 'paid'
  | 'overdue'
  | 'void';

export type InvoiceGrouping = 'per_campaign' | 'consolidated' | 'geo_split';

export interface InvoiceLineItem {
  campaignId: string;
  campaignName: string;
  jobCardId?: string; // links the invoice back to its job card
  geo: Geo;
  billableLeads: number;
  cpl: number;
  amount: number; // billableLeads * cpl
}

export interface InvoiceEvent {
  at: string;
  actor: string;
  action: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-001312
  clientId: string;
  clientCompany: string;
  billingPeriod: string; // 'YYYY-MM' — the month the billable leads were delivered
  grouping: InvoiceGrouping;
  geo?: Geo; // set when grouping === 'geo_split'
  lineItems: InvoiceLineItem[];
  subtotal: number;
  total: number;
  currency: 'USD';
  stage: InvoiceStage;
  issueDate?: string;
  dueDate?: string;
  raisedBy: string;
  validatedBy?: string;
  validatedAt?: string;
  tally: {
    invoiceEntry: IntegrationSyncStatus;
    paymentEntry: IntegrationSyncStatus;
    voucherId?: string;
    error?: string;
  };
  payment?: {
    method?: string;    // gateway TBD — stubbed for now
    reference?: string;
    paidAt?: string;
  };
  history: InvoiceEvent[];
}

// ─── Tax invoice document ────────────────────────────────────────────────────
// The issued-invoice shape, mirroring the PDF Datamatics sends: per-line
// records × rate, a PO reference where one applies, and the invoice-level
// metadata (service month, internal reference, billing contact).

export interface TaxInvoiceLine {
  description: string;
  po?: string;
  /** Records delivered, or FTE count on an FTE Project invoice. */
  qty: number;
  rate: number;
  amount: number;
}

export interface TaxInvoice {
  invoiceNumber: string;
  issueDate: string;   // ISO date
  dueDate: string;     // ISO date — Net 30 from issue
  forMonth: string;    // service month, e.g. 'Feb-2026'
  reference: string | null;
  contactEmail: string;
  serviceType: 'Optins Services' | 'FTE Project';
  status: 'paid' | 'due';
  paidAt?: string;
  lineItems: TaxInvoiceLine[];
  qtyTotal: number;
  total: number;
}
