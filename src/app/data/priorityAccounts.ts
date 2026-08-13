// ─── Priority accounts ───────────────────────────────────────────────────────
// The one screen on the consultant's dashboard that answers "so who do I call
// on Monday". It couldn't live inside a campaign's tabs because the ranking
// only means anything across campaigns: an account warming up on two campaigns
// at once outranks one burning hot on a single flight, and a per-campaign view
// hides exactly that.
//
// Built on the signal room rather than the Propensity account list, because
// these are the accounts that have briefing pages behind them — a ranked list
// you can't click into is a list nobody acts on. It also carries real buying
// committees (contactIds) and dated trigger events, so committee depth and
// signal recency are measured rather than invented.
//
// The score blends four inputs and every account states the reason it ranks
// where it does. A ranked list with no stated reason is a list nobody trusts.

import {
  getAccountInsight, getSignalContact, getSynthesis, signalAccounts,
  type SignalAccount,
} from './signalRoom';

/** Weights sum to 1. Readiness leads because it already blends the committee's signals. */
const WEIGHTS = { readiness: 0.35, intent: 0.25, committee: 0.2, recency: 0.2 };

/** Past six months of silence and an account scores nothing for recency. */
const RECENCY_FLOOR_DAYS = 180;
/** Five named stakeholders is a full committee here; more doesn't score higher. */
const COMMITTEE_CEILING = 5;

export type PriorityBand = 'call-now' | 'nurture' | 'dormant';

export interface PriorityAccount {
  slug: string;
  name: string;
  industry: string;
  employees: string;
  country: string;
  /** 0-100 composite. */
  score: number;
  band: PriorityBand;
  readiness: number;
  /** Highest intent score across the account's committee. */
  peakIntent: number;
  committee: number;
  /** Days since the newest dated trigger; null when the account has none. */
  daysSinceSignal: number | null;
  /** Name of the strongest contact, so a caller knows who to ask for. */
  topContact: string | null;
  /** Why this account ranks where it does, in one clause. */
  reason: string;
  /** The most recent trigger event, as evidence under the score. */
  latestSignal: string | null;
}

function newestTriggerDays(account: SignalAccount, today: Date): number | null {
  const dates = account.triggers.map(t => t.date).filter((d): d is string => Boolean(d));
  if (dates.length === 0) return null;
  const newest = dates.reduce((a, b) => (a > b ? a : b));
  return Math.max(0, Math.round((today.getTime() - new Date(newest).getTime()) / 86400000));
}

function newestTriggerText(account: SignalAccount): string | null {
  const dated = account.triggers.filter(t => t.date);
  if (dated.length === 0) return account.buyingSignals[0] ?? null;
  return dated.reduce((a, b) => ((a.date ?? '') > (b.date ?? '') ? a : b)).text;
}

function bandFor(score: number): PriorityBand {
  return score >= 70 ? 'call-now' : score >= 45 ? 'nurture' : 'dormant';
}

/**
 * Every engaged account, ranked.
 *
 * `today` is injected so the demo's fixed date (Jul 30, 2026) drives recency
 * rather than the wall clock, which would make the ranking drift every day the
 * app sits unused.
 */
