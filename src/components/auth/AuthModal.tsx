import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Lock, Mail, AtSign, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login'
}) => {
  const { login, loginWithGoogle, register } = useAuth();
  const { showToast } = useNotifications();

  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(initialTab);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await loginWithGoogle();
      showToast('Signed in with Google successfully', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Google authentication failed', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(usernameOrEmail, password);
      showToast('Logged in successfully', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await register({ username, email, password, displayName });
      showToast('Account registered successfully! Welcome to Nexis.', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="auth-modal-card"
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl text-gray-900 dark:text-neutral-100 overflow-hidden"
      >
        <button
          onClick={onClose}
          id="close-auth-modal"
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Headers */}
        <div className="flex border-b border-gray-200 dark:border-neutral-800 mb-6 gap-6">
          <button
            onClick={() => setTab('login')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition ${
              tab === 'login'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500'
                : 'text-gray-400 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('register')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition ${
              tab === 'register'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500'
                : 'text-gray-400 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200'
            }`}
          >
            Register
          </button>
        </div>

        {tab === 'login' && (
          <div className="space-y-4">
            <button
              type="button"
              disabled={googleLoading}
              onClick={handleGoogleSignIn}
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

            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-200 dark:border-neutral-800 w-full" />
              <span className="bg-white dark:bg-neutral-900 px-3 text-[10px] font-medium text-gray-400 dark:text-neutral-500 uppercase tracking-wider shrink-0">
                or sign in with password
              </span>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-neutral-300 block mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-gray-400 dark:text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="username or email@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-neutral-300 block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 dark:text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="text-right mt-1.5">
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </div>
        )}

        {tab === 'register' && (
          <div className="space-y-4">
            <button
              type="button"
              disabled={googleLoading}
              onClick={handleGoogleSignIn}
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
              <span>Sign Up with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-200 dark:border-neutral-800 w-full" />
              <span className="bg-white dark:bg-neutral-900 px-3 text-[10px] font-medium text-gray-400 dark:text-neutral-500 uppercase tracking-wider shrink-0">
                or sign up with email
              </span>
            </div>

            <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-neutral-300 block mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Jordan Miller"
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-neutral-300 block mb-1">
                Username
              </label>
              <div className="relative">
                <AtSign className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="jordan_m"
                  className="w-full pl-8 pr-3.5 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-neutral-300 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@example.com"
                  className="w-full pl-8 pr-3.5 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-neutral-300 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-8 pr-3.5 py-2 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm disabled:opacity-50 mt-1"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          </div>
        )}

        {tab === 'forgot' && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Reset Password</h4>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Enter your email address and we'll immediately send instructions to reset your password.
            </p>
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-neutral-300 block mb-1">
                Account Email
              </label>
              <input
                type="email"
                placeholder="user@example.com"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                showToast('Password reset link sent', 'info');
                setTab('login');
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
            >
              Send Reset Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
