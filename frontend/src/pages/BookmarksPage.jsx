import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bookmark, Search, ArrowRight, Trash2, HelpCircle, CheckCircle2, Star, Sparkles } from 'lucide-react';
import { fetchBookmarks } from '../api/client';
import { useAuth } from '../context/AuthContext';
import QuestionCard from '../components/feed/QuestionCard';

export default function BookmarksPage({ onNavigate: propOnNavigate }) {
  const navigate = useNavigate();
  const onNavigate = propOnNavigate || ((view, opts) => {
    if (view === 'question') navigate(`/questions/${opts}`);
    else if (view === 'feed' || view === 'questions') navigate('/feed');
    else navigate(`/${view}`);
  });

  const { currentUser, bookmarkedIds, toggleBookmarkItem } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBookmarks = async () => {
    if (!currentUser) {
      setLoading(false);
      setBookmarks([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await fetchBookmarks();
      setBookmarks(data.bookmarks || []);
    } catch (err) {
      console.error('Bookmarks load error:', err);
      setError('Failed to load saved questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, [currentUser?.id]);

  const handleRemove = async (e, questionId) => {
    e.stopPropagation();
    try {
      await toggleBookmarkItem(questionId);
      setBookmarks(prev => prev.filter(b => b.id !== questionId));
    } catch (err) {
      console.error('Remove bookmark failed:', err);
    }
  };

  const filteredBookmarks = bookmarks.filter(b => {
    const q = search.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.body.toLowerCase().includes(q) ||
      (b.tags || []).some(t => {
        const name = typeof t === 'object' ? t.name : t;
        return name.toLowerCase().includes(q);
      })
    );
  });

  if (!currentUser) {
    return (
      <div className="w-full max-w-4xl mx-auto py-6 sm:py-12 px-2 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 sm:p-10 md:p-14 border border-slate-200/90 shadow-sm text-center flex flex-col items-center"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 sm:mb-5">
            <Bookmark className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.8]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
            Your Personal Knowledge Library
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-2 leading-relaxed">
            Sign in to bookmark insightful questions, verified solutions, and community discussions for quick reference.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-colors"
            >
              Sign In to View Bookmarks
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('feed')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
            >
              Explore Feed
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sans font-bold text-2xl md:text-3xl text-slate-900 flex items-center gap-2.5">
            <Bookmark className="w-7 h-7 text-indigo-600 fill-indigo-100" />
            Saved Questions & Solutions
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Curated references and bookmarks for <span className="font-semibold text-slate-800">@{currentUser.username}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            {bookmarks.length} {bookmarks.length === 1 ? 'Question Saved' : 'Questions Saved'}
          </span>
        </div>
      </div>

      {/* Search Filter Bar */}
      {bookmarks.length > 0 && (
        <div className="flex items-center bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved titles, code, or tags..."
            className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-900 placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-slate-400 hover:text-slate-600 font-mono"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Content Body */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-600">Loading your saved questions...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">
          {error}
          <button
            onClick={loadBookmarks}
            className="block mx-auto mt-3 px-4 py-1.5 bg-red-600 text-white font-semibold text-xs rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : bookmarks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-12 md:p-16 border border-slate-200 text-center flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
            <Bookmark className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No saved bookmarks yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
            When you discover insightful answers, thoughtful discussions, or helpful guides, click the bookmark icon on any question to save it here.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('feed')}
            className="mt-6 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            Explore Community Discussions <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </motion.div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
          <p className="text-sm font-semibold text-slate-700">No bookmarks matched "{search}"</p>
          <button
            onClick={() => setSearch('')}
            className="mt-2 text-xs text-indigo-600 hover:underline"
          >
            Reset search filter
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredBookmarks.map((question, idx) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16, delay: Math.min(idx * 0.02, 0.25) }}
              className="relative group/wrapper"
            >
              <QuestionCard
                question={question}
                onNavigate={onNavigate}
                onTagClick={(tag) => onNavigate('feed', { tag })}
              />
              {/* Quick Remove Floating Button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={(e) => handleRemove(e, question.id)}
                title="Remove from bookmarks"
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 shadow-xs transition-all z-10"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
