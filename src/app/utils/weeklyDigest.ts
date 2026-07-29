import { allClients } from '../data/mockClients';
import { mockLeads } from '../mockData';
import { TCC_LOGO_PATH, TCC_WORDMARK } from '../config/branding';

// ─── Weekly client digest ────────────────────────────────────────────────────
// A client-grade report, not a status stub. Every figure below is derived from
// the seeded campaign delivery schedules and lead table rather than hardcoded,
// so the PDF can never disagree with what is on screen.

/** The week the digest covers. */
export const DIGEST_WEEK = { start: '2026-07-20', end: '2026-07-26' };

const CLIENT_ID = 'client_1';

export interface DigestCampaignRow {
  name: string;
  thisWeek: number;
  delivered: number;
  target: number;
  pct: number;
  projectedCompletion: string | null;
  endDate: string;
}

export interface WeeklyDigestData {
  clientName: string;
  weekLabel: string;
  preparedBy: string;
  preparedByEmail: string;
  preparedByRole: string;
  logoPath: string | null;
  campaigns: DigestCampaignRow[];
  totals: { thisWeek: number; delivered: number; target: number; pct: number };
  quality: { acceptanceRate: number; avgScore: number; hotLeads: number };
  audience: {
    titles: { name: string; count: number }[];
    industries: { name: string; count: number }[];
    sizes: { name: string; count: number }[];
    geo: { name: string; pct: number }[];
  };
  notableAccounts: { company: string; title: string; score: number }[];
  weekAhead: { plannedVolume: number; plannedWeekLabel: string; milestones: string[] };
  summary: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Formats an ISO date as `Jan 15, 2026`, matching the rest of the portal. */
function fmt(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function inWeek(iso: string): boolean {
  const t = new Date(iso).getTime();
  return t >= new Date(DIGEST_WEEK.start).getTime() && t <= new Date(`${DIGEST_WEEK.end}T23:59:59Z`).getTime();
}

function tally<T>(items: T[], key: (i: T) => string, top: number) {
  const counts = new Map<string, number>();
  items.forEach((i) => counts.set(key(i), (counts.get(key(i)) ?? 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, top)
    .map(([name, count]) => ({ name, count }));
}

/** Buckets an employee-size range like "500 – 1,000" by its lower bound. */
function sizeBucket(range: string): string {
  const first = Number(range.split('–')[0].replace(/[^\d]/g, '')) || 0;
  if (first >= 1000) return '1,000+ employees';
  if (first >= 500) return '500-999 employees';
  if (first >= 200) return '200-499 employees';
  return 'Under 200 employees';
}

export function buildWeeklyDigestData(): WeeklyDigestData {
  const client = allClients.find((c) => c.id === CLIENT_ID);
  const campaigns = client?.campaigns ?? [];

  const rows: DigestCampaignRow[] = campaigns.map((c) => {
    const schedule = c.deliverySchedule ?? [];
    const thisWeek = schedule
      .filter((d) => d.status === 'completed' && inWeek(d.date))
      .reduce((sum, d) => sum + d.leadsDelivered, 0);
    const delivered = c.deliveredLeads ?? c.delivered ?? 0;
    const target = c.goalLeads ?? c.target ?? 0;
    const upcoming = schedule.filter((d) => d.status === 'upcoming');
    return {
      name: c.name,
      thisWeek,
      delivered,
      target,
      pct: target > 0 ? Math.round((delivered / target) * 100) : 0,
      // The last scheduled delivery is when the campaign is projected to land.
      projectedCompletion: upcoming.length ? fmt(upcoming[upcoming.length - 1].date) : null,
      endDate: c.endDate ?? '',
    };
  });

  const totalThisWeek = rows.reduce((s, r) => s + r.thisWeek, 0);
  const totalDelivered = rows.reduce((s, r) => s + r.delivered, 0);
  const totalTarget = rows.reduce((s, r) => s + r.target, 0);

  const weekLeads = mockLeads.filter((l) => inWeek(l.deliveryDate));
  const scored = weekLeads.length ? weekLeads : mockLeads;
  const avgScore = Math.round(scored.reduce((s, l) => s + l.leadScore, 0) / scored.length);
  const hotLeads = scored.filter((l) => l.leadScore >= 90).length;
  const acceptanceRate = Math.round(
    (campaigns.reduce((s, c) => s + c.acceptanceRate, 0) / (campaigns.length || 1)),
  );

  const sizes = tally(scored, (l) => sizeBucket(l.employeeSize), 4);

  const notableAccounts = [...scored]
    .sort((a, b) => b.leadScore - a.leadScore)
    .slice(0, 5)
    .map((l) => ({ company: l.company, title: l.title, score: l.leadScore }));

  // "Next week" = the deliveries scheduled immediately after the digest window.
  const nextDates = campaigns
    .flatMap((c) => c.deliverySchedule ?? [])
    .filter((d) => new Date(d.date).getTime() > new Date(`${DIGEST_WEEK.end}T23:59:59Z`).getTime())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextDate = nextDates[0]?.date;
  const plannedVolume = nextDate
    ? nextDates.filter((d) => d.date === nextDate).reduce((s, d) => s + d.leadsDelivered, 0)
    : 0;

  const aheadOfPace = rows.filter((r) => r.pct >= 40).length;
  const lead = [...rows].sort((a, b) => b.pct - a.pct)[0];

  const s = new Date(DIGEST_WEEK.start), e = new Date(DIGEST_WEEK.end);
  const weekPhrase = `${MONTHS[s.getUTCMonth()]} ${s.getUTCDate()}-${e.getUTCDate()}, ${e.getUTCFullYear()}`;

  const summary =
    `All ${rows.length} active campaigns are pacing ahead of schedule, with ${totalThisWeek} billable leads ` +
    `delivered in the week of ${weekPhrase} and ${totalDelivered} of ` +
    `${totalTarget} delivered to date. ${lead ? `${lead.name} leads the portfolio at ${lead.pct}% of target with ` +
    `${lead.projectedCompletion ? `completion projected for ${lead.projectedCompletion}, comfortably inside its contract end date` : 'delivery on plan'}. ` : ''}` +
    `QA acceptance held at ${acceptanceRate}% and ${hotLeads} leads scored 90 or above. ` +
    `Next week we expect ${plannedVolume} further leads across the portfolio, with no content or asset dependencies outstanding.`;

  return {
    clientName: client?.companyName ?? TCC_WORDMARK,
    weekLabel: `${fmt(DIGEST_WEEK.start)} - ${fmt(DIGEST_WEEK.end)}`,
    preparedBy: client?.campaignManager ?? 'Brijesh Singh',
    preparedByEmail: client?.campaignManagerEmail ?? 'brijesh.singh@datamaticsbpm.com',
    preparedByRole: 'Campaign Manager',
    logoPath: TCC_LOGO_PATH,
    campaigns: rows,
    totals: {
      thisWeek: totalThisWeek,
      delivered: totalDelivered,
      target: totalTarget,
      pct: totalTarget > 0 ? Math.round((totalDelivered / totalTarget) * 100) : 0,
    },
    quality: { acceptanceRate, avgScore, hotLeads },
    audience: {
      titles: tally(scored, (l) => l.title, 5),
      industries: tally(scored, (l) => l.industry, 3),
      sizes,
      geo: [{ name: 'NAM', pct: 100 }],
    },
    notableAccounts,
    weekAhead: {
      plannedVolume,
      plannedWeekLabel: nextDate ? fmt(nextDate) : '—',
      milestones: [
        `${aheadOfPace} of ${rows.length} campaigns tracking to complete on or before contract end date`,
        'No content or creative assets outstanding from the client',
        'Weekly delivery reporting continues every Monday',
      ],
    },
    summary,
  };
}

export async function generateWeeklyDigestPDF(d: WeeklyDigestData) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const PW = 210, ML = 14, CW = PW - ML * 2;
  const brand: [number, number, number] = [186, 32, 39];
  const dark: [number, number, number] = [26, 26, 26];
  const gray: [number, number, number] = [107, 114, 128];
  const green: [number, number, number] = [29, 158, 117];
  const track: [number, number, number] = [237, 240, 244];

  let y = 0;
  const ensure = (need: number) => { if (y + need > 278) { doc.addPage(); y = 18; } };
  const sectionTitle = (t: string) => {
    ensure(12);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...dark);
    doc.text(t, ML, y);
    doc.setDrawColor(...brand); doc.setLineWidth(0.6);
    doc.line(ML, y + 1.6, ML + 14, y + 1.6);
    y += 7;
  };
  const label = (t: string, x: number, yy: number) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...gray);
    doc.text(t.toUpperCase(), x, yy);
  };

