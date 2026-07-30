/**
 * RouteLoader — minimal loading indicator for route transitions.
 *
 * Renders a thin 2px progress bar pinned to the top of the viewport.
 * Intentionally unobtrusive — does not take over the screen or
 * interrupt the user's visual context.
 */
export function RouteLoader() {
  return (
    <>
      <style>{`
        @keyframes routeBarSlide {
          0%   { width: 0%;   opacity: 1; }
          60%  { width: 80%;  opacity: 1; }
          90%  { width: 95%;  opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
        @keyframes routeBarShimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          zIndex: 99999,
          background: 'rgba(186,32,39,0.10)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            backgroundImage: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light), var(--color-primary))',
            backgroundSize: '400px 100%',
            animation:
              'routeBarSlide 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards, routeBarShimmer 1s ease-in-out infinite',
          }}
        />
      </div>
    </>
  );
}
