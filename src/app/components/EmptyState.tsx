import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  illustration
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-[var(--color-primary)]/10">
        {illustration || <Icon className="w-12 h-12 text-[var(--color-primary)]" />}
      </div>

      <h3 className="text-xl font-semibold mb-2 text-[var(--color-text-primary)]">
        {title}
      </h3>

      <p className="text-sm text-center max-w-md mb-6 text-[var(--color-text-secondary)]">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      )}

      <div className="mt-8 text-xs text-[#9E9E9E]">
        {actionLabel ? 'Get started by creating your first item' : 'Try adjusting your filters'}
      </div>
    </div>
  );
}
