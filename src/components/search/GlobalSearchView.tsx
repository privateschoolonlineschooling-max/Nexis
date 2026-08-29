import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { User, Community, Post, MarketplaceListing } from '../../types/index';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { PostCard } from '../feed/PostCard';
import { ListingCard } from '../marketplace/ListingCard';
import { ListingDetailsModal } from '../marketplace/ListingDetailsModal';
import { ExternalPaymentModal } from '../common/ExternalPaymentModal';
import { 
  Search, 
  Users, 
  ShoppingBag, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Globe,
  UserPlus,
  UserCheck,
  MessageSquare,
  MapPin,
  ExternalLink,
  X
} from 'lucide-react';

interface GlobalSearchViewProps {
  initialQuery?: string;
  onSelectUser: (username: string) => void;
  onSelectCommunity: (slug: string) => void;
  onStartDM?: (userId: string) => void;
}

export const GlobalSearchView: React.FC<GlobalSearchViewProps> = ({
  initialQuery = '',
  onSelectUser,
  onSelectCommunity,
  onStartDM
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [query, setQuery] = useState(initialQuery || '');
  const [activeFilter, setActiveFilter] = useState<'all' | 'people' | 'communities' | 'posts' | 'listings'>('all');
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);

  // Following tracking state
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  // Modals
  const [selectedListingForDetails, setSelectedListingForDetails] = useState<MarketplaceListing | null>(null);
  const [selectedListingForPurchase, setSelectedListingForPurchase] = useState<MarketplaceListing | null>(null);

  // Load suggested users on mount if empty query
  useEffect(() => {
    api.getAllUsers()
      .then(res => {
        const publicUsers = (res.users || []).filter(u => u.id !== currentUser?.id);
        setSuggestedUsers(publicUsers.slice(0, 6));
      })
      .catch(() => {});
  }, [currentUser]);

  const performSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setUsers([]);
      setCommunities([]);
      setPosts([]);
      setListings([]);
      return;
    }
    try {
      setLoading(true);
      const res = await api.searchGlobal(trimmed);
      setUsers(res.results.users || []);
      setCommunities(res.results.communities || []);
      setPosts(res.results.posts || []);
      setListings(res.results.listings || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  // Debounced search when user types in the input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setUsers([]);
        setCommunities([]);
        setPosts([]);
        setListings([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleToggleFollow = async (targetUser: User, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast('Please sign in to follow members', 'info');
      return;
    }

    const currentStatus = followingMap[targetUser.id] ?? false;
    const nextStatus = !currentStatus;

    setFollowingMap(prev => ({ ...prev, [targetUser.id]: nextStatus }));

    try {
      await api.followUser(targetUser.id);
      showToast(nextStatus ? `Following @${targetUser.username}` : `Unfollowed @${targetUser.username}`, 'info');
    } catch (err: any) {
      setFollowingMap(prev => ({ ...prev, [targetUser.id]: currentStatus }));
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleMessageUser = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast('Please sign in to send messages', 'info');
      return;
    }
    if (onStartDM) {
      onStartDM(userId);
    }
  };

  const hasSearched = query.trim().length > 0;

  return (
    <div id="global-search-view" className="space-y-6 pb-12">
      {/* Search Input Box */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-5 h-5 text-gray-400 dark:text-neutral-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={query || ''}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username (@handle), name, bio keywords, communities, or items..."
            className="w-full pl-12 pr-28 py-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-24 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            Search
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `All Results (${users.length + communities.length + posts.length + listings.length})` },
            { id: 'people', label: `People & Creators (${users.length})` },
            { id: 'communities', label: `Communities (${communities.length})` },
            { id: 'posts', label: `Publications (${posts.length})` },
            { id: 'listings', label: `Marketplace (${listings.length})` }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                activeFilter === f.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400 dark:text-neutral-500 animate-pulse">
          Searching platform database for people and content...
        </div>
      ) : hasSearched ? (
        <div className="space-y-6">
          {/* People Section */}
          {(activeFilter === 'all' || activeFilter === 'people') && users.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>People & Creators ({users.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {users.map(u => {
                  const isSelf = currentUser?.id === u.id;
                  const isFollowing = followingMap[u.id] ?? false;

                  return (
                    <div
                      key={u.id}
                      onClick={() => onSelectUser(u.username)}
                      className="p-4 bg-white dark:bg-neutral-900 hover:border-blue-500/40 dark:hover:border-blue-500/40 border border-gray-200 dark:border-neutral-800 rounded-2xl flex flex-col justify-between cursor-pointer transition group shadow-sm"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={u.avatar}
                              alt={u.displayName}
                              className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-200 dark:border-neutral-700 group-hover:border-blue-500 transition"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                  {u.displayName}
                                </span>
                                {u.isVerified && <VerifiedBadge size="sm" type="user" />}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-neutral-400 truncate block">
                                @{u.username}
                              </span>
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 capitalize font-medium">
                                {u.role}
                              </span>
                            </div>
                          </div>
                        </div>

                        {u.bio && (
                          <p className="text-xs text-gray-600 dark:text-neutral-300 line-clamp-2 mb-3">
                            {u.bio}
                          </p>
                        )}

                        {u.location && (
                          <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-neutral-400 mb-3">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{u.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Action Controls */}
                      <div className="pt-3 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between gap-2 mt-auto">
                        <span className="text-[11px] text-gray-400 dark:text-neutral-500">
                          {u.followersCount || 0} followers
                        </span>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {!isSelf && onStartDM && (
                            <button
                              type="button"
                              onClick={(e) => handleMessageUser(u.id, e)}
                              className="p-1.5 rounded-lg bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 transition text-xs flex items-center gap-1"
                              title="Direct Message"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {!isSelf && (
                            <button
                              type="button"
                              onClick={(e) => handleToggleFollow(u, e)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                                isFollowing
                                  ? 'bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-neutral-200 border border-gray-300 dark:border-neutral-700'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                              }`}
                            >
                              {isFollowing ? (
                                <>
                                  <UserCheck className="w-3 h-3 text-emerald-600" />
                                  <span>Following</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-3 h-3" />
                                  <span>Follow</span>
                                </>
                              )}
                            </button>
                          )}

                          {isSelf && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-neutral-800 text-gray-500 font-medium">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Communities Section */}
          {(activeFilter === 'all' || activeFilter === 'communities') && communities.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Communities ({communities.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {communities.map(c => (
                  <div
                    key={c.id}
                    onClick={() => onSelectCommunity(c.slug)}
                    className="p-3.5 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-850 border border-gray-200 dark:border-neutral-800 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition group shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={c.avatar} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">{c.name}</span>
                          {c.isVerified && <VerifiedBadge size="sm" type="organization" />}
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-neutral-400 truncate block">c/{c.slug} • {c.memberCount} members</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 dark:text-neutral-500 group-hover:text-gray-900 dark:group-hover:text-white shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posts Section */}
          {(activeFilter === 'all' || activeFilter === 'posts') && posts.length > 0 && (
            <div className="space-y-3 max-w-2xl mx-auto">
              <h3 className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Discussions & Publications ({posts.length})</span>
              </h3>
              <div className="space-y-4">
                {posts.map(p => (
                  <PostCard
                    key={p.id}
                    post={p}
                    onPostUpdated={() => performSearch(query)}
                    onSelectUser={onSelectUser}
                    onSelectCommunity={onSelectCommunity}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Marketplace Section */}
          {(activeFilter === 'all' || activeFilter === 'listings') && listings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Marketplace Items ({listings.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </div>
          )}

          {users.length === 0 && communities.length === 0 && posts.length === 0 && listings.length === 0 && (
            <div className="py-12 text-center p-8 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl space-y-2 shadow-sm">
              <p className="text-sm font-bold text-gray-900 dark:text-white">No results found for "{query}"</p>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                Try searching for a member's @handle, display name, skills, or community topics.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Default Discovery / Suggested Members State */
        <div className="space-y-6">
          {suggestedUsers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Discover Members & Creators</span>
                </h3>
                <span className="text-xs text-gray-400">Type above to search anyone</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {suggestedUsers.map(u => (
                  <div
                    key={u.id}
                    onClick={() => onSelectUser(u.username)}
                    className="p-4 bg-white dark:bg-neutral-900 hover:border-blue-500/40 dark:hover:border-blue-500/40 border border-gray-200 dark:border-neutral-800 rounded-2xl flex flex-col justify-between cursor-pointer transition group shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={u.avatar}
                            alt={u.displayName}
                            className="w-11 h-11 rounded-full object-cover shrink-0 border border-gray-200 dark:border-neutral-700 group-hover:border-blue-500 transition"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                {u.displayName}
                              </span>
                              {u.isVerified && <VerifiedBadge size="sm" type="user" />}
                            </div>
                            <span className="text-[11px] text-gray-500 dark:text-neutral-400 truncate block">
                              @{u.username}
                            </span>
                          </div>
                        </div>
                      </div>

                      {u.bio && (
                        <p className="text-xs text-gray-600 dark:text-neutral-300 line-clamp-2 mb-2">
                          {u.bio}
                        </p>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between text-xs mt-auto">
                      <span className="text-[11px] text-gray-400 dark:text-neutral-500">
                        {u.followersCount || 0} followers
                      </span>
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        View Profile <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Listing Details Modal */}
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
    </div>
  );
};
