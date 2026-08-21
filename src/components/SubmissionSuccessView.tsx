/**
 * SubmissionSuccessView Component
 * Dedicated post-submission confirmation screen for non-admin users.
 * Displays reassuring status messaging and real submission metadata.
 */

import React from 'react';
import { Prompt } from '../types';
import { CheckCircle2, Clock, ShieldCheck, ArrowRight, Compass, LayoutDashboard, Sparkles } from 'lucide-react';

export interface SubmissionSuccessViewProps {
  prompt: Prompt;
  onGoToExplore: () => void;
  onViewMySubmissions: () => void;
}

export default function SubmissionSuccessView({
  prompt,
  onGoToExplore,
  onViewMySubmissions,
}: SubmissionSuccessViewProps) {
  // Format submission date
  const dateFormatted = prompt.createdAt
    ? new Date(prompt.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

  // Prompt type display
  const promptTypeDisplay =
    prompt.creatorMode === 'developer' || prompt.prompt_mode === 'developer_pro'
      ? 'Developer Pro Workflow'
      : 'Casual Creator Prompt';

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 select-none">
      <div className="max-w-2xl w-full space-y-8 bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200/80 dark:border-neutral-800 p-8 sm:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
        
        {/* Decorative Top Accent Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header Icon & Confirmation */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400 mb-2 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Prompt Submitted Successfully!
          </h1>

          {/* Reassuring Banner Notice */}
          <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-4 sm:p-5 text-left flex items-start gap-3.5">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
              <span className="font-bold">Your prompt is now waiting for admin review.</span>
              <p className="mt-0.5 text-amber-800/90 dark:text-amber-300/90">
                Once approved, it will be published and available to everyone on OSPL.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Submitted Prompt Metadata Card */}
        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-6 border border-neutral-200/60 dark:border-neutral-800 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200/60 dark:border-neutral-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Submission Details</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Clock className="w-3.5 h-3.5" />
              Pending Review
            </span>
          </div>

          <div className="space-y-3.5 text-xs sm:text-sm">
            {/* Title */}
            <div>
              <span className="text-neutral-400 text-xs font-medium block mb-1">Prompt Title</span>
              <h3 className="font-bold text-neutral-900 dark:text-white text-base leading-snug">
                {prompt.title}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* Type */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 border border-neutral-200/60 dark:border-neutral-800">
                <span className="text-[11px] text-neutral-400 block font-medium">Prompt Type</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200 text-xs flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  {promptTypeDisplay}
                </span>
              </div>

              {/* Submission Date */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 border border-neutral-200/60 dark:border-neutral-800">
                <span className="text-[11px] text-neutral-400 block font-medium">Submitted On</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs mt-0.5 block">
                  {dateFormatted}
                </span>
              </div>

              {/* AI Validation Status */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 border border-neutral-200/60 dark:border-neutral-800">
                <span className="text-[11px] text-neutral-400 block font-medium">AI Validation</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Passed AI Check
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          {/* Primary Action: Go to Explore */}
          <button
            type="button"
            onClick={onGoToExplore}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Go to Explore</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Optional Action: View My Submissions */}
          <button
            type="button"
            onClick={onViewMySubmissions}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-sm transition-all cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>View My Submissions</span>
          </button>
        </div>

      </div>
    </div>
  );
}
