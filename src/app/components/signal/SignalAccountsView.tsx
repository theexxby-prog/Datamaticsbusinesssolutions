import { useNavigate } from 'react-router';
import { Building2 } from 'lucide-react';
import { getAccountsByReadiness, type SignalAccount, type AccountInsight } from '../../data/signalRoom';
import { DataTable, type Column } from '../ui/DataTable';
import { useUnionPrefs } from '../../config/unionPrefs';
import { PriorityPill, freshnessLabel, freshnessAgeDays, STALE_SIGNAL_DAYS } from './BriefingSections';

// Accounts lens over the enriched dataset: one sortable row per account —
// priority, committee depth, signal volume and freshness, location, size.
// Readiness (Claude-derived) only appears when derived intelligence is on.
//
// Signal Freshness is sortable here on purpose: the contract delivers it "so
// reps can sort by who is hot now", and rows arrive ordered by readiness, which
// can rank a long-quiet account above one that moved last week.

type Row = { account: SignalAccount; insight: AccountInsight };

const PRIORITY_RANK: Record<string, number> = { P1: 0, P2: 1, P3: 2 };

export function SignalAccountsView() {
  const navigate = useNavigate();
  const { derivedIntel, leadsSignalsColumn } = useUnionPrefs();
  const rows = getAccountsByReadiness();

  const allColumns: Column<Row>[] = [
    {
      key: 'account', header: 'Account', primary: true,
      widthClass: derivedIntel ? 'w-[24%]' : 'w-[28%]',
      sortValue: r => r.account.name, text: r => `${r.account.name} ${r.account.industry}`,
      render: r => (
        <div className="min-w-0">
          <div className="truncate text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{r.account.name}</div>
          <div className="truncate text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{r.account.industry}</div>
        </div>
      ),
    },
    {
      key: 'priority', header: 'Priority',
      widthClass: 'w-[12%]',
      sortValue: r => PRIORITY_RANK[r.account.engagementPriority] ?? 9,
      text: r => r.account.engagementPriority,
      render: r => <PriorityPill priority={r.account.engagementPriority} />,
    },
    {
      key: 'freshness', header: 'Freshness',
      widthClass: 'w-[15%]',
      // Sort on age so "most recently active" is one click, not a date-string quirk.
      sortValue: r => freshnessAgeDays(r.account.signalFreshness) ?? Number.MAX_SAFE_INTEGER,
      text: r => r.account.signalFreshness,
      render: r => {
        const days = freshnessAgeDays(r.account.signalFreshness);
        const stale = days !== null && days > STALE_SIGNAL_DAYS;
        return (
          <span
            className="block truncate text-[12px]"
            style={{ color: stale ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}
            title={stale ? 'No verified signal in over four months' : 'Newest verified signal'}
          >
            {freshnessLabel(r.account.signalFreshness)}
          </span>
        );
      },
    },
    {
      key: 'committee', header: 'Committee',
      widthClass: derivedIntel ? 'w-[12%]' : 'w-[14%]',
      sortValue: r => r.account.contactIds.length, text: r => `${r.account.contactIds.length} contacts`,
      render: r => (
        <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          {r.account.contactIds.length === 1 ? '1 contact' : `${r.account.contactIds.length} contacts`}
        </span>
      ),
    },
    {
      key: 'signals', header: 'Signals', align: 'right',
      widthClass: derivedIntel ? 'w-[10%]' : 'w-[11%]',
      sortValue: r => r.account.triggers.length + r.account.recentNews.length,
      text: r => String(r.account.triggers.length + r.account.recentNews.length),
      render: r => (
        <span className="text-[13px] font-extrabold" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {r.account.triggers.length + r.account.recentNews.length}
        </span>
      ),
    },
    {
      key: 'location', header: 'Location', mobileHidden: true,
      widthClass: derivedIntel ? 'hidden lg:table-cell lg:w-[13%]' : 'hidden lg:table-cell lg:w-[16%]',
      sortValue: r => r.account.hq, text: r => r.account.hq,
      render: r => (
        <span className="block truncate text-[13px]" style={{ color: 'var(--color-text-secondary)' }} title={r.account.hq}>
          {r.account.hq}
        </span>
      ),
    },
    {
      key: 'employees', header: 'Employees', mobileHidden: true,
      widthClass: derivedIntel ? 'hidden xl:table-cell xl:w-[12%]' : 'hidden xl:table-cell xl:w-[14%]',
      sortValue: r => r.account.employees, text: r => r.account.employees,
      render: r => (
        <span className="block truncate text-[13px]" style={{ color: 'var(--color-text-secondary)' }} title={r.account.employees}>
          {r.account.employees}
        </span>
      ),
    },
    ...(derivedIntel ? [{
      key: 'readiness', header: 'Readiness', align: 'right',
      widthClass: 'w-[14%]',
      sortValue: r => r.insight.readiness, text: r => String(r.insight.readiness),
      render: r => (
        <div className="flex items-center justify-end gap-2">
          <div className="h-1.5 w-8 overflow-hidden rounded-full" style={{ background: 'var(--color-border)' }}>
            <div className="h-full rounded-full" style={{ width: `${r.insight.readiness}%`, background: 'var(--color-progress)' }} />
          </div>
          <span className="w-6 text-right text-[13px] font-extrabold" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {r.insight.readiness}
          </span>
        </div>
      ),
      mobileRender: r => <span className="font-bold">{r.insight.readiness} / 100</span>,
    } satisfies Column<Row>] : []),
  ];
  const columns = allColumns.filter(c => c.key !== 'signals' || leadsSignalsColumn);

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={r => r.account.slug}
      onRowClick={r => navigate(`/leads/account/${r.account.slug}`)}
      searchPlaceholder="Search account, industry, location…"
      pageSize={8}
      layout="fixed"
      countLabel={n => `${n} accounts`}
      empty={{ icon: Building2, title: 'No accounts match', description: 'Try clearing the search.' }}
    />
  );
}
