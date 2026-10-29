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

  const renderParagraphWithInlineCode = (text, pIdx) => {
    const inlineParts = text.split(/(`[^`\n]+`)/g);

    return (
      <p key={pIdx} className="whitespace-pre-line">
        {inlineParts.map((subPart, sIdx) => {
          if (subPart.startsWith('`') && subPart.endsWith('`') && subPart.length > 2) {
            return (
              <code
                key={sIdx}
                className="px-1.5 py-0.5 mx-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-[13px] font-semibold border border-indigo-200/60 inline-block align-baseline"
              >
                {subPart.slice(1, -1)}
              </code>
            );
          }
          return subPart;
        })}
      </p>
    );
  };

  return (
    <div className="text-slate-800 text-[15px] leading-relaxed space-y-4 font-sans">
      {parts.map((part, idx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineBreak = part.indexOf('\n');
          const lang = part.slice(3, firstLineBreak).trim() || 'code';
          const code = part.slice(firstLineBreak + 1, -3);
          const codeId = `${contentId}-${idx}`;

          return (
            <div
              key={idx}
              className="rounded-2xl overflow-hidden border border-indigo-200/80 bg-linear-to-b from-indigo-50/40 via-white to-slate-50 shadow-xs my-4"
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-linear-to-r from-indigo-50/90 via-slate-50 to-indigo-50/50 border-b border-indigo-100 text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                  </div>
                  <span className="uppercase font-bold tracking-wider text-[11px] text-indigo-700 bg-indigo-100/90 px-2.5 py-0.5 rounded-md border border-indigo-200/60">
                    {lang}
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => copyToClipboard(code, codeId)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer shadow-2xs font-sans text-xs font-medium"
                >
                  {copiedCodeId === codeId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy snippet</span>
                    </>
                  )}
                </motion.button>
              </div>

              {/* Code Surface */}
              <pre className="p-4 sm:p-5 overflow-x-auto text-xs sm:text-sm font-mono text-slate-800 bg-white/70 leading-relaxed selection:bg-indigo-100">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        return renderParagraphWithInlineCode(part, idx);
      })}
    </div>
  );
}
