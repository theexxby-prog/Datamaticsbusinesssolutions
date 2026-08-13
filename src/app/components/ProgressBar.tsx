import React, { useEffect, useRef, useState } from 'react';

interface ProgressBarProps {
  label: string;
  value: number | string;
  percentage: number;
  maxPercentage?: number;
  showBadge?: boolean;
  animationDelay?: number;
  valueColor?: string;
  badgeColorThresholds?: {
    high: number;
    medium: number;
  };
}

export function ProgressBar({
  label,
  value,
  percentage,
  maxPercentage = 100,
  showBadge = true,
  animationDelay = 0,
  valueColor,
  badgeColorThresholds = { high: 80, medium: 60 }
}: ProgressBarProps) {
  // Clamp bar width to [0, 100] relative to maxPercentage scale
  const targetWidth = Math.min(Math.max((percentage / maxPercentage) * 100, 0), 100);
  const [displayWidth, setDisplayWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayWidth(targetWidth);
    }, animationDelay + 80); // small offset so transition is visible on mount
    return () => clearTimeout(timer);
  }, [targetWidth, animationDelay]);

  const getBadgeColor = () => {
    if (percentage >= badgeColorThresholds.high) return 'bg-[var(--color-success)]/20 text-[var(--color-success)]';
    if (percentage >= badgeColorThresholds.medium) return 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]';
    return 'bg-[var(--color-error)]/20 text-[var(--color-error)]';
  };

  const defaultValueColor = valueColor || 'text-[var(--color-info)]';

  return (
    <div className="animate-slideInUp" style={{ animationDelay: `${animationDelay}ms` }}>
      {/* Label and Value Row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${defaultValueColor}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {showBadge && (
            <span className={`text-sm px-2 py-0.5 rounded-full font-bold ${getBadgeColor()}`}>
              {percentage}%
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar Track */}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: '6px', background: 'var(--color-progress-track)' }}
      >
        <div
          style={{
            height: '100%',
            width: `${displayWidth}%`,
            borderRadius: '9999px',
            background: 'var(--color-progress)',
            transition: 'width 0.75s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
    </div>
  );
}

// Simplified variant for inline display (no label/value)
interface SimpleProgressBarProps {
  percentage: number;
  height?: string;
  showPercentageText?: boolean;
  animationDelay?: number;
}

export function SimpleProgressBar({
  percentage,
  height = 'h-2',
  showPercentageText = false,
  animationDelay = 0,
}: SimpleProgressBarProps) {
  const targetWidth = Math.min(Math.max(percentage, 0), 100);
  const [displayWidth, setDisplayWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayWidth(targetWidth);
    }, animationDelay + 80);
    return () => clearTimeout(timer);
  }, [targetWidth, animationDelay]);

  return (
    <div className={`relative group w-full rounded-full overflow-hidden ${height}`}
      style={{ background: 'var(--color-progress-track)' }}
    >
      <div
        style={{
          height: '100%',
          width: `${displayWidth}%`,
          borderRadius: '9999px',
          background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))',
          transition: 'width 0.75s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
      {showPercentageText && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-text-primary)]">
          {percentage}%
        </span>
      )}
    </div>
  );
}