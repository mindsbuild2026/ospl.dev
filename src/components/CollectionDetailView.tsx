/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CollectionDetailView - Dedicated detail page for a prompt collection.
 */

import React from 'react';
import { ArrowLeft, Folder, Sparkles, Eye, Copy, CheckCircle } from 'lucide-react';
import { CollectionDetail, PromptCard } from '../types';
import { ErrorAlert, LoadingSpinner, ImageWithFallback, EmptyState } from './shared';
import { formatCompactNumber, getPlatformCode, getPrimaryPlatform } from '../lib/promptSchema';

interface CollectionDetailViewProps {
  collection: CollectionDetail | null;
  prompts: PromptCard[];
  isLoading: boolean;
  error?: string | null;
  onBack: () => void;
  onPromptClick: (id: string) => void;
}

export default function CollectionDetailView({
  collection,
  prompts,
  isLoading,
  error,
  onBack,
  onPromptClick,
}: CollectionDetailViewProps) {
  if (isLoading) {
    return <LoadingSpinner label="Loading collection details" fullHeight={false} />;
  }

  if (error) {
    return <ErrorAlert message={error} title="Collection error" />;
  }

  if (!collection) {
    return (
      <div className="w-full py-20 px-4 md:px-8 mx-auto max-w-4xl text-center">
        <h2 className="font-display text-3xl font-bold text-brand-text dark:text-white">Collection not found</h2>
        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">The collection may be missing, deleted, or the ID is invalid.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-8 px-5 py-3 rounded-full bg-brand-accent text-white font-semibold text-xs uppercase tracking-wide transition hover:bg-brand-hover"
        >
          Back to Browse
        </button>
      </div>
    );
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

      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] items-start">
        <div className="space-y-6">
          <div className="rounded-[32px] overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <ImageWithFallback
              src={collection.imageUrl || undefined}
              alt={`Banner for ${collection.name}`}
              className="w-full min-h-[320px] object-cover"
            />
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-accent">Collection overview</span>
              <h1 className="font-display text-4xl font-bold text-brand-text dark:text-white">{collection.name}</h1>
              <p className="max-w-3xl text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{collection.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-5 text-sm">
                <p className="text-neutral-500 uppercase tracking-[0.18em] text-[11px]">Prompts</p>
                <p className="mt-3 font-semibold text-brand-text dark:text-white text-2xl">{prompts.length}</p>
              </div>
              <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-5 text-sm">
                <p className="text-neutral-500 uppercase tracking-[0.18em] text-[11px]">Category</p>
                <p className="mt-3 font-semibold text-brand-text dark:text-white text-base">{collection.categoryId || 'General'}</p>
              </div>
              <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-5 text-sm">
                <p className="text-neutral-500 uppercase tracking-[0.18em] text-[11px]">Updated</p>
                <p className="mt-3 font-semibold text-brand-text dark:text-white text-base">{collection.updatedAt ? new Date(collection.updatedAt).toLocaleDateString() : 'Unknown'}</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-6">
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-neutral-500">Collection details</span>
            <div className="mt-5 space-y-4 text-sm text-neutral-600 dark:text-neutral-300">
              <p><span className="font-semibold">Slug:</span> {collection.slug}</p>
              <p><span className="font-semibold">ID:</span> {collection.id}</p>
              <p><span className="font-semibold">Prompt count:</span> {collection.promptCount}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-6">
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-neutral-500">Why this collection</span>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              Carefully curated prompts in this collection are grouped by workflow, focus, or AI use case so you can find what matters fast.
            </p>
          </div>
        </aside>
      </div>

      <section className="mt-16">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-brand-text dark:text-white">Collection prompts</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{prompts.length} prompt templates included in this collection.</p>
          </div>
        </div>

        {prompts.length === 0 ? (
          <EmptyState type="no-prompts" compact />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {prompts.map((prompt) => (
              <button
                type="button"
                key={prompt.id}
                onClick={() => onPromptClick(prompt.id)}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[28px] p-6 text-left shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4 gap-3">
                  <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-950 text-[11px] uppercase tracking-[0.24em] font-semibold text-neutral-500">{prompt.category}</span>
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs">{formatCompactNumber(prompt.stats.views)}</span>
                  </div>
                </div>
                <h3 className="font-display text-xl font-bold text-brand-text dark:text-white mb-3 leading-tight">{prompt.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-3 mb-4">{prompt.shortDescription}</p>
                <div className="flex flex-wrap gap-2">
                  {prompt.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[11px] uppercase tracking-[0.24em] text-neutral-500 bg-neutral-100 dark:bg-neutral-950 rounded-full px-3 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between gap-3 text-xs text-neutral-500">
                  <span className="inline-flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> {prompt.results.hasProof ? 'Has proof' : 'No proof'}</span>
                  <span className="inline-flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> {prompt.verified ? 'Verified' : 'Community'}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
