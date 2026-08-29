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
  Sparkles
} from 'lucide-react';

interface CommunitiesListViewProps {
  onSelectCommunity: (slug: string) => void;
}

export const CommunitiesListView: React.FC<CommunitiesListViewProps> = ({ onSelectCommunity }) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

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

  const filteredCommunities = communities.filter(c => {
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create a New Community</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm">
        <div className="w-full sm:max-w-md relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search communities by title, keyword, or c/slug..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'public', 'restricted', 'private'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPrivacyFilter(p)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize shrink-0 transition ${
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
      ) : filteredCommunities.length === 0 ? (
        <div className="py-16 text-center p-8 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-3">
          <Users className="w-12 h-12 text-gray-400 dark:text-neutral-600 mx-auto" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No communities matched your query</h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-sm mx-auto">
            Try adjusting your search criteria or create your own community.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCommunities.map((c) => (
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
                <div className="absolute top-2 right-2">
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

                  {currentUser && (
                    <button
                      onClick={(e) => handleToggleJoin(e, c.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                        c.members?.some(m => m.userId === currentUser.id)
                          ? 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
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
          ))}
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
