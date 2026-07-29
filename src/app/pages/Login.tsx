import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2, Loader2, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useAuth, mockUsers } from '../context/AuthContext';
import { IS_CLIENT_DEMO } from '../config/demo';
import { DemoRibbon } from '../components/DemoRibbon';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// Production login palette (pulse.datamaticsbpm.com)
const CANVAS_RED = '#B43A34';
const WORDMARK_RED = '#9E2F29';



/** Small equaliser-style pulse mark used in the card header. */
function PulseMark({ size = 26 }: { size?: number }) {
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
        <rect key={i} x={b.x} y={b.y} width="3.2" height={b.h} rx="1.6" fill="var(--color-primary)" />
      ))}
    </svg>
  );
}

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

    const selectedUser = IS_CLIENT_DEMO
      ? mockUsers.find((u) => u.role === 'client')
      : mockUsers.find((u) => u.id === selectedUserId);
    if (!selectedUser) {
      setIsLoading(false);
      formRef.current?.classList.add('animate-shake');
      setTimeout(() => formRef.current?.classList.remove('animate-shake'), 500);
      return;
    }

    setCurrentUser(selectedUser);
    setIsLoading(false);
    setShowSuccess(true);

    const route = selectedUser.role === 'ops_manager' ? '/dashboard/ops' :
                  selectedUser.role === 'campaign_manager' ? '/dashboard/manager' :
                  selectedUser.role === 'campaign_backup' ? '/dashboard/manager' :
                  selectedUser.role === 'account_manager' ? '/documents' :
                  selectedUser.role === 'accounts' ? '/invoices' :
                  '/dashboard';

    setTimeout(() => navigate(route), 600);
  };

  const roleLabel = (u: (typeof mockUsers)[number]) =>
    u.role === 'client' ? `Client (${u.company})` :
    u.role === 'campaign_manager' ? 'Campaign Manager' :
    u.role === 'campaign_backup' ? 'Campaign Backup' :
    u.role === 'account_manager' ? 'Account Manager' :
    u.role === 'accounts' ? 'Accounts (Finance)' :
    'Ops Manager';

  return (
    <div className="relative min-h-screen w-screen overflow-hidden flex" style={{ background: CANVAS_RED }}>
      <DemoRibbon />

      {/* Top-right clock + greeting */}
      <div
        className="absolute top-5 right-8 select-none"
        style={{ color: 'rgba(255,255,255,0.92)', fontSize: '15px', fontWeight: 500 }}
      >
        {clockGreeting}
      </div>

      {/* PULSE wordmark — SVG, reads bottom-to-top, fills the full height,
          glyphs flush against the left edge. SVG geometry is deterministic:
          textLength pins the word to exactly the viewport height. */}
      <svg
        aria-hidden="true"
        className="hidden lg:block absolute left-0 top-0 h-full pointer-events-none select-none"
        viewBox="0 0 150 1000"
        preserveAspectRatio="xMinYMid meet"
      >
        <text
          x="0"
          y="0"
          transform="translate(140, 998) rotate(-90)"
          textLength="996"
          lengthAdjust="spacingAndGlyphs"
          fontFamily="'Inter', -apple-system, sans-serif"
          fontSize="190"
          fontWeight="800"
          fill={WORDMARK_RED}
        >
          PULSE
        </text>
      </svg>

      {/* Thin vertical divider to the right of the wordmark */}
      <div
        aria-hidden="true"
        className="hidden lg:block absolute top-0 bottom-0"
        style={{ left: '17%', width: '1px', background: 'rgba(255,255,255,0.28)' }}
      />

      {/* Card zone — centred in the space right of the divider */}
      <div className="flex-1 flex items-center justify-center px-4 lg:pl-[17%]">
        <div
          className="w-full max-w-[430px] bg-white animate-fadeIn"
          style={{ borderRadius: '20px', padding: '36px 34px 28px', boxShadow: '0 24px 64px rgba(0,0,0,0.28)' }}
        >
          {/* Brand header */}
          <div className="flex items-center justify-center gap-2.5 mb-7">
            <PulseMark />
            <div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.15 }}>
                Pulse
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                by Datamatics Business Solutions
              </div>
            </div>
          </div>

          <h1 className="text-center" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
            Welcome back
          </h1>
          <p className="text-center" style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '26px' }}>
            Sign in to access your dashboard
          </p>

          <form ref={formRef} onSubmit={handleLogin}>
            {/* Email — demo persona selector (mock auth) */}
            <label htmlFor="login-email" className="block" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
              Email
            </label>
            <div className="relative mb-4">
              {IS_CLIENT_DEMO ? (
                <input
                  id="login-email"
                  type="email"
                  value="rlawless@thechannelcompany.com"
                  readOnly
                  className="input-base w-full"
                  style={{ padding: '11px 14px', fontSize: '14px' }}
                />
              ) : (
                <>
                  <select
                    id="login-email"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="input-base w-full appearance-none pr-9"
                    style={{ padding: '11px 14px', fontSize: '14px' }}
                  >
                    {mockUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} – {roleLabel(user)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
                </>
              )}
            </div>

            {/* Password — decorative in the demo build */}
            <label htmlFor="login-password" className="block" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
              Password
            </label>
            <div className="relative mb-6">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="input-base w-full pr-10"
                style={{ padding: '11px 14px', fontSize: '14px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || showSuccess}
              className="btn-primary w-full justify-center"
              style={{ padding: '13px', fontSize: '15px', borderRadius: '999px' }}
            >
              {showSuccess ? (
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Signed in</span>
              ) : isLoading ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</span>
              ) : (
                'Sign me in'
              )}
            </button>

            <p className="text-center" style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '14px' }}>
              Press{' '}
              <kbd
                style={{
                  background: 'var(--color-main-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  padding: '2px 7px',
                  fontSize: '12px',
                  fontFamily: 'ui-monospace, monospace',
                  color: 'var(--color-text-primary)',
                }}
              >
                Enter ↵
              </kbd>{' '}
              to login
            </p>
          </form>

          <div style={{ borderTop: '1px solid var(--color-border-light)', margin: '22px 0 16px' }} />

          <p className="text-center" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            ISO 27001:2022 · SOC 1 &amp; 2 Type II · GDPR
          </p>
        </div>
      </div>
    </div>
  );
}
