import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function CommunityStandardsCard() {
  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-md">
      <div className="flex items-center gap-2 mb-2 text-indigo-300">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span className="font-mono text-xs font-bold uppercase tracking-wider">
          Community Standards
        </span>
      </div>
      <h4 className="font-bold text-sm text-white font-sans">
        Quality Solutions & Verified Answers
      </h4>
      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
        ThreadPoint rewards clear, reproducible inquiries and peer-reviewed technical solutions. Only the question author can verify an accepted answer, boosting contributor reputation.
      </p>
      <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between text-[11px] font-mono text-emerald-400">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Peer Reviewed
        </span>
        <span>Authoritative Solutions</span>
      </div>
    </div>
  );
}
