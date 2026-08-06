import { useNavigate } from 'react-router';
import { Building2 } from 'lucide-react';
import { getAccountsByReadiness, type SignalAccount, type AccountInsight } from '../../data/signalRoom';
import { DataTable, type Column } from '../ui/DataTable';
import { useUnionPrefs } from '../../config/unionPrefs';

// Accounts lens over the enriched dataset: one sortable row per account —
// committee depth, signal volume, location, size. Readiness (Claude-derived)
// only appears when derived intelligence is switched on.

type Row = { account: SignalAccount; insight: AccountInsight };

export function SignalAccountsView() {
  const navigate = useNavigate();
  const { derivedIntel } = useUnionPrefs();
  const rows = getAccountsByReadiness();

  const columns: Column<Row>[] = [
    {
      key: 'account', header: 'Account', primary: true,
      widthClass: derivedIntel ? 'w-[30%]' : 'w-[34%]',
      sortValue: r => r.account.name, text: r => `${r.account.name} ${r.account.industry}`,
      render: r => (
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{r.account.name}</div>
          <div className="truncate text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{r.account.industry}</div>
        </div>
      ),
    },
    {
      key: 'committee', header: 'Committee',
      widthClass: derivedIntel ? 'w-[13%]' : 'w-[15%]',
      sortValue: r => r.account.contactIds.length, text: r => `${r.account.contactIds.length} contacts`,
      render: r => (
        <span className="text-[12.5px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          {r.account.contactIds.length === 1 ? '1 contact' : `${r.account.contactIds.length} contacts`}
        </span>
      ),
    },
    {
      key: 'signals', header: 'Signals', align: 'right',
      widthClass: derivedIntel ? 'w-[11%]' : 'w-[13%]',
      sortValue: r => r.account.triggers.length + r.account.recentNews.length,
      text: r => String(r.account.triggers.length + r.account.recentNews.length),
      render: r => (
        <span className="text-[13px] font-extrabold" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {r.account.triggers.length + r.account.recentNews.length}
        </span>
      ),
    },
    {
      key: 'location', header: 'Location',
      widthClass: derivedIntel ? 'w-[18%]' : 'w-[21%]',
      sortValue: r => r.account.hq, text: r => r.account.hq,
      render: r => (
        <span className="block truncate text-[12.5px]" style={{ color: 'var(--color-text-secondary)' }} title={r.account.hq}>
          {r.account.hq}
        </span>
      ),
    },
    {
      key: 'employees', header: 'Employees', mobileHidden: true,
      widthClass: derivedIntel ? 'hidden lg:table-cell lg:w-[13%]' : 'hidden lg:table-cell lg:w-[17%]',
      sortValue: r => r.account.employees, text: r => r.account.employees,
      render: r => (
        <span className="block truncate text-[12.5px]" style={{ color: 'var(--color-text-secondary)' }} title={r.account.employees}>
          {r.account.employees}
        </span>
      ),
    },
    ...(derivedIntel ? [{
      key: 'readiness', header: 'Readiness', align: 'right',
      widthClass: 'w-[15%]',
      sortValue: r => r.insight.readiness, text: r => String(r.insight.readiness),
      render: r => (
        <div className="flex items-center justify-end gap-2">
          <div className="h-1.5 w-8 overflow-hidden rounded-full" style={{ background: 'var(--color-border)' }}>
            <div className="h-full rounded-full" style={{ width: `${r.insight.readiness}%`, background: 'var(--color-primary)' }} />
          </div>
          <span className="w-6 text-right text-[13px] font-extrabold" style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {r.insight.readiness}
          </span>
        </div>
      ),
      mobileRender: r => <span className="font-bold">{r.insight.readiness} / 100</span>,
    } satisfies Column<Row>] : []),
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={r => r.account.slug}
      onRowClick={r => navigate(`/leads/account/${r.account.slug}`)}
      searchPlaceholder="Search account, industry, location…"
      layout="fixed"
      countLabel={n => `${n} accounts`}
      empty={{ icon: Building2, title: 'No accounts match', description: 'Try clearing the search.' }}
    />
  );
}
