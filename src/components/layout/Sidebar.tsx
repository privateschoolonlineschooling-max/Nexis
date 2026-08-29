import React from 'react';
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
  HelpCircle 
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  unreadDMsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  unreadDMsCount = 0
}) => {
  const { currentUser } = useAuth();
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  const navItems = [
    { id: 'feed', label: 'Home Feed', icon: Home },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'messages', label: 'Direct Messages', icon: MessageSquare, badge: unreadDMsCount > 0 ? unreadDMsCount : undefined },
    { id: 'discovery', label: 'Explore & Trends', icon: Compass },
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
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

      {/* Staff Moderation Area */}
      {isStaff && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-neutral-800">
          <span className="text-[11px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider px-3.5 block mb-2">
            Staff & Moderation
          </span>
          <button
            onClick={() => setCurrentView('moderation')}
            id="nav-item-moderation"
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
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
