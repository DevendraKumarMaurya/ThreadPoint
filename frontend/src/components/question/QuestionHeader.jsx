import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Clock,
  Eye,
  CheckCircle2,
  Edit3,
  Trash2,
  Flag,
  Bookmark,
} from 'lucide-react';

export default function QuestionHeader({
  question,
  questionId,
  currentUser,
  isQuestionAuthor,
  isEditingQuestion,
  startEditingQuestion,
  handleDeleteQuestion,
  handleOpenReport,
  isBookmarked,
  toggleBookmarkItem,
  onNavigate,
}) {
  return (
    <div>
      <motion.button
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onNavigate('feed')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-3 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
      </motion.button>

      <h1 className="font-sans font-bold text-2xl md:text-3xl text-slate-900 leading-tight">
        {question.title}
      </h1>

      {/* Metadata Strip */}
      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 font-sans border-b border-slate-200 pb-4">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Asked {new Date(question.created_at).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span>{(question.view_count || question.views || 0).toLocaleString()} views</span>
        </div>
        <div
          onClick={() => onNavigate('profile', question.author_username || question.author_id || question.user_id)}
          className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-600 transition-colors"
        >
          <span className="text-slate-400">Asker:</span>
          <span className="font-semibold text-slate-700">@{question.author_username}</span>
        </div>

        {question.answers && question.answers.some(a => a.is_accepted) && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Solved
          </span>
        )}

        {isQuestionAuthor && !isEditingQuestion && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={startEditingQuestion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={handleDeleteQuestion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Delete</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => handleOpenReport('question', question.id, question.title)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
          title="Flag content for moderation review"
        >
          <Flag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Report</span>
        </button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => currentUser && toggleBookmarkItem(Number(questionId))}
          title={isBookmarked ? 'Remove from bookmarks' : 'Save question for later reference'}
          className={`sm:ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            isBookmarked
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-transparent'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-indigo-600' : ''}`} />
          <span>{isBookmarked ? 'Bookmarked' : 'Save Question'}</span>
        </motion.button>
      </div>
    </div>
  );
}
