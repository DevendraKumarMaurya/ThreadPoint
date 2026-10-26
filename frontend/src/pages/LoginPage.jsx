import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import GoogleAuthControl from '../components/auth/GoogleAuthControl';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, switchUser, demoUsers } = useAuth();
  const availableUsers = (demoUsers && demoUsers.length > 0) ? demoUsers : DEMO_USERS;

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoSelector, setShowDemoSelector] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!emailOrUsername.trim()) {
      setError('Please enter your email or username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login(emailOrUsername, password);
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle(credentialResponse.credential);
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMockGoogle = async () => {
    try {
      setLoading(true);
      setError('');
      const mockToken = `dev-mock-google-token:${encodeURIComponent(JSON.stringify({
        email: 'alex.google@example.com',
        name: 'Alex Mercer',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      }))}`;
      await loginWithGoogle(mockToken);
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Google demo sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (user) => {
    setError('');
    setLoading(true);
    try {
      await switchUser(user);
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Failed to switch demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/feed" className="inline-flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-extrabold text-lg font-mono">T</span>
            </div>
            <span className="font-bold text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">
              ThreadPoint
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-4 font-sans tracking-tight">
            Sign In
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back! Enter your details to continue.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <GoogleAuthControl
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign-in was cancelled or encountered an error.')}
            onMockGoogle={handleMockGoogle}
          />

          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-xs text-slate-400 shrink-0">
              or continue with email
            </span>
            <div className="border-t border-slate-200 w-full"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-sans">
                Email or Username
              </label>
              <input
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="you@example.com or username"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 font-sans">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Discreet Demo Account Dropdown */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowDemoSelector(!showDemoSelector)}
              className="w-full text-center text-xs text-indigo-600 hover:text-indigo-800 font-medium py-1 transition-colors cursor-pointer"
            >
              {showDemoSelector ? 'Hide demo accounts ▲' : 'Sign in with a demo account (1-click) ▼'}
            </button>

            {showDemoSelector && (
              <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto pt-1">
                {availableUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickDemo(u)}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-xs hover:bg-slate-50 border border-slate-100 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={u.avatar_url}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="font-semibold text-slate-800">@{u.username}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{u.reputation_score} rep</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center mt-5">
          <p className="text-xs text-slate-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 hover:underline font-semibold">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
