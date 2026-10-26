import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, ShieldCheck, ArrowRight, RotateCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { resendEmailOtp } from '../../api/client';

export default function OtpModal({
  isOpen,
  onClose,
  email,
  purpose = 'email_verification',
  onSuccess,
}) {
  const { verifyOtp } = useAuth();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(60);

  const inputRefs = useRef([]);

  // Reset state and autofocus on open
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setError('');
      setSuccessMsg('');
      setCooldown(60);
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);
    }
  }, [isOpen]);

  // Resend countdown timer
  useEffect(() => {
    if (!isOpen || cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, cooldown]);

  const handleChange = (index, value) => {
    setError('');
    const clean = value.replace(/\D/g, '');

    // Single digit input
    if (clean.length <= 1) {
      const nextDigits = [...digits];
      nextDigits[index] = clean;
      setDigits(nextDigits);

      if (clean && index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }

      // If last box filled, auto-submit
      if (clean && index === 5 && nextDigits.every(d => d !== '')) {
        submitOtp(nextDigits.join(''));
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const nextDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      nextDigits[i] = pasted[i] || '';
    }
    setDigits(nextDigits);

    if (pasted.length === 6) {
      submitOtp(pasted);
    } else {
      const nextIndex = Math.min(pasted.length, 5);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      }
    }
  };

  const submitOtp = async (codeToSubmit) => {
    const finalCode = codeToSubmit || digits.join('');
    if (finalCode.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await verifyOtp(email, finalCode, purpose);
      setSuccessMsg(res.message || 'Email verified successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess(res);
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');

    try {
      await resendEmailOtp(email, purpose);
      setCooldown(60);
      setSuccessMsg('New 6-digit verification code sent to your email.');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="otp-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <motion.div
            key="otp-modal-dialog"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-slate-50 to-indigo-50/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base font-sans">
                    Email Verification
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">One-Time Password (OTP)</span>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-3 shadow-xs">
                  <Mail className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Enter 6-Digit Code
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  We sent a temporary verification code to:
                  <span className="block font-semibold text-slate-800 mt-0.5">{email}</span>
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* 6 Digit Inputs */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 mb-6" onPaste={handlePaste}>
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={loading}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono font-bold text-xl sm:text-2xl rounded-xl border transition-all outline-none ${
                      digit
                        ? 'border-indigo-600 bg-indigo-50/30 text-indigo-900 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50/50 text-slate-800 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20'
                    }`}
                  />
                ))}
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => submitOtp()}
                disabled={loading || digits.some(d => !d)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Verifying Code...
                  </span>
                ) : (
                  <>
                    <span>Verify Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              {/* Resend Cooldown Counter */}
              <div className="text-center mt-5 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Didn't receive the email?{' '}
                  {cooldown > 0 ? (
                    <span className="font-mono text-slate-400 font-semibold">
                      Resend code in {Math.floor(cooldown / 60)}:{(cooldown % 60).toString().padStart(2, '0')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={resending}
                      onClick={handleResend}
                      className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                      {resending ? 'Sending...' : 'Resend Code Now'}
                    </button>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
