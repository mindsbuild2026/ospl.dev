/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * useDebounce and useThrottle - Value debouncing and throttling hooks
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Debounce hook - delays state update until value hasn't changed for specified duration
 * Useful for search inputs, filter changes
 * @param value - Value to debounce
 * @param delay - Debounce delay in milliseconds
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook - limits how often a callback can be executed
 * Useful for scroll, resize events
 * @param value - Value to throttle
 * @param delay - Throttle delay in milliseconds
 */
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdatedRef = React.useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now >= (lastUpdatedRef.current ?? 0) + delay) {
      lastUpdatedRef.current = now;
      setThrottledValue(value);
    } else {
      const handler = setTimeout(() => {
        lastUpdatedRef.current = Date.now();
        setThrottledValue(value);
      }, delay - (now - (lastUpdatedRef.current ?? 0)));

      return () => {
        clearTimeout(handler);
      };
    }
  }, [value, delay]);

  return throttledValue;
}

/**
 * Debounce callback hook - returns a debounced version of a callback
 * @param callback - Callback function to debounce
 * @param delay - Debounce delay in milliseconds
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
): (...args: Args) => void {
  const [, setNeedsCall] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref on every call
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Args) => {
      setNeedsCall(false);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );
}
