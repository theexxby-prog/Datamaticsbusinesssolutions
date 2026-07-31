import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Building2, MapPin, Users, DollarSign, RadioTower, Swords, Package, Layers,
  ShieldCheck, Newspaper, AlertTriangle, UserCheck, CalendarClock, FileText,
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

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map(item => (
        <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: 'var(--color-primary)', opacity: 0.6 }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
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

/** Industry / HQ / Employees / Revenue stat strip. */
export function AccountFactStrip({ account }: { account: SignalAccount }) {
  const facts = [
    { icon: Building2, label: 'Industry', value: account.industry },
    { icon: MapPin, label: 'Headquarters', value: account.hq },
    { icon: Users, label: 'Employees', value: account.employees },
    { icon: DollarSign, label: 'Revenue', value: account.revenue },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {facts.map(fact => {
        const Icon = fact.icon;
        return (
          <div key={fact.label} className="glass-card p-3.5">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              <Icon className="h-3.5 w-3.5" />
              {fact.label}
            </div>
            <div className="text-[13px] font-semibold leading-snug" style={{ color: 'var(--color-text-primary)' }}>{fact.value}</div>
          </div>
        );
      })}
    </div>
  );
}

/** The full account intelligence stack, shared by contact + account briefings. */
export function AccountDetailSections({ account }: { account: SignalAccount }) {
  return (
    <div className="space-y-4">
      <Section icon={FileText} title="Account summary">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{account.summary}</p>
      </Section>

      <Section icon={RadioTower} title="Buying signals">
        <BulletList items={account.buyingSignals} />
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
                  {trigger.source ? ` · ${trigger.source}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={AlertTriangle} title="Account pain points">
        <BulletList items={account.painPoints} />
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

      <Section icon={Newspaper} title="Recent news">
        <BulletList items={account.recentNews} />
      </Section>
    </div>
  );
}
