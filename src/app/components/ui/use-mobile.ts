import { useEffect, useState } from 'react';

// The single mobile/desktop line for the whole app. Keep in sync with
// Tailwind's `md:` breakpoint — CSS handles pure-styling differences; this
// hook is for cases where rendering both trees is expensive (charts, drawers,
// portals) or a numeric value differs between viewports.
export const MOBILE_BREAKPOINT = 768;

const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    // Re-sync in case the viewport changed between initial render and mount.
    setIsMobile(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
