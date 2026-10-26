import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ShieldCheck, Sliders, Database, ArrowLeft, LogIn, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileSettingsSection from '../components/settings/ProfileSettingsSection';
import SecuritySettingsSection from '../components/settings/SecuritySettingsSection';
import PreferencesSettingsSection from '../components/settings/PreferencesSettingsSection';
import DataPrivacySettingsSection from '../components/settings/DataPrivacySettingsSection';

export default function SettingsPage({ onNavigate }) {
  const { currentUser, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'preferences' | 'data'

  const tabs = [
    { id: 'profile', label: 'Public Profile', icon: User, desc: 'Identity, bio & links' },
    { id: 'security', label: 'Security & Auth', icon: ShieldCheck, desc: 'Email verification & password' },
    { id: 'preferences', label: 'Preferences', icon: Sliders, desc: 'Feed defaults & notifications' },
    { id: 'data', label: 'Data & Privacy', icon: Database, desc: 'Export & sessions' },
  ];

  if (!currentUser) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8">
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('feed')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
        </motion.button>

        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-8 sm:p-12 text-center max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">
            Authentication Required
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-sm mx-auto">
            You are currently browsing as a guest. Please sign in or switch to a demo account to manage profile identity, security credentials, and preferences.
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('login')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openAuthModal}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Demo Accounts</span>
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto pb-16">
      {/* Top Breadcrumb & Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('feed')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
          </motion.button>
          <span className="text-slate-300">/</span>
          <span className="text-xs text-slate-400 font-mono">
            @{currentUser.username}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-slate-900">
          Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your developer persona, email verification, credentials, and platform preferences.
        </p>
      </div>

      {/* Main Settings Layout: 4-col nav tabs + 8-col active section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Navigation Tabs Rail */}
        <div className="md:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-2.5 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                />
                <div className="min-w-0">
                  <span className="block text-xs font-bold leading-tight">
                    {tab.label}
                  </span>
                  <span
                    className={`block text-[11px] mt-0.5 leading-normal ${
                      isActive ? 'text-indigo-100' : 'text-slate-400'
                    }`}
                  >
                    {tab.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Section */}
        <div className="md:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'profile' && <ProfileSettingsSection />}
              {activeTab === 'security' && <SecuritySettingsSection />}
              {activeTab === 'preferences' && <PreferencesSettingsSection />}
              {activeTab === 'data' && (
                <DataPrivacySettingsSection onNavigate={onNavigate} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
