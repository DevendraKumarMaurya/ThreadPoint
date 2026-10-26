import React, { useState, useRef, useEffect } from 'react';
import { User, Bookmark, Settings, Users, LogIn, LogOut, Sparkles } from 'lucide-react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';

export default function UserMenuDropdown({ currentUser, onNavigate }) {
  const { logout, switchUser, demoUsers } = useAuth();
  const availableUsers = (demoUsers && demoUsers.length > 0) ? demoUsers : DEMO_USERS;
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="relative group" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        title="Account menu and personas"
        className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
      >
        <img
          src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
          alt={currentUser?.username || 'User avatar'}
          className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20"
        />
        <span className="hidden xl:inline text-xs font-semibold text-slate-700 max-w-[100px] truncate">
          @{currentUser?.username}
        </span>
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute right-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 ${
          isOpen ? 'block' : 'hidden md:group-hover:block'
        }`}
      >
        <div className="px-3 py-2 border-b border-slate-100 mb-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Signed in as
          </p>
          <p className="text-sm font-bold text-slate-900">@{currentUser?.username}</p>
          <p className="text-xs text-indigo-600 font-mono font-medium">
            {currentUser?.reputation_score} reputation
          </p>
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

        {/* Switch Demo Account */}
        <div className="py-2 border-b border-slate-100">
          <div className="px-3 flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
              <Users className="w-3 h-3 text-indigo-500" />
              Switch Demo Account
            </span>
            <span className="text-[9px] font-mono text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
              1-click
            </span>
          </div>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {availableUsers.map((user) => {
              const isCurrent = currentUser?.id === user.id;
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={async () => {
                    setIsOpen(false);
                    if (!isCurrent) {
                      await switchUser(user);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                    />
                    <span className="truncate">@{user.username}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="font-mono text-[10px] text-slate-400">{user.reputation_score} rep</span>
                    {isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-1 mt-1 flex flex-col gap-0.5">
          <button
            onClick={() => {
              setIsOpen(false);
              onNavigate('login');
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-indigo-600 hover:bg-indigo-50 font-medium flex items-center gap-2 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Demo Page</span>
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              logout();
              onNavigate('login');
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50 font-medium flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
