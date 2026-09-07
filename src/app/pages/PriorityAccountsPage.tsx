import { useNavigate } from 'react-router';
import { Flame, Target, Users, Building2, Snowflake } from 'lucide-react';
import { DataTable, type Column } from '../components/ui/DataTable';
import { getPriorityAccounts, getPriorityRollup, type PriorityAccount, type PriorityBand } from '../data/priorityAccounts';

// ─── Priority accounts ───────────────────────────────────────────────────────
// "Who do I call on Monday", as its own page rather than a campaign tab. The
// ranking is cross-campaign by design: an account warming up on two campaigns
// outranks one burning hot on a single flight, and no per-campaign view can
// show that.
//
// Every row states the reason it ranks where it does and the signal behind it,
// then clicks through to the full account briefing. The score on its own would
// just be a number to argue with.

const BAND_TONE: Record<PriorityBand, { label: string; fg: string; bg: string }> = {
  'call-now': { label: 'Call now', fg: 'var(--color-error)', bg: 'var(--color-error-bg)' },
  nurture: { label: 'Nurture', fg: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  dormant: { label: 'Dormant', fg: 'var(--color-text-secondary)', bg: 'var(--background-muted)' },
};

function signalAge(days: number | null): string {
  if (days === null) return 'No dated signal';
  if (days === 0) return 'Today';
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

export default function PriorityAccountsPage() {
  const navigate = useNavigate();
  const accounts = getPriorityAccounts();
  const rollup = getPriorityRollup(accounts);

  const tiles = [
    { Icon: Building2, label: 'Accounts ranked', value: rollup.total, sub: 'engaged across your campaigns' },
    { Icon: Flame, label: 'Call now', value: rollup.callNow, sub: 'scoring 70 or above' },
    { Icon: Target, label: 'Nurture', value: rollup.nurture, sub: 'warming, not ready' },
    { Icon: Users, label: 'With a committee', value: rollup.withCommittee, sub: 'more than one person engaged' },
  ];

  const columns: Column<PriorityAccount>[] = [
    {
      key: 'account', header: 'Account', primary: true, widthClass: 'w-[24%]',
      sortValue: r => r.name, text: r => `${r.name} ${r.industry} ${r.country}`,
      render: r => (
        <div className="min-w-0">
          <div className="truncate text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{r.name}</div>
          <div className="truncate text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            {r.industry} · {r.country}
          </div>
        </div>
      ),
    },
    {
      key: 'score', header: 'Priority', align: 'right', widthClass: 'w-[12%]',
      sortValue: r => r.score, text: r => `${r.score} ${BAND_TONE[r.band].label}`,
      render: r => {
        const tone = BAND_TONE[r.band];
        return (
          <div className="flex flex-col items-end gap-1" data-testid="priority-cell" data-score={r.score}>
            <span
              className="text-[15px] font-extrabold leading-none"
              style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}
            >
              {r.score}
            </span>
            <span
              className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
              style={{ color: tone.fg, background: tone.bg }}
            >
              {tone.label}
            </span>
          </div>
        );
      },
    },
    {
      key: 'reason', header: 'Why it ranks here', widthClass: 'w-[26%]',
      sortable: false, text: r => r.reason,
      render: r => (
        <span className="block text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>{r.reason}</span>
      ),
    },
    {
      key: 'committee', header: 'Committee', align: 'right', widthClass: 'hidden lg:table-cell lg:w-[10%]',
      sortValue: r => r.committee, text: r => `${r.committee} engaged`,
      render: r => (
        <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          {r.committee}
        </span>
      ),
      mobileRender: r => (
        <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
          {r.committee === 1 ? '1 person engaged' : `${r.committee} people engaged`}
        </span>
      ),
    },
    {
      key: 'signal', header: 'Last signal', widthClass: 'hidden xl:table-cell xl:w-[11%]',
      // Sorts by age, so "no dated signal" sinks rather than sorting as brand new.
      sortValue: r => r.daysSinceSignal ?? 9999, text: r => signalAge(r.daysSinceSignal),
      render: r => (
        <span className="block truncate text-xs" style={{ color: 'var(--color-text-secondary)' }} title={r.latestSignal ?? undefined}>
          {signalAge(r.daysSinceSignal)}
        </span>
      ),
    },
    {
      key: 'contact', header: 'Strongest contact', widthClass: 'hidden xl:table-cell xl:w-[11%]',
      sortValue: r => r.topContact ?? '', text: r => r.topContact ?? '',
      render: r => (
        <span className="block truncate text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {r.topContact ?? '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto page-content space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold leading-tight tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          Priority accounts
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
          Every engaged account across your campaigns, ranked on readiness, peak intent, how many people
          are engaged, and how recently something happened. Open a row for the full briefing.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(t => (
          <div key={t.label} className="glass-card flex flex-col p-3.5">
            <t.Icon className="mb-1 h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
            <div
              className="text-xl font-extrabold leading-tight"
              style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}
            >
              {t.value.toLocaleString('en-US')}
            </div>
            <div className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{t.label}</div>
            <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{t.sub}</div>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={accounts}
        getRowId={r => r.slug}
        onRowClick={r => navigate(`/leads/account/${r.slug}`)}
        layout="fixed"
        searchPlaceholder="Search accounts, industries, countries…"
        countLabel={n => `${n} ${n === 1 ? 'account' : 'accounts'}`}
        empty={{
          icon: Snowflake,
          title: 'No accounts to rank yet',
          description: 'Once a campaign starts generating engagement, the accounts worth calling appear here.',
        }}
      />
    </div>
  );
}
