/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * useAsync - Generic async operation hook with loading, error, and data states
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  loading: boolean;
  data: T | null;
  error: Error | null;
}

export interface UseAsyncReturn<T> extends AsyncState<T> {
  execute: () => Promise<void>;
  reset: () => void;
}

/**
 * Generic hook for handling async operations with proper cleanup
 * @param asyncFunction - Async function to execute
 * @param immediate - Execute immediately on mount
 * @param dependencies - Effect dependencies (if any)
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true,
  dependencies: React.DependencyList = [],
): UseAsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    loading: immediate,
    data: null,
    error: null,
  });

  const isMountedRef = useRef(true);

  const execute = useCallback(async () => {
    setState({ loading: true, data: null, error: null });
    try {
      const result = await asyncFunction();
      if (isMountedRef.current) {
        setState({ loading: false, data: result, error: null });
      }
    } catch (err) {
      if (isMountedRef.current) {
        setState({
          loading: false,
          data: null,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setState({ loading: false, data: null, error: null });
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    if (immediate) {
      execute();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [immediate, execute]);

  return { ...state, execute, reset };
}

/**
 * Hook for async operations that should be canceled when dependencies change
 * Useful for search, filter operations that can be superseded
 */
export function useAbortableAsync<T>(
  asyncFunction: (signal: AbortSignal) => Promise<T>,
  immediate: boolean = true,
  dependencies: React.DependencyList = [],
): UseAsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    loading: immediate,
    data: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const execute = useCallback(async () => {
    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setState({ loading: true, data: null, error: null });

    try {
      const result = await asyncFunction(abortControllerRef.current.signal);
      if (isMountedRef.current && !abortControllerRef.current.signal.aborted) {
        setState({ loading: false, data: result, error: null });
      }
    } catch (err) {
      // Ignore abort errors
      if (
        isMountedRef.current &&
        abortControllerRef.current &&
        !abortControllerRef.current.signal.aborted
      ) {
        setState({
          loading: false,
          data: null,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({ loading: false, data: null, error: null });
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    if (immediate) {
      execute();
    }

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate, execute]);

  return { ...state, execute, reset };
}
