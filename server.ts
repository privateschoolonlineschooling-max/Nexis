import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { User, Community, CommunityRole, Post, MarketplaceListing, Review, DirectMessage, VerificationApplication, Report } from './src/types/index';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Helper auth simulation: In demo/SPA, client sends `x-user-id` header
  const getAuthUserId = (req: express.Request): string | null => {
    return (req.headers['x-user-id'] as string) || null;
  };

  const SUPER_ADMIN_EMAILS = ['privateschoolonlineschooling@gmail.com'];
  const isSuperAdminEmail = (email?: string): boolean => {
    if (!email) return false;
    return SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === email.toLowerCase().trim());
  };

  const ensureSuperAdminPrivileges = (user: any) => {
    if (!user || !user.email) return user;
    if (isSuperAdminEmail(user.email)) {
      user.role = 'admin';
      user.isVerified = true;
      user.verificationStatus = 'verified';
      user.verificationCategory = 'organization';
      user.accountStatus = 'active';
      if (user.settings) user.settings.emailVerified = true;
    } else if (user.role === 'admin') {
      user.role = 'user';
    }
    return user;
  };

  // --- HEALTH CHECK ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ==========================================
  // --- AUTH & USER PROFILE ROUTES ---
  // ==========================================

  app.post('/api/auth/google', (req, res) => {
    try {
      const { email, displayName, avatar, googleId } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required for Google authentication' });
      }

      let user = db.getUserByEmail(email);
      if (!user) {
        const isSuper = isSuperAdminEmail(email);
        // Create new user from Google profile
        const baseUsername = (displayName || email.split('@')[0])
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 15) || 'user';
        let uniqueUsername = baseUsername;
        let counter = 1;
        while (db.getUserByUsername(uniqueUsername)) {
          uniqueUsername = `${baseUsername}${counter}`;
          counter++;
        }

        user = db.createUser({
          id: `user_g_${googleId || Date.now()}`,
          username: uniqueUsername,
          displayName: displayName || (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)),
          email: email.toLowerCase().trim(),
          passwordHash: `google_oauth_${Date.now()}`,
          avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uniqueUsername}`,
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
            emailVerified: true, // Google verified
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
        }) as any;
      }

      user = ensureSuperAdminPrivileges(user);

      if (user.accountStatus === 'banned') {
        return res.status(403).json({ error: 'This account has been permanently suspended.' });
      }

      const { passwordHash, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/register', (req, res) => {
    try {
      const { username, email, password, displayName } = req.body;
      if (!username || !email || !password || !displayName) {
        return res.status(400).json({ error: 'Please provide all required fields: Display Name, Username, Email, and Password.' });
      }

      const cleanUsername = String(username).toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
      const cleanEmail = String(email).toLowerCase().trim();
      const cleanDisplayName = String(displayName).trim();
      const cleanPassword = String(password);

      if (!cleanUsername || cleanUsername.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters and contain only letters, numbers, and underscores.' });
      }

      if (db.getUserByUsername(cleanUsername)) {
        return res.status(409).json({ error: 'This username is already taken. Please choose another one.' });
      }
      if (db.getUserByEmail(cleanEmail)) {
        return res.status(409).json({ error: 'This email address is already registered. Please sign in instead.' });
      }

      const isSuper = isSuperAdminEmail(cleanEmail);

      const newUser = db.createUser({
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        username: cleanUsername,
        displayName: cleanDisplayName,
        email: cleanEmail,
        passwordHash: cleanPassword, // Simulated hashed storage
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
      });

      return res.status(201).json({ user: newUser });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { usernameOrEmail, password } = req.body;
      if (!usernameOrEmail || !password) {
        return res.status(400).json({ error: 'Username/Email and password are required' });
      }

      const cleanIdentifier = String(usernameOrEmail).trim();
      const cleanPassword = String(password);

      let user = db.getUserByUsername(cleanIdentifier) || db.getUserByEmail(cleanIdentifier);
      if (!user) {
        if (isSuperAdminEmail(cleanIdentifier)) {
          user = db.createUser({
            id: 'user_school_admin',
            username: 'privateschooladmin',
            displayName: 'Online Schooling Admin',
            email: 'privateschoolonlineschooling@gmail.com',
            passwordHash: cleanPassword || 'password123',
            bio: 'Official Super Administrator & Verification Lead for Private School Online Schooling.',
            location: 'Global',
            website: 'https://nexis.community',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
            createdAt: new Date().toISOString(),
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
            }
          }) as any;
        } else {
          return res.status(401).json({ error: 'No account found matching this username or email.' });
        }
      }

      if (user.passwordHash !== cleanPassword) {
        return res.status(401).json({ error: 'Incorrect password. Please verify and try again.' });
      }

      user = ensureSuperAdminPrivileges(user);

      if (user.accountStatus === 'banned') {
        return res.status(403).json({ error: 'This account has been permanently suspended for violating community safety standards.' });
      }

      const { passwordHash, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Login failed' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.json({ user: null });
    }
    let user = db.getUserById(userId);
    if (!user) {
      return res.json({ user: null });
    }
    user = ensureSuperAdminPrivileges(user);
    const { passwordHash, ...safeUser } = user;
    return res.json({ user: safeUser });
  });

  app.get('/api/auth/all-users', (req, res) => {
    const users = db.getUsers();
    res.json({ users });
  });

  app.get('/api/users/:identifier', (req, res) => {
    const { identifier } = req.params;
    const user = db.getUserById(identifier) || db.getUserByUsername(identifier);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  });

  app.put('/api/auth/update-profile', (req, res) => {
    const userId = getAuthUserId(req);
    const { displayName, bio, location, website, avatar, banner } = req.body;
    const updated = db.updateUser(userId, { displayName, bio, location, website, avatar, banner });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json({ user: updated });
  });

  app.put('/api/auth/update-settings', (req, res) => {
    const userId = getAuthUserId(req);
    const user = db.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newSettings = { ...user.settings, ...req.body.settings };
    const updated = db.updateUser(userId, { settings: newSettings });
    res.json({ user: updated });
  });

  app.post('/api/auth/verify-email', (req, res) => {
    const userId = getAuthUserId(req);
    const user = db.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.settings.emailVerified = true;
    db.updateUser(userId, { settings: user.settings });
    res.json({ success: true, message: 'Email successfully verified' });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { email, newPassword } = req.body;
    const user = db.getUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'No account associated with this email' });
    db.updateUser(user.id, { passwordHash: newPassword });
    res.json({ success: true, message: 'Password has been securely updated' });
  });

  app.post('/api/auth/delete-account', (req, res) => {
    const userId = getAuthUserId(req);
    db.deleteUser(userId);
    res.json({ success: true, message: 'Account and associated content deleted' });
  });

  app.post('/api/users/:id/follow', (req, res) => {
    try {
      const followerId = getAuthUserId(req);
      const targetId = req.params.id;
      const result = db.followUser(followerId, targetId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/users/:id/block', (req, res) => {
    const userId = getAuthUserId(req);
    const targetId = req.params.id;
    const success = db.blockUser(userId, targetId);
    res.json({ success });
  });

  app.post('/api/users/:id/unblock', (req, res) => {
    const userId = getAuthUserId(req);
    const targetId = req.params.id;
    const success = db.unblockUser(userId, targetId);
    res.json({ success });
  });

  app.post('/api/users/:id/mute', (req, res) => {
    const userId = getAuthUserId(req);
    const targetId = req.params.id;
    const success = db.muteUser(userId, targetId);
    res.json({ success });
  });

  // ==========================================
  // --- COMMUNITIES ROUTES ---
  // ==========================================

  app.get('/api/communities', (req, res) => {
    const communities = db.getCommunities();
    res.json({ communities });
  });

  app.get('/api/communities/:slugOrId', (req, res) => {
    const { slugOrId } = req.params;
    const comm = db.getCommunityBySlug(slugOrId) || db.getCommunityById(slugOrId);
    if (!comm) return res.status(404).json({ error: 'Community not found' });
    res.json({ community: comm });
  });

  app.post('/api/communities', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const user = db.getUserById(userId);
      if (!user) return res.status(401).json({ error: 'User not authenticated' });

      const { name, slug, description, category, privacy, rules, avatar, banner, tags } = req.body;
      if (!name || !slug) return res.status(400).json({ error: 'Name and slug are required' });

      if (name.toLowerCase().includes('metadata') || slug.toLowerCase().includes('metadata')) {
        return res.status(400).json({ error: 'Metadata communities are not permitted.' });
      }

      if (db.getCommunityBySlug(slug)) {
        return res.status(409).json({ error: 'Community slug is already taken' });
      }

      const newCommunity: Community = {
        id: `comm_${Date.now()}`,
        name: name.trim(),
        slug: slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, ''),
        description: description || '',
        avatar: avatar || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        banner: banner || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200',
        privacy: privacy || 'public',
        category: category || 'General',
        createdAt: new Date().toISOString(),
        ownerId: user.id,
        isVerified: false,
        verificationStatus: 'none',
        memberCount: 1,
        tags: tags || [],
        rules: rules || [
          { id: 'r1', title: 'Be Respectful', description: 'Treat fellow members with empathy and professional courtesy.' }
        ],
        members: [
          {
            userId: user.id,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar,
            isVerified: user.isVerified,
            role: 'owner',
            joinedAt: new Date().toISOString()
          }
        ],
        bannedUserIds: [],
        mutedUserIds: []
      };

      const created = db.createCommunity(newCommunity);
      res.status(201).json({ community: created });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/communities/:id', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const { id } = req.params;
      const comm = db.getCommunityById(id);
      if (!comm) return res.status(404).json({ error: 'Community not found' });

      // Check ownership/admin/moderator permission
      const member = comm.members.find(m => m.userId === userId);
      const user = userId ? db.getUserById(userId) : null;
      const isAuthorized = comm.ownerId === userId || member?.role === 'admin' || member?.role === 'moderator' || user?.role === 'admin';
      if (!isAuthorized) {
        return res.status(403).json({ error: 'Not authorized to manage this community' });
      }

      const updated = db.updateCommunity(id, req.body);
      res.json({ community: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/communities/:id', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const { id } = req.params;
      const comm = db.getCommunityById(id);
      if (!comm) return res.status(404).json({ error: 'Community not found' });

      const user = userId ? db.getUserById(userId) : null;
      if (comm.ownerId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins or community owners can delete this community' });
      }

      db.deleteCommunity(id);
      res.json({ success: true, message: 'Community deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/moderation/communities/:id/verify', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const user = userId ? db.getUserById(userId) : null;
      if (user?.role !== 'admin' && user?.role !== 'moderator') {
        return res.status(403).json({ error: 'Admin permissions required to verify communities' });
      }

      const { isVerified } = req.body;
      const updated = db.verifyCommunity(req.params.id, isVerified !== false, userId || undefined);
      res.json({ community: updated, success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/communities/:id/join', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const updated = db.joinCommunity(userId, req.params.id);
      res.json({ community: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/communities/:id/leave', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const updated = db.leaveCommunity(userId, req.params.id);
      res.json({ community: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/communities/:id/members/:targetUserId/role', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const { id, targetUserId } = req.params;
      const { role } = req.body;

      if (!['owner', 'admin', 'moderator', 'member'].includes(role)) {
        return res.status(400).json({ error: 'Invalid community role' });
      }

      const comm = db.getCommunityById(id);
      const user = userId ? db.getUserById(userId) : null;
      if (!comm) return res.status(404).json({ error: 'Community not found' });

      const isOwner = comm.ownerId === userId;
      const isCommAdmin = comm.members.some(m => m.userId === userId && m.role === 'admin');
      const isPlatformAdmin = user?.role === 'admin';

      if (!isOwner && !isCommAdmin && !isPlatformAdmin) {
        return res.status(403).json({ error: 'Only community owners or admins can change roles' });
      }

      if (role === 'owner' && !isOwner && !isPlatformAdmin) {
        return res.status(403).json({ error: 'Only current owner can transfer community ownership' });
      }

      const updated = db.updateCommunityMemberRole(id, targetUserId, role as CommunityRole);
      res.json({ community: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/communities/:id/members/:targetUserId/ban', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const { id, targetUserId } = req.params;
      const comm = db.getCommunityById(id);
      const user = userId ? db.getUserById(userId) : null;
      const isOwner = comm?.ownerId === userId;
      const isCommMod = comm?.members.some(m => m.userId === userId && m.role === 'moderator');
      const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

      if (!comm || (!isOwner && !isCommMod && !isAdmin)) {
        return res.status(403).json({ error: 'Unauthorized to moderate this community' });
      }

      const updated = db.banCommunityMember(id, targetUserId, userId || undefined);
      res.json({ community: updated, success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/communities/:id/members/:targetUserId/mute', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const { id, targetUserId } = req.params;
      const { mute } = req.body;
      const comm = db.getCommunityById(id);
      if (!comm || (comm.ownerId !== userId && !comm.members.some(m => m.userId === userId && m.role === 'moderator'))) {
        return res.status(403).json({ error: 'Unauthorized to moderate this community' });
      }

      const updated = db.muteCommunityMember(id, targetUserId, mute ?? true);
      res.json({ community: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // --- POSTS & COMMENTS ROUTES ---
  // ==========================================

  app.get('/api/posts', (req, res) => {
    const currentUserId = getAuthUserId(req);
    const { communityId, authorId, tag, feedType } = req.query;
    const posts = db.getPosts({
      communityId: communityId as string,
      authorId: authorId as string,
      tag: tag as string,
      feedType: feedType as any,
      currentUserId
    });
    res.json({ posts });
  });

  app.get('/api/posts/:id', (req, res) => {
    const post = db.getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const comments = db.getComments(post.id);
    res.json({ post, comments });
  });

  app.post('/api/posts', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const user = db.getUserById(userId);
      if (!user) return res.status(401).json({ error: 'User not authenticated' });

      const { 
        type, 
        title, 
        content, 
        communityId, 
        images, 
        videoUrl, 
        linkUrl, 
        linkTitle, 
        linkDescription, 
        linkImage,
        pollOptions, 
        isAnnouncement, 
        visibility, 
        tags 
      } = req.body;

      if (!content && type === 'text') {
        return res.status(400).json({ error: 'Content cannot be empty' });
      }

      let commName: string | undefined;
      let commSlug: string | undefined;
      if (communityId) {
        const comm = db.getCommunityById(communityId);
        if (comm) {
          commName = comm.name;
          commSlug = comm.slug;
        }
      }

      // Extract hashtags if any
      const autoTags = (content?.match(/#[a-z0-9_]+/gi) || []).map((t: string) => t.replace('#', '').toLowerCase());
      const mergedTags = Array.from(new Set([...(tags || []), ...autoTags]));

      const newPost: Post = {
        id: `post_${Date.now()}`,
        authorId: user.id,
        authorUsername: user.username,
        authorDisplayName: user.displayName,
        authorAvatar: user.avatar,
        authorVerified: user.isVerified,
        communityId,
        communityName: commName,
        communitySlug: commSlug,
        type: type || 'text',
        title: title || undefined,
        content: content || '',
        images: images || undefined,
        videoUrl: videoUrl || undefined,
        linkUrl: linkUrl || undefined,
        linkTitle: linkTitle || undefined,
        linkDescription: linkDescription || undefined,
        linkImage: linkImage || undefined,
        pollOptions: pollOptions?.map((opt: string, i: number) => ({
          id: `opt_${i + 1}`,
          text: opt,
          votes: 0,
          voterIds: []
        })),
        isAnnouncement: isAnnouncement || false,
        visibility: visibility || 'public',
        createdAt: new Date().toISOString(),
        likes: [],
        bookmarks: [],
        sharesCount: 0,
        commentsCount: 0,
        viewsCount: 0,
        tags: mergedTags,
        mentions: []
      };

      const created = db.createPost(newPost);
      res.status(201).json({ post: created });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/posts/:id/like', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const result = db.likePost(req.params.id, userId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/posts/:id/bookmark', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const result = db.bookmarkPost(req.params.id, userId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/posts/:id/poll-vote', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const { optionId } = req.body;
      const updated = db.votePoll(req.params.id, optionId, userId);
      res.json({ post: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/posts/:id/comments', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const user = db.getUserById(userId);
      if (!user) return res.status(401).json({ error: 'User not authenticated' });

      const { content, parentId } = req.body;
      if (!content?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });

      const comment = db.addComment({
        id: `comm_${Date.now()}`,
        postId: req.params.id,
        authorId: user.id,
        authorUsername: user.username,
        authorDisplayName: user.displayName,
        authorAvatar: user.avatar,
        authorVerified: user.isVerified,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        likes: [],
        parentId
      });

      res.status(201).json({ comment });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/posts/:id', (req, res) => {
    const userId = getAuthUserId(req);
    const post = db.getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const user = db.getUserById(userId);
    if (post.authorId !== userId && user?.role !== 'admin' && user?.role !== 'moderator') {
      return res.status(403).json({ error: 'Unauthorized to delete this post' });
    }

    db.deletePost(req.params.id);
    res.json({ success: true });
  });

  // ==========================================
  // --- MARKETPLACE & REVIEWS ROUTES ---
  // ==========================================

  app.get('/api/marketplace', (req, res) => {
    const { category, condition, status, sellerId, search, minPrice, maxPrice, sort } = req.query;
    const listings = db.getListings({
      category: category as string,
      condition: condition as string,
      status: status as string,
      sellerId: sellerId as string,
      search: search as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      sort: sort as any
    });
    res.json({ listings });
  });

  app.get('/api/marketplace/:id', (req, res) => {
    const listing = db.getListingById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    const reviews = db.getReviewsBySellerId(listing.sellerId);
    res.json({ listing, reviews });
  });

  app.post('/api/marketplace', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const user = db.getUserById(userId);
      if (!user) return res.status(401).json({ error: 'User not authenticated' });

      const {
        title,
        description,
        price,
        currency,
        category,
        condition,
        location,
        images,
        externalPaymentLink,
        externalPaymentProvider
      } = req.body;

      if (!title || !price || !category) {
        return res.status(400).json({ error: 'Title, price, and category are required' });
      }

      const newListing: MarketplaceListing = {
        id: `list_${Date.now()}`,
        sellerId: user.id,
        sellerUsername: user.username,
        sellerDisplayName: user.displayName,
        sellerAvatar: user.avatar,
        sellerVerified: user.isVerified,
        sellerRating: user.rating || 5.0,
        sellerReviewCount: user.reviewCount || 0,
        title: title.trim(),
        description: description || '',
        price: parseFloat(price),
        currency: currency || 'USD',
        category,
        condition: condition || 'new',
        location: location || 'Local / Shipped',
        images: images?.length ? images : ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800'],
        status: 'available',
        externalPaymentLink: externalPaymentLink || undefined,
        externalPaymentProvider: externalPaymentProvider || 'External Provider',
        createdAt: new Date().toISOString(),
        viewsCount: 0,
        savesCount: 0,
        savedByUserIds: []
      };

      const created = db.createListing(newListing);
      res.status(201).json({ listing: created });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/marketplace/:id/status', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const { status } = req.body;
      const updated = db.updateListingStatus(req.params.id, status, userId);
      if (!updated) return res.status(404).json({ error: 'Listing not found' });
      res.json({ listing: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/marketplace/:id/save', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const result = db.saveListing(req.params.id, userId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/marketplace/:id', (req, res) => {
    const userId = getAuthUserId(req);
    const listing = db.getListingById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const user = db.getUserById(userId);
    if (listing.sellerId !== userId && user?.role !== 'admin' && user?.role !== 'moderator') {
      return res.status(403).json({ error: 'Unauthorized to delete this listing' });
    }

    db.deleteListing(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/sellers/:sellerId/reviews', (req, res) => {
    const reviews = db.getReviewsBySellerId(req.params.sellerId);
    res.json({ reviews });
  });

  app.post('/api/sellers/:sellerId/reviews', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const user = db.getUserById(userId);
      if (!user) return res.status(401).json({ error: 'User not authenticated' });

      const { rating, comment, listingId, listingTitle } = req.body;
      if (!rating || !comment) {
        return res.status(400).json({ error: 'Rating and comment are required' });
      }

      if (userId === req.params.sellerId) {
        return res.status(400).json({ error: 'You cannot review yourself' });
      }

      const newReview = db.createReview({
        id: `rev_${Date.now()}`,
        sellerId: req.params.sellerId,
        buyerId: user.id,
        buyerUsername: user.username,
        buyerDisplayName: user.displayName,
        buyerAvatar: user.avatar,
        buyerVerified: user.isVerified,
        listingId,
        listingTitle,
        rating: Math.min(5, Math.max(1, parseInt(rating))),
        comment: comment.trim(),
        createdAt: new Date().toISOString()
      });

      res.status(201).json({ review: newReview });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // --- DIRECT MESSAGES (DMs) ROUTES ---
  // ==========================================

  app.get('/api/conversations', (req, res) => {
    const userId = getAuthUserId(req);
    const conversations = db.getConversations(userId);
    res.json({ conversations });
  });

  app.post('/api/conversations', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const { isGroup, name, participantIds, initialMessage } = req.body;
      if (!participantIds?.length) {
        return res.status(400).json({ error: 'Participants are required' });
      }

      const allParticipants = Array.from(new Set([userId, ...participantIds]));
      const result = db.createConversation({
        isGroup: !!isGroup,
        name,
        participantIds: allParticipants,
        initialMessage,
        senderId: userId
      });

      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/conversations/:id/messages', (req, res) => {
    const userId = getAuthUserId(req);
    const messages = db.getMessages(req.params.id);
    db.markMessagesRead(req.params.id, userId);
    res.json({ messages });
  });

  app.post('/api/conversations/:id/messages', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const user = db.getUserById(userId);
      if (!user) return res.status(401).json({ error: 'User not authenticated' });

      const { content, attachments, replyTo } = req.body;
      if (!content && !attachments?.length) {
        return res.status(400).json({ error: 'Message content or attachment required' });
      }

      const newMsg: DirectMessage = {
        id: `msg_${Date.now()}`,
        conversationId: req.params.id,
        senderId: user.id,
        senderUsername: user.username,
        senderDisplayName: user.displayName,
        senderAvatar: user.avatar,
        senderVerified: user.isVerified,
        content: content || '',
        attachments,
        replyTo,
        reactions: [],
        readByUserIds: [user.id],
        createdAt: new Date().toISOString()
      };

      const created = db.addMessage(newMsg);
      res.status(201).json({ message: created });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/messages/:id', (req, res) => {
    const userId = getAuthUserId(req);
    const { content } = req.body;
    const updated = db.editMessage(req.params.id, content, userId);
    if (!updated) return res.status(400).json({ error: 'Unable to edit message' });
    res.json({ message: updated });
  });

  app.delete('/api/messages/:id', (req, res) => {
    const userId = getAuthUserId(req);
    const success = db.deleteMessage(req.params.id, userId);
    res.json({ success });
  });

  app.post('/api/messages/:id/react', (req, res) => {
    const userId = getAuthUserId(req);
    const user = db.getUserById(userId);
    const { emoji } = req.body;
    const updated = db.reactMessage(req.params.id, emoji, userId, user?.displayName || 'User');
    res.json({ message: updated });
  });

  // ==========================================
  // --- VERIFICATION SYSTEM ROUTES ---
  // ==========================================

  app.get('/api/verifications/my-status', (req, res) => {
    const userId = getAuthUserId(req);
    const verifs = db.getVerifications().filter(v => v.applicantId === userId);
    res.json({ verifications: verifs });
  });

  app.post('/api/verifications/apply', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const user = db.getUserById(userId);
      if (!user) return res.status(401).json({ error: 'User not authenticated' });

      const {
        targetType,
        targetId,
        targetName,
        targetSlugOrUsername,
        category,
        statement,
        additionalNotes,
        officialLinks,
        evidenceLinks,
        documentUrl,
        documentType
      } = req.body;

      const finalStatement = statement || additionalNotes;
      if (!category || !finalStatement) {
        return res.status(400).json({ error: 'Category and statement of authenticity are required' });
      }

      const finalLinks = Array.isArray(officialLinks) 
        ? officialLinks 
        : Array.isArray(evidenceLinks) 
        ? evidenceLinks 
        : [];

      let finalTargetName = targetName;
      let finalTargetSlug = targetSlugOrUsername;
      let finalTargetId = targetId || user.id;

      if (targetType === 'community' && targetId) {
        const comm = db.getCommunityById(targetId) || db.getCommunityBySlug(targetSlugOrUsername || targetId);
        if (comm) {
          finalTargetId = comm.id;
          finalTargetName = comm.name;
          finalTargetSlug = comm.slug;
        }
      }

      const newApp: VerificationApplication = {
        id: `verif_${Date.now()}`,
        targetType: targetType || 'user',
        targetId: finalTargetId,
        targetName: finalTargetName || (targetType === 'community' ? 'Community' : user.displayName),
        targetSlugOrUsername: finalTargetSlug || (targetType === 'community' ? 'community' : user.username),
        applicantId: user.id,
        applicantUsername: user.username,
        applicantEmail: user.email,
        category,
        statement: finalStatement.trim(),
        officialLinks: finalLinks,
        documentUrl: documentUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400',
        documentType: documentType || 'Government ID / Entity Registration Proof',
        status: 'pending',
        submittedAt: new Date().toISOString()
      };

      const created = db.createVerification(newApp);
      res.status(201).json({ application: created });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // --- TRUST & SAFETY / MODERATION ROUTES ---
  // ==========================================

  app.post('/api/reports', (req, res) => {
    try {
      const userId = getAuthUserId(req);
      const user = db.getUserById(userId);
      const { category, targetId, targetTitleOrSnippet, reason, details } = req.body;

      if (!category || !targetId || !reason) {
        return res.status(400).json({ error: 'Category, targetId, and reason are required' });
      }

      const report: Report = {
        id: `rep_${Date.now()}`,
        reporterId: user?.id || 'anon',
        reporterUsername: user?.username || 'anonymous',
        category,
        targetId,
        targetTitleOrSnippet: targetTitleOrSnippet || 'Reported Content',
        reason,
        details: details || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const created = db.createReport(report);
      res.status(201).json({ report: created });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/moderation/reports', (req, res) => {
    const { status } = req.query;
    const reports = db.getReports(status as string);
    res.json({ reports });
  });

  app.post('/api/moderation/reports/:id/action', (req, res) => {
    try {
      const moderatorId = getAuthUserId(req);
      const { actionTaken, adminNotes } = req.body;
      const resolved = db.resolveReport(req.params.id, actionTaken, adminNotes, moderatorId);
      if (!resolved) return res.status(404).json({ error: 'Report not found' });
      res.json({ report: resolved });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/moderation/verifications', (req, res) => {
    const { status } = req.query;
    const verifications = db.getVerifications(status as any);
    res.json({ verifications });
  });

  app.post('/api/moderation/verifications/:id/decision', (req, res) => {
    try {
      const reviewerId = getAuthUserId(req);
      const { status, adminNotes } = req.body;
      const updated = db.reviewVerification(req.params.id, status, adminNotes, reviewerId);
      if (!updated) return res.status(404).json({ error: 'Verification application not found' });
      res.json({ application: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/moderation/audit-logs', (req, res) => {
    const logs = db.getAuditLogs();
    res.json({ auditLogs: logs });
  });

  app.post('/api/moderation/users/:id/ban', (req, res) => {
    try {
      const moderatorId = getAuthUserId(req);
      const { purgeContent = true } = req.body;
      const user = db.banUser(req.params.id, moderatorId, purgeContent);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ user, message: 'User banned and content purged successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/moderation/users/:id/unban', (req, res) => {
    try {
      const moderatorId = getAuthUserId(req);
      const user = db.unbanUser(req.params.id, moderatorId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ user, message: 'User unbanned successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/moderation/users/:id/activity', (req, res) => {
    try {
      const activity = db.getUserActivity(req.params.id);
      if (!activity) return res.status(404).json({ error: 'User not found' });
      res.json(activity);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/moderation/users/:id/verify', (req, res) => {
    try {
      const moderatorId = getAuthUserId(req);
      const { isVerified = true, category = 'individual' } = req.body;
      const user = db.setUserVerification(req.params.id, isVerified, category, moderatorId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ user, message: isVerified ? 'Verified badge awarded' : 'Verification badge revoked' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/moderation/users/:id/role', (req, res) => {
    try {
      const moderatorId = getAuthUserId(req);
      const { role } = req.body;
      if (!['admin', 'moderator', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      const user = db.setUserRole(req.params.id, role, moderatorId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ user, message: `User role updated to ${role}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/moderation/users/:id/warn', (req, res) => {
    try {
      const moderatorId = getAuthUserId(req);
      const { reason } = req.body;
      if (!reason) return res.status(400).json({ error: 'Warning reason is required' });
      const success = db.sendUserWarning(req.params.id, reason, moderatorId);
      if (!success) return res.status(404).json({ error: 'User not found' });
      res.json({ success, message: 'Warning notice sent to user' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/moderation/posts/:id/delete', (req, res) => {
    try {
      const success = db.deletePost(req.params.id);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/moderation/listings/:id/delete', (req, res) => {
    try {
      const success = db.deleteListing(req.params.id);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/moderation/comments/:id/delete', (req, res) => {
    try {
      const success = db.deleteComment(req.params.id);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // --- NOTIFICATIONS ROUTES ---
  // ==========================================

  app.get('/api/notifications', (req, res) => {
    const userId = getAuthUserId(req);
    const notifications = db.getNotifications(userId);
    res.json({ notifications });
  });

  app.post('/api/notifications/:id/read', (req, res) => {
    const userId = getAuthUserId(req);
    const success = db.markNotificationRead(req.params.id, userId);
    res.json({ success });
  });

  app.post('/api/notifications/read-all', (req, res) => {
    const userId = getAuthUserId(req);
    const success = db.markAllNotificationsRead(userId);
    res.json({ success });
  });

  // ==========================================
  // --- SEARCH & DISCOVERY ROUTES ---
  // ==========================================

  app.get('/api/search', (req, res) => {
    const query = (req.query.q as string) || '';
    const results = db.globalSearch(query);
    res.json({ query, results });
  });

  app.get('/api/discovery', (req, res) => {
    const communities = db.getCommunities().slice(0, 4);
    const trendingPosts = db.getPosts().slice(0, 4);
    const featuredListings = db.getListings().slice(0, 4);
    const verifiedUsers = db.getUsers().filter(u => u.isVerified).slice(0, 5);
    const trendingTags = ['architecture', 'designsystems', 'ceramics', 'mechanicalkeyboards', 'sustainability', 'openhardware'];

    res.json({
      trendingCommunities: communities,
      trendingPosts,
      featuredListings,
      verifiedUsers,
      trendingTags
    });
  });

  // ==========================================
  // --- API CATCH-ALL (PREVENT HTML 404s) ---
  // ==========================================
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // ==========================================
  // --- VITE MIDDLEWARE & STATIC ASSETS ---
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexis platform server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server startup failure:', err);
  process.exit(1);
});
