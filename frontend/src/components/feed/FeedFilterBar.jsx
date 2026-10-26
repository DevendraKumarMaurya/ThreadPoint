import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Flame, Clock, Tag, Trophy, ArrowUpDown, PlusCircle } from 'lucide-react';

const FEED_TABS = [
  { id: 'interesting', label: 'Interesting', icon: Sparkles },
  { id: 'hot', label: 'Hot', icon: Flame, isHot: true },
  { id: 'watched', label: 'Watched Tags', icon: Tag },
  { id: 'newest', label: 'Newest', icon: Clock },
  { id: 'votes', label: 'Top Score', icon: Trophy },
  { id: 'unanswered', label: 'Unanswered' },
];

export default function FeedFilterBar({ selectedSort, onSortChange, onNavigateAsk }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-6 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
      {/* Tab Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto relative">
        {FEED_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedSort === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSortChange(tab.id)}
              className={`relative px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-150 flex items-center gap-1.5 shrink-0 select-none focus-visible:outline-2 focus-visible:outline-indigo-500 cursor-pointer ${
                isActive
                  ? 'text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeFeedTab"
                  className="absolute inset-0 bg-indigo-600 rounded-xl shadow-xs"
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 30,
                  }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {Icon && (
                  <Icon
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors duration-150 ${
                      tab.isHot
                        ? isActive
                          ? 'text-amber-300 fill-amber-300'
                          : 'text-orange-500 fill-orange-500'
                        : isActive
                        ? 'text-white'
                        : 'text-slate-400'
                    }`}
                  />
                )}
                <span>{tab.label}</span>
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Sort & Ask Button */}
      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
        <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
          <button
            onClick={() => onSortChange(selectedSort === 'votes' ? 'newest' : 'votes')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedSort === 'votes'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 shadow-xs hover:text-indigo-600'
            }`}
          >
            <ArrowUpDown className={`w-3.5 h-3.5 ${selectedSort === 'votes' ? 'text-white' : 'text-indigo-600'}`} />
            <span>{selectedSort === 'votes' ? 'Sorted by score' : 'Sort by score'}</span>
          </button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNavigateAsk}
          className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm hover:bg-indigo-700 shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Ask Question</span>
        </motion.button>
      </div>
    </div>
  );
}
