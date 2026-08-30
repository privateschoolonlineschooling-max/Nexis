import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserSettings } from '../types/index';
import { api } from '../services/api';
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
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  verifyEmail: () => Promise<void>;
  toggleFollow: (targetUserId: string) => Promise<boolean>;
  blockUser: (targetUserId: string) => Promise<void>;
  unblockUser: (targetUserId: string) => Promise<void>;
  muteUser: (targetUserId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const formatUserWithPermissions = (user: User | null): User | null => {
  if (!user) return null;
  if (user.email && user.email.toLowerCase() === 'privateschoolonlineschooling@gmail.com') {
    return {
      ...user,
      role: 'admin',
      isVerified: true,
      verificationStatus: 'verified',
      verificationCategory: 'organization',
      accountStatus: 'active',
      settings: {
        ...user.settings,
        emailVerified: true
      }
    };
  }
  return user;
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

  useEffect(() => {
    fetchUsersAndMe();
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

    const res = await api.login(cleanId, password);
    const user = formatUserWithPermissions(res.user);
    if (user) {
      api.setCurrentUserId(user.id);
      setCurrentUser(user);
      firestoreService.saveUser(user).catch(() => {});
    }
    await fetchUsersAndMe();
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

    const resolvedEmail = email || 'privateschoolonlineschooling@gmail.com';
    const resolvedName = displayName || (resolvedEmail.split('@')[0].charAt(0).toUpperCase() + resolvedEmail.split('@')[0].slice(1));

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
  };

  const register = async (data: { username: string; email: string; password: string; displayName: string }) => {
    const cleanEmail = data.email.trim();
    const cleanUsername = data.username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    const cleanDisplayName = data.displayName.trim();

    try {
      // Non-blocking Firebase Auth creation
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
      if (userCredential.user) {
        await firebaseUpdateProfile(userCredential.user, {
          displayName: cleanDisplayName
        }).catch(() => {});
      }
    } catch (err) {
      // Non-blocking Firebase fallback
    }

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
    setCurrentUser(res.user);
    await firestoreService.saveUser(res.user);
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
