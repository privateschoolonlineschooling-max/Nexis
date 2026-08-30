import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { Report, VerificationApplication, PlatformStats, User, Post, Comment, MarketplaceListing, Community, AuditLog } from '../../types/index';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Trash2, 
  ExternalLink, 
  Users, 
  ShoppingBag, 
  FileText, 
  Eye, 
  Clock, 
  BarChart3,
  Search,
  Filter,
  Ban,
  Check,
  Shield,
  BadgeCheck,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  X,
  Mail,
  UserCheck,
  UserX
} from 'lucide-react';

interface UserActivityState {
  user: User;
  posts: Post[];
  comments: Comment[];
  listings: MarketplaceListing[];
  ownedCommunities: Community[];
  joinedCommunities: Community[];
  reportsAgainst: Report[];
  auditLogs: AuditLog[];
}

export const ModerationPortalView: React.FC = () => {
  const { currentUser, allUsers, refreshUsers } = useAuth();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'verification_queue' | 'stats'>('users');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [applications, setApplications] = useState<VerificationApplication[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  // User moderation filter/search
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'verified' | 'banned' | 'staff'>('all');

  // Review modal/notes state
  const [auditNotes, setAuditNotes] = useState('');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Activity Inspector Modal State
  const [inspectedUserActivity, setInspectedUserActivity] = useState<UserActivityState | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activityTab, setActivityTab] = useState<'overview' | 'posts' | 'comments' | 'listings' | 'reports' | 'audit'>('overview');

  // Direct moderation action modals / prompts
  const [warningModalUser, setWarningModalUser] = useState<User | null>(null);
  const [warningReason, setWarningReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, repRes, appRes, statsRes] = await Promise.all([
        api.getAllUsers().catch(() => ({ users: [] })),
        api.getReports().catch(() => ({ reports: [] })),
        api.getVerificationApplications().catch(() => ({ applications: [] })),
        api.getPlatformStats().catch(() => ({ stats: null }))
      ]);
      setUsersList(usersRes.users || []);
      setReports(repRes.reports || []);
      setApplications(appRes.applications || []);
      setStats(statsRes.stats);
    } catch (err) {
      console.error('Failed to load moderation portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInspectUser = async (userId: string) => {
    try {
      setLoadingActivity(true);
      const data = await api.getUserActivityAdmin(userId);
      setInspectedUserActivity(data);
      setActivityTab('overview');
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch user activity details', 'error');
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleToggleBan = async (user: User) => {
    const isBanned = user.accountStatus === 'banned';
    const action = isBanned ? 'unban' : 'ban';
    const reason = !isBanned ? prompt('Enter reason for suspension:', 'Violation of Community Guidelines') : null;
    if (!isBanned && reason === null) return;

    try {
      if (isBanned) {
        await api.unbanUserAdmin(user.id);
        showToast(`User @${user.username} has been unbanned.`, 'success');
      } else {
        await api.banUserAdmin(user.id, reason || 'Violation of Guidelines');
        showToast(`User @${user.username} suspended and violating content purged.`, 'success');
      }
      loadData();
      refreshUsers();
      if (inspectedUserActivity && inspectedUserActivity.user.id === user.id) {
        handleInspectUser(user.id);
      }
    } catch (err: any) {
      showToast(err.message || `Failed to ${action} user`, 'error');
    }
  };

  const handleToggleVerification = async (user: User) => {
    const willBeVerified = !user.isVerified;
    try {
      await api.setUserVerificationAdmin(user.id, willBeVerified, user.verificationCategory || 'individual');
      showToast(
        willBeVerified 
          ? `Verified badge granted to @${user.username}` 
          : `Verification badge revoked from @${user.username}`, 
        'success'
      );
      loadData();
      refreshUsers();
      if (inspectedUserActivity && inspectedUserActivity.user.id === user.id) {
        handleInspectUser(user.id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update verification status', 'error');
    }
  };

  const handleChangeRole = async (user: User, newRole: 'admin' | 'moderator' | 'user') => {
    try {
      await api.setUserRoleAdmin(user.id, newRole);
      showToast(`User @${user.username} role updated to ${newRole}`, 'success');
      loadData();
      refreshUsers();
      if (inspectedUserActivity && inspectedUserActivity.user.id === user.id) {
        handleInspectUser(user.id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to change user role', 'error');
    }
  };

  const handleSendWarning = async () => {
    if (!warningModalUser || !warningReason.trim()) return;
    try {
      await api.sendUserWarningAdmin(warningModalUser.id, warningReason.trim());
      showToast(`Official warning notice sent to @${warningModalUser.username}`, 'success');
      setWarningModalUser(null);
      setWarningReason('');
      loadData();
      if (inspectedUserActivity && inspectedUserActivity.user.id === warningModalUser.id) {
        handleInspectUser(warningModalUser.id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to send warning', 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.deletePostAdmin(postId);
      showToast('Post deleted by moderator', 'success');
      if (inspectedUserActivity) {
        handleInspectUser(inspectedUserActivity.user.id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete post', 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.deleteCommentAdmin(commentId);
      showToast('Comment deleted by moderator', 'success');
      if (inspectedUserActivity) {
        handleInspectUser(inspectedUserActivity.user.id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete comment', 'error');
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to remove this marketplace listing?')) return;
    try {
      await api.deleteListingAdmin(listingId);
      showToast('Listing deleted by moderator', 'success');
      if (inspectedUserActivity) {
        handleInspectUser(inspectedUserActivity.user.id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete listing', 'error');
    }
  };

  const handleResolveReport = async (reportId: string, action: 'dismissed' | 'content_deleted' | 'user_banned' | 'warning_issued') => {
    try {
      await api.resolveReport(reportId, {
        actionTaken: action,
        adminNotes: `Resolved with action: ${action}`
      });
      showToast(`Report resolved with action: ${action.replace('_', ' ')}`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to resolve report', 'error');
    }
  };

  const handleReviewVerification = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      await api.reviewVerificationApplication(applicationId, status, auditNotes);
      showToast(`Verification application ${status}!`, status === 'approved' ? 'success' : 'info');
      setSelectedAppId(null);
      setAuditNotes('');
      loadData();
      refreshUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to review verification', 'error');
    }
  };

  const pendingReports = reports.filter(r => r.status === 'pending');
  const pendingApps = applications.filter(a => a.status === 'pending');

  const filteredUsers = usersList.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(userSearch.toLowerCase()));

    if (!matchesSearch) return false;
    if (userFilter === 'verified') return user.isVerified;
    if (userFilter === 'banned') return user.isBanned;
    if (userFilter === 'staff') return user.role === 'admin' || user.role === 'moderator';
    return true;
  });

  return (
    <div id="moderation-portal-container" className="space-y-6 pb-12">
      {/* Banner */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Admin & Moderation Hub</h1>
              <p className="text-xs text-gray-500 dark:text-neutral-400">Moderate users, audit activity timelines, resolve flags, and verify authenticity badges</p>
            </div>
          </div>

          <button
            onClick={loadData}
            className="px-3.5 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Portal</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-neutral-800 gap-2 sm:gap-4 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'users' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Activity & Moderation ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'reports' ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Reported Items ({pendingReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('verification_queue')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'verification_queue' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Verification Queue ({pendingApps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'stats' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Platform Metrics</span>
        </button>
      </div>

      {/* Tab: Users Management & Activity */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 dark:text-neutral-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search users by name, @username, or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['all', 'verified', 'banned', 'staff'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setUserFilter(filterKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition whitespace-nowrap cursor-pointer ${
                    userFilter === filterKey
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {filterKey}
                </button>
              ))}
            </div>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 gap-3">
            {filteredUsers.length === 0 ? (
              <div className="py-12 text-center p-8 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-2">
                <Users className="w-8 h-8 text-gray-400 mx-auto" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">No Users Found</h3>
                <p className="text-xs text-gray-500 dark:text-neutral-400">Try adjusting your search criteria or filters.</p>
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className={`p-4 bg-white dark:bg-neutral-900 border rounded-2xl shadow-sm transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    u.isBanned 
                      ? 'border-red-300 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10' 
                      : 'border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700'
                  }`}
                >
                  {/* Left: User Identity */}
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={u.avatar}
                      alt={u.displayName}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-950 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {u.displayName}
                        </span>
                        {u.isVerified && <VerifiedBadge size="sm" type={u.role === 'admin' ? 'organization' : 'user'} />}
                        
                        {/* Role pill */}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : u.role === 'moderator'
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400'
                        }`}>
                          {u.role}
                        </span>

                        {u.isBanned && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                            Suspended
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                        <span className="font-mono">@{u.username}</span>
                        {u.email && <span>• {u.email}</span>}
                        <span>• Joined {new Date(u.joinedAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Moderation Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                    <button
                      onClick={() => handleInspectUser(u.id)}
                      className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Activity & Logs</span>
                    </button>

                    <button
                      onClick={() => handleToggleVerification(u)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                        u.isVerified
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
                          : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100'
                      }`}
                    >
                      <BadgeCheck className="w-3.5 h-3.5" />
                      <span>{u.isVerified ? 'Revoke Badge' : 'Grant Verified'}</span>
                    </button>

                    <button
                      onClick={() => setWarningModalUser(u)}
                      className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Issue Notice</span>
                    </button>

                    {/* Role dropdown */}
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeRole(u, e.target.value as any)}
                      className="px-2.5 py-1.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>

                    <button
                      onClick={() => handleToggleBan(u)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                        u.isBanned
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                      }`}
                    >
                      {u.isBanned ? <UserCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                      <span>{u.isBanned ? 'Unban User' : 'Suspend & Purge'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {pendingReports.length === 0 ? (
            <div className="py-12 text-center p-8 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Trust & Safety Queue Clear</h3>
              <p className="text-xs text-gray-500 dark:text-neutral-400">All user-flagged reports have been audited.</p>
            </div>
          ) : (
            pendingReports.map(report => (
              <div key={report.id} className="p-5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                        {report.category}
                      </span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white capitalize">
                        Reason: {report.reason.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-neutral-300">
                      Target: <span className="font-semibold text-gray-900 dark:text-white">{report.targetTitleOrSnippet}</span>
                    </p>
                    {report.details && (
                      <p className="text-[11px] text-gray-600 dark:text-neutral-400 mt-1 italic bg-gray-50 dark:bg-neutral-950 p-2 rounded-lg border border-gray-200 dark:border-neutral-800">
                        Reporter note: "{report.details}"
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] text-gray-400 dark:text-neutral-500 shrink-0">
                    {new Date(report.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-neutral-800">
                  <button
                    onClick={() => handleResolveReport(report.id, 'dismissed')}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-xl text-xs font-medium transition cursor-pointer"
                  >
                    Dismiss Flag
                  </button>
                  <button
                    onClick={() => handleResolveReport(report.id, 'warning_issued')}
                    className="px-3 py-1.5 bg-amber-50 dark:bg-amber-600/20 hover:bg-amber-100 dark:hover:bg-amber-600/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs font-medium transition cursor-pointer"
                  >
                    Issue Warning
                  </button>
                  <button
                    onClick={() => handleResolveReport(report.id, 'content_deleted')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
                  >
                    Delete Content
                  </button>
                  <button
                    onClick={() => handleResolveReport(report.id, 'user_banned')}
                    className="px-3 py-1.5 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900 border border-red-300 dark:border-red-500/40 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Ban Offender
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Verification Queue */}
      {activeTab === 'verification_queue' && (
        <div className="space-y-4">
          {pendingApps.length === 0 ? (
            <div className="py-12 text-center p-8 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-2">
              <CheckCircle2 className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Verification Queue Empty</h3>
              <p className="text-xs text-gray-500 dark:text-neutral-400">All submitted authenticity applications have been reviewed.</p>
            </div>
          ) : (
            pendingApps.map(app => (
              <div key={app.id} className="p-5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                        {app.category}
                      </span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {app.targetType === 'community' ? 'Community:' : 'Applicant:'} {app.targetName || app.realName}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 dark:text-neutral-300 space-y-1 mt-2">
                      <div>Target Type: <span className="font-semibold text-gray-900 dark:text-white uppercase">{app.targetType}</span> ({app.targetSlugOrUsername})</div>
                      <div>Document ID / Token: <span className="font-mono text-gray-900 dark:text-white">{app.documentNumber} ({app.documentType})</span></div>
                      {app.additionalNotes && <div>Statement: <span className="text-gray-700 dark:text-neutral-300">{app.additionalNotes}</span></div>}
                      {app.evidenceLinks?.length > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-gray-500 dark:text-neutral-400">Verified links:</span>
                          {app.evidenceLinks.map((link, idx) => (
                            <a
                              key={idx}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                            >
                              <span>Evidence #{idx + 1}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-gray-400 dark:text-neutral-500 shrink-0">
                    {new Date(app.submittedAt).toLocaleString()}
                  </span>
                </div>

                {/* Audit Actions */}
                <div className="pt-3 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                  <input
                    type="text"
                    placeholder="Optional staff audit feedback note..."
                    value={selectedAppId === app.id ? auditNotes : ''}
                    onChange={(e) => {
                      setSelectedAppId(app.id);
                      setAuditNotes(e.target.value);
                    }}
                    className="flex-1 max-w-sm px-3 py-1.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 mr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReviewVerification(app.id, 'rejected')}
                      className="px-3.5 py-1.5 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleReviewVerification(app.id, 'approved')}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Grant Badge</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Platform Stats */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm">
            <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400 block mb-1">Total Community Members</span>
            <span className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalUsers}</span>
          </div>

          <div className="p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm">
            <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400 block mb-1">Verified Authenticated Creators</span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.verifiedUsers}</span>
          </div>

          <div className="p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm">
            <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400 block mb-1">Active Communities</span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.totalCommunities}</span>
          </div>

          <div className="p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm">
            <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400 block mb-1">Marketplace Listings</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.totalListings}</span>
          </div>
        </div>
      )}

      {/* USER ACTIVITY INSPECTOR MODAL */}
      {inspectedUserActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <img
                  src={inspectedUserActivity.user.avatar}
                  alt={inspectedUserActivity.user.displayName}
                  className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-neutral-700"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {inspectedUserActivity.user.displayName}
                    </h3>
                    {inspectedUserActivity.user.isVerified && <VerifiedBadge size="sm" type="user" />}
                    <span className="text-xs text-gray-500 font-mono">@{inspectedUserActivity.user.username}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    Comprehensive User Activity Audit & Action Console
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectedUserActivity(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub Tabs */}
            <div className="flex border-b border-gray-200 dark:border-neutral-800 gap-3 py-3 overflow-x-auto">
              {[
                { key: 'overview', label: 'Overview', icon: BarChart3, count: null },
                { key: 'posts', label: 'Posts', icon: FileText, count: inspectedUserActivity.posts.length },
                { key: 'comments', label: 'Comments', icon: MessageSquare, count: inspectedUserActivity.comments.length },
                { key: 'listings', label: 'Listings', icon: ShoppingBag, count: inspectedUserActivity.listings.length },
                { key: 'reports', label: 'Reports Against', icon: ShieldAlert, count: inspectedUserActivity.reportsAgainst.length },
                { key: 'audit', label: 'Audit Logs', icon: Clock, count: inspectedUserActivity.auditLogs.length },
              ].map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActivityTab(t.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                      activityTab === t.key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label} {t.count !== null ? `(${t.count})` : ''}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body with scroll */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {activityTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-center">
                      <span className="text-[11px] text-gray-500 dark:text-neutral-400 block font-medium">Posts Authored</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">{inspectedUserActivity.posts.length}</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-center">
                      <span className="text-[11px] text-gray-500 dark:text-neutral-400 block font-medium">Comments Made</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">{inspectedUserActivity.comments.length}</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-center">
                      <span className="text-[11px] text-gray-500 dark:text-neutral-400 block font-medium">Store Listings</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">{inspectedUserActivity.listings.length}</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-center">
                      <span className="text-[11px] text-gray-500 dark:text-neutral-400 block font-medium">Reports Against</span>
                      <span className={`text-xl font-bold ${inspectedUserActivity.reportsAgainst.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {inspectedUserActivity.reportsAgainst.length}
                      </span>
                    </div>
                  </div>

                  {/* Bio & Details */}
                  <div className="p-4 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Profile Information</h4>
                    <p className="text-xs text-gray-700 dark:text-neutral-300">
                      {inspectedUserActivity.user.bio || 'No bio written yet.'}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs text-gray-600 dark:text-neutral-400 border-t border-gray-200 dark:border-neutral-800">
                      <div>Followers: <span className="font-semibold text-gray-900 dark:text-white">{inspectedUserActivity.user.followersCount || 0}</span></div>
                      <div>Following: <span className="font-semibold text-gray-900 dark:text-white">{inspectedUserActivity.user.followingCount || 0}</span></div>
                      <div>Account Role: <span className="font-semibold text-gray-900 dark:text-white uppercase">{inspectedUserActivity.user.role}</span></div>
                    </div>
                  </div>

                  {/* Communities */}
                  <div className="p-4 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Communities Involved</h4>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {inspectedUserActivity.ownedCommunities.map(c => (
                        <span key={c.id} className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold border border-indigo-200 dark:border-indigo-800">
                          👑 Owner: c/{c.slug}
                        </span>
                      ))}
                      {inspectedUserActivity.joinedCommunities.map(c => (
                        <span key={c.id} className="px-2.5 py-1 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 rounded-lg text-xs font-medium">
                          Member: c/{c.slug}
                        </span>
                      ))}
                      {inspectedUserActivity.ownedCommunities.length === 0 && inspectedUserActivity.joinedCommunities.length === 0 && (
                        <span className="text-xs text-gray-500">Not active in any communities.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activityTab === 'posts' && (
                <div className="space-y-3">
                  {inspectedUserActivity.posts.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-6">No posts authored by this user.</p>
                  ) : (
                    inspectedUserActivity.posts.map(p => (
                      <div key={p.id} className="p-3.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white">{p.title}</h4>
                          <p className="text-xs text-gray-600 dark:text-neutral-400 line-clamp-2 mt-0.5">{p.content}</p>
                          <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1.5">
                            <span>Likes: {p.upvotes || 0}</span>
                            <span>Comments: {p.commentsCount || 0}</span>
                            <span>{new Date(p.createdAt).toLocaleString()}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeletePost(p.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition shrink-0"
                          title="Delete Post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activityTab === 'comments' && (
                <div className="space-y-3">
                  {inspectedUserActivity.comments.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-6">No comments authored by this user.</p>
                  ) : (
                    inspectedUserActivity.comments.map(c => (
                      <div key={c.id} className="p-3.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-800 dark:text-neutral-200">{c.content}</p>
                          <span className="text-[10px] text-gray-500 block mt-1">
                            {new Date(c.createdAt).toLocaleString()} • Upvotes: {c.upvotes || 0}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition shrink-0"
                          title="Delete Comment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activityTab === 'listings' && (
                <div className="space-y-3">
                  {inspectedUserActivity.listings.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-6">No marketplace items listed by this user.</p>
                  ) : (
                    inspectedUserActivity.listings.map(l => (
                      <div key={l.id} className="p-3.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={l.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'}
                            alt={l.title}
                            className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{l.title}</h4>
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                              ${l.price.toFixed(2)} {l.currency}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteListing(l.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition shrink-0"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activityTab === 'reports' && (
                <div className="space-y-3">
                  {inspectedUserActivity.reportsAgainst.length === 0 ? (
                    <div className="text-center py-8 space-y-1">
                      <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
                      <p className="text-xs font-bold text-gray-900 dark:text-white">Clean Safety Record</p>
                      <p className="text-[11px] text-gray-500">No community complaints or reports filed against this user.</p>
                    </div>
                  ) : (
                    inspectedUserActivity.reportsAgainst.map(r => (
                      <div key={r.id} className="p-3.5 bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300">
                            {r.category} ({r.status})
                          </span>
                          <span className="text-[10px] text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{r.targetTitleOrSnippet}</p>
                        {r.details && <p className="text-[11px] text-gray-600 dark:text-neutral-400 italic">"{r.details}"</p>}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activityTab === 'audit' && (
                <div className="space-y-2">
                  {inspectedUserActivity.auditLogs.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-6">No administrative audit records logged for this user.</p>
                  ) : (
                    inspectedUserActivity.auditLogs.map(a => (
                      <div key={a.id} className="p-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{a.action}</span>
                          <span className="text-[10px] text-gray-400">{new Date(a.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-700 dark:text-neutral-300">{a.details}</p>
                        <span className="text-[10px] text-gray-400 block font-mono">By moderator: @{a.moderatorUsername}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-4 border-t border-gray-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleVerification(inspectedUserActivity.user)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    inspectedUserActivity.user.isVerified
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  }`}
                >
                  {inspectedUserActivity.user.isVerified ? 'Revoke Verified Badge' : 'Grant Verified Badge'}
                </button>

                <button
                  onClick={() => {
                    setWarningModalUser(inspectedUserActivity.user);
                  }}
                  className="px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-semibold hover:bg-amber-100 transition cursor-pointer"
                >
                  Send Official Notice
                </button>
              </div>

              <button
                onClick={() => handleToggleBan(inspectedUserActivity.user)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  inspectedUserActivity.user.isBanned
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {inspectedUserActivity.user.isBanned ? 'Unban User' : 'Suspend & Purge Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WARNING NOTICE MODAL */}
      {warningModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Issue Official Moderation Notice</h3>
              </div>
              <button onClick={() => setWarningModalUser(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-neutral-400">
              Sending a formal trust notice to <span className="font-semibold text-gray-900 dark:text-white">@{warningModalUser.username}</span>. This will be dispatched directly to their notifications bell and recorded on the platform audit logs.
            </p>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
                Notice & Correction Guidelines
              </label>
              <textarea
                rows={4}
                required
                value={warningReason}
                onChange={(e) => setWarningReason(e.target.value)}
                placeholder="e.g. Please refrain from promotional spam in the general feed. Review community rule #3."
                className="w-full p-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setWarningModalUser(null)}
                className="px-3.5 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 rounded-xl text-xs font-semibold hover:bg-gray-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendWarning}
                disabled={!warningReason.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
              >
                Dispatch Warning Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
