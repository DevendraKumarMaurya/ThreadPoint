import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, Key, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function ProfileSecurityCard({
  user,
  verifyLoading,
  handleTriggerOtp,
  isPasswordFormOpen,
  setIsPasswordFormOpen,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showNewPassword,
  setShowNewPassword,
  passwordLoading,
  passwordError,
  passwordSuccess,
  setPasswordError,
  setPasswordSuccess,
  handleSetPassword,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base font-sans">
              Account Security & Dual Authentication
            </h3>
            <p className="text-xs text-slate-500">
              Manage email verification, Google OAuth linking, and password login
            </p>
          </div>
        </div>

        {/* Provider Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border flex items-center gap-1.5 ${
              user.auth_provider === 'both'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : user.auth_provider === 'google'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            {user.auth_provider === 'both' && 'Google + Password (Dual Auth)'}
            {user.auth_provider === 'google' && 'Google OAuth Only'}
            {user.auth_provider === 'local' && 'Password Auth'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        {/* 1. Email Verification Tile */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Status
              </span>
              {user.is_email_verified ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold font-mono flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" /> VERIFIED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold font-mono flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-600" /> UNVERIFIED
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-slate-800 font-semibold truncate mb-1">
              {user.email}
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {user.is_email_verified
                ? 'Your email address is verified and active for all contributor privileges.'
                : 'Verify your email with a 6-digit one-time password (OTP) to activate full contributor features.'}
            </p>
          </div>

          {!user.is_email_verified && (
            <div className="mt-3 pt-3 border-t border-slate-200/70">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                disabled={verifyLoading}
                onClick={handleTriggerOtp}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {verifyLoading ? 'Sending Code...' : 'Verify Now with 6-Digit OTP'}
              </motion.button>
            </div>
          )}
        </div>

        {/* 2. Password Login Configuration Tile */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" /> Direct Password Login
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-semibold">
                {user.auth_provider === 'google' ? 'Optional' : 'Active'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed mb-1">
              {user.auth_provider === 'google'
                ? 'You joined using Google. You can optionally set a password below to allow direct email & password login anytime.'
                : 'A secure password is configured for this account.'}
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/70">
            <button
              type="button"
              onClick={() => {
                setIsPasswordFormOpen(prev => !prev);
                setPasswordError('');
                setPasswordSuccess('');
              }}
              className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                {isPasswordFormOpen
                  ? 'Cancel'
                  : user.auth_provider === 'google'
                  ? 'Set Password for Direct Login'
                  : 'Change Account Password'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Set / Change Password Form */}
      <AnimatePresence>
        {isPasswordFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-4 pt-4 border-t border-slate-100 overflow-hidden"
          >
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                {user.auth_provider === 'google' ? 'Configure Direct Password' : 'Change Password'}
              </h4>
              <p className="text-[11px] text-slate-500 mb-3">
                Password must be at least 6 characters. You will be able to log in with either Google or this password.
              </p>

              {passwordError && (
                <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSetPassword} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsPasswordFormOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={passwordLoading}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {passwordLoading ? 'Saving...' : 'Save Password'}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
