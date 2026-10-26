import React from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function SearchUserItem({ user, onSelect }) {
  return (
    <motion.div
      whileHover={{ x: 2 }}
      transition={{ duration: 0.12 }}
      onClick={onSelect}
      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-indigo-200 cursor-pointer transition-all group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
          alt=""
          className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
              @{user.username}
            </span>
            <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              {user.reputation_score} rep
            </span>
          </div>
          {user.bio ? (
            <p className="text-xs text-slate-500 truncate mt-0.5 max-w-[220px]">
              {user.bio}
            </p>
          ) : (
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              {user.follower_count || 0} followers · {user.question_count || 0} questions
            </p>
          )}
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
    </motion.div>
  );
}
