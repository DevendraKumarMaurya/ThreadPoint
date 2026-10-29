import React, { useState, useEffect } from 'react';
import { Sliders, Bell, Code, Check, Monitor } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  getNotificationPermission, 
  requestNotificationPermission 
} from '../../utils/browserNotifications';

const PREFERENCES_KEY = 'threadpoint_preferences';

function getStoredPreferences() {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export default function PreferencesSettingsSection() {
  const [defaultSort, setDefaultSort] = useState('interesting');
  const [codeFont, setCodeFont] = useState('JetBrains Mono');
  const [notifyOnAnswers, setNotifyOnAnswers] = useState(true);
  const [notifyOnAccepted, setNotifyOnAccepted] = useState(true);
  const [notifyOnFollow, setNotifyOnFollow] = useState(true);
  const [savedAlert, setSavedAlert] = useState(false);
  const [browserPerm, setBrowserPerm] = useState(() => getNotificationPermission());

  useEffect(() => {
    const stored = getStoredPreferences();
    if (stored) {
      if (stored.defaultSort) setDefaultSort(stored.defaultSort);
      if (stored.codeFont) setCodeFont(stored.codeFont);
      if (typeof stored.notifyOnAnswers === 'boolean') setNotifyOnAnswers(stored.notifyOnAnswers);
      if (typeof stored.notifyOnAccepted === 'boolean') setNotifyOnAccepted(stored.notifyOnAccepted);
      if (typeof stored.notifyOnFollow === 'boolean') setNotifyOnFollow(stored.notifyOnFollow);
    }
  }, []);

  const handleSave = () => {
    const prefs = {
      defaultSort,
      codeFont,
      notifyOnAnswers,
      notifyOnAccepted,
      notifyOnFollow,
    };
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 2400);
    } catch (e) {}
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900 font-sans flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-600" />
          User Experience & App Preferences
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Customize your default feed views, reading typography, and community notification alerts.
        </p>
      </div>

      {savedAlert && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Application preferences saved and applied to your workspace.</span>
        </motion.div>
      )}

      {/* Default Feed Filter View */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-slate-700 font-sans">
          Default Feed Sort Criteria
        </label>
        <p className="text-xs text-slate-500 -mt-1">
          Choose which questions and discussions are shown first when accessing the home feed.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'interesting', label: 'Interesting' },
            { id: 'hot', label: 'Hot & Trending' },
            { id: 'votes', label: 'Top Score' },
            { id: 'newest', label: 'Newest First' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDefaultSort(item.id)}
              className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                defaultSort === item.id
                  ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 shadow-xs ring-1 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Code Typography */}
      <div className="space-y-3 pt-2">
        <label className="block text-xs font-semibold text-slate-700 font-sans flex items-center gap-1.5">
          <Code className="w-4 h-4 text-slate-400" />
          Preferred Code Block Font
        </label>
        <select
          value={codeFont}
          onChange={(e) => setCodeFont(e.target.value)}
          className="w-full sm:w-72 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
        >
          <option value="JetBrains Mono">JetBrains Mono</option>
          <option value="Fira Code">Fira Code</option>
          <option value="Source Code Pro">Source Code Pro</option>
          <option value="ui-monospace">System Monospace</option>
        </select>
      </div>

      {/* Notification Toggles */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-bold text-slate-900 font-sans uppercase tracking-wider">
            Notification Triggers
          </h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <div>
              <span className="block text-xs font-bold text-slate-800">
                New Answers on My Questions
              </span>
              <span className="block text-[11px] text-slate-400">
                Receive notification alerts whenever someone posts an answer to your question.
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifyOnAnswers}
              onChange={(e) => setNotifyOnAnswers(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <div>
              <span className="block text-xs font-bold text-slate-800">
                Accepted Solution Confirmations
              </span>
              <span className="block text-[11px] text-slate-400">
                Get notified immediately when the original author marks your solution as verified.
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifyOnAccepted}
              onChange={(e) => setNotifyOnAccepted(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <div>
              <span className="block text-xs font-bold text-slate-800">
                New Follower Alerts
              </span>
              <span className="block text-[11px] text-slate-400">
                Notify me whenever another community member begins following my activity.
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifyOnFollow}
              onChange={(e) => setNotifyOnFollow(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </label>
        </div>

        {/* Desktop Browser Level Notifications */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-900 font-sans">
                Native Desktop & Browser Alerts
              </span>
            </div>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold ${
              browserPerm === 'granted'
                ? 'bg-emerald-100 text-emerald-800'
                : browserPerm === 'denied'
                ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {browserPerm === 'granted' ? 'Allowed' : browserPerm === 'denied' ? 'Blocked by Browser' : 'Not Requested'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Receive native system popups and chimes whenever a new answer, upvote, or accepted solution arrives, even when browsing other tabs.
          </p>
          {browserPerm !== 'granted' && (
            <div className="pt-1">
              <button
                type="button"
                onClick={async () => {
                  const perm = await requestNotificationPermission();
                  setBrowserPerm(perm);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Enable Desktop Alerts
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="pt-2 flex items-center justify-end">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleSave}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Save Preferences
        </motion.button>
      </div>
    </div>
  );
}
