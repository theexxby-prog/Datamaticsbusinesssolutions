import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { IntroShowcase, shouldShowIntro, markIntroSeen } from '../components/IntroShowcase';
import { EmailDigestModal } from '../components/EmailDigestModal';
import {
  CheckCircle2, FileText, Layers, Users, TrendingUp,
  AlertCircle, FilePenLine, Clock, MessageSquare, FolderOpen,
  Activity, BarChart3, ArrowUpRight, PauseCircle,
} from 'lucide-react';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { AccountTeam } from '../components/AccountTeam';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getAccountTeam, allClients } from '../data/mockClients';
import { useAuth } from '../context/AuthContext';
import { mockInvoiceRecords } from '../data/mockInvoiceRecords';
import { mockJobCards } from '../data/mockJobCards';
import { PersonAvatar } from '../components/PersonAvatar';
import { getPersonPhoto } from '../data/personPhotos';
import { getDashPrefs, subscribeDashPrefs, type DashPrefs } from '../data/dashboardPrefs';
import { formatDateShort } from '../utils/formatDate';
import { showFutureModules } from '../config/demo';
import UnionDashboard from './UnionDashboard';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatBusinessValue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${Math.round(value).toLocaleString()}`;
}
// ─────────────────────────────────────────────────────────────────────────────

// The UNION preview login gets the reimagined compact dashboard; everyone
// else keeps this page exactly as it is. Split into two components so each
// owns its hooks (no conditional hook order).
export default function HomePage() {
  const { currentUser } = useAuth();
  return showFutureModules(currentUser) ? <UnionDashboard /> : <StandardHomePage />;
}

function StandardHomePage() {
  useDocumentTitle('Dashboard');

  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const accountTeam = getAccountTeam('client_1');
  const tccClient = allClients.find(c => c.id === 'client_1');

  // ── Email digest modal ──────────────────────────────────────────────────────
  const [showDigest, setShowDigest] = useState(false);

  // ── Client-controlled KPI visibility (reflows the 4-card row) ────────────────
  const [prefs, setPrefs] = useState<DashPrefs>(getDashPrefs);
  useEffect(() => subscribeDashPrefs(() => setPrefs(getDashPrefs())), []);

  // First-load showcase — plays Design's animation over the dashboard, then reveals it
  // Intro disabled for now (per Vishal, Jul 8) — flip back to useState(shouldShowIntro) to re-enable.
  const [showIntro, setShowIntro] = useState(false);

  // ── Business period toggle ──────────────────────────────────────────────────
  const [bizPeriod, setBizPeriod] = useState<'month' | 'year'>('month');

  // ── Leads period toggle ─────────────────────────────────────────────────────
  const [leadsPeriod, setLeadsPeriod] = useState<'month' | 'year'>('month');

  // ── Leads values — derived from the client's seeded campaigns ──────────────
  const leadsThisMonth = useMemo(
    () => (tccClient?.campaigns ?? []).reduce((sum, c) => sum + (c.leadsThisMonth ?? 0), 0),
    [tccClient],
  );
  const leadsThisYear = useMemo(
    () => (tccClient?.campaigns ?? []).reduce((sum, c) => sum + (c.deliveredLeads ?? c.totalLeads ?? 0), 0),
    [tccClient],
  );
  const leadsValue = leadsPeriod === 'month' ? leadsThisMonth : leadsThisYear;
  const leadsTrend = leadsPeriod === 'month' ? '+12%' : '+18%';
  const leadsLabel = leadsPeriod === 'month' ? 'This month' : 'Year to date';

  // ── Campaign stats ──────────────────────────────────────────────────────────
  const campaignStats = useMemo(() => {
    const camps = tccClient?.campaigns ?? [];
    return {
      total: camps.length,
      live: camps.filter(c => c.status === 'active').length,
      pendingApproval: camps.filter(c => c.status === 'pending_approval').length,
      paused: camps.filter(c => c.status === 'paused').length,
      completed: camps.filter(c => c.status === 'completed').length,
    };
  }, [tccClient]);

  // ── Total Business: what has actually been invoiced ────────────────────────
  // Derived from the issued invoices rather than recomputed from campaign
  // budgets, so this card and the Invoices page can never disagree.
  const businessData = useMemo(() => {
    const mine = mockInvoiceRecords.filter((i) => i.clientId === 'client_1');
    const thisMonth = new Date().toISOString().slice(0, 7);
    return {
      monthly: mine.filter((i) => (i.issueDate ?? '').startsWith(thisMonth)).reduce((s, i) => s + i.total, 0),
      yearly: mine.reduce((s, i) => s + i.total, 0),
      monthlyTrend: '+8.4%', yearlyTrend: '+21.2%',
    };
  }, []);

  const bizValue = bizPeriod === 'month' ? businessData.monthly : businessData.yearly;
  const bizTrend = bizPeriod === 'month' ? businessData.monthlyTrend : businessData.yearlyTrend;
  const bizLabel = bizPeriod === 'month' ? 'This month' : 'Year to date';

  // ── Derived ─────────────────────────────────────────────────────────────────
  const greeting = useMemo(() => getGreeting(), []);
  const formattedDate = useMemo(() => getFormattedDate(), []);
  const initials = useMemo(() => getInitials(currentUser?.name ?? ''), [currentUser?.name]);

  // ── Live state from the Invoices + Documents modules (shared mock data) ─────
  const myInvoices = mockInvoiceRecords.filter((i) => i.clientCompany === currentUser?.company);
  const overdueInvoices = myInvoices.filter((i) => i.stage === 'overdue');
  const dueInvoices = myInvoices.filter((i) => i.stage === 'sent');
  const dueTotal = dueInvoices.reduce((sum, i) => sum + i.total, 0);
  const pendingSignatures = mockJobCards.filter(
    (c) => c.clientCompany === currentUser?.company && c.type === 'client_signature' && c.stage === 'sent_for_signature',
  );
  const topOverdue = overdueInvoices[0];
  const topSignature = pendingSignatures[0];
  const overdueDays = topOverdue?.dueDate
    ? Math.max(1, Math.floor((Date.now() - new Date(topOverdue.dueDate).getTime()) / 86400000))
    : 0;
  const fmtShortDate = (iso?: string) => formatDateShort(iso);

  // ── Campaign Snapshot — derived from the seeded campaigns ──────────────────
  const campaignSnapshot = useMemo(() => (tccClient?.campaigns ?? []).map((c) => {
    const target = c.goalLeads ?? c.target ?? 0;
    const delivered = c.deliveredLeads ?? c.delivered ?? 0;
    return {
      id: c.id,
      name: c.name,
      status: c.status === 'active' ? 'Live' : c.status === 'completed' ? 'Completed' : 'Scheduled',
      statusCls: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
      progress: target > 0 ? Math.round((delivered / target) * 100) : 0,
      done: `${delivered.toLocaleString('en-US')} / ${target.toLocaleString('en-US')}`,
    };
  }), [tccClient]);

  // ── Recent Activity — mirrors the current module data ───────────────────────
  const latestDue = dueInvoices[0];
  const latestPaid = myInvoices.filter((i) => i.stage === 'paid')[0];
  const leadCampaign = campaignSnapshot[0];
  const recentActivity = [
    ...(latestDue ? [{
      id: 1, icon: FileText,
      text: `Invoice ${latestDue.invoiceNumber} issued for $${latestDue.total.toLocaleString('en-US')} — due ${fmtShortDate(latestDue.dueDate)}`,
      time: '1 hour ago', color: 'var(--color-text-secondary)',
    }] : []),
    ...(topSignature ? [{
      id: 2, icon: FilePenLine,
      text: `Job card ${topSignature.id} (${topSignature.campaignName}) sent for your signature`,
      time: '3 hours ago', color: 'var(--color-warning)',
    }] : []),
    { id: 3, icon: Users, text: 'New lead delivered: Marcus Whitfield – IT Director, Summit Managed Services', time: '5 hours ago', color: 'var(--color-accent-purple)' },
    ...(leadCampaign ? [{
      id: 4, icon: Layers,
      text: `${leadCampaign.name} campaign reached ${leadCampaign.progress}% completion`,
      time: 'Yesterday', color: 'var(--color-info)',
    }] : []),
    ...(latestPaid ? [{
      id: 5, icon: CheckCircle2,
      text: `Payment received for ${latestPaid.invoiceNumber} — $${latestPaid.total.toLocaleString('en-US')}, receipt on file`,
      time: '2 weeks ago', color: 'var(--color-success)',
    }] : []),
  ];

  // ── Needs Attention — derived from the Invoices + Documents modules ─────────
  const needsAttention = [
    ...(topOverdue ? [{
      id: 1, type: 'error' as const, icon: AlertCircle,
      title: 'Overdue invoice',
      text: `${topOverdue.invoiceNumber} is overdue by ${overdueDays} days — $${topOverdue.total.toLocaleString('en-US')} outstanding`,
      cta: 'View invoice', action: () => navigate('/invoices'),
    }] : []),
    ...(topSignature ? [{
      id: 2, type: 'warning' as const, icon: FilePenLine,
      title: 'Signature required',
      text: `Job card ${topSignature.id} (${topSignature.campaignName}) is awaiting your signature before the campaign can go live`,
      cta: 'Sign Now', action: () => navigate('/documents'),
    }] : []),
    ...(dueInvoices.length > 0 ? [{
      id: 3, type: 'warning' as const, icon: Clock,
      title: `${dueInvoices.length} invoice${dueInvoices.length === 1 ? '' : 's'} due`,
      text: `$${dueTotal.toLocaleString('en-US')} due by ${fmtShortDate(dueInvoices[0].dueDate)} — pay from the portal in one click`,
      cta: 'View Invoices', action: () => navigate('/invoices'),
    }] : []),
    {
      id: 4, type: 'info' as const, icon: MessageSquare,
      title: 'Open support ticket',
      text: 'TKT-001 · Additional lead qualification fields on Lenovo Intel FIFA AI — In Progress',
      cta: 'View Ticket', action: () => navigate('/support'),
    },
  ];

  // ── Colour helpers for attention items ─────────────────────────────────────
  function attentionColors(type: 'error' | 'warning' | 'info') {
    if (type === 'error')   return { border: 'var(--color-error)', bg: 'rgba(255,59,48,0.05)',   pill: 'rgba(255,59,48,0.12)',   text: 'var(--color-error)' };
    if (type === 'warning') return { border: 'var(--color-warning)', bg: 'rgba(245,158,11,0.05)',  pill: 'rgba(245,158,11,0.12)',  text: 'var(--color-warning)' };
    return                         { border: 'var(--color-text-secondary)', bg: 'rgba(107,114,128,0.05)', pill: 'rgba(107,114,128,0.12)', text: 'var(--color-text-secondary)' };
  }

  return (
    <>
      <div className="max-w-[1600px] mx-auto page-content space-y-5">

        {/* ── Welcome Banner ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-2xl px-6 py-4"
          style={{
            background: 'var(--color-surface-raised)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          }}
        >
          <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 55% 80% at 100% 0%, rgba(186,32,39,0.06) 0%, transparent 70%)' }} />
          <div className="pointer-events-none absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle, var(--color-primary) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 select-none"
                style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 14px rgba(186,32,39,0.28)', color: '#fff', fontSize: '15px', fontWeight: 700 }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    {greeting}, {currentUser?.name?.split(' ')[0]}
                  </span>
                  <span className="relative flex h-2 w-2 mt-px flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: 'var(--color-primary)' }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--color-primary)' }} />
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{currentUser?.company ?? 'Datamatics Business Solutions'}</span>
                  <span style={{ color: 'var(--color-text-muted)' }} aria-hidden="true">·</span>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{formattedDate}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowDigest(true)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-sm transition-colors w-full sm:w-auto justify-center"
              style={{ background: 'var(--color-primary)', boxShadow: '0 2px 8px rgba(186,32,39,0.25)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-primary-dark)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-primary)')}
            >
              📊 Weekly Digest
            </button>
          </div>
        </motion.div>

        {/* ── Page-level Month/Year control — mobile only. On desktop each
            tile keeps its own toggle; on a phone one control drives both
            period-aware tiles and the per-tile toggles are hidden. ── */}
        <div className="md:hidden flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Overview
          </span>
          <div className="flex gap-1 rounded-lg p-0.5" style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>
            {(['month', 'year'] as const).map(p => {
              const active = leadsPeriod === p && bizPeriod === p;
              return (
                <button
                  key={p}
                  onClick={() => { setLeadsPeriod(p); setBizPeriod(p); }}
                  className={`min-h-[32px] rounded-md px-3 transition-all ${active ? 'bg-[var(--color-primary-solid)] text-white shadow-sm' : 'text-[var(--color-text-secondary)]'}`}
                  style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                >
                  {p === 'month' ? 'Month' : 'Year'}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── KPI Row: horizontal snap-scroll on phones, grid from md up ── */}
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-3 md:overflow-visible md:px-0 md:pb-0">

          {/* 1 — Total Leads This Month */}
          {prefs.totalLeads && (
          <motion.div
            className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-[var(--color-surface-raised)] backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.04)] min-w-[78%] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink"
            whileHover={{ y: -3, boxShadow: '0 16px 48px rgba(0,0,0,0.08)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-success)]/10 via-transparent to-transparent opacity-60" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Total Leads</p>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-success)]/20 to-[#34D399]/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-[var(--color-success)]" />
                </div>
              </div>
              {/* Month / Year toggle — desktop only; the page-level control drives mobile */}
              <div className="hidden md:flex gap-1 mb-3 bg-[var(--color-surface-raised)] p-0.5 rounded-lg" style={{ width: 'fit-content' }}>
                {(['month', 'year'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setLeadsPeriod(p)}
                    className={`px-2.5 py-1 rounded-md transition-all ${leadsPeriod === p ? 'bg-[var(--color-primary-solid)] text-white shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'}`}
                    style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  >
                    {p === 'month' ? 'Month' : 'Year'}
                  </button>
                ))}
              </div>
              <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 mb-1">
                <span className="font-bold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(20px, 5vw, 32px)', lineHeight: 1 }}>
                  <AnimatedNumber value={leadsValue} />
                </span>
                <span className="text-sm font-semibold text-[var(--color-success)]">{leadsTrend}</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">{leadsLabel}</p>
            </div>
          </motion.div>
          )}

          {/* 2 — Total Business */}
          {prefs.totalBusiness && (
          <motion.div
            className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-[var(--color-surface-raised)] backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.04)] min-w-[78%] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink"
            whileHover={{ y: -3, boxShadow: '0 16px 48px rgba(0,0,0,0.08)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-purple)]/10 via-transparent to-transparent opacity-60" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Total Business</p>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-accent-purple)]/20 to-[#A78BFA]/10 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-[var(--color-accent-purple)]" />
                </div>
              </div>
              {/* Month / Year toggle — desktop only; the page-level control drives mobile */}
              <div className="hidden md:flex gap-1 mb-3 bg-[var(--color-surface-raised)] p-0.5 rounded-lg" style={{ width: 'fit-content' }}>
                {(['month', 'year'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setBizPeriod(p)}
                    className={`px-2.5 py-1 rounded-md transition-all ${bizPeriod === p ? 'bg-[var(--color-primary-solid)] text-white shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'}`}
                    style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  >
                    {p === 'month' ? 'Month' : 'Year'}
                  </button>
                ))}
              </div>
              <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 mb-1">
                <span className="font-bold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(20px, 5vw, 32px)', lineHeight: 1 }}>{formatBusinessValue(bizValue)}</span>
                <span className="text-sm font-semibold text-[var(--color-accent-purple)]">{bizTrend}</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] leading-snug">{bizLabel} · invoiced</p>
            </div>
          </motion.div>
          )}

          {/* 3 — Campaigns */}
          {prefs.campaigns && (
          <motion.div
            className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-[var(--color-surface-raised)] backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.04)] min-w-[78%] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink"
            whileHover={{ y: -3, boxShadow: '0 16px 48px rgba(0,0,0,0.08)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-info)]/10 via-transparent to-transparent opacity-60" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Campaigns</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(20px, 5vw, 32px)', lineHeight: 1 }}>
                      <AnimatedNumber value={campaignStats.total} />
                    </span>
                    <span className="text-sm text-[var(--color-text-secondary)]">total</span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-info)]/20 to-[#60A5FA]/10 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-4 h-4 text-[var(--color-info)]" />
                </div>
              </div>

              {/* Deep-link status rows — compact */}
              <div className="space-y-1.5 mt-1">
                <motion.button
                  onClick={() => navigate('/campaigns', { state: { statusFilter: 'In progress' } })}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg group"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)' }}
                  whileHover={{ background: 'rgba(16,185,129,0.11)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 bg-[var(--color-success)]" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-success)]" />
                    </span>
                    <span className="text-xs font-semibold text-[var(--color-success)]">Live</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-[var(--color-success)]">{campaignStats.live}</span>
                    <ArrowUpRight className="w-3 h-3 text-[var(--color-success)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.button>

                {campaignStats.pendingApproval > 0 && (
                  <motion.button
                    onClick={() => navigate('/campaigns', { state: { statusFilter: 'Pending Approval' } })}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg group"
                    style={{ background: 'rgba(186,32,39,0.05)', border: '1px solid rgba(186,32,39,0.14)' }}
                    whileHover={{ background: 'rgba(186,32,39,0.09)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: 'var(--color-primary)' }} />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: 'var(--color-primary)' }} />
                      </span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>Awaiting Approval</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>{campaignStats.pendingApproval}</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-primary)' }} />
                    </div>
                  </motion.button>
                )}

                {campaignStats.paused > 0 && (
                  <motion.button
                    onClick={() => navigate('/campaigns', { state: { statusFilter: 'Paused' } })}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg group"
                    style={{ background: 'rgba(107,114,128,0.06)', border: '1px solid rgba(107,114,128,0.14)' }}
                    whileHover={{ background: 'rgba(107,114,128,0.10)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-1.5">
                      <PauseCircle className="w-2 h-2 text-[var(--color-text-secondary)]" />
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Paused</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-[var(--color-text-secondary)]">{campaignStats.paused}</span>
                      <ArrowUpRight className="w-3 h-3 text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.button>
                )}

                <motion.button
                  onClick={() => navigate('/campaigns', { state: { statusFilter: 'Completed' } })}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg group"
                  style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)' }}
                  whileHover={{ background: 'rgba(59,130,246,0.09)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-2 h-2 text-[var(--color-info)]" />
                    <span className="text-xs font-semibold text-[var(--color-info)]">Completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-[var(--color-info)]">{campaignStats.completed}</span>
                    <ArrowUpRight className="w-3 h-3 text-[var(--color-info)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
          )}

          {/* 4 — Pending Invoices & Signatures */}
          {prefs.actionRequired && (
          <motion.div
            className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-[var(--color-surface-raised)] backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.04)] min-w-[78%] flex-shrink-0 snap-start md:min-w-0 md:flex-shrink"
            whileHover={{ y: -3, boxShadow: '0 16px 48px rgba(0,0,0,0.08)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-warning)]/10 via-transparent to-transparent opacity-60" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Action Required</p>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-warning)]/20 to-[var(--color-warning)]/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-[var(--color-warning)]" />
                </div>
              </div>

              {/* Invoice status — the whole tile follows the state, so an
                  account in good standing never renders a red "Overdue" label. */}
              <motion.button
                onClick={() => navigate('/invoices')}
                className="w-full flex items-center gap-3 p-3 rounded-xl mb-2 text-left group"
                style={topOverdue
                  ? { background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }
                  : { background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}
                whileHover={{ background: topOverdue ? 'rgba(239,68,68,0.09)' : 'rgba(16,185,129,0.09)' }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${topOverdue ? 'bg-[var(--color-error-bg)]' : 'bg-[var(--color-success-bg)]'}`}>
                  <FileText className={`w-4 h-4 ${topOverdue ? 'text-[var(--color-error)]' : 'text-[var(--color-success)]'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${topOverdue ? 'text-[var(--color-error)]' : 'text-[var(--color-success)]'}`}>
                    {topOverdue ? 'Overdue Invoice' : 'Invoices in good standing'}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">
                    {topOverdue
                      ? `${topOverdue.invoiceNumber} · $${topOverdue.total.toLocaleString('en-US')} due`
                      : latestDue
                        ? `${latestDue.invoiceNumber} · $${latestDue.total.toLocaleString('en-US')} due ${fmtShortDate(latestDue.dueDate)}`
                        : 'All invoices settled'}
                  </p>
                </div>
                <ArrowUpRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${topOverdue ? 'text-[var(--color-error)]/70' : 'text-[var(--color-success)]/70'}`} />
              </motion.button>

              {/* Awaiting signature */}
              <motion.button
                onClick={() => navigate('/documents')}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left group"
                style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}
                whileHover={{ background: 'rgba(245,158,11,0.09)' }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--color-warning-bg)] flex items-center justify-center flex-shrink-0">
                  <FilePenLine className="w-4 h-4 text-[var(--color-warning)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--color-warning)]">Signature Required</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">
                    {topSignature ? `${topSignature.id} · ${topSignature.campaignName}` : 'Nothing awaiting signature'}
                  </p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-warning)]/70 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </motion.button>
            </div>
          </motion.div>
          )}
        </div>

        {/* ── Recent Activity & Needs Attention ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Recent Activity */}
          <div className="rounded-2xl p-5 bg-[var(--color-surface-raised)] backdrop-blur-xl border border-white/20 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-3" style={{ fontSize: '17px', fontWeight: 600 }}>Recent Activity</h2>
            <div className="divide-y divide-black/[0.04]">
              {recentActivity.map(a => (
                <div key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-[var(--color-surface-raised)] rounded-xl px-2 -mx-2 transition-colors cursor-pointer">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${a.color}18` }}
                  >
                    <a.icon className="w-4 h-4" style={{ color: a.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--color-text-primary)]" style={{ fontSize: '13px', fontWeight: 400 }}>{a.text}</p>
                    <p className="text-[var(--color-text-muted)] mt-0.5" style={{ fontSize: '11px' }}>{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Needs Your Attention */}
          <div className="rounded-2xl p-5 bg-[var(--color-surface-raised)] backdrop-blur-xl border border-white/20 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-3" style={{ fontSize: '17px', fontWeight: 600 }}>Needs Your Attention</h2>
            <div className="space-y-2.5">
              {needsAttention.map(item => {
                const c = attentionColors(item.type);
                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ x: 2, boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}
                    transition={{ duration: 0.15 }}
                    onClick={item.action}
                    className="flex items-start gap-3 p-3.5 rounded-xl cursor-pointer"
                    style={{ borderLeft: `3px solid ${c.border}`, borderRadius: '12px', background: c.bg }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: c.pill }}
                    >
                      <item.icon className="w-3.5 h-3.5" style={{ color: c.border }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold" style={{ fontSize: '12px', color: c.text, marginBottom: '2px' }}>{item.title}</p>
                      <p className="text-[var(--color-text-secondary)] leading-snug" style={{ fontSize: '13px' }}>{item.text}</p>
                      <span
                        className="inline-flex items-center gap-0.5 mt-2 px-2 py-0.5 rounded-full"
                        style={{ background: c.pill, color: c.text, fontSize: '11px', fontWeight: 600 }}
                      >
                        {item.cta} ↗
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Campaign Snapshot ───────────────────────────────────────────── */}
        <div className="rounded-2xl p-5 bg-[var(--color-surface-raised)] backdrop-blur-xl border border-white/20 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: '17px', fontWeight: 600 }}>Campaign Snapshot</h2>
            <button
              onClick={() => navigate('/campaigns')}
              className="flex items-center gap-1 text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors font-semibold"
              style={{ fontSize: '13px', fontWeight: 600 }}
            >
              View all
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {campaignSnapshot.map(c => (
              <motion.div
                key={c.id}
                className="rounded-xl p-4 bg-[var(--color-surface-raised)] border border-[var(--color-border)] cursor-pointer"
                onClick={() => navigate(`/campaigns/${c.id}`)}
                whileHover={{ borderColor: 'rgba(186,32,39,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}
                transition={{ duration: 0.18 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-[var(--color-text-primary)] leading-snug flex-1 min-w-0 pr-2" style={{ fontSize: '13px' }}>{c.name}</h3>
                  <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.statusCls}`} style={{ fontSize: '11px' }}>
                    {c.status}
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar__fill" style={{ width: `${c.progress}%` }} />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[var(--color-text-muted)]" style={{ fontSize: '11px' }}>{c.done}</span>
                  <span className="text-[var(--color-text-muted)]" style={{ fontSize: '11px' }}>{c.progress}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Account Team ────────────────────────────────────────────────── */}
        {accountTeam && (
          <AccountTeam
            manager={{ name: accountTeam.manager.name, role: accountTeam.manager.role, email: accountTeam.manager.email, initials: accountTeam.manager.name.split(' ').map(n => n[0]).join(''), photo: getPersonPhoto(accountTeam.manager.name) }}
            backup={{ name: accountTeam.backup.name, role: accountTeam.backup.role, email: accountTeam.backup.email, initials: accountTeam.backup.name.split(' ').map(n => n[0]).join(''), photo: getPersonPhoto(accountTeam.backup.name) }}
          />
        )}
      </div>

      <EmailDigestModal isOpen={showDigest} onClose={() => setShowDigest(false)} />
      {showIntro && <IntroShowcase onDone={() => { markIntroSeen(); setShowIntro(false); }} />}
    </>
  );
}