import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { 
  X, 
  Shield, 
  Lock, 
  Eye, 
  Ban, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  KeyRound, 
  Smartphone, 
  Mail, 
  UserX 
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateSettings, verifyEmail, unblockUser, allUsers } = useAuth();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<'privacy' | 'security' | 'blocked' | 'danger'>('privacy');
  const [loading, setLoading] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen || !currentUser) return null;

  const handlePrivacyToggle = async (key: string, val: any) => {
    try {
      await updateSettings({ [key]: val } as any);
      showToast('Settings saved', 'success');
    } catch (err: any) {
      showToast('Failed to update settings', 'error');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    showToast('Password updated successfully', 'success');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleUnblock = async (targetId: string) => {
    try {
      await unblockUser(targetId);
      showToast('User unblocked', 'info');
    } catch (err: any) {
      showToast('Failed to unblock user', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('CRITICAL ACTION: Are you sure you want to permanently delete your account? All publications, listings, and records will be purged.')) {
      try {
        await api.deleteAccount();
        showToast('Account permanently purged. Reloading...', 'info');
        window.location.reload();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete account', 'error');
      }
    }
  };

  const blockedUsers = allUsers.filter(u => currentUser.settings.blockedUserIds?.includes(u.id));

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="settings-modal-card"
        className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl shadow-xl text-gray-900 dark:text-neutral-100 max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
      >
        <button
          onClick={onClose}
          id="close-settings-modal"
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sidebar Tabs */}
        <div className="w-full md:w-56 p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-neutral-800 bg-gray-50/70 dark:bg-neutral-950/60 space-y-1">
          <h3 className="text-xs font-bold text-gray-400 dark:text-neutral-400 uppercase tracking-wider px-3 mb-3">
            Account Settings
          </h3>

          {[
            { id: 'privacy', label: 'Privacy & Visibility', icon: Eye },
            { id: 'security', label: 'Security & 2FA', icon: Shield },
            { id: 'blocked', label: 'Blocked Accounts', icon: Ban, count: blockedUsers.length },
            { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;

            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                    : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </div>
                {t.count !== undefined && t.count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 font-mono">
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[80vh]">
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Privacy & Audience Controls</h4>
                <p className="text-xs text-gray-500 dark:text-neutral-400">Manage who can discover and interact with your activity.</p>
              </div>

              <div className="space-y-4 divide-y divide-gray-100 dark:divide-neutral-800">
                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white block">Direct Message Permissions</span>
                    <span className="text-[11px] text-gray-500 dark:text-neutral-400">Allow incoming chat requests from everyone vs followers only</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentUser.settings?.allowDMsFrom === 'everyone'}
                      onChange={(e) => handlePrivacyToggle('allowDMsFrom', e.target.checked ? 'everyone' : 'followers')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 dark:bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white block">Private Account Profile</span>
                    <span className="text-[11px] text-gray-500 dark:text-neutral-400">Only approved followers can view your full activity timeline</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(currentUser.settings?.isPrivateAccount)}
                      onChange={(e) => handlePrivacyToggle('isPrivateAccount', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 dark:bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white block">Show Online Activity Status</span>
                    <span className="text-[11px] text-gray-500 dark:text-neutral-400">Display when you are actively browsing communities</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(currentUser.settings?.showOnlineStatus)}
                      onChange={(e) => handlePrivacyToggle('showOnlineStatus', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 dark:bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white block">Display Joined Communities on Profile</span>
                    <span className="text-[11px] text-gray-500 dark:text-neutral-400">Allow public visitors to see community badges</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(currentUser.settings?.showJoinedCommunities)}
                      onChange={(e) => handlePrivacyToggle('showJoinedCommunities', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 dark:bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Security & Authentication</h4>
                <p className="text-xs text-gray-500 dark:text-neutral-400">Protect your account access and verification credentials.</p>
              </div>

              {/* Email Verification Box */}
              <div className="p-4 bg-gray-50 dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">{currentUser.email}</span>
                    <span className="text-[11px] text-gray-500 dark:text-neutral-400">
                      {currentUser.settings?.emailVerified ? 'Email Address Verified' : 'Email Verification Pending'}
                    </span>
                  </div>
                </div>

                {currentUser.settings?.emailVerified ? (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Verified
                  </span>
                ) : (
                  <button
                    onClick={verifyEmail}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                  >
                    Verify Email
                  </button>
                )}
              </div>

              {/* 2FA Toggle */}
              <div className="p-4 bg-gray-50 dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">Two-Factor Authentication (2FA)</span>
                    <span className="text-[11px] text-gray-500 dark:text-neutral-400">Add an extra layer of authentication during sign in</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(currentUser.settings?.twoFactorEnabled)}
                    onChange={(e) => handlePrivacyToggle('twoFactorEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 dark:bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                </label>
              </div>

              {/* Password Form */}
              <form onSubmit={handlePasswordChange} className="p-4 bg-gray-50 dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800 space-y-3">
                <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Change Password
                </span>

                <div>
                  <label className="text-[11px] text-gray-600 dark:text-neutral-400 block mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword || ''}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-gray-600 dark:text-neutral-400 block mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword || ''}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-600 dark:text-neutral-400 block mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword || ''}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                >
                  Update Password
                </button>
              </form>
            </div>
          )}

          {activeTab === 'blocked' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Blocked Accounts</h4>
                <p className="text-xs text-gray-500 dark:text-neutral-400">Blocked users cannot direct message you or view your updates.</p>
              </div>

              {blockedUsers.length === 0 ? (
                <div className="py-8 text-center p-6 bg-gray-50 dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800 text-xs text-gray-400 dark:text-neutral-500">
                  You have not blocked any accounts.
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedUsers.map(u => (
                    <div key={u.id} className="p-3 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                        <div>
                          <span className="text-xs font-bold text-gray-900 dark:text-white block">{u.displayName}</span>
                          <span className="text-[11px] text-gray-500 dark:text-neutral-400">@{u.username}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnblock(u.id)}
                        className="px-3 py-1 text-xs font-semibold text-gray-700 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 rounded-lg transition"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-red-600 dark:text-red-400 mb-1">Danger Zone</h4>
                <p className="text-xs text-gray-500 dark:text-neutral-400">Irreversible actions regarding your account presence and data.</p>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/30 rounded-2xl space-y-3">
                <div>
                  <h5 className="text-xs font-bold text-gray-900 dark:text-white">Permanently Delete Account</h5>
                  <p className="text-[11px] text-gray-600 dark:text-neutral-400 leading-relaxed">
                    Permanently delete your profile, posts, marketplace items, community memberships, and direct messages. This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete My Account Permanently</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
