import fs from 'fs';
import path from 'path';
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
  AuditLog,
  VerificationStatus,
  ListingStatus,
  CommunityRole
} from '../src/types/index';

import { 
  initialUsers, 
  initialCommunities, 
  initialPosts, 
  initialComments, 
  initialMarketplaceListings, 
  initialReviews, 
  initialConversations, 
  initialMessages, 
  initialVerifications, 
  initialReports, 
  initialNotifications, 
  initialAuditLogs 
} from './seedData';

interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  communities: Community[];
  posts: Post[];
  comments: Comment[];
  listings: MarketplaceListing[];
  reviews: Review[];
  conversations: Conversation[];
  messages: DirectMessage[];
  verifications: VerificationApplication[];
  reports: Report[];
  notifications: Notification[];
  auditLogs: AuditLog[];
}

class Database {
  private data: DatabaseSchema;
  private dbPath: string;

  constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (err) {
        console.error('Failed to create data directory:', err);
      }
    }
    this.dbPath = path.join(dataDir, 'database.json');
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(this.dbPath)) {
      try {
        const fileContent = fs.readFileSync(this.dbPath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        // Ensure no metadata communities exist
        if (parsed.communities) {
          parsed.communities = parsed.communities.filter((c: Community) => 
            !c.name.toLowerCase().includes('metadata') && !c.slug.toLowerCase().includes('metadata')
          );
        }
        // Ensure privateschoolonlineschooling@gmail.com is instantly verified admin
        let schoolAdmin = parsed.users?.find((u: any) => u.email?.toLowerCase() === 'privateschoolonlineschooling@gmail.com');
        if (!schoolAdmin && initialUsers[0]) {
          schoolAdmin = JSON.parse(JSON.stringify(initialUsers[0]));
          parsed.users.unshift(schoolAdmin);
        }
        if (schoolAdmin) {
          schoolAdmin.role = 'admin';
          schoolAdmin.isVerified = true;
          schoolAdmin.verificationStatus = 'verified';
          schoolAdmin.verificationCategory = 'organization';
          schoolAdmin.accountStatus = 'active';
        }
        return parsed;
      } catch (err) {
        console.warn('Error reading database file, resetting to initial seed:', err);
      }
    }

    const initialData: DatabaseSchema = {
      users: JSON.parse(JSON.stringify(initialUsers)),
      communities: JSON.parse(JSON.stringify(initialCommunities)).filter((c: Community) => 
        !c.name.toLowerCase().includes('metadata') && !c.slug.toLowerCase().includes('metadata')
      ),
      posts: JSON.parse(JSON.stringify(initialPosts)),
      comments: JSON.parse(JSON.stringify(initialComments)),
      listings: JSON.parse(JSON.stringify(initialMarketplaceListings)),
      reviews: JSON.parse(JSON.stringify(initialReviews)),
      conversations: JSON.parse(JSON.stringify(initialConversations)),
      messages: JSON.parse(JSON.stringify(initialMessages)),
      verifications: JSON.parse(JSON.stringify(initialVerifications)),
      reports: JSON.parse(JSON.stringify(initialReports)),
      notifications: JSON.parse(JSON.stringify(initialNotifications)),
      auditLogs: JSON.parse(JSON.stringify(initialAuditLogs))
    };

    this.save(initialData);
    return initialData;
  }

  private save(dataToSave?: DatabaseSchema) {
    const currentData = dataToSave || this.data;
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(currentData, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  // --- USERS ---
  getUsers(): User[] {
    return this.data.users.map(({ passwordHash, ...user }) => user as User);
  }

  getUserById(id: string): (User & { passwordHash: string }) | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByUsername(username: string): (User & { passwordHash: string }) | undefined {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  getUserByEmail(email: string): (User & { passwordHash: string }) | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: User & { passwordHash: string }): User {
    this.data.users.push(user);
    this.save();
    const { passwordHash, ...safeUser } = user;
    return safeUser as User;
  }

  updateUser(id: string, updates: Partial<User & { passwordHash?: string }>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    const { passwordHash, ...safeUser } = this.data.users[idx];
    return safeUser as User;
  }

  deleteUser(id: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.data.posts = this.data.posts.filter(p => p.authorId !== id);
    this.data.comments = this.data.comments.filter(c => c.authorId !== id);
    this.data.listings = this.data.listings.filter(l => l.sellerId !== id);
    this.save();
    return this.data.users.length < initialLen;
  }

  banUser(userId: string, moderatorId?: string | null, purgeContent: boolean = true): User | null {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return null;

    user.accountStatus = 'banned';

    if (purgeContent) {
      this.data.posts = this.data.posts.filter(p => p.authorId !== userId);
      this.data.comments = this.data.comments.filter(c => c.authorId !== userId);
      this.data.listings = this.data.listings.filter(l => l.sellerId !== userId);
    }

    const mod = moderatorId ? this.data.users.find(u => u.id === moderatorId) : null;
    this.addAuditLog({
      id: `audit_${Date.now()}`,
      moderatorId: moderatorId || 'system',
      moderatorUsername: mod?.username || 'moderator',
      action: 'USER_BANNED',
      targetType: 'user',
      targetId: userId,
      details: `User @${user.username} permanently banned by @${mod?.username || 'admin'}. Content purged: ${purgeContent}`,
      timestamp: new Date().toISOString()
    });

    this.save();
    const { passwordHash, ...safeUser } = user;
    return safeUser as User;
  }

  unbanUser(userId: string, moderatorId?: string | null): User | null {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return null;

    user.accountStatus = 'active';

    const mod = moderatorId ? this.data.users.find(u => u.id === moderatorId) : null;
    this.addAuditLog({
      id: `audit_${Date.now()}`,
      moderatorId: moderatorId || 'system',
      moderatorUsername: mod?.username || 'moderator',
      action: 'USER_UNBANNED',
      targetType: 'user',
      targetId: userId,
      details: `User @${user.username} unbanned by @${mod?.username || 'admin'}.`,
      timestamp: new Date().toISOString()
    });

    this.save();
    const { passwordHash, ...safeUser } = user;
    return safeUser as User;
  }

  followUser(followerId: string, targetId: string): { following: boolean; followersCount: number } {
    const follower = this.data.users.find(u => u.id === followerId);
    const target = this.data.users.find(u => u.id === targetId);
    if (!follower || !target || followerId === targetId) {
      throw new Error('Invalid follow request');
    }

    const isFollowing = follower.following.includes(targetId);
    if (isFollowing) {
      follower.following = follower.following.filter(id => id !== targetId);
      follower.followingCount = Math.max(0, follower.followingCount - 1);
      target.followers = target.followers.filter(id => id !== followerId);
      target.followersCount = Math.max(0, target.followersCount - 1);
    } else {
      follower.following.push(targetId);
      follower.followingCount += 1;
      target.followers.push(followerId);
      target.followersCount += 1;

      // Add Notification
      this.createNotification({
        id: `notif_${Date.now()}`,
        userId: targetId,
        type: 'follow',
        title: 'New Follower',
        message: `${follower.displayName} (@${follower.username}) started following you.`,
        link: `/profile/${follower.username}`,
        isRead: false,
        sourceUserId: follower.id,
        sourceUserName: follower.displayName,
        sourceUserAvatar: follower.avatar,
        createdAt: new Date().toISOString()
      });
    }

    this.save();
    return { following: !isFollowing, followersCount: target.followersCount };
  }

  blockUser(userId: string, targetId: string): boolean {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return false;
    if (!user.blockedUserIds.includes(targetId)) {
      user.blockedUserIds.push(targetId);
      // Remove follow relationships
      user.following = user.following.filter(id => id !== targetId);
      user.followers = user.followers.filter(id => id !== targetId);
      this.save();
    }
    return true;
  }

  unblockUser(userId: string, targetId: string): boolean {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return false;
    user.blockedUserIds = user.blockedUserIds.filter(id => id !== targetId);
    this.save();
    return true;
  }

  muteUser(userId: string, targetId: string): boolean {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return false;
    if (!user.mutedUserIds.includes(targetId)) {
      user.mutedUserIds.push(targetId);
      this.save();
    }
    return true;
  }

  unmuteUser(userId: string, targetId: string): boolean {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return false;
    user.mutedUserIds = user.mutedUserIds.filter(id => id !== targetId);
    this.save();
    return true;
  }

  // --- COMMUNITIES ---
  getCommunities(): Community[] {
    return this.data.communities;
  }

  getCommunityById(id: string): Community | undefined {
    return this.data.communities.find(c => c.id === id);
  }

  getCommunityBySlug(slug: string): Community | undefined {
    return this.data.communities.find(c => c.slug.toLowerCase() === slug.toLowerCase());
  }

  createCommunity(comm: Community): Community {
    this.data.communities.unshift(comm);
    this.save();
    return comm;
  }

  updateCommunity(id: string, updates: Partial<Community>): Community | null {
    const idx = this.data.communities.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.communities[idx] = { ...this.data.communities[idx], ...updates };
    this.save();
    return this.data.communities[idx];
  }

  deleteCommunity(id: string): boolean {
    const initialLen = this.data.communities.length;
    this.data.communities = this.data.communities.filter(c => c.id !== id);
    this.save();
    return this.data.communities.length < initialLen;
  }

  joinCommunity(userId: string, communityId: string): Community {
    const comm = this.data.communities.find(c => c.id === communityId);
    const user = this.data.users.find(u => u.id === userId);
    if (!comm || !user) throw new Error('Community or user not found');

    const existingMember = comm.members.find(m => m.userId === userId);
    if (!existingMember) {
      comm.members.push({
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        isVerified: user.isVerified,
        role: 'member',
        joinedAt: new Date().toISOString()
      });
      comm.memberCount += 1;
      this.save();
    }
    return comm;
  }

  leaveCommunity(userId: string, communityId: string): Community {
    const comm = this.data.communities.find(c => c.id === communityId);
    if (!comm) throw new Error('Community not found');
    if (comm.ownerId === userId) {
      throw new Error('Community owner cannot leave without transferring ownership');
    }

    comm.members = comm.members.filter(m => m.userId !== userId);
    comm.memberCount = Math.max(0, comm.members.length);
    this.save();
    return comm;
  }

  updateCommunityMemberRole(communityId: string, targetUserId: string, newRole: CommunityRole): Community {
    const comm = this.data.communities.find(c => c.id === communityId);
    if (!comm) throw new Error('Community not found');

    const member = comm.members.find(m => m.userId === targetUserId);
    if (!member) throw new Error('Member not found in community');

    if (newRole === 'owner') {
      // Transfer ownership
      const oldOwner = comm.members.find(m => m.userId === comm.ownerId);
      if (oldOwner) oldOwner.role = 'moderator';
      comm.ownerId = targetUserId;
    }
    member.role = newRole;
    this.save();
    return comm;
  }

  verifyCommunity(communityId: string, isVerified: boolean, moderatorId?: string): Community {
    const comm = this.data.communities.find(c => c.id === communityId);
    if (!comm) throw new Error('Community not found');

    comm.isVerified = isVerified;
    comm.verificationStatus = isVerified ? 'verified' : 'none';

    const mod = moderatorId ? this.data.users.find(u => u.id === moderatorId) : null;
    this.addAuditLog({
      id: `audit_${Date.now()}`,
      moderatorId: moderatorId || 'system',
      moderatorUsername: mod?.username || 'moderator',
      action: isVerified ? 'COMMUNITY_VERIFIED' : 'COMMUNITY_UNVERIFIED',
      targetType: 'community',
      targetId: communityId,
      details: `Community "${comm.name}" (${comm.slug}) ${isVerified ? 'verified' : 'unverified'} by @${mod?.username || 'admin'}`,
      timestamp: new Date().toISOString()
    });

    this.save();
    return comm;
  }

  banCommunityMember(communityId: string, targetUserId: string, moderatorId?: string): Community {
    const comm = this.data.communities.find(c => c.id === communityId);
    if (!comm) throw new Error('Community not found');

    comm.members = comm.members.filter(m => m.userId !== targetUserId);
    comm.memberCount = comm.members.length;
    if (!comm.bannedUserIds.includes(targetUserId)) {
      comm.bannedUserIds.push(targetUserId);
    }

    const mod = moderatorId ? this.data.users.find(u => u.id === moderatorId) : null;
    this.addAuditLog({
      id: `audit_${Date.now()}`,
      moderatorId: moderatorId || 'system',
      moderatorUsername: mod?.username || 'moderator',
      action: 'COMMUNITY_MEMBER_BANNED',
      targetType: 'user',
      targetId: targetUserId,
      details: `User ${targetUserId} banned from c/${comm.slug} by @${mod?.username || 'moderator'}`,
      timestamp: new Date().toISOString()
    });

    this.save();
    return comm;
  }

  muteCommunityMember(communityId: string, targetUserId: string, mute: boolean): Community {
    const comm = this.data.communities.find(c => c.id === communityId);
    if (!comm) throw new Error('Community not found');

    const member = comm.members.find(m => m.userId === targetUserId);
    if (member) {
      member.isMuted = mute;
    }
    if (mute && !comm.mutedUserIds.includes(targetUserId)) {
      comm.mutedUserIds.push(targetUserId);
    } else if (!mute) {
      comm.mutedUserIds = comm.mutedUserIds.filter(id => id !== targetUserId);
    }
    this.save();
    return comm;
  }

  // --- POSTS ---
  getPosts(params?: { 
    communityId?: string; 
    authorId?: string; 
    tag?: string; 
    feedType?: 'for-you' | 'following' | 'explore' | 'announcements' | 'joined-communities';
    currentUserId?: string;
  }): Post[] {
    let posts = [...this.data.posts];

    if (params?.communityId) {
      posts = posts.filter(p => p.communityId === params.communityId);
    }

    if (params?.authorId) {
      posts = posts.filter(p => p.authorId === params.authorId);
    }

    if (params?.tag) {
      posts = posts.filter(p => p.tags.some(t => t.toLowerCase() === params.tag?.toLowerCase()));
    }

    if (params?.feedType === 'announcements') {
      posts = posts.filter(p => p.isAnnouncement);
    } else if (params?.feedType === 'following' && params.currentUserId) {
      const user = this.data.users.find(u => u.id === params.currentUserId);
      if (user) {
        posts = posts.filter(p => user.following.includes(p.authorId) || p.authorId === params.currentUserId);
      }
    } else if (params?.feedType === 'joined-communities' && params.currentUserId) {
      const joinedCommIds = this.data.communities
        .filter(c => c.members?.some(m => m.userId === params.currentUserId))
        .map(c => c.id);
      posts = posts.filter(p => p.communityId && joinedCommIds.includes(p.communityId));
    }

    // Sort by createdAt descending, pinned first
    return posts.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  getPostById(id: string): Post | undefined {
    const post = this.data.posts.find(p => p.id === id);
    if (post) {
      post.viewsCount += 1;
      this.save();
    }
    return post;
  }

  createPost(post: Post): Post {
    this.data.posts.unshift(post);
    this.save();
    return post;
  }

  updatePost(id: string, updates: Partial<Post>): Post | null {
    const idx = this.data.posts.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.posts[idx] = { ...this.data.posts[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.posts[idx];
  }

  deletePost(id: string): boolean {
    const initialLen = this.data.posts.length;
    this.data.posts = this.data.posts.filter(p => p.id !== id);
    this.data.comments = this.data.comments.filter(c => c.postId !== id);
    this.save();
    return this.data.posts.length < initialLen;
  }

  likePost(postId: string, userId: string): { liked: boolean; likesCount: number } {
    const post = this.data.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');

    const isLiked = post.likes.includes(userId);
    if (isLiked) {
      post.likes = post.likes.filter(id => id !== userId);
    } else {
      post.likes.push(userId);
      // Notify post author
      if (post.authorId !== userId) {
        const user = this.data.users.find(u => u.id === userId);
        this.createNotification({
          id: `notif_${Date.now()}`,
          userId: post.authorId,
          type: 'reaction',
          title: 'Post Liked',
          message: `${user?.displayName || 'Someone'} liked your post.`,
          link: `/post/${postId}`,
          isRead: false,
          sourceUserId: userId,
          sourceUserName: user?.displayName,
          sourceUserAvatar: user?.avatar,
          createdAt: new Date().toISOString()
        });
      }
    }

    this.save();
    return { liked: !isLiked, likesCount: post.likes.length };
  }

  bookmarkPost(postId: string, userId: string): { bookmarked: boolean } {
    const post = this.data.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');

    const isBookmarked = post.bookmarks.includes(userId);
    if (isBookmarked) {
      post.bookmarks = post.bookmarks.filter(id => id !== userId);
    } else {
      post.bookmarks.push(userId);
    }
    this.save();
    return { bookmarked: !isBookmarked };
  }

  votePoll(postId: string, optionId: string, userId: string): Post {
    const post = this.data.posts.find(p => p.id === postId);
    if (!post || post.type !== 'poll' || !post.pollOptions) {
      throw new Error('Invalid poll');
    }

    // Check if user already voted on any option
    const alreadyVoted = post.pollOptions.some(opt => opt.voterIds.includes(userId));
    if (alreadyVoted) {
      // Remove old vote first
      post.pollOptions.forEach(opt => {
        if (opt.voterIds.includes(userId)) {
          opt.voterIds = opt.voterIds.filter(id => id !== userId);
          opt.votes = Math.max(0, opt.votes - 1);
        }
      });
    }

    // Add new vote
    const option = post.pollOptions.find(opt => opt.id === optionId);
    if (option) {
      option.voterIds.push(userId);
      option.votes += 1;
    }

    this.save();
    return post;
  }

  // --- COMMENTS ---
  getComments(postId: string): Comment[] {
    return this.data.comments.filter(c => c.postId === postId);
  }

  addComment(comment: Comment): Comment {
    this.data.comments.push(comment);
    const post = this.data.posts.find(p => p.id === comment.postId);
    if (post) {
      post.commentsCount += 1;
      // Notify post author
      if (post.authorId !== comment.authorId) {
        this.createNotification({
          id: `notif_${Date.now()}`,
          userId: post.authorId,
          type: 'comment',
          title: 'New Comment',
          message: `${comment.authorDisplayName} commented: "${comment.content.slice(0, 50)}..."`,
          link: `/post/${post.id}`,
          isRead: false,
          sourceUserId: comment.authorId,
          sourceUserName: comment.authorDisplayName,
          sourceUserAvatar: comment.authorAvatar,
          createdAt: new Date().toISOString()
        });
      }
    }
    this.save();
    return comment;
  }

  deleteComment(commentId: string): boolean {
    const comment = this.data.comments.find(c => c.id === commentId);
    if (!comment) return false;
    this.data.comments = this.data.comments.filter(c => c.id !== commentId);
    const post = this.data.posts.find(p => p.id === comment.postId);
    if (post && post.commentsCount > 0) {
      post.commentsCount -= 1;
    }
    this.save();
    return true;
  }

  // --- MARKETPLACE LISTINGS ---
  getListings(params?: {
    category?: string;
    condition?: string;
    status?: string;
    sellerId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'newest' | 'price_low' | 'price_high' | 'popular';
  }): MarketplaceListing[] {
    let list = [...this.data.listings];

    if (params?.sellerId) {
      list = list.filter(l => l.sellerId === params.sellerId);
    }

    if (params?.category && params.category !== 'all') {
      list = list.filter(l => l.category.toLowerCase() === params.category?.toLowerCase());
    }

    if (params?.condition && params.condition !== 'all') {
      list = list.filter(l => l.condition === params.condition);
    }

    if (params?.status) {
      list = list.filter(l => l.status === params.status);
    } else {
      // By default show available and reserved unless seller queries
      if (!params?.sellerId) {
        list = list.filter(l => l.status !== 'removed');
      }
    }

    if (params?.minPrice !== undefined && !isNaN(params.minPrice)) {
      list = list.filter(l => l.price >= (params.minPrice || 0));
    }

    if (params?.maxPrice !== undefined && !isNaN(params.maxPrice)) {
      list = list.filter(l => l.price <= (params.maxPrice || Infinity));
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(l => 
        l.title.toLowerCase().includes(q) || 
        l.description.toLowerCase().includes(q) || 
        l.location.toLowerCase().includes(q) ||
        l.sellerDisplayName.toLowerCase().includes(q)
      );
    }

    if (params?.sort === 'price_low') {
      list.sort((a, b) => a.price - b.price);
    } else if (params?.sort === 'price_high') {
      list.sort((a, b) => b.price - a.price);
    } else if (params?.sort === 'popular') {
      list.sort((a, b) => (b.viewsCount + b.savesCount * 3) - (a.viewsCount + a.savesCount * 3));
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }

  getListingById(id: string): MarketplaceListing | undefined {
    const item = this.data.listings.find(l => l.id === id);
    if (item) {
      item.viewsCount += 1;
      this.save();
    }
    return item;
  }

  createListing(listing: MarketplaceListing): MarketplaceListing {
    this.data.listings.unshift(listing);
    this.save();
    return listing;
  }

  updateListing(id: string, updates: Partial<MarketplaceListing>): MarketplaceListing | null {
    const idx = this.data.listings.findIndex(l => l.id === id);
    if (idx === -1) return null;
    this.data.listings[idx] = { ...this.data.listings[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.listings[idx];
  }

  updateListingStatus(id: string, status: ListingStatus, sellerId: string): MarketplaceListing | null {
    const listing = this.data.listings.find(l => l.id === id);
    if (!listing) return null;
    if (listing.sellerId !== sellerId) {
      const user = this.data.users.find(u => u.id === sellerId);
      if (user?.role !== 'admin' && user?.role !== 'moderator') {
        throw new Error('Unauthorized to update listing status');
      }
    }

    listing.status = status;
    listing.updatedAt = new Date().toISOString();

    // If marked sold, increment completedSales
    if (status === 'sold') {
      const seller = this.data.users.find(u => u.id === listing.sellerId);
      if (seller) {
        seller.completedSales = (seller.completedSales || 0) + 1;
      }
    }

    this.save();
    return listing;
  }

  deleteListing(id: string): boolean {
    const initialLen = this.data.listings.length;
    this.data.listings = this.data.listings.filter(l => l.id !== id);
    this.save();
    return this.data.listings.length < initialLen;
  }

  saveListing(listingId: string, userId: string): { saved: boolean; savesCount: number } {
    const listing = this.data.listings.find(l => l.id === listingId);
    if (!listing) throw new Error('Listing not found');

    const isSaved = listing.savedByUserIds.includes(userId);
    if (isSaved) {
      listing.savedByUserIds = listing.savedByUserIds.filter(id => id !== userId);
      listing.savesCount = Math.max(0, listing.savesCount - 1);
    } else {
      listing.savedByUserIds.push(userId);
      listing.savesCount += 1;
    }
    this.save();
    return { saved: !isSaved, savesCount: listing.savesCount };
  }

  // --- REVIEWS ---
  getReviewsBySellerId(sellerId: string): Review[] {
    return this.data.reviews.filter(r => r.sellerId === sellerId);
  }

  createReview(review: Review): Review {
    // Check if buyer already reviewed this seller for this specific transaction or recently
    const existing = this.data.reviews.find(
      r => r.sellerId === review.sellerId && r.buyerId === review.buyerId && r.listingId === review.listingId
    );
    if (existing) {
      throw new Error('You have already submitted a review for this transaction.');
    }

    this.data.reviews.unshift(review);

    // Update seller rating
    const sellerReviews = this.data.reviews.filter(r => r.sellerId === review.sellerId);
    const avgRating = sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length;
    const seller = this.data.users.find(u => u.id === review.sellerId);
    if (seller) {
      seller.rating = Math.round(avgRating * 10) / 10;
      seller.reviewCount = sellerReviews.length;
    }

    // Notify seller
    this.createNotification({
      id: `notif_${Date.now()}`,
      userId: review.sellerId,
      type: 'review',
      title: 'New Seller Review Received',
      message: `${review.buyerDisplayName} rated your transaction ${review.rating} stars!`,
      link: `/seller/${review.sellerId}`,
      isRead: false,
      sourceUserId: review.buyerId,
      sourceUserName: review.buyerDisplayName,
      sourceUserAvatar: review.buyerAvatar,
      createdAt: new Date().toISOString()
    });

    this.save();
    return review;
  }

  // --- MESSAGES & CONVERSATIONS ---
  getConversations(userId: string): Conversation[] {
    return this.data.conversations
      .filter(c => c.participantIds.includes(userId))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getConversationById(id: string): Conversation | undefined {
    return this.data.conversations.find(c => c.id === id);
  }

  createConversation(data: { isGroup: boolean; name?: string; participantIds: string[]; initialMessage?: string; senderId: string }): { conversation: Conversation; message?: DirectMessage } {
    const sender = this.data.users.find(u => u.id === data.senderId);
    if (!sender) throw new Error('Sender not found');

    // If 1-on-1, check if conversation already exists
    if (!data.isGroup && data.participantIds.length === 2) {
      const existing = this.data.conversations.find(
        c => !c.isGroup && 
        c.participantIds.includes(data.participantIds[0]) && 
        c.participantIds.includes(data.participantIds[1])
      );
      if (existing) {
        return { conversation: existing };
      }
    }

    const participants = data.participantIds.map(id => {
      const u = this.data.users.find(usr => usr.id === id);
      return {
        id,
        username: u?.username || 'user',
        displayName: u?.displayName || 'User',
        avatar: u?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        isVerified: !!u?.isVerified,
        isOnline: true
      };
    });

    const conversationId = `conv_${Date.now()}`;
    const newConv: Conversation = {
      id: conversationId,
      isGroup: data.isGroup,
      name: data.name,
      avatar: data.isGroup ? 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80' : undefined,
      participantIds: data.participantIds,
      participants,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let firstMsg: DirectMessage | undefined;
    if (data.initialMessage) {
      firstMsg = {
        id: `msg_${Date.now()}`,
        conversationId,
        senderId: sender.id,
        senderUsername: sender.username,
        senderDisplayName: sender.displayName,
        senderAvatar: sender.avatar,
        senderVerified: sender.isVerified,
        content: data.initialMessage,
        reactions: [],
        readByUserIds: [sender.id],
        createdAt: new Date().toISOString()
      };
      this.data.messages.push(firstMsg);
      newConv.lastMessage = {
        content: data.initialMessage,
        senderDisplayName: sender.displayName,
        createdAt: firstMsg.createdAt,
        isRead: false
      };
    }

    this.data.conversations.unshift(newConv);
    this.save();
    return { conversation: newConv, message: firstMsg };
  }

  getMessages(conversationId: string): DirectMessage[] {
    return this.data.messages.filter(m => m.conversationId === conversationId);
  }

  addMessage(msg: DirectMessage): DirectMessage {
    this.data.messages.push(msg);
    const conv = this.data.conversations.find(c => c.id === msg.conversationId);
    if (conv) {
      conv.updatedAt = msg.createdAt;
      conv.lastMessage = {
        content: msg.content,
        senderDisplayName: msg.senderDisplayName,
        createdAt: msg.createdAt,
        isRead: false
      };

      // Notify other participants
      conv.participantIds.forEach(pId => {
        if (pId !== msg.senderId) {
          this.createNotification({
            id: `notif_${Date.now()}_${pId}`,
            userId: pId,
            type: 'dm',
            title: conv.isGroup ? `New in ${conv.name || 'Group Chat'}` : `Message from ${msg.senderDisplayName}`,
            message: msg.content.slice(0, 60),
            link: '/messages',
            isRead: false,
            sourceUserId: msg.senderId,
            sourceUserName: msg.senderDisplayName,
            sourceUserAvatar: msg.senderAvatar,
            createdAt: new Date().toISOString()
          });
        }
      });
    }
    this.save();
    return msg;
  }

  markMessagesRead(conversationId: string, userId: string): boolean {
    const msgs = this.data.messages.filter(m => m.conversationId === conversationId);
    let changed = false;
    msgs.forEach(m => {
      if (!m.readByUserIds.includes(userId)) {
        m.readByUserIds.push(userId);
        changed = true;
      }
    });

    const conv = this.data.conversations.find(c => c.id === conversationId);
    if (conv && conv.lastMessage) {
      conv.lastMessage.isRead = true;
    }

    if (changed) this.save();
    return true;
  }

  editMessage(messageId: string, newContent: string, userId: string): DirectMessage | null {
    const msg = this.data.messages.find(m => m.id === messageId);
    if (!msg || msg.senderId !== userId) return null;
    msg.content = newContent;
    msg.isEdited = true;
    this.save();
    return msg;
  }

  deleteMessage(messageId: string, userId: string): boolean {
    const msg = this.data.messages.find(m => m.id === messageId);
    if (!msg || msg.senderId !== userId) return false;
    msg.isDeleted = true;
    msg.content = '[This message was deleted by the sender]';
    this.save();
    return true;
  }

  reactMessage(messageId: string, emoji: string, userId: string, username: string): DirectMessage | null {
    const msg = this.data.messages.find(m => m.id === messageId);
    if (!msg) return null;

    const existingReaction = msg.reactions.find(r => r.userId === userId && r.emoji === emoji);
    if (existingReaction) {
      msg.reactions = msg.reactions.filter(r => !(r.userId === userId && r.emoji === emoji));
    } else {
      msg.reactions.push({ emoji, userId, username });
    }
    this.save();
    return msg;
  }

  // --- VERIFICATIONS ---
  getVerifications(status?: VerificationStatus): VerificationApplication[] {
    if (status) {
      return this.data.verifications.filter(v => v.status === status);
    }
    return this.data.verifications;
  }

  getVerificationById(id: string): VerificationApplication | undefined {
    return this.data.verifications.find(v => v.id === id);
  }

  createVerification(verif: VerificationApplication): VerificationApplication {
    this.data.verifications.unshift(verif);
    // Update target status to pending
    if (verif.targetType === 'user') {
      const user = this.data.users.find(u => u.id === verif.targetId);
      if (user) user.verificationStatus = 'pending';
    } else {
      const comm = this.data.communities.find(c => c.id === verif.targetId);
      if (comm) comm.verificationStatus = 'pending';
    }
    this.save();
    return verif;
  }

  reviewVerification(id: string, status: VerificationStatus, adminNotes: string, reviewerId: string): VerificationApplication | null {
    const app = this.data.verifications.find(v => v.id === id);
    if (!app) return null;

    app.status = status;
    app.adminNotes = adminNotes;
    app.reviewedBy = reviewerId;
    app.reviewedAt = new Date().toISOString();

    const isApproved = status === 'verified';

    if (app.targetType === 'user') {
      const user = this.data.users.find(u => u.id === app.targetId);
      if (user) {
        user.isVerified = isApproved;
        user.verificationStatus = status;
        if (isApproved) {
          user.verificationCategory = app.category;
        }
      }
    } else {
      const comm = this.data.communities.find(c => c.id === app.targetId);
      if (comm) {
        comm.isVerified = isApproved;
        comm.verificationStatus = status;
      }
    }

    // Add notification to applicant
    this.createNotification({
      id: `notif_${Date.now()}`,
      userId: app.applicantId,
      type: 'verification',
      title: isApproved ? 'Verification Approved!' : 'Verification Application Update',
      message: isApproved 
        ? `Congratulations! ${app.targetName} has been officially verified with a Verified Badge.`
        : `Your verification application for ${app.targetName} was reviewed: ${adminNotes || status}`,
      link: app.targetType === 'user' ? `/profile/${app.targetSlugOrUsername}` : `/community/${app.targetSlugOrUsername}`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    // Add audit log
    const reviewer = this.data.users.find(u => u.id === reviewerId);
    this.addAuditLog({
      id: `audit_${Date.now()}`,
      moderatorId: reviewerId,
      moderatorUsername: reviewer?.username || 'staff_mod',
      action: `VERIFICATION_${status.toUpperCase()}`,
      targetType: app.targetType,
      targetId: app.targetId,
      details: `Status set to ${status}. Notes: ${adminNotes}`,
      timestamp: new Date().toISOString()
    });

    this.save();
    return app;
  }

  // --- REPORTS & MODERATION ---
  getReports(status?: string): Report[] {
    if (status) {
      return this.data.reports.filter(r => r.status === status);
    }
    return this.data.reports;
  }

  createReport(report: Report): Report {
    this.data.reports.unshift(report);
    this.save();
    return report;
  }

  resolveReport(id: string, actionTaken: string, adminNotes: string, moderatorId: string): Report | null {
    const rep = this.data.reports.find(r => r.id === id);
    if (!rep) return null;

    const normalizedAction = (actionTaken || '').toLowerCase();
    const isDismiss = normalizedAction === 'dismissed' || normalizedAction === 'dismiss';
    rep.status = isDismiss ? 'dismissed' : 'resolved';
    rep.actionTaken = actionTaken as any;
    rep.adminNotes = adminNotes;
    rep.resolvedBy = moderatorId;
    rep.resolvedAt = new Date().toISOString();

    // Side effects based on actionTaken
    if (normalizedAction === 'content_deleted' || normalizedAction === 'content_removed' || normalizedAction === 'delete') {
      if (rep.category === 'post') {
        this.deletePost(rep.targetId);
      } else if (rep.category === 'listing') {
        this.deleteListing(rep.targetId);
      } else if (rep.category === 'comment') {
        this.deleteComment(rep.targetId);
      }
    } else if (normalizedAction === 'user_banned' || normalizedAction === 'banned' || normalizedAction === 'suspended_7d') {
      let offenderUserId = rep.targetId;
      if (rep.category === 'post') {
        const post = this.data.posts.find(p => p.id === rep.targetId);
        if (post) offenderUserId = post.authorId;
        this.deletePost(rep.targetId);
      } else if (rep.category === 'listing') {
        const listing = this.data.listings.find(l => l.id === rep.targetId);
        if (listing) offenderUserId = listing.sellerId;
        this.deleteListing(rep.targetId);
      } else if (rep.category === 'comment') {
        const comment = this.data.comments.find(c => c.id === rep.targetId);
        if (comment) offenderUserId = comment.authorId;
        this.deleteComment(rep.targetId);
      }

      if (offenderUserId) {
        this.banUser(offenderUserId, moderatorId, true);
      }
    }

    // Add audit log
    const mod = this.data.users.find(u => u.id === moderatorId);
    this.addAuditLog({
      id: `audit_${Date.now()}`,
      moderatorId,
      moderatorUsername: mod?.username || 'moderator',
      action: `REPORT_${normalizedAction.toUpperCase()}`,
      targetType: rep.category,
      targetId: rep.targetId,
      details: `Report #${rep.id} resolved with action ${actionTaken}. Notes: ${adminNotes}`,
      timestamp: new Date().toISOString()
    });

    this.save();
    return rep;
  }

  // --- NOTIFICATIONS ---
  getNotifications(userId: string): Notification[] {
    return this.data.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createNotification(notif: Notification): Notification {
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  markNotificationRead(id: string, userId: string): boolean {
    const notif = this.data.notifications.find(n => n.id === id && n.userId === userId);
    if (notif) {
      notif.isRead = true;
      this.save();
      return true;
    }
    return false;
  }

  markAllNotificationsRead(userId: string): boolean {
    this.data.notifications.forEach(n => {
      if (n.userId === userId) n.isRead = true;
    });
    this.save();
    return true;
  }

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLog[] {
    return this.data.auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  addAuditLog(log: AuditLog): AuditLog {
    this.data.auditLogs.unshift(log);
    this.save();
    return log;
  }

  // --- GLOBAL SEARCH ---
  globalSearch(query: string) {
    const raw = (query || '').trim();
    if (!raw) {
      return {
        users: [],
        communities: [],
        posts: [],
        listings: [],
        verifiedAccounts: []
      };
    }

    const q = raw.toLowerCase();
    const cleanQ = q.startsWith('@') ? q.slice(1).trim() : (q.startsWith('#') ? q.slice(1).trim() : (q.startsWith('c/') ? q.slice(2).trim() : q));

    const matchedUsers = this.getUsers().filter(u => {
      const uName = u.username.toLowerCase();
      const dName = u.displayName.toLowerCase();
      const bioText = (u.bio || '').toLowerCase();
      const locText = (u.location || '').toLowerCase();

      return (
        uName.includes(cleanQ) ||
        uName.includes(q) ||
        dName.includes(cleanQ) ||
        dName.includes(q) ||
        bioText.includes(cleanQ) ||
        locText.includes(cleanQ)
      );
    }).sort((a, b) => {
      const aUser = a.username.toLowerCase();
      const bUser = b.username.toLowerCase();

      // Exact match first
      if (aUser === cleanQ && bUser !== cleanQ) return -1;
      if (bUser === cleanQ && aUser !== cleanQ) return 1;

      // Prefix match second
      const aStarts = aUser.startsWith(cleanQ);
      const bStarts = bUser.startsWith(cleanQ);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Follower count / verified
      if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
      return (b.followersCount || 0) - (a.followersCount || 0);
    });

    const verifiedAccounts = matchedUsers.filter(u => u.isVerified);

    const matchedCommunities = this.data.communities.filter(c => {
      const cName = c.name.toLowerCase();
      const cSlug = c.slug.toLowerCase();
      const cDesc = c.description.toLowerCase();
      return (
        cName.includes(cleanQ) ||
        cSlug.includes(cleanQ) ||
        cDesc.includes(cleanQ) ||
        c.tags.some(t => t.toLowerCase().includes(cleanQ) || t.toLowerCase().includes(q))
      );
    });

    const matchedPosts = this.data.posts.filter(p => {
      const pContent = p.content.toLowerCase();
      const pTitle = (p.title || '').toLowerCase();
      const pAuthor = p.authorDisplayName.toLowerCase();
      const pAuthorUser = (p.authorUsername || '').toLowerCase();
      return (
        pContent.includes(q) ||
        pContent.includes(cleanQ) ||
        pTitle.includes(q) ||
        pTitle.includes(cleanQ) ||
        p.tags.some(t => t.toLowerCase().includes(cleanQ) || t.toLowerCase().includes(q)) ||
        pAuthor.includes(cleanQ) ||
        pAuthorUser.includes(cleanQ)
      );
    });

    const matchedListings = this.data.listings.filter(l => {
      const lTitle = l.title.toLowerCase();
      const lDesc = l.description.toLowerCase();
      const lCat = l.category.toLowerCase();
      const lLoc = l.location.toLowerCase();
      const lSeller = (l.sellerDisplayName || '').toLowerCase();
      const lSellerUser = (l.sellerUsername || '').toLowerCase();
      return (
        lTitle.includes(cleanQ) ||
        lTitle.includes(q) ||
        lDesc.includes(cleanQ) ||
        lCat.includes(cleanQ) ||
        lLoc.includes(cleanQ) ||
        lSeller.includes(cleanQ) ||
        lSellerUser.includes(cleanQ)
      );
    });

    return {
      users: matchedUsers,
      verifiedAccounts,
      communities: matchedCommunities,
      posts: matchedPosts,
      listings: matchedListings
    };
  }
}

export const db = new Database();
