import React from 'react';
import { Home, Users, ShoppingBag, MessageSquare, ShieldCheck } from 'lucide-react';

interface MobileNavProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  unreadDMsCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  setCurrentView,
  unreadDMsCount = 0
}) => {
  const items = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'communities', label: 'Groups', icon: Users },
    { id: 'marketplace', label: 'Market', icon: ShoppingBag },
    { id: 'messages', label: 'DMs', icon: MessageSquare, badge: unreadDMsCount > 0 ? unreadDMsCount : undefined },
    { id: 'verification', label: 'Verify', icon: ShieldCheck }
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-gray-200 dark:border-neutral-800 flex items-center justify-around px-2 py-2 shadow-lg"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-medium transition relative ${
              isActive ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-400 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
