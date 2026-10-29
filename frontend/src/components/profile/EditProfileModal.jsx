import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit3, X, Check } from 'lucide-react';
import { DEFAULT_AVATARS } from '../../context/AuthContext';

export default function EditProfileModal({
  isOpen,
  onClose,
  editAvatarUrl,
  setEditAvatarUrl,
  editBio,
  setEditBio,
  editLocation,
  setEditLocation,
  editGithubUrl,
  setEditGithubUrl,
  editWebsiteUrl,
  setEditWebsiteUrl,
  profileSaveLoading,
  profileSaveError,
  profileSaveSuccess,
  handleSaveProfile,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit Profile</h3>
                  <p className="text-xs text-slate-500">Update your public profile details and bio</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {profileSaveError && (
              <div className="mt-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {profileSaveError}
              </div>
            )}

            {profileSaveSuccess && (
              <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{profileSaveSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-3.5 text-xs">
              {/* 20 Preset Avatars Only */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-slate-700">Choose Profile Avatar</label>
                  <span className="text-[10px] text-slate-400">20 default presets</span>
                </div>

                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
                  {/* Current Active Preview */}
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
                    <img
                      src={editAvatarUrl || DEFAULT_AVATARS[0].url}
                      alt="Active avatar"
                      width="40"
                      height="40"
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-600 bg-white shadow-2xs"
                    />
                    <div>
                      <p className="font-bold text-slate-800 text-[11px]">
                        {DEFAULT_AVATARS.find(a => a.url === editAvatarUrl)?.name || 'Active'} Avatar
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Pick one of the 20 characters below:
                      </p>
                    </div>
                  </div>

                  {/* 20 Presets Grid */}
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 max-h-[140px] overflow-y-auto p-1">
                    {DEFAULT_AVATARS.map((av) => {
                      const isSelected = editAvatarUrl === av.url;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setEditAvatarUrl(av.url)}
                          title={av.name}
                          className={`relative p-1 rounded-lg transition-all cursor-pointer flex flex-col items-center ${
                            isSelected
                              ? 'bg-indigo-50 ring-2 ring-indigo-600 shadow-2xs'
                              : 'bg-white hover:bg-slate-100 ring-1 ring-slate-200'
                          }`}
                        >
                          <img
                            src={av.url}
                            alt={av.name}
                            width="32"
                            height="32"
                            className="w-8 h-8 rounded object-cover"
                            loading="lazy"
                          />
                          <span className="text-[8px] text-slate-600 truncate max-w-full mt-0.5">
                            {av.name}
                          </span>
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                              <Check className="w-2 h-2 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">About You / Bio</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Briefly describe your interests, work, or hobbies..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GitHub URL</label>
                  <input
                    type="text"
                    value={editGithubUrl}
                    onChange={(e) => setEditGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
                  <input
                    type="text"
                    value={editWebsiteUrl}
                    onChange={(e) => setEditWebsiteUrl(e.target.value)}
                    placeholder="https://yourdomain.dev"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-800 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaveLoading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {profileSaveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
