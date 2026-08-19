/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * OAuth callback handler for GitHub authentication
 * This page is visited after user authenticates with GitHub
 */

import React, { useEffect, useState } from 'react';
import { handleOAuthCallback, getCurrentSession } from '../lib/authService';
import { LoadingSpinner } from './shared';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing GitHub authentication...');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const processCallback = async () => {
      try {
        console.log('[AuthCallback] Starting OAuth callback processing');

        const { session, error } = await handleOAuthCallback();

        if (!isMounted) return;

        if (error) {
          console.error('[AuthCallback] Callback error:', error);

          // Retry if session extraction fails (may be timing issue)
          if (retryCount < MAX_RETRIES) {
            console.log('[AuthCallback] Retrying session extraction...');
            setRetryCount(retryCount + 1);
            setMessage(`Verifying session (attempt ${retryCount + 2}/${MAX_RETRIES + 1})...`);

            // Wait and try again
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));

            if (!isMounted) return;

            const { session: retrySession, error: retryError } = await getCurrentSession();

            if (!isMounted) return;

            if (!retryError && retrySession) {
              console.log('[AuthCallback] Session recovered on retry');
              setStatus('success');
              setMessage('Authentication successful! Redirecting...');

              setTimeout(() => {
                if (isMounted) window.location.href = '/';
              }, 1500);
              return;
            }
          }

          setStatus('error');
          setMessage(`Authentication failed: ${error.message}`);
          return;
        }

        if (!session) {
          console.warn('[AuthCallback] No session returned');

          // Retry if session is null (may be timing issue)
          if (retryCount < MAX_RETRIES) {
            console.log('[AuthCallback] Retrying to get session...');
            setRetryCount(retryCount + 1);
            setMessage(`Verifying session (attempt ${retryCount + 2}/${MAX_RETRIES + 1})...`);

            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));

            if (!isMounted) return;

            const { session: retrySession } = await getCurrentSession();

            if (!isMounted) return;

            if (retrySession) {
              console.log('[AuthCallback] Session found on retry');
              setStatus('success');
              setMessage('Authentication successful! Redirecting...');

              setTimeout(() => {
                if (isMounted) window.location.href = '/';
              }, 1500);
              return;
            }
          }

          setStatus('error');
          setMessage('No session returned from authentication. Please try again.');
          return;
        }

        console.log('[AuthCallback] Session obtained successfully, user:', session.user?.id);
        setStatus('success');
        setMessage('Authentication successful! Redirecting...');

        // Redirect to home after a short delay
        setTimeout(() => {
          if (isMounted) window.location.href = '/';
        }, 1500);
      } catch (error) {
        if (!isMounted) return;

        console.error('[AuthCallback] Unexpected error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Unexpected error occurred. Please try again.');
      }
    };

    processCallback();

    return () => {
      isMounted = false;
    };
  }, [retryCount]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg dark:bg-brand-bg-dark p-4">
      <div className="max-w-md w-full rounded-xl border border-neutral-200/50 bg-white/95 dark:border-neutral-800/80 dark:bg-neutral-950/95 p-8 shadow-lg">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner label={message} />
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-4xl text-green-500">✓</div>
            <h2 className="text-xl font-bold text-brand-text dark:text-white">{message}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Redirecting you home...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-4xl text-red-500">✕</div>
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Authentication Failed</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{message}</p>
            <div className="flex gap-3 mt-4 w-full">
              <button
                onClick={() => {
                  setStatus('loading');
                  setMessage('Retrying...');
                  setRetryCount(0);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="flex-1 px-4 py-2 bg-brand-accent text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
