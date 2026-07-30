/**
 * SplashLoader — Branded loading screen shown during lazy chunk loads.
 *
 * Used as the Suspense fallback for all route transitions.
 * Renders the DatamaticsBPM logo icon + animated progress bar.
 * Pure inline styles + keyframes — no external dependencies.
 */
export function SplashLoader() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #ffffff 0%, var(--color-error-bg) 40%, var(--color-error-bg) 100%)',
        zIndex: 9999,
        animation: 'splashFadeIn 200ms ease forwards',
      }}
    >
      {/* Keyframe definitions injected once */}
      <style>{`
        @keyframes splashFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes splashLogoFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-6px) scale(1.02); }
        }
        @keyframes splashBarGrow {
          0%   { width: 0%;  }
          30%  { width: 45%; }
          60%  { width: 72%; }
          85%  { width: 88%; }
          100% { width: 92%; }
        }
        @keyframes splashShimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        @keyframes splashDotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
      `}</style>

      {/* Floating logo icon — the red-square "D" mark */}
      <div style={{ animation: 'splashLogoFloat 2.4s ease-in-out infinite', marginBottom: '28px' }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 72.08 83.78"
          style={{
            width: '64px',
            height: '64px',
            filter: 'drop-shadow(0 8px 24px rgba(186,32,39,0.22))',
          }}
        >
          <path
            fill="var(--color-primary)"
            d="M10,9.86H41A31.05,31.05,0,0,1,72.08,40.91v0A31.05,31.05,0,0,1,41,72H10a0,0,0,0,1,0,0V9.86a0,0,0,0,1,0,0Z"
          />
          <path
            fill="#fff"
            d="M20.12,64H43.83A11.62,11.62,0,0,0,49,62.82a12.74,12.74,0,0,0,7.48-10.51,12.16,12.16,0,0,0-2.72-9.26,12.82,12.82,0,0,0-10.39-5H23.11s0-10.69,0-13.14a1.93,1.93,0,0,1,.5-1.46A2,2,0,0,1,25.06,23l18.08,0a9,9,0,0,1,3.08.53,7.39,7.39,0,0,1,4.88,7.17,21.94,21.94,0,0,1,5.09,2.72c0-.12.05-.24.08-.36a12.29,12.29,0,0,0-1.85-9.54,12.67,12.67,0,0,0-11.14-5.89H20.14A2.39,2.39,0,0,0,17.76,20V43.54H43.49A7.52,7.52,0,0,1,50.38,54.3a7.55,7.55,0,0,1-7.23,4.33L25,58.65a2,2,0,0,1-1.43-.51,1.91,1.91,0,0,1-.5-1.45c0-1.79,0-3.62,0-5.38V50.4H17.74V61.6A2.39,2.39,0,0,0,20.12,64Z"
          />
        </svg>
      </div>

      {/* Brand text */}
      <p
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '15px',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          letterSpacing: '0.01em',
          margin: '0 0 4px 0',
        }}
      >
        Datamatics Business Solutions
      </p>
      <p
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '11px',
          fontWeight: 500,
          color: 'var(--color-text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          margin: '0 0 36px 0',
        }}
      >
        Client Portal
      </p>

      {/* Animated progress bar */}
      <div
        style={{
          width: '200px',
          height: '3px',
          borderRadius: '99px',
          background: 'rgba(186,32,39,0.1)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Growing fill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            borderRadius: '99px',
            background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))',
            animation: 'splashBarGrow 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
          }}
        />
        {/* Shimmer sweep over the bar */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)',
            backgroundSize: '400px 100%',
            backgroundRepeat: 'no-repeat',
            animation: 'splashShimmer 1.2s ease-in-out infinite',
          }}
        />
      </div>

      {/* Bouncing dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '22px' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: 'var(--color-primary)',
              animation: `splashDotPulse 1.2s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
