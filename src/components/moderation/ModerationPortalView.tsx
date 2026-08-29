import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { Report, VerificationApplication, PlatformStats } from '../../types/index';
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
  BarChart3 
} from 'lucide-react';

export const ModerationPortalView: React.FC = () => {
  const { currentUser, allUsers } = useAuth();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<'reports' | 'verification_queue' | 'stats'>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [applications, setApplications] = useState<VerificationApplication[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Review modal/notes state
  const [auditNotes, setAuditNotes] = useState('');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [repRes, appRes, statsRes] = await Promise.all([
        api.getReports().catch(() => ({ reports: [] })),
        api.getVerificationApplications().catch(() => ({ applications: [] })),
        api.getPlatformStats().catch(() => ({ stats: null }))
      ]);
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
    } catch (err: any) {
      showToast(err.message || 'Failed to review verification', 'error');
    }
  };

  const pendingReports = reports.filter(r => r.status === 'pending');
  const pendingApps = applications.filter(a => a.status === 'pending');

  return (
    <div id="moderation-portal-container" className="space-y-6 pb-12">
      {/* Banner */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Trust & Safety Moderation Portal</h1>
            <p className="text-xs text-gray-500 dark:text-neutral-400">Review content flags, verify identity applications, and audit platform health</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-neutral-800 gap-4">
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 ${
            activeTab === 'reports' ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Reported Items ({pendingReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('verification_queue')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 ${
            activeTab === 'verification_queue' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Identity Verification Queue ({pendingApps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 ${
            activeTab === 'stats' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Platform Metrics</span>
        </button>
      </div>

      {/* Tab Contents */}
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
                    className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-xl text-xs font-medium transition"
                  >
                    Dismiss Flag
                  </button>
                  <button
                    onClick={() => handleResolveReport(report.id, 'warning_issued')}
                    className="px-3 py-1.5 bg-amber-50 dark:bg-amber-600/20 hover:bg-amber-100 dark:hover:bg-amber-600/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs font-medium transition"
                  >
                    Issue Warning
                  </button>
                  <button
                    onClick={() => handleResolveReport(report.id, 'content_deleted')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                  >
                    Delete Content
                  </button>
                  <button
                    onClick={() => handleResolveReport(report.id, 'user_banned')}
                    className="px-3 py-1.5 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900 border border-red-300 dark:border-red-500/40 rounded-xl text-xs font-semibold transition"
                  >
                    Ban Offender
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

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
                      <span className="text-xs font-bold text-gray-900 dark:text-white">Applicant: {app.realName}</span>
                    </div>

                    <div className="text-xs text-gray-600 dark:text-neutral-300 space-y-1 mt-2">
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
                      className="px-3.5 py-1.5 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleReviewVerification(app.id, 'approved')}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1"
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
    </div>
  );
};
