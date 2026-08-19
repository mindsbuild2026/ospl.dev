/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Form validation and input sanitization
 */

import { PromptSubmissionPayload } from '../types';
import { VALIDATION } from './constants';

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate prompt submission form data
 */
export function validatePromptSubmission(payload: PromptSubmissionPayload): ValidationError[] {
  const errors: ValidationError[] = [];

  // Title validation
  if (!payload.title?.trim()) {
    errors.push({ field: 'title', message: 'Prompt title is required.' });
  } else if (payload.title.length > VALIDATION.MAX_TITLE_LENGTH) {
    errors.push({
      field: 'title',
      message: `Title cannot exceed ${VALIDATION.MAX_TITLE_LENGTH} characters.`,
    });
  }

  // Short description validation
  if (!payload.short_description?.trim()) {
    errors.push({ field: 'short_description', message: 'Short description is required.' });
  } else if (payload.short_description.length > VALIDATION.MAX_SUMMARY_LENGTH) {
    errors.push({
      field: 'short_description',
      message: `Summary cannot exceed ${VALIDATION.MAX_SUMMARY_LENGTH} characters.`,
    });
  }

  // Description validation
  if (!payload.description?.trim()) {
    errors.push({ field: 'description', message: 'Detailed description is required.' });
  } else if (payload.description.length < VALIDATION.MIN_DESCRIPTION_LENGTH) {
    errors.push({
      field: 'description',
      message: `Description must be at least ${VALIDATION.MIN_DESCRIPTION_LENGTH} characters.`,
    });
  }

  // Category validation
  if (!payload.category_id) {
    errors.push({ field: 'category_id', message: 'Please choose a category.' });
  }

  // Author validation
  if (!payload.author_id) {
    errors.push({ field: 'author_id', message: 'Please choose an author.' });
  }

  // System prompt validation
  if (!payload.system_prompt?.trim()) {
    errors.push({ field: 'system_prompt', message: 'System prompt is required.' });
  }

  // User prompt validation
  if (!payload.user_prompt?.trim()) {
    errors.push({ field: 'user_prompt', message: 'User prompt is required.' });
  }

  // AI platforms validation
  if (!payload.ai_platform_ids?.length) {
    errors.push({ field: 'ai_platform_ids', message: 'Select at least one AI platform.' });
  }

  // Tags validation
  if (!payload.tag_ids?.length) {
    errors.push({ field: 'tag_ids', message: 'Add at least one tag.' });
  }

  // Recommended models validation
  if (
    !payload.recommended_models?.length ||
    !payload.recommended_models.some((model) => model.name?.trim() && model.provider?.trim())
  ) {
    errors.push({
      field: 'recommended_models',
      message: 'Add at least one recommended model with provider.',
    });
  }

  // Variables validation
  if (
    !payload.variables?.length ||
    !payload.variables.some((variable) => variable.name?.trim() && variable.label?.trim())
  ) {
    errors.push({
      field: 'variables',
      message: 'Provide at least one prompt variable with a name and label.',
    });
  }

  // Usage instructions validation
  if (
    !payload.usage_instructions?.length ||
    !payload.usage_instructions.some((instruction) => instruction?.trim())
  ) {
    errors.push({
      field: 'usage_instructions',
      message: 'Provide at least one usage instruction.',
    });
  }

  // Examples validation
  if (
    !payload.examples?.length ||
    !payload.examples.some((example) => example.title?.trim() && example.input?.trim() && example.output?.trim())
  ) {
    errors.push({
      field: 'examples',
      message: 'Provide at least one example with title, input, and output.',
    });
  }

  return errors;
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize user input to prevent XSS
 * Note: This is a basic sanitization. For production, use DOMPurify library
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, VALIDATION.MAX_SLUG_LENGTH);
}

/**
 * Convert validation errors to map for quick lookup
 */
export function errorsToMap(errors: ValidationError[]): Record<string, string> {
  return errors.reduce<Record<string, string>>((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {});
}
