import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Trophy, Medal, Award, CheckCircle2 } from 'lucide-react';
import { fetchLeaderboard } from '../api/client';

export default function LeaderboardPage({ onNavigate: propOnNavigate }) {
  const navigate = useNavigate();
  const onNavigate = propOnNavigate || ((view, opts) => {
    if (view === 'profile') navigate(`/users/${opts}`);
    else navigate(`/${view}`);
  });

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard()
      .then(data => setLeaderboard((data.leaderboard || []).slice(0, 10)))
      .catch(err => console.error('Leaderboard error:', err))
      .finally(() => setLoading(false));
  }, []);

  const getTier = (rep) => {
    if (rep >= 2000) return { label: 'Diamond Contributor', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
    if (rep >= 1000) return { label: 'Gold Contributor', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (rep >= 500) return { label: 'Silver Contributor', color: 'bg-slate-200 text-slate-800 border-slate-300' };
    return { label: 'Bronze Contributor', color: 'bg-orange-100 text-orange-800 border-orange-200' };
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-16">
      <div>
        <h1 className="font-sans font-bold text-2xl md:text-3xl text-slate-900 flex items-center gap-2.5">
          <Trophy className="w-8 h-8 text-amber-500" />
          Top 10 Leaderboard
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Top 10 engineers ranked by reputation earned through answers, accepted solutions, and community contributions.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-600">Loading contributor leaderboard...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[620px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  <th className="py-3 px-3.5 sm:px-6 w-16">Rank</th>
                  <th className="py-3 px-3.5 sm:px-6">Contributor</th>
                  <th className="py-3 px-3.5 sm:px-6 text-center">Questions</th>
                  <th className="py-3 px-3.5 sm:px-6 text-center">Answers</th>
                  <th className="py-3 px-3.5 sm:px-6 text-center">Solutions Verified</th>
                  <th className="py-3 px-3.5 sm:px-6 text-right">Reputation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {leaderboard.map((user, idx) => {
                  const rank = idx + 1;
                  const tier = getTier(user.reputation_score);

                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.16, delay: Math.min(idx * 0.025, 0.3) }}
                      onClick={() => onNavigate('profile', user.username || user.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 font-mono font-bold text-sm whitespace-nowrap">
                        {rank === 1 && (
                          <span className="inline-flex items-center gap-1.5 text-amber-500 font-bold">
                            <Trophy className="w-4 h-4 fill-amber-400 text-amber-500" /> #1
                          </span>
                        )}
                        {rank === 2 && (
                          <span className="inline-flex items-center gap-1.5 text-slate-500 font-bold">
                            <Medal className="w-4 h-4 text-slate-400" /> #2
                          </span>
                        )}
                        {rank === 3 && (
                          <span className="inline-flex items-center gap-1.5 text-amber-700 font-bold">
                            <Award className="w-4 h-4 text-amber-700" /> #3
                          </span>
                        )}
                        {rank > 3 && <span className="text-slate-400">#{rank}</span>}
                      </td>

                      <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                            alt=""
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              @{user.username}
                            </span>
                            <span className={`block text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border mt-0.5 w-fit ${tier.color}`}>
                              {tier.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 text-center font-mono text-slate-600 whitespace-nowrap">
                        {user.question_count || 0}
                      </td>

                      <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 text-center font-mono text-slate-600 whitespace-nowrap">
                        {user.answer_count || 0}
                      </td>

                      <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg text-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {user.accepted_count || 0}
                        </span>
                      </td>

                      <td className="py-3.5 sm:py-4 px-3.5 sm:px-6 text-right font-mono font-bold text-indigo-600 text-base whitespace-nowrap">
                        {user.reputation_score.toLocaleString()}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
