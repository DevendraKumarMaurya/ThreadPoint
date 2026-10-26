import React from 'react';
import { motion } from 'motion/react';

export default function ProfileQuestionsTab({ questions = [], onNavigate }) {
  return (
    <motion.div
      key="profile-questions"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="divide-y divide-slate-100"
    >
      {questions.length === 0 ? (
        <p className="text-slate-400 text-xs py-8 text-center font-medium">No questions posted yet.</p>
      ) : (
        questions.map(q => (
          <motion.div
            key={q.id}
            whileHover={{ x: 2 }}
            transition={{ duration: 0.1 }}
            onClick={() => onNavigate('question', q.id)}
            className="py-3.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
          >
            <span className="text-sm font-semibold text-slate-900 hover:text-indigo-600">
              {q.title}
            </span>
            <span className="font-mono text-xs text-slate-400 shrink-0 ml-3">
              {new Date(q.created_at).toLocaleDateString()}
            </span>
          </motion.div>
        ))
      )}
    </motion.div>
  );
}
