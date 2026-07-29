import { Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ConvertrQAStatsProps {
  totalProcessed: number;
  valid: number;
  caution: number;
  invalid: number;
}

export function ConvertrQAStats({ totalProcessed, valid, caution, invalid }: ConvertrQAStatsProps) {
  const validPct = totalProcessed > 0 ? Math.round((valid / totalProcessed) * 100) : 0;
  const cautionPct = totalProcessed > 0 ? Math.round((caution / totalProcessed) * 100) : 0;
  const invalidPct = totalProcessed > 0 ? Math.round((invalid / totalProcessed) * 100) : 0;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" />
          <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
            Automated QA Results
          </h3>
        </div>
      </div>

      {/* QA breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 rounded-xl" style={{ background: 'var(--color-success-bg)' }}>
          <CheckCircle className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--color-success)' }} />
          <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
            {valid}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)' }}>
            Valid ({validPct}%)
          </div>
        </div>

        <div className="text-center p-3 rounded-xl" style={{ background: 'var(--color-warning-bg)' }}>
          <AlertTriangle className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--color-warning)' }} />
          <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
            {caution}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-warning)' }}>
            Caution ({cautionPct}%)
          </div>
        </div>

        <div className="text-center p-3 rounded-xl" style={{ background: 'var(--color-error-bg)' }}>
          <XCircle className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--color-error)' }} />
          <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
            {invalid}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-error)' }}>
            Invalid ({invalidPct}%)
          </div>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="w-full h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="h-full" style={{ width: `${validPct}%`, background: 'var(--color-success)' }} />
        <div className="h-full" style={{ width: `${cautionPct}%`, background: 'var(--color-warning)' }} />
        <div className="h-full" style={{ width: `${invalidPct}%`, background: 'var(--color-error)' }} />
      </div>

      <p className="mt-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
        Lead validation is handled automatically. Accepted leads are delivered to your CRM in real-time.
      </p>
    </div>
  );
}
