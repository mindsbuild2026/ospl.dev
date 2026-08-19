/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Trending prompts display component
 * All sorting is performed by Supabase - component only renders pre-sorted data
 */

import React, { useState } from 'react';
import { PromptCard } from '../types';
import { Clipboard, Check, ArrowRight, Eye, Flame, Award, Calendar } from 'lucide-react';
import { EmptyState } from './shared';

import { PromptCardItem } from './PromptCardItem';

interface TrendingTodayProps {
  mostCopiedPrompts: PromptCard[];
  fastestGrowingPrompts: PromptCard[];
  highestRatedPrompts: PromptCard[];
  newestPrompts: PromptCard[];
  onPromptClick: (id: string) => void;
}

export default function TrendingToday({
  mostCopiedPrompts,
  fastestGrowingPrompts,
  highestRatedPrompts,
  newestPrompts,
  onPromptClick,
}: TrendingTodayProps) {
  const [activeTab, setActiveTab] = useState<'copied' | 'growing' | 'rated' | 'new'>('copied');

  // All data comes pre-sorted from Supabase - no client-side sorting
  const getFilteredList = () => {
    switch (activeTab) {
      case 'copied':
        return mostCopiedPrompts;
      case 'growing':
        return fastestGrowingPrompts;
      case 'rated':
        return highestRatedPrompts;
      case 'new':
        return newestPrompts;
    }
  };

  const tabsInfo = [
    { id: 'copied', label: 'Most Copied', icon: <Clipboard className="w-4 h-4" /> },
    { id: 'growing', label: 'Fastest Growing', icon: <Flame className="w-4 h-4" /> },
    { id: 'rated', label: 'Highest Rated', icon: <Award className="w-4 h-4" /> },
    { id: 'new', label: 'New This Week', icon: <Calendar className="w-4 h-4" /> },
  ] as const;

  const allPrompts = [...mostCopiedPrompts, ...fastestGrowingPrompts, ...highestRatedPrompts, ...newestPrompts];

  return (
    <section className="py-12 border-b border-neutral-100 dark:border-neutral-900/60 select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Category Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <span className="font-sans text-[11px] font-extrabold tracking-[0.15em] text-brand-accent uppercase block mb-2">
              REAL-TIME TRENDS
            </span>
            <h3 className="font-display text-2xl md:text-3.5xl font-extrabold tracking-tight text-brand-text dark:text-brand-text-dark">
              Trending Today
            </h3>
            <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mt-1">
              Top requested and highly functional prompts updated hourly in our ecosystem.
            </p>
          </div>

          {/* Styled Tabs Row */}
          <div className="flex flex-wrap gap-2 bg-neutral-100 dark:bg-neutral-900/60 p-1.5 rounded-2xl border border-neutral-200/40 dark:border-neutral-850">
            {tabsInfo.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl font-sans font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    isActive
                      ? 'bg-white dark:bg-neutral-850 text-brand-accent shadow-sm border border-neutral-200/50 dark:border-neutral-800'
                      : 'text-neutral-550 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Items Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allPrompts.length === 0 ? (
            <EmptyState message="No trending prompts available" />
          ) : (
            getFilteredList().map((prompt) => (
              <PromptCardItem
                key={prompt.id}
                prompt={prompt}
                onPromptClick={onPromptClick}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
