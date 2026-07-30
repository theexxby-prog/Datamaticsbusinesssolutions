import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

// ─── Theme ───────────────────────────────────────────────────────────────────
// Applies light/dark by stamping data-theme on <html>, which the token layer in
// dark.css keys off. Defaults to light, remembers an explicit choice for the
// life of the browser, and follows the OS only when the user picks "system".

type ThemeChoice = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';

interface ThemeContextValue {
  choice: ThemeChoice;
  resolved: Resolved;
  setChoice: (c: ThemeChoice) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = 'pulse-theme';

function systemPref(): Resolved {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readChoice(): ThemeChoice {
  if (typeof window === 'undefined') return 'light';
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'light';
  } catch {
    return 'light';
  }
}

function apply(resolved: Resolved) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  // The app has two dark mechanisms: our token layer keys off data-theme, while
  // some components use Tailwind's `dark:` variant keyed on a `.dark` class.
  // Drive both so the whole app flips, not just the token-based parts.
  root.setAttribute('data-theme', resolved);
  root.classList.toggle('dark', resolved === 'dark');
  // Keep the browser chrome (mobile URL bar / status bar) on the page
  // background. Values mirror --color-main-bg in design-system.css / dark.css;
  // the pre-paint script in index.html must stay in sync.
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', resolved === 'dark' ? '#100E13' : '#F5F5F7');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>(readChoice);
  const [resolved, setResolved] = useState<Resolved>(() =>
    readChoice() === 'system' ? systemPref() : (readChoice() as Resolved),
  );

  useEffect(() => {
    const next = choice === 'system' ? systemPref() : choice;
    setResolved(next);
    apply(next);
  }, [choice]);

  // Follow the OS while the user hasn't pinned a choice.
  useEffect(() => {
    if (choice !== 'system' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => { const next = systemPref(); setResolved(next); apply(next); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [choice]);

  const setChoice = useCallback((c: ThemeChoice) => {
    setChoiceState(c);
    try { window.localStorage.setItem(STORAGE_KEY, c); } catch { /* private mode */ }
  }, []);

  const toggle = useCallback(() => {
    setChoice(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setChoice]);

  return (
    <ThemeContext.Provider value={{ choice, resolved, setChoice, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
