import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { buildWeeklyDigestData, generateWeeklyDigestPDF } from '../utils/weeklyDigest';

interface EmailDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmailDigestModal({ isOpen, onClose }: EmailDigestModalProps) {
  // Same source as the downloadable PDF, so the preview and the report can
  // never show different numbers.
  const digest = useMemo(() => buildWeeklyDigestData(), []);
  const [downloading, setDownloading] = useState(false);

  const handleSend = () => {
    toast.success('Digest sent to rlawless@thechannelcompany.com!');
    onClose();
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateWeeklyDigestPDF(digest);
      toast.success('Weekly digest downloaded');
    } catch {
      toast.error('Could not generate the digest PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl rounded-2xl bg-[var(--color-surface-raised)] shadow-2xl overflow-hidden z-10 flex flex-col"
            style={{ maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Email header bar */}
            <div className="bg-gray-100 border-b border-gray-200 px-6 py-4 flex-shrink-0">
              <div className="space-y-1" style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-500 w-16">From:</span>
                  <span>reports@datamaticsbpm.com</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-500 w-16">To:</span>
                  <span>rlawless@thechannelcompany.com</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-500 w-16">Subject:</span>
                  <span className="font-medium text-gray-800">Your Weekly Campaign Performance Digest</span>
                </div>
              </div>
            </div>

            {/* Email body — scrollable */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <div className="max-w-xl mx-auto py-8 px-6">
                {/* Datamatics header */}
                <div
                  className="rounded-xl px-6 py-5 mb-6 text-center"
                  style={{ background: 'var(--color-primary)' }}
                >
                  <h1 className="text-white font-bold" style={{ fontSize: '20px', letterSpacing: '-0.02em' }}>
                    {digest.clientName}
                  </h1>
                  <p className="text-white/80" style={{ fontSize: '12px', marginTop: '2px' }}>
                    Weekly Campaign Digest · {digest.weekLabel}
                  </p>
                </div>

                {/* Sub-heading */}
                <div className="bg-[var(--color-surface-raised)] rounded-xl border border-gray-200 p-6 mb-5">
                  <h2
                    className="font-semibold text-gray-800 mb-1"
                    style={{ fontSize: '17px' }}
                  >
                    Weekly Performance Digest
                  </h2>
                  <p className="text-gray-500" style={{ fontSize: '13px' }}>
                    Prepared by {digest.preparedBy}, {digest.preparedByRole}
                  </p>

                  {/* 3 stat boxes */}
                  <div className="grid grid-cols-3 gap-3 mt-5">
                    {[
                      { label: 'Leads This Week', value: String(digest.totals.thisWeek) },
                      { label: 'Acceptance Rate', value: `${digest.quality.acceptanceRate}%` },
                      { label: 'Hot Leads (90+)', value: String(digest.quality.hotLeads) },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl p-3 text-center border"
                        style={{ background: 'rgba(186,32,39,0.04)', borderColor: 'rgba(186,32,39,0.12)' }}
                      >
                        <p
                          className="font-bold mb-1"
                          style={{ fontSize: '20px', color: 'var(--color-primary)', lineHeight: 1 }}
                        >
                          {stat.value}
                        </p>
                        <p className="text-gray-500" style={{ fontSize: '11px' }}>
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Per-campaign delivery for the week */}
                <div className="bg-[var(--color-surface-raised)] rounded-xl border border-gray-200 p-6 mb-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Delivery by campaign
                  </p>
                  <div className="space-y-3">
                    {digest.campaigns.map((c) => (
                      <div key={c.name}>
                        <div className="flex items-baseline justify-between gap-3 mb-1">
                          <span className="text-gray-700 truncate" style={{ fontSize: '12px', fontWeight: 500 }}>{c.name}</span>
                          <span className="flex-shrink-0 text-gray-500" style={{ fontSize: '11px' }}>
                            {c.thisWeek} this week · {c.delivered}/{c.target}
                          </span>
                        </div>
                        <div className="w-full rounded-full overflow-hidden" style={{ height: '6px', background: 'var(--color-progress-track)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${c.pct}%`, background: 'var(--color-progress)' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* View full report link */}
                <div className="text-center mb-6">
                  <a
                    href="#"
                    className="font-semibold text-sm hover:underline"
                    style={{ color: 'var(--color-primary)' }}
                    onClick={(e) => e.preventDefault()}
                  >
                    View full report →
                  </a>
                </div>

                {/* Footer */}
                <div className="text-center border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-400">
                    Datamatics Business Solutions · <span className="underline cursor-pointer">Unsubscribe</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-[var(--color-surface-raised)] flex-shrink-0">
              <button
                onClick={onClose}
                className="btn-outline px-5 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="btn-outline px-5 py-2 text-sm font-medium flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Preparing…' : 'Download PDF'}
              </button>
              <button
                onClick={handleSend}
                className="btn-primary px-5 py-2 text-sm font-semibold"
              >
                Send Digest Now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
