/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Application constants and configuration
 */

export const STORAGE_KEYS = {
  THEME: 'prompthub_theme',
  SUBMIT_DRAFT: 'prompthub_submit_prompt_draft',
} as const;

export const SORT_OPTIONS = [
  'Trending',
  'Most Popular',
  'Most Copied',
  'Most Viewed',
  'Highest Rated',
  'Most Bookmarked',
  'Most Discussed',
  'Newest',
  'Recently Updated',
  'A-Z',
] as const;

export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'] as const;

export const LICENSE_TYPES = ['MIT', 'Creative Commons', 'Proprietary'] as const;

export const DEFAULT_PAGINATION_LIMIT = 72;
export const DEFAULT_AVATAR = '/default-avatar.png';

export const DEBOUNCE_DELAY_SEARCH = 300;
export const DEBOUNCE_DELAY_FILTER = 300;
export const CLIPBOARD_TIMEOUT = 2000;

export const ERROR_MESSAGES = {
  SUPABASE_NOT_CONFIGURED: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  UNABLE_TO_LOAD_METADATA: 'Unable to load Supabase metadata.',
  UNABLE_TO_LOAD_PROMPTS: 'Unable to load prompt blueprints.',
  UNABLE_TO_LOAD_DETAILS: 'Unable to load prompt details.',
  UNABLE_TO_PUBLISH: 'Unable to publish prompt.',
  UNABLE_TO_COPY: 'Unable to copy to clipboard. Please try again.',
  INVALID_FORM_DATA: 'Please correct the highlighted fields before submitting.',
} as const;

export const VIEW_TYPES = {
  EXPLORE: 'explore',
  CATEGORIES: 'categories',
  COMMUNITY: 'community',
  DETAIL: 'detail',
  COLLECTION_DETAIL: 'collection-detail',
  SAVED_COLLECTIONS: 'saved-collections',
  SUBMIT: 'submit',
  SEO_CATEGORY: 'seo-category',
  PROFILE: 'profile',
  DASHBOARD: 'dashboard',
  PRIVACY_POLICY: 'privacy-policy',
  TERMS_AND_CONDITIONS: 'terms-and-conditions',
} as const;

export const VALIDATION = {
  MAX_TITLE_LENGTH: 120,
  MAX_SUMMARY_LENGTH: 250,
  MAX_SLUG_LENGTH: 80,
  MIN_DESCRIPTION_LENGTH: 10,
} as const;
