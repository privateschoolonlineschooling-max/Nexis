import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  Users, 
  ShoppingBag, 
  MessageSquare, 
  Compass, 
  ShieldCheck, 
  FileText, 
  ShieldAlert, 
  HelpCircle,
  Search,
  Plus,
  Layers
} from 'lucide-react';
import { api } from '../../services/api';
import { Community } from '../../types/index';
import { VerifiedBadge } from '../common/VerifiedBadge';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onSelectCommunity?: (slug: string) => void;
  unreadDMsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  onSelectCommunity,
  unreadDMsCount = 0
}) => {
  const { currentUser } = useAuth();
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);

  useEffect(() => {
    if (currentUser) {
      api.getCommunities()
        .then(res => {
          if (res?.communities) {
            const joined = res.communities.filter(c => 
              c.members?.some(m => m.userId === currentUser.id)
            );
            setJoinedCommunities(joined);
          }
        })
        .catch(() => {});
    } else {
      setJoinedCommunities([]);
    }
  }, [currentUser, currentView]);

  const navItems = [
    { id: 'feed', label: 'Home Feed', icon: Home },
    { id: 'search', label: 'Search & Find People', icon: Search },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'messages', label: 'Direct Messages', icon: MessageSquare, badge: unreadDMsCount > 0 ? unreadDMsCount : undefined },
    { id: 'verification', label: 'Verification Hub', icon: ShieldCheck },
    { id: 'policies', label: 'Policies & Safety', icon: FileText }
  ];

  return (
    <aside
      id="main-sidebar"
      className="hidden md:flex flex-col w-64 p-4 border-r border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto"
    >
      <div className="px-3 pb-2 text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
        Platform
      </div>
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              id={`nav-item-${item.id}`}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                  : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-neutral-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-600 text-white font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dedicated Joined Communities Section */}
      {currentUser && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-neutral-800">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>My Communities</span>
            </span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              {joinedCommunities.length}
            </span>
          </div>

          <div className="space-y-1">
            {joinedCommunities.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-gray-400 dark:text-neutral-500 bg-gray-50 dark:bg-neutral-950/40 rounded-xl">
                <span>You haven't joined any circles yet.</span>
                <button
                  onClick={() => setCurrentView('communities')}
                  className="block mt-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                >
                  Explore communities →
                </button>
              </div>
            ) : (
              <>
                {joinedCommunities.slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      if (onSelectCommunity) {
                        onSelectCommunity(c.slug);
                      } else {
                        setCurrentView('communities');
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition text-left cursor-pointer group"
                  >
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="w-6 h-6 rounded-lg object-cover border border-gray-200 dark:border-neutral-700 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="truncate text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {c.name}
                        </span>
                        {c.isVerified && <VerifiedBadge size="sm" type="organization" />}
                      </div>
                    </div>
                  </button>
                ))}

                <button
                  onClick={() => setCurrentView('communities')}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition mt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>View All & Join More</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Staff Moderation Area */}
      {isStaff && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-neutral-800">
          <span className="text-[11px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider px-3.5 block mb-2">
            Staff & Moderation
          </span>
          <button
            onClick={() => setCurrentView('moderation')}
            id="nav-item-moderation"
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              currentView === 'moderation'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-semibold border border-red-200 dark:border-red-800/40'
                : 'text-gray-600 dark:text-neutral-400 hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-neutral-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span>Trust & Safety Portal</span>
          </button>
        </div>
      )}

      {/* Trust & Safety Platform Card */}
      <div className="mt-auto pt-4">
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-neutral-950/60 border border-gray-200 dark:border-neutral-800 text-xs">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold mb-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Civitas Trust Protocol</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-neutral-400 leading-relaxed">
            All marketplace checkouts include safety checks. Verified Badges authenticate genuine creators & organizations.
          </p>
        </div>
      </div>
    </aside>
  );
};
