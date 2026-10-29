import React, { useState, useRef, useEffect } from 'react';
import { User, Bookmark, Settings, Users, LogOut, Sparkles, Check, Plus, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

export default function UserMenuDropdown({ currentUser, onNavigate }) {
  const { logout, savedAccounts = [], switchAccount, removeSavedAccount } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switchingAccountId, setSwitchingAccountId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  if (!currentUser) return null;

  const handleAccountSwitch = async (account) => {
    if (account.id === currentUser?.id) return;
    setSwitchingAccountId(account.id);
    setIsOpen(false);
    await switchAccount(account);
    setSwitchingAccountId(null);
  };

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(prev => !prev)}
        title="Account Center & Menu"
        className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
      >
        <img
          src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
          alt={currentUser?.username || 'User avatar'}
          className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20 shadow-2xs"
        />
        <span className="hidden xl:inline text-xs font-semibold text-slate-700 max-w-[100px] truncate">
          @{currentUser?.username}
        </span>
      </motion.button>

      {/* Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-2 z-50 overflow-hidden"
          >
            {/* Active Account Header */}
            <div className="px-3 py-2.5 bg-slate-50/70 rounded-xl mb-1.5 border border-slate-100/80">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Signed in as
              </p>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className="text-sm font-bold text-slate-900 truncate">@{currentUser?.username}</p>
                <span className="text-[11px] text-indigo-600 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/60 shrink-0">
                  {currentUser?.reputation_score} rep
                </span>
              </div>
            </div>

            {/* Direct Account Navigation Links */}
            <div className="py-1 border-b border-slate-100 space-y-0.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('profile', currentUser.username || currentUser.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>My Profile & Stats</span>
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('bookmarks');
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                <span>Saved Bookmarks</span>
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('settings');
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Account Settings</span>
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('features');
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Platform Features & Guide</span>
              </button>
            </div>

            {/* Account Center: 1-Click Multi-Account Switcher */}
            <div className="py-2 border-b border-slate-100">
              <div className="px-3 flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
                  <Users className="w-3 h-3 text-indigo-500" />
                  Switch Account
                </span>
                <span className="text-[9px] font-mono text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                  {savedAccounts.length} {savedAccounts.length === 1 ? 'account' : 'accounts'}
                </span>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                {savedAccounts.map((acc) => {
                  const isCurrent = currentUser?.id === acc.id;
                  const isSwitchingThis = switchingAccountId === acc.id;
                  return (
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      key={acc.id}
                      className={`group/acc w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isCurrent
                          ? 'bg-indigo-50/80 text-indigo-700 font-semibold border border-indigo-100/70 shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleAccountSwitch(acc)}
                        className="flex-1 flex items-center gap-2 min-w-0 text-left cursor-pointer"
                      >
                        <img
                          src={acc.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                          alt={acc.username}
                          className="w-5.5 h-5.5 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">@{acc.username}</p>
                          <p className="truncate text-[10px] text-slate-400 font-mono font-normal">
                            {acc.reputation_score ?? 1} rep
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {isSwitchingThis ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-600">
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          </span>
                        ) : isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-white px-1.5 py-0.5 rounded-md shadow-2xs border border-indigo-100/60">
                            <Check className="w-3 h-3 text-indigo-600" />
                            Active
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAccountSwitch(acc)}
                              className="text-[11px] font-medium text-slate-400 group-hover/acc:text-indigo-600 hover:underline cursor-pointer px-1 py-0.5"
                            >
                              Switch
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSavedAccount(acc.id);
                              }}
                              title="Remove from saved accounts"
                              className="opacity-0 group-hover/acc:opacity-100 p-1 text-slate-300 hover:text-red-500 rounded-md transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Add Another Account Link */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('login');
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 mt-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:bg-indigo-50/50 rounded-lg transition-colors cursor-pointer text-left"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                <span>Add another account</span>
              </button>
            </div>

            {/* Footer Actions */}
            <div className="pt-1 mt-1 flex flex-col gap-0.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout(false);
                  onNavigate('login');
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50 font-medium flex items-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out (@{currentUser?.username})</span>
              </button>

              {savedAccounts.length > 1 && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout(true);
                    onNavigate('login');
                  }}
                  className="w-full text-center px-3 py-1 text-[11px] text-slate-400 hover:text-slate-600 hover:underline cursor-pointer"
                >
                  Log out of all accounts
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
