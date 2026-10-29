import React, { useState } from 'react';
import { X, Lock, Mail, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import GoogleAuthControl from '../auth/GoogleAuthControl';
import DemoAccountSwitcher from '../auth/DemoAccountSwitcher';
import Logo from './Logo';

export default function AuthModal({ isOpen, onClose }) {
  const { currentUser, login, loginWithGoogle, register, switchUser, demoUsers, openOtpModal } = useAuth();
  const availableUsers = demoUsers || DEMO_USERS;
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'demo'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email || username, password);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, email, password, bio);
      onClose();
      openOtpModal({
        email: email.trim(),
      });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      onClose();
    } catch (err) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMockGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const mockToken = `dev-mock-google-token:${encodeURIComponent(JSON.stringify({
        email: 'alex.google@example.com',
        name: 'Alex Mercer',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      }))}`;
      await loginWithGoogle(mockToken);
      onClose();
    } catch (err) {
      setError(err.message || 'Google test sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="auth-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <motion.div
            key="auth-modal-dialog"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Logo size={28} />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base font-sans">
                  Authentication & Personas
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switch */}
            <div className="flex border-b border-slate-100 bg-slate-50 p-1.5 gap-1">
              <button
                onClick={() => setTab('login')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  tab === 'login' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setTab('register')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  tab === 'register' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Register
              </button>
              <button
                onClick={() => setTab('demo')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  tab === 'demo' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Demo Accounts
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6">
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
                  {error}
                </div>
              )}

              <AnimatePresence mode="wait">
                {tab === 'demo' && (
                  <motion.div
                    key="tab-demo"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                  >
                    <DemoAccountSwitcher
                      availableUsers={availableUsers}
                      currentUserId={currentUser?.id}
                      onSelectUser={(user) => {
                        switchUser(user);
                        onClose();
                      }}
                    />
                  </motion.div>
                )}

                {tab === 'login' && (
                  <motion.div
                    key="tab-login"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="flex flex-col gap-3.5"
                  >
                    <GoogleAuthControl
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError('Google sign-in encountered an error')}
                      onMockGoogle={handleMockGoogle}
                    />

                    <div className="relative flex items-center justify-center my-1">
                      <div className="border-t border-slate-200 w-full"></div>
                      <span className="bg-white px-2 text-[10px] font-mono uppercase text-slate-400 shrink-0">
                        or credentials
                      </span>
                      <div className="border-t border-slate-200 w-full"></div>
                    </div>

                    <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Email or Username
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="sarah_codes or sarah@threadpoint.dev"
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors mt-2 disabled:opacity-50 cursor-pointer"
                      >
                        {loading ? 'Signing In...' : 'Sign In'}
                      </button>
                    </form>
                  </motion.div>
                )}

                {tab === 'register' && (
                  <motion.div
                    key="tab-register"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="flex flex-col gap-3.5"
                  >
                    <GoogleAuthControl
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError('Google sign-in encountered an error')}
                      onMockGoogle={handleMockGoogle}
                    />

                    <div className="relative flex items-center justify-center my-1">
                      <div className="border-t border-slate-200 w-full"></div>
                      <span className="bg-white px-2 text-[10px] font-mono uppercase text-slate-400 shrink-0">
                        or email registration
                      </span>
                      <div className="border-t border-slate-200 w-full"></div>
                    </div>

                    <form onSubmit={handleRegister} className="flex flex-col gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Username
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="unique_handle"
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="dev@domain.com"
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Short Bio / Specialty
                        </label>
                        <input
                          type="text"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="e.g. Distributed databases, React hooks"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors mt-2 disabled:opacity-50 cursor-pointer"
                      >
                        {loading ? 'Creating Account...' : 'Register Account'}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
