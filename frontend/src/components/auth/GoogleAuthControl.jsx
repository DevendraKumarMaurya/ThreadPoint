import React from 'react';
import { Sparkles } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function GoogleAuthControl({
  onSuccess,
  onError,
  onMockGoogle,
  text = 'continue_with',
  devButtonText = 'Dev: Quick Google Login',
  size = 'large',
}) {
  return (
    <div className="mb-5 space-y-2.5">
      <div className="w-full flex justify-center">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          theme="outline"
          size={size}
          shape="pill"
          text={text}
          width="100%"
        />
      </div>
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={onMockGoogle}
          className="text-[11px] font-mono text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>{devButtonText}</span>
        </button>
      </div>
    </div>
  );
}
