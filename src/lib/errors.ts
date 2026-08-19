/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Error handling and user-friendly error messages
 */

import { ERROR_MESSAGES } from './constants';

export class PromptHubError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public userMessage: string = message,
  ) {
    super(message);
    this.name = 'PromptHubError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Extract a meaningful technical message from Error, Supabase, PostgREST,
 * network, or plain API error shapes without leaking "[object Object]".
 */
export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred.'): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === 'string') {
    return error || fallback;
  }

  if (!isRecord(error)) {
    return fallback;
  }

  const directMessageKeys = ['message', 'error_description', 'msg', 'statusText'];
  for (const key of directMessageKeys) {
    const value = error[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  const nestedError = error.error;
  if (nestedError && nestedError !== error) {
    const nestedMessage = getErrorMessage(nestedError, '');
    if (nestedMessage) return nestedMessage;
  }

  const details = ['code', 'details', 'hint']
    .map((key) => error[key])
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()));

  if (details.length > 0) {
    return details.join(' - ');
  }

  try {
    const serialized = JSON.stringify(error);
    return serialized && serialized !== '{}' ? serialized : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Convert errors to user-friendly messages
 */
export function getUserFriendlyMessage(
  error: unknown,
  fallback = 'An unexpected error occurred. Please try again.',
): string {
  if (error instanceof PromptHubError) {
    logError(error.code, error);
    return error.userMessage;
  }

  const technicalMessage = getErrorMessage(error, fallback);
  logError('HANDLED_ERROR', error);

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'You appear to be offline. Check your internet connection and try again.';
  }

  const normalized = technicalMessage.toLowerCase();

  if (
    normalized.includes('supabase is not configured') ||
    normalized.includes('vite_supabase_url') ||
    normalized.includes('vite_supabase_anon_key')
  ) {
    return ERROR_MESSAGES.SUPABASE_NOT_CONFIGURED;
  }

  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('networkerror') ||
    normalized.includes('network error') ||
    normalized.includes('load failed') ||
    normalized.includes('timeout')
  ) {
    return 'Unable to reach the backend right now. Check your connection and try again.';
  }

  if (
    normalized.includes('jwt') ||
    normalized.includes('auth') ||
    normalized.includes('unauthorized') ||
    normalized.includes('not authorized') ||
    normalized.includes('permission denied') ||
    normalized.includes('row-level security') ||
    normalized.includes('rls')
  ) {
    return 'You do not have permission to complete this action. Sign in again or contact an administrator.';
  }

  if (normalized.includes('duplicate') || normalized.includes('unique constraint')) {
    return 'A record with the same unique value already exists. Change the title or related field and try again.';
  }

  if (normalized.includes('foreign key') || normalized.includes('violates foreign key constraint')) {
    return 'One of the selected options is no longer available. Refresh the form and try again.';
  }

  return fallback;
}

/**
 * Assert no error from Supabase responses
 */
export function assertNoError(error: unknown, userMessage: string, code: string = 'SUPABASE_ERROR'): void {
  if (error) {
    const technicalMessage = getErrorMessage(error, userMessage);
    throw new PromptHubError(technicalMessage, code, userMessage);
  }
}

/**
 * Wraps async operations with error handling
 */
export async function safeAsync<T>(
  promise: Promise<T>,
  errorMessage: string = 'Operation failed',
): Promise<[T | null, Error | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (err) {
    const error = err instanceof Error ? err : new Error(getErrorMessage(err));
    console.error(errorMessage, error);
    return [null, error];
  }
}

/**
 * Log errors with context
 */
export function logError(context: string, error: unknown): void {
  const message = getErrorMessage(error);
  console.warn(`[${context}] ${message}`, error);
}
