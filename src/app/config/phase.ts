// ─── Phase scope ─────────────────────────────────────────────────────────────
// What the first build of the warehouse-backed product covers.
//
// Invoicing and document signing are deferred. They are not cancelled, so the
// pages, data and workflow stay in the tree rather than being deleted; they are
// simply unreachable while this flag is false. Flipping it back restores the
// nav items, the routes and every card that links to them, which is why the
// removal is expressed as one constant instead of thirty deletions.
//
// What billing itself is NOT: the amount a client is billed stays visible in
// phase one. Ops types a rate at campaign creation and the total derives from
// accepted leads. Only the invoice documents and the signing flow are out.

/** Invoices, payment and the document/signing module. Deferred past phase one. */
export const BILLING_MODULES_IN_SCOPE: boolean = false;

/** Nav paths and routes that disappear while the modules above are deferred. */
export const DEFERRED_PATHS = ['/invoices', '/payment', '/documents'] as const;

export function isDeferredPath(path: string): boolean {
  if (BILLING_MODULES_IN_SCOPE) return false;
  return DEFERRED_PATHS.some(p => path === p || path.startsWith(`${p}/`));
}
