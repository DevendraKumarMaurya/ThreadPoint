import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flag, X } from 'lucide-react';

export default function ReportModal({
  reportingTarget,
  onClose,
  reportReason,
  setReportReason,
  reportDetails,
  setReportDetails,
  submittingReport,
  reportSuccess,
  onSubmitReport,
}) {
  return (
    <AnimatePresence>
      {reportingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Flag className="w-4 h-4 text-red-500" />
                <span>Report Content</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium text-center">
                {reportSuccess}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Flagging <span className="font-semibold text-slate-700 capitalize">{reportingTarget.target_type}</span>: {reportingTarget.title}
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Reason for flag</label>
                  {[
                    { id: 'spam', label: 'Spam, promotional, or advertising content' },
                    { id: 'abusive', label: 'Harassment, hate speech, or offensive language' },
                    { id: 'offtopic', label: 'Off-topic, non-technical, or misleading' },
                    { id: 'duplicate', label: 'Duplicate of an existing question' },
                    { id: 'lowquality', label: 'Very low quality or incomplete code' },
                  ].map(r => (
                    <label
                      key={r.id}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                        reportReason === r.id ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={r.id}
                        checked={reportReason === r.id}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="text-indigo-600"
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Additional details (optional)</label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide additional context for moderation team..."
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submittingReport}
                    onClick={onSubmitReport}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submittingReport ? 'Submitting...' : 'Submit Flag'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
