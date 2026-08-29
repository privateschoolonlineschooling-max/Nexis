import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { PostType, Community } from '../../types/index';
import { 
  X, 
  Image as ImageIcon, 
  Video, 
  Link as LinkIcon, 
  BarChart2, 
  Megaphone, 
  Globe, 
  Users, 
  Lock, 
  Plus, 
  Trash2 
} from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  communities: Community[];
  initialCommunityId?: string;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  communities,
  initialCommunityId
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [type, setType] = useState<PostType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [communityId, setCommunityId] = useState(initialCommunityId || '');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'community'>('public');
  const [isAnnouncement, setIsAnnouncement] = useState(false);

  // Media & Extras
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (initialCommunityId) {
        setCommunityId(initialCommunityId);
      }
    }
  }, [isOpen, initialCommunityId]);

  if (!isOpen) return null;

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setImages(prev => [...prev, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions(prev => [...prev, '']);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, val: string) => {
    const updated = [...pollOptions];
    updated[index] = val;
    setPollOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && type === 'text') {
      showToast('Please enter post content', 'warning');
      return;
    }

    if (type === 'poll') {
      const validOpts = pollOptions.filter(o => o.trim().length > 0);
      if (validOpts.length < 2) {
        showToast('Polls require at least 2 valid options', 'warning');
        return;
      }
    }

    try {
      setLoading(true);
      await api.createPost({
        type,
        title: title.trim() || undefined,
        content: content.trim(),
        communityId: communityId || undefined,
        visibility,
        isAnnouncement: isAnnouncement && (currentUser?.role === 'admin' || currentUser?.role === 'moderator'),
        images: images.length > 0 ? images : undefined,
        videoUrl: videoUrl.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined,
        linkTitle: linkTitle.trim() || undefined,
        linkDescription: linkDescription.trim() || undefined,
        pollOptions: type === 'poll' ? pollOptions.filter(o => o.trim().length > 0) as any : undefined
      });

      showToast('Post published successfully!', 'success');
      onPostCreated();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to publish post', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  return (
    <div
      id="create-post-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="create-post-modal-card"
        className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl text-gray-900 dark:text-neutral-100 max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          id="close-create-post-modal"
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <img
            src={currentUser?.avatar}
            alt={currentUser?.displayName}
            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-neutral-700"
            referrerPolicy="no-referrer"
          />
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Create Publication</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400">Share insights, polls, media, or community announcements</p>
          </div>
        </div>

        {/* Post Type Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 border-b border-gray-200 dark:border-neutral-800">
          {[
            { id: 'text', label: 'Article / Post', icon: Globe },
            { id: 'image', label: 'Images', icon: ImageIcon },
            { id: 'video', label: 'Video', icon: Video },
            { id: 'poll', label: 'Poll', icon: BarChart2 },
            { id: 'link', label: 'Link', icon: LinkIcon }
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id as PostType)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                  type === t.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-neutral-800/60 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-neutral-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Destination Community & Privacy Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                Post Destination
              </label>
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Personal Feed / Public</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    Community: {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                Audience Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="public">Public (Everyone)</option>
                <option value="followers">Followers Only</option>
                {communityId && <option value="community">Community Members Only</option>}
              </select>
            </div>
          </div>

          {/* Optional Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title or headline (optional)..."
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs font-semibold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Main Content Body */}
          <div>
            <textarea
              required={type === 'text'}
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening? Use #hashtags and @mentions to connect..."
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
            />
          </div>

          {/* Type Specific Fields */}
          {type === 'image' && (
            <div className="space-y-3 p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800">
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block">
                Attach Image URLs
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-3 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-800 dark:text-white rounded-xl text-xs font-medium transition"
                >
                  Add
                </button>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-700">
                      <img src={img} alt="" className="w-full h-20 object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {type === 'video' && (
            <div className="p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800 space-y-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block">
                Video Embed URL
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or direct video link"
                className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {type === 'link' && (
            <div className="p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800 space-y-3">
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block">
                Link Details
              </label>
              <input
                type="url"
                required
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Link Title (e.g. Architectural Case Study)"
                className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={linkDescription}
                onChange={(e) => setLinkDescription(e.target.value)}
                placeholder="Brief summary of the external resource..."
                className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {type === 'poll' && (
            <div className="p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300">
                  Poll Options (2 - 6)
                </label>
                {pollOptions.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Option</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {pollOptions.map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => handlePollOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePollOption(index)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Announcement Option (Staff only) */}
          {isStaff && (
            <label className="flex items-center gap-2.5 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={isAnnouncement}
                onChange={(e) => setIsAnnouncement(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400 bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
              />
              <div className="text-xs">
                <span className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5" /> Mark as Official Announcement
                </span>
                <span className="text-gray-500 dark:text-neutral-400 text-[11px] block">
                  Pins this post with official platform styling in announcements feeds.
                </span>
              </div>
            </label>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-neutral-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
