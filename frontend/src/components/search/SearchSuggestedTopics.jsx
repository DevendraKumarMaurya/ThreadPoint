import React from 'react';
import { Tag } from 'lucide-react';
import { motion } from 'motion/react';

const SUGGESTED_TAGS = ['postgresql', 'triggers', 'indexing', 'full-text-search', 'concurrency'];

const TOP_CONTRIBUTORS = [
  { username: 'carol_dba', title: 'Senior Backend Architect', rep: 61 },
  { username: 'alice_dev', title: 'Distributed Systems & PostgreSQL', rep: 43 },
  { username: 'david_fullstack', title: 'TypeScript & Frontend Performance', rep: 33 },
  { username: 'bob_sql', title: 'Full-stack PERN Engineer', rep: 28 },
];

export default function SearchSuggestedTopics({ onSelectTag, onSelectUser }) {
  return (
    <div className="space-y-5">
      {/* Suggested Topics */}
      <div>
        <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          Suggested Topics
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_TAGS.map((tag) => (
            <motion.button
              key={tag}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectTag(tag)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-xs font-mono font-medium text-slate-700 transition-colors cursor-pointer"
            >
              <Tag className="w-3 h-3 text-slate-400" />
              #{tag}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Top Contributors */}
      <div>
        <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          Top Contributors
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TOP_CONTRIBUTORS.map((user) => (
            <motion.div
              key={user.username}
              whileHover={{ x: 2 }}
              transition={{ duration: 0.1 }}
              onClick={() => onSelectUser(user.username)}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 truncate block">
                    @{user.username}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate block">
                    {user.title}
                  </span>
                </div>
              </div>
              <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">
                {user.rep} rep
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
