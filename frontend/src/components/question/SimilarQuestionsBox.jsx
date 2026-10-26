import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function SimilarQuestionsBox({ questions, onSelectQuestion }) {
  if (!questions || questions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl overflow-hidden"
      >
        <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wide font-mono mb-1.5">
          Possible existing duplicate questions found (Full-Text GIN Index):
        </p>
        <div className="space-y-1">
          {questions.map((sq) => (
            <div
              key={sq.id}
              onClick={() => onSelectQuestion(sq.id)}
              className="text-xs text-indigo-700 hover:underline cursor-pointer flex items-center justify-between"
            >
              <span className="line-clamp-1">{sq.title}</span>
              <span className="font-mono text-[10px] text-slate-400 shrink-0 ml-2">
                {sq.answer_count} answers
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
