import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

// ─── Theme ───────────────────────────────────────────────────────────────────
// Applies light/dark by stamping data-theme on <html>, which the token layer in
// dark.css keys off. Defaults to the OS preference, remembers an explicit
// choice for the life of the browser, and follows the OS while on "system".

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
  if (typeof window === 'undefined') return 'system';
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
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
