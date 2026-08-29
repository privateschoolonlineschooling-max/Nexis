import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { TrendingUp, Sparkles, Users, Shield } from 'lucide-react';
import { Community, User } from '../../types/index';
import { api } from '../../services/api';

interface RightSidebarProps {
  trendingCommunities?: Community[];
  verifiedUsers?: User[];
  trendingTags?: string[];
  onSelectCommunity: (slug: string) => void;
  onSelectTag?: (tag: string) => void;
  onSelectUser: (username: string) => void;
  onNavigateToVerification?: () => void;
  onNavigateVerification?: () => void;
  onNavigatePolicies?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  trendingCommunities: propCommunities,
  verifiedUsers: propUsers,
  trendingTags: propTags,
  onSelectCommunity,
  onSelectTag,
  onSelectUser,
  onNavigateToVerification,
  onNavigateVerification
}) => {
  const { toggleFollow, currentUser } = useAuth();
  const [internalCommunities, setInternalCommunities] = useState<Community[]>([]);
  const [internalUsers, setInternalUsers] = useState<User[]>([]);

  const handleNavigateVerification = onNavigateToVerification || onNavigateVerification;

  useEffect(() => {
    if (!propCommunities || propCommunities.length === 0) {
      api.getCommunities()
        .then((res) => {
          if (res?.communities) {
            setInternalCommunities(res.communities);
          }
        })
        .catch(() => {});
    }
  }, [propCommunities]);

  useEffect(() => {
    if (!propUsers || propUsers.length === 0) {
      api.getAllUsers()
        .then((res) => {
          if (res?.users) {
            setInternalUsers(res.users.filter(u => u.isVerified));
          }
        })
        .catch(() => {});
    }
  }, [propUsers]);

  const communities = (propCommunities && propCommunities.length > 0) ? propCommunities : internalCommunities;
  const verifiedList = (propUsers && propUsers.length > 0) ? propUsers : internalUsers;
  const tags = propTags && propTags.length > 0
    ? propTags
    : ['technology', 'artisan', 'robotics', 'woodworking', 'ai', 'minimalism'];

  return (
    <aside
      id="right-sidebar"
      className="hidden lg:flex flex-col w-80 p-4 border-l border-gray-200 dark:border-neutral-800 bg-transparent sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto space-y-5"
    >
      {/* Verified Account Promo Card */}
      <div className="bg-blue-600 rounded-2xl p-5 shadow-sm text-white">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-white" />
          <h3 className="font-bold text-sm">Verified Account</h3>
        </div>
        <p className="text-blue-100 text-xs mb-4 leading-relaxed">
          Authenticated accounts provide trust in our marketplace and community network. Apply for verification to gain the blue badge.
        </p>
        <button
          onClick={handleNavigateVerification}
          className="w-full py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
        >
          Apply Now
        </button>
      </div>

      {/* Trending Communities */}
      <div className="p-5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Trending Communities</span>
          </div>
        </div>

        <div className="space-y-3.5">
          {(communities || []).slice(0, 4).map((c) => (
            <div
              key={c.id}
              className="w-full flex items-center justify-between gap-3 group"
            >
              <button
                onClick={() => onSelectCommunity(c.slug)}
                className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
              >
                <img
                  src={c.avatar}
                  alt={c.name}
                  className="w-8 h-8 rounded-xl object-cover shrink-0 border border-gray-100 dark:border-neutral-800"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition truncate">
                      {c.name}
                    </span>
                    {c.isVerified && <VerifiedBadge size="sm" type="organization" />}
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-neutral-400">
                    {(c.memberCount || 0).toLocaleString()} members
                  </span>
                </div>
              </button>

              <button
                onClick={() => onSelectCommunity(c.slug)}
                className="px-3 py-1 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg text-xs font-bold text-gray-700 dark:text-neutral-300 shrink-0 transition cursor-pointer"
              >
                Join
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Verified Spotlight */}
      <div className="p-5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Verified Spotlight</span>
        </div>

        <div className="space-y-3.5">
          {(verifiedList || []).slice(0, 3).map((u) => {
            const isFollowing = currentUser?.following?.includes(u.id);
            const isSelf = currentUser?.id === u.id;

            return (
              <div key={u.id} className="flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectUser(u.username)}
                  className="flex items-center gap-2.5 min-w-0 text-left group cursor-pointer"
                >
                  <img
                    src={u.avatar}
                    alt={u.displayName}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200 dark:border-neutral-700 group-hover:border-blue-500 transition"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-blue-600 truncate transition">
                        {u.displayName}
                      </span>
                      <VerifiedBadge size="sm" type={u.role === 'admin' ? 'organization' : 'user'} />
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-neutral-400 truncate block">@{u.username}</span>
                  </div>
                </button>

                {!isSelf && (
                  <button
                    onClick={() => toggleFollow(u.id)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg shrink-0 transition cursor-pointer ${
                      isFollowing
                        ? 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trending Topics & Tags */}
      <div className="p-5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Trending Hashtags</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(tags || []).map((tag) => (
            <button
              key={tag}
              onClick={() => onSelectTag && onSelectTag(tag)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-neutral-950 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs font-medium text-gray-700 dark:text-neutral-300 transition cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
