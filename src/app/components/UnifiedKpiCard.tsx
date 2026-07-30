import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';
import { memo } from 'react';
import { AnimatedCounter } from './AnimatedCounter';

interface UnifiedKpiCardProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  value: string | number;
  label: string;
  footer?: string;
  trend?: 'up' | 'down' | 'live' | 'none';
  trendValue?: number;
  index?: number;
}

export const UnifiedKpiCard = memo(function UnifiedKpiCard({
  icon: Icon,
  iconColor,
  iconBg,
  value,
  label,
  footer,
  trend = 'none',
  trendValue = 0,
  index = 0
}: UnifiedKpiCardProps) {
  const isPositive = trendValue >= 0;

  // Extract numeric value for animation
  const numericValue = typeof value === 'string' 
    ? parseInt(value.replace(/[^0-9]/g, '')) || 0
    : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      className="rounded-xl p-5 border flex flex-col gap-3 cursor-default bg-gradient-to-br from-white to-gray-50/50 border-[var(--color-primary)]/10 shadow-lg hover:shadow-2xl"
    >
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        
        {trend === 'live' ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-success)]">
            <motion.span 
              className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)]"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Live
          </span>
        ) : trend !== 'none' ? (
          <span className={`flex items-center gap-1.5 text-base font-bold ${
            isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
          }`}>
            {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            {Math.abs(trendValue)}%
          </span>
        ) : null}
      </div>

      <div>
        <div className="text-3xl font-bold tracking-tight leading-none text-[var(--color-text-primary)]">
          {typeof value === 'string' && value.includes('$') ? (
            <>
              $<AnimatedCounter end={numericValue} duration={2000} />
              {value.includes('K') && 'K'}
              {value.includes('M') && 'M'}
            </>
          ) : typeof value === 'string' && value.includes('%') ? (
            <>
              <AnimatedCounter end={numericValue} duration={2000} />%
            </>
          ) : typeof value === 'number' ? (
            <AnimatedCounter end={numericValue} duration={2000} />
          ) : (
            value
          )}
        </div>
        <div className="text-sm font-medium mt-2 text-[var(--color-text-secondary)]">
          {label}
        </div>
      </div>

      {footer && (
        <div className="text-xs pt-3 border-t text-[var(--color-text-muted)] border-gray-200">
          {footer}
        </div>
      )}
    </motion.div>
  );
});
