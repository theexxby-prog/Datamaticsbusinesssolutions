import { useAuth } from '../context/AuthContext';
import { showUnionIdentity } from '../config/demo';
import { neutralizeDeep } from '../data/unionClient';

// ─── The UNION display lens ──────────────────────────────────────────────────
// Returns identity for every login except the two UNION ones, where it
// deep-rewrites the real client's names out of seeded content at render time.
// Keeps the source data single-copy: Renuka and the TCC build read it verbatim.
// Ops is included — it reads the same threads, TAL files and job cards.

export function useUnionLens(): <T>(value: T) => T {
  const { currentUser } = useAuth();
  const active = showUnionIdentity(currentUser);
  return active ? neutralizeDeep : <T,>(v: T) => v;
}
