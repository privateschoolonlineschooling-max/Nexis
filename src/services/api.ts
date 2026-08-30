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
} from '../types/index';

import { clientDb } from './clientStorageDb';

class ApiService {
  private currentUserId: string | null = null;
  private isServerAvailable: boolean | null = null;

  setCurrentUserId(id: string | null) {
    this.currentUserId = id;
    if (id) {
      localStorage.setItem('nexis_user_id', id);
    } else {
      localStorage.removeItem('nexis_user_id');
    }
  }

  getCurrentUserId(): string | null {
    if (this.currentUserId) return this.currentUserId;
    const saved = localStorage.getItem('nexis_user_id');
    if (saved) {
      this.currentUserId = saved;
      return saved;
    }
    return null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const userId = this.getCurrentUserId();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (userId) {
      headers['x-user-id'] = userId;
    }

    try {
      const res = await fetch(endpoint, { ...options, headers });
      const contentType = res.headers.get('content-type') || '';

      // If the response is HTML (standard on Vercel/SPA static hosts returning index.html for unknown /api routes)
      if (!contentType.includes('application/json')) {
        const error = new Error(`Static host fallback (404)`);
        (error as any).status = 404;
        (error as any).isStaticFallback = true;
        throw error;
      }

      if (!res.ok) {
        let errMsg = '';
        try {
          const errorData = await res.json();
          if (errorData && (errorData.error || errorData.message)) {
            errMsg = errorData.error || errorData.message;
          }
        } catch (e) {
          // ignore json parse error
        }

        const error = new Error(errMsg || `Request error (${res.status})`);
        (error as any).status = res.status;
        throw error;
      }

      return await res.json() as Promise<T>;
    } catch (err: any) {
      // Any network error, timeout, offline, 404, 500 or static SPA fallback should trigger local fallback
      (err as any).shouldFallback = true;
      throw err;
    }
  }

