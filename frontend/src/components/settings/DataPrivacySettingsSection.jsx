import React, { useState } from 'react';
import { Database, Download, Trash2, LogOut, Check, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

export default function DataPrivacySettingsSection({ onNavigate }) {
  const { currentUser, logout, bookmarkedIds } = useAuth();
  const [historyCleared, setHistoryCleared] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleClearHistory = () => {
    try {
      localStorage.removeItem('threadpoint_search_history');
      setHistoryCleared(true);
      setTimeout(() => setHistoryCleared(false), 2500);
    } catch (e) {}
  };

  const handleExportData = () => {
    try {
      const exportObject = {
        exported_at: new Date().toISOString(),
        profile: currentUser || {},
        bookmarked_question_ids: Array.from(bookmarkedIds || []),
        storage_meta: {
          platform: 'ThreadPoint Knowledge Platform',
          version: '1.0.0',
        },
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `threadpoint-${currentUser?.username || 'user'}-export.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2500);
    } catch (e) {
      console.error('Failed to export data:', e);
    }
  };

  const handleSignOut = () => {
    logout();
    onNavigate('login');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900 font-sans flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-600" />
          Data, Portability & Session Management
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Export your community contributions, clear local search storage, or terminate active login sessions.
        </p>
      </div>

      {historyCleared && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Local search history cleared from this browser.</span>
        </motion.div>
      )}

      {exportSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>User data export file downloaded successfully.</span>
        </motion.div>
      )}

      {/* Export Data */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-900 block">
            Export Contributor Data (JSON)
          </span>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Download a machine-readable JSON archive of your profile details, reputation history, and bookmarked questions.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleExportData}
          className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-indigo-600" />
          <span>Export Data</span>
        </motion.button>
      </div>

      {/* Clear Search History */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-900 block">
            Clear Command Palette Search History
          </span>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Remove all recent search suggestions and cached query terms stored in this browser session.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleClearHistory}
          className="px-4 py-2 bg-white hover:bg-red-50 hover:text-red-700 border border-slate-300 hover:border-red-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </motion.button>
      </div>

      {/* Danger Zone: Log Out */}
      <div className="p-4 sm:p-5 rounded-2xl border border-red-200 bg-red-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Terminate Current Session
          </span>
          <p className="text-[11px] text-red-700 mt-1 leading-relaxed">
            Signs out of <strong>@{currentUser?.username}</strong> and clears your JWT authentication token from this browser.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleSignOut}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </motion.button>
      </div>
    </div>
  );
}
