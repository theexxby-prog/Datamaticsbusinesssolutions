import { X, Download, CreditCard, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate } from '../utils/formatDate';

interface Invoice {
  id: string;
  invoiceNumber: string;
  campaignName: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: string;
}

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export function InvoicePreviewModal({ isOpen, onClose, invoice }: InvoicePreviewModalProps) {
  return (
    <AnimatePresence>
      {isOpen && invoice && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border z-50 bg-white border-gray-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-[#BA2027]" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Invoice Preview
                  </h3>
                  <p className="text-sm text-gray-600">
                    {invoice.invoiceNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Invoice Content */}
            <div className="p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold mb-2 text-gray-900">
                    INVOICE
                  </h1>
                  <p className="text-sm text-gray-600">
                    {invoice.invoiceNumber}
                  </p>
                </div>
                <div className="text-right text-gray-700">
                  <p className="font-semibold mb-1">Datamatics Business Solutions</p>
                  <p className="text-sm">123 Business Park</p>
                  <p className="text-sm">Mumbai, India 400001</p>
                </div>
              </div>

              {/* Bill To & Details */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-600">BILL TO</h3>
                  <div className="text-gray-900">
                    <p className="font-semibold mb-1">The Channel Company</p>
                    <p className="text-sm">222 Third Street, Suite 2240</p>
                    <p className="text-sm">Cambridge, MA 02142</p>
                  </div>
                </div>
                <div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Issue Date:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(invoice.issueDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Due Date:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(invoice.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="border rounded-lg overflow-hidden mb-8 border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Quantity</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Rate</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-4 text-gray-700">
                        <div className="font-medium mb-1">{invoice.campaignName}</div>
                        <div className="text-sm text-gray-500">Lead generation services</div>
                      </td>
                      <td className="px-4 py-4 text-right text-gray-700">320</td>
                      <td className="px-4 py-4 text-right text-gray-700">${(invoice.amount / 320).toFixed(2)}</td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-900">${invoice.amount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm font-medium text-gray-900">${invoice.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tax (0%):</span>
                    <span className="text-sm font-medium text-gray-900">$0</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-[#BA2027]">${invoice.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className={`mt-8 p-4 rounded-lg ${
                invoice.status === 'Paid'
                  ? 'bg-green-500/10 border border-green-500/20'
                  : invoice.status === 'Overdue'
                  ? 'bg-red-500/10 border border-red-500/20'
                  : 'bg-blue-500/10 border border-blue-500/20'
              }`}>
                <p className={`text-sm font-medium ${
                  invoice.status === 'Paid'
                    ? 'text-green-500'
                    : invoice.status === 'Overdue'
                    ? 'text-red-500'
                    : 'text-blue-500'
                }`}>
                  Status: {invoice.status}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => alert('Download invoice')}
                className="flex-1 px-4 py-2.5 rounded-lg border transition-all flex items-center justify-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              {(invoice.status === 'Pending' || invoice.status === 'Overdue') && (
                <button
                  onClick={() => alert('Pay now')}
                  className="flex-1 px-4 py-2.5 rounded-lg text-white transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#BA2027] to-[#D32F2F]"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay Now
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
