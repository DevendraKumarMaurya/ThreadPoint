import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check } from 'lucide-react';

export default function FormattedContent({ content, contentId }) {
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  if (!content) return null;

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="text-slate-800 text-[15px] leading-relaxed space-y-4 font-sans">
      {parts.map((part, idx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineBreak = part.indexOf('\n');
          const lang = part.slice(3, firstLineBreak).trim() || 'code';
          const code = part.slice(firstLineBreak + 1, -3);
          const codeId = `${contentId}-${idx}`;

          return (
            <div key={idx} className="rounded-xl overflow-hidden border border-slate-800 bg-[#0F172A] shadow-md my-4">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700/60 text-xs font-mono text-slate-300">
                <span className="uppercase font-semibold tracking-wider text-indigo-400">{lang}</span>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => copyToClipboard(code, codeId)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  {copiedCodeId === codeId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy snippet</span>
                    </>
                  )}
                </motion.button>
              </div>
              <pre className="p-4 overflow-x-auto text-xs md:text-sm font-mono text-slate-100 leading-relaxed">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        return (
          <p key={idx} className="whitespace-pre-line">
            {part}
          </p>
        );
      })}
    </div>
  );
}
