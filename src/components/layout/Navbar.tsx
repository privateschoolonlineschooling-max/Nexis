import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Search, 
  Bell, 
  Plus, 
  Sun, 
  Moon, 
  User as UserIcon, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Sparkles, 
  MessageSquare, 
  ShoppingBag, 
  Users, 
  FileText,
  CheckCheck
} from 'lucide-react';
import { VerifiedBadge } from '../common/VerifiedBadge';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  openCreatePost: () => void;
  openCreateListing: () => void;
  openCreateCommunity: () => void;
  openNewDM: () => void;
  openAuthModal: () => void;
  openSettingsModal: () => void;
  onSearch: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  openCreatePost,
  openCreateListing,
  openCreateCommunity,
  openNewDM,
  openAuthModal,
  openSettingsModal,
  onSearch
}) => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const createMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setShowCreateMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setCurrentView('search');
    }
  };

  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-40 w-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-gray-200 dark:border-neutral-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setCurrentView('feed')}
            className="flex items-center gap-2.5 group text-left"
            id="nav-brand-button"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm group-hover:bg-blue-700 transition">
              <span>C</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white flex items-center gap-1.5">
                Civitas
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                  Trust Network
                </span>
              </span>
            </div>
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-lg hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              id="global-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communities, items, or people..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-neutral-900 transition-all"
            />
          </form>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Create Button Dropdown */}
          <div className="relative" ref={createMenuRef}>
            <button
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              id="create-action-dropdown-btn"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create</span>
            </button>

            {showCreateMenu && (
              <div
                id="create-action-menu"
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-1.5 shadow-xl z-50 text-gray-700 dark:text-neutral-200 animate-in fade-in zoom-in-95 duration-150"
              >
                <button
                  onClick={() => {
                    setShowCreateMenu(false);
                    openCreatePost();
                  }}
                  id="menu-create-post"
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white transition"
                >
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Publish New Post</span>
                </button>
                <button
                  onClick={() => {
                    setShowCreateMenu(false);
                    openCreateListing();
                  }}
                  id="menu-create-listing"
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white transition"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Create Marketplace Item</span>
                </button>
                <button
                  onClick={() => {
                    setShowCreateMenu(false);
                    openCreateCommunity();
                  }}
                  id="menu-create-community"
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white transition"
                >
                  <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Found New Community</span>
                </button>
                <button
                  onClick={() => {
                    setShowCreateMenu(false);
                    openNewDM();
                  }}
                  id="menu-create-dm"
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white transition"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Direct Message</span>
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            id="theme-toggle-btn"
            className="p-2 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-600" />}
          </button>

          {/* Notifications Center */}
          <div className="relative" ref={notifMenuRef}>
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              id="notifications-bell-btn"
              className="relative p-2 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span
                  id="notifications-unread-count"
                  className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse"
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div
                id="notifications-dropdown-panel"
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 text-gray-800 dark:text-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950/50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 font-medium"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-neutral-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400 dark:text-neutral-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markAsRead(notif.id);
                          if (notif.link) {
                            if (notif.link.includes('/messages')) setCurrentView('messages');
                            else if (notif.link.includes('/post')) setCurrentView('feed');
                          }
                          setShowNotifMenu(false);
                        }}
                        className={`p-3.5 text-xs transition cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/60 ${
                          !notif.isRead ? 'bg-blue-50/70 dark:bg-blue-600/10 font-medium' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {notif.sourceUserAvatar ? (
                            <img
                              src={notif.sourceUserAvatar}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover shrink-0 border border-gray-200 dark:border-neutral-700"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <Bell className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-semibold text-gray-900 dark:text-white truncate">{notif.title}</h5>
                            <p className="text-[11px] text-gray-600 dark:text-neutral-400 line-clamp-2 mt-0.5">{notif.message}</p>
                            <span className="text-[10px] text-gray-400 dark:text-neutral-500 mt-1 block">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Menu */}
          {currentUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                id="user-profile-menu-button"
                className="flex items-center gap-2 p-1.5 pl-2 pr-3 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-700 rounded-xl transition"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.displayName}
                  className="w-6 h-6 rounded-full object-cover border border-gray-300 dark:border-neutral-600"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-semibold text-gray-900 dark:text-white max-w-[100px] truncate hidden sm:inline">
                  {currentUser.displayName}
                </span>
                {currentUser.isVerified && <VerifiedBadge size="sm" />}
              </button>

              {showUserMenu && (
                <div
                  id="user-profile-dropdown"
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-2 shadow-xl z-50 text-gray-700 dark:text-neutral-200 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="p-3 border-b border-gray-100 dark:border-neutral-800 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{currentUser.displayName}</span>
                      {currentUser.isVerified && <VerifiedBadge size="sm" />}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-neutral-400 truncate">@{currentUser.username}</div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold capitalize mt-0.5">Role: {currentUser.role}</div>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setCurrentView('profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white transition text-left"
                  >
                    <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>My Public Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setCurrentView('verification');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white transition text-left"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Verification Center</span>
                  </button>

                  {isStaff && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setCurrentView('moderation');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 transition text-left"
                    >
                      <ShieldCheck className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span>Trust & Safety Portal</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      openSettingsModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white transition text-left"
                  >
                    <Settings className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                    <span>Privacy & Security Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      openAuthModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 transition text-left"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Switch Demo Persona</span>
                  </button>

                  <div className="border-t border-gray-100 dark:border-neutral-800 my-1 pt-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
