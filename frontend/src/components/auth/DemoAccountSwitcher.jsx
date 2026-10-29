import React from 'react';
import { motion } from 'motion/react';

export default function DemoAccountSwitcher({ availableUsers, currentUserId, onSelectUser }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Select a contributor profile to switch:
        </p>
        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          Password: <strong className="text-slate-800">password123</strong>
        </span>
      </div>
      {availableUsers.map((user) => {
        const isCurrent = currentUserId === user.id;
        return (
          <motion.div
            key={user.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectUser(user)}
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
              isCurrent
                ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
              />
              <div>
                <p className="text-sm font-bold text-slate-900">@{user.username}</p>
                <p className="text-xs text-slate-500 line-clamp-1">{user.bio}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold text-indigo-600">
                {user.reputation_score} rep
              </span>
              {isCurrent && (
                <span className="block text-[10px] text-emerald-600 font-bold uppercase mt-0.5">
                  Active
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
