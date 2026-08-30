import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { Community, Post, User } from '../../types/index';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { PostCard } from '../feed/PostCard';
import { CreatePostModal } from '../feed/CreatePostModal';
import { CommunityVerificationModal } from './CommunityVerificationModal';
import { 
  Users, 
  Globe, 
  Lock, 
  ShieldAlert, 
  ShieldCheck, 
  Plus, 
  Check, 
  BookOpen, 
  FileText, 
  ArrowLeft,
  Share2,
  BadgeCheck,
  Trash2,
  Ban,
  Shield,
  AlertTriangle
} from 'lucide-react';

interface CommunityDetailViewProps {
  slug: string;
  onBack: () => void;
  onSelectUser: (username: string) => void;
  onSelectCommunity: (slug: string) => void;
}

export const CommunityDetailView: React.FC<CommunityDetailViewProps> = ({
  slug,
  onBack,
  onSelectUser,
  onSelectCommunity
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'feed' | 'rules' | 'members'>('feed');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isAdminOrMod = currentUser?.role === 'admin' || currentUser?.role === 'moderator';
  const isCommunityOwner = community?.ownerId === currentUser?.id;
  const canModerate = isAdminOrMod || isCommunityOwner || community?.members?.some(m => m.userId === currentUser?.id && m.role === 'moderator');

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      const commRes = await api.getCommunity(slug);
      const postsRes = await api.getPosts({ communityId: commRes.community.id });
      setCommunity(commRes.community);
      setPosts(postsRes.posts || []);
    } catch (err) {
      console.error('Failed to load community details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunityData();
  }, [slug]);

  const handleToggleJoin = async () => {
    if (!community || !currentUser) return;
    try {
      const res = await api.joinCommunity(community.id);
      const isMember = res.community.members?.some(m => m.userId === currentUser.id);
      setCommunity(res.community);
      showToast(isMember ? `Joined c/${community.slug}` : `Left c/${community.slug}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleToggleVerification = async () => {
    if (!community || !isAdminOrMod) return;
    try {
      setIsProcessing(true);
      const newStatus = !community.isVerified;
      const res = await api.verifyCommunityAdmin(community.id, newStatus);
      setCommunity(res.community);
      showToast(`Community ${newStatus ? 'verified' : 'unverified'} successfully!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Verification update failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!community) return;
    if (!window.confirm(`Are you sure you want to permanently delete c/${community.slug}? This cannot be undone.`)) {
      return;
    }
    try {
      setIsProcessing(true);
      await api.deleteCommunity(community.id);
      showToast(`Community c/${community.slug} deleted`, 'info');
      onBack();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete community', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBanMember = async (targetUserId: string, targetUsername: string) => {
    if (!community) return;
    if (!window.confirm(`Ban @${targetUsername} from c/${community.slug}?`)) {
      return;
    }
    try {
      setIsProcessing(true);
      const res = await api.banCommunityMember(community.id, targetUserId);
      setCommunity(res.community);
      showToast(`User @${targetUsername} banned from this community`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to ban member', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlatformBan = async (targetUserId: string, targetUsername: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (!window.confirm(`SUPER ADMIN ACTION: Permanently suspend @${targetUsername} platform-wide and purge their content?`)) {
      return;
    }
    try {
      setIsProcessing(true);
      await api.banUserAdmin(targetUserId, true);
      showToast(`User @${targetUsername} permanently banned platform-wide`, 'success');
      loadCommunityData();
    } catch (err: any) {
      showToast(err.message || 'Platform ban failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Community link copied!', 'success');
  };

  if (loading) {
    return <div className="py-16 text-center text-xs text-gray-500 dark:text-neutral-500">Loading community channel...</div>;
  }

  if (!community) {
    return (
      <div className="py-16 text-center p-8 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Community not found</h3>
        <button onClick={onBack} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          Return to All Communities
        </button>
      </div>
    );
  }

  return (
    <div id="community-detail-view" className="space-y-6 pb-12">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Communities</span>
      </button>

      {/* Admin / Mod Banner */}
      {canModerate && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Staff Moderation Controls {currentUser?.role === 'admin' ? '(Super Admin)' : '(Community Lead)'}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Manage verification status, member discipline, and community safety.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isAdminOrMod && (
              <button
                id="btn-verify-community"
                onClick={handleToggleVerification}
                disabled={isProcessing}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  community.isVerified
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>{community.isVerified ? 'Verified Community ✓' : 'Grant Community Verification'}</span>
              </button>
            )}

            {(currentUser?.role === 'admin' || isCommunityOwner) && (
              <button
                id="btn-delete-community"
                onClick={handleDeleteCommunity}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Community</span>
              </button>
            )}

            {!community.isVerified && (isCommunityOwner || isAdminOrMod) && (
              <button
                id="btn-request-verification-banner"
                onClick={() => setIsVerificationModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Request Verification Badge</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Community Header Card */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
        {/* Banner */}
        <div className="h-44 sm:h-56 w-full bg-gray-100 dark:bg-neutral-950 relative overflow-hidden">
          <img
            src={community.banner}
            alt={community.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-black/75 backdrop-blur-md text-white border border-white/10 flex items-center gap-1.5">
              {community.privacy === 'public' && <Globe className="w-3.5 h-3.5 text-emerald-400" />}
              {community.privacy === 'restricted' && <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
              {community.privacy === 'private' && <Lock className="w-3.5 h-3.5 text-red-400" />}
              <span>{community.privacy}</span>
            </span>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-black/75 backdrop-blur-md text-white border border-white/10 hover:bg-black/90 transition"
              title="Share Community"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <img
                src={community.avatar}
                alt={community.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-gray-200 dark:border-neutral-700 shadow-sm bg-gray-100 dark:bg-neutral-950 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{community.name}</h1>
                  {community.isVerified ? (
                    <VerifiedBadge size="md" type="organization" />
                  ) : community.verificationStatus === 'pending' ? (
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                      Audit Pending
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">c/{community.slug}</span>
              </div>
            </div>

            {currentUser && (
              <div className="flex items-center gap-2.5 flex-wrap">
                {!community.isVerified && (isCommunityOwner || canModerate) && (
                  <button
                    id="btn-request-verification-header"
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="px-3.5 py-2.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Request Badge</span>
                  </button>
                )}

                <button
                  onClick={handleToggleJoin}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                    community.members?.some(m => m.userId === currentUser.id)
                      ? 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-700'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  }`}
                >
                  {community.members?.some(m => m.userId === currentUser.id) ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Member</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Join Community</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsCreatePostOpen(true)}
                  className="px-4 py-2.5 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-800 dark:text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post to Community</span>
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-600 dark:text-neutral-300 leading-relaxed max-w-3xl mb-4">
            {community.description}
          </p>

          <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-neutral-400 pt-3 border-t border-gray-100 dark:border-neutral-800">
            <div>
              <strong className="text-gray-900 dark:text-white">{community.memberCount.toLocaleString()}</strong> Members
            </div>
            <div>
              <strong className="text-gray-900 dark:text-white">{posts.length}</strong> Discussions
            </div>
            <div>
              Status: <span className="font-semibold text-gray-800 dark:text-neutral-200">{community.isVerified ? 'Verified Organization' : 'Community'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-neutral-800 gap-4">
        <button
          onClick={() => setTab('feed')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 ${
            tab === 'feed' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Discussions ({posts.length})</span>
        </button>

        <button
          onClick={() => setTab('rules')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 ${
            tab === 'rules' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Rules & Guidelines ({community.rules?.length || 0})</span>
        </button>

        <button
          onClick={() => setTab('members')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 ${
            tab === 'members' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Leadership & Members ({community.members?.length || 0})</span>
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'feed' && (
        <div className="space-y-4 max-w-2xl mx-auto">
          {posts.length === 0 ? (
            <div className="py-12 text-center p-8 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm space-y-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">No discussions posted yet</p>
              <p className="text-xs text-gray-500 dark:text-neutral-400">Be the first to start a conversation in c/{community.slug}!</p>
              {currentUser && (
                <button
                  onClick={() => setIsCreatePostOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  Create First Post
                </button>
              )}
            </div>
          ) : (
            posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                onPostUpdated={loadCommunityData}
                onSelectUser={onSelectUser}
                onSelectCommunity={onSelectCommunity}
              />
            ))
          )}
        </div>
      )}

      {tab === 'rules' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Community Conduct Rules</span>
            </h3>

            <div className="space-y-3">
              {community.rules?.map((rule, idx) => {
                const ruleTitle = typeof rule === 'string' ? rule : rule.title || rule.description;
                const ruleDesc = typeof rule === 'string' ? '' : rule.description;
                return (
                  <div key={idx} className="p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="pt-0.5">
                      <p className="text-xs font-semibold text-gray-800 dark:text-neutral-200">{ruleTitle}</p>
                      {ruleDesc && ruleDesc !== ruleTitle && (
                        <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5 leading-relaxed">{ruleDesc}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Leadership & Active Members</h3>
            <div className="space-y-3 mb-6">
              {community.members?.map((m) => {
                const isMemberAdmin = m.role === 'owner' || m.role === 'moderator';
                const isSelf = m.userId === currentUser?.id;
                return (
                  <div key={m.userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={m.avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button onClick={() => onSelectUser(m.username)} className="text-xs font-bold text-gray-900 dark:text-white hover:underline truncate">
                            {m.displayName}
                          </button>
                          {m.isVerified && <VerifiedBadge size="sm" />}
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-neutral-400">@{m.username}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                        m.role === 'owner' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' :
                        m.role === 'moderator' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30' :
                        'bg-gray-200 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400'
                      }`}>
                        {m.role}
                      </span>

                      {/* Moderation actions for staff */}
                      {canModerate && !isSelf && !isMemberAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleBanMember(m.userId, m.username)}
                            title="Ban from this community"
                            className="p-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>

                          {currentUser?.role === 'admin' && (
                            <button
                              onClick={() => handlePlatformBan(m.userId, m.username)}
                              title="Super Admin: Permanently ban platform-wide"
                              className="p-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Create Post in Community Modal */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPostCreated={loadCommunityData}
        communities={[community]}
        initialCommunityId={community.id}
      />

      {/* Request Community Verification Modal */}
      <CommunityVerificationModal
        community={community}
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onSubmitted={loadCommunityData}
      />
    </div>
  );
};
