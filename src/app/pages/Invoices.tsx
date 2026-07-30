import { useMemo, useState } from 'react';
import {
  Receipt, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp,
  Download, Loader2, RefreshCw, Send, FileCheck2, Link2, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { EmptyState } from '../components/EmptyState';
import { WorkflowStepper } from '../components/workflow/WorkflowStepper';
import { IntegrationChip } from '../components/workflow/IntegrationChip';
import { mockInvoiceRecords } from '../data/mockInvoiceRecords';
import { tccTaxInvoices } from '../data/tccTaxInvoices';
import { TaxInvoiceModal } from '../components/TaxInvoiceModal';
import { generateTaxInvoicePDF } from '../utils/taxInvoicePdf';
import type { TaxInvoice } from '../types';
import {
  INVOICE_STAGE_ORDER, INVOICE_STAGE_META, GROUPING_META, stageIndex,
  formatBillingPeriod, formatUSD, validateInvoice, syncInvoiceToTally,
  sendInvoice,
} from '../utils/invoiceWorkflow';
import type { InvoiceRecord } from '../types';
import { formatDate } from '../utils/formatDate';

type InvoicePerspective = 'client' | 'accounts' | 'readonly';

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return formatDate(iso);
}

const stageChipStyles: Record<string, string> = {
  draft: 'bg-[var(--color-accent-purple-bg)] text-[var(--color-accent-purple)]',
  pending_validation: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
  approved: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
  sent: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
  paid: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
  overdue: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
  void: 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]',
};

// ─── Single invoice card ──────────────────────────────────────────────────────

