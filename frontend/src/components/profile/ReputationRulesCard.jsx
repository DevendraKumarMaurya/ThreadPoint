import React from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';

export default function ReputationRulesCard() {
  return (
    <div className="bg-linear-to-r from-indigo-50/70 via-slate-50 to-emerald-50/50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 text-xs">
      <div className="flex items-center gap-2 mb-2 font-bold text-slate-800">
        <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
        <span>How Contributor Reputation is Earned</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center font-mono">
        <motion.div whileHover={{ y: -1 }} className="bg-white/80 p-2 rounded-xl border border-slate-200/60 shadow-2xs">
          <span className="block text-emerald-600 font-extrabold text-sm">+10</span>
          <span className="text-[10px] text-slate-500 font-sans">Question Upvote</span>
        </motion.div>
        <motion.div whileHover={{ y: -1 }} className="bg-white/80 p-2 rounded-xl border border-slate-200/60 shadow-2xs">
          <span className="block text-red-500 font-extrabold text-sm">-2</span>
          <span className="text-[10px] text-slate-500 font-sans">Question Downvote</span>
        </motion.div>
        <motion.div whileHover={{ y: -1 }} className="bg-white/80 p-2 rounded-xl border border-slate-200/60 shadow-2xs">
          <span className="block text-emerald-600 font-extrabold text-sm">+10</span>
          <span className="text-[10px] text-slate-500 font-sans">Answer Upvote</span>
        </motion.div>
        <motion.div whileHover={{ y: -1 }} className="bg-white/80 p-2 rounded-xl border border-slate-200/60 shadow-2xs">
          <span className="block text-red-500 font-extrabold text-sm">-2</span>
          <span className="text-[10px] text-slate-500 font-sans">Answer Downvote</span>
        </motion.div>
        <motion.div whileHover={{ y: -1 }} className="bg-white/80 p-2 rounded-xl border border-slate-200/60 shadow-2xs">
          <span className="block text-emerald-600 font-extrabold text-sm">+15</span>
          <span className="text-[10px] text-slate-500 font-sans">Solution Accepted</span>
        </motion.div>
        <motion.div whileHover={{ y: -1 }} className="bg-white/80 p-2 rounded-xl border border-slate-200/60 shadow-2xs">
          <span className="block text-indigo-600 font-extrabold text-sm">+2</span>
          <span className="text-[10px] text-slate-500 font-sans">Accepting Solution</span>
        </motion.div>
      </div>
    </div>
  );
}
