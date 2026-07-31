import {
  UserRound, AlertTriangle, MessageSquare, Heart, Compass, ShieldQuestion, Sparkles, BrainCircuit,
} from 'lucide-react';
import type { Lead } from '../../mockData';
import type { RelishContactIntel } from '../../data/relish';

// Contact/Lead intelligence — identity rail (name, title, priority, decision
// influence, communication style) followed by the conversation-prep sections.
// Styled in the drawer's raw-gray card ramp to match the details tab.

function Section({ icon: Icon, title, children }: { icon: typeof Compass; title: string; children: React.ReactNode }) {
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

const PRIORITY_COLORS: Record<string, string> = {
  P1: 'text-[var(--color-error)] bg-[var(--color-error)]/10 border-[var(--color-error)]/20',
  P2: 'text-[var(--color-warning)] bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20',
  P3: 'text-[var(--color-info)] bg-[var(--color-info)]/10 border-[var(--color-info)]/20',
};

export function RelishContactPanel({
  lead, intel, lastUpdated,
}: {
  lead: Lead;
  intel: RelishContactIntel;
  lastUpdated: string;
}) {
  return (
    <div className="space-y-6">
      {/* Identity rail */}
      <div className="rounded-xl p-5 bg-gray-50 border border-gray-200">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {lead.firstName} {lead.lastName}
            </h3>
            <p className="text-sm text-gray-600">{lead.title} · {lead.company}</p>
          </div>
          <span className={`flex-shrink-0 rounded-full border px-3 py-1 text-sm font-semibold ${PRIORITY_COLORS[intel.engagementPriority]}`}>
            {intel.engagementPriority}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Decision influence</div>
            <div className="text-sm font-medium text-gray-900">{intel.decisionInfluence}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Comm. style</div>
            <div className="text-sm font-medium text-gray-900">{intel.communicationStyle.split('—')[0].trim()}</div>
          </div>
        </div>
      </div>

      <Section icon={BrainCircuit} title="Role Analysis">
        <p className="text-sm text-gray-600">{intel.roleAnalysis}</p>
        <p className="text-sm text-gray-600 mt-2">
          <span className="font-medium text-gray-900">How to communicate: </span>
          {intel.communicationStyle}
        </p>
      </Section>

      <Section icon={AlertTriangle} title="Pain Points">
        <BulletList items={intel.painPoints} />
      </Section>

      <Section icon={MessageSquare} title="Talking Points">
        <BulletList items={intel.talkingPoints} />
      </Section>

      <Section icon={Heart} title="Motivations">
        <BulletList items={intel.motivations} />
      </Section>

      <Section icon={Compass} title="Recommended Approach">
        <p className="text-sm text-gray-600">{intel.recommendedApproach}</p>
      </Section>

      <Section icon={ShieldQuestion} title="Objection Handling">
        <div className="divide-y divide-gray-200">
          {intel.objectionHandling.map(pair => (
            <div key={pair.q} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm font-semibold text-gray-900 flex items-start gap-2">
                <UserRound className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
                {pair.q}
              </p>
              <p className="text-sm text-gray-600 mt-1.5 pl-5">{pair.a}</p>
            </div>
          ))}
        </div>
      </Section>

      <p className="flex items-center gap-1.5 text-xs text-gray-500">
        <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)]" />
        Relish intelligence · Updated {lastUpdated}
      </p>
    </div>
  );
}
