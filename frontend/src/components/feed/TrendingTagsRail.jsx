import React from 'react';
import { Tag } from 'lucide-react';
import { motion } from 'motion/react';

const TRENDING_TAGS = [
  { name: 'postgresql', count: 1840, desc: 'Object-relational database & SQL' },
  { name: 'indexing', count: 940, desc: 'B-Tree, GIN, and search speed' },
  { name: 'triggers', count: 620, desc: 'Automated data validation procedures' },
  { name: 'react', count: 1420, desc: 'Modern user interface components' },
  { name: 'performance', count: 480, desc: 'Latency optimization and scaling' },
];

export default function TrendingTagsRail({ onSelectTag, onNavigateAllTags }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm text-slate-900 font-sans flex items-center gap-2">
          <Tag className="w-4 h-4 text-indigo-600" />
          Trending Knowledge Tags
        </h3>
        <button
          onClick={onNavigateAllTags}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
        >
          View all
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {TRENDING_TAGS.map((t) => (
          <motion.div
            key={t.name}
            whileHover={{ x: 2 }}
            transition={{ duration: 0.12 }}
            onClick={() => onSelectTag(t.name)}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-colors"
          >
            <div>
              <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                #{t.name}
              </span>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{t.desc}</p>
            </div>
            <span className="font-mono text-xs text-slate-400 font-medium">
              {t.count}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
