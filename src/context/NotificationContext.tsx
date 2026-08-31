import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification } from '../types/index';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: any, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    let cleanMessage = 'Action completed';
    if (typeof message === 'string') {
      cleanMessage = message;
    } else if (message instanceof Error) {
      cleanMessage = message.message;
    } else if (message && typeof message.message === 'string') {
      cleanMessage = message.message;
    } else if (message && typeof message.error === 'string') {
      cleanMessage = message.error;
    } else if (message && typeof message.error?.message === 'string') {
      cleanMessage = message.error.message;
    } else if (message && typeof message.details === 'string') {
      cleanMessage = message.details;
    } else if (message && typeof message === 'object') {
      try {
        cleanMessage = message.message || message.reason || message.error || JSON.stringify(message);
      } catch {
        cleanMessage = type === 'error' ? 'An unexpected error occurred' : 'Action completed';
      }
    }

    if (!cleanMessage || cleanMessage === '[object Object]' || cleanMessage === '{}') {
      cleanMessage = type === 'error' 
        ? 'Action could not be completed. Please check your information and try again.'
        : 'Update processed successfully';
    }

    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev, { id, type, message: cleanMessage }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await api.getNotifications();
      if (res && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
      }
    } catch (_err) {
      // Gracefully ignore transient background fetch errors
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser, refreshNotifications]);

  const markAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    showToast('All notifications marked as read', 'info');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        toasts,
        showToast,
        removeToast,
        markAsRead,
        markAllAsRead,
        refreshNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
