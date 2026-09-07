import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2, Loader2, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useAuth, mockUsers } from '../context/AuthContext';
import { IS_CLIENT_DEMO, DEMO_PASSCODE, openDemoGate } from '../config/demo';
import { DemoRibbon } from '../components/DemoRibbon';
import { TccWordmark } from '../components/TccWordmark';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/** Equaliser-style pulse mark — the product's logo, used at card and panel scale. */
function PulseMark({ size = 26, color = 'var(--color-primary)' }: { size?: number; color?: string }) {
  const bars = [
    { x: 0, y: 8, h: 10 },
    { x: 5, y: 3, h: 20 },
    { x: 10, y: 0, h: 26 },
    { x: 15, y: 5, h: 16 },
    { x: 20, y: 9, h: 8 },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 24 26" aria-hidden="true">
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width="3.2" height={b.h} rx="1.6" fill={color} />
      ))}
    </svg>
  );
}

/**
 * The brand panel's hero: the pulse mark blown up into a full waveform.
 * Heights are fixed rather than random so the silhouette is identical on every
 * render, and the stagger is derived from the index so the motion reads as a
 * wave travelling left to right.
 */
// A smooth double-peak envelope rather than random spikes — it reads as a
// signal rising and settling, not as noise.
const WAVE_HEIGHTS = [
  16, 22, 30, 40, 54, 70, 86, 100, 92, 76, 60, 46, 38, 48,
  62, 78, 94, 82, 66, 52, 42, 34, 44, 56, 46, 34, 24, 18,
];

function PulseWave() {
  return (
    <div className="flex items-center gap-[5px] h-24" aria-hidden="true">
      {WAVE_HEIGHTS.map((h, i) => (
        <span
          key={i}
          className="animate-pulse-bar flex-1 rounded-[2.5px] bg-white"
          style={{
            // Floor the height so short bars stay bars instead of collapsing
            // into dots once the rounded caps meet.
            height: `${Math.max(h, 14)}%`,
            opacity: 0.42 + (h / 100) * 0.48,
            animationDelay: `${i * 90}ms`,
          }}
        />
      ))}
    </div>
  );
}

const CAPABILITIES = [
  'Campaign delivery and pacing',
  'Lead review and export',
  'Job cards and e-signature',
  'Invoices and payments',
];

// What the TCC-facing build promises — their campaigns, not the whole product.
const TCC_CAPABILITIES = [
  'Your live campaign delivery and pacing',
  'Lead review and CSV export',
  'Reports across your programs',
  'Invoices and documents in one place',
];

