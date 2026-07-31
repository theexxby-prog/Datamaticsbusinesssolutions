import { useNavigate } from 'react-router';
import { Users } from 'lucide-react';
import type { SignalAccount, SignalContact } from '../../data/signalRoom';
import { getCommittee, getSynthesis, signalLeadId } from '../../data/signalRoom';
import { IntentChip, RoleDot } from './signalMeta';

// Buying committee — the "connections between relevant leads": everyone the
// enrichment found at this account, ranked by intent, tap-through to each
// person's briefing.

export function CommitteeStrip({
  account, anchor, currentContactId,
}: {
  account: SignalAccount;
  anchor: SignalContact;
  currentContactId?: number;
}) {
  const navigate = useNavigate();
  const committee = getCommittee(anchor);
  if (committee.length < 2) return null;

  return (
    <div id="sec-committee" className="glass-card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
          <Users className="h-4 w-4" />
          Buying committee — {account.name}
        </h3>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {committee.length} contacts, ranked by intent
        </span>
      </div>
      <div className="space-y-1.5">
        {committee.map(member => {
          const synthesis = getSynthesis(member.id);
          const isCurrent = member.id === currentContactId;
          return (
            <button
              key={member.id}
              disabled={isCurrent}
              onClick={() => navigate(`/leads/${signalLeadId(member.id)}`)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                isCurrent ? 'cursor-default' : 'hover:bg-[var(--color-primary-tint)]'
              }`}
              style={{
                borderColor: isCurrent ? 'var(--color-primary)' : 'var(--color-border-light)',
                background: isCurrent ? 'var(--color-primary-tint)' : 'transparent',
              }}
            >
              <RoleDot roleClass={member.roleClass} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {member.name}
                  {isCurrent && <span className="ml-2 text-[10px] font-semibold uppercase" style={{ color: 'var(--color-primary)' }}>viewing</span>}
                </span>
                <span className="block truncate text-xs" style={{ color: 'var(--color-text-muted)' }}>{member.title}</span>
              </span>
              <span className="flex flex-shrink-0 items-center gap-2">
                {synthesis && <IntentChip type={synthesis.intentType} />}
                <span className="text-sm font-extrabold" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {synthesis?.intentScore ?? member.signalScore}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
