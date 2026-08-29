import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { RightSidebar } from './components/layout/RightSidebar';
import { MobileNav } from './components/layout/MobileNav';
import { AuthModal } from './components/auth/AuthModal';
import { AuthLandingView } from './components/auth/AuthLandingView';
import { SettingsModal } from './components/settings/SettingsModal';
import { ToastContainer } from './components/common/ToastContainer';

// Views
import { FeedView } from './components/feed/FeedView';
import { CommunitiesListView } from './components/communities/CommunitiesListView';
import { CommunityDetailView } from './components/communities/CommunityDetailView';
import { MarketplaceView } from './components/marketplace/MarketplaceView';
import { DirectMessagesView } from './components/messages/DirectMessagesView';
import { UserProfileView } from './components/profile/UserProfileView';
import { VerificationHubView } from './components/verification/VerificationHubView';
import { ModerationPortalView } from './components/moderation/ModerationPortalView';
import { PoliciesView } from './components/policies/PoliciesView';
import { GlobalSearchView } from './components/search/GlobalSearchView';

const MainAppLayout: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  const { theme } = useTheme();

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('feed');
  const [selectedCommunitySlug, setSelectedCommunitySlug] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [activeDMRecipientId, setActiveDMRecipientId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Global Modals State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // If initial auth is still checking
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20 animate-pulse mb-4">
          N
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-neutral-400">
          <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Connecting to Nexis Secure Network...</span>
        </div>
      </div>
    );
  }

  // If user is not logged in, bring up the Login & Sign Up page with built-in Google Sign In
  if (!currentUser) {
    return (
      <>
        <AuthLandingView />
        <ToastContainer />
      </>
    );
  }

  // Navigation Handlers
  const handleSelectUser = (username: string) => {
    setSelectedUsername(username);
    setCurrentView('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCommunity = (slug: string) => {
    setSelectedCommunitySlug(slug);
    setCurrentView('community-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartDM = (userId: string) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    setActiveDMRecipientId(userId);
    setCurrentView('messages');
  };

  const handleGlobalSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentView('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewChange = (view: string) => {
    // Reset view specific sub-states if jumping away
    if (view !== 'community-detail') setSelectedCommunitySlug(null);
    if (view !== 'profile') setSelectedUsername(null);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determine whether to show the Right Sidebar (Trends/Spotlight)
  const showRightSidebar = ['feed', 'communities', 'marketplace', 'policies'].includes(currentView);

  return (
    <div id="app-root-container" className="min-h-screen bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-700 dark:selection:text-blue-200">
      {/* Top Navigation Bar */}
      <Navbar
        currentView={currentView}
        setCurrentView={handleViewChange}
        openCreatePost={() => handleViewChange('feed')}
        openCreateListing={() => handleViewChange('marketplace')}
        openCreateCommunity={() => handleViewChange('communities')}
        openNewDM={() => handleViewChange('messages')}
        openAuthModal={() => setIsAuthOpen(true)}
        openSettingsModal={() => setIsSettingsOpen(true)}
        onSearch={handleGlobalSearch}
        onSelectUser={handleSelectUser}
        onSelectCommunity={handleSelectCommunity}
      />

      {/* Main Responsive Grid Layout */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          setCurrentView={handleViewChange}
          onSelectCommunity={handleSelectCommunity}
        />

        {/* Center Content Workspace */}
        <main id="main-content-viewport" className="flex-1 min-w-0">
          {currentView === 'feed' && (
            <FeedView
              onSelectUser={handleSelectUser}
              onSelectCommunity={handleSelectCommunity}
              onInitiatePurchase={() => handleViewChange('marketplace')}
            />
          )}

          {currentView === 'communities' && (
            <CommunitiesListView
              onSelectCommunity={handleSelectCommunity}
            />
          )}

          {currentView === 'community-detail' && selectedCommunitySlug && (
            <CommunityDetailView
              slug={selectedCommunitySlug}
              onBack={() => handleViewChange('communities')}
              onSelectUser={handleSelectUser}
              onSelectCommunity={handleSelectCommunity}
            />
          )}

          {currentView === 'marketplace' && (
            <MarketplaceView
              onSelectSeller={handleSelectUser}
            />
          )}

          {currentView === 'messages' && (
            <DirectMessagesView
              initialRecipientId={activeDMRecipientId}
              onSelectUser={handleSelectUser}
            />
          )}

          {currentView === 'profile' && (
            <UserProfileView
              username={selectedUsername || undefined}
              onBack={() => handleViewChange('feed')}
              onSelectUser={handleSelectUser}
              onSelectCommunity={handleSelectCommunity}
              onStartDM={handleStartDM}
            />
          )}

          {currentView === 'verification' && (
            <VerificationHubView />
          )}

          {currentView === 'moderation' && (
            <ModerationPortalView />
          )}

          {currentView === 'policies' && (
            <PoliciesView />
          )}

          {currentView === 'search' && (
            <GlobalSearchView
              initialQuery={searchQuery}
              onSelectUser={handleSelectUser}
              onSelectCommunity={handleSelectCommunity}
              onStartDM={handleStartDM}
            />
          )}
        </main>

        {/* Right Contextual Sidebar */}
        {showRightSidebar && (
          <RightSidebar
            onSelectUser={handleSelectUser}
            onSelectCommunity={handleSelectCommunity}
            onNavigateVerification={() => handleViewChange('verification')}
            onNavigatePolicies={() => handleViewChange('policies')}
            onSelectTag={(tag) => {
              setSearchQuery(`#${tag}`);
              handleViewChange('search');
            }}
          />
        )}
      </div>

      {/* Bottom Navigation for Mobile */}
      <MobileNav
        currentView={currentView}
        setCurrentView={handleViewChange}
      />

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Global Notification Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <MainAppLayout />
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