function useClockGreeting() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const h = now.getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${time} · ${greeting}`;
}

export default function Login() {
  useDocumentTitle('Login');

  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState('u1');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [passcodeError, setPasscodeError] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const clockGreeting = useClockGreeting();

  // Enter anywhere submits
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isLoading) {
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [isLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Brief visual feedback delay — mock login, no real network call.
    await new Promise((resolve) => setTimeout(resolve, 300));

    // TCC build: entry requires the shared access code. Login alone can't
    // gate the app (AuthContext defaults to the client persona), so the same
    // flag is enforced in AppLayout for deep links.
    if (IS_CLIENT_DEMO && password.trim() !== DEMO_PASSCODE) {
      setIsLoading(false);
      setPasscodeError(true);
      formRef.current?.classList.add('animate-shake');
      setTimeout(() => formRef.current?.classList.remove('animate-shake'), 500);
      return;
    }

    const selectedUser = IS_CLIENT_DEMO
      ? mockUsers.find((u) => u.role === 'client')
      : mockUsers.find((u) => u.id === selectedUserId);
    if (!selectedUser) {
      setIsLoading(false);
      formRef.current?.classList.add('animate-shake');
      setTimeout(() => formRef.current?.classList.remove('animate-shake'), 500);
      return;
    }

    if (IS_CLIENT_DEMO) openDemoGate();
    setCurrentUser(selectedUser);
    setIsLoading(false);
    setShowSuccess(true);

    const route = selectedUser.id === 'u10' ? '/ops-union' :
                  selectedUser.role === 'ops_manager' ? '/dashboard/ops' :
                  selectedUser.role === 'campaign_manager' ? '/dashboard/manager' :
                  selectedUser.role === 'campaign_backup' ? '/dashboard/manager' :
                  // Both roles used to land on a deferred module. Until those
                  // come back they open on the campaign list they can act on.
                  selectedUser.role === 'account_manager' ? '/internal/campaigns' :
                  selectedUser.role === 'accounts' ? '/internal/campaigns' :
                  '/dashboard';

    setTimeout(() => navigate(route), 600);
  };

  const roleLabel = (u: (typeof mockUsers)[number]) =>
    u.id === 'u9' ? 'Preview · all new modules' :
    u.id === 'u10' ? 'Operations · data pipeline' :
    u.role === 'client' ? `Client (${u.company})` :
    u.role === 'campaign_manager' ? 'Campaign Manager' :
    u.role === 'campaign_backup' ? 'Campaign Backup' :
    u.role === 'account_manager' ? 'Account Manager' :
    u.role === 'accounts' ? 'Accounts (Finance)' :
    'Ops Manager';

  return (
    <div className="min-h-screen w-full flex" style={{ background: 'var(--color-background)' }}>
      <DemoRibbon />

      {/* ── Brand panel ────────────────────────────────────────────────────
          Carries the product story so the form side can stay quiet. Hidden
          below lg, where a compact header takes its place. */}
      <aside className="relative hidden lg:flex lg:w-[46%] xl:w-[44%] flex-col justify-between overflow-hidden p-12 xl:p-16">
        {/* Gradient base */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(150deg, var(--color-primary-dark) 0%, var(--color-primary) 52%, var(--color-primary-light) 100%)',
          }}
        />
        {/* Soft highlight for depth — keeps the flat red from looking like a swatch */}
        <div
          className="absolute -top-1/4 -right-1/4 w-[70%] aspect-square rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-1/3 -left-1/4 w-[80%] aspect-square rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,0,0,0.22) 0%, transparent 70%)' }}
        />

        {/* Wordmark — in the TCC build, joined by who the portal is prepared for */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <PulseMark size={30} color="#FFFFFF" />
            <div>
              <div className="text-white font-bold leading-tight text-xl tracking-tight">Pulse</div>
              <div className="text-white/70 text-xs">by Datamatics Business Solutions</div>
            </div>
          </div>
          {IS_CLIENT_DEMO && (
            <div className="mt-6">
              <div className="text-white/60 text-[11px] uppercase tracking-[0.14em] mb-2">Prepared for</div>
              <TccWordmark variant="dark" />
            </div>
          )}
        </div>

        {/* Wave, label and what the portal covers read as one block, so the
            panel divides cleanly into wordmark / content / compliance. */}
        <div className="relative">
          <PulseWave />
          <h2 className="mt-10 text-white font-semibold tracking-tight text-2xl">
            {IS_CLIENT_DEMO ? 'The Channel Company portal' : 'Client portal'}
          </h2>
          <ul className="mt-6 space-y-2.5">
            {(IS_CLIENT_DEMO ? TCC_CAPABILITIES : CAPABILITIES).map((item) => (
              <li key={item} className="flex items-center gap-3 text-white/80 text-sm">
                <span className="w-1 h-1 rounded-full bg-white/50 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-white/55 text-xs tracking-wide">
          ISO 27001:2022 · SOC 1 &amp; 2 Type II · GDPR
        </p>
      </aside>

      {/* ── Form side ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Compact brand header, small screens only */}
        <div
          className="lg:hidden flex items-center justify-between gap-2.5 px-6 py-5"
          style={{
            background: 'linear-gradient(120deg, var(--color-primary-dark), var(--color-primary-light))',
          }}
        >
          <div className="flex items-center gap-2.5">
            <PulseMark size={22} color="#FFFFFF" />
            <div>
              <div className="text-white font-bold leading-tight text-[15px]">Pulse</div>
              <div className="text-white/70 text-[11px]">by Datamatics Business Solutions</div>
            </div>
          </div>
          {IS_CLIENT_DEMO && <TccWordmark variant="dark" className="scale-[0.8] origin-right" />}
        </div>

        {/* Clock — quiet, top right */}
        <div
          className="hidden lg:block text-right px-10 pt-8 select-none text-sm font-medium"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {clockGreeting}
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px] animate-fadeIn">
            <h1
              className="text-3xl font-bold tracking-tight leading-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {IS_CLIENT_DEMO ? 'Welcome, Channel Company team' : 'Welcome back'}
            </h1>
            <p className="mt-2 mb-8 text-[15px]" style={{ color: 'var(--color-text-secondary)' }}>
              {IS_CLIENT_DEMO
                ? 'Enter your access code to open the portal'
                : 'Sign in to access your dashboard'}
            </p>

            <form ref={formRef} onSubmit={handleLogin}>
              {/* Email — demo persona selector (mock auth) */}
              <label
                htmlFor="login-email"
                className="block text-sm font-semibold mb-1.5"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Email
              </label>
              <div className="relative mb-5">
                {IS_CLIENT_DEMO ? (
                  <input
                    id="login-email"
                    type="email"
                    value="rlawless@thechannelcompany.com"
                    readOnly
                    className="input-base w-full px-3.5 py-3 text-sm"
                  />
                ) : (
                  <>
                    <select
                      id="login-email"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="input-base w-full appearance-none px-3.5 py-3 pr-10 text-sm cursor-pointer"
                    >
                      {mockUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} – {roleLabel(user)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: 'var(--color-text-muted)' }}
                    />
                  </>
                )}
              </div>

              {/* Password — the real access code in the TCC build, decorative otherwise */}
              <label
                htmlFor="login-password"
                className="block text-sm font-semibold mb-1.5"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {IS_CLIENT_DEMO ? 'Access code' : 'Password'}
              </label>
              <div className={`relative ${IS_CLIENT_DEMO && passcodeError ? 'mb-2' : 'mb-7'}`}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={IS_CLIENT_DEMO ? 'Enter your access code' : 'Enter your password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passcodeError) setPasscodeError(false);
                  }}
                  autoComplete={IS_CLIENT_DEMO ? 'off' : 'current-password'}
                  className="input-base w-full px-3.5 py-3 pr-11 text-sm"
                  style={IS_CLIENT_DEMO && passcodeError ? { borderColor: 'var(--color-error)' } : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors hover:bg-[var(--color-main-bg)]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {IS_CLIENT_DEMO && passcodeError && (
                <p className="mb-5 text-[13px]" style={{ color: 'var(--color-error)' }}>
                  That code didn't match. Check the code in your invite email.
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading || showSuccess}
                className="btn-primary w-full justify-center rounded-full py-3.5 text-[15px]"
              >
                {showSuccess ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Signed in
                  </span>
                ) : isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
                  </span>
                ) : (
                  'Sign me in'
                )}
              </button>

              <p className="text-center mt-4 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                Press{' '}
                <kbd
                  className="rounded-md px-1.5 py-0.5 text-xs font-mono"
                  style={{
                    background: 'var(--color-main-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Enter ↵
                </kbd>{' '}
                to login
              </p>
            </form>

            {/* Compliance line — the brand panel carries this on large screens */}
            <p
              className="lg:hidden text-center mt-10 pt-6 text-xs"
              style={{ borderTop: '1px solid var(--color-border-light)', color: 'var(--color-text-muted)' }}
            >
              ISO 27001:2022 · SOC 1 &amp; 2 Type II · GDPR
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
