import React from 'react';
import { Trophy, Award } from 'lucide-react';
import { motion } from 'motion/react';

const TOP_CONTRIBUTORS = [
  { name: 'carol_dba', rep: '50', rank: '#1', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', tier: 'Top 1%' },
  { name: 'david_fullstack', rep: '30', rank: '#2', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', tier: 'Top 5%' },
  { name: 'bob_sql', rep: '25', rank: '#3', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', tier: 'Top 10%' },
];

export default function TopContributorsRail({ onNavigateUser, onNavigateLeaderboard }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm text-slate-900 font-sans flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          Top Recognized Contributors
        </h3>
        <button
          onClick={onNavigateLeaderboard}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
        >
          Leaderboard
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {TOP_CONTRIBUTORS.map((c) => (
          <motion.div
            key={c.name}
            whileHover={{ x: 2 }}
            transition={{ duration: 0.12 }}
            onClick={() => onNavigateUser(c.name)}
            className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-slate-400 w-5">
                {c.rank}
              </span>
              <img src={c.avatar} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200" />
              <div>
                <span className="text-xs font-bold text-slate-800">@{c.name}</span>
                <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                  <Award className="w-3 h-3 text-amber-500" /> {c.tier}
                </span>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-indigo-600">
              {c.rep} rep
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
