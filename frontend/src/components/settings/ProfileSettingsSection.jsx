import React, { useState } from 'react';
import { User, MapPin, Globe, GitBranch, Sparkles, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { updateUserProfile } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function ProfileSettingsSection() {
  const { currentUser, updateCurrentUserData } = useAuth();

  const [username, setUsername] = useState(currentUser?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [location, setLocation] = useState(currentUser?.location || '');
  const [githubUrl, setGithubUrl] = useState(currentUser?.github_url || '');
  const [websiteUrl, setWebsiteUrl] = useState(currentUser?.website_url || '');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const avatarSeeds = ['bot-1', 'arch-2', 'postgres-pro', 'fullstack-dev', 'data-eng'];

  const handleSelectSeed = (seed) => {
    const url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
    setAvatarUrl(url);
  };

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
          Customize how other software engineers see your profile, technical contributions, and bio across ThreadPoint.
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
        {/* Avatar Configuration */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2 font-sans">
            Avatar Image
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <img
              src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt="Avatar preview"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-xs shrink-0"
            />
            <div className="flex-1 space-y-2">
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-mono text-slate-400">Presets:</span>
                {avatarSeeds.map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => handleSelectSeed(seed)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-[10px] font-mono text-slate-600 transition-colors cursor-pointer"
                  >
                    {seed}
                  </button>
                ))}
              </div>
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

        {/* Bio / Technical Specialty */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-sans">
            Technical Bio / Engineering Specialty
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="e.g. Senior Backend Architect focusing on PostgreSQL query optimization, distributed consensus, and TypeScript services."
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
              Personal Website / Technical Blog
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourblog.dev"
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
