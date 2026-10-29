import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send } from 'lucide-react';
import FormattedContent from './FormattedContent';

export default function AnswerComposer({
  answerBody,
  setAnswerBody,
  answerTab,
  setAnswerTab,
  submittingAnswer,
  currentUser,
  handlePostAnswer,
}) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-xs mt-4">
      <h3 className="font-sans font-bold text-lg sm:text-xl text-slate-900 mb-1 sm:mb-2">
        Your Answer
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Provide a clear, helpful answer with explanations or references to support the community.
      </p>

      {/* Editor Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAnswerTab('write')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              answerTab === 'write' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Write (Markdown)
          </button>
          <button
            type="button"
            onClick={() => setAnswerTab('preview')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              answerTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Preview
          </button>
        </div>
        <span className="text-[11px] text-slate-400 font-sans">
          Markdown formatting supported
        </span>
      </div>

      <AnimatePresence mode="wait">
        {answerTab === 'write' ? (
          <motion.div
            key="editor-write"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <textarea
              rows={8}
              value={answerBody}
              onChange={(e) => setAnswerBody(e.target.value)}
              placeholder="Explain your thoughts, solution, or experience in detail..."
              className="w-full p-4 border border-slate-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
            />
          </motion.div>
        ) : (
          <motion.div
            key="editor-preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="p-4 border border-slate-200 rounded-xl bg-slate-50 min-h-[160px]"
          >
            {answerBody.trim() ? (
              <FormattedContent content={answerBody} contentId="preview-ans" />
            ) : (
              <span className="text-xs text-slate-400 italic">Nothing to preview yet...</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs text-slate-400">
          Posting as <strong>@{currentUser?.username || 'Guest'}</strong>
        </span>
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handlePostAnswer}
          disabled={submittingAnswer || !answerBody.trim()}
          className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          <span>{submittingAnswer ? 'Posting...' : 'Post Your Answer'}</span>
        </motion.button>
      </div>
    </div>
  );
}
