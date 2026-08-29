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
    // If usernameOrEmail looks like an email, attempt Firebase Auth sign-in
    if (usernameOrEmail.includes('@')) {
      try {
        await signInWithEmailAndPassword(auth, usernameOrEmail, password);
      } catch (err) {
        console.warn('Firebase Auth direct email sign-in fallback:', err);
      }
    }

    const res = await api.login(usernameOrEmail, password);
    api.setCurrentUserId(res.user.id);
    setCurrentUser(res.user);
    await firestoreService.saveUser(res.user);
    await fetchUsersAndMe();
  };

  const loginWithGoogle = async (googleData?: { email?: string; displayName?: string; avatar?: string; googleId?: string }) => {
    let email = googleData?.email;
    let displayName = googleData?.displayName;
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
        console.warn('Firebase Google Popup blocked or cancelled, using default payload:', err);
        // Fallback for sandboxed preview if popup is blocked
        if (!email) {
          email = 'google.user@nexis.io';
          displayName = 'Google Explorer';
          avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
          googleId = `g_${Date.now()}`;
        }
      }
    }

    const res = await api.loginWithGoogle({
      email: email || 'user.google@gmail.com',
      displayName: displayName || 'Google User',
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      googleId: googleId || `g_${Date.now()}`
    });

    api.setCurrentUserId(res.user.id);
    setCurrentUser(res.user);
    await firestoreService.saveUser(res.user);
    await fetchUsersAndMe();
  };

  const register = async (data: { username: string; email: string; password: string; displayName: string }) => {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (userCredential.user) {
        await firebaseUpdateProfile(userCredential.user, {
          displayName: data.displayName
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Firebase createUser warning (proceeding with DB registration):', err);
    }

    const res = await api.register(data);
    api.setCurrentUserId(res.user.id);
    setCurrentUser(res.user);
    await firestoreService.saveUser(res.user);
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
