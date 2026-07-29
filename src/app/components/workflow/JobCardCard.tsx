import { useState } from 'react';
import {
  ChevronDown, ChevronUp, CheckCircle2, Circle, FileSignature,
  Download, RefreshCw, History, PenLine, AlertTriangle, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import type { JobCard } from '../../types';
import {
  JOB_CARD_TYPE_META, phasesForType, phaseIndex, daysInStage, jobCardSituation,
} from '../../utils/documentWorkflow';
import { WorkflowStepper } from './WorkflowStepper';
import { formatDate } from '../../utils/formatDate';

export type JobCardPerspective = 'client' | 'account_manager' | 'client_manager' | 'readonly';

interface JobCardCardProps {
  card: JobCard;
  perspective: JobCardPerspective;
  onVerifyOpportunity?: (card: JobCard) => void;
  onConfirm?: (card: JobCard) => void;
  onSign?: (card: JobCard) => void;
  onRetrySync?: (card: JobCard) => void;
  busy?: boolean;
}

function fmtDate(iso: string) {
  return formatDate(iso);
}

function relTime(iso: string): string {
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

const TYPE_PROPERTY: Record<JobCard['type'], string> = {
  client_signature: 'Requires client e-signature',
  internal_only: 'Internal record — not sent to the client',
  msa_covered: 'Covered by the master agreement — no job card needed',
};

const SITUATION_STYLE = {
  action: { bg: 'rgba(186,32,39,0.07)', border: 'rgba(186,32,39,0.25)', color: 'var(--color-primary)', icon: AlertTriangle },
  waiting: { bg: 'rgba(217,119,6,0.07)', border: 'rgba(217,119,6,0.25)', color: '#B45309', icon: Clock },
  blocked: { bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.3)', color: '#DC2626', icon: AlertTriangle },
  done: { bg: 'rgba(5,150,105,0.07)', border: 'rgba(5,150,105,0.25)', color: 'var(--color-success)', icon: CheckCircle2 },
} as const;

export function JobCardCard({
  card, perspective, onVerifyOpportunity, onConfirm, onSign, onRetrySync, busy = false,
}: JobCardCardProps) {
  const [expanded, setExpanded] = useState(false);

  const phases = phasesForType(card.type);
  const isTerminal = card.stage === 'signed' || card.stage === 'completed';
  const sfFailed = card.salesforce.status === 'failed';

  const amConfirmed = card.confirmations.accountManager.confirmed;
  const cmConfirmed = card.confirmations.clientManager.confirmed;
  const inConfirmation = card.stage === 'jc_generated' || card.stage === 'pending_confirmations';

  // Available actions per perspective
  const canVerify = perspective === 'client_manager' && card.stage === 'pending_cm_review';
  const canConfirmAM = perspective === 'account_manager' && card.stage === 'pending_confirmations' && !amConfirmed;
  const canConfirmCM = perspective === 'client_manager' && card.stage === 'pending_confirmations' && !cmConfirmed;
  const canSign = perspective === 'client' && card.type === 'client_signature' && card.stage === 'sent_for_signature';
  const canRetry = (perspective === 'account_manager' || perspective === 'client_manager') && sfFailed;

  // Is the viewer the one blocking progress?
  const viewerIsBlocking = canVerify || canConfirmAM || canConfirmCM || canSign;
  const situation = jobCardSituation(card, viewerIsBlocking);
  const sit = SITUATION_STYLE[situation.tone];
  const SitIcon = sit.icon;
  const waitingDays = daysInStage(card);

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.03em' }}>
            {card.id}
          </span>
        </div>
        <h3 className="truncate" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {card.campaignName}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {card.clientCompany} · Created {fmtDate(card.createdAt)} · {TYPE_PROPERTY[card.type]}
        </p>
      </div>

      {/* Situation — the one sentence that matters */}
      <div
        className="flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 mb-4"
        style={{ background: sit.bg, border: `1px solid ${sit.border}` }}
      >
        <SitIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: sit.color }} />
        <div style={{ fontSize: '13px', fontWeight: 600, color: sit.color, lineHeight: 1.45 }}>
          {situation.text}
          {!isTerminal && situation.tone !== 'blocked' && situation.since && (
            <span style={{ fontWeight: 500, opacity: 0.85 }}>
              {' '}— since {fmtDate(situation.since)}{waitingDays > 0 && ` · ${waitingDays} day${waitingDays === 1 ? '' : 's'}`}
            </span>
          )}
          {situation.tone === 'done' && situation.since && (
            <span style={{ fontWeight: 500, opacity: 0.85 }}> · {fmtDate(situation.since)}</span>
          )}
        </div>
      </div>

      {/* Phase stepper — human phases only */}
      <div className="mb-4 overflow-x-auto">
        <div style={{ minWidth: phases.length * 110 }}>
          <WorkflowStepper
            steps={phases.map((p) => ({ key: p.key, label: p.label }))}
            currentIndex={phaseIndex(card)}
            allDone={isTerminal}
            failed={sfFailed}
            size="sm"
          />
        </div>
      </div>

      {/* Scope summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Service', value: card.scope.serviceType },
          { label: 'Geo', value: card.scope.geography },
          { label: 'Target Leads', value: card.scope.targetLeads.toLocaleString('en-US') },
          { label: 'CPL', value: `$${card.scope.cpl.toLocaleString('en-US')}` },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {label}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Confirmation checklist — only while confirmation is live */}
      {inConfirmation && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5" style={{ fontSize: '12px', fontWeight: 500, color: amConfirmed ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
            {amConfirmed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
            {card.accountManager} · Account Manager
            {amConfirmed && card.confirmations.accountManager.at && (
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>· {fmtDate(card.confirmations.accountManager.at)}</span>
            )}
          </span>
          <span className="inline-flex items-center gap-1.5" style={{ fontSize: '12px', fontWeight: 500, color: cmConfirmed ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
            {cmConfirmed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
            {card.clientManager} · Client Manager
            {cmConfirmed && card.confirmations.clientManager.at && (
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>· {fmtDate(card.confirmations.clientManager.at)}</span>
            )}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {canSign && (
          <button onClick={() => onSign?.(card)} disabled={busy} className="btn-primary px-4 py-2 flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            Review & Sign
          </button>
        )}
        {canVerify && (
          <button onClick={() => onVerifyOpportunity?.(card)} disabled={busy} className="btn-primary px-4 py-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Verify Opportunity
          </button>
        )}
        {(canConfirmAM || canConfirmCM) && (
          <button onClick={() => onConfirm?.(card)} disabled={busy} className="btn-primary px-4 py-2 flex items-center gap-2">
            <FileSignature className="w-4 h-4" />
            Confirm Accuracy
          </button>
        )}
        {canRetry && (
          <button onClick={() => onRetrySync?.(card)} disabled={busy} className="btn-primary px-4 py-2 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry Salesforce Sync
          </button>
        )}
        {card.documentUrl && card.stage !== 'intake' && card.stage !== 'pending_cm_review' && (
          <button
            onClick={() => toast.success(`Downloading ${card.id}.pdf…`)}
            className="btn-secondary px-4 py-2 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        )}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="ml-auto flex items-center gap-1 px-2 py-1"
          style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}
        >
          <History className="w-3.5 h-3.5" />
          History
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* History — actor-first audit trail */}
      {expanded && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border-light)' }}>
          <div className="space-y-2.5">
            {card.history.map((event, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--color-primary)' }} />
                <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{event.actor}</span>
                  <span style={{ color: 'var(--color-text-primary)' }}> — {event.action.charAt(0).toLowerCase() + event.action.slice(1)}</span>
                  <span style={{ color: 'var(--color-text-muted)' }}> · {fmtDate(event.at)} ({relTime(event.at)})</span>
                </div>
              </div>
            ))}
          </div>
          {card.salesforce.opportunityId && (
            <p className="mt-3" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Salesforce opportunity {card.salesforce.opportunityId}
              {card.salesforce.syncedAt && ` · synced ${fmtDate(card.salesforce.syncedAt)}`}
              {card.signature?.envelopeId && ` · ${card.signature.provider} envelope ${card.signature.envelopeId}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
