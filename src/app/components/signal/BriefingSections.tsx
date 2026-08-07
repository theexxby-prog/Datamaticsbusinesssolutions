import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  RadioTower, Swords, Package, Layers,
  ShieldCheck, Newspaper, AlertTriangle, UserCheck, CalendarClock, ExternalLink,
} from 'lucide-react';
import type { SignalAccount, EngagementPriority } from '../../data/signalRoom';
import { fmtSignalDate } from './signalMeta';

// Token-styled section primitives shared by the contact and account briefings.
// Section titles follow the delivered column names in the Relish Enrichment API
// so a reader can map a panel to a column without a translation step.

const PRIORITY_STYLE: Record<EngagementPriority, { bg: string; fg: string; label: string }> = {
  P1: { bg: 'var(--color-error-bg)', fg: 'var(--color-error)', label: 'P1 · Engage now' },
  P2: { bg: 'var(--color-warning-bg)', fg: 'var(--color-warning)', label: 'P2 · Nurture' },
  P3: { bg: 'var(--color-info-bg)', fg: 'var(--color-info)', label: 'P3 · Monitor' },
};

/** Engagement Priority — an account-level column in the contract. */
export function PriorityPill({ priority }: { priority: EngagementPriority }) {
  const style = PRIORITY_STYLE[priority];
  if (!style) return null;
  return (
    <span
      className="inline-flex flex-shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{ background: style.bg, color: style.fg }}
    >
      {style.label}
    </span>
  );
}

/**
 * Signal Freshness — the newest verified signal date on the account. The
 * contract delivers it "so reps can sort by who is hot now", so it is worth
 * saying plainly how old that is; a high-readiness account whose newest signal
 * is nine months old is a different proposition from one that moved last week.
 */
export function freshnessAgeDays(signalFreshness: string, now = new Date()): number | null {
  const then = new Date(signalFreshness);
  if (Number.isNaN(then.getTime())) return null;
  return Math.max(0, Math.round((now.getTime() - then.getTime()) / 86_400_000));
}

export function freshnessLabel(signalFreshness: string, now = new Date()): string {
  const days = freshnessAgeDays(signalFreshness, now);
  if (days === null) return fmtSignalDate(signalFreshness);
  if (days < 31) return `${fmtSignalDate(signalFreshness)} · ${days}d ago`;
  const months = Math.round(days / 30.44);
  return `${fmtSignalDate(signalFreshness)} · ${months}mo ago`;
}

/** Past this, a signal is old enough that the UI should say so out loud. */
export const STALE_SIGNAL_DAYS = 120;

/** A source may arrive as a bare hostname or a full URL; accept both. */
export function sourceHref(source: string): string {
  return /^https?:\/\//i.test(source) ? source : `https://${source}`;
}

export function sourceLabel(source: string): string {
  try {
    return new URL(sourceHref(source)).hostname.replace(/^www\./, '');
  } catch {
    return source;
  }
}

/** `note` captions the section — used to attribute seller-specific columns. */
export function Section({ icon: Icon, title, id, note, children }: {
  icon: LucideIcon; title: string; id?: string; note?: ReactNode; children: ReactNode;
}) {
  return (
    <div id={id} className="glass-card p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
        <Icon className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
        {title}
      </h3>
      {note ? (
        <p className="mb-3 mt-0.5 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{note}</p>
      ) : (
        <div className="mb-3" />
      )}
      {children}
    </div>
  );
}

/**
 * Attribution for the columns computed against the seller rather than the
 * account on its own. Without it these read as generic advice; the whole point
 * of the pairing is that they are not.
 */
export function SellerLens({ seller, account }: { seller: string; account?: string }) {
  return (
    <>
      Computed for <span className="font-semibold">{seller}</span>
      {account ? <> against <span className="font-semibold">{account}</span></> : null}
    </>
  );
}

/** `linkFor` turns each bullet into an external link — used by Recent news so a
 *  seller can open the story mid-call. Omit it and the list renders as plain
 *  text exactly as before. */
