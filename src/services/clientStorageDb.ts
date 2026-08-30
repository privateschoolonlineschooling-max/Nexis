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
  CommunityRole,
  ReportCategory,
  ReportReason
} from '../types/index';

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
} from '../../server/seedData';

interface ClientDatabaseSchema {
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

const STORAGE_KEY = 'nexis_client_database_v2';

export class ClientStorageDb {
  private data: ClientDatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private isSuperAdminEmail(email?: string): boolean {
    if (!email) return false;
    const clean = email.toLowerCase().trim();
    return clean === 'privateschoolonlineschooling@gmail.com' || clean === 'admin@nexis.community';
  }

  private load(): ClientDatabaseSchema {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.users)) {
          let schoolAdmin = parsed.users.find((u: any) => this.isSuperAdminEmail(u.email));
          if (!schoolAdmin) {
            schoolAdmin = {
              ...initialUsers[0],
              passwordHash: 'password123'
            };
            parsed.users.push(schoolAdmin);
          } else {
            schoolAdmin.role = 'admin';
            schoolAdmin.isVerified = true;
            schoolAdmin.verificationStatus = 'verified';
            schoolAdmin.verificationCategory = 'organization';
            if (!schoolAdmin.passwordHash) schoolAdmin.passwordHash = 'password123';
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load local DB from storage:', e);
    }

    return {
      users: [...initialUsers],
      communities: [...initialCommunities],
      posts: [...initialPosts],
      comments: [...initialComments],
      listings: [...initialMarketplaceListings],
      reviews: [...initialReviews],
      conversations: [...initialConversations],
      messages: [...initialMessages],
      verifications: [...initialVerifications],
      reports: [...initialReports],
      notifications: [...initialNotifications],
      auditLogs: [...initialAuditLogs]
    };
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save local DB to storage:', e);
    }
  }

  // --- Auth & Users ---
  getUserById(id: string): (User & { passwordHash: string }) | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByUsername(username: string): (User & { passwordHash: string }) | undefined {
    const clean = username.toLowerCase().trim();
    return this.data.users.find(u => u.username.toLowerCase().trim() === clean);
  }

  getUserByEmail(email: string): (User & { passwordHash: string }) | undefined {
    const clean = email.toLowerCase().trim();
    return this.data.users.find(u => u.email.toLowerCase().trim() === clean);
  }

  register(userData: { username: string; email: string; password: string; displayName: string }): User {
    const cleanUsername = userData.username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    const cleanEmail = userData.email.toLowerCase().trim();
    const cleanDisplayName = userData.displayName.trim();
    const cleanPassword = userData.password;

    if (!cleanUsername || cleanUsername.length < 3) {
      throw new Error('Username must be at least 3 characters and contain only letters, numbers, and underscores.');
    }
    if (this.getUserByUsername(cleanUsername)) {
      throw new Error('This username is already taken. Please choose another one.');
    }
    if (this.getUserByEmail(cleanEmail)) {
      throw new Error('This email address is already registered. Please sign in instead.');
    }

    const isSuper = this.isSuperAdminEmail(cleanEmail);

    const newUser: User & { passwordHash: string } = {
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
        twoFactorEnabled: isSuper,
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

    this.data.users.push(newUser);
    this.save();

    const { passwordHash, ...safe } = newUser;
    return safe as User;
  }

  login(usernameOrEmail: string, password: string): User {
    const cleanIdentifier = String(usernameOrEmail).trim();
    const cleanPassword = String(password);

    let user = this.getUserByUsername(cleanIdentifier) || this.getUserByEmail(cleanIdentifier);

    if (!user) {
      if (this.isSuperAdminEmail(cleanIdentifier)) {
        user = {
          ...initialUsers[0],
          passwordHash: cleanPassword || 'password123'
        };
        this.data.users.push(user);
        this.save();
      } else {
        throw new Error('No account found matching this username or email.');
      }
    }

    if (user.passwordHash !== cleanPassword) {
      throw new Error('Incorrect password. Please verify and try again.');
    }

    if (user.accountStatus === 'banned') {
      throw new Error('Your account has been permanently suspended for terms of service violations.');
    }

    if (this.isSuperAdminEmail(user.email)) {
      user.role = 'admin';
      user.isVerified = true;
      user.verificationStatus = 'verified';
      user.verificationCategory = 'organization';
      this.save();
    }

    const { passwordHash, ...safe } = user;
    return safe as User;
  }

  loginWithGoogle(data: { email: string; displayName?: string; avatar?: string; googleId?: string }): User {
    const cleanEmail = data.email.toLowerCase().trim();
    let user = this.getUserByEmail(cleanEmail);

    if (!user) {
      const generatedUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '') + '_' + Math.floor(Math.random() * 899 + 100);
      const isSuper = this.isSuperAdminEmail(cleanEmail);
      user = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        username: generatedUsername,
        displayName: data.displayName || cleanEmail.split('@')[0],
        email: cleanEmail,
        passwordHash: 'google_auth_token',
        avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${generatedUsername}`,
        createdAt: new Date().toISOString(),
        isVerified: isSuper,
        verificationStatus: isSuper ? 'verified' : 'none',
        verificationCategory: isSuper ? 'organization' : undefined,
        role: isSuper ? 'admin' : 'user',
        accountStatus: 'active',
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
      this.data.users.push(user);
      this.save();
    } else {
      if (this.isSuperAdminEmail(cleanEmail)) {
        user.role = 'admin';
        user.isVerified = true;
        user.verificationStatus = 'verified';
        user.verificationCategory = 'organization';
        this.save();
      }
    }

    const { passwordHash, ...safe } = user;
    return safe as User;
  }

  getAllUsers(): User[] {
    return this.data.users.map(({ passwordHash, ...u }) => u as User);
  }

  updateProfile(userId: string, updateData: Partial<User>): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');

    Object.assign(user, updateData);
    if (this.isSuperAdminEmail(user.email)) {
      user.role = 'admin';
      user.isVerified = true;
      user.verificationStatus = 'verified';
    }
    this.save();
    const { passwordHash, ...safe } = user;
    return safe as User;
  }

  updateSettings(userId: string, settings: Partial<User['settings']>): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');

    user.settings = {
      ...user.settings,
      ...settings,
      notifications: {
        ...user.settings.notifications,
        ...(settings.notifications || {})
      }
    };
    this.save();
    const { passwordHash, ...safe } = user;
    return safe as User;
  }

  // --- Communities ---
  getCommunities(): Community[] {
    return this.data.communities;
  }

  getCommunity(slugOrId: string): Community | undefined {
    return this.data.communities.find(c => c.id === slugOrId || c.slug === slugOrId);
  }

  createCommunity(userId: string, data: Partial<Community>): Community {
    const user = this.getUserById(userId);
    const newCommunity: Community = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: data.name || 'Untitled Circle',
      slug: (data.slug || (data.name || 'circle').toLowerCase().replace(/[^a-z0-9]/g, '-')).replace(/-+/g, '-'),
      description: data.description || '',
      category: data.category || 'General',
      privacy: data.privacy || 'public',
      ownerId: userId,
      creatorId: userId,
      isVerified: false,
      verificationStatus: 'none',
      memberCount: 1,
      banner: data.banner || 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80',
      avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      rules: data.rules || [
        { id: 'r1', title: 'Respect', description: 'Be respectful to all members.' },
        { id: 'r2', title: 'No Spam', description: 'No spam or unsolicited promotions.' }
      ],
      tags: data.tags || ['community'],
      bannedUserIds: [],
      mutedUserIds: [],
      createdAt: new Date().toISOString(),
      members: [
        {
          userId,
          username: user?.username || 'user',
          displayName: user?.displayName || 'User',
          avatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
          isVerified: !!user?.isVerified,
          role: 'owner',
          joinedAt: new Date().toISOString()
        }
      ]
    };

    this.data.communities.push(newCommunity);
    this.save();
    return newCommunity;
  }

  updateCommunity(id: string, data: Partial<Community>): Community {
    const comm = this.getCommunity(id);
    if (!comm) throw new Error('Community not found');
    Object.assign(comm, data);
    this.save();
    return comm;
  }

  deleteCommunity(id: string): boolean {
    const index = this.data.communities.findIndex(c => c.id === id || c.slug === id);
    if (index === -1) return false;
    this.data.communities.splice(index, 1);
    this.save();
    return true;
  }

  joinCommunity(userId: string, commId: string): Community {
    const comm = this.getCommunity(commId);
    if (!comm) throw new Error('Community not found');
    const user = this.getUserById(userId);

    if (!comm.members) comm.members = [];
    if (!comm.members.some(m => m.userId === userId)) {
      comm.members.push({
        userId,
        username: user?.username || 'user',
        displayName: user?.displayName || 'User',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        isVerified: !!user?.isVerified,
        role: 'member',
        joinedAt: new Date().toISOString()
      });
      comm.memberCount = comm.members.length;
      this.save();
    }
    return comm;
  }

  leaveCommunity(userId: string, commId: string): Community {
    const comm = this.getCommunity(commId);
    if (!comm) throw new Error('Community not found');
    if (comm.members) {
      comm.members = comm.members.filter(m => m.userId !== userId);
      comm.memberCount = comm.members.length;
      this.save();
    }
    return comm;
  }

  // --- Posts & Comments ---
  getPosts(params?: { communityId?: string; authorId?: string; tag?: string; feedType?: string }): Post[] {
    let posts = [...this.data.posts];
    if (params?.communityId) {
      posts = posts.filter(p => p.communityId === params.communityId);
    }
    if (params?.authorId) {
      posts = posts.filter(p => p.authorId === params.authorId);
    }
    if (params?.tag) {
      posts = posts.filter(p => p.tags?.includes(params.tag!));
    }
    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getPost(id: string): { post: Post; comments: Comment[] } | undefined {
    const post = this.data.posts.find(p => p.id === id);
    if (!post) return undefined;
    const comments = this.data.comments.filter(c => c.postId === id);
    return { post, comments };
  }

  createPost(userId: string, data: Partial<Post>): Post {
    const author = this.getUserById(userId);
    const comm = data.communityId ? this.getCommunity(data.communityId) : undefined;

    const newPost: Post = {
      id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      authorId: userId,
      authorUsername: author?.username || 'user',
      authorDisplayName: author?.displayName || 'User',
      authorAvatar: author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      authorVerified: !!author?.isVerified,
      type: data.type || 'text',
      title: data.title || '',
      content: data.content || '',
      communityId: data.communityId,
      communityName: comm?.name,
      communitySlug: comm?.slug,
      images: data.images || [],
      tags: data.tags || [],
      mentions: data.mentions || [],
      likes: [],
      bookmarks: [],
      sharesCount: 0,
      commentsCount: 0,
      viewsCount: 0,
      visibility: data.visibility || 'public',
      pollOptions: data.pollOptions,
      pollEndsAt: data.pollEndsAt,
      isAnnouncement: data.isAnnouncement,
      isPinned: data.isPinned,
      createdAt: new Date().toISOString()
    };

    this.data.posts.unshift(newPost);
    this.save();
    return newPost;
  }

  likePost(userId: string, postId: string): { liked: boolean; likesCount: number } {
    const post = this.data.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');

    if (!post.likes) post.likes = [];
    const index = post.likes.indexOf(userId);
    let liked = false;

    if (index > -1) {
      post.likes.splice(index, 1);
      liked = false;
    } else {
      post.likes.push(userId);
      liked = true;
    }
    this.save();
    return { liked, likesCount: post.likes.length };
  }

  bookmarkPost(userId: string, postId: string): { bookmarked: boolean } {
    const post = this.data.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');

    if (!post.bookmarks) post.bookmarks = [];
    const index = post.bookmarks.indexOf(userId);
    let bookmarked = false;

    if (index > -1) {
      post.bookmarks.splice(index, 1);
      bookmarked = false;
    } else {
      post.bookmarks.push(userId);
      bookmarked = true;
    }
    this.save();
    return { bookmarked };
  }

  addComment(userId: string, postId: string, content: string, parentId?: string): Comment {
    const post = this.data.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');
    const author = this.getUserById(userId);

    const newComment: Comment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      postId,
      authorId: userId,
      authorUsername: author?.username || 'user',
      authorDisplayName: author?.displayName || 'User',
      authorAvatar: author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      authorVerified: !!author?.isVerified,
      content,
      parentId,
      likes: [],
      createdAt: new Date().toISOString()
    };

    this.data.comments.push(newComment);
    post.commentsCount = (post.commentsCount || 0) + 1;
    this.save();
    return newComment;
  }

  deletePost(postId: string): boolean {
    const index = this.data.posts.findIndex(p => p.id === postId);
    if (index === -1) return false;
    this.data.posts.splice(index, 1);
    this.data.comments = this.data.comments.filter(c => c.postId !== postId);
    this.save();
    return true;
  }

  // --- Marketplace ---
  getListings(params?: Record<string, any>): MarketplaceListing[] {
    let listings = [...this.data.listings];
    if (params?.category && params.category !== 'all') {
      listings = listings.filter(l => l.category.toLowerCase() === params.category.toLowerCase());
    }
    if (params?.sellerId) {
      listings = listings.filter(l => l.sellerId === params.sellerId);
    }
    return listings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getListing(id: string): { listing: MarketplaceListing; reviews: Review[] } | undefined {
    const listing = this.data.listings.find(l => l.id === id);
    if (!listing) return undefined;
    const reviews = this.data.reviews.filter(r => r.sellerId === listing.sellerId);
    return { listing, reviews };
  }

  createListing(userId: string, data: Partial<MarketplaceListing>): MarketplaceListing {
    const seller = this.getUserById(userId);
    const newListing: MarketplaceListing = {
      id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sellerId: userId,
      sellerUsername: seller?.username || 'user',
      sellerDisplayName: seller?.displayName || 'User',
      sellerAvatar: seller?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      sellerVerified: !!seller?.isVerified,
      sellerRating: seller?.rating || 5,
      sellerReviewCount: seller?.reviewCount || 0,
      title: data.title || '',
      description: data.description || '',
      price: Number(data.price) || 0,
      currency: data.currency || 'USD',
      category: data.category || 'Other',
      condition: data.condition || 'new',
      images: data.images || [],
      location: data.location || 'Global',
      status: 'available',
      savesCount: 0,
      savedByUserIds: [],
      viewsCount: 0,
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.listings.unshift(newListing);
    this.save();
    return newListing;
  }

  updateListingStatus(id: string, status: ListingStatus): MarketplaceListing {
    const listing = this.data.listings.find(l => l.id === id);
    if (!listing) throw new Error('Listing not found');
    listing.status = status;
    listing.updatedAt = new Date().toISOString();
    this.save();
    return listing;
  }

  saveListing(userId: string, id: string): { saved: boolean; savesCount: number } {
    const listing = this.data.listings.find(l => l.id === id);
    if (!listing) throw new Error('Listing not found');
    if (!listing.savedByUserIds) listing.savedByUserIds = [];
    const idx = listing.savedByUserIds.indexOf(userId);
    let saved = false;
    if (idx > -1) {
      listing.savedByUserIds.splice(idx, 1);
      saved = false;
    } else {
      listing.savedByUserIds.push(userId);
      saved = true;
    }
    listing.savesCount = listing.savedByUserIds.length;
    this.save();
    return { saved, savesCount: listing.savesCount };
  }

  deleteListing(id: string): boolean {
    const idx = this.data.listings.findIndex(l => l.id === id);
    if (idx === -1) return false;
    this.data.listings.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Conversations & Messages ---
  getConversations(userId: string): Conversation[] {
    return this.data.conversations
      .filter(c => c.participantIds.includes(userId))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  createConversation(userId: string, data: { isGroup: boolean; name?: string; participantIds: string[]; initialMessage?: string }): { conversation: Conversation; message?: DirectMessage } {
    const sender = this.getUserById(userId);
    const allParticipantIds = Array.from(new Set([userId, ...data.participantIds]));
    
    if (!data.isGroup && allParticipantIds.length === 2) {
      const existing = this.data.conversations.find(c => 
        !c.isGroup && 
        c.participantIds.length === 2 && 
        c.participantIds.includes(allParticipantIds[0]) && 
        c.participantIds.includes(allParticipantIds[1])
      );
      if (existing) {
        return { conversation: existing };
      }
    }

    const participants = allParticipantIds.map(id => {
      const u = this.getUserById(id);
      return {
        id,
        username: u?.username || 'user',
        displayName: u?.displayName || 'User',
        avatar: u?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        isVerified: !!u?.isVerified,
        isOnline: true
      };
    });

    const newConv: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isGroup: !!data.isGroup,
      name: data.name,
      participantIds: allParticipantIds,
      participants,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let initialMsg: DirectMessage | undefined;
    if (data.initialMessage) {
      initialMsg = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        conversationId: newConv.id,
        senderId: userId,
        senderUsername: sender?.username || 'user',
        senderDisplayName: sender?.displayName || 'User',
        senderAvatar: sender?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        senderVerified: !!sender?.isVerified,
        content: data.initialMessage,
        reactions: [],
        readByUserIds: [userId],
        createdAt: new Date().toISOString()
      };
      this.data.messages.push(initialMsg);
      newConv.lastMessage = {
        content: data.initialMessage,
        senderDisplayName: sender?.displayName || 'User',
        createdAt: initialMsg.createdAt,
        isRead: false
      };
    }

    this.data.conversations.unshift(newConv);
    this.save();
    return { conversation: newConv, message: initialMsg };
  }

  getMessages(convId: string): DirectMessage[] {
    return this.data.messages.filter(m => m.conversationId === convId);
  }

  sendMessage(userId: string, convId: string, data: { content?: string; attachments?: any[]; replyTo?: any }): DirectMessage {
    const conv = this.data.conversations.find(c => c.id === convId);
    if (!conv) throw new Error('Conversation not found');
    const sender = this.getUserById(userId);

    const newMsg: DirectMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId: convId,
      senderId: userId,
      senderUsername: sender?.username || 'user',
      senderDisplayName: sender?.displayName || 'User',
      senderAvatar: sender?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      senderVerified: !!sender?.isVerified,
      content: data.content || '',
      attachments: data.attachments,
      replyTo: data.replyTo,
      reactions: [],
      readByUserIds: [userId],
      createdAt: new Date().toISOString()
    };

    this.data.messages.push(newMsg);
    conv.lastMessage = {
      content: newMsg.content,
      senderDisplayName: newMsg.senderDisplayName,
      createdAt: newMsg.createdAt,
      isRead: false
    };
    conv.updatedAt = new Date().toISOString();
    this.save();
    return newMsg;
  }

  // --- Verifications ---
  getMyVerifications(userId: string): VerificationApplication[] {
    return this.data.verifications.filter(v => v.applicantId === userId || v.targetId === userId);
  }

  applyVerification(userId: string, data: Partial<VerificationApplication>): VerificationApplication {
    const applicant = this.getUserById(userId);
    const newApp: VerificationApplication = {
      id: `verif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      targetType: data.targetType || 'user',
      targetId: data.targetId || userId,
      targetName: data.targetName || applicant?.displayName || 'Applicant',
      targetSlugOrUsername: data.targetSlugOrUsername || applicant?.username || 'applicant',
      applicantId: userId,
      applicantUsername: applicant?.username || 'applicant',
      applicantEmail: applicant?.email || 'email@nexis.community',
      category: data.category || 'creator',
      statement: data.statement || 'Verification application',
      officialLinks: data.officialLinks || [],
      documentUrl: data.documentUrl,
      documentType: data.documentType,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    this.data.verifications.unshift(newApp);
    this.save();
    return newApp;
  }

  getModerationVerifications(status?: string): VerificationApplication[] {
    if (!status || status === 'all') return this.data.verifications;
    return this.data.verifications.filter(v => v.status === status);
  }

  reviewVerification(adminId: string, id: string, data: { status: VerificationStatus; adminNotes: string }): VerificationApplication {
    const app = this.data.verifications.find(v => v.id === id);
    if (!app) throw new Error('Verification application not found');

    app.status = data.status;
    app.adminNotes = data.adminNotes;
    app.reviewedBy = adminId;
    app.reviewedAt = new Date().toISOString();

    const isApproved = data.status === 'verified';

    if (app.targetType === 'user') {
      const user = this.getUserById(app.targetId);
      if (user) {
        user.isVerified = isApproved;
        user.verificationStatus = isApproved ? 'verified' : 'rejected';
        if (isApproved) {
          user.verificationCategory = app.category || 'creator';
        }
      }
    } else if (app.targetType === 'community') {
      const comm = this.getCommunity(app.targetId);
      if (comm) {
        comm.isVerified = isApproved;
        comm.verificationStatus = isApproved ? 'verified' : 'rejected';
      }
    }

    this.save();
    return app;
  }

  // --- Reports & Moderation ---
  submitReport(userId: string, data: Partial<Report>): Report {
    const reporter = this.getUserById(userId);
    const newReport: Report = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reporterId: userId,
      reporterUsername: reporter?.username || 'reporter',
      category: (data.category as ReportCategory) || 'user',
      targetId: data.targetId || '',
      targetTitleOrSnippet: data.targetTitleOrSnippet || 'Reported content',
      reason: (data.reason as ReportReason) || 'spam',
      details: data.details || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this.data.reports.unshift(newReport);
    this.save();
    return newReport;
  }

  getModerationReports(status?: string): Report[] {
    if (!status || status === 'all') return this.data.reports;
    return this.data.reports.filter(r => r.status === status);
  }

  resolveReport(adminId: string, id: string, data: { actionTaken: string; adminNotes: string }): Report {
    const rep = this.data.reports.find(r => r.id === id);
    if (!rep) throw new Error('Report not found');
    rep.status = 'resolved';
    rep.actionTaken = data.actionTaken as any;
    rep.adminNotes = data.adminNotes;
    rep.resolvedBy = adminId;
    rep.resolvedAt = new Date().toISOString();
    this.save();
    return rep;
  }

  banUser(userId: string, purgeContent: boolean = true): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    user.accountStatus = 'banned';

    if (purgeContent) {
      this.data.posts = this.data.posts.filter(p => p.authorId !== userId);
      this.data.comments = this.data.comments.filter(c => c.authorId !== userId);
      this.data.listings = this.data.listings.filter(l => l.sellerId !== userId);
    }

    this.save();
    const { passwordHash, ...safe } = user;
    return safe as User;
  }

  unbanUser(userId: string): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    user.accountStatus = 'active';
    this.save();
    const { passwordHash, ...safe } = user;
    return safe as User;
  }

  setUserVerification(userId: string, isVerified: boolean, category?: string): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    user.isVerified = isVerified;
    user.verificationStatus = isVerified ? 'verified' : 'none';
    if (isVerified && category) {
      user.verificationCategory = category as any;
    }
    this.save();
    const { passwordHash, ...safe } = user;
    return safe as User;
  }

  setUserRole(userId: string, role: 'admin' | 'moderator' | 'user'): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    user.role = role;
    this.save();
    const { passwordHash, ...safe } = user;
    return safe as User;
  }

  getUserActivity(userId: string) {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');

    const posts = this.data.posts.filter(p => p.authorId === userId);
    const comments = this.data.comments.filter(c => c.authorId === userId);
    const listings = this.data.listings.filter(l => l.sellerId === userId);
    const ownedCommunities = this.data.communities.filter(c => c.creatorId === userId || (c as any).ownerId === userId);
    const joinedCommunities = this.data.communities.filter(c => c.members?.some(m => m.userId === userId));
    const reportsAgainst = this.data.reports.filter(r => r.targetId === userId || (r.category === 'post' && posts.some(p => p.id === r.targetId)));
    const auditLogs = this.data.auditLogs.filter(a => a.targetId === userId || a.moderatorId === userId);

    const { passwordHash, ...safeUser } = user;
    return {
      user: safeUser as User,
      posts,
      comments,
      listings,
      ownedCommunities,
      joinedCommunities,
      reportsAgainst,
      auditLogs
    };
  }

  getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  // --- Notifications ---
  getNotifications(userId: string): Notification[] {
    return this.data.notifications.filter(n => n.userId === userId);
  }

  markNotificationRead(id: string): boolean {
    const notif = this.data.notifications.find(n => n.id === id);
    if (!notif) return false;
    notif.isRead = true;
    this.save();
    return true;
  }

  markAllNotificationsRead(userId: string): boolean {
    this.data.notifications.filter(n => n.userId === userId).forEach(n => { n.isRead = true; });
    this.save();
    return true;
  }

  // --- Discovery & Search ---
  getDiscovery() {
    return {
      trendingCommunities: this.data.communities.slice(0, 5),
      trendingPosts: this.data.posts.slice(0, 10),
      featuredListings: this.data.listings.slice(0, 8),
      verifiedUsers: this.getAllUsers().filter(u => u.isVerified),
      trendingTags: ['onlinelearning', 'creators', 'announcements', 'marketplace', 'education']
    };
  }

  search(query: string) {
    const q = query.toLowerCase().trim();
    if (!q) {
      return { users: [], communities: [], posts: [], listings: [] };
    }

    return {
      users: this.getAllUsers().filter(u => u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)),
      communities: this.data.communities.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)),
      posts: this.data.posts.filter(p => p.title?.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)),
      listings: this.data.listings.filter(l => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q))
    };
  }
}

export const clientDb = new ClientStorageDb();
