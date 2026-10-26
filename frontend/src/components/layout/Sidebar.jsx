import React from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Flame,
  HelpCircle,
  Tag,
  Clock,
  User,
  Bookmark,
  Trophy,
  Settings,
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function SidebarInner({ onNavigate, onItemClick, layoutPrefix = 'desktop' }) {
  const { currentUser, bookmarkedIds, openAuthModal } = useAuth();
  const bookmarkCount = bookmarkedIds ? bookmarkedIds.size : 0;
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const pathname = location.pathname;
  const sortParam = searchParams.get('sort');

  const navItems = [
    { id: 'feed', sort: 'interesting', label: 'Home / Feed', icon: Layers },
    { id: 'feed-hot', sort: 'hot', label: 'Hot & Trending', icon: Flame, isHot: true },
    { id: 'feed-all', sort: 'newest', label: 'Questions', icon: HelpCircle },
    { id: 'tags', label: 'Tags & Topics', icon: Tag },
    { id: 'feed-unanswered', sort: 'unanswered', label: 'Unanswered', icon: Clock },
  ];

  const personalItems = [
    {
      id: 'my-activity',
      label: 'My Activity',
      icon: User,
      action: () => {
        onNavigate('profile', currentUser?.username || currentUser?.id);
        onItemClick?.();
      },
      isActive: Boolean(currentUser && (pathname === `/users/${currentUser.username}` || pathname === `/users/${currentUser.id}` || pathname === '/profile'))
    },
    {
      id: 'bookmarks',
      label: 'Bookmarks',
      icon: Bookmark,
      action: () => {
        onNavigate('bookmarks');
        onItemClick?.();
      },
      isActive: pathname.startsWith('/bookmarks'),
      badge: bookmarkCount > 0 ? `${bookmarkCount} saved` : 'Saved'
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      icon: Trophy,
      action: () => {
        onNavigate('leaderboard');
        onItemClick?.();
      },
      isActive: pathname.startsWith('/leaderboard')
    },
    {
      id: 'features',
      label: 'Features & Guide',
      icon: Sparkles,
      action: () => {
        onNavigate('features');
        onItemClick?.();
      },
      isActive: pathname.startsWith('/features') || pathname.startsWith('/guide') || pathname.startsWith('/about'),
      badge: 'Docs'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      action: () => {
        onNavigate('settings');
        onItemClick?.();
      },
      isActive: pathname.startsWith('/settings')
    },
  ];

  const isItemActive = (item) => {
    if (item.id === 'tags') return pathname.startsWith('/tags');
    if (pathname === '/' || pathname === '/questions' || pathname === '/feed') {
      if (item.id === 'feed-hot') return sortParam === 'hot';
      if (item.id === 'feed-unanswered') return sortParam === 'unanswered';
      if (item.id === 'feed-all') return sortParam === 'newest' || sortParam === 'votes';
      if (item.id === 'feed') return !sortParam || sortParam === 'interesting';
      if (item.sort) return sortParam === item.sort;
    }
    return false;
  };

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex flex-col gap-5">
        {/* Navigation Section */}
        <div>
          <div className="px-3 pb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Navigation
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);

              return (
                <motion.button
                  key={item.id}
                  whileHover={{ x: active ? 0 : 3 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  onClick={() => {
                    if (item.id === 'tags') {
                      onNavigate('tags');
                    } else {
                      onNavigate('feed', { sort: item.sort });
                    }
                    onItemClick?.();
                  }}
                  className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-colors text-left select-none focus-visible:outline-2 focus-visible:outline-indigo-500 ${
                    active
                      ? 'text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 font-medium'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId={`activeSidebarIndicator-${layoutPrefix}`}
                      className="absolute inset-0 bg-indigo-600 rounded-xl shadow-xs shadow-indigo-600/20"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 32,
                      }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 transition-colors duration-150 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.isHot && (
                    <span className="relative z-10">
                      <motion.div
                        animate={active ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                        transition={active ? { repeat: Infinity, duration: 2.2, ease: 'easeInOut' } : { duration: 0.2 }}
                      >
                        <Flame
                          className={`w-3.5 h-3.5 transition-colors duration-150 ${
                            active
                              ? 'text-amber-300 fill-amber-300'
                              : 'text-orange-500 fill-orange-500'
                          }`}
                        />
                      </motion.div>
                    </span>
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Personal Section */}
        <div>
          <div className="px-3 pb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Personal
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            {personalItems.map((item) => {
              const Icon = item.icon;
              const active = item.isActive;

              return (
                <motion.button
                  key={item.id}
                  whileHover={{ x: active ? 0 : 3 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  onClick={() => {
                    if (item.action) item.action();
                    else {
                      onNavigate(item.id);
                      onItemClick?.();
                    }
                  }}
                  className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-colors text-left select-none focus-visible:outline-2 focus-visible:outline-indigo-500 ${
                    active
                      ? 'text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 font-medium'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId={`activeSidebarIndicator-${layoutPrefix}`}
                      className="absolute inset-0 bg-indigo-600 rounded-xl shadow-xs shadow-indigo-600/20"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 32,
                      }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 transition-colors duration-150 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="relative z-10">
                      <motion.span
                        key={item.badge}
                        initial={{ scale: 0.85 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.15 }}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md transition-colors ${
                          active
                            ? 'bg-indigo-500/60 text-indigo-50 border border-indigo-400/30'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </motion.span>
                    </span>
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Contributor Profile / Switch Demo Card */}
      {currentUser && (
        <div className="pt-3 border-t border-slate-200/80 mt-auto">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <img
                src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={currentUser.username}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 truncate block">
                    @{currentUser.username}
                  </span>
                  <span className="text-[10px] font-mono text-indigo-600 font-semibold shrink-0">
                    {currentUser.reputation_score} rep
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    openAuthModal();
                    onItemClick?.();
                  }}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium block truncate text-left cursor-pointer hover:underline"
                >
                  Switch Demo Account →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ onNavigate, isMobileOpen = false, onCloseMobile }) {
  return (
    <>
      {/* Desktop Static Rail (>= 1024px) */}
      <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 bg-slate-50 border-r border-slate-200 z-30 flex-col justify-between py-6 px-3 overflow-y-auto">
        <SidebarInner onNavigate={onNavigate} layoutPrefix="desktop" />
      </aside>

      {/* Mobile Animated Slide-over Drawer (< 1024px) */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 lg:hidden"
            />

            {/* Slide-out Drawer */}
            <motion.aside
              key="mobile-drawer-panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              className="fixed top-0 bottom-0 left-0 w-72 sm:w-80 bg-slate-50 shadow-2xl z-50 lg:hidden flex flex-col justify-between py-5 px-3 overflow-y-auto border-r border-slate-200"
            >
              <div>
                {/* Mobile Drawer Top Brand Bar */}
                <div className="flex items-center justify-between px-2 pb-4 mb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 3 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-mono font-extrabold text-base shadow-xs"
                    >
                      T
                    </motion.div>
                    <div>
                      <span className="font-bold text-base text-slate-900">ThreadPoint</span>
                      <span className="block text-[10px] text-slate-400 font-mono -mt-0.5">Knowledge Base</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={onCloseMobile}
                    aria-label="Close menu"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                <SidebarInner onNavigate={onNavigate} onItemClick={onCloseMobile} layoutPrefix="mobile" />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
