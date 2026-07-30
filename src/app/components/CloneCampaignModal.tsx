import { motion, AnimatePresence } from 'motion/react';
import { Copy, X } from 'lucide-react';

interface CloneCampaignModalProps {
  isOpen: boolean;
  campaignName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function CloneCampaignModal({ isOpen, campaignName, onClose, onConfirm }: CloneCampaignModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal — full-screen on mobile, centered card on desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[101] flex flex-col sm:block sm:w-[480px] sm:rounded-2xl overflow-hidden"
            style={{
              background: 'var(--color-surface-raised)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.18)',
              border: '1px solid rgba(186,32,39,0.15)',
            }}
          >
            {/* Header */}
            <div
              className="px-6 py-5 flex items-center justify-between flex-shrink-0"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(186,32,39,0.08)' }}
                >
                  <Copy className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Clone this campaign?
                </h2>
              </div>
              <button onClick={onClose} className="btn-ghost p-2">
                <X className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6 flex-1">
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                This will create a new draft campaign pre-filled with the same details, targets, and delivery settings. You can edit before submitting.
              </p>

              <div
                className="mt-4 p-4 rounded-xl flex items-start gap-3"
                style={{ background: 'rgba(186,32,39,0.05)', border: '1px solid rgba(186,32,39,0.12)' }}
              >
                <Copy className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mb-1">
                    New campaign name
                  </p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {campaignName} — Copy
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Status will be set to <strong>Draft</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-6 py-4 flex flex-col-reverse sm:flex-row gap-3 flex-shrink-0"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              <button
                onClick={onClose}
                className="btn-outline px-5 py-2.5 flex-1 sm:flex-none"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="btn-primary px-5 py-2.5 flex-1 sm:flex-none flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Clone &amp; Edit
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
