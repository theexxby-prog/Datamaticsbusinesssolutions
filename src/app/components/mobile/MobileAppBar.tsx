import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ChevronLeft, Bell, LogOut, Moon, Sun, UserCircle } from 'lucide-react';
import { Logo } from '../Logo';
import { PersonAvatar } from '../PersonAvatar';
import { NotificationPanel } from '../NotificationPanel';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { getPageMeta, roleLabel } from '../../config/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

// Sticky mobile top app bar — the phone counterpart of the desktop sidebar's
// header + footer: page title (or back chevron on detail pages), notification
// bell, and an avatar menu hosting the theme toggle, account link, and
// sign-out. Hidden at md and up.
export function MobileAppBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, signOut } = useAuth();
  const { resolved: resolvedTheme, toggle: toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();

  const [notifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  const { title, showBack } = getPageMeta(location.pathname, currentUser?.role);

  return (
    <header
      className="md:hidden sticky top-0 z-40 border-b"
      style={{
        background: 'var(--color-surface-raised)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderColor: 'var(--color-border)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div className="flex h-14 items-center gap-2 px-3">
        {/* Left: back chevron on detail pages, logo mark otherwise */}
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors active:bg-[var(--color-surface)]"
          >
            <ChevronLeft className="h-6 w-6" style={{ color: 'var(--color-text-primary)' }} />
          </button>
        ) : (
          <div className="flex h-11 w-11 items-center justify-center">
            <Logo className="h-8" collapsed />
          </div>
        )}

        <h1
          className="min-w-0 flex-1 truncate"
          style={{
            fontSize: '16px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: 'var(--color-text-primary)',
          }}
        >
          {title}
        </h1>

        {/* Notification bell — client role only, mirroring the sidebar */}
        {currentUser?.role === 'client' && (
          <>
            <button
              ref={bellRef}
              onClick={() => setNotifOpen(prev => !prev)}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors active:bg-[var(--color-surface)]"
            >
              <Bell className="h-5 w-5" style={{ color: 'var(--color-text-primary)' }} />
              {unreadCount > 0 && (
                <span
                  className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-white"
                  style={{ background: 'var(--color-primary-solid)', fontSize: '11px', fontWeight: 700 }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationPanel
              isOpen={notifOpen}
              onClose={() => setNotifOpen(false)}
              anchorRef={bellRef}
              isMobile={true}
            />
          </>
        )}

        {/* Avatar menu: account, theme toggle, sign out */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Account menu"
              className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors active:bg-[var(--color-surface)]"
            >
              <PersonAvatar name={currentUser?.name || ''} size={32} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="w-56">
            <DropdownMenuLabel>
              <div className="truncate" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {currentUser?.name || 'User'}
              </div>
              <div className="truncate" style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-text-muted)' }}>
                {roleLabel(currentUser?.role)}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/account')}>
              <UserCircle className="h-4 w-4" />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme}>
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                signOut();
                navigate('/');
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
