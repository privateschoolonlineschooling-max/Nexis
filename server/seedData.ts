import { 
  User, 
  Community, 
  Post, 
  Comment,
  MarketplaceListing, 
  Review, 
  Conversation, 
  DirectMessage, 
  VerificationApplication, 
  Report, 
  Notification, 
  AuditLog 
} from '../src/types/index';

export const initialUsers: (User & { passwordHash: string })[] = [
  {
    id: 'user_school_admin',
    username: 'privateschooladmin',
    displayName: 'Online Schooling Admin',
    email: 'privateschoolonlineschooling@gmail.com',
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
    rating: 5.0,
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
  }
];

export const initialCommunities: Community[] = [];

export const initialPosts: Post[] = [];

export const initialComments: Comment[] = [];

export const initialMarketplaceListings: MarketplaceListing[] = [];

export const initialReviews: Review[] = [];

export const initialConversations: Conversation[] = [];

export const initialMessages: DirectMessage[] = [];

export const initialVerifications: VerificationApplication[] = [];

export const initialReports: Report[] = [];

export const initialNotifications: Notification[] = [];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'audit_init',
    moderatorId: 'user_school_admin',
    moderatorUsername: 'privateschooladmin',
    action: 'PLATFORM_INITIALIZED',
    targetType: 'system',
    targetId: 'nexis_platform',
    details: 'System initialized with primary Super Admin verified credentials.',
    timestamp: '2025-01-01T00:00:00.000Z'
  }
];
