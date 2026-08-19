/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * useCopyToClipboard - Clipboard interaction hook with fallback
 */

import { useState, useCallback } from 'react';
import { CLIPBOARD_TIMEOUT, ERROR_MESSAGES } from '../lib/constants';
import { copyTextToClipboard } from '../lib/clipboardService';

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
    async (id: string, text: string): Promise<boolean> => {
      setState({ copiedId: null, error: null });

      const success = await copyTextToClipboard(text);
      if (success) {
        setState({ copiedId: id, error: null });
        setTimeout(() => setState({ copiedId: null, error: null }), timeout);
        return true;
      } else {
        setState({ copiedId: null, error: ERROR_MESSAGES.UNABLE_TO_COPY });
        return false;
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
