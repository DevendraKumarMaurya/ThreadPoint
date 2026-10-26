import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Send, ArrowLeft, AlertCircle } from 'lucide-react';
import { createQuestion, searchQuestions, fetchTags } from '../api/client';
import { useAuth } from '../context/AuthContext';
import SimilarQuestionsBox from '../components/question/SimilarQuestionsBox';
import TagInputSelector from '../components/question/TagInputSelector';

export default function AskPage({ onNavigate: propOnNavigate }) {
  const navigate = useNavigate();
  const onNavigate = propOnNavigate || ((view, opts) => {
    if (view === 'question') navigate(`/questions/${opts}`);
    else navigate('/feed');
  });

  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState(['postgresql']);
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [tab, setTab] = useState('write'); // 'write' | 'preview'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [similarQuestions, setSimilarQuestions] = useState([]);

  useEffect(() => {
    fetchTags().then(data => setAvailableTags(data.tags || [])).catch(() => {});
  }, []);

  // Live duplicate query matching
  useEffect(() => {
    if (title.trim().length > 15) {
      const timer = setTimeout(async () => {
        try {
          const res = await searchQuestions(title);
          setSimilarQuestions(res.results?.slice(0, 3) || []);
        } catch (e) {}
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSimilarQuestions([]);
    }
  }, [title]);

  const handleAddTag = (t) => {
    const clean = t.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (clean && !tags.includes(clean) && tags.length < 5) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (title.trim().length < 10) {
      setError('Title must be at least 10 characters long.');
      return;
    }
    if (body.trim().length < 20) {
      setError('Question body must be at least 20 characters long.');
      return;
    }
    if (tags.length === 0) {
      setError('Please add at least one tag (e.g. #postgresql).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createQuestion({
        title,
        body,
        tags,
      });
      const qId = res.questionId || res.question?.id;
      if (qId) {
        onNavigate('question', qId);
      } else {
        onNavigate('feed');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 pb-16">
      {/* Top Banner */}
      <div>
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('feed')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
        </motion.button>

        <h1 className="font-sans font-bold text-2xl md:text-3xl text-slate-900">
          Ask a Public Question
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Post a reproducible technical inquiry to the engineering community.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Composer Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Title Input Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-slate-900 font-sans">
              Title
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              {title.length} / 150
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-2">
            Be specific and imagine you are asking a question to another software engineer.
          </p>
          <input
            type="text"
            required
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. How to enforce single accepted answer in PostgreSQL with conditional unique indexes?"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />

          {/* Live Similar Question Matcher */}
          <SimilarQuestionsBox
            questions={similarQuestions}
            onSelectQuestion={(id) => onNavigate('question', id)}
          />
        </div>

        {/* Body Editor Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <label className="block text-sm font-bold text-slate-900 font-sans">
              What are the details of your problem?
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab('write')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  tab === 'write' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setTab('preview')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  tab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Preview
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Introduce the problem, share what you tried, and format any code/queries using triple backticks.
          </p>

          <AnimatePresence mode="wait">
            {tab === 'write' ? (
              <motion.div
                key="write-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                <textarea
                  required
                  rows={10}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Explain the background, paste schema, or SQL queries using ```sql ... ```"
                  className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                />
              </motion.div>
            ) : (
              <motion.div
                key="preview-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="p-3 sm:p-4 border border-slate-200 rounded-xl bg-slate-50 min-h-[200px] text-sm whitespace-pre-line overflow-x-auto"
              >
                {body.trim() ? body : <span className="text-slate-400 italic">No markdown preview yet...</span>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tags Card */}
        <TagInputSelector
          tags={tags}
          tagInput={tagInput}
          onTagInputChange={setTagInput}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
        />

        {/* Submit Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-500">
            Posting as <strong>@{currentUser?.username || 'Guest'}</strong> (reputation: {currentUser?.reputation_score || 1})
          </p>

          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Publishing Question...' : 'Post Question'}</span>
          </motion.button>
        </div>
      </form>
    </div>
  );
}
