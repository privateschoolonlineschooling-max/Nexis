import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  ShieldCheck, 
  Sparkles, 
  ShoppingBag, 
  Users, 
  MessageSquare, 
  Lock, 
  Mail, 
  AtSign, 
  User as UserIcon, 
  ArrowRight, 
  Sun, 
  Moon, 
  CheckCircle2, 
  Globe
} from 'lucide-react';
import { VerifiedBadge } from '../common/VerifiedBadge';

interface AuthLandingViewProps {
  onSuccess?: () => void;
}

export const AuthLandingView: React.FC<AuthLandingViewProps> = ({ onSuccess }) => {
  const { login, loginWithGoogle, register, switchUser, allUsers } = useAuth();
  const { showToast } = useNotifications();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'personas'>('login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Google Modal Custom Email state
  const [showGoogleCustomModal, setShowGoogleCustomModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('privateschoolonlineschooling@gmail.com');
  const [customGoogleName, setCustomGoogleName] = useState('Online Schooling');

  const handleGoogleSignIn = async (customEmail?: string, customName?: string) => {
    try {
      setGoogleLoading(true);
      const email = customEmail || customGoogleEmail || 'privateschoolonlineschooling@gmail.com';
      const name = customName || customGoogleName || 'Google User';
      
      await loginWithGoogle({
        email: email.trim(),
        displayName: name.trim(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || email)}`,
        googleId: `google_${Date.now()}`
      });

      showToast(`Signed in with Google as ${email}`, 'success');
      setShowGoogleCustomModal(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Google authentication failed', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      showToast('Please enter your username/email and password', 'warning');
      return;
    }

    try {
      setLoading(true);
      await login(loginIdentifier.trim(), loginPassword);
      showToast('Welcome back to Nexis!', 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Invalid credentials. Try switching to a demo persona or use Google Sign-In.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStandardRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regDisplayName || !regUsername || !regEmail || !regPassword) {
      showToast('Please fill in all required registration fields', 'warning');
      return;
    }

    if (!agreedTerms) {
      showToast('Please accept the Community Standards and Guidelines', 'warning');
      return;
    }

    try {
      setLoading(true);
      await register({
        displayName: regDisplayName.trim(),
        username: regUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, ''),
        email: regEmail.toLowerCase().trim(),
        password: regPassword
      });
      showToast('Account created successfully! Welcome to Nexis.', 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPersona = async (userId: string, userName: string) => {
    try {
      setLoading(true);
      await switchUser(userId);
      showToast(`Logged in as ${userName}`, 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Failed to switch user', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-700 dark:selection:text-blue-200">
      {/* Top Simple Header */}
      <header className="w-full border-b border-gray-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 font-black text-lg">
              N
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-gray-900 dark:text-white">Nexis</span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Verified Social & Artisan Network
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Dual-Column Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-14">
        {/* Left Side: Brand Value Proposition & Features */}
        <div className="w-full lg:w-1/2 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Modern Social & Creator Economy</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
            Connect, create, and discover <span className="text-blue-600 dark:text-blue-400">verified</span> communities.
          </h1>

          <p className="text-sm sm:text-base text-gray-600 dark:text-neutral-400 leading-relaxed max-w-xl">
            Nexis brings authentic verified identities, rich multimedia discussions, topic communities, and an artisan marketplace with secure external checkout into a unified, distraction-free environment.
          </p>

          {/* Value Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 max-w-xl">
            <div className="p-3.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>Merit Verification</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                Free, authentic verification for recognized creators, builders, and organizations.
              </p>
            </div>

            <div className="p-3.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span>Artisan Marketplace</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                Showcase unique goods, handcrafted goods, and direct buyer communication.
              </p>
            </div>

            <div className="p-3.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
                <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <Users className="w-4 h-4" />
                </div>
                <span>Interest Spaces</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                Join public, restricted, or private hubs with custom rules and moderation.
              </p>
            </div>

            <div className="p-3.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span>Direct Messaging</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                Real-time conversations with granular privacy controls and file sharing.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="w-full lg:w-1/2 max-w-md">
          <div
            id="auth-landing-card"
            className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl text-gray-900 dark:text-neutral-100"
          >
            {/* Tab Selection */}
            <div className="flex border-b border-gray-200 dark:border-neutral-800 mb-6 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`pb-3 text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                  activeTab === 'login'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500'
                    : 'text-gray-400 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`pb-3 text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                  activeTab === 'register'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500'
                    : 'text-gray-400 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('personas')}
                className={`pb-3 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'personas'
                    ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
                    : 'text-gray-400 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Demo Accounts</span>
              </button>
            </div>

            {/* Google Sign In Button (Prominently displayed) */}
            {activeTab !== 'personas' && (
              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  id="google-signin-btn"
                  disabled={googleLoading}
                  onClick={() => handleGoogleSignIn()}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-700/70 shadow-sm transition active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {googleLoading ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-neutral-500 px-1">
                  <span>Instant 1-click authentication</span>
                  <button
                    type="button"
                    onClick={() => setShowGoogleCustomModal(true)}
                    className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Specify Google email
                  </button>
                </div>

                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-gray-200 dark:border-neutral-800 w-full" />
                  <span className="bg-white dark:bg-neutral-900 px-3 text-[11px] font-medium text-gray-400 dark:text-neutral-500 uppercase tracking-wider shrink-0">
                    or continue with email
                  </span>
                </div>
              </div>
            )}

            {/* TAB: LOGIN */}
            {activeTab === 'login' && (
              <form onSubmit={handleStandardLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-neutral-300 block mb-1.5">
                    Username or Email
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-gray-400 dark:text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="alex_rivers or alex@nexis.community"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-gray-700 dark:text-neutral-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => showToast('Password reset instructions simulated to your registered email', 'info')}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 dark:text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm disabled:opacity-50 mt-2 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Nexis'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="text-center pt-2">
                  <span className="text-xs text-gray-500 dark:text-neutral-400">
                    Want to test without credentials?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('personas')}
                      className="text-amber-600 dark:text-amber-400 hover:underline font-medium cursor-pointer"
                    >
                      Pick a Demo Persona
                    </button>
                  </span>
                </div>
              </form>
            )}

            {/* TAB: REGISTER */}
            {activeTab === 'register' && (
              <form onSubmit={handleStandardRegister} className="space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-neutral-300 block mb-1">
                    Display Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={regDisplayName}
                      onChange={(e) => setRegDisplayName(e.target.value)}
                      placeholder="e.g. Maya Chen"
                      className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-neutral-300 block mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <AtSign className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="maya_ceramics"
                      className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-neutral-300 block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="maya@example.com"
                      className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-neutral-300 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms-check"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 dark:border-neutral-700 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="terms-check" className="text-[11px] text-gray-500 dark:text-neutral-400">
                    I agree to the Community Guidelines, Marketplace Safety Standards, and Privacy Terms.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm disabled:opacity-50 mt-2 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            )}

            {/* TAB: DEMO PERSONAS */}
            {activeTab === 'personas' && (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
                  <p className="font-semibold flex items-center gap-1.5 mb-1 text-amber-700 dark:text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" /> Instant Test Accounts
                  </p>
                  Explore different roles including verified creators, artisan sellers, community organizers, and staff moderators without entering credentials.
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {allUsers.map((u) => {
                    const isMod = u.role === 'admin' || u.role === 'moderator';

                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectPersona(u.id, u.displayName)}
                        className="w-full flex items-center justify-between p-3 rounded-2xl border bg-white dark:bg-neutral-800/40 border-gray-200 dark:border-neutral-800 hover:bg-blue-50/60 dark:hover:bg-neutral-800/90 text-gray-800 dark:text-neutral-200 transition cursor-pointer text-left group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={u.avatar}
                            alt={u.displayName}
                            className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-200 dark:border-neutral-700"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                                {u.displayName}
                              </span>
                              {u.isVerified && (
                                <VerifiedBadge size="sm" type={u.role === 'admin' ? 'organization' : 'user'} />
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-neutral-400 truncate">
                              @{u.username} • <span className="capitalize text-blue-600 dark:text-blue-400 font-medium">{u.role}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isMod && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                              Staff
                            </span>
                          )}
                          <ArrowRight className="w-4 h-4 text-gray-400 dark:text-neutral-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Google Custom Email Selector Modal */}
      {showGoogleCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Google Sign-In Profile</h3>
            </div>

            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Confirm your Google Account credentials to link or create your verified Nexis identity.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-neutral-300 block mb-1">
                  Google Email Address
                </label>
                <input
                  type="email"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-neutral-300 block mb-1">
                  Google Account Name
                </label>
                <input
                  type="text"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowGoogleCustomModal(false)}
                className="flex-1 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleGoogleSignIn(customGoogleEmail, customGoogleName)}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
              >
                Authorize & Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 dark:border-neutral-800 py-6 text-center text-xs text-gray-500 dark:text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Nexis Social & Marketplace. Built with Trust & Verification.</span>
          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> All Services Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
