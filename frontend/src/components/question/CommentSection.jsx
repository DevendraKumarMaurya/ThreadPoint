import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';

export default function CommentSection({
  targetType,
  targetId,
  comments = [],
  currentUser,
  openAuthModal,
  onPostComment,
}) {
  const [commentText, setCommentText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!currentUser) {
      if (openAuthModal) openAuthModal();
      return;
    }
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      await onPostComment(targetType, targetId, commentText.trim(), activeReplyId);
      setCommentText('');
      setActiveReplyId(null);
    } catch (err) {
      console.error('Submit comment error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-slate-100">
      <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5" /> Comments & Clarifications
      </h4>

      {comments.length > 0 && (
        <div className="space-y-2 mb-3">
          {comments.map((c) => (
            <div
              key={c.id}
              style={{ marginLeft: `${Math.min(c.depth || 0, 2) * 0.75}rem` }}
              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-start justify-between gap-3"
            >
              <div>
                <span className="font-semibold text-slate-900">@{c.author_username || c.username}</span>
                <span className="font-mono text-slate-400 text-[10px] ml-1.5">
                  ({c.author_reputation || c.reputation_score} rep):
                </span>
                <p className="text-slate-700 mt-0.5 leading-relaxed">{c.body}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveReplyId(activeReplyId === c.id ? null : c.id)}
                className="text-[11px] text-indigo-600 hover:underline shrink-0 cursor-pointer"
              >
                Reply
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Comment input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={activeReplyId ? `Replying to comment #${activeReplyId}...` : 'Add a concise comment...'}
          className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans"
        />
        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmit}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Send className="w-3 h-3" /> {submitting ? '...' : 'Post'}
        </button>
        {activeReplyId && (
          <button
            type="button"
            onClick={() => setActiveReplyId(null)}
            className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
