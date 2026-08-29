import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Post, Community } from '../../types/index';
import { PostCard } from './PostCard';
import { CreatePostModal } from './CreatePostModal';
import { 
  Sparkles, 
  UserCheck, 
  Megaphone, 
  Compass, 
  Plus, 
  RefreshCw, 
  Search, 
  Image as ImageIcon, 
  BarChart2, 
  Link as LinkIcon,
  Layers
} from 'lucide-react';

interface FeedViewProps {
  onSelectUser: (username: string) => void;
  onSelectCommunity: (slug: string) => void;
  selectedTag?: string;
  onClearTag?: () => void;
  onInitiatePurchase?: () => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  onSelectUser,
  onSelectCommunity,
  selectedTag,
  onClearTag
}) => {
  const { currentUser } = useAuth();
  const [feedType, setFeedType] = useState<'for-you' | 'following' | 'joined-communities' | 'announcements' | 'explore'>('for-you');
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [filterTag, setFilterTag] = useState<string>(selectedTag || '');

  useEffect(() => {
    if (selectedTag) setFilterTag(selectedTag);
  }, [selectedTag]);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const [postsRes, commsRes] = await Promise.all([
        api.getPosts({
          feedType,
          tag: filterTag || undefined
        }),
        api.getCommunities()
      ]);
      setPosts(postsRes.posts || []);
      setCommunities(commsRes.communities || []);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [feedType, filterTag]);

  return (
    <div id="feed-view-container" className="max-w-2xl mx-auto space-y-4 pb-12">
      {/* Feed Tabs Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-800 pb-3 gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              setFeedType('for-you');
              if (onClearTag) onClearTag();
              setFilterTag('');
            }}
            id="feed-tab-for-you"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              feedType === 'for-you' && !filterTag
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>For You</span>
          </button>

          <button
            onClick={() => {
              setFeedType('following');
              if (onClearTag) onClearTag();
              setFilterTag('');
            }}
            id="feed-tab-following"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              feedType === 'following'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Following</span>
          </button>

          {currentUser && (
            <button
              onClick={() => {
                setFeedType('joined-communities');
                if (onClearTag) onClearTag();
                setFilterTag('');
              }}
              id="feed-tab-joined-communities"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                feedType === 'joined-communities'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>My Circles</span>
            </button>
          )}

          <button
            onClick={() => {
              setFeedType('announcements');
              if (onClearTag) onClearTag();
              setFilterTag('');
            }}
            id="feed-tab-announcements"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              feedType === 'announcements'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Announcements</span>
          </button>

          <button
            onClick={() => {
              setFeedType('explore');
              if (onClearTag) onClearTag();
              setFilterTag('');
            }}
            id="feed-tab-explore"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              feedType === 'explore'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore</span>
          </button>
        </div>

        <button
          onClick={loadFeed}
          className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
          title="Refresh Feed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Active Hashtag Filter Banner */}
      {filterTag && (
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs text-blue-800 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Filtering by hashtag:</span>
            <span className="font-mono bg-blue-100 dark:bg-blue-800/40 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300">#{filterTag}</span>
          </div>
          <button
            onClick={() => {
              setFilterTag('');
              if (onClearTag) onClearTag();
            }}
            className="text-xs hover:underline text-blue-600 dark:text-blue-400 font-semibold"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Quick Composer Card */}
      {currentUser && (
        <div
          onClick={() => setIsCreateOpen(true)}
          className="p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm hover:border-gray-300 dark:hover:border-neutral-700 cursor-pointer transition"
        >
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.displayName}
              className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-neutral-700 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-500 dark:text-neutral-400">
              What's happening in your tech, craft, or design world?
            </div>
            <button
              type="button"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post</span>
            </button>
          </div>

          <div className="flex items-center gap-5 mt-3 pt-3 border-t border-gray-100 dark:border-neutral-800 text-xs text-gray-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition">
              <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Photos</span>
            </span>
            <span className="flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              <BarChart2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Poll</span>
            </span>
            <span className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              <LinkIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Link</span>
            </span>
          </div>
        </div>
      )}

      {/* Posts List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400 dark:text-neutral-500 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
          <p>Loading curated feed updates...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center p-8 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm space-y-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">No publications found</p>
          <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-sm mx-auto">
            {feedType === 'following'
              ? "You haven't followed any creators or members with recent posts yet."
              : 'Be the first to publish a post or explore other community channels.'}
          </p>
          {currentUser && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              Create Publication
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostUpdated={loadFeed}
              onSelectUser={onSelectUser}
              onSelectCommunity={onSelectCommunity}
              onSelectTag={(tag) => setFilterTag(tag)}
            />
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPostCreated={loadFeed}
        communities={communities}
      />
    </div>
  );
};