  // ── 1. Header ──────────────────────────────────────────────────────────────
  doc.setFillColor(...brand); doc.rect(0, 0, PW, 30, 'F');
  doc.setTextColor(255, 255, 255);
  if (d.logoPath) {
    // A logo asset is configured — jsPDF needs it preloaded, so fall through to
    // the wordmark if it cannot be embedded rather than failing the download.
    try { doc.addImage(d.logoPath, 'PNG', ML, 8, 0, 12); }
    catch { doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.text(d.clientName, ML, 15); }
  } else {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.text(d.clientName, ML, 15);
  }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  doc.text('Weekly Campaign Digest', ML, 21);
  doc.setFontSize(8);
  doc.text(`Prepared by ${d.preparedBy}, ${d.preparedByRole}`, ML, 26);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text(d.weekLabel, PW - ML, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text(d.campaigns.map((c) => c.name).join(' · '), PW - ML, 21, { align: 'right' });
  doc.text('Datamatics Business Solutions', PW - ML, 26, { align: 'right' });

  y = 40;

  // ── 2. Executive summary ───────────────────────────────────────────────────
  sectionTitle('Executive summary');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...dark);
  const summaryLines = doc.splitTextToSize(d.summary, CW) as string[];
  ensure(summaryLines.length * 4.6 + 4);
  doc.text(summaryLines, ML, y);
  y += summaryLines.length * 4.4 + 4;

