import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { Community, CommunityPrivacy } from '../../types/index';
import { ImageUploadPicker } from '../common/ImageUploadPicker';
import { X, Plus, Trash2, Globe, Lock, ShieldAlert, Settings } from 'lucide-react';

interface EditCommunityModalProps {
  isOpen: boolean;
  community: Community;
  onClose: () => void;
  onCommunityUpdated: (updated: Community) => void;
}

export const EditCommunityModal: React.FC<EditCommunityModalProps> = ({
  isOpen,
  community,
  onClose,
  onCommunityUpdated
}) => {
  const { showToast } = useNotifications();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Tech & Science');
  const [privacy, setPrivacy] = useState<CommunityPrivacy>('public');
  const [avatar, setAvatar] = useState('');
  const [banner, setBanner] = useState('');
  const [rules, setRules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (community && isOpen) {
      setName(community.name || '');
      setDescription(community.description || '');
      setCategory(community.category || 'Tech & Science');
      setPrivacy(community.privacy || 'public');
      setAvatar(community.avatar || '');
      setBanner(community.banner || '');
      
      const parsedRules = (community.rules || []).map(r => 
        typeof r === 'string' ? r : r.title || r.description
      );
      setRules(parsedRules.length > 0 ? parsedRules : ['Be respectful and follow safety rules']);
    }
  }, [community, isOpen]);

  if (!isOpen || !community) return null;

  const handleAddRule = () => {
    setRules(prev => [...prev, '']);
  };

  const handleRemoveRule = (index: number) => {
    setRules(prev => prev.filter((_, i) => i !== index));
  };

  const handleRuleChange = (index: number, val: string) => {
    const updated = [...rules];
    updated[index] = val;
    setRules(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Community name is required', 'warning');
      return;
    }

    try {
      setLoading(true);
      const validRules = rules.map(r => r.trim()).filter(Boolean);
      const res = await api.updateCommunity(community.id, {
        name: name.trim(),
        description: description.trim(),
        category,
        privacy,
        avatar: avatar.trim() || undefined,
        banner: banner.trim() || undefined,
        rules: validRules
      });

      showToast('Community settings and branding updated!', 'success');
      onCommunityUpdated(res.community);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update community', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="edit-community-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="edit-community-modal-card"
        className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl text-gray-900 dark:text-neutral-100 max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          id="close-edit-community-modal"
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Edit Community Profile & Settings</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400">Customize c/{community.slug} branding, banner cover, and guidelines</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Community Name & Privacy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                Community Name *
              </label>
              <input
                type="text"
                required
                value={name || ''}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AI & Robotics Circle"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Tech & Science">Tech & Science</option>
                <option value="Design & Arts">Design & Arts</option>
                <option value="Gaming & Esports">Gaming & Esports</option>
                <option value="Business & Startups">Business & Startups</option>
                <option value="Education & Study">Education & Study</option>
                <option value="Music & Culture">Music & Culture</option>
                <option value="General & Lounge">General & Lounge</option>
              </select>
            </div>
          </div>

          {/* Privacy Selector */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1.5">
              Privacy Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'public', label: 'Public', desc: 'Anyone can view & join', icon: Globe },
                { value: 'restricted', label: 'Restricted', desc: 'Anyone can view, approval to post', icon: ShieldAlert },
                { value: 'private', label: 'Private', desc: 'Invite only', icon: Lock }
              ].map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPrivacy(p.value as CommunityPrivacy)}
                    className={`p-3 rounded-xl border text-left transition ${
                      privacy === p.value
                        ? 'bg-blue-50 dark:bg-blue-600/15 border-blue-500 text-blue-900 dark:text-white'
                        : 'bg-gray-50 dark:bg-neutral-950 border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1 text-blue-600 dark:text-blue-400" />
                    <div className="text-xs font-bold text-gray-900 dark:text-white">{p.label}</div>
                    <div className="text-[10px] text-gray-500 dark:text-neutral-400 leading-tight mt-0.5">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
              Description & Purpose
            </label>
            <textarea
              required
              rows={3}
              value={description || ''}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this community is about..."
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
            />
          </div>

          {/* Community Profile Image (Avatar) - Direct upload / no link required */}
          <div className="p-4 bg-gray-50 dark:bg-neutral-950/60 rounded-2xl border border-gray-200 dark:border-neutral-800 space-y-3">
            <ImageUploadPicker
              label="Community Profile Picture / Avatar"
              value={avatar}
              onChange={setAvatar}
              type="avatar"
              hint="Upload an icon or avatar directly from your device, or choose a preset"
            />
          </div>

          {/* Community Banner Cover - Direct upload / no link required */}
          <div className="p-4 bg-gray-50 dark:bg-neutral-950/60 rounded-2xl border border-gray-200 dark:border-neutral-800 space-y-3">
            <ImageUploadPicker
              label="Community Banner Cover"
              value={banner}
              onChange={setBanner}
              type="banner"
              hint="Upload a wide banner image from your device, or choose from aesthetic presets"
            />
          </div>

          {/* Guidelines / Rules */}
          <div className="p-4 bg-gray-50 dark:bg-neutral-950/60 rounded-2xl border border-gray-200 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300">
                Community Guidelines & Rules
              </label>
              <button
                type="button"
                onClick={handleAddRule}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center gap-1 font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rule</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400 dark:text-neutral-500 w-4 shrink-0">{idx + 1}.</span>
                  <input
                    type="text"
                    required
                    value={rule || ''}
                    onChange={(e) => handleRuleChange(idx, e.target.value)}
                    placeholder="Enter rule statement..."
                    className="flex-1 px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {rules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-neutral-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving Changes...' : 'Save Community Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
