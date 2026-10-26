import React from 'react';
import { motion } from 'motion/react';

export default function SearchQuestionItem({ question, onSelect }) {
  const tags = question.tags || [];

  return (
    <motion.div
      whileHover={{ x: 2 }}
      transition={{ duration: 0.12 }}
      onClick={onSelect}
      className="flex items-start justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-all group"
    >
      <div className="flex-1 min-w-0 pr-4">
        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {question.title}
        </h4>
        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
          {question.body}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {question.has_accepted && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold font-mono">
              SOLVED
            </span>
          )}
          <span className="text-[11px] font-mono text-slate-400">
            by @{question.author_username}
          </span>
          {tags.slice(0, 3).map((t) => {
            const tagName = typeof t === 'object' ? t.name : t;
            return (
              <span key={tagName} className="text-[11px] font-mono text-slate-400">
                #{tagName}
              </span>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col items-end shrink-0 text-right">
        <span className="font-mono text-xs font-bold text-indigo-600">
          {question.net_votes > 0 ? `+${question.net_votes}` : question.net_votes}
        </span>
        <span className="text-[10px] text-slate-400 mt-1">
          {question.answer_count} answers
        </span>
      </div>
    </motion.div>
  );
}
