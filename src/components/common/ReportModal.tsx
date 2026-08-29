import React, { useState } from 'react';
import { Flag, X, CheckCircle, ShieldAlert } from 'lucide-react';
import { ReportCategory, ReportReason } from '../../types/index';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ReportCategory;
  targetId: string;
  targetTitleOrSnippet: string;
}

const REPORT_REASONS: { value: ReportReason; label: string; desc: string }[] = [
  { value: 'spam', label: 'Spam or Automated Activity', desc: 'Repetitive messages, unwanted ads, or bot behavior.' },
  { value: 'harassment', label: 'Harassment or Abusive Conduct', desc: 'Bullying, threats, hate speech, or targeted attacks.' },
  { value: 'fraud_or_scam', label: 'Fraud, Scam, or Phishing', desc: 'Deceptive listings, fake giveaways, or phishing links.' },
  { value: 'prohibited_item', label: 'Prohibited Item / Service', desc: 'Weapons, illicit substances, or policy-violating goods.' },
  { value: 'impersonation', label: 'Impersonation or False Identity', desc: 'Pretending to be another creator, brand, or official staff.' },
  { value: 'inappropriate_content', label: 'Inappropriate or Explicit Content', desc: 'Nudity, graphic violence, or offensive media.' },
  { value: 'misinformation', label: 'Harmful Misinformation', desc: 'Dangerous health, safety, or election falsehoods.' },
  { value: 'other', label: 'Other Policy Violation', desc: 'Any other issue violating Community Guidelines.' }
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  category,
  targetId,
  targetTitleOrSnippet
}) => {
  const { showToast } = useNotifications();
  const [reason, setReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.submitReport({
        category,
        targetId,
        targetTitleOrSnippet,
        reason,
        details
      });
      setSubmitted(true);
      showToast('Report submitted to Trust & Safety team.', 'info');
      setTimeout(() => {
        setSubmitted(false);
        setDetails('');
        onClose();
      }, 2000);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="report-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="report-modal-card"
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl text-gray-900 dark:text-neutral-100"
      >
        <button
          onClick={onClose}
          id="close-report-modal"
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Thank You for Reporting</h3>
            <p className="text-sm text-gray-500 dark:text-neutral-400 max-w-sm mx-auto">
              Our Trust & Safety moderators will review this content against platform policies and take appropriate action.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Report Content</h3>
                <p className="text-xs text-gray-500 dark:text-neutral-400 capitalize">
                  Reporting {category}: <span className="text-gray-800 dark:text-neutral-200 italic font-medium">{targetTitleOrSnippet}</span>
                </p>
              </div>
            </div>

            {/* Reasons List */}
            <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                Select a Reason
              </label>
              {REPORT_REASONS.map(r => (
                <label
                  key={r.value}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition ${
                    reason === r.value
                      ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/40 text-red-900 dark:text-white'
                      : 'bg-white dark:bg-neutral-800/40 border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800/70'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="mt-0.5 text-red-600 focus:ring-red-500 bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
                  />
                  <div className="text-xs">
                    <div className="font-medium text-gray-900 dark:text-white">{r.label}</div>
                    <div className="text-gray-500 dark:text-neutral-400 text-[11px] mt-0.5">{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Additional details */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider block mb-1.5">
                Additional Details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide timestamps, context, or links if helpful..."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-neutral-500">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Reports are confidential</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-neutral-800 rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
