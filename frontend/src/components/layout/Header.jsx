import React from 'react';
import { Search, PlusCircle, Star, Award, Sparkles, Menu, X, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import UserMenuDropdown from './UserMenuDropdown';

export default function Header({ onOpenSearch, onNavigate, onOpenAuth, isMobileMenuOpen, onToggleMobileMenu }) {
  const { currentUser, openOtpModal, sendOtp } = useAuth();

  const getRepTier = (rep = 0) => {
    if (rep >= 2000) return { label: 'Diamond', icon: Sparkles, color: 'text-cyan-500' };
    if (rep >= 1000) return { label: 'Gold', icon: Award, color: 'text-amber-500' };
    if (rep >= 500) return { label: 'Silver', icon: Star, color: 'text-slate-400' };
    return { label: 'Bronze', icon: Star, color: 'text-amber-700' };
  };

  const repTier = getRepTier(currentUser?.reputation_score || 0);
  const TierIcon = repTier.icon;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md z-40 border-b border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
      <div className="h-16 w-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-6">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Hamburger Drawer Trigger */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-slate-700" />
            ) : (
              <Menu className="w-5 h-5 text-slate-700" />
            )}
          </button>

          {/* Brand Lockup */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
            onClick={() => onNavigate('feed')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:bg-indigo-700 transition-all shrink-0">
              <span className="text-white font-extrabold text-base sm:text-lg tracking-wider font-mono">T</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 -ml-0.5 -mt-2 animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-bold text-lg sm:text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                ThreadPoint
              </span>
              <span className="text-[10px] font-sans font-medium text-slate-400 -mt-0.5 hidden sm:block">
                Developer Knowledge Platform
              </span>
            </div>
          </motion.div>
        </div>

        {/* Global Search Bar (Desktop Cmd+K) */}
        <div className="flex-1 max-w-2xl hidden md:flex items-center">
          <div
            onClick={onOpenSearch}
            className="w-full flex items-center bg-slate-100 hover:bg-slate-200/80 rounded-xl px-4 py-2 gap-2.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer transition-all border border-transparent hover:border-slate-300"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span className="flex-1 text-sm text-slate-400 font-sans">
              Search questions, code snippets, tags, users...
            </span>
            <kbd className="shrink-0 font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white text-slate-500 shadow-xs border border-slate-200">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Mobile Search Icon Trigger */}
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search"
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Search className="w-5 h-5" />
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('ask')}
            className="inline-flex items-center gap-1.5 bg-indigo-600 text-white font-semibold text-xs sm:text-sm px-2.5 sm:px-3.5 py-2 rounded-xl shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Ask Question</span>
          </motion.button>

          {/* User Reputation Pill */}
          {currentUser && (
            <motion.div
              key={currentUser.reputation_score}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              onClick={() => onNavigate('profile', currentUser.username || currentUser.id)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-all"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span className="font-mono text-xs font-semibold text-slate-900">
                {(currentUser.reputation_score ?? 1).toLocaleString()} rep
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-[11px] font-medium text-indigo-600 flex items-center gap-1">
                <TierIcon className={`w-3 h-3 ${repTier.color}`} />
                {repTier.label}
              </span>
            </motion.div>
          )}

          {/* Unverified Email Pill */}
          {currentUser && !currentUser.is_email_verified && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await sendOtp(currentUser.email, 'email_verification');
                  openOtpModal({ email: currentUser.email });
                } catch (e) {
                  openOtpModal({ email: currentUser.email });
                }
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-mono font-bold transition-colors cursor-pointer"
              title="Click to verify email with 6-digit OTP"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              <span>Verify Email</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <NotificationDropdown
            currentUser={currentUser}
            onNavigate={onNavigate}
          />

          {/* User Profile Dropdown OR Sign In / Sign Up Buttons */}
          {currentUser ? (
            <UserMenuDropdown
              currentUser={currentUser}
              onNavigate={onNavigate}
            />
          ) : (
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onOpenAuth}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Demo Accounts</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('login')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Sign In
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('signup')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Sign Up
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
