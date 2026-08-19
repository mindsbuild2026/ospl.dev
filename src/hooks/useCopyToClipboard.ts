/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * useCopyToClipboard - Clipboard interaction hook with fallback
 */

import { useState, useCallback } from 'react';
import { CLIPBOARD_TIMEOUT, ERROR_MESSAGES } from '../lib/constants';

interface CopyState {
  copiedId: string | null;
  error: string | null;
}

/**
 * Hook for copying text to clipboard with fallback and success tracking
 * @param timeout - Time in ms before clearing the "copied" state
 */
export function useCopyToClipboard(timeout: number = CLIPBOARD_TIMEOUT) {
  const [state, setState] = useState<CopyState>({ copiedId: null, error: null });

  const copy = useCallback(
    async (id: string, text: string) => {
      setState({ copiedId: null, error: null });

      try {
        // Try modern Clipboard API first
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          setState({ copiedId: id, error: null });
          setTimeout(() => setState({ copiedId: null, error: null }), timeout);
          return;
        }

        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);

        try {
          textArea.select();
          const success = document.execCommand('copy');
          if (success) {
            setState({ copiedId: id, error: null });
            setTimeout(() => setState({ copiedId: null, error: null }), timeout);
          } else {
            setState({ copiedId: null, error: ERROR_MESSAGES.UNABLE_TO_COPY });
          }
        } finally {
          document.body.removeChild(textArea);
        }
      } catch (err) {
        console.error('Clipboard error:', err);
        setState({ copiedId: null, error: ERROR_MESSAGES.UNABLE_TO_COPY });
      }
    },
    [timeout],
  );

  const reset = useCallback(() => {
    setState({ copiedId: null, error: null });
  }, []);

  return {
    copiedId: state.copiedId,
    error: state.error,
    copy,
    reset,
    isCopied: (id: string) => state.copiedId === id,
  };
}
