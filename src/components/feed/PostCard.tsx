import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { Post, Comment } from '../../types/index';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { ReportModal } from '../common/ReportModal';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share2, 
  MoreHorizontal, 
  Trash2, 
  Flag, 
  ExternalLink, 
  Check, 
  Send, 
  BarChart2, 
  Megaphone,
  Eye,
  ShieldAlert
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  onPostUpdated: () => void;
  onSelectUser: (username: string) => void;
  onSelectCommunity?: (slug: string) => void;
  onSelectTag?: (tag: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPostUpdated,
  onSelectUser,
  onSelectCommunity,
  onSelectTag
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(currentUser ? post.likes.includes(currentUser.id) : false);
  const [isBookmarked, setIsBookmarked] = useState(currentUser ? post.bookmarks.includes(currentUser.id) : false);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Menu & Report
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleLike = async () => {
    if (!currentUser) return;
    try {
      const res = await api.likePost(post.id);
      setIsLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch (err: any) {
      showToast(err.message || 'Error liking post', 'error');
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) return;
    try {
      const res = await api.bookmarkPost(post.id);
      setIsBookmarked(res.bookmarked);
      showToast(res.bookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks', 'info');
    } catch (err: any) {
      showToast(err.message || 'Error saving post', 'error');
    }
  };

  const handlePollVote = async (optionId: string) => {
    if (!currentUser) return;
    try {
      await api.votePoll(post.id, optionId);
      onPostUpdated();
      showToast('Vote recorded!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to vote', 'error');
    }
  };

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      try {
        setLoadingComments(true);
        const res = await api.getPost(post.id);
        setComments(res.comments || []);
      } catch (err) {
        console.error('Error fetching comments:', err);
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;
    try {
      setSubmittingComment(true);
      const res = await api.addComment(post.id, newComment.trim());
      setComments(prev => [...prev, res.comment]);
      setCommentsCount(prev => prev + 1);
      setNewComment('');
      showToast('Comment posted', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this publication?')) return;
    try {
      await api.deletePost(post.id);
      showToast('Post removed', 'info');
      onPostUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete post', 'error');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/#post-${post.id}`);
    showToast('Post link copied to clipboard!', 'success');
  };

  const isAuthor = currentUser?.id === post.authorId;
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  // Format content with hashtags and mentions
  const renderFormattedContent = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        const tag = part.slice(1).toLowerCase();
        return (
          <button
            key={index}
            onClick={() => onSelectTag && onSelectTag(tag)}
            className="text-blue-500 dark:text-blue-400 hover:underline font-medium inline cursor-pointer"
          >
            {part}
          </button>
        );
      }
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <button
            key={index}
            onClick={() => onSelectUser(username)}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium inline cursor-pointer"
          >
            {part}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Calculate poll votes
  const totalPollVotes = post.pollOptions?.reduce((sum, opt) => sum + opt.votes, 0) || 0;

  return (
    <article
      id={`post-card-${post.id}`}
      className={`bg-white dark:bg-neutral-900 border rounded-2xl p-5 shadow-sm transition ${
        post.isAnnouncement
          ? 'border-amber-400 dark:border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/10'
          : 'border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700'
      }`}
    >
      {/* Announcement Banner if applicable */}
      {post.isAnnouncement && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 mb-3 px-3 py-1 bg-amber-100/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl w-fit">
          <Megaphone className="w-3.5 h-3.5" />
          <span>Official Platform Announcement</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => onSelectUser(post.authorUsername)}
            className="shrink-0 group"
          >
            <img
              src={post.authorAvatar}
              alt={post.authorDisplayName}
              className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-neutral-700 group-hover:border-blue-500 transition"
              referrerPolicy="no-referrer"
            />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => onSelectUser(post.authorUsername)}
                className="text-xs font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate transition"
              >
                {post.authorDisplayName}
              </button>
              {post.authorVerified && <VerifiedBadge size="sm" />}
              <span className="text-[11px] text-gray-500 dark:text-neutral-400">@{post.authorUsername}</span>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-neutral-400 mt-0.5">
              <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              {post.communityName && (
                <>
                  <span>•</span>
                  <button
                    onClick={() => post.communitySlug && onSelectCommunity && onSelectCommunity(post.communitySlug)}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold truncate"
                  >
                    c/{post.communityName}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-1 shadow-xl z-20 text-gray-700 dark:text-neutral-200 text-xs animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleShare();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 text-left"
              >
                <Share2 className="w-3.5 h-3.5 text-gray-500 dark:text-neutral-400" />
                <span>Share Link</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowReportModal(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 text-left"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report Post</span>
              </button>

              {(isAuthor || isStaff) && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleDeletePost();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 text-left border-t border-gray-100 dark:border-neutral-800 mt-1 pt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Post</span>
                </button>
              )}

              {isStaff && !isAuthor && (
                <button
                  onClick={async () => {
                    setShowMenu(false);
                    if (window.confirm(`Staff Action: Ban author @${post.authorUsername} and purge all their content?`)) {
                      try {
                        await api.banUserAdmin(post.authorId, true);
                        showToast(`User @${post.authorUsername} banned & content purged`, 'success');
                        onPostUpdated();
                      } catch (err: any) {
                        showToast(err.message || 'Failed to ban author', 'error');
                      }
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 text-left"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Staff: Ban Author</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 leading-snug">
          {post.title}
        </h3>
      )}

      {/* Main Text Content */}
      <div className="text-xs text-gray-700 dark:text-neutral-200 leading-relaxed mb-3.5 whitespace-pre-line">
        {renderFormattedContent(post.content)}
      </div>

      {/* Images Gallery */}
      {post.images && post.images.length > 0 && (
        <div className={`grid gap-2 mb-3.5 rounded-xl overflow-hidden ${
          post.images.length === 1 ? 'grid-cols-1 max-h-96' : 'grid-cols-2 max-h-80'
        }`}>
          {post.images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt=""
              className="w-full h-full object-cover rounded-xl border border-gray-200 dark:border-neutral-800"
              referrerPolicy="no-referrer"
            />
          ))}
        </div>
      )}

      {/* Poll Component */}
      {post.type === 'poll' && post.pollOptions && (
        <div className="p-3.5 bg-gray-50 dark:bg-neutral-950/80 rounded-xl border border-gray-200 dark:border-neutral-800 mb-3.5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1">
            <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Interactive Poll • {totalPollVotes} votes total</span>
          </div>

          {post.pollOptions.map((opt) => {
            const hasVoted = currentUser && opt.voterIds.includes(currentUser.id);
            const percentage = totalPollVotes > 0 ? Math.round((opt.votes / totalPollVotes) * 100) : 0;

            return (
              <button
                key={opt.id}
                onClick={() => handlePollVote(opt.id)}
                className={`relative w-full text-left p-2.5 rounded-xl border transition overflow-hidden group ${
                  hasVoted
                    ? 'border-blue-300 dark:border-blue-500/60 bg-blue-50/80 dark:bg-blue-950/20'
                    : 'border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900/60'
                }`}
              >
                {/* Progress bar fill */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    hasVoted ? 'bg-blue-200/50 dark:bg-blue-600/25' : 'bg-gray-100 dark:bg-neutral-800/40 group-hover:bg-gray-200/60'
                  }`}
                  style={{ width: `${percentage}%` }}
                />

                <div className="relative z-10 flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className={hasVoted ? 'text-blue-800 dark:text-blue-300 font-bold' : 'text-gray-800 dark:text-neutral-200'}>
                      {opt.text}
                    </span>
                    {hasVoted && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </div>
                  <span className="text-gray-500 dark:text-neutral-400 font-mono text-[11px]">
                    {percentage}% ({opt.votes})
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Link Preview Card */}
      {post.type === 'link' && post.linkUrl && (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 bg-gray-50 dark:bg-neutral-950/80 hover:bg-gray-100 dark:hover:bg-neutral-950 border border-gray-200 dark:border-neutral-800 hover:border-gray-300 rounded-xl mb-3.5 transition group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1.5">
                {post.linkTitle || post.linkUrl}
                <ExternalLink className="w-3 h-3" />
              </span>
              {post.linkDescription && (
                <p className="text-[11px] text-gray-500 dark:text-neutral-400 line-clamp-2 mt-0.5">
                  {post.linkDescription}
                </p>
              )}
            </div>
            {post.linkImage && (
              <img
                src={post.linkImage}
                alt=""
                className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-200 dark:border-neutral-800"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        </a>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-neutral-800/80 text-gray-500 dark:text-neutral-400 text-xs">
        <div className="flex items-center gap-6">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition ${
              isLiked ? 'text-red-600 font-bold' : 'hover:text-red-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-600 text-red-600' : ''}`} />
            <span>{likesCount}</span>
          </button>

          {/* Comments */}
          <button
            onClick={toggleComments}
            className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{commentsCount}</span>
          </button>

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            className={`flex items-center gap-1.5 transition ${
              isBookmarked ? 'text-amber-500' : 'hover:text-amber-500'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-neutral-500">
          <Eye className="w-3.5 h-3.5" />
          <span>{post.viewsCount}</span>
        </div>
      </div>

      {/* Comments Expansion Accordion */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800/80 space-y-3">
          {/* Input New Comment */}
          {currentUser && (
            <form onSubmit={handleAddComment} className="flex gap-2">
              <img
                src={currentUser.avatar}
                alt=""
                className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-gray-200 dark:border-neutral-700"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a constructive reply..."
                  className="w-full pl-3 pr-9 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="absolute right-1.5 top-1.5 p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 disabled:opacity-30"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* Comments List */}
          {loadingComments ? (
            <div className="text-center py-3 text-xs text-gray-400 dark:text-neutral-500">Loading replies...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-2 text-xs text-gray-400 dark:text-neutral-500">No replies yet. Be the first to chime in!</div>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {comments.map((comm) => (
                <div key={comm.id} className="p-3 bg-gray-50 dark:bg-neutral-950/60 rounded-xl border border-gray-100 dark:border-neutral-800/60 flex items-start gap-2.5">
                  <img
                    src={comm.authorAvatar}
                    alt={comm.authorDisplayName}
                    className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-gray-900 dark:text-white truncate">{comm.authorDisplayName}</span>
                      {comm.authorVerified && <VerifiedBadge size="sm" />}
                      <span className="text-[10px] text-gray-400 dark:text-neutral-500">
                        {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-neutral-300 mt-0.5 leading-relaxed">{comm.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Universal Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        category="post"
        targetId={post.id}
        targetTitleOrSnippet={post.title || post.content?.slice(0, 50) || 'Post'}
      />
    </article>
  );
};
