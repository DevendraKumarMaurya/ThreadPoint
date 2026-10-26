import React from 'react';
import { motion } from 'motion/react';
import {
  Users,
  UserPlus,
  UserCheck,
  ArrowLeft,
  ShieldCheck,
  Edit3,
  Settings,
  MapPin,
  GitBranch,
  Globe,
  ExternalLink,
} from 'lucide-react';

export default function ProfileHeader({
  user,
  currentUser,
  isCurrentUser,
  followerCount,
  followingCount,
  isFollowing,
  followLoading,
  activeTab,
  setActiveTab,
  handleToggleFollow,
  onOpenEditProfile,
  onNavigate,
}) {
  return (
    <>
      <motion.button
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onNavigate('feed')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors w-fit cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
      </motion.button>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center sm:items-start md:items-center justify-between gap-5 sm:gap-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
          <img
            src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
            alt=""
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-md shrink-0"
          />
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="font-sans font-bold text-xl sm:text-2xl text-slate-900">
                @{user.username}
              </h1>
              {user.id === currentUser?.id && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-mono text-[11px] font-bold">
                  You
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md">{user.bio}</p>

            {/* Location & Social Links */}
            {(user.location || user.github_url || user.website_url) && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs text-slate-500">
                {user.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.location}</span>
                  </div>
                )}
                {user.github_url && (
                  <a
                    href={user.github_url.startsWith('http') ? user.github_url : `https://${user.github_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </a>
                )}
                {user.website_url && (
                  <a
                    href={user.website_url.startsWith('http') ? user.website_url : `https://${user.website_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </a>
                )}
              </div>
            )}

            <p className="text-xs font-mono text-slate-400 mt-1.5">
              Member since {new Date(user.created_at).toLocaleDateString()}
            </p>

            {/* Follower / Following Metric Badges & Action Button */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <button
                type="button"
                onClick={() => setActiveTab('followers')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  activeTab === 'followers'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-mono font-bold text-slate-900">{followerCount.toLocaleString()}</span>
                <span className="text-slate-500 font-sans">Followers</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('following')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  activeTab === 'following'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
              >
                <span className="font-mono font-bold text-slate-900">{followingCount.toLocaleString()}</span>
                <span className="text-slate-500 font-sans">Following</span>
              </button>

              {isCurrentUser ? (
                <div className="flex items-center gap-1.5">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onOpenEditProfile}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 shadow-2xs transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit Profile</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate('settings')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-300 hover:border-indigo-300 text-slate-700 shadow-2xs transition-all cursor-pointer"
                    title="Account Settings"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    <span>Settings</span>
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isFollowing
                      ? 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-300 hover:border-red-200'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                >
                  {followLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Reputation Score Metric Box */}
        <motion.div
          key={user.reputation_score}
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 flex flex-col items-center justify-center min-w-[170px] w-full sm:w-auto text-center"
        >
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Community Reputation
          </span>
          <span className="font-mono font-extrabold text-2xl sm:text-3xl text-indigo-600 my-0.5">
            {user.reputation_score.toLocaleString()}
          </span>
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified Contributor
          </span>
        </motion.div>
      </div>
    </>
  );
}
