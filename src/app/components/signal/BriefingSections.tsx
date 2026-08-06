import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  RadioTower, Swords, Package, Layers,
  ShieldCheck, Newspaper, AlertTriangle, UserCheck, CalendarClock, ExternalLink,
} from 'lucide-react';
import type { SignalAccount } from '../../data/signalRoom';
import { fmtSignalDate } from './signalMeta';

// Token-styled section primitives shared by the contact and account briefings.

export function Section({ icon: Icon, title, id, children }: { icon: LucideIcon; title: string; id?: string; children: ReactNode }) {
  return (
    <div id={id} className="glass-card p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
        <Icon className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
        {title}
      </h3>
      {children}
    </div>
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

/** Compact "Industry · HQ · N employees · Revenue" line for briefing headers. */
export function accountFactLine(account: SignalAccount, includeHq = true): string {
  const clean = (value: string) => value.replace(/\s*\([^)]*\)/g, '').trim();
  return [
    account.industry,
    ...(includeHq ? [account.hq] : []),
    `${clean(account.employees)} employees`,
    clean(account.revenue),
  ].join(' · ');
}

/** The account intelligence stack, owned by the account briefing. */
export function AccountDetailSections({ account }: { account: SignalAccount }) {
  return (
    <div className="space-y-4">
      <Section icon={Newspaper} title="Recent news">
        <BulletList items={account.recentNews} linkFor={item => newsSearchUrl(account.name, item)} />
      </Section>

      <Section icon={RadioTower} title="Buying signals">
        <BulletList items={account.buyingSignals} />
      </Section>

      <Section icon={AlertTriangle} title="Account pain points">
        <BulletList items={account.painPoints} />
      </Section>

      <Section icon={CalendarClock} title="Trigger events">
        <div className="space-y-3">
          {account.triggers.map(trigger => (
            <div key={trigger.text} className="flex items-start gap-3">
              <span
                className="mt-0.5 flex-shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide"
                style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}
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
                        href={`https://${trigger.source}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline-offset-2 transition-colors hover:text-[var(--color-primary)] hover:underline"
                        title={`Open ${trigger.source} in a new tab`}
                      >
                        {trigger.source}
                      </a>
                    </>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Swords} title="Competitive openings">
        <BulletList items={account.competitiveOps} />
      </Section>

      <div className="grid gap-4 md:grid-cols-2">
        <Section icon={Layers} title="Technology stack">
          <ChipList items={account.techStack} />
        </Section>
        <Section icon={Package} title="Likely current vendors">
          <ChipList items={account.currentVendors} />
        </Section>
      </div>

      <Section icon={UserCheck} title="Decision-maker roles">
        <BulletList items={account.dmRoles} />
      </Section>

      <Section icon={ShieldCheck} title="Security posture">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{account.securityPosture}</p>
      </Section>
    </div>
  );
}
