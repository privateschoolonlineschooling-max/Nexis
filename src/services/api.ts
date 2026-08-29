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

class ApiService {
  private currentUserId: string | null = null;

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
      ...(options.headers as Record<string, string> || {})
    };

    if (userId) {
      headers['x-user-id'] = userId;
    }

    const res = await fetch(endpoint, { ...options, headers });
    if (!res.ok) {
      let errMsg = `Request failed: ${res.statusText}`;
      try {
        const errorData = await res.json();
        errMsg = errorData.error || errMsg;
      } catch (e) {
        // ignore
      }
      throw new Error(errMsg);
    }
    return res.json() as Promise<T>;
  }

  // --- Auth & Users ---
  async getMe(): Promise<{ user: User | null }> {
    return this.request<{ user: User | null }>('/api/auth/me');
  }

  async getAllUsers(): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>('/api/auth/all-users');
  }

  async getUser(identifier: string): Promise<{ user: User }> {
    return this.request<{ user: User }>(`/api/users/${identifier}`);
  }

  async login(usernameOrEmail: string, password: string): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail, password })
    });
  }

  async loginWithGoogle(data: { email: string; displayName?: string; avatar?: string; googleId?: string }): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async register(data: { username: string; email: string; password: string; displayName: string }): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateProfile(data: Partial<User>): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateSettings(settings: Partial<User['settings']>): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/update-settings', {
      method: 'PUT',
      body: JSON.stringify({ settings })
    });
  }

  async verifyEmail(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/auth/verify-email', {
      method: 'POST'
    });
  }

  async resetPassword(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword })
    });
  }

  async deleteAccount(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/api/auth/delete-account', {
      method: 'POST'
    });
  }

  async followUser(targetId: string): Promise<{ following: boolean; followersCount: number }> {
    return this.request<{ following: boolean; followersCount: number }>(`/api/users/${targetId}/follow`, {
      method: 'POST'
    });
  }

  async blockUser(targetId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/users/${targetId}/block`, {
      method: 'POST'
    });
  }

  async unblockUser(targetId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/users/${targetId}/unblock`, {
      method: 'POST'
    });
  }

  async muteUser(targetId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/users/${targetId}/mute`, {
      method: 'POST'
    });
  }

  // --- Communities ---
  async getCommunities(): Promise<{ communities: Community[] }> {
    return this.request<{ communities: Community[] }>('/api/communities');
  }

  async getCommunity(slugOrId: string): Promise<{ community: Community }> {
    return this.request<{ community: Community }>(`/api/communities/${slugOrId}`);
  }

  async createCommunity(data: Partial<Community>): Promise<{ community: Community }> {
    return this.request<{ community: Community }>('/api/communities', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCommunity(id: string, data: Partial<Community>): Promise<{ community: Community }> {
    return this.request<{ community: Community }>(`/api/communities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteCommunity(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/communities/${id}`, {
      method: 'DELETE'
    });
  }

  async verifyCommunityAdmin(id: string, isVerified: boolean = true): Promise<{ community: Community; success: boolean }> {
    return this.request<{ community: Community; success: boolean }>(`/api/moderation/communities/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ isVerified })
    });
  }

  async joinCommunity(id: string): Promise<{ community: Community }> {
    return this.request<{ community: Community }>(`/api/communities/${id}/join`, {
      method: 'POST'
    });
  }

  async leaveCommunity(id: string): Promise<{ community: Community }> {
    return this.request<{ community: Community }>(`/api/communities/${id}/leave`, {
      method: 'POST'
    });
  }

  async updateCommunityMemberRole(id: string, targetUserId: string, role: CommunityRole): Promise<{ community: Community }> {
    return this.request<{ community: Community }>(`/api/communities/${id}/members/${targetUserId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  }

  async banCommunityMember(id: string, targetUserId: string): Promise<{ community: Community }> {
    return this.request<{ community: Community }>(`/api/communities/${id}/members/${targetUserId}/ban`, {
      method: 'POST'
    });
  }

  async muteCommunityMember(id: string, targetUserId: string, mute: boolean): Promise<{ community: Community }> {
    return this.request<{ community: Community }>(`/api/communities/${id}/members/${targetUserId}/mute`, {
      method: 'POST',
      body: JSON.stringify({ mute })
    });
  }

  // --- Posts ---
  async getPosts(params?: { communityId?: string; authorId?: string; tag?: string; feedType?: string }): Promise<{ posts: Post[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ posts: Post[] }>(`/api/posts${query ? `?${query}` : ''}`);
  }

  async getPost(id: string): Promise<{ post: Post; comments: Comment[] }> {
    return this.request<{ post: Post; comments: Comment[] }>(`/api/posts/${id}`);
  }

  async createPost(data: Partial<Post>): Promise<{ post: Post }> {
    return this.request<{ post: Post }>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async likePost(id: string): Promise<{ liked: boolean; likesCount: number }> {
    return this.request<{ liked: boolean; likesCount: number }>(`/api/posts/${id}/like`, {
      method: 'POST'
    });
  }

  async bookmarkPost(id: string): Promise<{ bookmarked: boolean }> {
    return this.request<{ bookmarked: boolean }>(`/api/posts/${id}/bookmark`, {
      method: 'POST'
    });
  }

  async votePoll(id: string, optionId: string): Promise<{ post: Post }> {
    return this.request<{ post: Post }>(`/api/posts/${id}/poll-vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId })
    });
  }

  async addComment(postId: string, content: string, parentId?: string): Promise<{ comment: Comment }> {
    return this.request<{ comment: Comment }>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId })
    });
  }

  async deletePost(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/posts/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Marketplace ---
  async getListings(params?: Record<string, any>): Promise<{ listings: MarketplaceListing[] }> {
    const query = new URLSearchParams(params).toString();
    return this.request<{ listings: MarketplaceListing[] }>(`/api/marketplace${query ? `?${query}` : ''}`);
  }

  async getListing(id: string): Promise<{ listing: MarketplaceListing; reviews: Review[] }> {
    return this.request<{ listing: MarketplaceListing; reviews: Review[] }>(`/api/marketplace/${id}`);
  }

  async createListing(data: Partial<MarketplaceListing>): Promise<{ listing: MarketplaceListing }> {
    return this.request<{ listing: MarketplaceListing }>('/api/marketplace', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateListingStatus(id: string, status: ListingStatus): Promise<{ listing: MarketplaceListing }> {
    return this.request<{ listing: MarketplaceListing }>(`/api/marketplace/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async saveListing(id: string): Promise<{ saved: boolean; savesCount: number }> {
    return this.request<{ saved: boolean; savesCount: number }>(`/api/marketplace/${id}/save`, {
      method: 'POST'
    });
  }

  async deleteListing(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/marketplace/${id}`, {
      method: 'DELETE'
    });
  }

  async getSellerReviews(sellerId: string): Promise<{ reviews: Review[] }> {
    return this.request<{ reviews: Review[] }>(`/api/sellers/${sellerId}/reviews`);
  }

  async submitReview(sellerId: string, data: { rating: number; comment: string; listingId?: string; listingTitle?: string }): Promise<{ review: Review }> {
    return this.request<{ review: Review }>(`/api/sellers/${sellerId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // --- Messages ---
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    return this.request<{ conversations: Conversation[] }>('/api/conversations');
  }

  async createConversation(data: { isGroup: boolean; name?: string; participantIds: string[]; initialMessage?: string }): Promise<{ conversation: Conversation; message?: DirectMessage }> {
    return this.request<{ conversation: Conversation; message?: DirectMessage }>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getMessages(conversationId: string): Promise<{ messages: DirectMessage[] }> {
    return this.request<{ messages: DirectMessage[] }>(`/api/conversations/${conversationId}/messages`);
  }

  async sendMessage(conversationId: string, data: { content?: string; attachments?: any[]; replyTo?: any }): Promise<{ message: DirectMessage }> {
    return this.request<{ message: DirectMessage }>(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async editMessage(messageId: string, content: string): Promise<{ message: DirectMessage }> {
    return this.request<{ message: DirectMessage }>(`/api/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
  }

  async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/messages/${messageId}`, {
      method: 'DELETE'
    });
  }

  async reactMessage(messageId: string, emoji: string): Promise<{ message: DirectMessage }> {
    return this.request<{ message: DirectMessage }>(`/api/messages/${messageId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    });
  }

  // --- Verification ---
  async getMyVerifications(): Promise<{ verifications: VerificationApplication[] }> {
    return this.request<{ verifications: VerificationApplication[] }>('/api/verifications/my-status');
  }

  async applyVerification(data: Partial<VerificationApplication>): Promise<{ application: VerificationApplication }> {
    return this.request<{ application: VerificationApplication }>('/api/verifications/apply', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // --- Moderation & Reports ---
  async submitReport(data: Partial<Report>): Promise<{ report: Report }> {
    return this.request<{ report: Report }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getModerationReports(status?: string): Promise<{ reports: Report[] }> {
    const q = status ? `?status=${status}` : '';
    return this.request<{ reports: Report[] }>(`/api/moderation/reports${q}`);
  }

  async resolveReport(id: string, data: { actionTaken: string; adminNotes: string }): Promise<{ report: Report }> {
    return this.request<{ report: Report }>(`/api/moderation/reports/${id}/action`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async banUserAdmin(userId: string, purgeContent = true): Promise<{ user: User; message: string }> {
    return this.request<{ user: User; message: string }>(`/api/moderation/users/${userId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ purgeContent })
    });
  }

  async unbanUserAdmin(userId: string): Promise<{ user: User; message: string }> {
    return this.request<{ user: User; message: string }>(`/api/moderation/users/${userId}/unban`, {
      method: 'POST'
    });
  }

  async deletePostAdmin(postId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/moderation/posts/${postId}/delete`, {
      method: 'POST'
    });
  }

  async deleteListingAdmin(listingId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/moderation/listings/${listingId}/delete`, {
      method: 'POST'
    });
  }

  async deleteCommentAdmin(commentId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/moderation/comments/${commentId}/delete`, {
      method: 'POST'
    });
  }

  async getModerationVerifications(status?: string): Promise<{ verifications: VerificationApplication[] }> {
    const q = status ? `?status=${status}` : '';
    return this.request<{ verifications: VerificationApplication[] }>(`/api/moderation/verifications${q}`);
  }

  async reviewVerification(id: string, data: { status: VerificationStatus; adminNotes: string }): Promise<{ application: VerificationApplication }> {
    return this.request<{ application: VerificationApplication }>(`/api/moderation/verifications/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getAuditLogs(): Promise<{ auditLogs: AuditLog[] }> {
    return this.request<{ auditLogs: AuditLog[] }>('/api/moderation/audit-logs');
  }

  // --- Notifications ---
  async getNotifications(): Promise<{ notifications: Notification[] }> {
    return this.request<{ notifications: Notification[] }>('/api/notifications');
  }

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'POST'
    });
  }

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/api/notifications/read-all', {
      method: 'POST'
    });
  }

  // --- Search & Discovery ---
  async search(query: string): Promise<{ query: string; results: any }> {
    return this.request<{ query: string; results: any }>(`/api/search?q=${encodeURIComponent(query)}`);
  }

  async getDiscovery(): Promise<{
    trendingCommunities: Community[];
    trendingPosts: Post[];
    featuredListings: MarketplaceListing[];
    verifiedUsers: User[];
    trendingTags: string[];
  }> {
    return this.request<{
      trendingCommunities: Community[];
      trendingPosts: Post[];
      featuredListings: MarketplaceListing[];
      verifiedUsers: User[];
      trendingTags: string[];
    }>('/api/discovery');
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
