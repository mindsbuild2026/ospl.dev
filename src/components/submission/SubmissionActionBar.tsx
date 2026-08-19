/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SubmissionActionBar Component
 * Bottom action bar following Reference Image #1 & #2 layout.
 */

import React from 'react';
import { Save, Send, Loader2 } from 'lucide-react';

export interface SubmissionActionBarProps {
  onClearDraft: () => void;
  onSaveDraft: () => void;
  onReviewSubmission: (e?: React.FormEvent) => void;
  isSubmitting?: boolean;
  showDraftSaved?: boolean;
}

export function SubmissionActionBar({
  onClearDraft,
  onSaveDraft,
  onReviewSubmission,
  isSubmitting = false,
  showDraftSaved = false,
}: SubmissionActionBarProps) {
  return (
    <div className="sticky bottom-0 z-30 w-full border-t border-neutral-200/80 bg-white/95 backdrop-blur-md px-4 py-4 dark:border-neutral-800/80 dark:bg-neutral-950/95 transition-colors">
      <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={onClearDraft}
            className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors px-2 py-1.5"
          >
            Clear Draft
          </button>
          
          <button
            type="button"
            onClick={onSaveDraft}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-250 bg-white px-4 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-850 transition-all shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{showDraftSaved ? '✓ Saved!' : 'Save Draft'}</span>
          </button>
        </div>

        {/* Center Copyright Notice */}
        {/* <div className="hidden md:block text-[11px] font-bold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider">
          © 2026 PROMPTHUB. ALL RIGHTS RESERVED.
        </div> */}

        {/* Right Primary Action */}
        <div className="w-full sm:w-auto flex justify-end">
          <button
            type="button"
            onClick={onReviewSubmission}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-neutral-950 px-7 py-3 text-xs font-bold text-white shadow-md hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span>Review Submission</span>
                <Send className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
