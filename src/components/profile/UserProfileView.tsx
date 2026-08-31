import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { User, Post, MarketplaceListing, Community } from '../../types/index';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { PostCard } from '../feed/PostCard';
import { ListingCard } from '../marketplace/ListingCard';
import { ListingDetailsModal } from '../marketplace/ListingDetailsModal';
import { ExternalPaymentModal } from '../common/ExternalPaymentModal';
import { EditProfileModal } from './EditProfileModal';
import { ReportModal } from '../common/ReportModal';
import { 
  Calendar, 
  MapPin, 
  Globe, 
  UserPlus, 
  UserCheck, 
  MessageSquare, 
  Settings, 
  MoreHorizontal, 
  Ban, 
  Flag, 
  ShoppingBag, 
  FileText, 
  Users, 
  ShieldCheck,
  ArrowLeft,
  Shield,
  ShieldAlert,
  Camera
} from 'lucide-react';

interface UserProfileViewProps {
  username?: string;
  onBack?: () => void;
  onSelectUser: (username: string) => void;
  onSelectCommunity: (slug: string) => void;
  onStartDM: (userId: string) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  username,
  onBack,
  onSelectUser,
  onSelectCommunity,
  onStartDM
}) => {
  const { currentUser, toggleFollow, blockUser } = useAuth();
  const { showToast } = useNotifications();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'posts' | 'marketplace' | 'communities'>('posts');

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedListingForDetails, setSelectedListingForDetails] = useState<MarketplaceListing | null>(null);
  const [selectedListingForPurchase, setSelectedListingForPurchase] = useState<MarketplaceListing | null>(null);

  const targetUsername = username || currentUser?.username;

  const loadUserData = async () => {
    if (!targetUsername) return;
    try {
      setLoading(true);
      const uRes = await api.getUserProfile(targetUsername);
      const user = uRes.user;
      setProfileUser(user);
      
      const [pRes, lRes, cRes] = await Promise.all([
        api.getPosts({ authorId: user.id }),
        api.getListings({ sellerId: user.id }),
        api.getCommunities()
      ]);
      setPosts(pRes.posts || []);
      setListings(lRes.listings || []);
      setCommunities(cRes.communities || []);
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [targetUsername]);

  if (loading) {
    return <div className="py-16 text-center text-xs text-gray-500 dark:text-neutral-500">Loading user profile...</div>;
  }

  if (!profileUser) {
    return (
      <div className="py-16 text-center p-8 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Profile not found</h3>
        {onBack && (
          <button onClick={onBack} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            Go back
          </button>
        )}
      </div>
    );
  }

  const isSelf = currentUser?.id === profileUser.id;
  const isFollowing = currentUser?.following.includes(profileUser.id);

  const handleFollow = async () => {
    if (!currentUser) return;
    const nowFollowing = await toggleFollow(profileUser.id);
    setProfileUser(prev => prev ? {
      ...prev,
      followersCount: nowFollowing ? prev.followersCount + 1 : Math.max(0, prev.followersCount - 1)
    } : null);
    showToast(nowFollowing ? `Following @${profileUser.username}` : `Unfollowed @${profileUser.username}`, 'info');
  };

  const handleBlock = async () => {
    if (window.confirm(`Are you sure you want to block @${profileUser.username}?`)) {
      await blockUser(profileUser.id);
      showToast(`Blocked @${profileUser.username}`, 'info');
      setShowMenu(false);
    }
  };

  return (
    <div id="user-profile-view" className="space-y-6 pb-12">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      )}

      {/* Profile Header Box */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
        {profileUser.accountStatus === 'banned' && (
          <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>This account has been permanently suspended for violating Trust & Safety guidelines.</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-white/20 uppercase tracking-wider text-[10px]">Suspended</span>
          </div>
        )}

        {/* Banner */}
        <div className="h-44 sm:h-56 w-full bg-gray-100 dark:bg-neutral-950 relative overflow-hidden border-b border-gray-200 dark:border-neutral-800 group">
          <img
            src={profileUser.banner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200'}
            alt=""
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {isSelf && (
            <button
              onClick={() => setIsEditOpen(true)}
              className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/75 hover:bg-black/90 backdrop-blur-md text-white rounded-xl text-xs font-medium flex items-center gap-1.5 border border-white/20 shadow-md transition cursor-pointer"
              title="Change Profile Banner (No link required)"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Change Banner</span>
            </button>
          )}
        </div>

        {/* Profile Content */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <img
                  src={profileUser.avatar}
                  alt={profileUser.displayName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-gray-200 dark:border-neutral-700 shadow-sm bg-gray-100 dark:bg-neutral-950"
                  referrerPolicy="no-referrer"
                />
                {isSelf && (
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center text-white text-[10px] font-semibold transition cursor-pointer"
                    title="Change Profile Picture (No link required)"
                  >
                    <Camera className="w-4 h-4 mb-0.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{profileUser.displayName}</h1>
                  {profileUser.isVerified && <VerifiedBadge size="md" type={profileUser.role === 'admin' ? 'organization' : 'user'} />}
                </div>
                <span className="text-xs text-gray-500 dark:text-neutral-400 font-mono">@{profileUser.username}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              {isSelf ? (
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-800 dark:text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Settings className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                      isFollowing
                        ? 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-700'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onStartDM(profileUser.id)}
                    className="p-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200 rounded-xl transition"
                    title="Send Direct Message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white rounded-xl transition"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {showMenu && (
                      <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-1 shadow-xl z-20 text-gray-700 dark:text-neutral-200 text-xs animate-in fade-in zoom-in-95 duration-100">
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            setShowReportModal(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 text-left"
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span>Report Account</span>
                        </button>
                        <button
                          onClick={handleBlock}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 text-left"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Block User</span>
                        </button>

                        {(currentUser?.role === 'admin' || currentUser?.role === 'moderator') && (
                          <>
                            <div className="border-t border-gray-100 dark:border-neutral-800 my-1" />
                            {profileUser.accountStatus === 'banned' ? (
                              <button
                                onClick={async () => {
                                  setShowMenu(false);
                                  try {
                                    await api.unbanUserAdmin(profileUser.id);
                                    showToast(`User @${profileUser.username} unbanned`, 'success');
                                    loadUserData();
                                  } catch (err: any) {
                                    showToast(err.message || 'Failed to unban user', 'error');
                                  }
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-left font-semibold"
                              >
                                <Shield className="w-3.5 h-3.5" />
                                <span>Staff: Unban User</span>
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  setShowMenu(false);
                                  if (window.confirm(`Are you sure you want to permanently ban @${profileUser.username} and delete their posts/listings?`)) {
                                    try {
                                      await api.banUserAdmin(profileUser.id, true);
                                      showToast(`User @${profileUser.username} banned & content purged`, 'success');
                                      loadUserData();
                                    } catch (err: any) {
                                      showToast(err.message || 'Failed to ban user', 'error');
                                    }
                                  }
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 text-left font-semibold"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>Staff: Ban & Purge</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bio */}
          {profileUser.bio && (
            <p className="text-xs text-gray-700 dark:text-neutral-200 leading-relaxed max-w-2xl mb-4">
              {profileUser.bio}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-neutral-400 mb-4">
            {profileUser.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500" />
                <span>{profileUser.location}</span>
              </span>
            )}

            {profileUser.website && (
              <a
                href={profileUser.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{profileUser.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}

            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500" />
              <span>Joined {new Date(profileUser.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
            </span>
          </div>

          {/* User Interests / Topics */}
          {profileUser.interests && profileUser.interests.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              <span className="text-[11px] font-semibold text-gray-400 dark:text-neutral-500 mr-1">
                Interests:
              </span>
              {profileUser.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 text-[11px] font-medium rounded-full"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}

          {/* Stats Bar */}
          <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-neutral-400 pt-3 border-t border-gray-100 dark:border-neutral-800">
            <div>
              <strong className="text-gray-900 dark:text-white">{profileUser.following.length}</strong> Following
            </div>
            <div>
              <strong className="text-gray-900 dark:text-white">{profileUser.followersCount}</strong> Followers
            </div>
            <div>
              <strong className="text-gray-900 dark:text-white">{posts.length}</strong> Posts
            </div>
            <div>
              <strong className="text-gray-900 dark:text-white">{listings.length}</strong> Products
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-neutral-800 gap-4">
        <button
          onClick={() => setTab('posts')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 ${
            tab === 'posts' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Posts & Insights ({posts.length})</span>
        </button>

        <button
          onClick={() => setTab('marketplace')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            tab === 'marketplace' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Storefront & Items ({listings.length})</span>
        </button>

        <button
          onClick={() => setTab('communities')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            tab === 'communities' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Joined Communities ({communities.filter(c => c.members?.some(m => m.userId === profileUser.id)).length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {tab === 'posts' && (
        <div className="space-y-4 max-w-2xl mx-auto">
          {posts.length === 0 ? (
            <div className="py-12 text-center p-8 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl text-xs text-gray-500 dark:text-neutral-400 shadow-sm">
              No publications posted yet.
            </div>
          ) : (
            posts.map(p => (
              <PostCard
                key={p.id}
                post={p}
                onPostUpdated={loadUserData}
                onSelectUser={onSelectUser}
                onSelectCommunity={onSelectCommunity}
              />
            ))
          )}
        </div>
      )}

      {tab === 'marketplace' && (
        <div>
          {listings.length === 0 ? (
            <div className="py-12 text-center p-8 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl text-xs text-gray-500 dark:text-neutral-400 shadow-sm">
              No marketplace listings published by this seller yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map(l => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  onOpenDetails={(item) => setSelectedListingForDetails(item)}
                  onInitiatePurchase={(item) => setSelectedListingForPurchase(item)}
                  onSelectSeller={onSelectUser}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'communities' && (
        <div>
          {(() => {
            const userJoined = communities.filter(c => c.members?.some(m => m.userId === profileUser.id));
            if (userJoined.length === 0) {
              return (
                <div className="py-12 text-center p-8 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl text-xs text-gray-500 dark:text-neutral-400 shadow-sm">
                  {isSelf ? "You haven't joined any communities yet." : `${profileUser.displayName} hasn't joined any public communities.`}
                </div>
              );
            }
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userJoined.map(c => (
                  <div
                    key={c.id}
                    onClick={() => onSelectCommunity(c.slug)}
                    className="p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 rounded-2xl cursor-pointer transition flex items-center gap-3.5 group shadow-sm"
                  >
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-neutral-700 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {c.name}
                        </h4>
                        {c.isVerified && <VerifiedBadge size="sm" type="organization" />}
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono block">c/{c.slug}</span>
                      <span className="text-[11px] text-gray-500 dark:text-neutral-400 block mt-0.5">
                        {c.memberCount.toLocaleString()} members
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          loadUserData();
        }}
      />

      {/* Details Modal */}
      <ListingDetailsModal
        listing={selectedListingForDetails}
        isOpen={!!selectedListingForDetails}
        onClose={() => setSelectedListingForDetails(null)}
        onInitiatePurchase={(item) => {
          setSelectedListingForDetails(null);
          setSelectedListingForPurchase(item);
        }}
        onSelectSeller={onSelectUser}
      />

      {/* External Checkout Modal */}
      {selectedListingForPurchase && (
        <ExternalPaymentModal
          listing={selectedListingForPurchase}
          isOpen={!!selectedListingForPurchase}
          onClose={() => setSelectedListingForPurchase(null)}
        />
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        category="user"
        targetId={profileUser.id}
        targetTitleOrSnippet={`@${profileUser.username}`}
      />
    </div>
  );
};
