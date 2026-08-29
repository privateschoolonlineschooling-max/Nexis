import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { VerificationApplication } from '../../types/index';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileText, 
  Link as LinkIcon, 
  UploadCloud, 
  AlertTriangle, 
  Sparkles,
  Info
} from 'lucide-react';

export const VerificationHubView: React.FC = () => {
  const { currentUser, verifyEmail } = useAuth();
  const { showToast } = useNotifications();

  const [application, setApplication] = useState<VerificationApplication | null>(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [category, setCategory] = useState<'creator' | 'business' | 'developer' | 'community_lead'>('creator');
  const [realName, setRealName] = useState('');
  const [documentType, setDocumentType] = useState('government_id');
  const [documentNumber, setDocumentNumber] = useState('');
  const [evidenceLinks, setEvidenceLinks] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getVerificationStatus();
      setApplication(res.application);
    } catch (err) {
      console.error('Failed to load verification application:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedDisclaimer) {
      showToast('Please acknowledge the verification integrity terms', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const links = evidenceLinks.split('\n').map(l => l.trim()).filter(Boolean);
      const res = await api.submitVerificationApplication({
        category,
        realName: realName.trim(),
        documentType,
        documentNumber: documentNumber.trim(),
        evidenceLinks: links,
        additionalNotes: additionalNotes.trim()
      });
      setApplication(res.application);
      showToast('Verification application submitted for staff audit!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isEmailVerified = currentUser?.isEmailVerified;

  return (
    <div id="verification-hub-container" className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Trust & Verification Hub</h1>
              <VerifiedBadge size="md" />
            </div>
            <p className="text-xs text-gray-500 dark:text-neutral-400">Authenticity confirmation and identity integrity program</p>
          </div>
        </div>

        <p className="text-xs text-gray-600 dark:text-neutral-300 leading-relaxed mb-4">
          Nexis provides verified authenticity badges to confirm that prominent accounts, verified creators, organizations, and open-source leads are who they claim to be.
        </p>

        {/* Anti-Pay-to-Play Platform Guarantee */}
        <div className="p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-700 dark:text-neutral-300 leading-relaxed">
            <strong className="text-gray-900 dark:text-white block mb-0.5">Strict Non-Monetized Authenticity Policy</strong>
            Verification badges <strong>cannot be purchased directly</strong>. Every badge is issued strictly through rigorous identity and legitimacy review conducted by our Trust & Safety staff.
          </div>
        </div>
      </div>

      {/* Account Verification Status Card */}
      {currentUser?.isVerified ? (
        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 rounded-3xl space-y-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Your Account is Verified
                <VerifiedBadge size="sm" />
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Your authentic identity has been audited and approved by the Nexis Trust & Safety team.
              </p>
            </div>
          </div>
        </div>
      ) : application ? (
        <div className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {application.status === 'pending' && <Clock className="w-6 h-6 text-amber-500" />}
              {application.status === 'approved' && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
              {application.status === 'rejected' && <XCircle className="w-6 h-6 text-red-500" />}
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Application Status: <span className="capitalize text-blue-600 dark:text-blue-400">{application.status}</span>
                </h3>
                <span className="text-[11px] text-gray-500 dark:text-neutral-400">
                  Submitted on {new Date(application.submittedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-xl text-xs font-semibold uppercase tracking-wider ${
              application.status === 'pending'
                ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                : application.status === 'approved'
                ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                : 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30'
            }`}>
              {application.status}
            </span>
          </div>

          <div className="p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-neutral-400">Category:</span>
              <span className="font-semibold text-gray-900 dark:text-white capitalize">{application.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-neutral-400">Full Legal / Entity Name:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{application.realName}</span>
            </div>
            {application.reviewerNotes && (
              <div className="pt-2 border-t border-gray-200 dark:border-neutral-800">
                <span className="text-gray-500 dark:text-neutral-400 block mb-1">Moderator Audit Notes:</span>
                <p className="text-gray-700 dark:text-neutral-200">{application.reviewerNotes}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Application Form */
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Apply for Identity Verification</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Complete the verification requirements below. Applications are reviewed manually within 24-48 hours.
            </p>
          </div>

          {/* Requirements Checklist */}
          <div className="p-4 bg-gray-50 dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800 space-y-2.5">
            <span className="text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider block mb-1">
              Prerequisite Eligibility Checks
            </span>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-neutral-300">1. Email Address Verified</span>
              {isEmailVerified ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <button
                  onClick={verifyEmail}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Verify Email Now
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-neutral-300">2. Complete Profile (Avatar, Display Name, Bio)</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-neutral-300">3. Positive Community Conduct (Zero Active Strikes)</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> In Good Standing
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                Verification Track
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="creator">Creator / Public Figure / Educator</option>
                <option value="business">Artisan Brand / Registered Enterprise / Manufacturer</option>
                <option value="developer">Open-Source Maintainer / Software Engineer</option>
                <option value="community_lead">Community Organizer / Research Lead</option>
              </select>
            </div>

            {/* Legal Name */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                Legal Individual or Entity Name
              </label>
              <input
                type="text"
                required
                value={realName || ''}
                onChange={(e) => setRealName(e.target.value)}
                placeholder="e.g. Alexandra Rivers or Nexus Labs Inc."
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Document Evidence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                  Identity Evidence Type
                </label>
                <select
                  value={documentType || 'government_id'}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="government_id">Government Photo ID / Passport</option>
                  <option value="business_reg">Business Registration / Articles of Inc</option>
                  <option value="official_domain">Domain Ownership / DNS Record Confirmation</option>
                  <option value="github_key">PGP / Verified GitHub / SSH Key</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                  Document ID / Reference Code
                </label>
                <input
                  type="text"
                  required
                  value={documentNumber || ''}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="e.g. DOC-99482-AUTH or DNS token"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Public Links */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                Official Links / Portfolios / Social Profiles (1 per line)
              </label>
              <textarea
                rows={3}
                required
                value={evidenceLinks || ''}
                onChange={(e) => setEvidenceLinks(e.target.value)}
                placeholder="https://github.com/yourhandle&#10;https://yourportfolio.com&#10;https://twitter.com/yourhandle"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
              />
            </div>

            {/* Additional Statement */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                Authenticity Statement
              </label>
              <textarea
                rows={2}
                value={additionalNotes || ''}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Briefly state your purpose and role on the platform..."
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Disclaimer Checkbox */}
            <label className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={Boolean(acceptedDisclaimer)}
                onChange={(e) => setAcceptedDisclaimer(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
              />
              <span className="text-[11px] text-gray-600 dark:text-neutral-300 leading-relaxed">
                I certify that all provided documentation is accurate. I understand that the verified badge confirms identity authenticity and that submitting fraudulent records results in permanent account termination.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting Application...' : 'Submit Verification Application'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
