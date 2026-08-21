/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * User Feedback Modal component.
 * Fast, non-intrusive modal for submitting bug reports, feature requests, and general feedback.
 */

import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Star, X, CheckCircle, AlertCircle, Loader2, MessageSquareHeart } from 'lucide-react';
import { CreateFeedbackPayload, FeedbackType } from '../../types';
import { submitFeedback } from '../../lib/feedbackService';
import { validateFeedbackForm } from '../../lib/feedbackValidation';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  authorName?: string;
}

const FEEDBACK_OPTIONS: { type: FeedbackType; label: string; description: string }[] = [
  { type: 'bug', label: 'Bug Report', description: 'Something is broken or not working as expected' },
  { type: 'feature', label: 'Feature Request', description: 'Suggest a new capability or enhancement' },
  { type: 'improvement', label: 'Improvement', description: 'Tweak an existing feature to work better' },
  { type: 'general', label: 'General Feedback', description: 'Share your general thoughts or experience' },
  { type: 'other', label: 'Other', description: 'Anything else on your mind' },
];

export default function FeedbackModal({ isOpen, onClose, user, authorName }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [contactEmail, setContactEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isAuthenticated = Boolean(user?.id);
  const displayName = authorName || user?.email || 'Authenticated User';

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting]);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setFieldErrors({});
      setIsSubmitted(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setError(null);
    setFieldErrors({});

    const payload: CreateFeedbackPayload = {
      type: feedbackType,
      message,
      rating,
      contact_email: contactEmail ? contactEmail.trim() : null,
      is_anonymous: isAuthenticated ? isAnonymous : true,
    };

    // Client-side pre-validation
    const validation = validateFeedbackForm(payload);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitFeedback(payload, user);

      if (result.success) {
        setIsSubmitted(true);
        // Clear message & state after successful submission
        setMessage('');
        setRating(null);
        setContactEmail('');
      } else {
        setError(result.error || 'Failed to submit feedback. Please try again.');
      }
    } catch (err) {
      console.error('[FeedbackModal] Error submitting feedback:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <h2 id="feedback-modal-title" className="text-lg font-bold font-display leading-tight">
                Send Feedback
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Help us improve OSPL with your input
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isSubmitted ? (
            <div className="py-8 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center animate-in zoom-in-75 duration-300">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white">
                  Thanks for your feedback!
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto">
                  We appreciate your thoughts. Your feedback helps us build a better experience for everyone.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="mt-4 px-6 py-2.5 bg-brand-accent hover:bg-brand-hover text-white rounded-xl text-sm font-semibold transition-all shadow-md cursor-pointer"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* General Submission Error Alert */}
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Feedback Type Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                  Feedback Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FEEDBACK_OPTIONS.map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => {
                        setFeedbackType(opt.type);
                        setFieldErrors((prev) => ({ ...prev, type: '' }));
                      }}
                      className={`px-3 py-2.5 rounded-xl border text-left transition-all text-xs font-medium cursor-pointer flex flex-col justify-between ${
                        feedbackType === opt.type
                          ? 'border-purple-600 dark:border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <span className="font-bold">{opt.label}</span>
                    </button>
                  ))}
                </div>
                {fieldErrors.type && <p className="mt-1 text-xs text-red-500">{fieldErrors.type}</p>}
              </div>

              {/* Feedback Message */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="feedback-message" className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    Feedback Message <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[11px] ${message.length > 2000 ? 'text-red-500 font-bold' : 'text-neutral-400'}`}>
                    {message.length} / 2000
                  </span>
                </div>
                <textarea
                  id="feedback-message"
                  rows={4}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (fieldErrors.message) {
                      setFieldErrors((prev) => ({ ...prev, message: '' }));
                    }
                  }}
                  placeholder="Tell us what you like, what went wrong, or what feature you'd love to see..."
                  className={`w-full p-3.5 rounded-xl border bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none transition-all resize-none ${
                    fieldErrors.message
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-neutral-200 dark:border-neutral-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                  }`}
                />
                {fieldErrors.message && <p className="mt-1 text-xs text-red-500">{fieldErrors.message}</p>}
              </div>

              {/* Optional Rating */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                  Rating <span className="text-neutral-400 font-normal capitalize">(Optional)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(rating === star ? null : star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-transform active:scale-95 cursor-pointer focus:outline-none"
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= (hoverRating ?? rating ?? 0)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-neutral-300 dark:text-neutral-700'
                        }`}
                      />
                    </button>
                  ))}
                  {rating && (
                    <button
                      type="button"
                      onClick={() => setRating(null)}
                      className="ml-2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* User Identity / Contact Email */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700/60">
                      <span>
                        Submitting as <strong className="text-neutral-900 dark:text-neutral-200">{displayName}</strong>
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="rounded text-purple-600 focus:ring-purple-500 rounded-md"
                        />
                        <span>Submit anonymously</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                      Contact Email <span className="text-neutral-400 font-normal capitalize">(Optional)</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => {
                        setContactEmail(e.target.value);
                        if (fieldErrors.contact_email) {
                          setFieldErrors((prev) => ({ ...prev, contact_email: '' }));
                        }
                      }}
                      placeholder="you@example.com (if you'd like us to follow up)"
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none transition-all ${
                        fieldErrors.contact_email
                          ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-neutral-200 dark:border-neutral-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                      }`}
                    />
                    {fieldErrors.contact_email && (
                      <p className="mt-1 text-xs text-red-500">{fieldErrors.contact_email}</p>
                    )}
                    <p className="mt-1 text-[11px] text-neutral-400">
                      Leaving this blank will record your feedback anonymously.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-brand-accent hover:bg-brand-hover active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-md shadow-brand-accent/20 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Feedback</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
