import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { TaxInvoice } from '../types';
import { TaxInvoiceDocument } from './TaxInvoiceDocument';
import { generateTaxInvoicePDF } from '../utils/taxInvoicePdf';

interface TaxInvoiceModalProps {
  invoice: TaxInvoice | null;
  onClose: () => void;
}

/** Full-invoice viewer with a download that renders the same record to PDF. */
export function TaxInvoiceModal({ invoice, onClose }: TaxInvoiceModalProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!invoice) return;
    setDownloading(true);
    try {
      await generateTaxInvoicePDF(invoice);
      toast.success(`Invoice ${invoice.invoiceNumber} downloaded`);
    } catch {
      toast.error('Could not generate the invoice PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-4xl bg-[var(--color-surface-raised)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: '92vh' }}
            role="dialog"
            aria-modal="true"
            aria-label={`Invoice ${invoice.invoiceNumber}`}
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-gray-200 flex-shrink-0 bg-[var(--color-surface-raised)]">
              <div className="min-w-0">
                <div className="font-semibold text-sm text-gray-900 truncate">
                  Invoice {invoice.invoiceNumber}
                </div>
                <div className="text-xs text-gray-500">
                  {invoice.forMonth} · {invoice.serviceType}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
                >
                  {downloading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing…</>
                    : <><Download className="w-4 h-4" /> Download PDF</>}
                </button>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* The document */}
            <div className="flex-1 overflow-y-auto" style={{ background: 'var(--color-surface)' }}>
              <div className="mx-auto my-6 max-w-3xl shadow-sm rounded-lg overflow-hidden">
                <TaxInvoiceDocument invoice={invoice} />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
