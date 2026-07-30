import { useRouteError } from 'react-router';
import { AlertCircle, Home } from 'lucide-react';

export default function ErrorBoundary() {
  const error = useRouteError() as any;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #ffffff 100%)' }}>
      <div className="glass-card max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--color-error-bg)' }}>
          <AlertCircle className="w-8 h-8" style={{ color: 'var(--color-error)' }} />
        </div>
        
        <h1 className="text-2xl mb-2" style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
          Oops! Something went wrong
        </h1>
        
        <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          {error?.statusText || error?.message || 'An unexpected error occurred'}
        </p>

        <a
          href="/"
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Return to Home
        </a>

        {error?.status === 404 && (
          <p className="mt-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            The page you're looking for doesn't exist.
          </p>
        )}
      </div>
    </div>
  );
}