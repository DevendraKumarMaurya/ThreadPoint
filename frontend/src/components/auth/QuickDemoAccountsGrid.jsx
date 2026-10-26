import React from 'react';
import { Users, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function QuickDemoAccountsGrid({ availableUsers, quickLoginId, loading, onQuickDemo }) {
  return (
    <div className="mt-6 bg-slate-50 border border-slate-200/90 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          Demo Accounts
        </span>
        <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Zap className="w-3 h-3 fill-emerald-600 text-emerald-600" />
          1-Click Login
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {availableUsers.slice(0, 4).map((user) => (
          <motion.button
            key={user.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            disabled={quickLoginId !== null || loading}
            onClick={() => onQuickDemo(user)}
            className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group shadow-xs disabled:opacity-60 cursor-pointer"
          >
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200 group-hover:ring-indigo-400"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="block text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                  @{user.username}
                </span>
                <span className="block text-[10px] font-mono text-indigo-600 font-medium shrink-0 ml-1">
                  {user.reputation_score} rep
                </span>
              </div>
              <span className="block text-[10px] text-slate-400 truncate">
                {quickLoginId === user.id ? 'Signing in...' : user.bio || 'Contributor'}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
