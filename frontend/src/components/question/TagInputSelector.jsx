import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

const POPULAR_SUGGESTIONS = ['technology', 'productivity', 'science', 'career', 'design', 'lifestyle', 'learning'];

export default function TagInputSelector({ tags, tagInput, onTagInputChange, onAddTag, onRemoveTag }) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs">
      <label className="block text-sm font-bold text-slate-900 font-sans mb-1">
        Tags & Topics
      </label>
      <p className="text-xs text-slate-500 mb-3">
        Add up to 5 tags to describe what your question is about (Press Enter or space).
      </p>

      <div className="flex flex-wrap items-center gap-2 p-2 border border-slate-200 rounded-xl bg-slate-50/50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
        {tags.map((tag) => (
          <motion.span
            key={tag}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono text-xs font-semibold border border-indigo-200"
          >
            #{tag}
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="hover:text-indigo-900 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.span>
        ))}
        {tags.length < 5 && (
          <input
            type="text"
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
                e.preventDefault();
                onAddTag(tagInput);
              }
            }}
            placeholder={tags.length === 0 ? 'e.g. technology, productivity, design' : 'add another tag...'}
            className="flex-1 bg-transparent border-0 outline-none text-xs font-mono text-slate-900 placeholder:text-slate-400 min-w-[120px] p-1"
          />
        )}
      </div>

      {/* Popular Tag suggestions */}
      <div className="flex items-center gap-2 mt-3 flex-wrap text-xs text-slate-500">
        <span className="font-mono text-[11px] text-slate-400">Popular:</span>
        {POPULAR_SUGGESTIONS.map((t) => (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            key={t}
            onClick={() => onAddTag(t)}
            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] transition-colors cursor-pointer"
          >
            +{t}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
