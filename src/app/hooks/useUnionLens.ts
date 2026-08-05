import { useAuth } from '../context/AuthContext';
import { showFutureModules } from '../config/demo';
import { neutralizeDeep } from '../data/unionClient';

// ─── The UNION display lens ──────────────────────────────────────────────────
// Returns identity for every login except UNION, where it deep-rewrites the
// real client's names out of seeded content at render time. Keeps the source
// data single-copy: Renuka and the TCC build read it verbatim.

export function useUnionLens(): <T>(value: T) => T {
  const { currentUser } = useAuth();
  const active = showFutureModules(currentUser);
  return active ? neutralizeDeep : <T,>(v: T) => v;
}