export function getPriorityAccounts(today = new Date(2026, 6, 30)): PriorityAccount[] {
  const scored = signalAccounts
    .map(account => {
      const insight = getAccountInsight(account.slug);
      if (!insight) return null;

      const committee = account.contactIds.length;
      const days = newestTriggerDays(account, today);

      // The strongest person on the account drives both the intent input and
      // the name we surface — "call Fortinet" is useless without a who.
      const ranked = account.contactIds
        .map(id => getSignalContact(id))
        .filter((c): c is NonNullable<ReturnType<typeof getSignalContact>> => Boolean(c))
        .sort((a, b) => (getSynthesis(b.id)?.intentScore ?? b.signalScore) - (getSynthesis(a.id)?.intentScore ?? a.signalScore));
      const top = ranked[0] ?? null;
      const peakIntent = insight.peak;

      const parts = {
        readiness: insight.readiness / 100,
        intent: peakIntent / 100,
        committee: Math.min(1, committee / COMMITTEE_CEILING),
        // No dated trigger is treated as no recency signal, not as a fresh one.
        recency: days === null ? 0 : Math.max(0, 1 - days / RECENCY_FLOOR_DAYS),
      };
      const score = Math.round(
        (parts.readiness * WEIGHTS.readiness +
          parts.intent * WEIGHTS.intent +
          parts.committee * WEIGHTS.committee +
          parts.recency * WEIGHTS.recency) * 100,
      );

      return {
        parts,
        score,
        peakIntent,
        committee,
        days,
        topContact: top?.name ?? null,
        slug: account.slug,
        name: account.name,
        industry: account.industry,
        employees: account.employees,
        country: account.country,
        readiness: insight.readiness,
        latestSignal: newestTriggerText(account),
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  // Second pass for the reason, because it can only be written by comparing an
  // account to its peers. Naming the largest weighted term instead produced
  // "Readiness at N out of 100" on every single row: readiness carries the
  // heaviest weight and the narrowest spread (48-89), so it won that comparison
  // every time and the column said nothing. What a reader wants is the thing
  // this account has that the others don't, so pick the input where it stands
  // out furthest above the field.
  const keys = ['readiness', 'intent', 'committee', 'recency'] as const;
  const means = Object.fromEntries(
    keys.map(k => [k, scored.reduce((s, a) => s + a.parts[k], 0) / Math.max(1, scored.length)]),
  ) as Record<(typeof keys)[number], number>;

  return scored
    .map(a => {
      // Standouts in order, then take the first whose phrasing is actually
      // TRUE of this account. Ranking alone isn't enough: a 120-day-old signal
      // can still be above a field whose average is worse, and "fresher than
      // most" on a dormant account is the kind of line that costs you the
      // reader. Each candidate carries the condition that makes it honest, and
      // readiness is the fallback because it is always sayable.
      const ordered = [...keys].sort((x, y) =>
        (a.parts[y] - means[y]) * WEIGHTS[y] - (a.parts[x] - means[x]) * WEIGHTS[x]);

      const candidate = (k: (typeof keys)[number]): string | null => {
        if (k === 'committee') {
          return a.committee > 1 ? `A buying committee of ${a.committee}, not one contact` : null;
        }
        if (k === 'recency') {
          if (a.days === null || a.days > 45) return null;
          return a.days === 0 ? 'A signal landed today' : `Active in the last ${a.days} days`;
        }
        if (k === 'intent') {
          return a.peakIntent >= 80
            ? `Peak intent of ${a.peakIntent}${a.topContact ? `, from ${a.topContact}` : ''}`
            : null;
        }
        return `Readiness at ${a.readiness} out of 100`;
      };

      const reason = ordered.reduce<string | null>((found, k) => found ?? candidate(k), null)
        ?? `Readiness at ${a.readiness} out of 100`;

      return {
        slug: a.slug,
        name: a.name,
        industry: a.industry,
        employees: a.employees,
        country: a.country,
        score: a.score,
        band: bandFor(a.score),
        readiness: a.readiness,
        peakIntent: a.peakIntent,
        committee: a.committee,
        daysSinceSignal: a.days,
        topContact: a.topContact,
        reason,
        latestSignal: a.latestSignal,
      };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export interface PriorityRollup {
  total: number;
  callNow: number;
  nurture: number;
  dormant: number;
  /** Accounts with more than one person engaged. */
  withCommittee: number;
}

export function getPriorityRollup(accounts: PriorityAccount[]): PriorityRollup {
  return {
    total: accounts.length,
    callNow: accounts.filter(a => a.band === 'call-now').length,
    nurture: accounts.filter(a => a.band === 'nurture').length,
    dormant: accounts.filter(a => a.band === 'dormant').length,
    withCommittee: accounts.filter(a => a.committee > 1).length,
  };
}
