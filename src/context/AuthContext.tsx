import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserSettings } from '../types/index';
import { api, ApiRequestContext, ApiErrorContext } from '../services/api';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  firebaseSignOut,
  firebaseUpdateProfile 
} from '../lib/firebase';
import { firestoreService } from '../services/firestoreService';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  loginWithGoogle: (googleData?: { email?: string; displayName?: string; avatar?: string; googleId?: string }) => Promise<void>;
  register: (data: { username: string; email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => void;
  switchUser: (userId: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  completeOnboarding: (data: { avatar?: string; bio?: string; displayName?: string; location?: string; interests: string[] }) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  verifyEmail: () => Promise<void>;
  toggleFollow: (targetUserId: string) => Promise<boolean>;
  blockUser: (targetUserId: string) => Promise<void>;
  unblockUser: (targetUserId: string) => Promise<void>;
  muteUser: (targetUserId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to safely format request body without exposing plain passwords in raw console dumps
const sanitizeRequestBody = (body: any): any => {
  if (!body) return body;
  if (typeof body === 'object' && !Array.isArray(body)) {
    const copy = { ...body };
    if (copy.password) {
      copy.password = '[HIDDEN_FOR_SECURITY]';
    }
    return copy;
  }
  return body;
};

// Middleware-like logging utility for intercepting API requests and capturing 405 / 500 errors
const logApiDiagnostic = (
  type: 'INTERCEPTOR' | 'MIDDLEWARE',
  status: number,
  statusText: string,
  method: string,
  endpoint: string,
  headers: Record<string, string>,
  body: any,
  responseError: any
) => {
  // Only trigger on 405 (Method Not Allowed) or 500+ (Server Errors)
  if (status === 405 || status >= 500) {
    const errorTitle = status === 405 
      ? `🚨 [API Client ${type}] 405 Method Not Allowed on ${method} ${endpoint}`
      : `🔥 [API Client ${type}] ${status} Server Error on ${method} ${endpoint}`;

    console.group(
      `%c${errorTitle}`,
      'color: #ffffff; background-color: #dc2626; font-weight: bold; padding: 3px 8px; border-radius: 4px; font-size: 11px;'
    );
    console.info('%c[HTTP Request Details]', 'color: #3b82f6; font-weight: bold;');
    console.log('Method:', method);
    console.log('Endpoint URL:', endpoint);
    console.log('Request Headers:', headers);
    console.log('Request Payload (Body):', sanitizeRequestBody(body));

    console.info('%c[HTTP Response Details]', 'color: #f59e0b; font-weight: bold;');
    console.log('Status Code:', `${status} (${statusText || 'Error'})`);
    console.log('Response / Error Payload:', responseError);
    console.groupEnd();
  }
};

const formatUserWithPermissions = (user: User | null): User | null => {
  if (!user) return null;
  const isSuperAdmin = Boolean(
    user.email && user.email.toLowerCase().trim() === 'privateschoolonlineschooling@gmail.com'
  );

  if (isSuperAdmin) {
    return {
      ...user,
      role: 'admin',
      isVerified: true,
      verificationStatus: 'verified',
      verificationCategory: 'organization',
      accountStatus: 'active',
      hasCompletedOnboarding: true,
      interests: user.interests?.length ? user.interests : ['Education', 'Online Learning', 'Administration'],
      settings: {
        ...user.settings,
        emailVerified: true
      }
    };
  }

  // Strictly enforce that non-superadmin accounts do NOT receive admin privileges
  return {
    ...user,
    hasCompletedOnboarding: user.hasCompletedOnboarding ?? false,
    interests: user.interests || [],
    role: user.role === 'admin' ? 'user' : (user.role || 'user')
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUsersAndMe = async () => {
    try {
      setIsLoading(true);
      const [meRes, allRes] = await Promise.all([
        api.getMe().catch(() => ({ user: null })),
        api.getAllUsers().catch(() => ({ users: [] }))
      ]);
      
      const user = formatUserWithPermissions(meRes.user || null);
      setCurrentUser(user);
      setAllUsers((allRes.users || []).map(u => formatUserWithPermissions(u)!));

      if (user) {
        firestoreService.saveUser(user).catch(() => {});
      }
    } catch (err) {
      console.error('Error loading auth user:', err);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup middleware and error logging on the API client for 405/500 diagnostics
  useEffect(() => {
    // 1. Error interceptor callback (intercepts parsed response & errors)
    const removeErrorInterceptor = api.addErrorInterceptor((errorCtx: ApiErrorContext) => {
      logApiDiagnostic(
        'INTERCEPTOR',
        errorCtx.status,
        errorCtx.statusText,
        errorCtx.method,
        errorCtx.endpoint,
        errorCtx.headers,
        errorCtx.body,
        errorCtx.responseBody || errorCtx.error.message
      );
    });

    // 2. Middleware pipeline wrapper (intercepts outgoing context and response stream)
    const removeMiddleware = api.use(async (ctx: ApiRequestContext, next) => {
      try {
        const response = await next();
        if (response.status === 405 || response.status >= 500) {
          logApiDiagnostic(
            'MIDDLEWARE',
            response.status,
            response.statusText,
            ctx.method,
            ctx.endpoint,
            ctx.headers,
            ctx.body,
            `Response status ${response.status} returned by server`
          );
        }
        return response;
      } catch (error: any) {
        if (error && (error.status === 405 || error.status >= 500)) {
          logApiDiagnostic(
            'MIDDLEWARE',
            error.status,
            'Request Exception',
            ctx.method,
            ctx.endpoint,
            ctx.headers,
            ctx.body,
            error.message || error
          );
        }
        throw error;
      }
    });

    fetchUsersAndMe();

    return () => {
      removeErrorInterceptor();
      removeMiddleware();
    };
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    const cleanId = usernameOrEmail.trim();
    if (cleanId.includes('@')) {
      try {
        await signInWithEmailAndPassword(auth, cleanId, password);
      } catch (err) {
        // Non-blocking Firebase fallback
      }
    }

    try {
      const res = await api.login(cleanId, password);
      const user = formatUserWithPermissions(res.user);
      if (user) {
        api.setCurrentUserId(user.id);
        setCurrentUser(user);
        firestoreService.saveUser(user).catch(() => {});
      }
      await fetchUsersAndMe();
    } catch (err: any) {
      const errMsg = typeof err === 'string'
        ? err
        : err?.message || (typeof err?.error === 'string' ? err.error : null) || 'Login failed. Please verify your credentials.';
      throw new Error(errMsg);
    }
  };

  const loginWithGoogle = async (googleData?: { email?: string; displayName?: string; avatar?: string; googleId?: string }) => {
    let email = googleData?.email?.trim();
    let displayName = googleData?.displayName?.trim();
    let avatar = googleData?.avatar;
    let googleId = googleData?.googleId;

    if (!email) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        email = fbUser.email || undefined;
        displayName = fbUser.displayName || undefined;
        avatar = fbUser.photoURL || undefined;
        googleId = fbUser.uid;
      } catch (err: any) {
        console.warn('Firebase Google Popup blocked or domain not whitelisted in preview:', err);
      }
    }

    if (!email) {
      throw new Error('Google authentication cancelled or not completed. Please try again or create an account with email.');
    }

    const resolvedEmail = email.toLowerCase().trim();
    const resolvedName = displayName || (resolvedEmail.split('@')[0].charAt(0).toUpperCase() + resolvedEmail.split('@')[0].slice(1));

    try {
      const res = await api.loginWithGoogle({
        email: resolvedEmail,
        displayName: resolvedName,
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(resolvedName)}`,
        googleId: googleId || `g_${Date.now()}`
      });

      const user = formatUserWithPermissions(res.user);
      if (user) {
        api.setCurrentUserId(user.id);
        setCurrentUser(user);
        firestoreService.saveUser(user).catch(() => {});
      }
      await fetchUsersAndMe();
    } catch (err: any) {
      const errMsg = typeof err === 'string'
        ? err
        : err?.message || (typeof err?.error === 'string' ? err.error : null) || 'Google sign in failed';
      throw new Error(errMsg);
    }
  };

  const register = async (data: { username: string; email: string; password: string; displayName: string }) => {
    const cleanEmail = (data.email || '').toLowerCase().trim();
    let cleanUsername = (data.username || '').toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    let cleanDisplayName = (data.displayName || '').trim();

    if (!cleanDisplayName) cleanDisplayName = cleanUsername || 'User';
    if (!cleanUsername) cleanUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '') || `user_${Date.now()}`;

    try {
      // Non-blocking Firebase Auth creation
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
      if (userCredential.user) {
        await firebaseUpdateProfile(userCredential.user, {
          displayName: cleanDisplayName
        }).catch(() => {});
      }
    } catch (_err) {
      // Non-blocking Firebase fallback
    }

    try {
      const res = await api.register({
        username: cleanUsername,
        email: cleanEmail,
        password: data.password,
        displayName: cleanDisplayName
      });

      const user = formatUserWithPermissions(res.user);
      if (user) {
        api.setCurrentUserId(user.id);
        setCurrentUser(user);
        firestoreService.saveUser(user).catch(() => {});
      }
      await fetchUsersAndMe();
    } catch (err: any) {
      const errMsg = typeof err === 'string'
        ? err
        : err?.message || (typeof err?.error === 'string' ? err.error : null) || 'Registration could not be completed';
      throw new Error(errMsg);
    }
  };

  const logout = () => {
    firebaseSignOut(auth).catch(() => {});
    api.setCurrentUserId(null);
    setCurrentUser(null);
  };

  const switchUser = async (userId: string) => {
    api.setCurrentUserId(userId);
    const res = await api.getMe();
    setCurrentUser(res.user);
    if (res.user) {
      await firestoreService.saveUser(res.user);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    const res = await api.updateProfile(data);
    const formatted = formatUserWithPermissions(res.user);
    setCurrentUser(formatted);
    if (formatted) {
      await firestoreService.saveUser(formatted);
    }
    await fetchUsersAndMe();
  };

  const completeOnboarding = async (data: { avatar?: string; bio?: string; displayName?: string; location?: string; interests: string[] }) => {
    const res = await api.updateProfile({
      ...data,
      hasCompletedOnboarding: true
    });
    const formatted = formatUserWithPermissions(res.user);
    setCurrentUser(formatted);
    if (formatted) {
      await firestoreService.saveUser(formatted);
    }
    await fetchUsersAndMe();
  };

  const updateSettings = async (settings: Partial<UserSettings>) => {
    const res = await api.updateSettings(settings);
    setCurrentUser(res.user);
    await firestoreService.saveUser(res.user);
  };

  const verifyEmail = async () => {
    await api.verifyEmail();
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        settings: {
          ...currentUser.settings,
          emailVerified: true
        }
      };
      setCurrentUser(updatedUser);
      await firestoreService.saveUser(updatedUser);
    }
  };

  const toggleFollow = async (targetUserId: string): Promise<boolean> => {
    const res = await api.followUser(targetUserId);
    await fetchUsersAndMe();
    return res.following;
  };

  const blockUser = async (targetUserId: string) => {
    await api.blockUser(targetUserId);
    await fetchUsersAndMe();
  };

  const unblockUser = async (targetUserId: string) => {
    await api.unblockUser(targetUserId);
    await fetchUsersAndMe();
  };

  const muteUser = async (targetUserId: string) => {
    await api.muteUser(targetUserId);
    await fetchUsersAndMe();
  };

  const refreshUser = async () => {
    const res = await api.getMe();
    if (res.user) {
      setCurrentUser(res.user);
      await firestoreService.saveUser(res.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        switchUser,
        updateProfile,
        completeOnboarding,
        updateSettings,
        verifyEmail,
        toggleFollow,
        blockUser,
        unblockUser,
        muteUser,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
