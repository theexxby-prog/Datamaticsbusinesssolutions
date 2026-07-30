import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';

interface AnimatedDonutChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function AnimatedDonutChart({ 
  percentage, 
  size = 200, 
  strokeWidth = 20, 
  color = 'var(--color-primary)' 
}: AnimatedDonutChartProps) {
  const animatedProgress = useMotionValue(0);
  const radius = (size / 2) - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  
  const strokeDashoffset = useTransform(
    animatedProgress,
    [0, 100],
    [circumference, 0]
  );

  useEffect(() => {
    const controls = animate(animatedProgress, percentage, {
      duration: 2,
      ease: [0.4, 0.0, 0.2, 1]
    });

    return controls.stop;
  }, [percentage, animatedProgress]);

  const center = size / 2;

  return (
    // `size` acts as a max — the donut shrinks with its container on narrow
    // screens while the viewBox keeps the geometry intact.
    <div className="relative w-full" style={{ maxWidth: size, aspectRatio: '1 / 1' }}>
      <svg className="transform -rotate-90 w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(186, 32, 39, 0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated progress circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div 
          style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 'var(--font-weight-light)', color: 'var(--color-text-primary)' }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {!isNaN(percentage) && isFinite(percentage) ? Math.round(percentage) : 0}%
        </motion.div>
      </div>
    </div>
  );
}