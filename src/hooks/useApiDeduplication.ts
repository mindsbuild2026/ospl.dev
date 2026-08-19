/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hook for deduplicating concurrent API requests
 */

import { useRef } from 'react';

interface PendingRequest<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

export function useApiDeduplication() {
  const pendingRequests = useRef<Map<string, PendingRequest<any>>>(new Map());

  /**
   * Execute a request and deduplicate concurrent calls with the same key
   */
  const deduplicate = async <T,>(
    key: string,
    request: () => Promise<T>,
  ): Promise<T> => {
    // If there's already a pending request with this key, return its promise
    const existing = pendingRequests.current.get(key);
    if (existing) {
      console.log(`[Dedup] Reusing pending request for key: ${key}`);
      return existing.promise;
    }

    // Create a new pending request
    let resolve!: (value: T) => void;
    let reject!: (reason?: any) => void;

    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const pending: PendingRequest<T> = { promise, resolve, reject };
    pendingRequests.current.set(key, pending);

    try {
      console.log(`[Dedup] Starting request for key: ${key}`);
      const result = await request();
      resolve(result);
      return result;
    } catch (error) {
      reject(error);
      throw error;
    } finally {
      pendingRequests.current.delete(key);
    }
  };

  return { deduplicate };
}
