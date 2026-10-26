import React from 'react';
import { motion } from 'motion/react';
import {
  ChevronUp,
  ChevronDown,
  Edit3,
} from 'lucide-react';
import FormattedContent from './FormattedContent';
import CommentSection from './CommentSection';

export default function QuestionMainCard({
  question,
  currentUser,
  userVotes,
  isEditingQuestion,
  setIsEditingQuestion,
  editTitle,
  setEditTitle,
  editBody,
  setEditBody,
  editTags,
  setEditTags,
  editQuestionTab,
  setEditQuestionTab,
  savingQuestion,
  handleSaveQuestionEdit,
  handleVote,
  comments = [],
  onPostComment,
  openAuthModal,
  onNavigate,
}) {
  if (isEditingQuestion) {
    return (
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-indigo-200 shadow-md flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-indigo-600" /> Edit Question Details
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditQuestionTab('write')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                editQuestionTab === 'write' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setEditQuestionTab('preview')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                editQuestionTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Title</label>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            placeholder="e.g. postgresql, react, node"
            className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Body (Markdown)</label>
          {editQuestionTab === 'write' ? (
            <textarea
              rows={10}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full p-4 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
            />
          ) : (
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 min-h-[220px]">
              <FormattedContent content={editBody} contentId="preview-edit-q" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsEditingQuestion(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={savingQuestion}
            onClick={handleSaveQuestionEdit}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {savingQuestion ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 sm:gap-6 items-start">
      {/* Vote Gutter */}
      <div className="flex flex-col items-center gap-1.5 sm:gap-2 shrink-0">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => handleVote('question', question.id, 1)}
          aria-label="Upvote question"
          className={`p-1.5 sm:p-2 rounded-xl transition-colors border cursor-pointer ${
            userVotes[`question-${question.id}`] === 1
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-500 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600'
          }`}
        >
          <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
        </motion.button>
        <motion.span
          key={question.net_votes}
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.15 }}
          className="font-mono font-bold text-base sm:text-lg text-slate-900"
        >
          {question.net_votes > 0 ? `+${question.net_votes}` : question.net_votes}
        </motion.span>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => handleVote('question', question.id, -1)}
          aria-label="Downvote question"
          className={`p-1.5 sm:p-2 rounded-xl transition-colors border cursor-pointer ${
            userVotes[`question-${question.id}`] === -1
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white text-slate-500 border-slate-200 hover:bg-red-50 hover:text-red-600'
          }`}
        >
          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
        </motion.button>
      </div>

      {/* Question Body */}
      <div className="flex-1 min-w-0 bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-xs">
        <FormattedContent content={question.body} contentId={`q-${question.id}`} />

        {/* Tag Chips */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-100">
          {(question.tags || []).map((tagItem) => {
            const tagName = typeof tagItem === 'object' ? tagItem.name : tagItem;
            return (
              <motion.button
                key={tagName}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onNavigate('feed', { tag: tagName })}
                className="rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-mono text-xs px-2.5 py-1 transition-colors border border-transparent hover:border-indigo-200 cursor-pointer"
              >
                #{tagName}
              </motion.button>
            );
          })}
        </div>

        {/* Author Footprint */}
        <div className="mt-6 flex justify-end">
          <div
            onClick={() => onNavigate('profile', question.author_username || question.author_id || question.user_id)}
            className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-indigo-50 transition-colors"
          >
            <img
              src={question.author_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${question.author_username}`}
              alt=""
              className="w-10 h-10 rounded-full object-cover ring-1 ring-indigo-200 shrink-0"
            />
            <div>
              <span className="text-xs text-slate-400 block font-sans">Inquired by</span>
              <span className="text-sm font-bold text-slate-900">@{question.author_username}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-xs text-indigo-600 font-semibold">
                  {question.author_reputation} rep
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {new Date(question.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Question Comments */}
        <CommentSection
          targetType="question"
          targetId={question.id}
          comments={comments}
          currentUser={currentUser}
          openAuthModal={openAuthModal}
          onPostComment={onPostComment}
        />
      </div>
    </div>
  );
}