export function BulletList({ items, linkFor }: { items: string[]; linkFor?: (item: string) => string }) {
  return (
    <ul className="space-y-2">
      {items.map(item => (
        <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: 'var(--color-primary)', opacity: 0.6 }} />
          {linkFor ? (
            <a
              href={linkFor(item)}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-start gap-1 underline-offset-2 transition-colors hover:text-[var(--color-primary)] hover:underline"
              title="Open coverage in a new tab"
            >
              <span>{item}</span>
              <ExternalLink className="mt-[3px] h-3 w-3 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-70" />
            </a>
          ) : (
            <span>{item}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Recent-news items are prose with no URL of their own, so link out to a news
 *  search scoped to the account — always resolves, never a dead link. */
export function newsSearchUrl(accountName: string, headline: string): string {
  const words = headline.replace(/^\s*\d{4}:\s*|^\s*[A-Z][a-z]+ \d{4}:\s*/, '').split(/\s+/).slice(0, 9).join(' ');
  return `https://news.google.com/search?q=${encodeURIComponent(`${accountName} ${words}`)}`;
}

export function ChipList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <span
          key={item}
          className="rounded-full border px-2.5 py-1 text-xs font-medium"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

/**
 * Compact "Industry · HQ · ~N employees · ~Revenue" line for briefing headers.
 *
 * Employee count and revenue are delivered as estimates ("(est.)" in the
 * contract), so they carry a `~`; industry and HQ are not.
 *
 * Every part is dropped when empty rather than assumed present. Datamatics has
 * asked Relish about suppressing the company fields that overlap its own data
 * (size, HQ, revenue) — if that lands, this line must thin out rather than
 * render "· undefined employees ·".
 */
export function accountFactLine(account: SignalAccount, includeHq = true): string {
  const clean = (value?: string) => (value ?? '').replace(/\s*\([^)]*\)/g, '').trim();
  const employees = clean(account.employees);
  const revenue = clean(account.revenue);
  return [
    clean(account.industry),
    ...(includeHq ? [clean(account.hq)] : []),
    employees && `~${employees} employees`,
    revenue && `~${revenue}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Signal Freshness, stated above the trigger list it describes. Loud when the
 * newest verified signal is old — that is the case the column exists to catch,
 * and the one most likely to be missed when an account otherwise scores well.
 */
export function SignalFreshnessLine({ signalFreshness }: { signalFreshness: string }) {
  if (!signalFreshness) return null;
  const days = freshnessAgeDays(signalFreshness);
  const stale = days !== null && days > STALE_SIGNAL_DAYS;
  return (
    <p
      className="mb-3 flex flex-wrap items-center gap-1.5 text-[11.5px]"
      style={{ color: stale ? 'var(--color-warning)' : 'var(--color-text-muted)' }}
    >
      <CalendarClock className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="font-semibold">Signal Freshness:</span>
      <span>{freshnessLabel(signalFreshness)}</span>
      {stale && <span className="font-semibold">· going cold</span>}
    </p>
  );
}

/** The account intelligence stack, owned by the account briefing. */
export function AccountDetailSections({ account }: { account: SignalAccount }) {
  return (
    <div className="space-y-4">
      <Section icon={Newspaper} title="Target Recent News">
        <BulletList items={account.recentNews} linkFor={item => newsSearchUrl(account.name, item)} />
      </Section>

      <Section icon={RadioTower} title="Target Buying Signals">
        <BulletList items={account.buyingSignals} />
      </Section>

      <Section icon={AlertTriangle} title="Target Pain Points">
        <BulletList items={account.painPoints} />
      </Section>

      <Section icon={CalendarClock} title="Trigger Events">
        <SignalFreshnessLine signalFreshness={account.signalFreshness} />
        <div className="space-y-3">
          {account.triggers.map(trigger => (
            <div key={trigger.text} className="flex items-start gap-3">
              <span
                className="mt-0.5 flex-shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold"
                style={{ background: 'var(--color-gray-100)', color: 'var(--color-text-secondary)' }}
              >
                {trigger.kind ?? 'Signal'}
              </span>
              <div className="min-w-0">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{trigger.text}</p>
                <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  {trigger.date ? fmtSignalDate(trigger.date) : ''}
                  {trigger.source && (
                    <>
                      {trigger.date ? ' · ' : ''}
                      <a
                        href={sourceHref(trigger.source)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline-offset-2 transition-colors hover:text-[var(--color-primary)] hover:underline"
                        title={`Open ${sourceLabel(trigger.source)} in a new tab`}
                      >
                        {sourceLabel(trigger.source)}
                      </a>
                    </>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Swords} title="Target Competitive Opportunities">
        <BulletList items={account.competitiveOps} />
      </Section>

      <div className="grid gap-4 md:grid-cols-2">
        <Section icon={Layers} title="Target Technology Stack">
          <ChipList items={account.techStack} />
        </Section>
        <Section icon={Package} title="Likely Current Vendors">
          <ChipList items={account.currentVendors} />
        </Section>
      </div>

      <Section icon={UserCheck} title="Likely Decision-Maker Roles">
        <BulletList items={account.dmRoles} />
      </Section>

      <Section icon={ShieldCheck} title="Target Security Posture">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{account.securityPosture}</p>
      </Section>
    </div>
  );
}
