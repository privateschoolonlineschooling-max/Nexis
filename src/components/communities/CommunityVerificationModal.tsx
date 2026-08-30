import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { Community } from '../../types/index';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { 
  ShieldCheck, 
  X, 
  Globe, 
  Link as LinkIcon, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Building2
} from 'lucide-react';

interface CommunityVerificationModalProps {
  community: Community;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const CommunityVerificationModal: React.FC<CommunityVerificationModalProps> = ({
  community,
  isOpen,
  onClose,
  onSubmitted
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [category, setCategory] = useState<'organization' | 'business' | 'creator' | 'community_leader'>('organization');
  const [entityName, setEntityName] = useState(community.name || '');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [proofLinks, setProofLinks] = useState('');
  const [statement, setStatement] = useState('');
  const [documentType, setDocumentType] = useState('entity_registration');
  const [documentNumber, setDocumentNumber] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      showToast('Please acknowledge the authenticity agreement', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const links = [
        websiteUrl.trim(),
        ...proofLinks.split('\n').map(l => l.trim()).filter(Boolean)
      ].filter(Boolean);

      await api.applyVerification({
        targetType: 'community',
        targetId: community.id,
        targetName: community.name,
        targetSlugOrUsername: community.slug,
        category: category as any,
        statement: `[Entity: ${entityName}] ${statement.trim()}`,
        officialLinks: links,
        documentType: `${documentType}: ${documentNumber.trim()}`
      });

      showToast('Community verification application queued for Trust & Safety review!', 'success');
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                Request Community Badge
                <VerifiedBadge size="sm" type="organization" />
              </h2>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                Official authenticity audit for <span className="font-semibold text-gray-800 dark:text-neutral-200">c/{community.slug}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Community Card Preview */}
        <div className="px-5 pt-4 pb-1">
          <div className="p-3 bg-gray-50 dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800 flex items-center gap-3">
            <img
              src={community.avatar}
              alt={community.name}
              className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-neutral-700"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{community.name}</span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">c/{community.slug}</span>
              </div>
              <span className="text-[11px] text-gray-500 dark:text-neutral-400 line-clamp-1">{community.description}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
              Organization / Project Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="organization">Official Organization / Non-Profit / University</option>
              <option value="business">Commercial Enterprise / Brand / Registered Company</option>
              <option value="creator">Creator Collective / Verified Media Hub</option>
              <option value="community_leader">Open-Source Project / Scientific Research Group</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
              Official Legal / Operating Entity Name
            </label>
            <input
              type="text"
              required
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              placeholder="e.g. NextGen Robotics Foundation or Acme Software Inc."
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
              Official Website or Project Repository URL
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="url"
                required
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.org or https://github.com/project"
                className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                Evidence Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="entity_registration">Entity Incorporation Proof</option>
                <option value="domain_dns">Domain / DNS Ownership Token</option>
                <option value="github_org">GitHub Org Admin Verification</option>
                <option value="trademark">Registered Trademark / Brand Record</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                Proof Reference / Tax ID / Token
              </label>
              <input
                type="text"
                required
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="e.g. REG-8839-AUTH or TXT token"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
              Social Proof & Associated Links (1 per line)
            </label>
            <textarea
              rows={2}
              value={proofLinks}
              onChange={(e) => setProofLinks(e.target.value)}
              placeholder="https://x.com/official_handle&#10;https://linkedin.com/company/official"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
              Statement of Authenticity & Purpose
            </label>
            <textarea
              rows={3}
              required
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="Explain how this community represents your official entity or project, and confirm your authorization as a leadership member."
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Guarantee */}
          <label className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
            />
            <span className="text-[11px] text-gray-600 dark:text-neutral-300 leading-relaxed">
              I certify that I am an authorized representative of <strong className="text-gray-900 dark:text-white">{community.name}</strong> and that all submitted evidence is valid and legitimate.
            </span>
          </label>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? 'Submitting Application...' : 'Submit Verification Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
