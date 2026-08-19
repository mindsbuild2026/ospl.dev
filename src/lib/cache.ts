/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Simple in-memory cache for API responses with TTL support
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

class Cache {
  private store: Map<string, CacheEntry<any>> = new Map();
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const ttlMs = ttlSeconds * 1000;
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });

    // Auto-expire after TTL
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlMs);

    this.timers.set(key, timer);
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      this.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.store.delete(key);
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  clear(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.store.clear();
    this.timers.clear();
  }
}

export const apiCache = new Cache();
