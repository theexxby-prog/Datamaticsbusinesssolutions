import { Check, X } from 'lucide-react';

export interface StepperStep {
  key: string;
  label: string;
}

interface WorkflowStepperProps {
  steps: StepperStep[];
  /** Index of the current (in-progress) step. Steps before it render as done. */
  currentIndex: number;
  /** Renders every step as done — for terminal success states. */
  allDone?: boolean;
  /** Renders the current step as failed. */
  failed?: boolean;
  /** Compact variant for table rows / cards. */
  size?: 'sm' | 'md';
  /** Vertical stacks the steps — fits phone-width cards without scrolling. */
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Step indicator used by the job card and invoice pipelines.
 * Done = brand check, current = pulsing brand dot, upcoming = muted.
 * Horizontal by default; vertical for narrow (mobile) containers.
 */
export function WorkflowStepper({ steps, currentIndex, allDone = false, failed = false, size = 'md', orientation = 'horizontal' }: WorkflowStepperProps) {
  const dot = size === 'sm' ? 'w-5 h-5' : 'w-7 h-7';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  if (orientation === 'vertical') {
    return (
      <div className="flex flex-col" role="list" aria-label="Workflow progress">
        {steps.map((step, i) => {
          const isDone = allDone || i < currentIndex;
          const isCurrent = !allDone && i === currentIndex;
          const isFailed = failed && isCurrent;

          return (
            <div key={step.key} role="listitem" className="flex items-stretch gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`${dot} rounded-full flex items-center justify-center flex-shrink-0 ${isCurrent && !isFailed ? 'animate-pulse' : ''}`}
                  style={{
                    background: isFailed
                      ? 'var(--color-error)'
                      : isDone
                        ? 'var(--color-primary)'
                        : isCurrent
                          ? 'var(--color-primary-tint)'
                          : 'var(--color-border-light)',
                    border: isCurrent && !isFailed ? '2px solid var(--color-primary)' : 'none',
                  }}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isDone && <Check className={iconSize} style={{ color: '#fff' }} />}
                  {isFailed && <X className={iconSize} style={{ color: '#fff' }} />}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="w-0.5 flex-1"
                    style={{ minHeight: 14, background: isDone ? 'var(--color-primary)' : 'var(--color-border-light)' }}
                  />
                )}
              </div>
              <span
                className={`leading-tight ${i < steps.length - 1 ? 'pb-3' : ''}`}
                style={{
                  fontSize: size === 'sm' ? '12px' : '13px',
                  fontWeight: isCurrent ? 600 : 500,
                  paddingTop: size === 'sm' ? 2 : 5,
                  color: isFailed
                    ? 'var(--color-error)'
                    : isCurrent
                      ? 'var(--color-primary)'
                      : isDone
                        ? 'var(--color-text-secondary)'
                        : 'var(--color-text-muted)',
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-start w-full" role="list" aria-label="Workflow progress">
      {steps.map((step, i) => {
        const isDone = allDone || i < currentIndex;
        const isCurrent = !allDone && i === currentIndex;
        const isFailed = failed && isCurrent;

        return (
          <div key={step.key} role="listitem" className="flex-1 flex flex-col items-center min-w-0">
            <div className="flex items-center w-full">
              {/* Left connector */}
              <div
                className="flex-1 h-0.5"
                style={{
                  background: i === 0 ? 'transparent' : isDone || isCurrent ? 'var(--color-primary)' : 'var(--color-border-light)',
                }}
              />
              {/* Dot */}
              <div
                className={`${dot} rounded-full flex items-center justify-center flex-shrink-0 ${isCurrent && !isFailed ? 'animate-pulse' : ''}`}
                style={{
                  background: isFailed
                    ? 'var(--color-error, var(--color-error))'
                    : isDone
                      ? 'var(--color-primary)'
                      : isCurrent
                        ? 'var(--color-primary-tint)'
                        : 'var(--color-border-light)',
                  border: isCurrent && !isFailed ? '2px solid var(--color-primary)' : 'none',
                }}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isDone && <Check className={iconSize} style={{ color: '#fff' }} />}
                {isFailed && <X className={iconSize} style={{ color: '#fff' }} />}
              </div>
              {/* Right connector */}
              <div
                className="flex-1 h-0.5"
                style={{
                  background: i === steps.length - 1 ? 'transparent' : isDone ? 'var(--color-primary)' : 'var(--color-border-light)',
                }}
              />
            </div>
            <span
              className="mt-1.5 text-center px-0.5 leading-tight"
              style={{
                fontSize: size === 'sm' ? '10px' : '11px',
                fontWeight: isCurrent ? 600 : 500,
                color: isFailed
                  ? 'var(--color-error, var(--color-error))'
                  : isCurrent
                    ? 'var(--color-primary)'
                    : isDone
                      ? 'var(--color-text-secondary)'
                      : 'var(--color-text-muted)',
              }}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
