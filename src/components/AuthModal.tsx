/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  signInWithGithub: () => Promise<void>;
}

export default function AuthModal({
  isOpen,
  onClose,
  signInWithGithub,
}: AuthModalProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset modal state on open/close
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOAuthSubmit = async () => {
    setErrorMessage('');
    setStatus('loading');
    try {
      await signInWithGithub();
      // OAuth redirects the page, so no need to reset loading state unless it fails immediately
    } catch (err) {
      console.error('[AuthModal] GitHub sign in error:', err);
      const message = err instanceof Error ? err.message : 'Failed to connect with GitHub. Please try again.';
      setErrorMessage(message);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={status === 'loading' ? undefined : onClose}
        className="absolute inset-0 bg-neutral-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-neutral-200/50 bg-white/95 p-6 shadow-2xl backdrop-blur-md transition-all dark:border-neutral-800/80 dark:bg-neutral-950/95 md:p-8 animate-in fade-in-50 zoom-in-95 duration-200">
        
        {/* Close Button */}
        {status !== 'loading' && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-450 hover:bg-neutral-100 hover:text-brand-text transition-colors dark:text-neutral-500 dark:hover:bg-neutral-900 dark:hover:text-white"
            aria-label="Close auth dialog"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Logo and Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 bg-brand-accent/10 px-3 py-1.5 rounded-full border border-brand-accent/20 mb-3.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand-accent">PromptHub Creator Auth</span>
          </div>
          <h2 className="font-display text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Welcome to PromptHub</h2>
          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-450 max-w-[280px]">
            Sign in with GitHub to submit prompt templates, manage your creator profile, and sync settings.
          </p>
        </div>

        {/* Error Banners */}
        {status === 'error' && errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50/50 p-3.5 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* GitHub Login Button */}
        <div className="space-y-3">
          <button
            type="button"
            disabled={status === 'loading'}
            onClick={handleOAuthSubmit}
            className="w-full relative flex items-center justify-center gap-3.5 rounded-xl border border-neutral-250 bg-black text-white hover:bg-neutral-800 dark:border-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-105 px-4 py-3.5 text-sm font-bold transition disabled:opacity-50 cursor-pointer shadow-md active:scale-[0.99]"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Connecting to GitHub...</span>
              </>
            ) : (
              <>
                {/* Inline GitHub Logo */}
                <svg className="h-4.5 w-4.5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                <span>Continue with GitHub</span>
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center">
          <p className="text-[10px] text-neutral-450 dark:text-neutral-500 leading-relaxed">
            By signing in, you agree to our Terms of Service. GitHub is our sole authentication provider to ensure codebase-verified prompt attribution.
          </p>
        </div>

      </div>
    </div>
  );
}
