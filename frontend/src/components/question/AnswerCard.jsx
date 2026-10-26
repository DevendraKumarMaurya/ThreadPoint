import React from 'react';
import { motion } from 'motion/react';
import {
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Check,
  Sparkles,
  ShieldCheck,
  ThumbsUp,
  Edit3,
  Trash2,
  Flag,
  Award,
} from 'lucide-react';
import FormattedContent from './FormattedContent';
import CommentSection from './CommentSection';

export default function AnswerCard({
  answer,
  question,
  currentUser,
  userVotes,
  isQuestionAuthor,
  editingAnswerId,
  setEditingAnswerId,
  editAnswerText,
  setEditAnswerText,
  savingAnswer,
  startEditingAnswer,
  handleSaveAnswerEdit,
  handleDeleteAnswer,
  handleVote,
  handleAcceptAnswer,
  handleOpenReport,
  comments = [],
  onPostComment,
  openAuthModal,
  onNavigate,
}) {
  const isAccepted = answer.is_accepted;
  const isAnswerAuthor = Boolean(
    currentUser?.id && Number(currentUser.id) === Number(answer.author_id || answer.user_id)
  );

  return (
    <div
      className={`rounded-2xl transition-all border ${
        isAccepted
          ? 'border-emerald-300 bg-white shadow-md ring-2 ring-emerald-500/10'
          : 'border-slate-200 bg-white shadow-xs'
      }`}
    >
      {/* Accepted Answer Banner */}
      {isAccepted && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-emerald-600 text-white px-6 py-3 rounded-t-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2 font-sans font-bold text-sm tracking-wide">
            <CheckCircle2 className="w-5 h-5 fill-white text-emerald-600 shrink-0" />
            <span>ACCEPTED SOLUTION</span>
            <span className="text-emerald-200 font-normal text-xs hidden sm:inline">
              — Marked by @{question.author_username}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-emerald-700/60 px-3 py-1 rounded-full text-emerald-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>+15 Solver Rep · +2 Asker Rep</span>
          </div>
        </motion.div>
      )}

      {/* Quality badge bar for accepted answer */}
      {isAccepted && (
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-2 flex items-center justify-between text-xs font-sans text-emerald-800 flex-wrap gap-2">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Definitive Community Solution
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" /> Verified Solution
          </span>
          <span className="font-mono text-[11px]">Peer Reviewed</span>
        </div>
      )}

      <div className="p-4 sm:p-6 md:p-8 flex gap-2.5 sm:gap-6 items-start">
        {/* Answer Vote Gutter */}
        <div className="flex flex-col items-center gap-1.5 sm:gap-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => handleVote('answer', answer.id, 1)}
            aria-label="Upvote answer"
            className={`p-1.5 sm:p-2 rounded-xl transition-colors border cursor-pointer ${
              userVotes[`answer-${answer.id}`] === 1
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600'
            }`}
          >
            <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </motion.button>

          <motion.span
            key={answer.net_votes}
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.15 }}
            className="font-mono font-bold text-sm sm:text-base text-slate-900"
          >
            {answer.net_votes > 0 ? `+${answer.net_votes}` : answer.net_votes}
          </motion.span>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => handleVote('answer', answer.id, -1)}
            aria-label="Downvote answer"
            className={`p-1.5 sm:p-2 rounded-xl transition-colors border cursor-pointer ${
              userVotes[`answer-${answer.id}`] === -1
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </motion.button>

          {/* Accept Answer Button (Question Author Only) */}
          {isQuestionAuthor && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleAcceptAnswer(answer.id)}
              title={isAccepted ? 'Click to unaccept solution' : 'Mark as Accepted Solution'}
              className={`mt-1.5 sm:mt-2 p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
                isAccepted
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                  : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200'
              }`}
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
            </motion.button>
          )}
        </div>

        {/* Answer Content */}
        <div className="flex-1 min-w-0">
          {editingAnswerId === answer.id ? (
            <div className="p-4 rounded-xl border border-indigo-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-indigo-600" /> Edit Your Answer
                </span>
              </div>
              <textarea
                rows={6}
                value={editAnswerText}
                onChange={(e) => setEditAnswerText(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs md:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAnswerId(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingAnswer}
                  onClick={() => handleSaveAnswerEdit(answer.id)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingAnswer ? 'Saving...' : 'Save Answer'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <FormattedContent content={answer.body} contentId={`ans-${answer.id}`} />

              {/* Action buttons and Contributor Signature Box */}
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {isAnswerAuthor && (
                    <>
                      <button
                        type="button"
                        onClick={() => startEditingAnswer(answer)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-400" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAnswer(answer.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-400" /> Delete
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenReport(
                        'answer',
                        answer.id,
                        `Answer #${answer.id} by @${answer.author_username}`
                      )
                    }
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                    title="Flag answer for moderation review"
                  >
                    <Flag className="w-3.5 h-3.5" /> Report
                  </button>
                </div>

                <div
                  onClick={() =>
                    onNavigate('profile', answer.author_username || answer.author_id || answer.user_id)
                  }
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-100 transition-colors self-end sm:self-auto"
                >
                  <img
                    src={
                      answer.author_avatar ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${answer.author_username}`
                    }
                    alt=""
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <div>
                    <span className="text-xs text-slate-400 block font-sans">Answered by</span>
                    <span className="text-sm font-bold text-slate-900">@{answer.author_username}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-xs text-indigo-600 font-semibold">
                        {answer.author_reputation} rep
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                        <Award className="w-3 h-3 text-amber-500" /> Top Contributor
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Answer Comments Section */}
          <CommentSection
            targetType="answer"
            targetId={answer.id}
            comments={comments}
            currentUser={currentUser}
            openAuthModal={openAuthModal}
            onPostComment={onPostComment}
          />
        </div>
      </div>
    </div>
  );
}
