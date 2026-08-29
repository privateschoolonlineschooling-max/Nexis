import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
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
  Globe 
} from 'lucide-react';

interface GlobalSearchViewProps {
  initialQuery?: string;
  onSelectUser: (username: string) => void;
  onSelectCommunity: (slug: string) => void;
}

export const GlobalSearchView: React.FC<GlobalSearchViewProps> = ({
  initialQuery = '',
  onSelectUser,
  onSelectCommunity
}) => {
  const [query, setQuery] = useState(initialQuery || '');
  const [activeFilter, setActiveFilter] = useState<'all' | 'people' | 'communities' | 'posts' | 'listings'>('all');
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);

  // Modals
  const [selectedListingForDetails, setSelectedListingForDetails] = useState<MarketplaceListing | null>(null);
  const [selectedListingForPurchase, setSelectedListingForPurchase] = useState<MarketplaceListing | null>(null);

  const performSearch = async (q: string) => {
    if (!q.trim()) return;
    try {
      setLoading(true);
      const res = await api.searchGlobal(q);
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div id="global-search-view" className="space-y-6 pb-12">
      {/* Search Input Box */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-5 h-5 text-gray-400 dark:text-neutral-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={query || ''}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords, @users, c/communities, or marketplace items..."
            className="w-full pl-12 pr-28 py-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
            { id: 'all', label: 'All Results' },
            { id: 'people', label: `People (${users.length})` },
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
        <div className="py-12 text-center text-xs text-gray-400 dark:text-neutral-500">Searching platform records...</div>
      ) : (
        <div className="space-y-6">
          {/* People Section */}
          {(activeFilter === 'all' || activeFilter === 'people') && users.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>People & Creators ({users.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => onSelectUser(u.username)}
                    className="p-3 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-850 border border-gray-200 dark:border-neutral-800 rounded-2xl flex items-center gap-3 text-left transition group shadow-sm"
                  >
                    <img
                      src={u.avatar}
                      alt={u.displayName}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 dark:border-neutral-700 group-hover:border-blue-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">{u.displayName}</span>
                        {u.isVerified && <VerifiedBadge size="sm" type={u.role === 'admin' ? 'organization' : 'user'} />}
                      </div>
                      <span className="text-[11px] text-gray-500 dark:text-neutral-400 truncate block">@{u.username}</span>
                    </div>
                  </button>
                ))}
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
              <p className="text-xs text-gray-500 dark:text-neutral-400">Try searching for broader keywords like "robotics", "design", or usernames like "alex".</p>
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