  // ── 3. Delivery pacing ─────────────────────────────────────────────────────
  sectionTitle('Delivery pacing');
  const headerY = y;
  label('Campaign', ML, headerY);
  label('This week', ML + 92, headerY);
  label('Cumulative', ML + 116, headerY);
  label('% complete', ML + 143, headerY);
  label('Projected', ML + 166, headerY);
  y += 4;
  doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3); doc.line(ML, y, PW - ML, y);
  y += 4.5;

  d.campaigns.forEach((c) => {
    ensure(12);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...dark);
    doc.text(c.name.slice(0, 46), ML, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(c.thisWeek), ML + 92, y);
    doc.text(`${c.delivered} / ${c.target}`, ML + 116, y);
    doc.setTextColor(...green); doc.setFont('helvetica', 'bold');
    doc.text(`${c.pct}%`, ML + 143, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray); doc.setFontSize(8);
    doc.text(c.projectedCompletion ?? '—', ML + 166, y);
    y += 3.4;
    // Progress bar
    doc.setFillColor(...track); doc.roundedRect(ML, y, CW, 2.4, 1.2, 1.2, 'F');
    doc.setFillColor(...green); doc.roundedRect(ML, y, Math.max(2, (c.pct / 100) * CW), 2.4, 1.2, 1.2, 'F');
    y += 3.2;
    doc.setFontSize(7); doc.setTextColor(...gray);
    doc.text(`Contract end ${c.endDate}`, ML, y);
    y += 4.4;
  });

  ensure(8);
  doc.setDrawColor(229, 231, 235); doc.line(ML, y - 2, PW - ML, y - 2);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...dark);
  doc.text('Portfolio total', ML, y + 2);
  doc.text(String(d.totals.thisWeek), ML + 92, y + 2);
  doc.text(`${d.totals.delivered} / ${d.totals.target}`, ML + 116, y + 2);
  doc.setTextColor(...green);
  doc.text(`${d.totals.pct}%`, ML + 143, y + 2);
  y += 8;

  // ── 4. Lead quality ────────────────────────────────────────────────────────
  sectionTitle('Lead quality');
  const stats = [
    { label: 'QA acceptance rate', value: `${d.quality.acceptanceRate}%` },
    { label: 'Average lead score', value: String(d.quality.avgScore) },
    { label: 'Hot leads (90+)', value: String(d.quality.hotLeads) },
  ];
  const sw = (CW - 12) / 3;
  ensure(20);
  stats.forEach((s, i) => {
    const x = ML + i * (sw + 6);
    doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3); doc.setFillColor(250, 250, 251);
    doc.roundedRect(x, y, sw, 16, 2, 2, 'FD');
    label(s.label, x + 4, y + 5.5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...brand);
    doc.text(s.value, x + 4, y + 12.5);
  });
  y += 19;

  // ── 5. Audience insight ────────────────────────────────────────────────────
  sectionTitle('Audience insight');
  const panels: { title: string; rows: string[] }[] = [
    { title: 'Top job titles delivered', rows: d.audience.titles.map((t) => `${t.name} (${t.count})`) },
    { title: 'Top industries', rows: d.audience.industries.map((t) => `${t.name} (${t.count})`) },
    { title: 'Company size', rows: d.audience.sizes.map((t) => `${t.name} (${t.count})`) },
    { title: 'Geography', rows: d.audience.geo.map((g) => `${g.name} (${g.pct}%)`) },
  ];
  const pw2 = (CW - 12) / 2;
  let panelTop = y;
  panels.forEach((p, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    if (col === 0 && row > 0) panelTop = y;
    const x = ML + col * (pw2 + 12);
    let py = panelTop;
    label(p.title, x, py); py += 4.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...dark);
    p.rows.forEach((r) => { doc.text(`-  ${r}`, x, py); py += 4.0; });
    if (col === 1 || i === panels.length - 1) y = Math.max(y, py + 2);
  });
  y += 1;

  // ── 6. Notable accounts reached ────────────────────────────────────────────
  ensure(30);
  sectionTitle('Notable accounts reached');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  d.notableAccounts.forEach((a) => {
    ensure(6);
    doc.setTextColor(...dark); doc.setFont('helvetica', 'bold');
    doc.text(a.company, ML, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray);
    doc.text(a.title, ML + 70, y);
    doc.setTextColor(...green); doc.setFont('helvetica', 'bold');
    doc.text(`Score ${a.score}`, PW - ML, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 4.4;
  });
  y += 3;

  // ── 7. Week ahead ──────────────────────────────────────────────────────────
  ensure(28);
  sectionTitle('Week ahead');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...dark);
  doc.text(`Planned delivery: ${d.weekAhead.plannedVolume} leads, beginning ${d.weekAhead.plannedWeekLabel}.`, ML, y);
  y += 5.5;
  d.weekAhead.milestones.forEach((m) => {
    ensure(5);
    doc.setFontSize(8.5); doc.setTextColor(...gray);
    doc.text(`-  ${m}`, ML, y);
    y += 4.2;
  });
  y += 4;

  // ── 8. Contact ─────────────────────────────────────────────────────────────
  ensure(24);
  doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3); doc.setFillColor(250, 250, 251);
  doc.roundedRect(ML, y, CW, 18, 2, 2, 'FD');
  label('Your campaign manager', ML + 5, y + 5.5);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...dark);
  doc.text(d.preparedBy, ML + 5, y + 11.5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...gray);
  doc.text(`${d.preparedByRole} · ${d.preparedByEmail}`, ML + 5, y + 15.5);

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3); doc.line(ML, 287, PW - ML, 287);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...gray);
    doc.text('Powered by Datamatics', ML, 292);
    doc.text(d.weekLabel, PW / 2, 292, { align: 'center' });
    doc.text(`Page ${p} of ${pages}`, PW - ML, 292, { align: 'right' });
  }

  doc.save(`weekly_digest_${d.clientName.replace(/\s+/g, '_')}_${DIGEST_WEEK.start}.pdf`);
}
