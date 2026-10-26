import React from 'react';
import { Clock, X } from 'lucide-react';

export default function SearchHistorySection({ history, onSelectTerm, onRemoveTerm, onClearAll }) {
  if (!history || history.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Recent Searches</span>
        </p>
        <button
          type="button"
          onClick={onClearAll}
          className="text-[11px] font-medium text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
        >
          Clear History
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {history.map((term) => (
          <div
            key={term}
            onClick={() => onSelectTerm(term)}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-xs font-sans text-slate-700 transition-colors cursor-pointer border border-transparent hover:border-indigo-200"
          >
            <Clock className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            <span className="font-medium truncate max-w-[200px]">{term}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveTerm(term);
              }}
              className="p-0.5 -mr-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors ml-0.5 cursor-pointer"
              title="Remove from history"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
