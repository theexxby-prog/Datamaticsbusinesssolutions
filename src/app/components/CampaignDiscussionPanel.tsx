import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare } from 'lucide-react';
import { CampaignThread } from './thread/CampaignThread';
import type { CampaignActivity } from '../data/campaignActivities';

// ─── Campaign discussion, as a slide-in ──────────────────────────────────────
// The thread used to be pinned as a permanent column beside the analytics,
// taking two of five columns on every visit whether or not anyone was reading
// it. It is now opened deliberately from the header and slides in over the
// page, which gives the analytics the full width and keeps the conversation one
// click away rather than always present.
//
// Rendered as a fixed overlay rather than an in-flow column, so the page
// underneath never reflows when it opens.

interface CampaignDiscussionPanelProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  campaignName: string;
  activities?: CampaignActivity[];
}

export function CampaignDiscussionPanel({
  open, onClose, campaignId, campaignName, activities = [],
}: CampaignDiscussionPanelProps) {
  // Escape closes, and the page behind must not scroll while the panel is over
  // it — otherwise a trackpad flick scrolls the report rather than the thread.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(15, 23, 42, 0.35)', backdropFilter: 'blur(2px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`Discussion — ${campaignName}`}
            className="relative flex h-full w-full max-w-[460px] flex-col shadow-2xl"
            style={{ background: 'var(--color-surface-raised)', borderLeft: '1px solid var(--color-border)' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
          >
            <div
              className="flex flex-shrink-0 items-center justify-between gap-3 px-4 py-3"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <span className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                <MessageSquare className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                Discussion
                <span className="text-[11.5px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  Notes, documents and requests
                </span>
              </span>
              <button
                onClick={onClose}
                aria-label="Close discussion"
                className="tap-target-sq flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-primary-tint)]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* The thread owns its own scrolling; this wrapper just gives it the
                remaining height so the composer stays pinned at the bottom. */}
            <div className="relative min-h-0 flex-1 overflow-hidden p-3">
              <CampaignThread
                campaignId={campaignId}
                campaignName={campaignName}
                activities={activities}
                variant="rail"
                fill
              />
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
