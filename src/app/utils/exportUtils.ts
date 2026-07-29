import type { Lead } from '../mockData';
import type { Invoice } from '../mockInvoices';
import { formatDate } from './formatDate';

// ─── CSV Export ──────────────────────────────────────────────────────────────

export function exportLeadsToCSV(leads: Lead[], filename?: string) {
  const headers = [
    'First Name', 'Last Name', 'Title', 'Company', 'Industry',
    'Email', 'Phone', 'Country', 'Employee Size', 'Revenue',
    'Lead Score', 'Status', 'Campaign', 'Delivery Date', 'Rejection Reason',
  ];

  const rows = leads.map(lead => [
    lead.firstName,
    lead.lastName,
    lead.title,
    lead.company,
    lead.industry,
    lead.email,
    lead.phone,
    lead.country,
    lead.employeeSize,
    lead.revenue,
    String(lead.leadScore),
    lead.status,
    lead.campaignName,
    lead.deliveryDate,
    lead.rejectionReason || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  downloadFile(csvContent, filename || `leads_export_${formatDateForFile()}.csv`, 'text/csv');
}

export function exportInvoicesToCSV(invoices: Invoice[]) {
  const headers = ['Invoice Number', 'Campaign', 'Issue Date', 'Due Date', 'Amount', 'Status'];

  const rows = invoices.map(inv => [
    inv.invoiceNumber,
    inv.campaignName,
    inv.issueDate,
    inv.dueDate,
    String(inv.amount),
    inv.status,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  downloadFile(csvContent, `invoices_export_${formatDateForFile()}.csv`, 'text/csv');
}

// ─── Invoice PDF Generation ──────────────────────────────────────────────────

export async function generateInvoicePDF(invoice: Invoice) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const brandColor: [number, number, number] = [186, 32, 39]; // #BA2027
  const gray: [number, number, number] = [107, 114, 128];
  const dark: [number, number, number] = [17, 24, 39];

  // Header bar
  doc.setFillColor(...brandColor);
  doc.rect(0, 0, 210, 35, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Datamatics', 15, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Business Solutions', 15, 25);

  // Invoice label
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 195, 22, { align: 'right' });

  // Invoice details section
  let y = 50;
  doc.setTextColor(...dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Number:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNumber, 60, y);

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Issue Date:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateForDisplay(invoice.issueDate), 60, y);

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Due Date:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateForDisplay(invoice.dueDate), 60, y);

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 15, y);
  doc.setFont('helvetica', 'normal');
  const statusColor = invoice.status === 'Paid' ? [34, 197, 94] as [number, number, number]
    : invoice.status === 'Overdue' ? brandColor : [234, 179, 8] as [number, number, number];
  doc.setTextColor(...statusColor);
  doc.text(invoice.status.toUpperCase(), 60, y);
  doc.setTextColor(...dark);

  // Bill To
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Bill To:', 15, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('The Channel Company', 15, y);
  y += 5;
  doc.setTextColor(...gray);
  doc.text('Renuka Lawless, VP of Sales', 15, y);
  doc.setTextColor(...dark);

  // From
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('From:', 120, y - 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Datamatics Business Solutions Ltd', 120, y - 5);
  doc.setTextColor(...gray);
  doc.text('Mumbai, India', 120, y);
  doc.setTextColor(...dark);

  // Divider
  y += 12;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(15, y, 195, y);

  // Line items table header
  y += 10;
  doc.setFillColor(249, 250, 251);
  doc.rect(15, y - 5, 180, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('DESCRIPTION', 18, y + 1);
  doc.text('QTY', 120, y + 1);
  doc.text('RATE', 145, y + 1);
  doc.text('AMOUNT', 192, y + 1, { align: 'right' });

  // Line item
  y += 12;
  doc.setTextColor(...dark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(invoice.campaignName, 18, y);
  doc.text('1', 123, y);
  doc.text(`$${invoice.amount.toLocaleString()}`, 145, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${invoice.amount.toLocaleString()}`, 192, y, { align: 'right' });

  // Totals
  y += 20;
  doc.setDrawColor(229, 231, 235);
  doc.line(130, y, 195, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text('Subtotal:', 130, y);
  doc.setTextColor(...dark);
  doc.text(`$${invoice.amount.toLocaleString()}`, 192, y, { align: 'right' });

  y += 7;
  doc.setTextColor(...gray);
  doc.text('Tax (0%):', 130, y);
  doc.setTextColor(...dark);
  doc.text('$0', 192, y, { align: 'right' });

  y += 10;
  doc.setDrawColor(...brandColor);
  doc.setLineWidth(1);
  doc.line(130, y, 195, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Total Due:', 130, y);
  doc.setTextColor(...brandColor);
  doc.text(`$${invoice.amount.toLocaleString()}`, 192, y, { align: 'right' });

  // Footer
  doc.setTextColor(...gray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your business.', 105, 270, { align: 'center' });
  doc.text('Datamatics Business Solutions Limited © 2026', 105, 275, { align: 'center' });
  doc.text('ISO 27001:2022 • ISO 9001:2015 • SOC 1 & 2 TYPE II • GDPR', 105, 280, { align: 'center' });

  doc.save(`${invoice.invoiceNumber}.pdf`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDateForFile() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatDateForDisplay(dateStr: string) {
  return formatDate(dateStr);
}

// ─── Reports & Analytics Export (PDF / CSV / XLSX) ───────────────────────────
// Page-faithful export of the client Reports view. Charts are vector-drawn so
// they stay crisp and theme-independent (no html2canvas screenshots).

export interface ReportsKPI { label: string; value: string; delta?: string; up?: boolean }
export interface ReportsTrendPoint { label: string; current: number; prev: number | null }
export interface ReportsDemoPanel { title: string; rows: { name: string; percentage: number }[] }
export interface ReportsPDFData {
  clientName: string;
  asOf: string;
  scope: string;
  campaignLabel: string;
  kpis: ReportsKPI[];
  pacing: { delivered: number; target: number; pct: number; onTrack: boolean };
  trend: ReportsTrendPoint[];
  hasPrevYear: boolean;
  demographics: ReportsDemoPanel[];
  conversion: { sent: number; accepted: number; acceptedPct: number; rejectedPct: number };
}

const fileStamp = (name: string) => `reports_${name.replace(/\s+/g, '_')}_${formatDateForFile()}`;
const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

export async function generateReportsPDF(
  d: ReportsPDFData,
  opts: { includeCharts: boolean; includeData: boolean } = { includeCharts: true, includeData: true },
) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const PW = 210, ML = 14, CW = PW - ML * 2;
  const brand: [number, number, number] = [186, 32, 39];
  const slate: [number, number, number] = [62, 92, 138];
  const green: [number, number, number] = [29, 158, 117];
  const amber: [number, number, number] = [180, 83, 9];
  const dark: [number, number, number] = [26, 26, 26];
  const gray: [number, number, number] = [107, 114, 128];
  const track: [number, number, number] = [237, 240, 244];
  const redCur: [number, number, number] = [186, 32, 39];    // brand red — "this year"
  const redPrev: [number, number, number] = [224, 168, 171];  // soft red tint — "last year"

  let y = 0;
  const ensure = (need: number) => { if (y + need > 280) { doc.addPage(); y = 18; } };
  const sectionTitle = (t: string) => {
    ensure(12);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...dark);
    doc.text(t, ML, y); y += 6;
  };

  // Header band
  doc.setFillColor(...brand); doc.rect(0, 0, PW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text('Datamatics', ML, 14);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text('Business Solutions', ML, 20);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text('Reports & Analytics', PW - ML, 13, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(`${d.clientName} · as of ${d.asOf}`, PW - ML, 20, { align: 'right' });

  y = 36;
  doc.setTextColor(...gray); doc.setFontSize(9);
  doc.text(`${d.scope} campaigns · ${d.campaignLabel}`, ML, y); y += 9;

  // KPIs
  sectionTitle('Key Metrics');
  const cols = 3, gap = 6, bw = (CW - gap * (cols - 1)) / cols, bh = 22;
  const kpiRows = Math.ceil(d.kpis.length / cols);
  ensure(kpiRows * (bh + gap));
  const kpiTop = y;
  d.kpis.forEach((k, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = ML + col * (bw + gap);
    const by = kpiTop + row * (bh + gap);
    doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3);
    doc.setFillColor(250, 250, 251);
    doc.roundedRect(x, by, bw, bh, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...gray);
    doc.text(k.label.toUpperCase(), x + 4, by + 6);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(k.value.length > 10 ? 9.5 : 15); doc.setTextColor(...dark);
    doc.text(k.value, x + 4, by + 14);
    if (k.delta) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
      doc.setTextColor(...(k.up ? green : brand));
      doc.text(k.delta, x + 4, by + 19);
    }
  });
  y = kpiTop + kpiRows * (bh + gap) + 2;

  // Pacing
  sectionTitle('This month — target vs delivered');
  ensure(16);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...dark);
  const delTxt = d.pacing.delivered.toLocaleString();
  doc.text(delTxt, ML, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...gray);
  doc.text(` / ${d.pacing.target.toLocaleString()} target · ${d.pacing.pct}%`, ML + doc.getTextWidth(delTxt) + 1, y);
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...(d.pacing.onTrack ? green : amber));
  doc.text(d.pacing.onTrack ? 'On track' : 'Behind pace', PW - ML, y, { align: 'right' });
  y += 3;
  doc.setFillColor(...track); doc.roundedRect(ML, y, CW, 4, 2, 2, 'F');
  doc.setFillColor(...(d.pacing.onTrack ? green : amber));
  doc.roundedRect(ML, y, Math.max(2, Math.min(CW, (d.pacing.pct / 100) * CW)), 4, 2, 2, 'F');
  y += 12;

  // Billable trend (vector bar chart)
  if (opts.includeCharts) {
    sectionTitle(`Billing Trend — last 12 months${d.hasPrevYear ? ' vs prior year' : ''}`);
    const chartH = 44;
    ensure(chartH + 14);
    let lx = PW - ML - 56; const ly = y - 1;
    if (d.hasPrevYear) {
      doc.setFillColor(...redPrev); doc.rect(lx, ly - 2.6, 3, 3, 'F');
      doc.setTextColor(...gray); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
      doc.text('Last year', lx + 4.5, ly); lx += 27;
    }
    doc.setFillColor(...redCur); doc.rect(lx, ly - 2.6, 3, 3, 'F');
    doc.setTextColor(...gray); doc.setFontSize(7.5); doc.text('This year', lx + 4.5, ly);
    y += 3;
    const baseY = y + chartH;
    const maxV = Math.max(...d.trend.map((t) => Math.max(t.current, t.prev ?? 0)), 1);
    const groupW = CW / d.trend.length;
    const barW = d.hasPrevYear ? Math.min(4.4, groupW / 3) : Math.min(6, groupW / 2);
    const ig = 1.2;
    doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.2); doc.line(ML, baseY, PW - ML, baseY);
    d.trend.forEach((t, i) => {
      const cx = ML + i * groupW + groupW / 2;
      const curH = (t.current / maxV) * chartH;
      if (d.hasPrevYear && t.prev != null) {
        const prevH = (t.prev / maxV) * chartH;
        doc.setFillColor(...redPrev); doc.rect(cx - barW - ig / 2, baseY - prevH, barW, prevH, 'F');
        doc.setFillColor(...redCur); doc.rect(cx + ig / 2, baseY - curH, barW, curH, 'F');
      } else {
        doc.setFillColor(...redCur); doc.rect(cx - barW / 2, baseY - curH, barW, curH, 'F');
      }
      doc.setTextColor(...gray); doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
      doc.text(t.label, cx, baseY + 4, { align: 'center' });
    });
    y = baseY + 11;
  }

  // Demographics (2 x 2)
  if (opts.includeCharts) {
    sectionTitle('Lead Demographics');
    const pw2 = (CW - gap) / 2, rowH = 6;
    for (let i = 0; i < d.demographics.length; i += 2) {
      const pair = d.demographics.slice(i, i + 2);
      const maxRows = Math.max(...pair.map((p) => Math.min(4, p.rows.length)), 1);
      const panelH = 9 + maxRows * rowH;
      ensure(panelH + 3);
      const top = y;
      pair.forEach((p, j) => {
        const x = ML + j * (pw2 + gap);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...dark);
        doc.text(p.title, x, top + 4);
        const max = p.rows.length ? (p.rows[0].percentage || 1) : 1;
        let ry = top + 10;
        p.rows.slice(0, 4).forEach((r, k) => {
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...gray);
          doc.text(r.name.length > 16 ? r.name.slice(0, 15) + '…' : r.name, x, ry + 1.5);
          const trackX = x + 30, trackW = pw2 - 30 - 13;
          doc.setFillColor(...track); doc.roundedRect(trackX, ry - 1, trackW, 2.4, 1, 1, 'F');
          doc.setFillColor(...(k === 0 ? brand : slate));
          doc.roundedRect(trackX, ry - 1, Math.max(1.5, (r.percentage / max) * trackW), 2.4, 1, 1, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...dark);
          doc.text(`${r.percentage}%`, x + pw2, ry + 1.5, { align: 'right' });
          ry += rowH;
        });
      });
      y = top + panelH + 3;
    }
  }

  // Conversion
  if (opts.includeCharts) {
    sectionTitle('Conversion');
    ensure(14);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...gray);
    doc.text(`${d.conversion.sent.toLocaleString()} sent · ${d.conversion.accepted.toLocaleString()} accepted (${d.conversion.acceptedPct}%)`, ML, y);
    y += 3;
    doc.setFillColor(...track); doc.roundedRect(ML, y, CW, 5, 2, 2, 'F');
    doc.setFillColor(...green); doc.roundedRect(ML, y, Math.max(2, (d.conversion.acceptedPct / 100) * CW), 5, 2, 2, 'F');
    y += 11;
  }

  // Data tables
  if (opts.includeData) {
    sectionTitle('Data — billable by month');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...gray);
    ensure(6);
    doc.text('MONTH', ML, y); doc.text('THIS YEAR', ML + 55, y, { align: 'right' });
    if (d.hasPrevYear) doc.text('LAST YEAR', ML + 95, y, { align: 'right' });
    y += 4;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...dark);
    d.trend.forEach((t) => {
      ensure(5);
      doc.text(t.label, ML, y);
      doc.text(`$${t.current.toLocaleString()}`, ML + 55, y, { align: 'right' });
      if (d.hasPrevYear && t.prev != null) doc.text(`$${t.prev.toLocaleString()}`, ML + 95, y, { align: 'right' });
      y += 4.5;
    });
  }

  // Footer + page numbers on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3); doc.line(ML, 287, PW - ML, 287);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...gray);
    doc.text('Powered by Datamatics', ML, 292);
    doc.text(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), PW / 2, 292, { align: 'center' });
    doc.text(`Page ${p} of ${pages}`, PW - ML, 292, { align: 'right' });
  }

  doc.save(`${fileStamp(d.clientName)}.pdf`);
}

export function exportReportsCSV(d: ReportsPDFData) {
  const L: string[] = [];
  L.push(['Reports & Analytics', d.clientName, `as of ${d.asOf}`].map(csvCell).join(','));
  L.push(['Scope', d.scope, d.campaignLabel].map(csvCell).join(','));
  L.push('');
  L.push('Key Metrics');
  L.push(['Metric', 'Value', 'Change'].map(csvCell).join(','));
  d.kpis.forEach((k) => L.push([k.label, k.value, k.delta || ''].map(csvCell).join(',')));
  L.push('');
  L.push('Pacing');
  L.push(['Delivered', 'Target', 'Percent', 'Status'].map(csvCell).join(','));
  L.push([d.pacing.delivered, d.pacing.target, `${d.pacing.pct}%`, d.pacing.onTrack ? 'On track' : 'Behind pace'].map(csvCell).join(','));
  L.push('');
  L.push('Billing Trend');
  L.push(['Month', 'This Year', d.hasPrevYear ? 'Last Year' : ''].map(csvCell).join(','));
  d.trend.forEach((t) => L.push([t.label, t.current, d.hasPrevYear ? (t.prev ?? '') : ''].map(csvCell).join(',')));
  L.push('');
  d.demographics.forEach((p) => {
    L.push(csvCell(p.title));
    L.push(['Segment', 'Percentage'].map(csvCell).join(','));
    p.rows.forEach((r) => L.push([r.name, `${r.percentage}%`].map(csvCell).join(',')));
    L.push('');
  });
  L.push('Conversion');
  L.push(['Sent', 'Accepted', 'Accepted %', 'Not Accepted %'].map(csvCell).join(','));
  L.push([d.conversion.sent, d.conversion.accepted, `${d.conversion.acceptedPct}%`, `${d.conversion.rejectedPct}%`].map(csvCell).join(','));
  downloadFile(L.join('\n'), `${fileStamp(d.clientName)}.csv`, 'text/csv');
}

export async function exportReportsXLSX(d: ReportsPDFData) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([['Metric', 'Value', 'Change'], ...d.kpis.map((k) => [k.label, k.value, k.delta || ''])]),
    'Key Metrics',
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([['Month', 'This Year', 'Last Year'], ...d.trend.map((t) => [t.label, t.current, d.hasPrevYear ? (t.prev ?? '') : ''])]),
    'Billable Trend',
  );
  const demo: any[] = [];
  d.demographics.forEach((p) => { demo.push([p.title]); demo.push(['Segment', '%']); p.rows.forEach((r) => demo.push([r.name, r.percentage])); demo.push([]); });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(demo), 'Demographics');
  XLSX.writeFile(wb, `${fileStamp(d.clientName)}.xlsx`);
}
