import React from 'react';
import { motion } from 'motion/react';
import { Users } from 'lucide-react';

export default function ProfileUsersListTab({
  users = [],
  loading = false,
  emptyTitle = 'No users found',
  emptySubtitle = 'When users appear here, they will be listed.',
  tabKey = 'users-list',
  onNavigate,
}) {
  return (
    <motion.div
      key={tabKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
    >
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-medium">Loading user connections...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-600">{emptyTitle}</p>
          <p className="text-slate-400 mt-0.5">{emptySubtitle}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {users.map(u => (
            <motion.div
              key={u.id}
              whileHover={{ y: -1 }}
              onClick={() => onNavigate('profile', u.username)}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-slate-50/80 transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 truncate">
                      @{u.username}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {u.reputation_score?.toLocaleString() || 1} rep
                    </span>
                  </div>
                  {u.bio && (
                    <p className="text-xs text-slate-500 truncate max-w-[220px] mt-0.5">
                      {u.bio}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
                View
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
