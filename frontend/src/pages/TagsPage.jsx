import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Tag as TagIcon, Search, HelpCircle, ArrowRight, Check, Eye } from 'lucide-react';
import { fetchTags, fetchWatchedTags, toggleWatchTag } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function TagsPage({ onNavigate: propOnNavigate }) {
  const navigate = useNavigate();
  const { currentUser, openAuthModal } = useAuth();
  const onNavigate = propOnNavigate || ((view, opts) => {
    if (opts?.tag) {
      navigate(`/feed?tag=${encodeURIComponent(opts.tag)}`);
    } else {
      navigate('/feed');
    }
  });

  const [tags, setTags] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [watchedMap, setWatchedMap] = useState({});

  useEffect(() => {
    fetchTags()
      .then(data => setTags(data.tags || []))
      .catch(err => console.error('Fetch tags error:', err))
      .finally(() => setLoading(false));

    if (currentUser) {
      fetchWatchedTags()
        .then(data => {
          const map = {};
          (data.watched_tags || []).forEach(t => {
            map[t.name.toLowerCase()] = true;
          });
          setWatchedMap(map);
        })
        .catch(err => console.error('Fetch watched tags error:', err));
    }
  }, [currentUser]);

  const filtered = tags.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSubscribe = async (e, tagName) => {
    e.stopPropagation();
    if (!currentUser) {
      if (openAuthModal) openAuthModal();
      return;
    }

    const key = tagName.toLowerCase();
    const isWatched = Boolean(watchedMap[key]);

    // Optimistic toggle
    setWatchedMap(prev => ({ ...prev, [key]: !isWatched }));

    try {
      const res = await toggleWatchTag(tagName);
      setWatchedMap(prev => ({ ...prev, [key]: res.watched }));
    } catch (err) {
      console.error('Toggle watch tag error:', err);
      // Revert
      setWatchedMap(prev => ({ ...prev, [key]: isWatched }));
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="font-sans font-bold text-2xl md:text-3xl text-slate-900">
          Tags & Knowledge Topics
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          A tag is a keyword that categorizes your question with other, similar questions. Using the right tags makes it easier for others to find and answer your question.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by tag name or concept..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing {filtered.length} knowledge domains
        </div>
      </div>

      {/* Tag Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-600">Loading indexed technical tags...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((tag) => (
            <motion.div
              key={tag.id}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              onClick={() => onNavigate('feed', { tag: tag.name })}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group cursor-pointer hover:border-indigo-300"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    #{tag.name}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={(e) => toggleSubscribe(e, tag.name)}
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                      watchedMap[tag.name.toLowerCase()]
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {watchedMap[tag.name.toLowerCase()] ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Watching</span>
                      </>
                    ) : (
                      '+ Watch'
                    )}
                  </motion.button>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {tag.description || 'Discussions, benchmark queries, and architectural patterns related to this topic.'}
                </p>
              </div>

              <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100 text-xs">
                <span className="font-mono text-slate-500 font-medium">
                  {tag.question_count || 0} questions
                </span>
                <span className="text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
