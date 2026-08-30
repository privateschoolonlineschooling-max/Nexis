import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { Community, CommunityRole, Post, User } from '../../types/index';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { PostCard } from '../feed/PostCard';
import { CreatePostModal } from '../feed/CreatePostModal';
import { CommunityVerificationModal } from './CommunityVerificationModal';
import { EditCommunityModal } from './EditCommunityModal';
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
  AlertTriangle,
  Settings,
  Camera,
  Crown,
  UserCheck
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
  const [isEditCommunityOpen, setIsEditCommunityOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isPlatformAdmin = currentUser?.role === 'admin';
  const isPlatformMod = currentUser?.role === 'moderator';
  const isCommunityOwner = community?.ownerId === currentUser?.id;
  const isCommunityAdmin = community?.members?.some(m => m.userId === currentUser?.id && m.role === 'admin');
  const isCommunityMod = community?.members?.some(m => m.userId === currentUser?.id && m.role === 'moderator');

  const canModerate = isPlatformAdmin || isPlatformMod || isCommunityOwner || isCommunityAdmin || isCommunityMod;
  const canManageRoles = isPlatformAdmin || isCommunityOwner || isCommunityAdmin;
  const canEditCommunity = isPlatformAdmin || isCommunityOwner || isCommunityAdmin || isCommunityMod;

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

  const handleUpdateMemberRole = async (targetUserId: string, targetUsername: string, newRole: CommunityRole) => {
    if (!community) return;
    if (newRole === 'owner') {
      if (!window.confirm(`Transfer community ownership of c/${community.slug} to @${targetUsername}? You will become an admin.`)) {
        return;
      }
    }
    try {
      setIsProcessing(true);
      const res = await api.updateCommunityMemberRole(community.id, targetUserId, newRole);
      setCommunity(res.community);
      showToast(`Assigned ${newRole.toUpperCase()} role to @${targetUsername}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update member role', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleVerification = async () => {
    if (!community || (!isPlatformAdmin && !isPlatformMod)) return;
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
        <button onClick={onBack} className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
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
        className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
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
                Community Leadership & Moderation Controls {isPlatformAdmin ? '(Super Admin)' : isCommunityOwner ? '(Owner)' : isCommunityAdmin ? '(Admin)' : '(Moderator)'}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Manage branding profile & banner, assign member roles (Admin/Mod), and enforce community safety.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canEditCommunity && (
              <button
                id="btn-edit-community-banner"
                onClick={() => setIsEditCommunityOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-black dark:hover:bg-neutral-100 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Edit Profile & Banner</span>
              </button>
            )}

            {(isPlatformAdmin || isPlatformMod) && (
              <button
                id="btn-verify-community"
                onClick={handleToggleVerification}
                disabled={isProcessing}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  community.isVerified
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>{community.isVerified ? 'Verified Community ✓' : 'Grant Verification'}</span>
              </button>
            )}

            {(isPlatformAdmin || isCommunityOwner) && (
              <button
                id="btn-delete-community"
                onClick={handleDeleteCommunity}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Community</span>
              </button>
            )}

            {!community.isVerified && (isCommunityOwner || canModerate) && (
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
        {/* Banner with direct upload trigger */}
        <div className="h-44 sm:h-56 w-full bg-gray-100 dark:bg-neutral-950 relative overflow-hidden group">
          <img
            src={community.banner}
            alt={community.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />

          {canEditCommunity && (
            <button
              onClick={() => setIsEditCommunityOpen(true)}
              className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/75 hover:bg-black/90 backdrop-blur-md text-white rounded-xl text-xs font-medium flex items-center gap-1.5 border border-white/20 shadow-md transition cursor-pointer"
              title="Change Community Banner (No link required)"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Change Banner</span>
            </button>
          )}

          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-black/75 backdrop-blur-md text-white border border-white/10 flex items-center gap-1.5">
              {community.privacy === 'public' && <Globe className="w-3.5 h-3.5 text-emerald-400" />}
              {community.privacy === 'restricted' && <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
              {community.privacy === 'private' && <Lock className="w-3.5 h-3.5 text-red-400" />}
              <span>{community.privacy}</span>
            </span>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-black/75 backdrop-blur-md text-white border border-white/10 hover:bg-black/90 transition cursor-pointer"
              title="Share Community"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Info with Avatar direct edit */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <img
                  src={community.avatar}
                  alt={community.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-gray-200 dark:border-neutral-700 shadow-sm bg-gray-100 dark:bg-neutral-950"
                  referrerPolicy="no-referrer"
                />
                {canEditCommunity && (
                  <button
                    onClick={() => setIsEditCommunityOpen(true)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center text-white text-[10px] font-semibold transition cursor-pointer"
                    title="Change Community Profile Picture (No link required)"
                  >
                    <Camera className="w-4 h-4 mb-0.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

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
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-semibold">c/{community.slug}</span>
                  <span className="text-[11px] text-gray-400 dark:text-neutral-500">•</span>
                  <span className="text-[11px] text-gray-500 dark:text-neutral-400 font-medium">{community.category || 'General'}</span>
                </div>
              </div>
            </div>

            {currentUser && (
              <div className="flex items-center gap-2.5 flex-wrap">
                {canEditCommunity && (
                  <button
                    onClick={() => setIsEditCommunityOpen(true)}
                    className="px-3.5 py-2.5 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-800 dark:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Edit Community</span>
                  </button>
                )}

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
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
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
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-sm cursor-pointer"
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
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            tab === 'feed' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Discussions ({posts.length})</span>
        </button>

        <button
          onClick={() => setTab('rules')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            tab === 'rules' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Rules & Guidelines ({community.rules?.length || 0})</span>
        </button>

        <button
          onClick={() => setTab('members')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            tab === 'members' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Leadership & Roles ({community.members?.length || 0})</span>
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Community Conduct Rules</span>
              </h3>
              {canEditCommunity && (
                <button
                  onClick={() => setIsEditCommunityOpen(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                >
                  Edit Guidelines
                </button>
              )}
            </div>

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Community Members & Roles</h3>
                <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                  {canManageRoles ? 'Assign community roles: Moderator, Admin, or Member' : 'All active community members and leadership'}
                </p>
              </div>

              {canManageRoles && (
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  <span>Role Management Active</span>
                </span>
              )}
            </div>

            <div className="space-y-3 mb-6">
              {community.members?.map((m) => {
                const isSelf = m.userId === currentUser?.id;
                const isMemberOwner = m.role === 'owner';
                const isMemberAdmin = m.role === 'admin';
                const isMemberMod = m.role === 'moderator';

                return (
                  <div key={m.userId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={m.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 dark:border-neutral-800" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button onClick={() => onSelectUser(m.username)} className="text-xs font-bold text-gray-900 dark:text-white hover:underline truncate cursor-pointer">
                            {m.displayName}
                          </button>
                          {m.isVerified && <VerifiedBadge size="sm" />}
                          {isSelf && <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">(You)</span>}
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-neutral-400">@{m.username}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-end">
                      {/* Current Role Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
                        isMemberOwner ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' :
                        isMemberAdmin ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30' :
                        isMemberMod ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30' :
                        'bg-gray-200 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400'
                      }`}>
                        {isMemberOwner && <Crown className="w-3 h-3 text-amber-500" />}
                        {isMemberAdmin && <Shield className="w-3 h-3 text-indigo-500" />}
                        {isMemberMod && <ShieldCheck className="w-3 h-3 text-blue-500" />}
                        <span>{m.role}</span>
                      </span>

                      {/* Interactive Role Assignment Selector */}
                      {canManageRoles && !isSelf && (!isMemberOwner || isCommunityOwner || isPlatformAdmin) && (
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] font-semibold text-gray-500 dark:text-neutral-400 sr-only">
                            Change Role
                          </label>
                          <select
                            value={m.role}
                            disabled={isProcessing}
                            onChange={(e) => handleUpdateMemberRole(m.userId, m.username, e.target.value as CommunityRole)}
                            className="px-2.5 py-1 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="member">Member</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                            {(isCommunityOwner || isPlatformAdmin) && (
                              <option value="owner">Transfer Ownership (Owner)</option>
                            )}
                          </select>
                        </div>
                      )}

                      {/* Moderation actions for staff */}
                      {canModerate && !isSelf && !isMemberOwner && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleBanMember(m.userId, m.username)}
                            title="Ban from this community"
                            className="p-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-lg transition cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>

                          {isPlatformAdmin && (
                            <button
                              onClick={() => handlePlatformBan(m.userId, m.username)}
                              title="Super Admin: Permanently ban platform-wide"
                              className="p-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
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

      {/* Edit Community Branding & Profile Modal */}
      <EditCommunityModal
        community={community}
        isOpen={isEditCommunityOpen}
        onClose={() => setIsEditCommunityOpen(false)}
        onCommunityUpdated={(updated) => setCommunity(updated)}
      />

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
