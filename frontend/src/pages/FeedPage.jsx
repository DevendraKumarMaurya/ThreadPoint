import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import QuestionCard from '../components/feed/QuestionCard';
import FeedFilterBar from '../components/feed/FeedFilterBar';
import TrendingTagsRail from '../components/feed/TrendingTagsRail';
import TopContributorsRail from '../components/feed/TopContributorsRail';
import { fetchQuestions } from '../api/client';

export default function FeedPage({ currentSort = 'interesting', activeTag = '', onNavigate }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSort = searchParams.get('sort') || currentSort;
  const urlTag = searchParams.get('tag') !== null ? (searchParams.get('tag') || '') : activeTag;

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSort, setSelectedSort] = useState(urlSort);
  const [selectedTag, setSelectedTag] = useState(urlTag);

  useEffect(() => {
    setSelectedSort(urlSort);
  }, [urlSort]);

  useEffect(() => {
    setSelectedTag(urlTag);
  }, [urlTag]);

  const updateSort = (sortId) => {
    setSelectedSort(sortId);
    const params = new URLSearchParams(searchParams);
    params.set('sort', sortId);
    setSearchParams(params);
  };

  const updateTag = (tagName) => {
    setSelectedTag(tagName);
    const params = new URLSearchParams(searchParams);
    if (tagName) {
      params.set('tag', tagName);
    } else {
      params.delete('tag');
    }
    setSearchParams(params);
  };

  const loadQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchQuestions({
        sort: selectedSort,
        tag: selectedTag,
      });
      setQuestions(data.questions || []);
    } catch (err) {
      console.error('Feed error:', err);
      setError('Failed to load feed questions. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [selectedSort, selectedTag]);

  return (
    <div className="w-full">
      {/* Subheader Filter & Action Bar */}
      <FeedFilterBar
        selectedSort={selectedSort}
        onSortChange={updateSort}
        onNavigateAsk={() => onNavigate('ask')}
      />

      {/* Active Filter Chips / Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 px-1">
        <div className="flex items-center gap-2 flex-wrap text-sm text-slate-600">
          <span className="font-sans font-bold text-base text-slate-900">
            {selectedTag ? `Tagged Inquiries (#${selectedTag})` : 'Top Engineering Inquiries'}
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 text-xs font-mono">
            Displaying {questions.length} curated technical threads
          </span>
          {selectedTag && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => updateTag('')}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-mono font-medium hover:bg-indigo-100 transition-colors ml-2 cursor-pointer"
            >
              <span>clear #{selectedTag}</span>
              <X className="w-3 h-3" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Main Grid: 8-col feed, 4-col contextual rail */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Questions Feed (8 Columns) */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="bg-white rounded-2xl p-12 text-center border border-slate-200"
              >
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm font-medium text-slate-600">Loading technical questions...</p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm"
              >
                {error}
                <button
                  onClick={loadQuestions}
                  className="block mx-auto mt-3 px-4 py-1.5 bg-red-600 text-white font-semibold text-xs rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </motion.div>
            ) : questions.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="bg-white rounded-2xl p-12 text-center border border-slate-200"
              >
                <p className="text-base font-bold text-slate-700">No questions found</p>
                <p className="text-xs text-slate-400 mt-1">Be the first developer to ask a question with these criteria!</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate('ask')}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Ask a Question
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key={`feed-${selectedSort}-${selectedTag}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex flex-col gap-4"
              >
                {questions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    onNavigate={onNavigate}
                    onTagClick={(t) => updateTag(t)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Contextual Sidebar (4 Columns) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <TrendingTagsRail
            onSelectTag={(tagName) => updateTag(tagName)}
            onNavigateAllTags={() => onNavigate('tags')}
          />

          <TopContributorsRail
            onNavigateUser={(username) => onNavigate('profile', username)}
            onNavigateLeaderboard={() => onNavigate('leaderboard')}
          />
        </div>
      </div>
    </div>
  );
}
