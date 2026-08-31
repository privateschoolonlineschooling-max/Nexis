import { User, Community, Post, MarketplaceListing, Review, DirectMessage, VerificationApplication, Report, Notification } from '../types/index';

const STORAGE_KEY = 'nexis_client_db_v1';
const SUPER_ADMIN_EMAIL = 'privateschoolonlineschooling@gmail.com';

interface LocalUser extends User {
  passwordHash: string;
}

interface ClientDatabaseSchema {
  users: LocalUser[];
  communities: Community[];
  posts: Post[];
  listings: MarketplaceListing[];
  reviews: Review[];
  messages: DirectMessage[];
  verifications: VerificationApplication[];
  reports: Report[];
  notifications: Notification[];
}

const defaultAdminUser: LocalUser = {
  id: 'user_school_admin',
  username: 'privateschooladmin',
  displayName: 'Beverly (Admin)',
  email: SUPER_ADMIN_EMAIL,
  passwordHash: 'password123',
  bio: 'Official Super Administrator & Verification Lead for Private School Online Schooling.',
  location: 'Global',
  website: 'https://nexis.community',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
  createdAt: '2025-01-01T00:00:00.000Z',
  isVerified: true,
  verificationStatus: 'verified',
  verificationCategory: 'organization',
  role: 'admin',
  accountStatus: 'active',
  followersCount: 0,
  followingCount: 0,
  rating: 5,
  reviewCount: 0,
  completedSales: 0,
  followers: [],
  following: [],
  blockedUserIds: [],
  mutedUserIds: [],
  settings: {
    dmPermission: 'everyone',
    profileVisibility: 'public',
    onlineStatusVisible: true,
    activityVisible: true,
    marketplaceVisibility: true,
    emailVerified: true,
    twoFactorEnabled: true,
    notifications: {
      dms: true,
      followers: true,
      communityActivity: true,
      postReactions: true,
      comments: true,
      mentions: true,
      marketplace: true,
      verificationUpdates: true,
      securityAlerts: true,
    }
  },
  hasCompletedOnboarding: true,
  interests: ['Education', 'Online Learning', 'Administration']
};

