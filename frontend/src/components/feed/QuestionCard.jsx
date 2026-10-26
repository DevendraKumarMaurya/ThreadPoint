import React, { useState } from 'react';
import { ChevronUp, ChevronDown, CheckCircle2, MessageSquare, Eye, Flame, Bookmark } from 'lucide-react';
import { motion } from 'motion/react';
import { castVote } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function QuestionCard({ question, onNavigate, onTagClick, initialVote = 0 }) {
  const {
    currentUser,
    userVotes,
    setUserVotes,
    updateUserReputation,
    bookmarkedIds,
    toggleBookmarkItem,
    openAuthModal,
  } = useAuth();

  const isBookmarked = bookmarkedIds?.has(question.id);

  // Directly derive vote state from global userVotes
  const currentVoteVal = userVotes[`question-${question.id}`];
  const myVote = currentVoteVal !== undefined ? Number(currentVoteVal) : initialVote;

  const [voteScore, setVoteScore] = useState(Number(question.net_votes) || 0);
  const [authorReputation, setAuthorReputation] = useState(question.author_reputation || 1);
  const [voting, setVoting] = useState(false);

  // Sync vote score and author reputation if question props update
  React.useEffect(() => {
    setVoteScore(Number(question.net_votes) || 0);
  }, [question.net_votes]);

  React.useEffect(() => {
    if (question.author_reputation !== undefined) {
      setAuthorReputation(question.author_reputation);
    }
  }, [question.author_reputation]);

  const handleVote = async (e, direction) => {
    e.stopPropagation();
    if (!currentUser) {
      if (openAuthModal) openAuthModal();
      return;
    }
    if (voting) return;

    const previousVote = myVote;
    const newValue = previousVote === direction ? 0 : direction;
    const scoreDelta = newValue - previousVote;

    // Optimistic UI update
    setVoteScore(prev => prev + scoreDelta);
    setUserVotes(prev => ({ ...prev, [`question-${question.id}`]: newValue }));

    setVoting(true);
    try {
      const res = await castVote({
        target_type: 'question',
        target_id: question.id,
        value: newValue,
      });

      if (res.net_votes !== undefined) {
        setVoteScore(Number(res.net_votes));
      }
      if (res.current_user_vote !== undefined) {
        setUserVotes(prev => ({ ...prev, [`question-${question.id}`]: Number(res.current_user_vote) }));
      }
      if (res.target_author_reputation !== undefined) {
        setAuthorReputation(res.target_author_reputation);
        if (currentUser?.id === (res.target_author_id || question.user_id || question.author_id)) {
          updateUserReputation(res.target_author_reputation);
        }
      }
    } catch (err) {
      console.error('Vote failed:', err);
      // Revert optimistic update
      setVoteScore(prev => prev - scoreDelta);
      setUserVotes(prev => ({ ...prev, [`question-${question.id}`]: previousVote }));
    } finally {
      setVoting(false);
    }
  };

  const formatTimeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={() => onNavigate('question', question.id)}
      className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 sm:gap-5 group cursor-pointer"
    >
      {/* Metric Indicator Rail */}
      <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-2.5 sm:gap-3 sm:w-28 shrink-0">
        {/* Score Controller */}
        <div className="flex sm:flex-col items-center bg-slate-50 border border-slate-200/80 rounded-xl px-2 py-1 sm:w-full justify-between sm:justify-center">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => handleVote(e, 1)}
            aria-label="Upvote"
            className={`p-1 rounded-lg transition-colors ${
              myVote === 1 ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-slate-400 hover:text-indigo-600'
            }`}
          >
            <ChevronUp className="w-5 h-5 stroke-[2.5]" />
          </motion.button>
          <motion.span
            key={voteScore}
            initial={{ scale: 1.18 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.15 }}
            className={`font-mono text-sm font-bold my-0.5 px-2 sm:px-0 inline-block ${
              voteScore > 0 ? 'text-indigo-600' : voteScore < 0 ? 'text-red-500' : 'text-slate-600'
            }`}
          >
            {voteScore > 0 ? `+${voteScore}` : voteScore}
          </motion.span>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => handleVote(e, -1)}
            aria-label="Downvote"
            className={`p-1 rounded-lg transition-colors ${
              myVote === -1 ? 'text-red-600 bg-red-50 font-bold' : 'text-slate-400 hover:text-red-600'
            }`}
          >
            <ChevronDown className="w-5 h-5 stroke-[2.5]" />
          </motion.button>
        </div>

        {/* Answer Status Badge */}
        <div
          className={`flex sm:flex-col items-center justify-center rounded-xl px-3 py-1.5 sm:w-full gap-1.5 sm:gap-0 transition-all ${
            question.has_accepted
              ? 'bg-emerald-600 text-white shadow-xs'
              : question.answer_count > 0
              ? 'bg-slate-100 text-slate-700 border border-slate-200'
              : 'border border-dashed border-slate-200 text-slate-400'
          }`}
        >
          <span className="font-sans font-bold text-sm sm:text-base leading-tight">
            {question.answer_count}
          </span>
          <span className="font-sans text-[11px] leading-tight flex items-center gap-1 font-medium">
            answers {question.has_accepted && <CheckCircle2 className="w-3 h-3 fill-white text-emerald-600" />}
          </span>
        </div>

        {/* View Count */}
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span>{(question.view_count || question.views || 0).toLocaleString()} <span className="hidden sm:inline">views</span></span>
        </div>
      </div>

      {/* Main Question Content Body */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Status Pill & Subcategory */}
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {question.has_accepted && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold tracking-wide flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> SOLUTION VERIFIED
                </span>
              )}
              {!question.has_accepted && question.answer_count > 2 && (
                <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-mono text-[11px] font-bold tracking-wide flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-500" /> ACTIVE DEBATE
                </span>
              )}
              {question.tags?.[0] && (
                <span className="text-xs font-mono text-slate-400">
                  #{typeof question.tags[0] === 'object' ? question.tags[0].name : question.tags[0]}
                </span>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                if (currentUser) toggleBookmarkItem(question.id);
              }}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
              className={`p-1 rounded-lg transition-colors ${
                isBookmarked
                  ? 'text-indigo-600 bg-indigo-50 border border-indigo-200'
                  : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-indigo-600' : ''}`} />
            </motion.button>
          </div>

          {/* Title */}
          <h2 className="font-sans font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
            {question.title}
          </h2>

          {/* Snippet body */}
          <p className="text-sm text-slate-600 line-clamp-2 mt-2 leading-relaxed font-sans">
            {question.body.replace(/```[\s\S]*?```/g, '[Code Snippet]')}
          </p>
        </div>

        {/* Metadata Footer: Tags & Author */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
          {/* Tag Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(question.tags || []).map((tagItem) => {
              const tagName = typeof tagItem === 'object' ? tagItem.name : tagItem;
              return (
                <motion.button
                  key={tagName}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick(tagName);
                  }}
                  className="rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-mono text-xs px-2.5 py-1 transition-colors border border-transparent hover:border-indigo-200"
                >
                  #{tagName}
                </motion.button>
              );
            })}
          </div>

          {/* Author info */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (onNavigate) {
                onNavigate('profile', question.author_username || question.author_id);
              }
            }}
            className="flex items-center gap-2 shrink-0 cursor-pointer group/author"
            title={`View @${question.author_username}'s profile`}
          >
            <img
              src={question.author_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${question.author_username}`}
              alt=""
              className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200"
            />
            <span className="text-xs font-semibold text-slate-800 group-hover/author:text-indigo-600 transition-colors">
              @{question.author_username}
            </span>
            <span className="font-mono text-[11px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              {authorReputation?.toLocaleString() || 1}
            </span>
            <span className="text-xs text-slate-400">
              · {formatTimeAgo(question.created_at)}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
