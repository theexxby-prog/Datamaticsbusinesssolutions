import type { TaxInvoice } from '../types';
import { SELLER, CLIENT_BILLING, REMITTANCE, PAYMENT_TERMS } from '../config/billing';
import { formatDate } from './formatDate';

// ─── Invoice PDF ─────────────────────────────────────────────────────────────
// The downloadable twin of <TaxInvoiceDocument />. Both read the same record,
// so the screen and the file cannot disagree. Long descriptions wrap and the
// table breaks across pages with the header repeated — the largest invoice in
// the set runs to 28 lines.

const usd = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function generateTaxInvoicePDF(invoice: TaxInvoice) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const PW = 210, ML = 16, CW = PW - ML * 2;
  const brand: [number, number, number] = [186, 32, 39];
  const dark: [number, number, number] = [26, 26, 26];
  const gray: [number, number, number] = [110, 116, 126];
  const rule: [number, number, number] = [225, 228, 232];

  const isFte = invoice.serviceType === 'FTE Project';
  const fmtQty = (n: number) => (isFte ? n.toFixed(2) : n.toLocaleString('en-US'));

  // Column x-positions (right edges for numeric columns)
  const X_DESC = ML;
  const X_PO = ML + 96;
  const X_QTY = ML + 130;
  const X_RATE = ML + 152;
  const X_AMT = PW - ML;

  let y = 0;

  const tableHeader = () => {
    doc.setDrawColor(...rule); doc.setLineWidth(0.3);
    doc.line(ML, y, PW - ML, y);
    y += 5;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...gray);
    doc.text('DESCRIPTION OF SERVICES', X_DESC, y);
    doc.text('PO NUMBER', X_PO, y);
    doc.text(isFte ? 'NO. OF FTE' : 'NO. OF RECORDS', X_QTY, y, { align: 'right' });
    doc.text('RATE', X_RATE, y, { align: 'right' });
    doc.text('AMOUNT USD', X_AMT, y, { align: 'right' });
    y += 2.5;
    doc.line(ML, y, PW - ML, y);
    y += 4;
  };

  const masthead = () => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...dark);
    doc.text(SELLER.name, ML, 18);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...gray);
    doc.text(`HSN / SAC ${SELLER.hsnSac}  ·  Place of supply: ${CLIENT_BILLING.placeOfSupply}`, ML, 23);

    doc.setFillColor(...brand);
    doc.roundedRect(PW - ML - 32, 13, 32, 7, 1, 1, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    doc.text('TAX INVOICE', PW - ML - 16, 17.8, { align: 'center' });

    doc.setDrawColor(...brand); doc.setLineWidth(0.5);
    doc.line(ML, 27, PW - ML, 27);
  };

  masthead();
  y = 36;

  // Bill-to
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...gray);
  doc.text('BILL TO', ML, y);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...dark);
  doc.text(CLIENT_BILLING.name, ML, y + 6);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...gray);
  CLIENT_BILLING.addressLines.forEach((l, i) => doc.text(l, ML, y + 11.5 + i * 4.5));
  doc.text(invoice.contactEmail, ML, y + 11.5 + CLIENT_BILLING.addressLines.length * 4.5 + 1.5);

  // Invoice meta, right aligned
  const meta: [string, string][] = [
    ['Invoice no.', invoice.invoiceNumber],
    ['Dated', formatDate(invoice.issueDate)],
    ['For the month', invoice.forMonth],
    ['Payment due', formatDate(invoice.dueDate)],
  ];
  meta.forEach(([k, v], i) => {
    const my = y + i * 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...gray);
    doc.text(k, PW - ML - 42, my, { align: 'right' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...dark);
    doc.text(v, PW - ML, my, { align: 'right' });
  });

  // The reference is long enough to collide with a right-aligned label, so it
  // gets its own full-width line under the meta block.
  if (invoice.reference) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...gray);
    doc.text(`Reference: ${invoice.reference}`, PW - ML, y + meta.length * 5, { align: 'right' });
  }

  y += 34;

  tableHeader();
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...dark);
  doc.text(`Charges for ${invoice.serviceType}`, X_DESC, y);
  y += 6;

  const DESC_W = 92;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  for (const line of invoice.lineItems) {
    const wrapped = doc.splitTextToSize(line.description, DESC_W) as string[];
    const rowH = Math.max(wrapped.length * 3.8, 5) + 2.5;

    if (y + rowH > 252) {
      doc.addPage();
      masthead();
      y = 36;
      tableHeader();
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    }

    doc.setTextColor(...dark);
    doc.text(wrapped, X_DESC, y);
    doc.setTextColor(...gray);
    doc.text(line.po ?? '-', X_PO, y);
    doc.setTextColor(...dark);
    doc.text(fmtQty(line.qty), X_QTY, y, { align: 'right' });
    doc.text(usd(line.rate), X_RATE, y, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(usd(line.amount), X_AMT, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += rowH;
    doc.setDrawColor(245, 246, 248); doc.setLineWidth(0.2);
    doc.line(ML, y - 2, PW - ML, y - 2);
  }

  // Total
  if (y + 16 > 252) { doc.addPage(); masthead(); y = 36; }
  doc.setDrawColor(...dark); doc.setLineWidth(0.4);
  doc.line(ML, y, PW - ML, y);
  y += 6;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...dark);
  doc.text('Total', X_DESC, y);
  doc.text(fmtQty(invoice.qtyTotal), X_QTY, y, { align: 'right' });
  doc.setFontSize(12);
  doc.text(`$${usd(invoice.total)}`, X_AMT, y + 0.5, { align: 'right' });
  y += 12;

  // Remittance + terms
  if (y + 48 > 258) { doc.addPage(); masthead(); y = 36; }
  doc.setFillColor(250, 250, 251);
  doc.rect(ML, y, CW, 44, 'F');
  const boxTop = y + 6;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...gray);
  doc.text('REMITTANCE', ML + 4, boxTop);
  const remit: [string, string][] = [
    ['Account', REMITTANCE.account],
    ['Bank', REMITTANCE.bank],
    ['Account no.', REMITTANCE.accountNo],
    ['ABA routing', REMITTANCE.abaRouting],
    ['SWIFT', REMITTANCE.swift],
  ];
  remit.forEach(([k, v], i) => {
    const ry = boxTop + 5.5 + i * 4.2;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...gray);
    doc.text(k, ML + 4, ry);
    doc.setTextColor(...dark);
    doc.text(v, ML + 26, ry);
  });

  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...gray);
  doc.text('PAYMENT & OTHER TERMS', ML + CW / 2 + 2, boxTop);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8);
  let ty = boxTop + 5;
  PAYMENT_TERMS.forEach((t, i) => {
    const wrapped = doc.splitTextToSize(`${i + 1}. ${t}`, CW / 2 - 8) as string[];
    doc.text(wrapped, ML + CW / 2 + 2, ty);
    ty += wrapped.length * 3;
  });

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...rule); doc.setLineWidth(0.3);
    doc.line(ML, 285, PW - ML, 285);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...gray);
    doc.text(`Questions about this invoice? ${SELLER.accountsEmail}`, ML, 290);
    doc.text(`Invoice ${invoice.invoiceNumber}  ·  Page ${p} of ${pages}`, PW - ML, 290, { align: 'right' });
  }

  doc.save(`Invoice_${invoice.invoiceNumber}_The_Channel_Company.pdf`);
}
