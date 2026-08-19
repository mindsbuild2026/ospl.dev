/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Floating/Fixed position Feedback Trigger Button.
 * Subtle, non-intrusive action button at the bottom-left corner of the viewport.
 */

import React from 'react';
import { MessageSquareHeart } from 'lucide-react';

interface FeedbackButtonProps {
  onClick: () => void;
}

export default function FeedbackButton({ onClick }: FeedbackButtonProps) {
  return (
    <button
      id="floating-feedback-btn"
      onClick={onClick}
      className="fixed bottom-6 left-6 z-40 flex items-center gap-2 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:text-purple-600 dark:hover:text-purple-400 px-4 py-2.5 rounded-full text-xs font-sans font-semibold border border-neutral-200 dark:border-neutral-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
      aria-label="Give Feedback"
    >
      <MessageSquareHeart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
      <span>Feedback</span>
    </button>
  );
}
