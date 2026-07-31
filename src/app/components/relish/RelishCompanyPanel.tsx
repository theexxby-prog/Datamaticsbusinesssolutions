import {
  Building2, MapPin, Users, DollarSign, Target, Swords, AlertTriangle, RadioTower,
  UserCheck, Layers, Package, ShieldCheck, FileText, Newspaper, Sparkles,
} from 'lucide-react';
import type { RelishCompanyIntel } from '../../data/relish';
import { formatDateShort } from '../../utils/formatDate';

// Company/Target "At a Glance" — the Relish lead-intelligence company layout:
// a stat strip (Industry / HQ / Employees / Revenue) followed by sectioned
// panels. Styled in the drawer's raw-gray card ramp so both tabs read as one
// surface (the ramp is mirrored in dark mode).

function Section({ icon: Icon, title, children }: { icon: typeof Target; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5 bg-gray-50 border border-gray-200">
      <h3 className="text-base font-medium mb-3 text-gray-900 flex items-center gap-2">
        <Icon className="w-4 h-4 text-[var(--color-primary)]" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map(item => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
          <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-primary)]/60" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ChipList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <span
          key={item}
          className="rounded-full border border-gray-200 bg-[var(--color-surface-raised)] px-2.5 py-1 text-xs font-medium text-gray-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

const FIT_COLORS: Record<string, string> = {
  Strong: 'text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/20',
  Good: 'text-[var(--color-info)] bg-[var(--color-info)]/10 border-[var(--color-info)]/20',
  Moderate: 'text-[var(--color-warning)] bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20',
};

export function RelishCompanyPanel({ intel, lastUpdated }: { intel: RelishCompanyIntel; lastUpdated: string }) {
  const stats = [
    { icon: Building2, label: 'Industry', value: intel.industry },
    { icon: MapPin, label: 'Headquarters', value: intel.headquarters },
    { icon: Users, label: 'Employees', value: intel.employeeCount },
    { icon: DollarSign, label: 'Revenue', value: intel.revenue },
  ];

  return (
    <div className="space-y-6">
      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl p-4 bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                <Icon className="w-3.5 h-3.5" />
                {stat.label}
              </div>
              <div className="text-sm font-semibold text-gray-900">{stat.value}</div>
            </div>
          );
        })}
      </div>

      <Section icon={Target} title="Seller Fit">
        <div className="mb-2">
          <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${FIT_COLORS[intel.sellerFit.score]}`}>
            {intel.sellerFit.score} fit
          </span>
        </div>
        <p className="text-sm text-gray-600">{intel.sellerFit.rationale}</p>
      </Section>

      <Section icon={Swords} title="Target Competitive Opportunities">
        <BulletList items={intel.competitorOpportunities} />
      </Section>

      <Section icon={AlertTriangle} title="Target Pain Points">
        <BulletList items={intel.painPoints} />
      </Section>

      <Section icon={RadioTower} title="Signals & Triggers">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Buying signals</div>
        <BulletList items={intel.buyingSignals} />
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mt-4 mb-2">Trigger events</div>
        <BulletList items={intel.triggerEvents} />
      </Section>

      <Section icon={UserCheck} title="Likely Decision-Maker Roles">
        <ChipList items={intel.decisionMakerRoles} />
      </Section>

      <Section icon={Layers} title="Target Technology Stack">
        <ChipList items={intel.techStack} />
      </Section>

      <Section icon={Package} title="Likely Current Vendors">
        <ChipList items={intel.likelyVendors} />
      </Section>

      <Section icon={ShieldCheck} title="Target Security Posture">
        <p className="text-sm text-gray-600">{intel.securityPosture}</p>
      </Section>

      <Section icon={FileText} title="Target Summary">
        <p className="text-sm text-gray-600">{intel.summary}</p>
      </Section>

      <Section icon={Newspaper} title="Target Recent News">
        <ul className="space-y-3">
          {intel.recentNews.map(item => (
            <li key={item.headline} className="text-sm">
              <span className="text-xs text-gray-500 block">{formatDateShort(item.date)}</span>
              <span className="text-gray-900 font-medium">{item.headline}</span>
            </li>
          ))}
        </ul>
      </Section>

      <p className="flex items-center gap-1.5 text-xs text-gray-500">
        <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)]" />
        Relish intelligence · Updated {lastUpdated}
      </p>
    </div>
  );
}