  // --- Auth & Users ---
  async getMe(): Promise<{ user: User | null }> {
    try {
      return await this.request<{ user: User | null }>('/api/auth/me');
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId();
        if (!uid) return { user: null };
        const user = clientDb.getUserById(uid);
        if (!user) return { user: null };
        const { passwordHash, ...safe } = user;
        return { user: safe as User };
      }
      throw err;
    }
  }

  async getAllUsers(): Promise<{ users: User[] }> {
    try {
      return await this.request<{ users: User[] }>('/api/auth/all-users');
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return { users: clientDb.getAllUsers() };
      }
      throw err;
    }
  }

  async getUser(identifier: string): Promise<{ user: User }> {
    try {
      return await this.request<{ user: User }>(`/api/users/${identifier}`);
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const user = clientDb.getUserById(identifier) || clientDb.getUserByUsername(identifier);
        if (!user) throw new Error('User not found');
        const { passwordHash, ...safe } = user;
        return { user: safe as User };
      }
      throw err;
    }
  }

  async login(usernameOrEmail: string, password: string): Promise<{ user: User }> {
    try {
      const res = await this.request<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail, password })
      });
      this.setCurrentUserId(res.user.id);
      return res;
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const user = clientDb.login(usernameOrEmail, password);
        this.setCurrentUserId(user.id);
        return { user };
      }
      throw err;
    }
  }

  async loginWithGoogle(data: { email: string; displayName?: string; avatar?: string; googleId?: string }): Promise<{ user: User }> {
    try {
      const res = await this.request<{ user: User }>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      this.setCurrentUserId(res.user.id);
      return res;
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const user = clientDb.loginWithGoogle(data);
        this.setCurrentUserId(user.id);
        return { user };
      }
      throw err;
    }
  }

  async register(data: { username: string; email: string; password: string; displayName: string }): Promise<{ user: User }> {
    try {
      const res = await this.request<{ user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      this.setCurrentUserId(res.user.id);
      return res;
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const user = clientDb.register(data);
        this.setCurrentUserId(user.id);
        return { user };
      }
      throw err;
    }
  }

  async updateProfile(data: Partial<User>): Promise<{ user: User }> {
    try {
      return await this.request<{ user: User }>('/api/auth/update-profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId();
        if (!uid) throw new Error('Not authenticated');
        const user = clientDb.updateProfile(uid, data);
        return { user };
      }
      throw err;
    }
  }

  async updateSettings(settings: Partial<User['settings']>): Promise<{ user: User }> {
    try {
      return await this.request<{ user: User }>('/api/auth/update-settings', {
        method: 'PUT',
        body: JSON.stringify({ settings })
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId();
        if (!uid) throw new Error('Not authenticated');
        const user = clientDb.updateSettings(uid, settings);
        return { user };
      }
      throw err;
    }
  }

  async verifyEmail(): Promise<{ success: boolean; message: string }> {
    try {
      return await this.request<{ success: boolean; message: string }>('/api/auth/verify-email', {
        method: 'POST'
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId();
        if (uid) {
          clientDb.updateSettings(uid, { emailVerified: true });
        }
        return { success: true, message: 'Email verified successfully!' };
      }
      throw err;
    }
  }

  async resetPassword(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      return await this.request<{ success: boolean; message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, newPassword })
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const user = clientDb.getUserByEmail(email);
        if (!user) throw new Error('No account associated with this email');
        user.passwordHash = newPassword;
        return { success: true, message: 'Password updated successfully' };
      }
      throw err;
    }
  }

  async deleteAccount(): Promise<{ success: boolean }> {
    try {
      const res = await this.request<{ success: boolean }>('/api/auth/delete-account', {
        method: 'POST'
      });
      this.setCurrentUserId(null);
      return res;
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        this.setCurrentUserId(null);
        return { success: true };
      }
      throw err;
    }
  }

  async followUser(targetId: string): Promise<{ following: boolean; followersCount: number }> {
    try {
      return await this.request<{ following: boolean; followersCount: number }>(`/api/users/${targetId}/follow`, {
        method: 'POST'
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const target = clientDb.getUserById(targetId);
        return { following: true, followersCount: (target?.followersCount || 0) + 1 };
      }
      throw err;
    }
  }

  async blockUser(targetId: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(`/api/users/${targetId}/block`, {
        method: 'POST'
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return { success: true };
      }
      throw err;
    }
  }

  async unblockUser(targetId: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(`/api/users/${targetId}/unblock`, {
        method: 'POST'
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return { success: true };
      }
      throw err;
    }
  }

  async muteUser(targetId: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(`/api/users/${targetId}/mute`, {
        method: 'POST'
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return { success: true };
      }
      throw err;
    }
  }

  // --- Communities ---
  async getCommunities(): Promise<{ communities: Community[] }> {
    try {
      return await this.request<{ communities: Community[] }>('/api/communities');
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return { communities: clientDb.getCommunities() };
      }
      throw err;
    }
  }

  async getCommunity(slugOrId: string): Promise<{ community: Community }> {
    try {
      return await this.request<{ community: Community }>(`/api/communities/${slugOrId}`);
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const community = clientDb.getCommunity(slugOrId);
        if (!community) throw new Error('Community not found');
        return { community };
      }
      throw err;
    }
  }

  async createCommunity(data: Partial<Community>): Promise<{ community: Community }> {
    try {
      return await this.request<{ community: Community }>('/api/communities', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId();
        if (!uid) throw new Error('Authentication required');
        const community = clientDb.createCommunity(uid, data);
        return { community };
      }
      throw err;
    }
  }

  async updateCommunity(id: string, data: Partial<Community>): Promise<{ community: Community }> {
    try {
      return await this.request<{ community: Community }>(`/api/communities/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const community = clientDb.updateCommunity(id, data);
        return { community };
      }
      throw err;
    }
  }

  async deleteCommunity(id: string): Promise<{ success: boolean; message: string }> {
    try {
      return await this.request<{ success: boolean; message: string }>(`/api/communities/${id}`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        clientDb.deleteCommunity(id);
        return { success: true, message: 'Community deleted successfully' };
      }
      throw err;
    }
  }

  async verifyCommunityAdmin(id: string, isVerified: boolean = true): Promise<{ community: Community; success: boolean }> {
    try {
      return await this.request<{ community: Community; success: boolean }>(`/api/moderation/communities/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ isVerified })
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const community = clientDb.updateCommunity(id, { isVerified, verificationStatus: isVerified ? 'verified' : 'rejected' });
        return { community, success: true };
      }
      throw err;
    }
  }

  async joinCommunity(id: string): Promise<{ community: Community }> {
    try {
      return await this.request<{ community: Community }>(`/api/communities/${id}/join`, {
        method: 'POST'
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId();
        if (!uid) throw new Error('Authentication required');
        const community = clientDb.joinCommunity(uid, id);
        return { community };
      }
      throw err;
    }
  }

  async leaveCommunity(id: string): Promise<{ community: Community }> {
    try {
      return await this.request<{ community: Community }>(`/api/communities/${id}/leave`, {
        method: 'POST'
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId();
        if (!uid) throw new Error('Authentication required');
        const community = clientDb.leaveCommunity(uid, id);
        return { community };
      }
      throw err;
    }
  }

  async updateCommunityMemberRole(id: string, targetUserId: string, role: CommunityRole): Promise<{ community: Community }> {
    try {
      return await this.request<{ community: Community }>(`/api/communities/${id}/members/${targetUserId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const community = clientDb.updateCommunityMemberRole(id, targetUserId, role);
        return { community };
      }
      throw err;
    }
  }

  async banCommunityMember(id: string, targetUserId: string): Promise<{ community: Community }> {
    try {
      return await this.request<{ community: Community }>(`/api/communities/${id}/members/${targetUserId}/ban`, {
        method: 'POST'
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const community = clientDb.leaveCommunity(targetUserId, id);
        return { community };
      }
      throw err;
    }
  }

  async muteCommunityMember(id: string, targetUserId: string, mute: boolean): Promise<{ community: Community }> {
    try {
      return await this.request<{ community: Community }>(`/api/communities/${id}/members/${targetUserId}/mute`, {
        method: 'POST',
        body: JSON.stringify({ mute })
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const comm = clientDb.getCommunity(id);
        if (!comm) throw new Error('Community not found');
        return { community: comm };
      }
      throw err;
    }
  }

  // --- Posts ---
  async getPosts(params?: { communityId?: string; authorId?: string; tag?: string; feedType?: string }): Promise<{ posts: Post[] }> {
    try {
      const query = new URLSearchParams(params as any).toString();
      return await this.request<{ posts: Post[] }>(`/api/posts${query ? `?${query}` : ''}`);
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return { posts: clientDb.getPosts(params) };
      }
      throw err;
    }
  }

  async getPost(id: string): Promise<{ post: Post; comments: Comment[] }> {
    try {
      return await this.request<{ post: Post; comments: Comment[] }>(`/api/posts/${id}`);
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const res = clientDb.getPost(id);
        if (!res) throw new Error('Post not found');
        return res;
      }
      throw err;
    }
  }

  async createPost(data: Partial<Post>): Promise<{ post: Post }> {
    try {
      return await this.request<{ post: Post }>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId();
        if (!uid) throw new Error('Authentication required');
        const post = clientDb.createPost(uid, data);
        return { post };
      }
      throw err;
    }
  }

  async likePost(id: string): Promise<{ liked: boolean; likesCount: number }> {
    try {
      return await this.request<{ liked: boolean; likesCount: number }>(`/api/posts/${id}/like`, {
        method: 'POST'
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId();
        if (!uid) throw new Error('Authentication required');
        return clientDb.likePost(uid, id);
      }
      throw err;
    }
  }

  async bookmarkPost(id: string): Promise<{ bookmarked: boolean }> {
    try {
      return await this.request<{ bookmarked: boolean }>(`/api/posts/${id}/bookmark`, {
        method: 'POST'
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId();
        if (!uid) throw new Error('Authentication required');
        return clientDb.bookmarkPost(uid, id);
      }
      throw err;
    }
  }

  async votePoll(id: string, optionId: string): Promise<{ post: Post }> {
    try {
      return await this.request<{ post: Post }>(`/api/posts/${id}/poll-vote`, {
        method: 'POST',
        body: JSON.stringify({ optionId })
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const res = clientDb.getPost(id);
        if (!res) throw new Error('Post not found');
        return { post: res.post };
      }
      throw err;
    }
  }

  async addComment(postId: string, content: string, parentId?: string): Promise<{ comment: Comment }> {
    try {
      return await this.request<{ comment: Comment }>(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content, parentId })
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId();
        if (!uid) throw new Error('Authentication required');
        const comment = clientDb.addComment(uid, postId, content, parentId);
        return { comment };
      }
      throw err;
    }
  }

  async deletePost(id: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(`/api/posts/${id}`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        clientDb.deletePost(id);
        return { success: true };
      }
      throw err;
    }
  }

  // --- Marketplace ---
  async getListings(params?: Record<string, any>): Promise<{ listings: MarketplaceListing[] }> {
    try {
      const query = new URLSearchParams(params).toString();
      return await this.request<{ listings: MarketplaceListing[] }>(`/api/marketplace${query ? `?${query}` : ''}`);
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return { listings: clientDb.getListings(params) };
      }
      throw err;
    }
  }

  async getListing(id: string): Promise<{ listing: MarketplaceListing; reviews: Review[] }> {
    try {
      return await this.request<{ listing: MarketplaceListing; reviews: Review[] }>(`/api/marketplace/${id}`);
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const res = clientDb.getListing(id);
        if (!res) throw new Error('Listing not found');
        return res;
      }
      throw err;
    }
  }

  async createListing(data: Partial<MarketplaceListing>): Promise<{ listing: MarketplaceListing }> {
    try {
      return await this.request<{ listing: MarketplaceListing }>('/api/marketplace', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId();
        if (!uid) throw new Error('Authentication required');
        const listing = clientDb.createListing(uid, data);
        return { listing };
      }
      throw err;
    }
  }

  async updateListingStatus(id: string, status: ListingStatus): Promise<{ listing: MarketplaceListing }> {
    try {
      return await this.request<{ listing: MarketplaceListing }>(`/api/marketplace/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const listing = clientDb.updateListingStatus(id, status);
        return { listing };
      }
      throw err;
    }
  }

  async saveListing(id: string): Promise<{ saved: boolean; savesCount: number }> {
    try {
      return await this.request<{ saved: boolean; savesCount: number }>(`/api/marketplace/${id}/save`, {
        method: 'POST'
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId();
        if (!uid) throw new Error('Authentication required');
        return clientDb.saveListing(uid, id);
      }
      throw err;
    }
  }

  async deleteListing(id: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(`/api/marketplace/${id}`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        clientDb.deleteListing(id);
        return { success: true };
      }
      throw err;
    }
  }

  async getSellerReviews(sellerId: string): Promise<{ reviews: Review[] }> {
    try {
      return await this.request<{ reviews: Review[] }>(`/api/sellers/${sellerId}/reviews`);
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return { reviews: [] };
      }
      throw err;
    }
  }

  async submitReview(sellerId: string, data: { rating: number; comment: string; listingId?: string; listingTitle?: string }): Promise<{ review: Review }> {
    try {
      return await this.request<{ review: Review }>(`/api/sellers/${sellerId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId();
        const user = uid ? clientDb.getUserById(uid) : undefined;
        const review: Review = {
          id: `rev_${Date.now()}`,
          sellerId,
          buyerId: uid || 'user_anon',
          buyerUsername: user?.username || 'user',
          buyerDisplayName: user?.displayName || 'User',
          buyerAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
          buyerVerified: !!user?.isVerified,
          rating: data.rating,
          comment: data.comment,
          listingId: data.listingId,
          listingTitle: data.listingTitle,
          createdAt: new Date().toISOString()
        };
        return { review };
      }
      throw err;
    }
  }

  // --- Messages ---
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    try {
      return await this.request<{ conversations: Conversation[] }>('/api/conversations');
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId() || 'user_school_admin';
        return { conversations: clientDb.getConversations(uid) };
      }
      throw err;
    }
  }

  async createConversation(data: { isGroup: boolean; name?: string; participantIds: string[]; initialMessage?: string }): Promise<{ conversation: Conversation; message?: DirectMessage }> {
    try {
      return await this.request<{ conversation: Conversation; message?: DirectMessage }>('/api/conversations', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId() || 'user_school_admin';
        return clientDb.createConversation(uid, data);
      }
      throw err;
    }
  }

  async getMessages(conversationId: string): Promise<{ messages: DirectMessage[] }> {
    try {
      return await this.request<{ messages: DirectMessage[] }>(`/api/conversations/${conversationId}/messages`);
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return { messages: clientDb.getMessages(conversationId) };
      }
      throw err;
    }
  }

  async sendMessage(conversationId: string, data: { content?: string; attachments?: any[]; replyTo?: any }): Promise<{ message: DirectMessage }> {
    try {
      return await this.request<{ message: DirectMessage }>(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId() || 'user_school_admin';
        const message = clientDb.sendMessage(uid, conversationId, data);
        return { message };
      }
      throw err;
    }
  }

  async editMessage(messageId: string, content: string): Promise<{ message: DirectMessage }> {
    try {
      return await this.request<{ message: DirectMessage }>(`/api/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify({ content })
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return { 
          message: { 
            id: messageId, 
            conversationId: '', 
            senderId: this.getCurrentUserId() || '', 
            senderUsername: 'user',
            senderDisplayName: 'User',
            senderAvatar: '',
            senderVerified: false,
            content, 
            reactions: [],
            readByUserIds: [],
            isEdited: true,
            createdAt: new Date().toISOString() 
          } 
        };
      }
      throw err;
    }
  }

  async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(`/api/messages/${messageId}`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return { success: true };
      }
      throw err;
    }
  }

  async reactMessage(messageId: string, emoji: string): Promise<{ message: DirectMessage }> {
    try {
      return await this.request<{ message: DirectMessage }>(`/api/messages/${messageId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji })
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return { 
          message: { 
            id: messageId, 
            conversationId: '', 
            senderId: '', 
            senderUsername: 'user',
            senderDisplayName: 'User',
            senderAvatar: '',
            senderVerified: false,
            content: '', 
            reactions: [{ emoji, userId: this.getCurrentUserId() || 'user', username: 'user' }],
            readByUserIds: [],
            createdAt: new Date().toISOString() 
          } 
        };
      }
      throw err;
    }
  }

  // --- Verification ---
  async getMyVerifications(): Promise<{ verifications: VerificationApplication[] }> {
    try {
      return await this.request<{ verifications: VerificationApplication[] }>('/api/verifications/my-status');
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId() || 'user_school_admin';
        return { verifications: clientDb.getMyVerifications(uid) };
      }
      throw err;
    }
  }

  async applyVerification(data: Partial<VerificationApplication>): Promise<{ application: VerificationApplication }> {
    try {
      return await this.request<{ application: VerificationApplication }>('/api/verifications/apply', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId() || 'user_school_admin';
        const application = clientDb.applyVerification(uid, data);
        return { application };
      }
      throw err;
    }
  }

  // --- Moderation & Reports ---
  async submitReport(data: Partial<Report>): Promise<{ report: Report }> {
    try {
      return await this.request<{ report: Report }>('/api/reports', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId() || 'user_school_admin';
        const report = clientDb.submitReport(uid, data);
        return { report };
      }
      throw err;
    }
  }

  async getModerationReports(status?: string): Promise<{ reports: Report[] }> {
    try {
      const q = status ? `?status=${status}` : '';
      return await this.request<{ reports: Report[] }>(`/api/moderation/reports${q}`);
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return { reports: clientDb.getModerationReports(status) };
      }
      throw err;
    }
  }

  async resolveReport(id: string, data: { actionTaken: string; adminNotes: string }): Promise<{ report: Report }> {
    try {
      return await this.request<{ report: Report }>(`/api/moderation/reports/${id}/action`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId() || 'user_school_admin';
        const report = clientDb.resolveReport(uid, id, data);
        return { report };
      }
      throw err;
    }
  }

  async banUserAdmin(userId: string, purgeContentOrReason: boolean | string = true): Promise<{ user: User; message: string }> {
    const purgeContent = typeof purgeContentOrReason === 'boolean' ? purgeContentOrReason : true;
    const reason = typeof purgeContentOrReason === 'string' ? purgeContentOrReason : undefined;
    try {
      return await this.request<{ user: User; message: string }>(`/api/moderation/users/${userId}/ban`, {
        method: 'POST',
        body: JSON.stringify({ purgeContent, reason })
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const user = clientDb.banUser(userId, purgeContent);
        return { user, message: 'User suspended successfully' };
      }
      throw err;
    }
  }

  async unbanUserAdmin(userId: string): Promise<{ user: User; message: string }> {
    try {
      return await this.request<{ user: User; message: string }>(`/api/moderation/users/${userId}/unban`, {
        method: 'POST'
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const user = clientDb.unbanUser(userId);
        return { user, message: 'User reinstated successfully' };
      }
      throw err;
    }
  }

  async deletePostAdmin(postId: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(`/api/moderation/posts/${postId}/delete`, {
        method: 'POST'
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        clientDb.deletePost(postId);
        return { success: true };
      }
      throw err;
    }
  }

  async deleteListingAdmin(listingId: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(`/api/moderation/listings/${listingId}/delete`, {
        method: 'POST'
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        clientDb.deleteListing(listingId);
        return { success: true };
      }
      throw err;
    }
  }

  async deleteCommentAdmin(commentId: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(`/api/moderation/comments/${commentId}/delete`, {
        method: 'POST'
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return { success: true };
      }
      throw err;
    }
  }

  async getModerationVerifications(status?: string): Promise<{ verifications: VerificationApplication[] }> {
    try {
      const q = status ? `?status=${status}` : '';
      return await this.request<{ verifications: VerificationApplication[] }>(`/api/moderation/verifications${q}`);
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return { verifications: clientDb.getModerationVerifications(status) };
      }
      throw err;
    }
  }

  async getUserActivityAdmin(userId: string): Promise<{
    user: User;
    posts: Post[];
    comments: Comment[];
    listings: MarketplaceListing[];
    ownedCommunities: Community[];
    joinedCommunities: Community[];
    reportsAgainst: Report[];
    auditLogs: AuditLog[];
  }> {
    try {
      return await this.request<{
        user: User;
        posts: Post[];
        comments: Comment[];
        listings: MarketplaceListing[];
        ownedCommunities: Community[];
        joinedCommunities: Community[];
        reportsAgainst: Report[];
        auditLogs: AuditLog[];
      }>(`/api/moderation/users/${userId}/activity`);
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return clientDb.getUserActivity(userId);
      }
      throw err;
    }
  }

  async setUserVerificationAdmin(userId: string, isVerified: boolean, category?: string): Promise<{ user: User; message: string }> {
    try {
      return await this.request<{ user: User; message: string }>(`/api/moderation/users/${userId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ isVerified, category })
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const user = clientDb.setUserVerification(userId, isVerified, category);
        return { user, message: 'User verification status updated' };
      }
      throw err;
    }
  }

  async setUserRoleAdmin(userId: string, role: 'admin' | 'moderator' | 'user'): Promise<{ user: User; message: string }> {
    try {
      return await this.request<{ user: User; message: string }>(`/api/moderation/users/${userId}/role`, {
        method: 'POST',
        body: JSON.stringify({ role })
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const user = clientDb.setUserRole(userId, role);
        return { user, message: 'User role updated' };
      }
      throw err;
    }
  }

  async sendUserWarningAdmin(userId: string, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      return await this.request<{ success: boolean; message: string }>(`/api/moderation/users/${userId}/warn`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return { success: true, message: 'Warning issued successfully' };
      }
      throw err;
    }
  }

  async reviewVerification(id: string, data: { status: VerificationStatus; adminNotes: string }): Promise<{ application: VerificationApplication }> {
    const normalizedStatus = (data.status as string) === 'approved' ? 'verified' : data.status;
    try {
      return await this.request<{ application: VerificationApplication }>(`/api/moderation/verifications/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ ...data, status: normalizedStatus })
      });
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        const uid = this.getCurrentUserId() || 'user_school_admin';
        const application = clientDb.reviewVerification(uid, id, { status: normalizedStatus, adminNotes: data.adminNotes });
        return { application };
      }
      throw err;
    }
  }

  async getAuditLogs(): Promise<{ auditLogs: AuditLog[] }> {
    try {
      return await this.request<{ auditLogs: AuditLog[] }>('/api/moderation/audit-logs');
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return { auditLogs: clientDb.getAuditLogs() };
      }
      throw err;
    }
  }

  // --- Notifications ---
  async getNotifications(): Promise<{ notifications: Notification[] }> {
    try {
      return await this.request<{ notifications: Notification[] }>('/api/notifications');
    } catch (_err: any) {
      const uid = this.getCurrentUserId() || 'user_school_admin';
      return { notifications: clientDb.getNotifications(uid) || [] };
    }
  }

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(`/api/notifications/${id}/read`, {
        method: 'POST'
      });
    } catch (_err: any) {
      clientDb.markNotificationRead(id);
      return { success: true };
    }
  }

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>('/api/notifications/read-all', {
        method: 'POST'
      });
    } catch (_err: any) {
      const uid = this.getCurrentUserId() || 'user_school_admin';
      clientDb.markAllNotificationsRead(uid);
      return { success: true };
    }
  }

  // --- Search & Discovery ---
  async search(query: string): Promise<{ query: string; results: any }> {
    try {
      return await this.request<{ query: string; results: any }>(`/api/search?q=${encodeURIComponent(query)}`);
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return { query, results: clientDb.search(query) };
      }
      throw err;
    }
  }

  async getDiscovery(): Promise<{
    trendingCommunities: Community[];
    trendingPosts: Post[];
    featuredListings: MarketplaceListing[];
    verifiedUsers: User[];
    trendingTags: string[];
  }> {
    try {
      return await this.request<{
        trendingCommunities: Community[];
        trendingPosts: Post[];
        featuredListings: MarketplaceListing[];
        verifiedUsers: User[];
        trendingTags: string[];
      }>('/api/discovery');
    } catch (err: any) {
      if (err.shouldFallback || err.status === 404) {
        return clientDb.getDiscovery();
      }
      throw err;
    }
  }

  // --- Helper & Extended Endpoints ---
  async getUserProfile(username: string): Promise<{ user: User }> {
    return this.getUser(username);
  }

  async getCommunityMembers(slug: string): Promise<{ members: User[] }> {
    const res = await this.getCommunity(slug);
    return { members: (res.community?.members || []) as any };
  }

  async startConversation(targetUserId: string): Promise<{ conversation: Conversation }> {
    const res = await this.createConversation({
      isGroup: false,
      participantIds: [targetUserId]
    });
    return { conversation: res.conversation };
  }

  async getVerificationStatus(): Promise<{ application: VerificationApplication | null }> {
    const res = await this.getMyVerifications();
    return { application: res.verifications?.[0] || null };
  }

  async submitVerificationApplication(data: any): Promise<{ application: VerificationApplication }> {
    return this.applyVerification(data);
  }

  async getReports(): Promise<{ reports: Report[] }> {
    return this.getModerationReports();
  }

  async getVerificationApplications(): Promise<{ applications: VerificationApplication[] }> {
    const res = await this.getModerationVerifications();
    return { applications: res.verifications || [] };
  }

  async getPlatformStats(): Promise<{ stats: any }> {
    const [usersRes, commRes, listRes, discRes] = await Promise.all([
      this.getAllUsers().catch(() => ({ users: [] })),
      this.getCommunities().catch(() => ({ communities: [] })),
      this.getListings().catch(() => ({ listings: [] })),
      this.getDiscovery().catch(() => ({ verifiedUsers: [] }))
    ]);
    return {
      stats: {
        totalUsers: usersRes.users.length,
        verifiedUsers: usersRes.users.filter(u => u.isVerified).length,
        totalCommunities: commRes.communities.length,
        totalListings: listRes.listings.length
      }
    };
  }

  async reviewVerificationApplication(id: string, status: any, adminNotes: string): Promise<any> {
    return this.reviewVerification(id, { status, adminNotes });
  }

  async searchGlobal(query: string): Promise<{ results: any }> {
    const res = await this.search(query);
    return { results: res.results || { users: [], communities: [], posts: [], listings: [] } };
  }

  async getReviews(sellerId: string): Promise<{ reviews: Review[] }> {
    return this.getSellerReviews(sellerId);
  }

  async addReview(sellerId: string, rating: number, comment: string, listingId?: string, listingTitle?: string): Promise<{ review: Review }> {
    return this.submitReview(sellerId, { rating, comment, listingId, listingTitle });
  }
}

export const api = new ApiService();
