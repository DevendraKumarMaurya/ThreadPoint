import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Check, AlertCircle, RefreshCw, KeyRound, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

export default function SecuritySettingsSection() {
  const { currentUser, sendOtp, openOtpModal, updatePassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSendVerificationOtp = async () => {
    if (!currentUser?.email) return;
    setOtpLoading(true);
    setError('');
    setSuccess('');
    try {
      await sendOtp(currentUser.email, 'email_verification');
      openOtpModal({ email: currentUser.email });
      setSuccess('Verification OTP code dispatched. Enter the 6 digits to verify.');
    } catch (err) {
      setError(err.message || 'Failed to dispatch verification OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(newPassword);
      setSuccess('Account password configured successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update account password.');
    } finally {
      setLoading(false);
    }
  };

  const authProvider = currentUser?.auth_provider || (currentUser?.is_google_auth ? 'google' : 'local');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900 font-sans flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          Account Security & Credentials
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Manage your email verification, OAuth connections, and account access credentials.
        </p>
      </div>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Email Verification Card */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900">{currentUser?.email}</span>
              {currentUser?.is_email_verified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  <Check className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
                  Unverified
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              {currentUser?.is_email_verified
                ? 'Your email address is verified and protected against unauthorized account takeover.'
                : 'Verify your email address via 6-digit OTP code to receive instant question answers and moderation alerts.'}
            </p>
          </div>
        </div>

        {!currentUser?.is_email_verified && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            disabled={otpLoading}
            onClick={handleSendVerificationOtp}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            {otpLoading ? 'Sending OTP...' : 'Send Verification OTP'}
          </motion.button>
        )}
      </div>

      {/* Authentication Mode Status */}
      <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
        <div>
          <span className="font-semibold text-slate-700 block">Active Authentication Method:</span>
          <span className="font-mono text-slate-500 text-[11px] capitalize">
            {authProvider === 'both'
              ? 'Dual Login (Google OAuth & Password)'
              : authProvider === 'google'
              ? 'Google OAuth 2.0 Single Sign-On'
              : 'Standard Password Authentication'}
          </span>
        </div>
        <span className="font-mono text-[10px] font-bold px-2 py-1 rounded bg-indigo-50 text-indigo-700">
          ID #{currentUser?.id}
        </span>
      </div>

      {/* Change Password Form */}
      <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 font-sans">
            Set or Change Password
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Enables direct password sign-in for your handle alongside any linked Google accounts.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-sans">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-sans">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Update Password</span>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