class ClientStorage {
  private data: ClientDatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): ClientDatabaseSchema {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.users || !Array.isArray(parsed.users)) {
          parsed.users = [];
        }
        // Ensure super admin exists with correct admin role
        let admin = parsed.users.find((u: any) => u.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());
        if (!admin) {
          parsed.users.unshift(defaultAdminUser);
        } else {
          admin.role = 'admin';
          admin.isVerified = true;
          admin.verificationStatus = 'verified';
          admin.verificationCategory = 'organization';
          admin.accountStatus = 'active';
          admin.hasCompletedOnboarding = true;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read client db from localStorage:', e);
    }

    return {
      users: [defaultAdminUser],
      communities: [],
      posts: [],
      listings: [],
      reviews: [],
      messages: [],
      verifications: [],
      reports: [],
      notifications: []
    };
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Could not persist client db:', e);
    }
  }

  private sanitizeUser(user: LocalUser): User {
    const { passwordHash, ...safeUser } = user;
    if (safeUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      safeUser.role = 'admin';
      safeUser.isVerified = true;
      safeUser.verificationStatus = 'verified';
      safeUser.verificationCategory = 'organization';
      safeUser.accountStatus = 'active';
      if (safeUser.settings) safeUser.settings.emailVerified = true;
    }
    return safeUser as User;
  }

  public login(usernameOrEmail: string, password: string): { user: User } {
    const cleanId = usernameOrEmail.trim().toLowerCase();
    let user = this.data.users.find(
      u => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
    );

    if (!user) {
      if (cleanId === SUPER_ADMIN_EMAIL.toLowerCase() || cleanId === 'privateschooladmin') {
        user = { ...defaultAdminUser, passwordHash: password || 'password123' };
        this.data.users.unshift(user);
        this.save();
      } else {
        throw new Error('No account found matching this username or email.');
      }
    }

    if (user.passwordHash && user.passwordHash !== password) {
      throw new Error('Incorrect password. Please verify and try again.');
    }

    return { user: this.sanitizeUser(user) };
  }

  public register(payload: { username: string; email: string; password: string; displayName: string }): { user: User } {
    const cleanUsername = String(payload.username).toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    const cleanEmail = String(payload.email).toLowerCase().trim();
    const cleanDisplayName = String(payload.displayName).trim();
    const cleanPassword = String(payload.password);

    if (!cleanUsername || cleanUsername.length < 3) {
      throw new Error('Username must be at least 3 characters.');
    }

    if (this.data.users.some(u => u.username.toLowerCase() === cleanUsername)) {
      throw new Error('This username is already taken. Please choose another one.');
    }
    if (this.data.users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('This email address is already registered. Please sign in instead.');
    }

    const isSuper = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();

    const newUser: LocalUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: cleanUsername,
      displayName: cleanDisplayName,
      email: cleanEmail,
      passwordHash: cleanPassword,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
      createdAt: new Date().toISOString(),
      isVerified: isSuper,
      verificationStatus: isSuper ? 'verified' : 'none',
      verificationCategory: isSuper ? 'organization' : undefined,
      role: isSuper ? 'admin' : 'user',
      accountStatus: 'active',
      hasCompletedOnboarding: isSuper ? true : false,
      interests: isSuper ? ['Education', 'Online Learning', 'Administration'] : [],
      followersCount: 0,
      followingCount: 0,
      followers: [],
      following: [],
      blockedUserIds: [],
      mutedUserIds: [],
      settings: {
        dmPermission: 'everyone',
        profileVisibility: 'public',
        onlineStatusVisible: true,
        activityVisible: true,
        marketplaceVisibility: true,
        emailVerified: isSuper,
        twoFactorEnabled: false,
        notifications: {
          dms: true,
          followers: true,
          communityActivity: true,
          postReactions: true,
          comments: true,
          mentions: true,
          marketplace: true,
          verificationUpdates: true,
          securityAlerts: true,
        }
      }
    };

    this.data.users.unshift(newUser);
    this.save();
    return { user: this.sanitizeUser(newUser) };
  }

  public googleAuth(payload: { email: string; displayName?: string; avatar?: string; googleId?: string }): { user: User } {
    const cleanEmail = payload.email.toLowerCase().trim();
    let user = this.data.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      const isSuper = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();
      const baseUsername = (payload.displayName || cleanEmail.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 15) || 'user';
      let uniqueUsername = baseUsername;
      let counter = 1;
      while (this.data.users.some(u => u.username.toLowerCase() === uniqueUsername.toLowerCase())) {
        uniqueUsername = `${baseUsername}${counter}`;
        counter++;
      }

      user = {
        id: `user_g_${payload.googleId || Date.now()}`,
        username: uniqueUsername,
        displayName: payload.displayName || (cleanEmail.split('@')[0].charAt(0).toUpperCase() + cleanEmail.split('@')[0].slice(1)),
        email: cleanEmail,
        passwordHash: `google_${Date.now()}`,
        avatar: payload.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uniqueUsername}`,
        createdAt: new Date().toISOString(),
        isVerified: isSuper,
        verificationStatus: isSuper ? 'verified' : 'none',
        verificationCategory: isSuper ? 'organization' : undefined,
        role: isSuper ? 'admin' : 'user',
        accountStatus: 'active',
        hasCompletedOnboarding: isSuper ? true : false,
        interests: isSuper ? ['Education', 'Online Learning', 'Administration'] : [],
        followersCount: 0,
        followingCount: 0,
        followers: [],
        following: [],
        blockedUserIds: [],
        mutedUserIds: [],
        settings: {
          dmPermission: 'everyone',
          profileVisibility: 'public',
          onlineStatusVisible: true,
          activityVisible: true,
          marketplaceVisibility: true,
          emailVerified: true,
          twoFactorEnabled: false,
          notifications: {
            dms: true,
            followers: true,
            communityActivity: true,
            postReactions: true,
            comments: true,
            mentions: true,
            marketplace: true,
            verificationUpdates: true,
            securityAlerts: true,
          }
        }
      };

      this.data.users.unshift(user);
      this.save();
    }

    return { user: this.sanitizeUser(user) };
  }

  public getMe(userId?: string | null): { user: User | null } {
    if (!userId) return { user: null };
    const user = this.data.users.find(u => u.id === userId);
    return { user: user ? this.sanitizeUser(user) : null };
  }

  public getAllUsers(): { users: User[] } {
    return { users: this.data.users.map(u => this.sanitizeUser(u)) };
  }

  public getUser(identifier: string): { user: User } {
    const user = this.data.users.find(u => u.id === identifier || u.username.toLowerCase() === identifier.toLowerCase());
    if (!user) throw new Error('User not found');
    return { user: this.sanitizeUser(user) };
  }

  public updateProfile(userId: string, updates: Partial<User>): { user: User } {
    const idx = this.data.users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return { user: this.sanitizeUser(this.data.users[idx]) };
  }

  public updateSettings(userId: string, settings: any): { user: User } {
    const idx = this.data.users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    this.data.users[idx].settings = { ...this.data.users[idx].settings, ...settings };
    this.save();
    return { user: this.sanitizeUser(this.data.users[idx]) };
  }
}

export const clientStorage = new ClientStorage();
