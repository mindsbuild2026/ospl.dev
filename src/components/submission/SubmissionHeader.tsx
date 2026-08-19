/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SubmissionHeader Component
 * Implements title, description, and segmented [ Casual Creator | Developer Pro ] control
 * matching Reference Image #1 and #2.
 */

import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';

export interface SubmissionHeaderProps {
  creatorMode: 'casual' | 'developer';
  onModeChange: (mode: 'casual' | 'developer') => void;
  onCancel: () => void;
}

export function SubmissionHeader({ creatorMode, onModeChange, onCancel }: SubmissionHeaderProps) {
  return (
    <div className="w-full text-center space-y-6 mb-10">
      {/* Back to Browse & Sub-badge */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Browse
        </button>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800/80 px-3 py-1 text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
          <Sparkles className="h-3.5 w-3.5 text-brand-accent" />
          <span>Submit Prompt Template</span>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div className="space-y-3 max-w-2xl mx-auto">
        <h1 className="font-display text-3xl md:text-4xl lg:text-[42px] font-extrabold text-neutral-900 dark:text-white tracking-tight leading-tight">
          Inspire the Community with Your Prompt
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
          Submit high-performance templates. Choose a creator mode tailored to your implementation style.
        </p>
      </div>

      {/* Segmented Creator-Mode Switcher */}
      <div className="pt-2 flex justify-center">
        <div className="inline-flex items-center rounded-full bg-neutral-200/60 dark:bg-neutral-800/70 p-1 border border-neutral-300/40 dark:border-neutral-700/40 shadow-inner">
          <button
            type="button"
            onClick={() => onModeChange('casual')}
            className={`rounded-full px-6 py-2.5 text-xs font-bold transition-all duration-200 ${
              creatorMode === 'casual'
                ? 'bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white shadow-sm ring-1 ring-black/5'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            Casual Creator
          </button>
          <button
            type="button"
            onClick={() => onModeChange('developer')}
            className={`rounded-full px-6 py-2.5 text-xs font-bold transition-all duration-200 ${
              creatorMode === 'developer'
                ? 'bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white shadow-sm ring-1 ring-black/5'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            Developer Pro
          </button>
        </div>
      </div>
    </div>
  );
}
