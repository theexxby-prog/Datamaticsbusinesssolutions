interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  return (
    <div
      className={`bg-gray-200/80 animate-shimmer ${variantClasses[variant]} ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.08) 100%)',
        backgroundSize: '1000px 100%'
      }}
    />
  );
}

// Table skeleton loader
export function TableSkeleton({ rows = 5, columns = 1 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="animate-fadeIn" style={{ animationDelay: `${rowIndex * 50}ms` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-6 py-4">
              <Skeleton className="h-8 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// Card skeleton loader
export function CardSkeleton() {
  return (
    <div className="rounded-2xl p-6 border border-[var(--color-primary)]/8 bg-[var(--color-surface-raised)]">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-24" variant="text" />
          <Skeleton className="h-10 w-32" variant="text" />
          <Skeleton className="h-3 w-40" variant="text" />
        </div>
        <Skeleton className="w-16 h-16" variant="circular" />
      </div>
    </div>
  );
}

// KPI Cards skeleton
export function KPICardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
