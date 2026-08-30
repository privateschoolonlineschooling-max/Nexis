import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { ImageUploadPicker } from '../common/ImageUploadPicker';
import { X, User, MapPin, Globe, FileText } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile } = useAuth();
  const { showToast } = useNotifications();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatar, setAvatar] = useState('');
  const [banner, setBanner] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser && isOpen) {
      setDisplayName(currentUser.displayName || '');
      setBio(currentUser.bio || '');
      setLocation(currentUser.location || '');
      setAvatar(currentUser.avatar || '');
      setBanner(currentUser.banner || '');
      setWebsite(currentUser.website || '');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        avatar: avatar.trim(),
        banner: banner.trim(),
        website: website.trim()
      });
      showToast('Profile updated successfully', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="edit-profile-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="edit-profile-modal-card"
        className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl text-gray-900 dark:text-neutral-100 max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          id="close-edit-profile-modal"
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Edit Profile</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400">Upload profile photo, banner cover, and update your information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Display Name */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
              Display Name *
            </label>
            <input
              type="text"
              required
              value={displayName || ''}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
              Bio
            </label>
            <textarea
              rows={3}
              value={bio || ''}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community about yourself, your interests, and background..."
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
            />
          </div>

          {/* Location & Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={location || ''}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. London, UK"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                Website / Portfolio
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="url"
                  value={website || ''}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourportfolio.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Profile Picture Upload - Direct upload / no links required */}
          <div className="p-4 bg-gray-50 dark:bg-neutral-950/60 rounded-2xl border border-gray-200 dark:border-neutral-800">
            <ImageUploadPicker
              label="Profile Picture"
              value={avatar}
              onChange={setAvatar}
              type="avatar"
              hint="Upload your avatar directly from your device, drag & drop, or pick a preset style"
            />
          </div>

          {/* Banner Cover Upload - Direct upload / no links required */}
          <div className="p-4 bg-gray-50 dark:bg-neutral-950/60 rounded-2xl border border-gray-200 dark:border-neutral-800">
            <ImageUploadPicker
              label="Profile Banner Cover"
              value={banner}
              onChange={setBanner}
              type="banner"
              hint="Upload a wide profile banner from your computer/device or choose a theme"
            />
          </div>

          {/* Buttons */}
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
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
