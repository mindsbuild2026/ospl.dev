/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Feedback service for submitting, reading, filtering, and updating user feedback.
 */

import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import {
  CreateFeedbackPayload,
  FeedbackFilters,
  FeedbackItem,
  FeedbackStatus,
  FeedbackSummaryMetrics,
} from '../types';
import { validateFeedbackForm } from './feedbackValidation';
import { assertNoError } from './errors';
import { ERROR_MESSAGES } from './constants';

const SUBMISSION_COOLDOWN_MS = 5000;
let lastSubmissionTimestamp = 0;

function requireSupabase() {
  if (!supabase) {
    throw new Error(ERROR_MESSAGES.SUPABASE_NOT_CONFIGURED);
  }
  return supabase;
}

/**
 * Submit feedback to Supabase.
 * Supports both authenticated users and anonymous submissions.
 */
export async function submitFeedback(
  payload: CreateFeedbackPayload,
  currentUser?: User | null,
): Promise<{ success: boolean; id?: string; error?: string }> {
  // 1. Anti-abuse rate limiting check
  const now = Date.now();
  if (now - lastSubmissionTimestamp < SUBMISSION_COOLDOWN_MS) {
    return {
      success: false,
      error: 'Please wait a few seconds before submitting feedback again.',
    };
  }

  // 2. Validate form payload
  const validation = validateFeedbackForm(payload);
  if (!validation.isValid) {
    const firstErrorKey = Object.keys(validation.errors)[0];
    return {
      success: false,
      error: validation.errors[firstErrorKey] || 'Validation failed. Please check your submission.',
    };
  }

  const db = requireSupabase();

  // 3. Determine identity & anonymity
  // If user is authenticated and is_anonymous is not explicitly true
  const isAuthenticated = Boolean(currentUser?.id);
  const isAnonSubmission = Boolean(payload.is_anonymous) || !isAuthenticated;

  const userId = isAnonSubmission ? null : currentUser?.id || null;
  const contactEmail = payload.contact_email?.trim() || null;

  try {
    const { data, error } = await db
      .from('feedback')
      .insert({
        user_id: userId,
        type: payload.type,
        message: payload.message.trim(),
        rating: payload.rating || null,
        contact_email: contactEmail,
        is_anonymous: isAnonSubmission,
        status: 'new',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[FeedbackService] Submission DB error:', error);
      return {
        success: false,
        error: 'Unable to save your feedback. Please try again later.',
      };
    }

    lastSubmissionTimestamp = Date.now();
    return {
      success: true,
      id: data?.id,
    };
  } catch (err) {
    console.error('[FeedbackService] Unexpected submission error:', err);
    return {
      success: false,
      error: 'An unexpected error occurred while saving feedback.',
    };
  }
}

/**
 * Fetch feedback items for Admin Panel with filters, search, and sorting.
 */
export async function getAdminFeedback(filters: FeedbackFilters = {}): Promise<FeedbackItem[]> {
  const db = requireSupabase();

  let query = db.from('feedback').select('*');

  // Filter: Status
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  // Filter: Type
  if (filters.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }

  // Filter: Rating
  if (filters.rating !== undefined && filters.rating !== 'all') {
    query = query.eq('rating', filters.rating);
  }

  // Filter: Auth state
  if (filters.authFilter === 'authenticated') {
    query = query.eq('is_anonymous', false).not('user_id', 'is', null);
  } else if (filters.authFilter === 'anonymous') {
    query = query.eq('is_anonymous', true);
  }

  // Filter: Date range
  if (filters.startDate) {
    query = query.gte('created_at', new Date(filters.startDate).toISOString());
  }
  if (filters.endDate) {
    // End of selected day
    const endOfDay = new Date(filters.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    query = query.lte('created_at', endOfDay.toISOString());
  }

  // Sorting
  switch (filters.sortBy) {
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'rating_desc':
      query = query.order('rating', { ascending: false, nullsFirst: false });
      break;
    case 'rating_asc':
      query = query.order('rating', { ascending: true, nullsFirst: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const { data, error } = await query;
  assertNoError(error, 'Failed to fetch feedback records');

  let items: FeedbackItem[] = data || [];

  // Fetch author details for authenticated submissions
  const userIds = Array.from(new Set(items.map((item) => item.user_id).filter((id): id is string => Boolean(id))));

  let authorMap: Record<string, { name: string; handle: string; avatar_url: string }> = {};

  if (userIds.length > 0) {
    const { data: authorsData } = await db
      .from('authors')
      .select('user_id, name, handle, avatar_url')
      .in('user_id', userIds);

    if (authorsData) {
      authorsData.forEach((a: any) => {
        if (a.user_id) {
          authorMap[a.user_id] = {
            name: a.name || a.handle || 'User',
            handle: a.handle || '',
            avatar_url: a.avatar_url || '',
          };
        }
      });
    }
  }

  // Map author profile info to feedback items
  items = items.map((item) => {
    const author = item.user_id ? authorMap[item.user_id] || null : null;
    return {
      ...item,
      author,
    };
  });

  // Client-side search filtering (search in name, message, contact email)
  if (filters.search && filters.search.trim()) {
    const searchLower = filters.search.trim().toLowerCase();
    items = items.filter((item) => {
      const matchMessage = item.message.toLowerCase().includes(searchLower);
      const matchEmail = (item.contact_email || '').toLowerCase().includes(searchLower);
      const matchAuthorName = (item.author?.name || '').toLowerCase().includes(searchLower);
      const matchAuthorHandle = (item.author?.handle || '').toLowerCase().includes(searchLower);
      return matchMessage || matchEmail || matchAuthorName || matchAuthorHandle;
    });
  }

  return items;
}

/**
 * Fetch summary metrics for Admin Dashboard cards.
 */
export async function getFeedbackSummaryMetrics(): Promise<FeedbackSummaryMetrics> {
  const db = requireSupabase();

  const { data, error } = await db.from('feedback').select('status, type, rating, is_anonymous');
  assertNoError(error, 'Failed to fetch feedback metrics');

  const records = data || [];
  const total = records.length;
  const newCount = records.filter((r) => r.status === 'new').length;
  const bugsCount = records.filter((r) => r.type === 'bug').length;
  const featureRequestsCount = records.filter((r) => r.type === 'feature').length;
  const anonymousCount = records.filter((r) => r.is_anonymous).length;

  const ratedRecords = records.filter((r) => r.rating !== null && r.rating !== undefined && r.rating > 0);
  const ratingSum = ratedRecords.reduce((acc, r) => acc + (r.rating || 0), 0);
  const averageRating = ratedRecords.length > 0 ? Number((ratingSum / ratedRecords.length).toFixed(1)) : null;

  return {
    total,
    newCount,
    bugsCount,
    featureRequestsCount,
    anonymousCount,
    averageRating,
  };
}

/**
 * Update status of a feedback item (e.g. reviewed, in_progress, resolved, archived).
 */
export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
  adminNotes?: string,
): Promise<{ success: boolean; error?: string }> {
  const db = requireSupabase();

  const updateData: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (adminNotes !== undefined) {
    updateData.admin_notes = adminNotes;
  }

  const { error } = await db.from('feedback').update(updateData).eq('id', id);

  if (error) {
    console.error('[FeedbackService] Update status error:', error);
    return { success: false, error: 'Failed to update feedback status' };
  }

  return { success: true };
}

/**
 * Update admin notes for a feedback item.
 */
export async function updateFeedbackNotes(
  id: string,
  adminNotes: string,
): Promise<{ success: boolean; error?: string }> {
  const db = requireSupabase();

  const { error } = await db
    .from('feedback')
    .update({
      admin_notes: adminNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('[FeedbackService] Update notes error:', error);
    return { success: false, error: 'Failed to save admin notes' };
  }

  return { success: true };
}
