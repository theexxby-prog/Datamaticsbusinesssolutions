import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Gauge, ListOrdered, AlertOctagon, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { showFutureModules } from '../config/demo';
import {
  getSignalAccount, getAccountInsight, getSignalContact, signalLeadId, signalMeta,
} from '../data/signalRoom';
import { CommitteeStrip } from '../components/signal/CommitteeStrip';
import { Section, AccountFactStrip, AccountDetailSections } from '../components/signal/BriefingSections';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// ─── Account briefing ────────────────────────────────────────────────────────
// The account-level read: readiness with the analyst's note, the recommended
// engagement sequence (who first and why), coverage gaps, the committee, and
// the account intelligence stack. UNION preview only.

export default function AccountBriefingPage() {
  useDocumentTitle('Account briefing');
  const navigate = useNavigate();
  const { slug } = useParams();
  const { currentUser } = useAuth();

  const account = slug ? getSignalAccount(slug) : undefined;
  const allowed = showFutureModules(currentUser) && account;

  useEffect(() => {
    if (!allowed) navigate('/leads', { replace: true });
  }, [allowed, navigate]);
  if (!allowed || !account) return null;

  const insight = getAccountInsight(account.slug);
  const anchor = getSignalContact(account.contactIds[0]);

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

      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight leading-tight" style={{ color: 'var(--color-text-primary)' }}>
          {account.name}
        </h1>
        <p className="mt-1 max-w-[70ch] text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {account.summary}
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="rounded-full border px-2.5 py-0.5" style={{ borderColor: 'var(--color-border)' }}>{account.country}</span>
          <span className="rounded-full border px-2.5 py-0.5" style={{ borderColor: 'var(--color-border)' }}>
            {account.contactIds.length === 1 ? 'Sole contact' : `${account.contactIds.length} on committee`}
          </span>
          {account.domain && (
            <span className="rounded-full border px-2.5 py-0.5" style={{ borderColor: 'var(--color-border)' }}>{account.domain}</span>
          )}
        </div>
      </div>

      {/* Readiness */}
      {insight && (
        <div className="glass-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                <Gauge className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                Account readiness
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{insight.readinessNote}</p>
            </div>
            <div className="flex flex-shrink-0 items-end gap-4">
              <div className="text-center">
                <div className="text-3xl font-extrabold leading-none" style={{ color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {insight.readiness}
                </div>
                <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Readiness</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold leading-none" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {insight.peak}
                </div>
                <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Peak</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold leading-none" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {insight.wavg}
                </div>
                <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Wtd avg</div>
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: 'var(--background-muted)' }}>
            <div className="h-full rounded-full" style={{ width: `${insight.readiness}%`, background: 'var(--color-primary)' }} />
          </div>
        </div>
      )}

      {/* Engagement sequence */}
      {insight && insight.sequence.length > 0 && (
        <Section icon={ListOrdered} title="Recommended engagement sequence">
          <div className="space-y-2.5">
            {insight.sequence.map((step, index) => {
              const person = getSignalContact(step.contactId);
              if (!person) return null;
              return (
                <button
                  key={step.contactId}
                  onClick={() => navigate(`/leads/${signalLeadId(step.contactId)}`)}
                  className="flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-primary-tint)]"
                  style={{ borderColor: 'var(--color-border-light)' }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold text-white"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {person.name}
                      <span className="ml-2 font-medium" style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{person.title}</span>
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{step.why}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* Gaps */}
      {insight && insight.gaps.length > 0 && (
        <Section icon={AlertOctagon} title="Coverage gaps">
          <div className="space-y-2.5">
            {insight.gaps.map(gap => (
              <div key={gap.role} className="rounded-xl border p-3.5" style={{ borderColor: 'rgba(217,119,6,0.3)', background: 'rgba(217,119,6,0.05)' }}>
                <p className="text-sm font-bold" style={{ color: 'var(--color-warning)' }}>{gap.role}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{gap.note}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {anchor && <CommitteeStrip account={account} anchor={anchor} />}

      <AccountFactStrip account={account} />
      <AccountDetailSections account={account} />
    </div>
  );
}
