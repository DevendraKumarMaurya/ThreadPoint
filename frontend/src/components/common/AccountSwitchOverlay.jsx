import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Sparkles, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LogoIcon } from './Logo';

export default function AccountSwitchOverlay() {
  const { switchSessionState, switchingTargetUser } = useAuth();
  const [phase, setPhase] = useState('switching'); // 'switching' | 'ready'

  const targetUser = switchSessionState?.toUser || switchingTargetUser;
  const fromUser = switchSessionState?.fromUser || null;

  useEffect(() => {
    if (targetUser) {
      setPhase('switching');
      const timer = setTimeout(() => {
        setPhase('ready');
      }, 550);
      return () => clearTimeout(timer);
    } else {
      setPhase('switching');
    }
  }, [targetUser]);

  return (
    <AnimatePresence>
      {targetUser && (
        <motion.div
          key="account-switch-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          {/* Main Card */}
          <motion.div
            key="account-switch-card"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-center"
          >
            {/* Header: Brand & Badge */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <LogoIcon size={22} />
                <span className="font-bold text-sm text-slate-900 font-sans tracking-tight">
                  ThreadPoint
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100/80">
                <motion.span
                  animate={{ scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-indigo-600"
                />
                Switching Account
              </span>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-7">
              {/* Account Transition Track (From -> To) */}
              <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6">
                {/* Previous / From User */}
                <div className="flex flex-col items-center w-24">
                  <div className="relative">
                    <img
                      src={
                        fromUser?.avatar_url ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                      }
                      alt={fromUser?.username || 'Previous User'}
                      className="w-13 h-13 rounded-full object-cover ring-2 ring-slate-200 opacity-60"
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 mt-2 truncate max-w-full">
                    {fromUser ? `@${fromUser.username}` : 'Guest'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Previous</span>
                </div>

                {/* Animated Bridge / Transition Arrow */}
                <div className="flex flex-col items-center justify-center px-1">
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
                    className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-2xs"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </div>

                {/* Target / To User */}
                <div className="flex flex-col items-center w-24">
                  <div className="relative">
                    {/* Active Pulsing Ring */}
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.75, 0.35] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                      className="absolute -inset-1 rounded-full bg-indigo-500/25 blur-xs"
                    />

                    {/* Target Avatar */}
                    <motion.img
                      initial={{ scale: 0.85 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 14 }}
                      src={
                        targetUser.avatar_url ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                      }
                      alt={targetUser.username}
                      className="relative z-10 w-15 h-15 rounded-full object-cover ring-3 ring-indigo-600 shadow-md"
                    />

                    {/* Status Badge */}
                    <div className="absolute -bottom-1 -right-1 z-20 w-5.5 h-5.5 rounded-full bg-indigo-600 text-white flex items-center justify-center ring-2 ring-white shadow-xs">
                      {phase === 'ready' ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900 mt-2 truncate max-w-full">
                    @{targetUser.username}
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-indigo-600">
                    {targetUser.reputation_score ?? 1} rep
                  </span>
                </div>
              </div>

              {/* Status Message */}
              <div className="min-h-[50px] flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                  {phase === 'switching' ? (
                    <motion.div
                      key="msg-switching"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="space-y-0.5"
                    >
                      <h4 className="text-sm font-bold text-slate-900 font-sans">
                        Switching to @{targetUser.username}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                        <span>Restoring session credentials</span>
                        <span className="flex gap-0.5">
                          <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                          >
                            .
                          </motion.span>
                          <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                          >
                            .
                          </motion.span>
                          <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                          >
                            .
                          </motion.span>
                        </span>
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="msg-ready"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-0.5"
                    >
                      <h4 className="text-sm font-bold text-emerald-600 flex items-center justify-center gap-1.5 font-sans">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Welcome back, @{targetUser.username}!</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Redirecting to feed...
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Progress Track */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-4">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-indigo-600 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
