import { useMemo, useState } from 'react';
import {
  FileSignature, Upload, CheckCircle2, Hourglass, FolderOpen,
  ClipboardList, X, Loader2, FileUp, PenLine, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { EmptyState } from '../components/EmptyState';
import { DocumentLibraryTab } from '../components/DocumentLibraryTab';
import { JobCardCard, JobCardPerspective } from '../components/workflow/JobCardCard';
import { mockJobCards } from '../data/mockJobCards';
import {
  confirmOpportunity, confirmJobCard, sendForSignature, signJobCard, uploadScopeDump,
} from '../utils/documentWorkflow';
import type { JobCard, ScopeSummary } from '../types';
import { formatDate } from '../utils/formatDate';
import { showFutureModules, } from '../config/demo';
import { UNION_CLIENT_ID } from '../data/unionClient';

// ─── Sign modal (client) ──────────────────────────────────────────────────────

function SignModal({ card, onClose, onSigned }: { card: JobCard; onClose: () => void; onSigned: (card: JobCard) => void }) {
  const { currentUser } = useAuth();
  const [signing, setSigning] = useState(false);

  const handleSign = async () => {
    setSigning(true);
    try {
      await signJobCard(card, currentUser.name);
      onSigned(card);
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-card w-full max-w-[560px] p-6 bg-[var(--color-surface-raised)]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Sign Job Card</h2>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{card.id} · via {card.signature?.provider ?? 'DocuSign'}</p>
          </div>
          <button onClick={onClose} aria-label="Close"><X className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} /></button>
        </div>

        <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--color-main-bg)', border: '1px solid var(--color-border-light)' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8 }}>{card.campaignName}</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Service', card.scope.serviceType],
              ['Geography', card.scope.geography],
              ['Target Leads', card.scope.targetLeads.toLocaleString('en-US')],
              ['CPL', `$${card.scope.cpl.toLocaleString('en-US')}`],
              ['Start', formatDate(card.scope.startDate)],
              ['End', formatDate(card.scope.endDate)],
            ].map(([label, value]) => (
              <div key={label as string}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{label}: </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
          By signing, you confirm the scope above is accurate and authorize Datamatics Business Solutions to begin delivery.
        </p>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary px-4 py-2">Cancel</button>
          <button onClick={handleSign} disabled={signing} className="btn-primary px-4 py-2 flex items-center gap-2">
            {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
            {signing ? 'Signing…' : `Sign as ${currentUser.name}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Scope intake modal (account manager) ─────────────────────────────────────

function IntakeModal({ onClose, onCreated }: { onClose: () => void; onCreated: (scope: ScopeSummary, oppId: string, fileName: string) => void }) {
  const [fileName, setFileName] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [scope, setScope] = useState<ScopeSummary | null>(null);
  const [oppId, setOppId] = useState('');

  const handleExtract = async () => {
    if (!fileName.trim()) {
      toast.error('Name the conversation dump file first');
      return;
    }
    setExtracting(true);
    try {
      const res = await uploadScopeDump({ name: fileName, size: 0 });
      setScope(res.scope);
      setOppId(res.salesforceOpportunityId);
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-card w-full max-w-[560px] p-6 bg-[var(--color-surface-raised)]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>New Job Card Intake</h2>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Upload the client conversation dump — the scope is extracted and a Salesforce opportunity is created automatically.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close"><X className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} /></button>
        </div>

        {!scope ? (
          <>
            <div className="rounded-xl p-6 mb-4 flex flex-col items-center gap-3 text-center" style={{ border: '2px dashed var(--color-border)', background: 'var(--color-main-bg)' }}>
              <FileUp className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
              <input
                type="text"
                placeholder="e.g. tcc-q3-campaign-thread.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="input-base w-full max-w-xs px-3 py-2 text-center"
                style={{ fontSize: 'var(--font-size-sm)' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Email threads, call notes, or chat exports — PDF, DOCX, or ZIP
              </span>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="btn-secondary px-4 py-2">Cancel</button>
              <button onClick={handleExtract} disabled={extracting} className="btn-primary px-4 py-2 flex items-center gap-2">
                {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {extracting ? 'Extracting scope…' : 'Upload & Extract'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--color-success-bg, rgba(15,157,88,0.08))', border: '1px solid rgba(15,157,88,0.2)' }}>
              <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--color-success)' }}>
                <CheckCircle2 className="w-4 h-4" />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Scope extracted · Salesforce opportunity {oppId} created</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Service', scope.serviceType],
                  ['Geography', scope.geography],
                  ['Target Leads', scope.targetLeads.toLocaleString('en-US')],
                  ['CPL', `$${scope.cpl.toLocaleString('en-US')}`],
                  ['Industry', scope.industry],
                  ['Employee Size', scope.employeeSize],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{label}: </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              The client manager will now verify these details before the job card is generated.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => onCreated(scope, oppId, fileName)} className="btn-primary px-4 py-2">
                Send for Manager Review
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Client-facing views ──────────────────────────────────────────────────────
// Clients see two things only: job cards awaiting their signature, and signed
// job cards they can download. Internal pipeline stages, Salesforce sync, and
// dual-confirmation states never reach this view.

function scopeFacts(card: JobCard) {
  return [
    ['Service', card.scope.serviceType],
    ['Geography', card.scope.geography],
    ['Target Leads', card.scope.targetLeads.toLocaleString('en-US')],
    ['Cost per Lead', `$${card.scope.cpl.toLocaleString('en-US')}`],
    ['Start', formatDate(card.scope.startDate)],
    ['End', formatDate(card.scope.endDate)],
  ] as const;
}

function ClientSignatureCard({ card, onSign, busy }: { card: JobCard; onSign: (c: JobCard) => void; busy: boolean }) {
  return (
    <div className="glass-card p-5" style={{ border: '1.5px solid rgba(186,32,39,0.25)' }}>
      <div className="flex items-center gap-2 mb-1">
        <PenLine className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
        <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
          Signature requested
        </span>
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
        {card.campaignName}
      </h3>
      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
        {card.id}{card.signature?.sentAt && <> · Sent {formatDate(card.signature.sentAt)}</>}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {scopeFacts(card).map(([label, value]) => (
          <div key={label}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => onSign(card)} disabled={busy} className="btn-primary px-4 py-2 flex items-center gap-2">
          <PenLine className="w-4 h-4" />
          Review &amp; Sign
        </button>
        <button onClick={() => toast.success(`Downloading ${card.id}.pdf…`)} className="btn-secondary px-4 py-2 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download Copy
        </button>
      </div>
    </div>
  );
}

function ClientSignedRow({ card }: { card: JobCard }) {
  return (
    <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-success-bg)' }}>
          <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
        </div>
        <div className="min-w-0">
          <div className="truncate" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{card.campaignName}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {card.id}
            {card.signature?.signedAt && <> · Signed {formatDate(card.signature.signedAt)}</>}
            {card.signature?.signedBy && <> by {card.signature.signedBy}</>}
          </div>
        </div>
      </div>
      <button onClick={() => toast.success(`Downloading ${card.id}.pdf…`)} className="btn-secondary px-3 py-1.5 flex items-center gap-2 flex-shrink-0" style={{ minHeight: '36px' }}>
        <Download className="w-3.5 h-3.5" />
        Download
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Documents() {
  useDocumentTitle('Documents');
  const { currentUser } = useAuth();

  const perspective: JobCardPerspective =
    currentUser.role === 'client' ? 'client'
      : currentUser.role === 'account_manager' ? 'account_manager'
        : currentUser.role === 'campaign_manager' || currentUser.role === 'campaign_backup' ? 'client_manager'
          : 'readonly';

  const [activeTab, setActiveTab] = useState<'jobcards' | 'library'>('jobcards');
  const [jobCards, setJobCards] = useState<JobCard[]>(mockJobCards);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [signCard, setSignCard] = useState<JobCard | null>(null);
  const [showIntake, setShowIntake] = useState(false);

  // Clients only see their own company's job cards.
  // Internal views sort action-first: cards blocked on the viewer, then longest-waiting.
  const visibleCards = useMemo(() => {
    const cards = perspective === 'client'
      ? jobCards.filter((c) => c.clientCompany === currentUser.company)
      : jobCards;
    const needsViewer = (c: JobCard) =>
      (perspective === 'client_manager' && (c.stage === 'pending_cm_review' || (c.stage === 'pending_confirmations' && !c.confirmations.clientManager.confirmed))) ||
      (perspective === 'account_manager' && ((c.stage === 'pending_confirmations' && !c.confirmations.accountManager.confirmed) || c.salesforce.status === 'failed')) ||
      (perspective === 'client' && c.type === 'client_signature' && c.stage === 'sent_for_signature');
    const isOpen = (c: JobCard) => c.stage !== 'signed' && c.stage !== 'completed' && c.stage !== 'declined';
    return [...cards].sort((a, b) => {
      const rank = (c: JobCard) => (needsViewer(c) ? 0 : isOpen(c) ? 1 : 2);
      const r = rank(a) - rank(b);
      if (r !== 0) return r;
      return a.updatedAt.localeCompare(b.updatedAt); // longest-waiting first among open items
    });
  }, [jobCards, perspective, currentUser.company]);

  const awaitingSignature = visibleCards.filter((c) => c.type === 'client_signature' && c.stage === 'sent_for_signature');
  const inPipeline = visibleCards.filter((c) => c.stage !== 'signed' && c.stage !== 'completed' && c.stage !== 'declined');
  const finished = visibleCards.filter((c) => c.stage === 'signed' || c.stage === 'completed');
  // Clients only ever see documents that involve them: signature requests and signed agreements.
  const clientSigned = visibleCards.filter((c) => c.type === 'client_signature' && c.stage === 'signed');

  const patchCard = (id: string, patch: (c: JobCard) => JobCard) => {
    setJobCards((prev) => prev.map((c) => (c.id === id ? patch(c) : c)));
  };

  const now = () => new Date().toISOString();

  const handleVerify = async (card: JobCard) => {
    setBusyId(card.id);
    try {
      const nextStage = await confirmOpportunity(card);
      const verified = nextStage === 'completed';
      patchCard(card.id, (c) => ({
        ...c,
        stage: verified ? 'completed' : 'pending_confirmations',
        documentUrl: verified ? c.documentUrl : '#',
        updatedAt: now(),
        history: [
          ...c.history,
          {
            at: now(),
            actor: currentUser.name,
            action: verified
              ? 'Verified opportunity — MSA in place, no job card required'
              : 'Verified opportunity details',
          },
          ...(verified ? [] : [{ at: now(), actor: 'System', action: 'Job card generated from template' }]),
        ],
      }));
      toast.success(verified ? 'Verified — covered by MSA' : 'Job card generated — awaiting dual confirmation');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirm = async (card: JobCard) => {
    const role = perspective === 'account_manager' ? 'accountManager' : 'clientManager';
    setBusyId(card.id);
    try {
      const { nextStage, bothConfirmed } = await confirmJobCard(card, role);
      let signature = card.signature;
      if (bothConfirmed && nextStage === 'sent_for_signature') {
        const env = await sendForSignature(card);
        signature = { provider: 'DocuSign', envelopeId: env.envelopeId, sentAt: env.sentAt };
      }
      patchCard(card.id, (c) => ({
        ...c,
        stage: nextStage,
        signature,
        updatedAt: now(),
        confirmations: { ...c.confirmations, [role]: { confirmed: true, at: now() } },
        history: [
          ...c.history,
          { at: now(), actor: currentUser.name, action: 'Confirmed job card accuracy' },
          ...(bothConfirmed && nextStage === 'sent_for_signature'
            ? [{ at: now(), actor: 'System', action: 'Sent for client signature via DocuSign' }]
            : bothConfirmed && nextStage === 'completed'
              ? [{ at: now(), actor: 'System', action: 'Job card finalized for internal records' }]
              : []),
        ],
      }));
      toast.success(
        !bothConfirmed ? 'Confirmed — waiting on the other confirmation'
          : nextStage === 'sent_for_signature' ? 'Both confirmed — sent to the client for signature'
            : 'Both confirmed — job card finalized',
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleSigned = (card: JobCard) => {
    patchCard(card.id, (c) => ({
      ...c,
      stage: 'signed',
      updatedAt: now(),
      signature: {
        provider: c.signature?.provider ?? 'DocuSign',
        envelopeId: c.signature?.envelopeId,
        sentAt: c.signature?.sentAt,
        signedAt: now(),
        signedBy: currentUser.name,
      },
      history: [...c.history, { at: now(), actor: currentUser.name, action: 'Signed the job card' }],
    }));
    setSignCard(null);
    toast.success('Job card signed — the team has been notified');
  };

  const handleRetrySync = async (card: JobCard) => {
    setBusyId(card.id);
    await new Promise((r) => setTimeout(r, 1400));
    patchCard(card.id, (c) => ({
      ...c,
      stage: 'pending_cm_review',
      updatedAt: now(),
      salesforce: { status: 'synced', opportunityId: `006${Math.random().toString(36).slice(2, 10).toUpperCase()}`, syncedAt: now() },
      history: [...c.history, { at: now(), actor: 'System', action: 'Salesforce sync retried — opportunity created' }],
    }));
    setBusyId(null);
    toast.success('Salesforce opportunity created');
  };

  const handleIntakeCreated = (scope: ScopeSummary, oppId: string, fileName: string) => {
    const id = `JC-2026-00${50 + jobCards.length}`;
    const card: JobCard = {
      id,
      campaignName: `${scope.industry} ${scope.serviceType} – ${scope.geography} ${new Date(scope.startDate).getFullYear()}`,
      clientId: showFutureModules(currentUser) ? UNION_CLIENT_ID : 'client_1',
      clientCompany: currentUser?.company ?? 'The Channel Company',
      type: 'client_signature',
      stage: 'pending_cm_review',
      createdAt: now(),
      updatedAt: now(),
      accountManager: currentUser.name,
      clientManager: 'Brijesh Singh',
      scope,
      scopeSource: { fileName, uploadedAt: now(), uploadedBy: currentUser.name },
      salesforce: { status: 'synced', opportunityId: oppId, syncedAt: now() },
      confirmations: { accountManager: { confirmed: false }, clientManager: { confirmed: false } },
      history: [
        { at: now(), actor: currentUser.name, action: 'Uploaded conversation dump' },
        { at: now(), actor: 'System', action: 'Scope extracted · Salesforce opportunity created' },
      ],
    };
    setJobCards((prev) => [card, ...prev]);
    setShowIntake(false);
    toast.success(`${id} created — awaiting manager review`);
  };

  const kpis = [
    { label: 'In Pipeline', value: inPipeline.length, icon: ClipboardList },
    { label: 'Awaiting Signature', value: awaitingSignature.length, icon: FileSignature },
    { label: 'Awaiting Confirmation', value: visibleCards.filter((c) => c.stage === 'pending_confirmations').length, icon: Hourglass },
    { label: 'Signed / Completed', value: finished.length, icon: CheckCircle2 },
  ];

  const subtitle =
    perspective === 'client' ? 'Sign campaign agreements and download your documents'
      : perspective === 'account_manager' ? 'Upload won-campaign scopes and track job cards through signature'
        : perspective === 'client_manager' ? 'Verify opportunities and confirm job cards for your clients'
          : 'Job card pipeline across all clients';

  return (
    <>
      <div className="max-w-[1440px] mx-auto page-content animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
          <div>
            <h1 style={{ color: 'var(--color-text-primary)' }}>Documents</h1>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{subtitle}</p>
          </div>
          {perspective === 'account_manager' && activeTab === 'jobcards' && (
            <button onClick={() => setShowIntake(true)} className="btn-primary px-4 py-2 flex items-center gap-2 w-full lg:w-auto justify-center">
              <Upload className="w-4 h-4" />
              New Job Card Intake
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{ background: 'var(--color-border-light)' }}>
          {([
            { key: 'jobcards', label: 'Job Cards', icon: FileSignature },
            { key: 'library', label: 'Document Library', icon: FolderOpen },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                background: activeTab === key ? 'var(--color-primary)' : 'transparent',
                color: activeTab === key ? '#fff' : 'var(--color-text-secondary)',
                boxShadow: activeTab === key ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'library' ? (
          <DocumentLibraryTab />
        ) : perspective === 'client' ? (
          <>
            {/* Signature requests */}
            {awaitingSignature.length > 0 ? (
              <div className="mb-5">
                <h2 className="mb-3" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Awaiting Your Signature
                </h2>
                <div className="space-y-4">
                  {awaitingSignature.map((card) => (
                    <ClientSignatureCard key={card.id} card={card} onSign={setSignCard} busy={busyId === card.id} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass-card p-5 mb-5 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  Nothing needs your signature right now.
                </span>
              </div>
            )}

            {/* Signed archive */}
            <h2 className="mb-3" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Signed Job Cards
            </h2>
            {clientSigned.length === 0 ? (
              <EmptyState
                icon={FileSignature}
                title="No signed job cards yet"
                description="Signed campaign agreements will appear here for download."
              />
            ) : (
              <div className="space-y-3">
                {clientSigned.map((card) => (
                  <ClientSignedRow key={card.id} card={card} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 stagger-children">
              {kpis.map(({ label, value, icon: Icon }, i) => (
                <div key={label} className="kpi-card animate-slideInUp" style={{ padding: '16px', animationDelay: `${i * 80}ms` }}>
                  <div className="flex items-center justify-between mb-1">
                    <Icon className="kpi-card__icon" style={{ width: '16px', height: '16px' }} />
                  </div>
                  <div className="kpi-card__number" style={{ fontSize: '24px', marginBottom: '2px' }}><AnimatedCounter value={value} /></div>
                  <div className="kpi-card__label">{label}</div>
                </div>
              ))}
            </div>

            {/* Pipeline */}
            <h2 className="mb-3" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Pipeline
            </h2>
            {visibleCards.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No job cards yet"
                description="Job cards appear here once a won campaign enters intake."
              />
            ) : (
              <div className="space-y-4">
                {visibleCards.map((card) => (
                  <JobCardCard
                    key={card.id}
                    card={card}
                    perspective={perspective}
                    onVerifyOpportunity={handleVerify}
                    onConfirm={handleConfirm}
                    onSign={setSignCard}
                    onRetrySync={handleRetrySync}
                    busy={busyId === card.id}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {signCard && <SignModal card={signCard} onClose={() => setSignCard(null)} onSigned={handleSigned} />}
      {showIntake && <IntakeModal onClose={() => setShowIntake(false)} onCreated={handleIntakeCreated} />}
    </>
  );
}
