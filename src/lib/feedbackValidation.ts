/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Validation functions for user feedback submission.
 */

import { CreateFeedbackPayload, FeedbackType } from '../types';

export const VALID_FEEDBACK_TYPES: FeedbackType[] = ['bug', 'feature', 'improvement', 'general', 'other'];

export interface FeedbackValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate email address format.
 */
export function isValidEmail(email: string): boolean {
  if (!email || !email.trim()) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate feedback submission payload.
 */
export function validateFeedbackForm(payload: CreateFeedbackPayload): FeedbackValidationResult {
  const errors: Record<string, string> = {};

  // 1. Feedback Type Validation
  if (!payload.type) {
    errors.type = 'Please select a feedback type.';
  } else if (!VALID_FEEDBACK_TYPES.includes(payload.type)) {
    errors.type = 'Invalid feedback type selected.';
  }

  // 2. Feedback Message Validation
  const messageTrimmed = (payload.message || '').trim();
  if (!messageTrimmed) {
    errors.message = 'Feedback message is required.';
  } else if (messageTrimmed.length < 5) {
    errors.message = 'Feedback message must be at least 5 characters long.';
  } else if (messageTrimmed.length > 2000) {
    errors.message = 'Feedback message cannot exceed 2,000 characters.';
  }

  // 3. Rating Validation (Optional)
  if (payload.rating !== undefined && payload.rating !== null) {
    if (!Number.isInteger(payload.rating) || payload.rating < 1 || payload.rating > 5) {
      errors.rating = 'Rating must be a number between 1 and 5.';
    }
  }

  // 4. Contact Email Validation (Optional)
  if (payload.contact_email && payload.contact_email.trim() !== '') {
    if (!isValidEmail(payload.contact_email)) {
      errors.contact_email = 'Please provide a valid email address.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
