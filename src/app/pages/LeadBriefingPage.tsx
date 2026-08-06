import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, Mail, Phone, Globe2, BrainCircuit, AlertTriangle, MessageSquare,
  Heart, Compass, ShieldQuestion, Sparkles, MapPin, Award, Layers,
  CheckCircle, XCircle, Clock, User as UserIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { showFutureModules } from '../config/demo';
import {
  signalContactFromLeadId, getSignalAccount, getSynthesis, signalMeta,
} from '../data/signalRoom';
import { mockLeads, type Lead } from '../mockData';
import { getRelishIntel } from '../data/relish';
import { RelishCompanyPanel } from '../components/relish/RelishCompanyPanel';
import { RelishContactPanel } from '../components/relish/RelishContactPanel';
import { SynthesisBlock } from '../components/signal/SynthesisBlock';
import { CommitteeStrip } from '../components/signal/CommitteeStrip';
import { Section, BulletList, accountFactLine } from '../components/signal/BriefingSections';
import { IntentChip, RoleDot } from '../components/signal/signalMeta';
import { useUnionPrefs } from '../config/unionPrefs';
import { formatDateLong, formatDateShort } from '../utils/formatDate';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// ─── Lead view ───────────────────────────────────────────────────────────────
// One route for every lead (UNION preview only). Enriched (SR-) leads get the
// full intelligence briefing; campaign (L-) leads get a compact full-page
// record — the side-panel drawer is gone from this experience.

export default function LeadBriefingPage() {
  useDocumentTitle('Lead');
  const navigate = useNavigate();
  const { leadId } = useParams();
  const { currentUser } = useAuth();

  const contact = leadId ? signalContactFromLeadId(leadId) : undefined;
  const standardLead = !contact && leadId ? mockLeads.find(l => l.id === leadId) : undefined;
  const allowed = showFutureModules(currentUser) && (contact || standardLead);

  useEffect(() => {
    if (!allowed) navigate('/leads', { replace: true });
  }, [allowed, navigate]);
  if (!allowed) return null;

  if (contact) return <EnrichedBriefing contactLeadId={leadId!} />;
  return <StandardLeadRecord key={standardLead!.id} initialLead={standardLead!} />;
}

// ── Enriched contact: the full Signal Room briefing, densified ───────────────

