import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useNotifications } from '../context/NotificationContext';
import {
  CheckCircle2,
  XCircle,
  MessageSquareDiff,
  Clock,
  MapPin,
  Users,
  Target,
  DollarSign,
  Building2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Inbox,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { mockCampaignSubmissions } from '../mockData';
import type { CampaignSubmission, SubmissionStatus } from '../types';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

// ─── Changes Requested Modal ──────────────────────────────────────────────────
function ChangesModal({
  submission,
  onClose,
  onSubmit,
}: {
  submission: CampaignSubmission;
  onClose: () => void;
  onSubmit: (notes: string) => void;
}) {
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg rounded-2xl p-6 z-10"
        style={{
          background: 'var(--color-surface-raised)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
        }}
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <MessageSquareDiff className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: '16px' }}>
              Request Changes
            </h3>
            <p className="text-[var(--color-text-secondary)] mt-0.5" style={{ fontSize: '13px' }}>
              {submission.campaignName}
            </p>
          </div>
        </div>

        <p className="text-[var(--color-text-primary)] mb-3" style={{ fontSize: '13px' }}>
          Describe what needs to be changed or clarified before this campaign can be approved.
          This message will be visible to the client.
        </p>

        <textarea
          className="w-full rounded-xl border border-[var(--color-border)] p-3 text-[var(--color-text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)]"
          style={{ fontSize: '14px', minHeight: '120px' }}
          placeholder="e.g. Please clarify the target geography, or adjust the CPL to match our current capacity for this segment..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors font-medium"
            style={{ fontSize: '14px' }}
          >
            Cancel
          </button>
          <button
            onClick={() => notes.trim() && onSubmit(notes.trim())}
            disabled={!notes.trim()}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold"
            style={{ fontSize: '14px' }}
          >
            Send Feedback
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Submission Card ──────────────────────────────────────────────────────────
function SubmissionCard({
  submission,
  onApprove,
  onRequestChanges,
  onDecline,
}: {
  submission: CampaignSubmission;
  onApprove: (id: string) => void;
  onRequestChanges: (submission: CampaignSubmission) => void;
  onDecline: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isActionable = submission.status === 'Pending Approval' || submission.status === 'Changes Requested';
  const isReviewed = submission.status === 'Approved' || submission.status === 'Declined';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--color-surface-raised)',
        backdropFilter: 'blur(16px)',
        border: submission.status === 'Pending Approval'
          ? '1px solid rgba(194,65,12,0.2)'
          : submission.status === 'Changes Requested'
          ? '1px solid rgba(180,83,9,0.2)'
          : '1px solid var(--glass-border)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}
    >
      {/* Priority stripe */}
      {submission.status === 'Pending Approval' && (
        <div className="h-1 w-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-warning)]" />
      )}
      {submission.status === 'Changes Requested' && (
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-yellow-400" />
      )}

      <div className="p-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatusBadge status={submission.status} />
              <span className="text-xs text-[var(--color-text-muted)]">
                Submitted {daysSince(submission.submittedAt)} · {fmtDate(submission.submittedAt)}
              </span>
            </div>
            <h3 className="font-semibold text-[var(--color-text-primary)] leading-snug" style={{ fontSize: '16px' }}>
              {submission.campaignName}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Building2 className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <span className="text-[var(--color-text-secondary)]" style={{ fontSize: '13px' }}>
                {submission.clientCompany} · submitted by {submission.submittedBy}
              </span>
            </div>
          </div>

          {/* Urgency indicator for pending */}
          {submission.status === 'Pending Approval' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0"
              style={{ background: 'rgba(194,65,12,0.08)' }}>
              <Clock className="w-3.5 h-3.5 text-[var(--color-warning)]" />
              <span className="text-xs font-semibold text-[var(--color-warning)]">Awaiting Review</span>
            </div>
          )}
          {isReviewed && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] flex-shrink-0">
              Reviewed {submission.reviewedAt ? fmtDate(submission.reviewedAt) : ''}
            </div>
          )}
        </div>

        {/* Key specs — quick glance row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="rounded-xl p-3" style={{ background: 'var(--color-surface)' }}>
            <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Type</p>
            <p className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: '13px' }}>{submission.serviceType}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'var(--color-surface)' }}>
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-[var(--color-text-muted)]" />
              <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Geo</p>
            </div>
            <p className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: '13px' }}>{submission.geography}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'var(--color-surface)' }}>
            <div className="flex items-center gap-1 mb-1">
              <Target className="w-3 h-3 text-[var(--color-text-muted)]" />
              <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Target</p>
            </div>
            <p className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: '13px' }}>{submission.targetLeads.toLocaleString()} leads</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'var(--color-surface)' }}>
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="w-3 h-3 text-[var(--color-text-muted)]" />
              <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Est. Value</p>
            </div>
            <p className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: '13px' }}>
              ${(submission.targetLeads * submission.cpl).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Expandable details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors mb-3"
          style={{ fontSize: '13px', fontWeight: 600 }}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? 'Hide details' : 'View full campaign brief'}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-[var(--color-surface)] space-y-4 mb-4">
                {/* Job titles */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Users className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Target Job Titles</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {submission.jobTitles.map(t => (
                      <span key={t} className="px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Locations + employee size */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Locations</p>
                    <p className="text-[var(--color-text-primary)]" style={{ fontSize: '13px' }}>
                      {submission.locations.join(', ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Company Size</p>
                    <p className="text-[var(--color-text-primary)]" style={{ fontSize: '13px' }}>{submission.employeeSize} employees</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Industry</p>
                    <p className="text-[var(--color-text-primary)]" style={{ fontSize: '13px' }}>{submission.industry}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">CPL</p>
                    <p className="text-[var(--color-text-primary)]" style={{ fontSize: '13px' }}>${submission.cpl} per lead</p>
                  </div>
                </div>

                {/* Additional info */}
                {submission.additionalInfo && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Client Notes</p>
                    <p className="text-[var(--color-text-primary)] leading-relaxed" style={{ fontSize: '13px' }}>
                      {submission.additionalInfo}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Changes Requested feedback block */}
        {submission.status === 'Changes Requested' && submission.managerNotes && (
          <div
            className="rounded-xl p-4 mb-4"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 mb-1" style={{ fontSize: '13px' }}>
                  Feedback sent to client
                </p>
                <p className="text-amber-900 leading-relaxed" style={{ fontSize: '13px' }}>
                  {submission.managerNotes}
                </p>
                {submission.reviewedBy && (
                  <p className="text-amber-600 mt-2" style={{ fontSize: '12px' }}>
                    — {submission.reviewedBy}{submission.reviewedAt ? `, ${fmtDate(submission.reviewedAt)}` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Approved confirmation */}
        {submission.status === 'Approved' && (
          <div
            className="rounded-xl p-4 mb-4"
            style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <p className="font-semibold text-emerald-800" style={{ fontSize: '13px' }}>
                Approved by {submission.reviewedBy}{submission.reviewedAt ? ` on ${fmtDate(submission.reviewedAt)}` : ''} — Campaign is now live
              </p>
            </div>
          </div>
        )}

        {/* Declined */}
        {submission.status === 'Declined' && (
          <div
            className="rounded-xl p-4 mb-4"
            style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.15)' }}
          >
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <p className="font-semibold text-red-700" style={{ fontSize: '13px' }}>
                Declined — Client has been notified
              </p>
            </div>
          </div>
        )}

        {/* Action buttons (only for actionable statuses) */}
        {isActionable && (
          <div className="flex gap-2 flex-wrap pt-1">
            <button
              onClick={() => onApprove(submission.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-success)] text-white hover:bg-[#047857] active:bg-[var(--color-badge-active-text)] transition-colors font-semibold"
              style={{ fontSize: '13px' }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve & Go Live
            </button>
            <button
              onClick={() => onRequestChanges(submission)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 transition-colors font-semibold"
              style={{ fontSize: '13px' }}
            >
              <MessageSquareDiff className="w-4 h-4" />
              Request Changes
            </button>
            <button
              onClick={() => onDecline(submission.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-red-50 hover:text-red-700 hover:border-red-200 active:bg-red-100 transition-colors font-medium"
              style={{ fontSize: '13px' }}
            >
              <XCircle className="w-4 h-4" />
              Decline
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CampaignApprovalsPage() {
  useDocumentTitle('Campaign Approvals');

  const { addNotification } = useNotifications();
  const [submissions, setSubmissions] = useState<CampaignSubmission[]>(mockCampaignSubmissions);
  const [filter, setFilter] = useState<SubmissionStatus | 'All'>('All');
  const [changesTarget, setChangesTarget] = useState<CampaignSubmission | null>(null);

  const pendingCount = submissions.filter(s => s.status === 'Pending Approval').length;
  const changesCount = submissions.filter(s => s.status === 'Changes Requested').length;
  const approvedCount = submissions.filter(s => s.status === 'Approved').length;

  const filtered = submissions.filter(s => filter === 'All' || s.status === filter);

  const handleApprove = (id: string) => {
    setSubmissions(prev =>
      prev.map(s =>
        s.id === id
          ? { ...s, status: 'Approved' as SubmissionStatus, reviewedAt: new Date().toISOString(), reviewedBy: 'Brijesh Singh' }
          : s
      )
    );
    toast.success(`Campaign approved — it's now live!`);
    const approved = submissions.find(s => s.id === id);
    if (approved) {
      addNotification({
        campaignId: approved.id,
        campaignName: approved.campaignName,
        event: 'campaign_live',
        description: `✅ "${approved.campaignName}" has been approved and is now live.`,
        link: '/campaigns',
      });
    }
  };

  const handleDecline = (id: string) => {
    setSubmissions(prev =>
      prev.map(s =>
        s.id === id
          ? { ...s, status: 'Declined' as SubmissionStatus, reviewedAt: new Date().toISOString(), reviewedBy: 'Brijesh Singh' }
          : s
      )
    );
    toast.error('Campaign declined — client has been notified.');
    const declined = submissions.find(s => s.id === id);
    if (declined) {
      addNotification({
        campaignId: declined.id,
        campaignName: declined.campaignName,
        event: 'campaign_live',
        description: `❌ "${declined.campaignName}" was declined. Please review feedback.`,
        link: '/campaigns',
      });
    }
  };

  const handleRequestChanges = (notes: string) => {
    if (!changesTarget) return;
    setSubmissions(prev =>
      prev.map(s =>
        s.id === changesTarget.id
          ? {
              ...s,
              status: 'Changes Requested' as SubmissionStatus,
              managerNotes: notes,
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Brijesh Singh',
            }
          : s
      )
    );
    toast.info('Feedback sent to client.');
    addNotification({
      campaignId: changesTarget.id,
      campaignName: changesTarget.campaignName,
      event: 'campaign_live',
      description: `📝 Changes requested for "${changesTarget.campaignName}". Please review and resubmit.`,
      link: '/campaigns',
    });
    setChangesTarget(null);
  };

  return (
    <>
      <div className="max-w-[1100px] mx-auto page-content">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-[var(--color-text-primary)] mb-1" style={{ fontSize: '24px', fontWeight: 700 }}>
            Campaign Approvals
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Review and action campaign requests submitted by clients before they go live.
          </p>
        </div>

        {/* Summary stat strip */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pending Review', value: pendingCount, color: 'var(--color-warning)', bg: 'rgba(194,65,12,0.06)', border: 'rgba(194,65,12,0.15)' },
            { label: 'Changes Sent', value: changesCount, color: 'var(--color-warning)', bg: 'rgba(180,83,9,0.06)', border: 'rgba(180,83,9,0.15)' },
            { label: 'Approved This Month', value: approvedCount, color: 'var(--color-success)', bg: 'rgba(5,150,105,0.06)', border: 'rgba(5,150,105,0.15)' },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-2xl p-4 text-center"
              style={{ background: stat.bg, border: `1px solid ${stat.border}` }}
            >
              <p className="text-3xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: stat.color }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['All', 'Pending Approval', 'Changes Requested', 'Approved', 'Declined'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className="px-4 py-2 rounded-xl font-semibold transition-all"
              style={{
                fontSize: '13px',
                background: filter === tab ? 'var(--color-primary)' : 'var(--color-surface-raised)',
                color: filter === tab ? '#fff' : 'var(--color-text-secondary)',
                border: filter === tab ? 'none' : '1px solid var(--color-border)',
                boxShadow: filter === tab ? '0 2px 8px rgba(186,32,39,0.25)' : 'none',
              }}
            >
              {tab}
              {tab !== 'All' && (
                <span className="ml-1.5 opacity-70">
                  ({submissions.filter(s => s.status === tab).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Submission list */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl p-12 text-center"
            style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--glass-border)' }}>
            <Inbox className="w-12 h-12 text-[var(--color-border)] mx-auto mb-4" />
            <p className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: '16px' }}>No submissions here</p>
            <p className="text-[var(--color-text-muted)] mt-1" style={{ fontSize: '14px' }}>
              {filter === 'All'
                ? 'No campaign submissions have been made yet.'
                : `No campaigns with status "${filter}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filtered.map(submission => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  onApprove={handleApprove}
                  onRequestChanges={setChangesTarget}
                  onDecline={handleDecline}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Changes Modal */}
      <AnimatePresence>
        {changesTarget && (
          <ChangesModal
            submission={changesTarget}
            onClose={() => setChangesTarget(null)}
            onSubmit={handleRequestChanges}
          />
        )}
      </AnimatePresence>
    </>
  );
}
