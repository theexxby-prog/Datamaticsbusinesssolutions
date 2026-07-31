// ─── Shared number formatting ────────────────────────────────────────────────

/** House currency style: `$12,500`. */
export const formatMoney = (n: number): string => '$' + n.toLocaleString('en-US');
