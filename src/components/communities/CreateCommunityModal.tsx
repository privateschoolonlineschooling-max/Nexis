import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { CommunityPrivacy } from '../../types/index';
import { X, Plus, Trash2, Users, Globe, Lock, ShieldAlert } from 'lucide-react';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommunityCreated: (slug: string) => void;
}

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  isOpen,
  onClose,
  onCommunityCreated
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<CommunityPrivacy>('public');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1518770660439-4636190af475?w=200');
  const [banner, setBanner] = useState('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200');
  const [rules, setRules] = useState<string[]>([
    'Be respectful and constructive in all discussions.',
    'No spam, self-promotion, or unsolicited advertising.',
    'Follow community safety and privacy guidelines.'
  ]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]/g, '-')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
    }
  };

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
    if (!name.trim() || !slug.trim()) {
      showToast('Name and unique slug are required', 'warning');
      return;
    }

    try {
      setLoading(true);
      const validRules = rules.map(r => r.trim()).filter(Boolean);
      const res = await api.createCommunity({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim(),
        privacy,
        avatar: avatar.trim() || undefined,
        banner: banner.trim() || undefined,
        rules: validRules
      });

      showToast(`Community c/${res.community.slug} founded successfully!`, 'success');
      onCommunityCreated(res.community.slug);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to create community', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="create-community-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="create-community-modal-card"
        className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl text-gray-900 dark:text-neutral-100 max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          id="close-create-community-modal"
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Create New Community</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400">Establish an interest group, engineering circle, or creative hub</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                Community Name
              </label>
              <input
                type="text"
                required
                value={name || ''}
                onChange={handleNameChange}
                placeholder="e.g. AI & Robotics Circle"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                Unique Slug (c/...)
              </label>
              <input
                type="text"
                required
                value={slug || ''}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="ai-robotics"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs font-mono text-blue-600 dark:text-blue-400 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
              placeholder="What is this community about? Who should join?"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
            />
          </div>

          {/* Image & Banner URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-600 dark:text-neutral-400 block mb-1">
                Avatar Image URL
              </label>
              <input
                type="url"
                value={avatar || ''}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 dark:text-neutral-400 block mb-1">
                Banner Cover URL
              </label>
              <input
                type="url"
                value={banner || ''}
                onChange={(e) => setBanner(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Community Rules */}
          <div className="p-3.5 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300">
                Community Guidelines & Rules
              </label>
              <button
                type="button"
                onClick={handleAddRule}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rule</span>
              </button>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400 dark:text-neutral-500 w-4 shrink-0">{idx + 1}.</span>
                  <input
                    type="text"
                    required
                    value={rule || ''}
                    onChange={(e) => handleRuleChange(idx, e.target.value)}
                    placeholder="Enter rule statement..."
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {rules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
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
              {loading ? 'Creating...' : 'Found Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
