import { useEffect, useState } from 'react';

interface LeadScoreRingProps {
  score: number;
  size?: number;
  showLabel?: boolean;
}

export function LeadScoreRing({ score, size = 60, showLabel = true }: LeadScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const getColor = (score: number) => {
    if (score >= 90) return 'var(--color-success)';
    if (score >= 75) return 'var(--color-info)';
    if (score >= 60) return 'var(--color-warning)';
    return 'var(--color-text-secondary)';
  };

  const getLabel = (score: number) => {
    if (score >= 90) return 'Hot';
    if (score >= 75) return 'Warm';
    if (score >= 60) return 'Qualified';
    return 'Cold';
  };

  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const strokeColor = getColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* No dark: override. The grey ramp is mirrored in dark.css, so
            text-gray-900 already resolves light on a dark ground; adding one
            fights the mirror. */}
        <div className="text-base font-semibold text-gray-900">
          {score}
        </div>
        {showLabel && (
          <div className="text-[11px] uppercase tracking-wide font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {getLabel(score)}
          </div>
        )}
      </div>
    </div>
  );
}