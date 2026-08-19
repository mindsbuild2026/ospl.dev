/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SavedCollectionsView - Dedicated saved collections page for locally-saved prompt records.
 */

import React from 'react';
import { ArrowLeft, Bookmark, Eye, Copy, CheckCircle, Sparkles } from 'lucide-react';
import { PromptCard } from '../types';
import { ErrorAlert, LoadingSpinner } from './shared';
import { formatCompactNumber, getPlatformCode, getPrimaryPlatform } from '../lib/promptSchema';

interface SavedCollectionsViewProps {
  prompts: PromptCard[];
  savedCount: number;
  isLoading: boolean;
  error?: string | null;
  onBack: () => void;
  onPromptClick: (id: string) => void;
}

export default function SavedCollectionsView({
  prompts,
  savedCount,
  isLoading,
  error,
  onBack,
  onPromptClick,
}: SavedCollectionsViewProps) {
  if (isLoading) {
    return <LoadingSpinner label="Loading saved items" fullHeight={false} />;
  }

  if (error) {
    return <ErrorAlert message={error} title="Saved collections error" />;
  }

  return (
    <div className="w-full py-12 md:py-16 px-4 md:px-8 max-w-7xl mx-auto transition-colors duration-300">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-neutral-500 hover:text-brand-accent dark:text-neutral-400 dark:hover:text-brand-accent font-sans font-semibold text-xs uppercase tracking-wide mb-10 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Browse
      </button>

      <div className="rounded-[32px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#09090b] p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-accent">Saved Collections</span>
            <h1 className="font-display text-4xl font-bold text-brand-text dark:text-white mt-3">Your saved prompts</h1>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-2xl">
              Your saved prompts are securely stored in your Supabase backend account and synced across all your devices.
            </p>
          </div>
          <div className="rounded-3xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-5 text-sm">
            <div className="text-neutral-500 uppercase tracking-[0.24em] text-[11px]">Saved items</div>
            <div className="mt-3 text-3xl font-bold text-brand-text dark:text-white">{savedCount}</div>
          </div>
        </div>

        {prompts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-16 text-center">
            <Bookmark className="mx-auto h-10 w-10 text-brand-accent" />
            <h2 className="font-display text-2xl font-bold text-brand-text dark:text-white mt-5">No saved prompts yet</h2>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">Save prompts while browsing to build your own private collection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {prompts.map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                onClick={() => onPromptClick(prompt.id)}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[28px] p-6 text-left shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4 gap-3">
                  <span className="px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-[11px] uppercase tracking-[0.24em] font-semibold">Saved</span>
                  <div className="text-neutral-400 text-xs">{prompt.category}</div>
                </div>
                <h3 className="font-display text-xl font-bold text-brand-text dark:text-white mb-3 leading-tight">{prompt.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-3 mb-4">{prompt.shortDescription}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {prompt.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[11px] uppercase tracking-[0.24em] text-neutral-500 bg-neutral-100 dark:bg-neutral-950 rounded-full px-3 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span className="inline-flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> {formatCompactNumber(prompt.stats.copies)}</span>
                  <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {formatCompactNumber(prompt.stats.views)}</span>
                  <span className="inline-flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> {prompt.results.hasProof ? 'Proof' : 'No proof'}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
