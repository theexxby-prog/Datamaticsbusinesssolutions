import { X, FileText, Send, Download } from 'lucide-react';
import { Logo } from './Logo';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

interface JobCardModalProps {
  campaign: any;
  onClose: () => void;
  isOpen?: boolean;
}

export function JobCardModal({ campaign, onClose, isOpen = true }: JobCardModalProps) {
  const { currentUser } = useAuth();
  // A client sees their own identity on the card; internal roles see the demo client.
  const isClient = currentUser?.role === 'client';
  const clientCompany = isClient ? currentUser?.company ?? '' : 'The Channel Company';
  const clientContact = isClient ? currentUser?.name ?? '' : 'Renuka Lawless';
  const clientEmail = isClient ? currentUser?.email ?? '' : 'rlawless@thechannelcompany.com';

  const handleSendForSignature = () => {
    toast.success('Job card sent for e-signature! Check your inbox.');
    onClose();
  };

  const handleDownloadPDF = () => {
    toast.success('Preparing PDF download…');
  };

  // Don't render if not open
  if (!isOpen) return null;

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-[var(--color-surface-raised)] backdrop-blur-lg rounded-2xl w-full max-w-[800px] max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Logo className="h-8" />
            </div>
            <div className="text-right">
              <div className="text-sm text-white/80">JOB CARD</div>
              <div className="text-xs text-white/60">JC-2026-001234</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 text-gray-900">
          {/* Client Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Client Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Company</div>
                <div className="font-medium">{clientCompany}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Contact Person</div>
                <div className="font-medium">{clientContact}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Email</div>
                <div className="font-medium">{clientEmail}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Phone</div>
                <div className="font-medium">+1 (415) 555-0123</div>
              </div>
            </div>
          </div>

          {/* Scope of Work */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Scope of Work</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>Generate and deliver {campaign.target} qualified leads</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>Conduct BANT verification on all leads before delivery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>Provide weekly delivery batches with detailed lead information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>30-day replacement guarantee for rejected leads</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>Weekly progress reports and campaign updates</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Campaign Criteria */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Campaign Criteria</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Geography</div>
                <div className="font-medium">{campaign.targeting?.geography || 'United States'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Industry</div>
                <div className="font-medium">{campaign.targeting?.industry || 'Technology'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Revenue Range</div>
                <div className="font-medium">{campaign.targeting?.revenue || '$10M - $50M'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Employee Count</div>
                <div className="font-medium">{campaign.targeting?.employees || '50-200'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Job Titles</div>
                <div className="font-medium">{campaign.targeting?.jobTitles || 'VP, Director, Manager'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Exclusions</div>
                <div className="font-medium">Competitors, Government</div>
              </div>
            </div>
          </div>

          {/* Commercial Terms */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Commercial Terms</h3>
            <div className="bg-purple-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Cost Per Lead</span>
                <span className="font-bold text-gray-900">${campaign.pricing?.cpl || 45}/lead</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Target Volume</span>
                <span className="font-bold text-gray-900">{campaign.target} leads</span>
              </div>
              <div className="border-t border-purple-200 pt-2 flex justify-between items-center">
                <span className="text-gray-700 font-semibold">Total Campaign Value</span>
                <span className="font-bold text-purple-600 text-xl">
                  ${((campaign.pricing?.cpl || 45) * campaign.target).toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-2">
                Payment Terms: Net 30 days from invoice date
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Terms & Conditions</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-600 space-y-2 max-h-32 overflow-y-auto">
              <p>1. Lead Quality: All leads will be verified to meet BANT criteria (Budget, Authority, Need, Timeline) before delivery.</p>
              <p>2. Replacement Policy: Client may reject leads within 30 days of delivery. Rejected leads will be replaced at no additional cost, subject to valid rejection reasons.</p>
              <p>3. Data Protection: Datamatics Business Solutions complies with GDPR, CCPA, and other applicable data protection regulations.</p>
              <p>4. Confidentiality: All campaign information and deliverables are confidential and protected under mutual NDA.</p>
              <p>5. Payment: Invoices will be issued based on accepted leads. Payment due within 30 days of invoice date.</p>
            </div>
          </div>

          {/* Signature Blocks */}
          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className="border-t-2 border-gray-300 pt-4">
              <div className="text-sm text-gray-600 mb-2">Client Signature</div>
              <div className="h-16 border-b-2 border-dashed border-gray-300 mb-2"></div>
              <div className="text-xs text-gray-500">{clientContact}</div>
              <div className="text-xs text-gray-500">{clientCompany}</div>
            </div>
            <div className="border-t-2 border-gray-300 pt-4">
              <div className="text-sm text-gray-600 mb-2">Datamatics Business Solutions Representative</div>
              <div className="h-16 border-b-2 border-dashed border-gray-300 mb-2"></div>
              <div className="text-xs text-gray-500">Sarah Johnson</div>
              <div className="text-xs text-gray-500">Account Manager</div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
          <div className="flex gap-4">
            <button
              onClick={handleSendForSignature}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send for E-Signature
            </button>
            <button
              onClick={handleDownloadPDF}
              className="bg-[var(--color-surface-raised)] hover:bg-gray-50 border-2 border-gray-300 text-gray-700 px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}