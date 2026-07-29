import { useState } from 'react';
import { X, Mail, Phone, Building2, MapPin, Calendar, Award, TrendingUp, MessageSquare, Clock, User, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Lead } from '../mockData';
import { formatDateLong, formatDateShort } from '../utils/formatDate';

interface LeadDetailDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (id: string, status: string) => void;
}

export function LeadDetailDrawer({ lead, isOpen, onClose, onStatusChange }: LeadDetailDrawerProps) {
  if (!lead) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-[#0F9D58] bg-[#0F9D58]/10 border-[#0F9D58]/20';
    if (score >= 75) return 'text-[#4285F4] bg-[#4285F4]/10 border-[#4285F4]/20';
    if (score >= 60) return 'text-[#F4B400] bg-[#F4B400]/10 border-[#F4B400]/20';
    return 'text-[#EA4335] bg-[#EA4335]/10 border-[#EA4335]/20';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Hot Lead';
    if (score >= 75) return 'Warm Lead';
    if (score >= 60) return 'Qualified';
    return 'Cold Lead';
  };

  // Mock activity history
  const activityHistory = [
    { date: '2026-02-28', type: 'Email Sent', description: 'Initial outreach email sent', user: 'System' },
    { date: '2026-02-27', type: 'Lead Delivered', description: 'Lead delivered to client portal', user: 'System' },
    { date: '2026-02-26', type: 'Verified', description: 'Contact information verified', user: 'QA Team' },
    { date: '2026-02-25', type: 'Created', description: 'Lead created and qualified', user: 'Research Team' },
  ];

  // Mock notes
  const notes = [
    { date: '2026-02-28', author: 'Renuka Lawless', text: 'Very interested in our cybersecurity solutions. Follow up next week.' },
    { date: '2026-02-26', author: 'Brijesh Singh', text: 'Company matches ICP perfectly. High potential for conversion.' },
  ];

  const isTerminal = lead.status === 'Accepted' || lead.status === 'Rejected';

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[90vw] md:w-[600px] lg:w-[700px] xl:max-w-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } bg-white shadow-2xl flex flex-col`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-4 py-4 md:px-6 border-b bg-white border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {lead.firstName} {lead.lastName}
              </h2>
              <p className="text-sm mt-1 text-gray-600">
                {lead.title} at {lead.company}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Lead Score Card */}
          <div className="rounded-xl p-5 bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-gray-900">
                Lead Score
              </h3>
              <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getScoreColor(lead.leadScore)}`}>
                {getScoreLabel(lead.leadScore)}
              </div>
            </div>
            <div className="flex items-end gap-3">
              <div className="text-4xl font-semibold text-gray-900">
                {lead.leadScore}
              </div>
              <div className="text-sm mb-2 text-gray-600">
                / 100
              </div>
            </div>
            <div className="mt-3 h-2 bg-black/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  lead.leadScore >= 90 ? 'bg-[#0F9D58]' :
                  lead.leadScore >= 75 ? 'bg-[#4285F4]' :
                  lead.leadScore >= 60 ? 'bg-[#F4B400]' : 'bg-[#EA4335]'
                }`}
                style={{ width: `${lead.leadScore}%` }}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="rounded-xl p-5 bg-gray-50 border border-gray-200">
            <h3 className="text-base font-medium mb-4 text-gray-900">
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 flex-shrink-0 text-gray-600" />
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <a href={`mailto:${lead.email}`} className="text-sm font-medium text-[#BA2027] hover:text-[#A01C22] flex items-center gap-1">
                    {lead.email}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 flex-shrink-0 text-gray-600" />
                <div>
                  <div className="text-sm text-gray-600">Phone</div>
                  <a href={`tel:${lead.phone}`} className="text-sm font-medium text-gray-900">
                    {lead.phone}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="rounded-xl p-5 bg-gray-50 border border-gray-200">
            <h3 className="text-base font-medium mb-4 text-gray-900">
              Company Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 flex-shrink-0 text-gray-600" />
                <div>
                  <div className="text-sm text-gray-600">Company</div>
                  <div className="text-sm font-medium text-gray-900">
                    {lead.company}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 flex-shrink-0 text-gray-600" />
                <div>
                  <div className="text-sm text-gray-600">Location</div>
                  <div className="text-sm font-medium text-gray-900">
                    {lead.location}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 flex-shrink-0 text-gray-600" />
                <div>
                  <div className="text-sm text-gray-600">Industry</div>
                  <div className="text-sm font-medium text-gray-900">
                    {lead.industry}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Info */}
          <div className="rounded-xl p-5 bg-gray-50 border border-gray-200">
            <h3 className="text-base font-medium mb-4 text-gray-900">
              Campaign Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 flex-shrink-0 text-gray-600" />
                <div>
                  <div className="text-sm text-gray-600">Campaign</div>
                  <div className="text-sm font-medium text-gray-900">
                    {lead.campaignName}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 flex-shrink-0 text-gray-600" />
                <div>
                  <div className="text-sm text-gray-600">Delivered</div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatDateLong(lead.deliveryDate)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity History */}
          <div className="rounded-xl p-5 bg-gray-50 border border-gray-200">
            <h3 className="text-base font-medium mb-4 text-gray-900">
              Activity History
            </h3>
            <div className="space-y-4">
              {activityHistory.map((activity, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#BA2027]/10">
                    <Clock className="w-4 h-4 text-[#BA2027]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium text-gray-900">
                        {activity.type}
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatDateShort(activity.date)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {activity.description}
                    </div>
                    <div className="text-xs mt-1 text-gray-500">
                      by {activity.user}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl p-5 bg-gray-50 border border-gray-200">
            <h3 className="text-base font-medium mb-4 text-gray-900">
              Notes
            </h3>
            <div className="space-y-4 mb-4">
              {notes.map((note, index) => (
                <div key={index} className="p-4 rounded-lg bg-white border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {note.author}
                    </span>
                    <span className="text-xs text-gray-600">
                      • {formatDateShort(note.date)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {note.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Add Note */}
            <div>
              <textarea
                placeholder="Add a note..."
                className="w-full px-4 py-3 rounded-lg border resize-none bg-white border-gray-200 text-gray-900 placeholder-gray-500 outline-none focus:border-[#BA2027] transition-colors"
                rows={3}
              />
              <button className="mt-3 px-4 py-2 bg-[#BA2027] hover:bg-[#A01C22] text-white rounded-lg transition-colors text-sm font-medium">
                Add Note
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Action Bar */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
          {isTerminal ? (
            lead.status === 'Accepted' ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 font-medium text-sm">
                <CheckCircle className="w-4 h-4" />
                ✓ Accepted
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 font-medium text-sm">
                <XCircle className="w-4 h-4" />
                ✗ Rejected
              </div>
            )
          ) : (
            <>
              <button
                onClick={() => {
                  onStatusChange?.(lead.id, 'Accepted');
                  toast.success('Lead accepted');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium text-sm transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Accept Lead
              </button>
              <button
                onClick={() => {
                  onStatusChange?.(lead.id, 'Rejected');
                  toast.error('Lead rejected');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium text-sm transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject Lead
              </button>
              <button
                onClick={() => {
                  onStatusChange?.(lead.id, 'Contacted');
                  toast.success('Lead marked as contacted');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm transition-colors"
              >
                <Mail className="w-4 h-4" />
                Mark Contacted
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
