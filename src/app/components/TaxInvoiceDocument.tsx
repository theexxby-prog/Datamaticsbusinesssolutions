import type { TaxInvoice } from '../types';
import { SELLER, CLIENT_BILLING, REMITTANCE, PAYMENT_TERMS } from '../config/billing';
import { formatDate } from '../utils/formatDate';

const usd = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Records are whole units; FTE counts carry two decimals. */
const qty = (n: number, fte: boolean) =>
  fte ? n.toFixed(2) : n.toLocaleString('en-US');

/**
 * A rendered tax invoice, laid out to match the issued PDF: client block and
 * invoice meta side by side, the line-item table, then remittance and terms.
 *
 * This is the on-screen twin of the downloadable PDF — both read the same
 * record, so the two can never show different figures.
 */
export function TaxInvoiceDocument({ invoice }: { invoice: TaxInvoice }) {
  const isFte = invoice.serviceType === 'FTE Project';
  const qtyLabel = isFte ? 'No. of FTE' : 'No. of Records';

  return (
    <div className="bg-white text-[#1A1A1A]">
      {/* Masthead */}
      <div className="flex items-start justify-between gap-6 px-8 pt-8 pb-6">
        <div>
          <div className="font-bold text-[17px] tracking-tight">{SELLER.name}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">
            HSN / SAC {SELLER.hsnSac} · Place of supply: {CLIENT_BILLING.placeOfSupply}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div
            className="inline-block px-3 py-1 rounded text-[11px] font-bold tracking-[0.14em] text-white"
            /* Literal, not a token: this is a printed document and must not
               follow the theme. On a token it rendered white-on-#F07377 in
               dark mode. */
            style={{ background: '#BA2027' }}
          >
            TAX INVOICE
          </div>
        </div>
      </div>

      <div className="h-px mx-8" style={{ background: 'var(--color-primary)' }} />

      {/* Client + invoice meta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-8 py-6">
        <div>
          <div className="text-[10px] font-semibold tracking-[0.12em] text-gray-400 mb-2">BILL TO</div>
          <div className="font-semibold text-[14px]">{CLIENT_BILLING.name}</div>
          {CLIENT_BILLING.addressLines.map((l) => (
            <div key={l} className="text-[13px] text-gray-600 leading-snug">{l}</div>
          ))}
          <div className="text-[13px] text-gray-600 mt-1.5">{invoice.contactEmail}</div>
        </div>

        <dl className="sm:text-right space-y-1.5">
          <div className="flex sm:justify-end gap-3">
            <dt className="text-[12px] text-gray-500 w-28 sm:w-auto">Invoice no.</dt>
            <dd className="text-[13px] font-semibold tabular-nums">{invoice.invoiceNumber}</dd>
          </div>
          <div className="flex sm:justify-end gap-3">
            <dt className="text-[12px] text-gray-500 w-28 sm:w-auto">Dated</dt>
            <dd className="text-[13px] tabular-nums">{formatDate(invoice.issueDate)}</dd>
          </div>
          <div className="flex sm:justify-end gap-3">
            <dt className="text-[12px] text-gray-500 w-28 sm:w-auto">For the month</dt>
            <dd className="text-[13px]">{invoice.forMonth}</dd>
          </div>
          <div className="flex sm:justify-end gap-3">
            <dt className="text-[12px] text-gray-500 w-28 sm:w-auto">Payment due</dt>
            <dd className="text-[13px] tabular-nums">{formatDate(invoice.dueDate)}</dd>
          </div>
          {invoice.reference && (
            <div className="flex sm:justify-end gap-3">
              <dt className="text-[12px] text-gray-500 w-28 sm:w-auto">Reference</dt>
              <dd className="text-[12px] text-gray-600">{invoice.reference}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Line items */}
      <div className="px-8 overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: '640px' }}>
          <caption className="sr-only">
            Charges for {invoice.serviceType}, invoice {invoice.invoiceNumber}
          </caption>
          <thead>
            <tr className="border-y border-gray-200">
              <th scope="col" className="text-left text-[10px] font-semibold tracking-[0.1em] text-gray-500 py-2.5 pr-3">
                DESCRIPTION OF SERVICES
              </th>
              <th scope="col" className="text-left text-[10px] font-semibold tracking-[0.1em] text-gray-500 py-2.5 px-3 w-[92px]">
                PO NUMBER
              </th>
              <th scope="col" className="text-right text-[10px] font-semibold tracking-[0.1em] text-gray-500 py-2.5 px-3 w-[96px]">
                {qtyLabel.toUpperCase()}
              </th>
              <th scope="col" className="text-right text-[10px] font-semibold tracking-[0.1em] text-gray-500 py-2.5 px-3 w-[76px]">
                RATE
              </th>
              <th scope="col" className="text-right text-[10px] font-semibold tracking-[0.1em] text-gray-500 py-2.5 pl-3 w-[104px]">
                AMOUNT USD
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="pt-3 pb-1 text-[12px] font-semibold text-gray-700">
                Charges for {invoice.serviceType}
              </td>
            </tr>
            {invoice.lineItems.map((line, i) => (
              <tr key={`${line.description}-${i}`} className="align-top border-b border-gray-100">
                <td className="py-2 pr-3 text-[12.5px] leading-snug">{line.description}</td>
                <td className="py-2 px-3 text-[12px] text-gray-500">{line.po ?? '—'}</td>
                <td className="py-2 px-3 text-[12.5px] text-right tabular-nums">{qty(line.qty, isFte)}</td>
                <td className="py-2 px-3 text-[12.5px] text-right tabular-nums">{usd(line.rate)}</td>
                <td className="py-2 pl-3 text-[12.5px] text-right tabular-nums font-medium">{usd(line.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300">
              <td className="py-3 pr-3 text-[12px] font-semibold" colSpan={2}>Total</td>
              <td className="py-3 px-3 text-[12.5px] text-right tabular-nums font-semibold">
                {qty(invoice.qtyTotal, isFte)}
              </td>
              <td className="py-3 px-3" />
              <td className="py-3 pl-3 text-right tabular-nums font-bold text-[15px]">
                ${usd(invoice.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Remittance + terms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-8 py-7 mt-4" style={{ background: '#FAFAFB' }}>
        <div>
          <div className="text-[10px] font-semibold tracking-[0.12em] text-gray-400 mb-2">REMITTANCE</div>
          <dl className="text-[12px] leading-relaxed">
            {[
              ['Account', REMITTANCE.account],
              ['Bank', REMITTANCE.bank],
              ['Account no.', REMITTANCE.accountNo],
              ['ABA routing', REMITTANCE.abaRouting],
              ['SWIFT', REMITTANCE.swift],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="text-gray-500 w-[86px] flex-shrink-0">{k}</dt>
                <dd className="text-gray-800 tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <div className="text-[10px] font-semibold tracking-[0.12em] text-gray-400 mb-2">PAYMENT &amp; OTHER TERMS</div>
          <ol className="text-[11.5px] text-gray-600 leading-relaxed list-decimal pl-4 space-y-0.5">
            {PAYMENT_TERMS.map((t) => <li key={t}>{t}</li>)}
          </ol>
        </div>
      </div>

      <p className="px-8 py-4 text-[11px] text-gray-400 text-center">
        Questions about this invoice? {SELLER.accountsEmail}
      </p>
    </div>
  );
}
