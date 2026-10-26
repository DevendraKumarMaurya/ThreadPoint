import React from 'react';
import { motion } from 'motion/react';
import { Award } from 'lucide-react';

export default function ProfileBadgesTab({ userBadges = [], badgesLoading = false }) {
  return (
    <motion.div
      key="profile-badges"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
    >
      {badgesLoading ? (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-medium">Evaluating and loading badges...</p>
        </div>
      ) : userBadges.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-600">No badges earned yet</p>
          <p className="text-slate-400 mt-0.5 max-w-sm mx-auto">
            Badges are awarded automatically for asking questions, posting verified solutions, and gaining community reputation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {userBadges.map(badge => {
            const isGold = badge.tier === 'gold';
            const isSilver = badge.tier === 'silver';

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isGold
                    ? 'bg-amber-50/50 border-amber-200/90 shadow-xs'
                    : isSilver
                    ? 'bg-slate-50 border-slate-300/80 shadow-xs'
                    : 'bg-orange-50/40 border-orange-200/80 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isGold
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : isSilver
                          ? 'bg-slate-200 text-slate-700 border border-slate-300'
                          : 'bg-orange-100 text-orange-800 border border-orange-300'
                      }`}
                    >
                      {badge.tier || 'bronze'}
                    </span>
                    <Award
                      className={`w-4 h-4 ${
                        isGold ? 'text-amber-600' : isSilver ? 'text-slate-500' : 'text-orange-600'
                      }`}
                    />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 leading-snug">
                    {badge.name}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
                {badge.awarded_at && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] font-mono text-slate-400">
                    Awarded {new Date(badge.awarded_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
