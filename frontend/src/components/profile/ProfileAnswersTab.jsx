import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

export default function ProfileAnswersTab({ answers = [], onNavigate }) {
  return (
    <motion.div
      key="profile-answers"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="divide-y divide-slate-100"
    >
      {answers.length === 0 ? (
        <p className="text-slate-400 text-xs py-8 text-center font-medium">No answers provided yet.</p>
      ) : (
        answers.map(a => (
          <motion.div
            key={a.id}
            whileHover={{ x: 2 }}
            transition={{ duration: 0.1 }}
            onClick={() => onNavigate('question', a.question_id)}
            className="py-4 hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {a.is_accepted && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ACCEPTED (+15 REP)
                </span>
              )}
              <span className="text-xs font-semibold text-slate-500">
                Answer on: {a.question_title}
              </span>
            </div>
            <p className="text-xs text-slate-700 line-clamp-2 mt-1 leading-relaxed">
              {a.body}
            </p>
          </motion.div>
        ))
      )}
    </motion.div>
  );
}
