import { useNavigate } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PersonAvatar } from '../PersonAvatar';
import { roleLabel, type NavBadges, type NavItem } from '../../config/navigation';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '../ui/drawer';

interface MoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: NavItem[];
  badges: NavBadges;
}

// Bottom sheet opened from the tab bar's "More" tab. Lists every nav section
// that didn't get a tab slot, so no role loses functionality on mobile.
export function MoreSheet({ open, onOpenChange, items, badges }: MoreSheetProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="border-t"
        style={{ background: 'var(--color-main-bg)', borderColor: 'var(--color-border)' }}
      >
        <DrawerHeader className="pb-2 text-left">
          <DrawerTitle style={{ color: 'var(--color-text-primary)' }}>More</DrawerTitle>
          <DrawerDescription className="sr-only">All remaining sections</DrawerDescription>
        </DrawerHeader>

        <nav
          className="flex flex-col gap-1 px-3 pb-3 overflow-y-auto"
          style={{ maxHeight: '60vh' }}
        >
          {items.map(item => {
            const Icon = item.icon;
            const count = item.badgeKey ? badges[item.badgeKey] : 0;
            return (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className="flex min-h-[52px] items-center gap-3 rounded-xl px-3 transition-colors active:bg-[var(--color-surface)]"
              >
                <span
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'var(--color-primary-tint)' }}
                >
                  <Icon className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                </span>
                <span
                  className="flex-1 text-left"
                  style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)' }}
                >
                  {item.name}
                </span>
                {count > 0 && (
                  <span
                    className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-white"
                    style={{ background: 'var(--color-primary-solid)', fontSize: '11px', fontWeight: 700 }}
                  >
                    {count > 9 ? '9+' : count}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
              </button>
            );
          })}
        </nav>

        {/* Footer: identity, tap-through to Account */}
        <button
          onClick={() => go('/account')}
          className="mx-3 mb-3 flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors active:bg-[var(--color-surface)]"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface-raised)',
            marginBottom: 'calc(12px + env(safe-area-inset-bottom))',
          }}
        >
          <PersonAvatar name={currentUser?.name || ''} size={36} />
          <span className="min-w-0 flex-1 text-left">
            <span
              className="block truncate"
              style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}
            >
              {currentUser?.name || 'User'}
            </span>
            <span
              className="block truncate"
              style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}
            >
              {roleLabel(currentUser?.role)}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
        </button>
      </DrawerContent>
    </Drawer>
  );
}