function InvoiceCard({
  invoice, perspective, busy,
  onValidate, onRetryTally,
}: {
  invoice: InvoiceRecord;
  perspective: InvoicePerspective;
  busy: boolean;
  onValidate: (inv: InvoiceRecord) => void;
  onRetryTally: (inv: InvoiceRecord) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const steps = INVOICE_STAGE_ORDER.map((s) => ({ key: s, label: INVOICE_STAGE_META[s].label }));
  const isPaid = invoice.stage === 'paid';
  const isOverdue = invoice.stage === 'overdue';
  const tallyFailed = invoice.tally.invoiceEntry === 'failed';

  const canValidate = perspective === 'accounts' && (invoice.stage === 'draft' || invoice.stage === 'pending_validation');
  const canRetryTally = perspective === 'accounts' && tallyFailed;

  const groupingLabel = invoice.grouping === 'geo_split' && invoice.geo
    ? `Geo Split · ${invoice.geo}`
    : GROUPING_META[invoice.grouping].label;

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '0.02em' }}>
              {invoice.invoiceNumber}
            </span>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full"
              style={{ fontSize: '11px', fontWeight: 500, background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}
              title={GROUPING_META[invoice.grouping].hint}
            >
              {groupingLabel}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${stageChipStyles[invoice.stage]}`}>
              {INVOICE_STAGE_META[invoice.stage].label}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {invoice.clientCompany} · Billing period {formatBillingPeriod(invoice.billingPeriod)}
            {invoice.dueDate && ` · Due ${fmtDate(invoice.dueDate)}`}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div style={{ fontSize: '20px', fontWeight: 700, color: isOverdue ? 'var(--color-error)' : 'var(--color-text-primary)' }}>
            {formatUSD(invoice.total)}
          </div>
          {isPaid && invoice.payment?.paidAt && (
            <div className="flex items-center gap-1 justify-end" style={{ fontSize: '11px', color: 'var(--color-success)' }}>
              <CheckCircle2 className="w-3 h-3" /> Paid {fmtDate(invoice.payment.paidAt)}
            </div>
          )}
        </div>
      </div>

      {/* Stepper — horizontal on desktop, stacked vertically on phones */}
      <div className="mb-4 hidden md:block">
        <WorkflowStepper steps={steps} currentIndex={stageIndex(invoice)} allDone={isPaid} size="sm" />
      </div>
      <div className="mb-4 md:hidden">
        <WorkflowStepper steps={steps} currentIndex={stageIndex(invoice)} allDone={isPaid} size="sm" orientation="vertical" />
      </div>

      {/* Tally + payment chips */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <IntegrationChip system="Tally · Invoice" status={invoice.tally.invoiceEntry} detail={invoice.tally.voucherId} error={invoice.tally.error} />
        <IntegrationChip system="Tally · Payment" status={invoice.tally.paymentEntry} />
        {isOverdue && (
          <span className="inline-flex items-center gap-1" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-error)' }}>
            <AlertCircle className="w-3.5 h-3.5" /> Past due — {fmtDate(invoice.dueDate)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {canValidate && (
          <button onClick={() => onValidate(invoice)} disabled={busy} className="btn-primary px-4 py-2 flex items-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck2 className="w-4 h-4" />}
            {busy ? 'Validating…' : 'Validate & Send'}
          </button>
        )}
        {canRetryTally && (
          <button onClick={() => onRetryTally(invoice)} disabled={busy} className="btn-secondary px-4 py-2 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry Tally Sync
          </button>
        )}
        <button
          onClick={() => toast.success(`Downloading ${invoice.invoiceNumber}.pdf…`)}
          className="btn-secondary px-4 py-2 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="ml-auto flex items-center gap-1 px-2 py-1"
          style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}
        >
          {invoice.lineItems.length} line item{invoice.lineItems.length !== 1 ? 's' : ''}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Line items — billable leads × CPL, never Delivered */}
      {expanded && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border-light)' }}>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full" style={{ fontSize: '12px' }}>
              <thead>
                <tr style={{ color: 'var(--color-text-muted)', textAlign: 'left' }}>
                  <th className="py-1.5 pr-3 font-semibold">Campaign</th>
                  <th className="py-1.5 pr-3 font-semibold">Job Card</th>
                  <th className="py-1.5 pr-3 font-semibold">Geo</th>
                  <th className="py-1.5 pr-3 font-semibold text-right">Billable Leads</th>
                  <th className="py-1.5 pr-3 font-semibold text-right">CPL</th>
                  <th className="py-1.5 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((li) => (
                  <tr key={`${li.campaignId}-${li.geo}`} style={{ borderTop: '1px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}>
                    <td className="py-2 pr-3">{li.campaignName}</td>
                    <td className="py-2 pr-3">
                      {li.jobCardId ? (
                        <span className="inline-flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
                          <Link2 className="w-3 h-3" />{li.jobCardId}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2 pr-3">{li.geo}</td>
                    <td className="py-2 pr-3 text-right">{li.billableLeads.toLocaleString('en-US')}</td>
                    <td className="py-2 pr-3 text-right">{formatUSD(li.cpl)}</td>
                    <td className="py-2 text-right font-semibold">{formatUSD(li.amount)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid var(--color-border-light)' }}>
                  <td colSpan={5} className="py-2 pr-3 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Total</td>
                  <td className="py-2 text-right font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatUSD(invoice.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile: each line item as a label/value block instead of a 6-column table */}
          <div className="md:hidden flex flex-col gap-3">
            {invoice.lineItems.map((li) => (
              <div
                key={`${li.campaignId}-${li.geo}`}
                className="rounded-xl border p-3"
                style={{ borderColor: 'var(--color-border-light)', fontSize: '13px' }}
              >
                <div className="mb-2 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {li.campaignName}
                </div>
                <div className="flex flex-col gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
                  <div className="flex justify-between gap-3">
                    <span style={{ color: 'var(--color-text-muted)' }}>Job Card</span>
                    {li.jobCardId ? (
                      <span className="inline-flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
                        <Link2 className="w-3 h-3" />{li.jobCardId}
                      </span>
                    ) : '—'}
                  </div>
                  <div className="flex justify-between gap-3">
                    <span style={{ color: 'var(--color-text-muted)' }}>Geo</span>
                    <span>{li.geo}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span style={{ color: 'var(--color-text-muted)' }}>Billable Leads × CPL</span>
                    <span>{li.billableLeads.toLocaleString('en-US')} × {formatUSD(li.cpl)}</span>
                  </div>
                  <div className="flex justify-between gap-3 font-semibold">
                    <span style={{ color: 'var(--color-text-muted)' }}>Amount</span>
                    <span>{formatUSD(li.amount)}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-between px-1 font-bold" style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
              <span>Total</span>
              <span>{formatUSD(invoice.total)}</span>
            </div>
          </div>

          <p className="mt-2" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Amounts are calculated from billable leads only.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Client-facing invoice card ───────────────────────────────────────────────
// Clients see money facts and actions only: what's due, when, pay, download,
// and the billable breakdown. No internal pipeline, no Tally, no validation.

type ClientStatus = 'due' | 'overdue' | 'paid';

function clientStatus(inv: InvoiceRecord): ClientStatus {
  if (inv.stage === 'paid') return 'paid';
  if (inv.stage === 'overdue') return 'overdue';
  return 'due';
}

const CLIENT_STATUS_META: Record<ClientStatus, { label: string; bg: string; color: string }> = {
  // 'due' here is the ageing statement's "Not Due" — issued, still within terms.
  due: { label: 'Not due', bg: 'rgba(100,116,139,0.12)', color: 'var(--color-badge-completed-text)' },
  overdue: { label: 'Due', bg: 'rgba(217,119,6,0.14)', color: 'var(--color-warning)' },
  paid: { label: 'Paid', bg: 'rgba(5,150,105,0.12)', color: 'var(--color-badge-active-text)' },
};

/** Days since the invoice was issued — the ageing column on the AR statement. */
function ageingDays(issueDate?: string): number | null {
  if (!issueDate) return null;
  const [y, m, d] = issueDate.split('-').map(Number);
  const issued = new Date(y, m - 1, d);
  const now = new Date();
  // Floor, not round: ageing is whole days elapsed, so it matches the AR
  // statement rather than tipping to the next day after midday.
  return Math.max(0, Math.floor((now.getTime() - issued.getTime()) / 86400000));
}

function ClientInvoiceCard({ invoice, busy, onView }: {
  invoice: InvoiceRecord;
  busy: boolean;
  onView: (invoiceNumber: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = clientStatus(invoice);
  const meta = CLIENT_STATUS_META[status];
  const region = invoice.grouping === 'geo_split' && invoice.geo ? invoice.geo : null;

  return (
    <div className="glass-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {invoice.invoiceNumber}
            </span>
            {region && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full" style={{ fontSize: '11px', fontWeight: 500, background: 'var(--color-main-bg)', color: 'var(--color-text-secondary)' }}>
                {region} region
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full" style={{ fontSize: '11px', fontWeight: 600, background: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            {formatBillingPeriod(invoice.billingPeriod)} billing
            {ageingDays(invoice.issueDate) !== null && <> · {ageingDays(invoice.issueDate)} days</>}
            {status === 'paid' && invoice.payment?.paidAt
              ? <> · Paid {fmtDate(invoice.payment.paidAt)}{invoice.payment.reference ? <span style={{ color: 'var(--color-text-muted)' }}> · Ref {invoice.payment.reference}</span> : null}</>
              : invoice.dueDate ? <> · Due <strong style={{ color: status === 'overdue' ? 'var(--color-error)' : 'var(--color-text-primary)' }}>{fmtDate(invoice.dueDate)}</strong></> : null}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div style={{ fontSize: '22px', fontWeight: 700, color: status === 'overdue' ? 'var(--color-error)' : 'var(--color-text-primary)' }}>
            {formatUSD(invoice.total)}
          </div>
          {status === 'paid' && (
            <div className="flex items-center gap-1 justify-end" style={{ fontSize: '12px', color: 'var(--color-success)' }}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Settled
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button onClick={() => onView(invoice.invoiceNumber)} className="btn-secondary px-4 py-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          View invoice
        </button>
        <button
          onClick={async () => {
            const doc = tccTaxInvoices.find((t) => t.invoiceNumber === invoice.invoiceNumber);
            if (!doc) return;
            try {
              await generateTaxInvoicePDF(doc);
              toast.success(`Invoice ${doc.invoiceNumber} downloaded`);
            } catch {
              toast.error('Could not generate the invoice PDF');
            }
          }}
          className="btn-secondary px-4 py-2 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="ml-auto flex items-center gap-1 px-2 py-1"
          style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}
        >
          View details
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border-light)' }}>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full" style={{ fontSize: '12px' }}>
              <thead>
                <tr style={{ color: 'var(--color-text-muted)', textAlign: 'left' }}>
                  <th className="py-1.5 pr-3 font-semibold">Campaign</th>
                  <th className="py-1.5 pr-3 font-semibold">Job Card</th>
                  <th className="py-1.5 pr-3 font-semibold text-right">Billable Leads</th>
                  <th className="py-1.5 pr-3 font-semibold text-right">Cost per Lead</th>
                  <th className="py-1.5 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((li) => (
                  <tr key={`${li.campaignId}-${li.geo}`} style={{ borderTop: '1px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}>
                    <td className="py-2 pr-3">{li.campaignName}</td>
                    <td className="py-2 pr-3">{li.jobCardId ?? '—'}</td>
                    <td className="py-2 pr-3 text-right">{li.billableLeads.toLocaleString('en-US')}</td>
                    <td className="py-2 pr-3 text-right">{formatUSD(li.cpl)}</td>
                    <td className="py-2 text-right font-semibold">{formatUSD(li.amount)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid var(--color-border-light)' }}>
                  <td colSpan={4} className="py-2 pr-3 text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Total</td>
                  <td className="py-2 text-right font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatUSD(invoice.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile: label/value blocks instead of a 5-column table */}
          <div className="md:hidden flex flex-col gap-3">
            {invoice.lineItems.map((li) => (
              <div
                key={`${li.campaignId}-${li.geo}`}
                className="rounded-xl border p-3"
                style={{ borderColor: 'var(--color-border-light)', fontSize: '13px' }}
              >
                <div className="mb-2 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {li.campaignName}
                </div>
                <div className="flex flex-col gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
                  <div className="flex justify-between gap-3">
                    <span style={{ color: 'var(--color-text-muted)' }}>Job Card</span>
                    <span>{li.jobCardId ?? '—'}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span style={{ color: 'var(--color-text-muted)' }}>Billable Leads × CPL</span>
                    <span>{li.billableLeads.toLocaleString('en-US')} × {formatUSD(li.cpl)}</span>
                  </div>
                  <div className="flex justify-between gap-3 font-semibold">
                    <span style={{ color: 'var(--color-text-muted)' }}>Amount</span>
                    <span>{formatUSD(li.amount)}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-between px-1 font-bold" style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
              <span>Total</span>
              <span>{formatUSD(invoice.total)}</span>
            </div>
          </div>

          <p className="mt-2" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            You are only ever billed for accepted, billable leads.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Invoices() {
  useDocumentTitle('Invoices');
  const { currentUser } = useAuth();

  const perspective: InvoicePerspective =
    currentUser.role === 'client' ? 'client'
      : currentUser.role === 'accounts' ? 'accounts'
        : 'readonly';

  const [invoices, setInvoices] = useState<InvoiceRecord[]>(mockInvoiceRecords);
  const [viewing, setViewing] = useState<TaxInvoice | null>(null);
  // Ageing filter for the client list — lets the whole AR position, just what
  // is past terms, or just what is still within them be shown on demand.
  const [arFilter, setArFilter] = useState<'all' | 'due' | 'not_due'>('all');
  const openInvoice = (invoiceNumber: string) =>
    setViewing(tccTaxInvoices.find((t) => t.invoiceNumber === invoiceNumber) ?? null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const now = () => new Date().toISOString();

  const patchInvoice = (id: string, patch: (inv: InvoiceRecord) => InvoiceRecord) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? patch(inv) : inv)));
  };

  // Clients see only their own sent/paid/overdue invoices — never internal drafts.
  // Ordering for clients is action-first: overdue, then due (soonest first), then paid.
  const visibleInvoices = useMemo(() => {
    let list = invoices;
    if (perspective === 'client') {
      list = invoices.filter(
        (inv) => inv.clientCompany === currentUser.company
          && ['sent', 'paid', 'overdue'].includes(inv.stage),
      );
      const rank = (inv: InvoiceRecord) => (inv.stage === 'overdue' ? 0 : inv.stage === 'sent' ? 1 : 2);
      return [...list].sort((a, b) => {
        const r = rank(a) - rank(b);
        if (r !== 0) return r;
        if (rank(a) < 2) return (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
        return b.billingPeriod.localeCompare(a.billingPeriod);
      });
    }
    return [...list].sort((a, b) => b.billingPeriod.localeCompare(a.billingPeriod));
  }, [invoices, perspective, currentUser.company]);

  const validationQueue = perspective === 'accounts'
    ? visibleInvoices.filter((inv) => inv.stage === 'draft' || inv.stage === 'pending_validation')
    : [];
  const rest = perspective === 'accounts'
    ? visibleInvoices.filter((inv) => !validationQueue.includes(inv))
    : visibleInvoices.filter((inv) =>
        arFilter === 'all' ? true
        : arFilter === 'due' ? inv.stage === 'overdue'
        : inv.stage === 'sent');

  // Tab counts always describe the full position, not the filtered view.
  const arCounts = {
    all: visibleInvoices.length,
    due: visibleInvoices.filter((i) => i.stage === 'overdue').length,
    not_due: visibleInvoices.filter((i) => i.stage === 'sent').length,
  };

  // ─── Accounts: validate → Tally sales voucher → send to client ───
  const handleValidate = async (invoice: InvoiceRecord) => {
    setBusyId(invoice.id);
    try {
      const { validatedAt } = await validateInvoice(invoice);
      patchInvoice(invoice.id, (inv) => ({
        ...inv,
        stage: 'approved',
        validatedBy: currentUser.name,
        validatedAt,
        tally: { ...inv.tally, invoiceEntry: 'syncing' },
        history: [...inv.history, { at: now(), actor: currentUser.name, action: 'Validated amount' }],
      }));

      const { voucherId } = await syncInvoiceToTally(invoice);
      patchInvoice(invoice.id, (inv) => ({
        ...inv,
        tally: { ...inv.tally, invoiceEntry: 'synced', voucherId, error: undefined },
        history: [...inv.history, { at: now(), actor: 'System', action: `Sales voucher ${voucherId} created in Tally` }],
      }));

      const { issueDate, dueDate } = await sendInvoice(invoice);
      patchInvoice(invoice.id, (inv) => ({
        ...inv,
        stage: 'sent',
        issueDate,
        dueDate,
        history: [...inv.history, { at: now(), actor: 'System', action: 'Invoice sent to client' }],
      }));
      toast.success(`${invoice.invoiceNumber} validated, synced to Tally, and sent to the client`);
    } finally {
      setBusyId(null);
    }
  };

  const handleRetryTally = async (invoice: InvoiceRecord) => {
    setBusyId(invoice.id);
    try {
      patchInvoice(invoice.id, (inv) => ({ ...inv, tally: { ...inv.tally, invoiceEntry: 'syncing' } }));
      const { voucherId } = await syncInvoiceToTally(invoice);
      const { issueDate, dueDate } = await sendInvoice(invoice);
      patchInvoice(invoice.id, (inv) => ({
        ...inv,
        stage: 'sent',
        issueDate,
        dueDate,
        tally: { ...inv.tally, invoiceEntry: 'synced', voucherId, error: undefined },
        history: [
          ...inv.history,
          { at: now(), actor: 'System', action: `Tally sync retried — voucher ${voucherId} created` },
          { at: now(), actor: 'System', action: 'Invoice sent to client' },
        ],
      }));
      toast.success('Tally voucher created — invoice sent to the client');
    } finally {
      setBusyId(null);
    }
  };

  // ─── KPIs per perspective ───
  const outstanding = visibleInvoices.filter((i) => i.stage === 'sent' || i.stage === 'overdue').reduce((s, i) => s + i.total, 0);
  const paidTotal = visibleInvoices.filter((i) => i.stage === 'paid').reduce((s, i) => s + i.total, 0);
  // Split the outstanding balance the way the AR ageing statement does.
  const dueTotal = visibleInvoices.filter((i) => i.stage === 'overdue').reduce((s, i) => s + i.total, 0);
  const notYetDueTotal = visibleInvoices.filter((i) => i.stage === 'sent').reduce((s, i) => s + i.total, 0);
  const oldestAgeing = visibleInvoices
    .filter((i) => i.stage === 'sent' || i.stage === 'overdue')
    .map((i) => ageingDays(i.issueDate))
    .filter((n): n is number => n != null)
    .sort((a, b) => b - a)[0] ?? null;
  const overdueCount = visibleInvoices.filter((i) => i.stage === 'overdue').length;
  const pendingValidationCount = invoices.filter((i) => i.stage === 'draft' || i.stage === 'pending_validation').length;
  const tallyIssues = invoices.filter((i) => i.tally.invoiceEntry === 'failed' || i.tally.paymentEntry === 'failed').length;

  // Next due date across unpaid invoices (client view)
  const nextDue = visibleInvoices
    .filter((i) => i.stage === 'sent' || i.stage === 'overdue')
    .map((i) => i.dueDate)
    .filter(Boolean)
    .sort()[0];

  const kpis = perspective === 'accounts'
    ? [
      { label: 'Awaiting Validation', value: pendingValidationCount, icon: FileCheck2, money: false },
      { label: 'Outstanding', value: outstanding, icon: Clock, money: true },
      { label: 'Collected', value: paidTotal, icon: CheckCircle2, money: true },
      { label: 'Tally Sync Issues', value: tallyIssues, icon: AlertCircle, money: false },
    ]
    : perspective === 'client'
      ? [
        { label: 'Total Outstanding', value: outstanding, icon: Clock, money: true },
        { label: 'Due', value: dueTotal, icon: AlertCircle, money: true },
        { label: 'Not Yet Due', value: notYetDueTotal, icon: Receipt, money: true },
        { label: 'Oldest Invoice', value: oldestAgeing != null ? `${oldestAgeing} days` : '—', icon: CheckCircle2, money: false },
      ]
      : [
        { label: 'Outstanding', value: outstanding, icon: Clock, money: true },
        { label: 'Paid', value: paidTotal, icon: CheckCircle2, money: true },
        { label: 'Overdue', value: overdueCount, icon: AlertCircle, money: false },
        { label: 'Total Invoices', value: visibleInvoices.length, icon: Receipt, money: false },
      ];

  const subtitle =
    perspective === 'client' ? 'Your monthly invoices — view the detail and download copies for your records'
      : perspective === 'accounts' ? 'Validate amounts, sync to Tally, and track collections'
        : 'Invoice pipeline across all clients';

  return (
    <>
      <div className="max-w-[1440px] mx-auto page-content animate-fadeIn">
        {/* Header */}
        <div className="mb-6">
          <h1 style={{ color: 'var(--color-text-primary)' }}>Invoices</h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{subtitle}</p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 stagger-children">
          {kpis.map(({ label, value, icon: Icon, money }, i) => (
            <div key={label} className="kpi-card animate-slideInUp" style={{ padding: '16px', animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center justify-between mb-1">
                <Icon className="kpi-card__icon" style={{ width: '16px', height: '16px' }} />
              </div>
              <div className="kpi-card__number" style={{ fontSize: '24px', marginBottom: '2px' }}>
                {typeof value === 'string' ? value : money ? <>$<AnimatedCounter value={value} /></> : <AnimatedCounter value={value} />}
              </div>
              <div className="kpi-card__label">{label}</div>
            </div>
          ))}
        </div>

        {/* Accounts: validation queue first */}
        {perspective === 'accounts' && validationQueue.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              <Send className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              Validation Queue
            </h2>
            <div className="space-y-4">
              {validationQueue.map((inv) => (
                <InvoiceCard
                  key={inv.id}
                  invoice={inv}
                  perspective={perspective}
                  busy={busyId === inv.id}
                  onValidate={handleValidate}
                  onRetryTally={handleRetryTally}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main list */}
        <h2 className="mb-3" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {perspective === 'accounts' ? 'All Invoices' : 'Your Invoices'}
        </h2>

        {perspective === 'client' && (
          <div
            className="inline-flex items-center gap-1 p-1 rounded-xl mb-4"
            style={{ background: 'var(--color-main-bg)', border: '1px solid var(--color-border)' }}
            role="tablist"
            aria-label="Filter invoices by ageing"
          >
            {([
              ['all', 'All', arCounts.all],
              ['due', 'Due', arCounts.due],
              ['not_due', 'Not due', arCounts.not_due],
            ] as const).map(([key, label, count]) => {
              const active = arFilter === key;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setArFilter(key)}
                  className="px-3.5 py-1.5 rounded-lg transition-colors"
                  style={{
                    fontSize: '13px',
                    fontWeight: active ? 600 : 500,
                    background: active ? 'var(--color-card)' : 'transparent',
                    color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {label}
                  <span className="ml-1.5" style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {rest.length === 0 && validationQueue.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No invoices yet"
            description="Invoices are generated monthly from the previous month's billable leads."
          />
        ) : (
          <div className="space-y-4">
            {rest.map((inv) => (
              perspective === 'client' ? (
                <ClientInvoiceCard key={inv.id} invoice={inv} busy={busyId === inv.id} onView={openInvoice} />
              ) : (
                <InvoiceCard
                  key={inv.id}
                  invoice={inv}
                  perspective={perspective}
                  busy={busyId === inv.id}
                  onValidate={handleValidate}
                  onRetryTally={handleRetryTally}
                />
              )
            ))}
          </div>
        )}
      </div>
    
      <TaxInvoiceModal invoice={viewing} onClose={() => setViewing(null)} />
    </>
  );
}