function EnrichedBriefing({ contactLeadId }: { contactLeadId: string }) {
  const navigate = useNavigate();
  const { derivedIntel } = useUnionPrefs();
  const contact = signalContactFromLeadId(contactLeadId)!;
  const account = getSignalAccount(contact.companySlug);
  const synthesis = getSynthesis(contact.id);

  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="max-w-[1140px] mx-auto page-content space-y-4">
      {/* Back + provenance + jump-nav in one compact band */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/leads')}
            className="btn-ghost inline-flex min-h-[36px] items-center gap-1.5 px-2 text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" /> Leads
          </button>
          {[
            ...(derivedIntel && synthesis ? [['sec-synth', 'Synthesis']] : []),
            ...(account && account.contactIds.length > 1 ? [['sec-committee', 'Committee']] : []),
            ['sec-person', 'Person'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => jump(id)}
              className="rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-[var(--color-primary-tint)] hover:text-[var(--color-primary)]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
          {signalMeta.campaign} · enriched by {signalMeta.enrichedBy}
        </span>
      </div>

      {/* Header — identity in one tight block */}
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-[24px] font-extrabold tracking-tight leading-tight" style={{ color: 'var(--color-text-primary)' }}>
            {contact.name}
          </h1>
          <span className="text-[14px]" style={{ color: 'var(--color-text-secondary)' }}>{contact.title}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px]" style={{ color: 'var(--color-text-secondary)' }}>
          {derivedIntel && synthesis && <IntentChip type={synthesis.intentType} />}
          <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold" style={{ borderColor: 'var(--color-border)' }}>
            <RoleDot roleClass={contact.roleClass} /> {contact.influence}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Globe2 className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
            {account ? (
              <button
                onClick={() => navigate(`/leads/account/${account.slug}`)}
                className="font-semibold underline-offset-2 transition-colors hover:text-[var(--color-primary)] hover:underline"
                title={`Open the ${account.name} account briefing`}
              >
                {contact.company}
              </button>
            ) : (
              contact.company
            )}
            {' '}· {contact.country}
          </span>
          <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 hover:text-[var(--color-primary)]">
            <Mail className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
            {contact.email}
          </a>
          <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1.5 hover:text-[var(--color-primary)]">
            <Phone className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
            {contact.phone}
          </a>
        </div>
        {account && (
          <p className="mt-1.5 text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
            {accountFactLine(account, false)}
          </p>
        )}
      </div>

      {derivedIntel && synthesis && <div id="sec-synth"><SynthesisBlock synthesis={synthesis} /></div>}

      {account && <CommitteeStrip account={account} anchor={contact} currentContactId={contact.id} />}

      {/* Person intelligence — short sections paired two-up */}
      <h2 id="sec-person" className="pt-1 text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>
        Person
      </h2>
      <Section icon={BrainCircuit} title="Role analysis">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{contact.roleAnalysis}</p>
      </Section>
      <div className="grid gap-4 md:grid-cols-2">
        <Section icon={Compass} title="Recommended approach">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{contact.approach}</p>
        </Section>
        <Section icon={Heart} title="Motivations">
          <div className="space-y-2.5">
            {contact.motivations.map(motivation => (
              <div key={motivation.text} className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 flex-shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide"
                  style={{ background: 'var(--background-muted)', color: 'var(--color-text-secondary)' }}
                >
                  {motivation.kind}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{motivation.text}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Section icon={AlertTriangle} title="Pain points">
          <BulletList items={contact.painPoints} />
        </Section>
        <Section icon={MessageSquare} title="Talking points">
          <BulletList items={contact.talkingPoints} />
        </Section>
      </div>
      <Section icon={ShieldQuestion} title="Objection handling">
        <div className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
          {contact.objections.map(objection => (
            <div key={objection.q} className="py-2.5 first:pt-0 last:pb-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{objection.q}</p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{objection.a}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ── Campaign lead: compact full-page record (replaces the drawer) ────────────

const activityHistory = [
  { date: '2026-02-28', type: 'Email sent', description: 'Initial outreach email sent', user: 'System' },
  { date: '2026-02-27', type: 'Lead delivered', description: 'Lead delivered to client portal', user: 'System' },
  { date: '2026-02-26', type: 'Verified', description: 'Contact information verified', user: 'QA Team' },
  { date: '2026-02-25', type: 'Created', description: 'Lead created and qualified', user: 'Research Team' },
];

function scoreMeta(score: number) {
  if (score >= 90) return { label: 'Hot Lead', color: 'var(--color-success)' };
  if (score >= 75) return { label: 'Warm Lead', color: 'var(--color-info)' };
  if (score >= 60) return { label: 'Qualified', color: 'var(--color-warning)' };
  return { label: 'Cold Lead', color: 'var(--color-error)' };
}

function StandardLeadRecord({ initialLead }: { initialLead: Lead }) {
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead>(initialLead);
  const [intelTab, setIntelTab] = useState<'company' | 'contact'>('company');

  const intel = getRelishIntel(lead);
  const score = scoreMeta(lead.leadScore);
  const isTerminal = lead.status === 'Accepted' || lead.status === 'Rejected';

  const setStatus = (status: Lead['status'], message: string) => {
    setLead(prev => ({ ...prev, status }));
    toast.success(message);
  };

  return (
    <div className="max-w-[1440px] mx-auto page-content space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => navigate('/leads')}
          className="btn-ghost inline-flex min-h-[36px] items-center gap-1.5 px-2 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Leads
        </button>
        <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          {lead.campaignName} · delivered {formatDateLong(lead.deliveryDate)}
        </span>
      </div>

      {/* Identity band: who, score, status, actions — one card */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-[22px] font-extrabold tracking-tight leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                {lead.firstName} {lead.lastName}
              </h1>
              <span className="text-[13.5px]" style={{ color: 'var(--color-text-secondary)' }}>{lead.title}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px]" style={{ color: 'var(--color-text-secondary)' }}>
              <span className="inline-flex items-center gap-1.5">
                <Globe2 className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                {lead.company}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                {lead.country}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                {lead.industry}
              </span>
              <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 hover:text-[var(--color-primary)]">
                <Mail className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                {lead.email}
              </a>
              <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 hover:text-[var(--color-primary)]">
                <Phone className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                {lead.phone}
              </a>
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                {lead.campaignName}
              </span>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-extrabold leading-none" style={{ color: score.color, fontVariantNumeric: 'tabular-nums' }}>
                {lead.leadScore}
              </div>
              <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>{score.label}</div>
            </div>
            <div className="flex flex-col gap-1.5">
              {isTerminal ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold"
                  style={lead.status === 'Accepted'
                    ? { background: 'rgba(5,150,105,0.10)', color: 'var(--color-success)' }
                    : { background: 'rgba(239,68,68,0.10)', color: 'var(--color-error)' }}
                >
                  {lead.status === 'Accepted' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {lead.status}
                </span>
              ) : (
                <>
                  <button
                    onClick={() => setStatus('Accepted', 'Lead accepted')}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition-colors"
                    style={{ background: 'var(--color-success)' }}
                  >
                    <CheckCircle className="h-4 w-4" /> Accept
                  </button>
                  <button
                    onClick={() => setStatus('Rejected', 'Lead rejected')}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-[var(--color-error)]/10"
                    style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--background-muted)' }}>
          <div className="h-full rounded-full" style={{ width: `${lead.leadScore}%`, background: score.color }} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Left: activity */}
        <div className="space-y-4 lg:col-span-2">
          <Section icon={Clock} title="Activity">
            <div className="space-y-3">
              {activityHistory.map(activity => (
                <div key={activity.type} className="flex gap-2.5">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--color-primary-tint)' }}>
                    <Clock className="h-3 w-3" style={{ color: 'var(--color-primary)' }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{activity.type}</span>
                      <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{formatDateShort(activity.date)}</span>
                    </div>
                    <p className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
                      {activity.description} · {activity.user}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
          <Section icon={UserIcon} title="Notes">
            <div className="space-y-2.5">
              {[
                { author: 'Renuka Lawless', date: '2026-02-28', text: 'Very interested in our cybersecurity solutions. Follow up next week.' },
                { author: 'Brijesh Singh', date: '2026-02-26', text: 'Company matches ICP perfectly. High potential for conversion.' },
              ].map(note => (
                <div key={note.text} className="rounded-xl border p-3" style={{ borderColor: 'var(--color-border-light)' }}>
                  <div className="mb-1 text-[11.5px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                    {note.author} · {formatDateShort(note.date)}
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{note.text}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Right: Relish intelligence when covered, otherwise a quiet note */}
        <div className="lg:col-span-3">
          {intel ? (
            <div className="space-y-3">
              <div
                className="grid grid-cols-2 gap-1 rounded-xl p-1"
                style={{ background: 'var(--background-muted)' }}
                role="tablist"
              >
                {([['company', 'Company intelligence'], ['contact', 'Contact intelligence']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={intelTab === key}
                    onClick={() => setIntelTab(key)}
                    className={`min-h-[36px] rounded-lg text-[13px] font-semibold transition-colors ${
                      intelTab === key ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {intelTab === 'company' && intel.company && <RelishCompanyPanel intel={intel.company} lastUpdated={intel.lastUpdated} />}
              {intelTab === 'contact' && intel.contact && <RelishContactPanel lead={lead} intel={intel.contact} lastUpdated={intel.lastUpdated} />}
            </div>
          ) : (
            <div className="glass-card flex items-center gap-2.5 p-4">
              <Sparkles className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                No Relish enrichment on this lead yet — enrichment covers {`${signalMeta.rows}`} of {signalMeta.sampleOf} contacts in the current sample.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
