import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchQuestions } from '../../api/client';
import SearchHistorySection from '../search/SearchHistorySection';
import SearchSuggestedTopics from '../search/SearchSuggestedTopics';
import SearchUserItem from '../search/SearchUserItem';
import SearchQuestionItem from '../search/SearchQuestionItem';

const SEARCH_HISTORY_KEY = 'threadpoint_search_history';

function getStoredHistory() {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(item => typeof item === 'string' && item.trim().length > 0)
      : [];
  } catch (e) {
    return [];
  }
}

function setStoredHistory(items) {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(items));
  } catch (e) {}
}

export default function CommandPalette({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'questions' | 'users'
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => getStoredHistory());
  const inputRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setHistory(getStoredHistory());
      const focusTimer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
      return () => clearTimeout(focusTimer);
    } else {
      setQuery('');
      setResults([]);
      setUserResults([]);
      setActiveFilter('all');
    }
  }, [isOpen]);

  const addToHistory = (searchTerm) => {
    const clean = (searchTerm || '').trim();
    if (!clean || clean.length < 2) return;
    setHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 10);
      setStoredHistory(updated);
      return updated;
    });
  };

  const removeFromHistory = (searchTerm) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.toLowerCase() !== searchTerm.toLowerCase());
      setStoredHistory(updated);
      return updated;
    });
  };

  const clearAllHistory = () => {
    setHistory([]);
    setStoredHistory([]);
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setUserResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchQuestions(query, activeFilter);
        setResults(data.results || data.questions || []);
        setUserResults(data.users || []);
      } catch (err) {
        console.error('Command palette search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, activeFilter]);

  const showUsers = (activeFilter === 'all' || activeFilter === 'users') && userResults.length > 0;
  const showQuestions = (activeFilter === 'all' || activeFilter === 'questions') && results.length > 0;
  const totalCount = results.length + userResults.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cmd-palette-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <motion.div
            key="cmd-palette-dialog"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[75vh]"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-3.5 sm:px-4 py-3 sm:py-3.5 border-b border-slate-200 gap-2.5 sm:gap-3">
              <Search className="w-5 h-5 text-indigo-600 shrink-0" />
              <input
                ref={inputRef}
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query.trim()) {
                    addToHistory(query);
                  }
                }}
                placeholder="Search questions, answers, topics, or @members..."
                className="flex-1 bg-transparent border-0 outline-none text-slate-900 placeholder:text-slate-400 text-base font-sans"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                ESC
              </kbd>
            </div>

            {/* Filter Tabs Header */}
            {query.trim().length > 0 && (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 border-b border-slate-100 bg-slate-50/70 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-white text-indigo-600 font-semibold shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('questions')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeFilter === 'questions'
                      ? 'bg-white text-indigo-600 font-semibold shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Questions ({results.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('users')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeFilter === 'users'
                      ? 'bg-white text-indigo-600 font-semibold shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Contributors ({userResults.length})
                </button>
              </div>
            )}

            {/* Results Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {loading && (
                <div className="p-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                  Searching questions and contributors...
                </div>
              )}

              {!loading && query && totalCount === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm">
                  <p className="font-semibold text-slate-700 mb-1">
                    No matching results found for "{query}"
                  </p>
                  <p className="text-xs text-slate-400">
                    Try searching by question title, keyword, topic tag, or contributor @username.
                  </p>
                </div>
              )}

              {/* When Input is Empty: Recent Searches and Suggestions */}
              {!loading && !query && (
                <div className="p-4 space-y-5">
                  <SearchHistorySection
                    history={history}
                    onSelectTerm={(term) => setQuery(term)}
                    onRemoveTerm={removeFromHistory}
                    onClearAll={clearAllHistory}
                  />

                  <SearchSuggestedTopics
                    onSelectTag={(tag) => {
                      addToHistory(tag);
                      setQuery(tag);
                    }}
                    onSelectUser={(username) => {
                      addToHistory(`@${username}`);
                      onNavigate('profile', username);
                      onClose();
                    }}
                  />
                </div>
              )}

              {/* Matching Contributors */}
              {!loading && showUsers && (
                <div className="flex flex-col gap-1.5">
                  <div className="px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex justify-between">
                    <span>Matching Contributors ({userResults.length})</span>
                    <span>Ranked by Reputation</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {userResults.map((u) => (
                      <SearchUserItem
                        key={u.id}
                        user={u}
                        onSelect={() => {
                          addToHistory(query || `@${u.username}`);
                          onNavigate('profile', u.username);
                          onClose();
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Questions */}
              {!loading && showQuestions && (
                <div className="flex flex-col gap-1.5">
                  <div className="px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex justify-between">
                    <span>Matching Questions ({results.length})</span>
                    <span>Ranked by ts_rank</span>
                  </div>
                  {results.map((q) => (
                    <SearchQuestionItem
                      key={q.id}
                      question={q}
                      onSelect={() => {
                        addToHistory(query || q.title);
                        onNavigate('question', q.id);
                        onClose();
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span className="font-mono text-[11px]">
                Unified Search · Full-Text GIN & Contributor Index
              </span>
              <span className="text-[11px] text-slate-400">
                Press ESC to exit
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
