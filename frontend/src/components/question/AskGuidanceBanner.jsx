import React from 'react';
import { Sparkles } from 'lucide-react';

export default function AskGuidanceBanner() {
  return (
    <div className="bg-linear-to-r from-indigo-50 to-emerald-50 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
      <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
      <div className="text-xs text-slate-700 leading-relaxed space-y-1">
        <p className="font-bold text-slate-900 text-sm">Writing a Great Community Question</p>
        <p>
          • Summarize your topic clearly in the title and provide enough detail or context for others to understand and help.
        </p>
        <p>
          • Add relevant topic tags (e.g. <code>#productivity</code>, <code>#technology</code>, <code>#career</code>, <code>#design</code>).
        </p>
        <div className="mt-2 text-[11px] font-mono text-emerald-700 font-semibold flex items-center gap-2 flex-wrap">
          <span>Median response time: 18 minutes</span>
          <span className="hidden sm:inline">·</span>
          <span>94% solved with accepted answer</span>
        </div>
      </div>
    </div>
  );
}
