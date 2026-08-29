export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected' | 'revoked';

export type UserRole = 'user' | 'creator' | 'seller' | 'moderator' | 'admin';

export type AccountStatus = 'active' | 'suspended' | 'banned';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar: string;
  banner?: string;
  createdAt: string;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  verificationCategory?: 'creator' | 'business' | 'organization' | 'public_figure' | 'community_leader';
  role: UserRole;
  accountStatus: AccountStatus;
  followersCount: number;
  followingCount: number;
  rating?: number;
  reviewCount?: number;
  completedSales?: number;
  followers: string[]; // user IDs
  following: string[]; // user IDs
  blockedUserIds: string[];
  mutedUserIds: string[];
  settings: UserSettings;
}

export interface UserSettings {
  dmPermission: 'everyone' | 'followers' | 'none';
  profileVisibility: 'public' | 'followers' | 'private';
  onlineStatusVisible: boolean;
  activityVisible: boolean;
  marketplaceVisibility: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  notifications: {
    dms: boolean;
    followers: boolean;
    communityActivity: boolean;
    postReactions: boolean;
    comments: boolean;
    mentions: boolean;
    marketplace: boolean;
    verificationUpdates: boolean;
    securityAlerts: boolean;
  };
}

export type CommunityPrivacy = 'public' | 'private' | 'restricted';
export type CommunityRole = 'owner' | 'moderator' | 'member';

export interface CommunityRule {
  id: string;
  title: string;
  description: string;
}

export interface CommunityMember {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  isVerified: boolean;
  role: CommunityRole;
  joinedAt: string;
  isMuted?: boolean;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatar: string;
  banner: string;
  privacy: CommunityPrivacy;
  category: string;
  createdAt: string;
  ownerId: string;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  memberCount: number;
  rules: CommunityRule[];
  members: CommunityMember[];
  bannedUserIds: string[];
  mutedUserIds: string[];
  tags: string[];
}

export type PostType = 'text' | 'image' | 'video' | 'link' | 'poll' | 'announcement';

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voterIds: string[];
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar: string;
  authorVerified: boolean;
  content: string;
  createdAt: string;
  likes: string[]; // userIds
  parentId?: string; // for nested replies
}

export interface Post {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar: string;
  authorVerified: boolean;
  communityId?: string;
  communityName?: string;
  communitySlug?: string;
  type: PostType;
  title?: string;
  content: string;
  images?: string[];
  videoUrl?: string;
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  linkImage?: string;
  pollOptions?: PollOption[];
  pollEndsAt?: string;
  isAnnouncement?: boolean;
  isPinned?: boolean;
  visibility: 'public' | 'followers' | 'community';
  createdAt: string;
  updatedAt?: string;
  likes: string[]; // userIds
  bookmarks: string[]; // userIds
  sharesCount: number;
  commentsCount: number;
  viewsCount: number;
  tags: string[];
  mentions: string[];
}

export type ListingStatus = 'available' | 'reserved' | 'sold' | 'expired' | 'removed';
export type ItemCondition = 'new' | 'like_new' | 'good' | 'fair';

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  sellerUsername: string;
  sellerDisplayName: string;
  sellerAvatar: string;
  sellerVerified: boolean;
  sellerRating: number;
  sellerReviewCount: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: ItemCondition;
  location: string;
  images: string[];
  status: ListingStatus;
  externalPaymentLink?: string;
  externalPaymentProvider?: string; // e.g., 'Stripe', 'PayPal', 'Shopify', 'Gumroad', 'Etsy'
  createdAt: string;
  updatedAt?: string;
  viewsCount: number;
  savesCount: number;
  savedByUserIds: string[];
  tags?: string[];
}

export interface Review {
  id: string;
  sellerId: string;
  buyerId: string;
  buyerUsername: string;
  buyerDisplayName: string;
  buyerAvatar: string;
  buyerVerified: boolean;
  listingId?: string;
  listingTitle?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  reported?: boolean;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  username: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatar: string;
  senderVerified: boolean;
  content: string;
  attachments?: {
    type: 'image' | 'file';
    url: string;
    name: string;
    size?: string;
  }[];
  replyTo?: {
    id: string;
    senderDisplayName: string;
    content: string;
  };
  reactions: MessageReaction[];
  isEdited?: boolean;
  isDeleted?: boolean;
  readByUserIds: string[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name?: string;
  avatar?: string;
  participantIds: string[];
  participants: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    isVerified: boolean;
    isOnline?: boolean;
    lastActive?: string;
  }[];
  lastMessage?: {
    content: string;
    senderDisplayName: string;
    createdAt: string;
    isRead: boolean;
  };
  updatedAt: string;
  createdAt: string;
}

export interface VerificationApplication {
  id: string;
  targetType: 'user' | 'community';
  targetId: string;
  targetName: string;
  targetSlugOrUsername: string;
  applicantId: string;
  applicantUsername: string;
  applicantEmail: string;
  category: 'creator' | 'business' | 'organization' | 'public_figure' | 'community_leader';
  statement: string;
  officialLinks: string[];
  documentUrl?: string;
  documentType?: string;
  status: VerificationStatus;
  adminNotes?: string;
  reviewedBy?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export type ReportCategory = 'user' | 'post' | 'listing' | 'comment' | 'message' | 'community' | 'review';
export type ReportReason = 
  | 'spam'
  | 'harassment'
  | 'fraud_or_scam'
  | 'prohibited_item'
  | 'impersonation'
  | 'inappropriate_content'
  | 'misinformation'
  | 'other';

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reporterId: string;
  reporterUsername: string;
  category: ReportCategory;
  targetId: string;
  targetTitleOrSnippet: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  actionTaken?: 'warned' | 'content_removed' | 'suspended_7d' | 'banned' | 'dismissed';
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type NotificationType = 
  | 'dm'
  | 'follow'
  | 'reaction'
  | 'comment'
  | 'mention'
  | 'community_invite'
  | 'community_role'
  | 'marketplace_inquiry'
  | 'review'
  | 'verification'
  | 'security'
  | 'moderation';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  sourceUserId?: string;
  sourceUserName?: string;
  sourceUserAvatar?: string;
  createdAt: string;
}

export type Message = DirectMessage;
export type MarketplaceCategory = string;

export interface PlatformStats {
  totalUsers: number;
  verifiedUsers: number;
  totalCommunities: number;
  totalListings: number;
}

export interface AuditLog {
  id: string;
  moderatorId: string;
  moderatorUsername: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
}
