import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { Community } from '../../types/index';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { CreateCommunityModal } from './CreateCommunityModal';
import { 
  Users, 
  Plus, 
  Search, 
  Globe, 
  Lock, 
  ShieldAlert, 
  Check, 
  ArrowRight,
  Sparkles,
  Layers,
  Compass,
  Crown,
  Shield,
  MessageSquare
} from 'lucide-react';

interface CommunitiesListViewProps {
  onSelectCommunity: (slug: string) => void;
}

export const CommunitiesListView: React.FC<CommunitiesListViewProps> = ({ onSelectCommunity }) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [mainTab, setMainTab] = useState<'explore' | 'joined'>('explore');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [privacyFilter, setPrivacyFilter] = useState<'all' | 'public' | 'restricted' | 'private'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const res = await api.getCommunities();
      setCommunities(res.communities || []);
    } catch (err) {
      console.error('Failed to load communities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  const handleToggleJoin = async (e: React.MouseEvent, communityId: string) => {
    e.stopPropagation();
    if (!currentUser) return;
    try {
      const res = await api.joinCommunity(communityId);
      const isMember = res.community.members?.some(m => m.userId === currentUser.id);
      setCommunities(prev => prev.map(c => {
        if (c.id === communityId) {
          return {
            ...res.community
          };
        }
        return c;
      }));
      showToast(isMember ? 'Joined community' : 'Left community', 'info');
    } catch (err: any) {
      showToast(err.message || 'Error joining community', 'error');
    }
  };

  const joinedCommunities = communities.filter(c => 
    currentUser ? c.members?.some(m => m.userId === currentUser.id) : false
  );

  const displayedList = (mainTab === 'joined' ? joinedCommunities : communities).filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrivacy = privacyFilter === 'all' || c.privacy === privacyFilter;
    return matchesSearch && matchesPrivacy;
  });

  return (
    <div id="communities-list-view" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="max-w-2xl relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
            <Users className="w-4 h-4" />
            <span>Discover & Lead Communities</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
            Connect with Dedicated Interest Circles
          </h1>
          <p className="text-xs text-gray-600 dark:text-neutral-300 leading-relaxed mb-4">
            Join vibrant discussions, participate in technical workshops, share research, and curate trusted spaces.
          </p>

          {currentUser && (
            <button
              onClick={() => setIsCreateOpen(true)}
              id="create-community-btn"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create a New Community</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Mode Navigation Tabs (Explore vs Joined) */}
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-neutral-800 pb-2">
        <button
          onClick={() => {
            setMainTab('explore');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            mainTab === 'explore'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Explore All Circles ({communities.length})</span>
        </button>

        {currentUser && (
          <button
            onClick={() => {
              setMainTab('joined');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              mainTab === 'joined'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>My Joined Communities</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              mainTab === 'joined'
                ? 'bg-white/20 text-white'
                : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
            }`}>
              {joinedCommunities.length}
            </span>
          </button>
        )}
      </div>

      {/* If on My Joined Communities, show brief stats banner */}
      {mainTab === 'joined' && (
        <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                Your Member Circles
              </h3>
              <p className="text-[11px] text-gray-600 dark:text-neutral-400">
                You are currently a participating member in {joinedCommunities.length} active communities.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 hover:border-gray-300 rounded-xl text-xs font-semibold text-gray-800 dark:text-neutral-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Circle</span>
            </button>
            <button
              onClick={() => setMainTab('explore')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Find More</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm">
        <div className="w-full sm:max-w-md relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={mainTab === 'joined' ? "Search your joined communities..." : "Search communities by title, keyword, or c/slug..."}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'public', 'restricted', 'private'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPrivacyFilter(p)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize shrink-0 transition cursor-pointer ${
                privacyFilter === p
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Communities */}
      {loading ? (
        <div className="py-16 text-center text-xs text-gray-500 dark:text-neutral-500">Loading communities...</div>
      ) : displayedList.length === 0 ? (
        <div className="py-16 text-center p-8 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-3">
          <Users className="w-12 h-12 text-gray-400 dark:text-neutral-600 mx-auto" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {mainTab === 'joined'
              ? (searchQuery ? `No joined communities matched "${searchQuery}"` : "You haven't joined any communities yet")
              : "No communities matched your query"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-sm mx-auto">
            {mainTab === 'joined'
              ? "Discover and join interest circles in technology, craftsmanship, design, and research to participate."
              : "Try adjusting your search criteria or create your own community."}
          </p>
          {mainTab === 'joined' && (
            <button
              onClick={() => setMainTab('explore')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <Compass className="w-4 h-4" />
              <span>Explore All Communities</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedList.map((c) => {
            const memberInfo = c.members?.find(m => m.userId === currentUser?.id);
            const isCreator = c.creatorId === currentUser?.id;
            const isMod = memberInfo?.role === 'moderator' || memberInfo?.role === 'creator';

            return (
              <div
                key={c.id}
                onClick={() => onSelectCommunity(c.slug)}
                className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 rounded-2xl overflow-hidden shadow-sm cursor-pointer transition flex flex-col group"
              >
                {/* Banner */}
                <div className="h-28 w-full bg-gray-100 dark:bg-neutral-950 relative overflow-hidden">
                  <img
                    src={c.banner}
                    alt={c.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    {isCreator && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white flex items-center gap-1 shadow-sm">
                        <Crown className="w-3 h-3" />
                        <span>Creator</span>
                      </span>
                    )}
                    {isMod && !isCreator && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-600 text-white flex items-center gap-1 shadow-sm">
                        <Shield className="w-3 h-3" />
                        <span>Moderator</span>
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/10 flex items-center gap-1">
                      {c.privacy === 'public' && <Globe className="w-3 h-3 text-emerald-400" />}
                      {c.privacy === 'restricted' && <ShieldAlert className="w-3 h-3 text-amber-400" />}
                      {c.privacy === 'private' && <Lock className="w-3 h-3 text-red-400" />}
                      <span>{c.privacy}</span>
                    </span>
                  </div>
                </div>

                {/* Info Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 -mt-9 mb-2">
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-white dark:border-neutral-900 shadow-md bg-gray-100 dark:bg-neutral-950 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 pt-6">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">
                            {c.name}
                          </h3>
                          {c.isVerified && <VerifiedBadge size="sm" type="organization" />}
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-neutral-400 font-mono">c/{c.slug}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-neutral-300 line-clamp-2 leading-relaxed mb-4">
                      {c.description}
                    </p>
                  </div>

                  {/* Footer with member count and join button */}
                  <div className="pt-3 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500 dark:text-neutral-400 font-medium">
                      {c.memberCount.toLocaleString()} members
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCommunity(c.slug);
                        }}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-neutral-300 flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>Enter</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {currentUser && (
                        <button
                          onClick={(e) => handleToggleJoin(e, c.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                            c.members?.some(m => m.userId === currentUser.id)
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                          }`}
                        >
                          {c.members?.some(m => m.userId === currentUser.id) ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Joined</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Join</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <CreateCommunityModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCommunityCreated={(slug) => {
          loadCommunities();
          onSelectCommunity(slug);
        }}
      />
    </div>
  );
};
