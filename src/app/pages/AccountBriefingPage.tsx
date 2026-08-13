import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, ListOrdered, Radio, Sparkles, Target } from 'lucide-react';
import { getEngagedColleagues } from '../data/propensity';
import { useAuth } from '../context/AuthContext';
import { showFutureModules } from '../config/demo';
import {
  getSignalAccount, getAccountInsight, getSignalContact, signalLeadId, signalMeta,
  type SignalContact,
} from '../data/signalRoom';
import { Section, AccountDetailSections, accountFactLine } from '../components/signal/BriefingSections';
import { ROLE_META } from '../components/signal/signalMeta';
import { useUnionPrefs } from '../config/unionPrefs';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// ─── Account briefing ────────────────────────────────────────────────────────
// The account-level read: seller fit, the buying committee in recommended
// engagement order (who first and why), and the account intelligence stack.
// UNION preview only.

export default function AccountBriefingPage() {
  useDocumentTitle('Account briefing');
  const navigate = useNavigate();
  const { slug } = useParams();
  const { currentUser } = useAuth();
  const { derivedIntel } = useUnionPrefs();

  const account = slug ? getSignalAccount(slug) : undefined;
  const allowed = showFutureModules(currentUser) && account;

  useEffect(() => {
    if (!allowed) navigate('/leads', { replace: true });
  }, [allowed, navigate]);
  if (!allowed || !account) return null;

  const insight = getAccountInsight(account.slug);
  const anchor = getSignalContact(account.contactIds[0]);

  // Committee merged with the recommended engagement sequence: sequenced
  // contacts first (with their "why"), then any remaining committee members.
  const sequenced = insight?.sequence ?? [];
  const members = account.contactIds
    .map(id => getSignalContact(id))
    .filter((c): c is SignalContact => Boolean(c));
  const engageList: Array<{ contact: SignalContact; why?: string }> = [
    ...sequenced
      .map(step => ({ contact: getSignalContact(step.contactId), why: step.why }))
      .filter((s): s is { contact: SignalContact; why: string } => Boolean(s.contact)),
    ...members
      .filter(m => !sequenced.some(step => step.contactId === m.id))
      .map(contact => ({ contact })),
  ];

  return (
    <div className="max-w-[1040px] mx-auto page-content space-y-5">
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

      {/* Header: name, one inline fact line, the summary once */}
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight leading-tight" style={{ color: 'var(--color-text-primary)' }}>
          {account.name}
        </h1>
        <p className="mt-1 text-[12.5px]" style={{ color: 'var(--color-text-muted)' }}>
          {accountFactLine(account)}
        </p>
        <p className="mt-2 max-w-[70ch] text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {account.summary}
        </p>
      </div>

      {/* Seller fit — account-level narrative (from the anchor contact) */}
      {anchor && (
        <Section icon={Target} title="Seller fit">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{anchor.sellerFit}</p>
          {derivedIntel && insight && (
            <div className="mt-3 flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--color-border-light)' }}>
              <div className="flex-shrink-0 text-center">
                <div className="text-2xl font-extrabold leading-none" style={{ color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {insight.readiness}
                </div>
                <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Readiness</div>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{insight.readinessNote}</p>
            </div>
          )}
        </Section>
      )}

      {/* Buying committee, in recommended engagement order */}
      {engageList.length > 0 && (
        <Section icon={ListOrdered} title="Buying committee — engagement order">
          <div className="space-y-2.5">
            {engageList.map(({ contact, why }, index) => (
              <button
                key={contact.id}
                onClick={() => navigate(`/leads/${signalLeadId(contact.id)}`)}
                className="flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-primary-tint)]"
                style={{ borderColor: 'var(--color-border-light)' }}
              >
                <span
                  className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold text-white"
                  style={{ background: 'var(--color-primary-solid)' }}
                >
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{contact.name}</span>
                    <span className="text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>{contact.title}</span>
                    <span
                      className="rounded-full border px-2 py-0.5 text-[10.5px] font-bold"
                      style={{ borderColor: 'var(--color-border)', color: ROLE_META[contact.roleClass].color }}
                    >
                      {ROLE_META[contact.roleClass].label}
                    </span>
                  </span>
                  {why && (
                    <span className="mt-0.5 block text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{why}</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Ad-engaged colleagues — account intelligence, deliberately NOT leads.
          Only an exact work-email match attaches engagement to a person; a
          company-domain match informs the account instead, which is what this
          section is. Nothing here is in the lead count. */}
      <EngagedColleagues slug={account.slug} />

      <AccountDetailSections account={account} />
    </div>
  );
}

function EngagedColleagues({ slug }: { slug: string }) {
  const colleagues = getEngagedColleagues(slug);
  if (colleagues.length === 0) return null;

  return (
    <Section icon={Radio} title="Engaged at this account — not yet leads">
      <div className="space-y-2">
        {colleagues.map(person => (
          <div
            key={person.name}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-3 py-2.5"
            style={{ borderColor: 'var(--color-border-light)' }}
          >
            <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{person.name}</span>
            <span className="text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>{person.title}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase"
              style={{
                background: person.warmth === 'hot' ? 'var(--color-error-bg)' : 'var(--color-warning-bg)',
                color: person.warmth === 'hot' ? 'var(--color-error)' : 'var(--color-warning)',
              }}
            >
              {person.warmth}
            </span>
            <span className="ml-auto text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>{person.activity}</span>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[11.5px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
        Reached by the ad campaign and matched to this account by company domain. They aren't in your
        lead count — an ad hit isn't a lead. Engaged people flow into the syndication outreach, and
        only a positive response there becomes a lead you pay for; until then, a colleague's activity
        informs the account, never a person.
      </p>
    </Section>
  );
}
