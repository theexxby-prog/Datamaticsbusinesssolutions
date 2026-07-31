import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, Mail, Phone, Globe2, BrainCircuit, AlertTriangle, MessageSquare,
  Heart, Compass, ShieldQuestion, Target, Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { showFutureModules } from '../config/demo';
import {
  signalContactFromLeadId, getSignalAccount, getSynthesis, signalMeta,
} from '../data/signalRoom';
import { SynthesisBlock } from '../components/signal/SynthesisBlock';
import { CommitteeStrip } from '../components/signal/CommitteeStrip';
import { Section, BulletList, AccountFactStrip, AccountDetailSections } from '../components/signal/BriefingSections';
import { IntentChip, RoleDot } from '../components/signal/signalMeta';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// ─── Lead briefing ───────────────────────────────────────────────────────────
// The full enrichment deliverable for one contact: intent synthesis with
// cross-field connection threads, the buying committee (links to related
// leads), the person intelligence, and the account intelligence beneath it.
// UNION preview only; non-signal ids bounce back to /leads.

export default function LeadBriefingPage() {
  useDocumentTitle('Lead briefing');
  const navigate = useNavigate();
  const { leadId } = useParams();
  const { currentUser } = useAuth();

  const contact = leadId ? signalContactFromLeadId(leadId) : undefined;
  const allowed = showFutureModules(currentUser) && contact;

  useEffect(() => {
    if (!allowed) navigate('/leads', { replace: true });
  }, [allowed, navigate]);
  if (!allowed || !contact) return null;

  const account = getSignalAccount(contact.companySlug);
  const synthesis = getSynthesis(contact.id);

  return (
    <div className="max-w-[880px] mx-auto page-content space-y-5">
      {/* Back + provenance */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/leads')}
          className="btn-ghost inline-flex min-h-[40px] items-center gap-1.5 px-2.5 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> All leads
        </button>
        <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
          {signalMeta.campaign} · enriched by {signalMeta.enrichedBy}
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight leading-tight" style={{ color: 'var(--color-text-primary)' }}>
          {contact.name}
        </h1>
        <p className="mt-0.5 text-[15px]" style={{ color: 'var(--color-text-secondary)' }}>
          {contact.title}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {synthesis && <IntentChip type={synthesis.intentType} />}
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            <RoleDot roleClass={contact.roleClass} /> {contact.influence}
          </span>
          {contact.styleTags.map(tag => (
            <span
              key={tag}
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ background: 'var(--background-muted)', color: 'var(--color-text-secondary)' }}
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="inline-flex items-center gap-1.5">
            <Globe2 className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
            {contact.company} · {contact.country}
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
      </div>

      {/* Synthesis — the headline act */}
      {synthesis && <SynthesisBlock synthesis={synthesis} />}

      {/* Committee — connections to related leads */}
      {account && <CommitteeStrip account={account} anchor={contact} currentContactId={contact.id} />}

      {/* Person intelligence */}
      <h2 className="pt-1 text-[13px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>
        Person
      </h2>
      <Section icon={BrainCircuit} title="Role analysis">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{contact.roleAnalysis}</p>
      </Section>
      <Section icon={AlertTriangle} title="Pain points">
        <BulletList items={contact.painPoints} />
      </Section>
      <Section icon={MessageSquare} title="Talking points">
        <BulletList items={contact.talkingPoints} />
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
      <Section icon={Compass} title="Recommended approach">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{contact.approach}</p>
      </Section>
      <Section icon={ShieldQuestion} title="Objection handling">
        <div className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
          {contact.objections.map(objection => (
            <div key={objection.q} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{objection.q}</p>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{objection.a}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section icon={Target} title="Seller fit">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{contact.sellerFit}</p>
      </Section>

      {/* Account intelligence */}
      {account && (
        <>
          <h2 className="pt-1 text-[13px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>
            Company — {account.name}
          </h2>
          <AccountFactStrip account={account} />
          <AccountDetailSections account={account} />
        </>
      )}
    </div>
  );
}
