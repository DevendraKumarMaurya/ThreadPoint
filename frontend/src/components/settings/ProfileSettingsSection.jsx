import React, { useState } from 'react';
import { User, MapPin, Globe, GitBranch, Sparkles, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { updateUserProfile } from '../../api/client';
import { useAuth, DEFAULT_AVATARS } from '../../context/AuthContext';

export default function ProfileSettingsSection() {
  const { currentUser, updateCurrentUserData } = useAuth();

  const [username, setUsername] = useState(currentUser?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || DEFAULT_AVATARS[0].url);
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [location, setLocation] = useState(currentUser?.location || '');
  const [githubUrl, setGithubUrl] = useState(currentUser?.github_url || '');
  const [websiteUrl, setWebsiteUrl] = useState(currentUser?.website_url || '');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters long and contain only letters, numbers, or underscores.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateUserProfile({
        username: cleanUsername,
        avatar_url: avatarUrl.trim(),
        bio: bio.trim(),
        location: location.trim(),
        github_url: githubUrl.trim(),
        website_url: websiteUrl.trim(),
      });

      if (res.user) {
        updateCurrentUserData(res.user);
      }
      setSuccess('Profile identity and public footprint updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7">
      <div className="border-b border-slate-100 pb-4 mb-6">
        <h2 className="text-lg font-bold text-slate-900 font-sans">
          Public Profile & Identity
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Customize how other community members see your profile, contributions, and bio across ThreadPoint.
        </p>
      </div>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar Configuration - 20 Presets Only */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-700 font-sans">
              Profile Avatar
            </label>
            <span className="text-[11px] font-sans text-slate-500">
              Choose from 20 community presets (custom uploads disabled)
            </span>
          </div>

          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-4">
            {/* Current Selected Avatar Preview */}
            <div className="flex items-center gap-3.5 pb-3 border-b border-slate-200/70">
              <div className="relative">
                <img
                  src={avatarUrl || DEFAULT_AVATARS[0].url}
                  alt="Selected avatar preview"
                  width="56"
                  height="56"
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-600 shadow-xs bg-white"
                />
                <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-0.5 rounded-full ring-2 ring-white">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {DEFAULT_AVATARS.find(a => a.url === avatarUrl)?.name || 'Custom'} Avatar Active
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click any of the 20 preset characters below to update your public profile picture.
                </p>
              </div>
            </div>

            {/* 20 Presets Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5">
              {DEFAULT_AVATARS.map((av) => {
                const isSelected = avatarUrl === av.url;
                return (
                  <motion.button
                    key={av.id}
                    type="button"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setAvatarUrl(av.url)}
                    title={av.name}
                    className={`relative p-1 rounded-xl transition-all cursor-pointer flex flex-col items-center group ${
                      isSelected
                        ? 'bg-indigo-50 ring-2 ring-indigo-600 shadow-xs'
                        : 'bg-white hover:bg-slate-100 ring-1 ring-slate-200 hover:ring-slate-300'
                    }`}
                  >
                    <img
                      src={av.url}
                      alt={av.name}
                      width="40"
                      height="40"
                      className="w-10 h-10 rounded-lg object-cover"
                      loading="lazy"
                    />
                    <span className="text-[9px] font-medium text-slate-600 mt-1 truncate max-w-full">
                      {av.name}
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-600 text-white rounded-full flex items-center justify-center ring-1 ring-white">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Username & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-sans">
              Username Handle
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-mono text-slate-400 font-bold">
                @
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Unique handle used for profile routes and mentions.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-sans">
              Geographic Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA or Remote"
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans"
              />
            </div>
          </div>
        </div>

        {/* Bio / About */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-sans">
            About You / Bio
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="e.g. Passionate about philosophy, science, lifelong learning, and community knowledge sharing."
            className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Displayed on your profile header and hover cards across community discussions.
          </p>
        </div>

        {/* GitHub & Website URLs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-sans">
              GitHub Profile Link
            </label>
            <div className="relative">
              <GitBranch className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-sans">
              Personal Website / Blog
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex items-center justify-end">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
