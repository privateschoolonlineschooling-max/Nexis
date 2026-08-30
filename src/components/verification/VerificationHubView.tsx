import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { VerificationApplication, Community } from '../../types/index';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileText, 
  Globe, 
  Link as LinkIcon, 
  Users, 
  Building2, 
  User as UserIcon,
  Info,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export const VerificationHubView: React.FC = () => {
  const { currentUser, verifyEmail } = useAuth();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<'user' | 'community' | 'history'>('user');
  const [allApplications, setAllApplications] = useState<VerificationApplication[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  // User form fields
  const [userCategory, setUserCategory] = useState<'creator' | 'business' | 'developer' | 'community_lead'>('creator');
  const [userRealName, setUserRealName] = useState('');
  const [userDocType, setUserDocType] = useState('government_id');
  const [userDocNumber, setUserDocNumber] = useState('');
  const [userLinks, setUserLinks] = useState('');
  const [userStatement, setUserStatement] = useState('');
  const [userTermsAgreed, setUserTermsAgreed] = useState(false);

  // Community form fields
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [customCommunitySlug, setCustomCommunitySlug] = useState('');
  const [communityCategory, setCommunityCategory] = useState<'organization' | 'business' | 'creator' | 'community_leader'>('organization');
  const [communityEntityName, setCommunityEntityName] = useState('');
  const [communityWebsite, setCommunityWebsite] = useState('');
  const [communityDocType, setCommunityDocType] = useState('entity_registration');
  const [communityDocNumber, setCommunityDocNumber] = useState('');
  const [communityLinks, setCommunityLinks] = useState('');
  const [communityStatement, setCommunityStatement] = useState('');
  const [communityTermsAgreed, setCommunityTermsAgreed] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [verifRes, commRes] = await Promise.all([
        api.getMyVerifications().catch(() => ({ verifications: [] })),
        api.getCommunities().catch(() => ({ communities: [] }))
      ]);
      setAllApplications(verifRes.verifications || []);
      
      // Filter communities user owns or leads
      const userComms = (commRes.communities || []).filter(c => 
        currentUser && (c.creatorId === currentUser.id || c.ownerId === currentUser.id || c.members?.some(m => m.userId === currentUser.id && (m.role === 'moderator' || m.role === 'creator')))
      );
      setMyCommunities(userComms.length > 0 ? userComms : (commRes.communities || []));
      if (userComms.length > 0 && !selectedCommunityId) {
        setSelectedCommunityId(userComms[0].id);
      }
    } catch (err) {
      console.error('Failed to load verification hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const userApplication = allApplications.find(a => a.targetType === 'user');

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userTermsAgreed) {
      showToast('Please acknowledge the verification terms', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const links = userLinks.split('\n').map(l => l.trim()).filter(Boolean);
      await api.applyVerification({
        targetType: 'user',
        targetId: currentUser?.id,
        targetName: currentUser?.displayName,
        targetSlugOrUsername: currentUser?.username,
        category: userCategory as any,
        statement: `[Legal Name: ${userRealName.trim()}] ${userStatement.trim()}`,
        officialLinks: links,
        documentType: `${userDocType}: ${userDocNumber.trim()}`
      });
      showToast('Account verification submitted for review!', 'success');
      loadData();
      setActiveTab('history');
    } catch (err: any) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommunitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!communityTermsAgreed) {
      showToast('Please acknowledge the community authenticity terms', 'warning');
      return;
    }

    const comm = myCommunities.find(c => c.id === selectedCommunityId);
    const targetSlug = comm?.slug || customCommunitySlug.trim();
    if (!targetSlug) {
      showToast('Please select or specify a community slug', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const links = [
        communityWebsite.trim(),
        ...communityLinks.split('\n').map(l => l.trim()).filter(Boolean)
      ].filter(Boolean);

      await api.applyVerification({
        targetType: 'community',
        targetId: comm?.id || targetSlug,
        targetName: comm?.name || targetSlug,
        targetSlugOrUsername: targetSlug,
        category: communityCategory as any,
        statement: `[Entity: ${communityEntityName.trim()}] ${communityStatement.trim()}`,
        officialLinks: links,
        documentType: `${communityDocType}: ${communityDocNumber.trim()}`
      });

      showToast('Community verification submitted for review!', 'success');
      loadData();
      setActiveTab('history');
    } catch (err: any) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isEmailVerified = currentUser?.isEmailVerified || currentUser?.settings?.emailVerified;

  return (
    <div id="verification-hub-container" className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Trust & Verification Hub</h1>
                <VerifiedBadge size="md" />
              </div>
              <p className="text-xs text-gray-500 dark:text-neutral-400">Authenticity confirmation and official entity verification program</p>
            </div>
          </div>

          <button
            onClick={loadData}
            className="px-3.5 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <p className="text-xs text-gray-600 dark:text-neutral-300 leading-relaxed mb-4">
          Nexis provides verified authenticity badges for prominent personal creators, public figures, registered organizations, and active community hubs to guarantee authenticity and prevent impersonation.
        </p>

        {/* Anti-Pay-to-Play Platform Guarantee */}
        <div className="p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-700 dark:text-neutral-300 leading-relaxed">
            <strong className="text-gray-900 dark:text-white block mb-0.5">Strict Non-Monetized Authenticity Policy</strong>
            Verification badges <strong>cannot be purchased</strong>. Every badge is granted strictly through rigorous human review conducted by our Trust & Safety staff.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-neutral-800 gap-2 sm:gap-4 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab('user')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'user'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
              : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>User Account Badge {currentUser?.isVerified && '✓'}</span>
        </button>

        <button
          onClick={() => setActiveTab('community')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'community'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
              : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Request Community Badge</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'history'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
              : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>My Requests ({allApplications.length})</span>
        </button>
      </div>

      {/* Tab: User Verification */}
      {activeTab === 'user' && (
        <div className="space-y-6">
          {currentUser?.isVerified ? (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 rounded-3xl space-y-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Your Account is Officially Verified
                    <VerifiedBadge size="md" />
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    Your authenticity has been confirmed. The verified badge appears automatically next to your username across posts, comments, marketplace listings, and direct messages.
                  </p>
                </div>
              </div>
            </div>
          ) : userApplication ? (
            <div className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {userApplication.status === 'pending' && <Clock className="w-6 h-6 text-amber-500" />}
                  {userApplication.status === 'verified' || userApplication.status === 'approved' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : null}
                  {userApplication.status === 'rejected' && <XCircle className="w-6 h-6 text-red-500" />}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Application Status: <span className="capitalize text-blue-600 dark:text-blue-400">{userApplication.status}</span>
                    </h3>
                    <span className="text-[11px] text-gray-500 dark:text-neutral-400">
                      Submitted on {new Date(userApplication.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-xl text-xs font-semibold uppercase tracking-wider ${
                  userApplication.status === 'pending'
                    ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                    : userApplication.status === 'verified' || userApplication.status === 'approved'
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                    : 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30'
                }`}>
                  {userApplication.status}
                </span>
              </div>

              <div className="p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-neutral-400">Track:</span>
                  <span className="font-semibold text-gray-900 dark:text-white capitalize">{userApplication.category}</span>
                </div>
                {userApplication.adminNotes && (
                  <div className="pt-2 border-t border-gray-200 dark:border-neutral-800">
                    <span className="text-gray-500 dark:text-neutral-400 block mb-1">Staff Review Notes:</span>
                    <p className="text-gray-700 dark:text-neutral-200">{userApplication.adminNotes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Apply for Account Verification</h3>
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                  Verify your identity as an individual creator, engineer, or public figure.
                </p>
              </div>

              {/* Requirements */}
              <div className="p-4 bg-gray-50 dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800 space-y-2.5">
                <span className="text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider block mb-1">
                  Eligibility Criteria
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
                  <span className="text-gray-600 dark:text-neutral-300">2. Profile Complete (Avatar, Display Name, Bio)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-neutral-300">3. Community Trust Score (No active strikes)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> In Good Standing
                  </span>
                </div>
              </div>

              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                    Verification Track
                  </label>
                  <select
                    value={userCategory}
                    onChange={(e) => setUserCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="creator">Creator / Public Figure / Educator</option>
                    <option value="developer">Open-Source Maintainer / Software Engineer</option>
                    <option value="business">Artisan Brand / Registered Enterprise</option>
                    <option value="community_lead">Community Organizer / Research Lead</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                    Full Legal or Operating Name
                  </label>
                  <input
                    type="text"
                    required
                    value={userRealName}
                    onChange={(e) => setUserRealName(e.target.value)}
                    placeholder="e.g. Alex Morgan or Nexis Labs"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                      Identity Proof Type
                    </label>
                    <select
                      value={userDocType}
                      onChange={(e) => setUserDocType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="government_id">Government Photo ID / Passport</option>
                      <option value="github_key">PGP / Verified GitHub / SSH Key</option>
                      <option value="business_reg">Business Incorporation Certificate</option>
                      <option value="official_domain">Domain Ownership / DNS Record</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                      Document ID / Proof Reference
                    </label>
                    <input
                      type="text"
                      required
                      value={userDocNumber}
                      onChange={(e) => setUserDocNumber(e.target.value)}
                      placeholder="e.g. DOC-99482-AUTH"
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                    Official Links & Portfolios (1 per line)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={userLinks}
                    onChange={(e) => setUserLinks(e.target.value)}
                    placeholder="https://github.com/yourhandle&#10;https://yourportfolio.com&#10;https://twitter.com/yourhandle"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                    Statement of Authenticity
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={userStatement}
                    onChange={(e) => setUserStatement(e.target.value)}
                    placeholder="Briefly state your purpose and role on the platform..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <label className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={userTermsAgreed}
                    onChange={(e) => setUserTermsAgreed(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
                  />
                  <span className="text-[11px] text-gray-600 dark:text-neutral-300 leading-relaxed">
                    I certify that all provided documentation is accurate. I understand that verified badges confirm identity authenticity and submitting fraudulent records will result in account suspension.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submitting ? 'Submitting Application...' : 'Submit Verification Application'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab: Community Verification */}
      {activeTab === 'community' && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Request Community Verified Badge</h3>
              <VerifiedBadge size="sm" type="organization" />
            </div>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Submit an authenticity application for a community, brand, research organization, or open-source group.
            </p>
          </div>

          <form onSubmit={handleCommunitySubmit} className="space-y-4">
            {/* Community Selection */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                Target Community
              </label>
              {myCommunities.length > 0 ? (
                <select
                  value={selectedCommunityId}
                  onChange={(e) => setSelectedCommunityId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {myCommunities.map(c => (
                    <option key={c.id} value={c.id}>
                      c/{c.slug} — {c.name} {c.isVerified ? '(Already Verified ✓)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={customCommunitySlug}
                  onChange={(e) => setCustomCommunitySlug(e.target.value)}
                  placeholder="Enter community slug e.g. robotics or design"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                Organization / Project Track
              </label>
              <select
                value={communityCategory}
                onChange={(e) => setCommunityCategory(e.target.value as any)}
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
                Official Entity Name
              </label>
              <input
                type="text"
                required
                value={communityEntityName}
                onChange={(e) => setCommunityEntityName(e.target.value)}
                placeholder="e.g. NextGen Robotics Foundation or Acme Labs LLC"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                Official Website or Primary Documentation URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="url"
                  required
                  value={communityWebsite}
                  onChange={(e) => setCommunityWebsite(e.target.value)}
                  placeholder="https://example.org or https://github.com/project"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                  Registration / Evidence Type
                </label>
                <select
                  value={communityDocType}
                  onChange={(e) => setCommunityDocType(e.target.value)}
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
                  Proof Reference / Token
                </label>
                <input
                  type="text"
                  required
                  value={communityDocNumber}
                  onChange={(e) => setCommunityDocNumber(e.target.value)}
                  placeholder="e.g. REG-8839-AUTH or TXT token"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                Official Social Profiles & Supporting Evidence (1 per line)
              </label>
              <textarea
                rows={2}
                value={communityLinks}
                onChange={(e) => setCommunityLinks(e.target.value)}
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
                value={communityStatement}
                onChange={(e) => setCommunityStatement(e.target.value)}
                placeholder="Explain how this community represents your official entity or project, and confirm your authorization as a leadership member."
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <label className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={communityTermsAgreed}
                onChange={(e) => setCommunityTermsAgreed(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
              />
              <span className="text-[11px] text-gray-600 dark:text-neutral-300 leading-relaxed">
                I certify that I am an authorized representative of this community and that all submitted evidence is valid and legitimate.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? 'Submitting Application...' : 'Submit Community Verification Request'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab: Applications History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {allApplications.length === 0 ? (
            <div className="p-8 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl text-center space-y-3 shadow-sm">
              <ShieldCheck className="w-10 h-10 text-gray-400 dark:text-neutral-600 mx-auto" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">No Verification Requests Found</h3>
              <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-sm mx-auto">
                You haven't submitted any verification applications yet. You can apply for a personal user badge or request verification for your communities.
              </p>
              <button
                onClick={() => setActiveTab('user')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Apply for Verification</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            allApplications.map(app => (
              <div
                key={app.id}
                className="p-5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl space-y-3 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      {app.targetType === 'community' ? <Building2 className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{app.targetName}</span>
                        {app.targetType === 'community' ? (
                          <VerifiedBadge size="sm" type="organization" />
                        ) : (
                          <VerifiedBadge size="sm" />
                        )}
                        <span className="text-[11px] font-mono text-gray-500 dark:text-neutral-400">
                          {app.targetType === 'community' ? `c/${app.targetSlugOrUsername}` : `@${app.targetSlugOrUsername}`}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500 dark:text-neutral-400">
                        Category: <strong className="capitalize text-gray-700 dark:text-neutral-300">{app.category}</strong> • Submitted {new Date(app.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-xl text-xs font-semibold uppercase tracking-wider self-start sm:self-auto ${
                    app.status === 'pending'
                      ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                      : app.status === 'verified' || app.status === 'approved'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                      : 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30'
                  }`}>
                    {app.status}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800 text-xs space-y-1.5">
                  <p className="text-gray-700 dark:text-neutral-300 line-clamp-2">
                    <strong className="text-gray-900 dark:text-white font-semibold">Statement:</strong> {app.statement}
                  </p>
                  {app.adminNotes && (
                    <div className="pt-2 border-t border-gray-200 dark:border-neutral-800">
                      <span className="text-gray-500 dark:text-neutral-400 block font-semibold mb-0.5">Staff Audit Feedback:</span>
                      <p className="text-gray-800 dark:text-neutral-200">{app.adminNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
