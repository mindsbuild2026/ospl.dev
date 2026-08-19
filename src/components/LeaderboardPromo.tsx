/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Contributor, PromptCard } from '../types';
import { Award, Copy, Brain, Star, Users, Flame, ChevronRight } from 'lucide-react';

interface LeaderboardPromoProps {
  prompts: PromptCard[];
  contributors: Contributor[];
  onPromptClick: (id: string) => void;
  onContributorClick?: () => void;
}

export default function LeaderboardPromo({
  prompts,
  contributors,
  onPromptClick,
  onContributorClick,
}: LeaderboardPromoProps) {
  if (prompts.length === 0) return null;
  const topContributor = contributors[0];
  const contributorCopyEvents = prompts
    .filter((prompt) => prompt.author.handle === topContributor?.handle)
    .reduce((total, prompt) => total + prompt.stats.copies, 0);

  // Derive top prompts deterministically
  const mostCopied = [...prompts].sort((a, b) => b.stats.copies - a.stats.copies)[0];
  const highestRated = [...prompts].sort((a, b) => b.stats.rating - a.stats.rating)[0];
  const trending = [...prompts].sort((a, b) => (b.stats.views + b.stats.copies) - (a.stats.views + a.stats.copies))[1] || prompts[0];

  // Leaderboard statistics config
  const cards = [
    {
      title: 'Most Copied Prompt',
      badge: `${mostCopied.stats.copies.toLocaleString()} copies`,
      prompt: mostCopied,
      icon: <Copy className="w-5 h-5 text-purple-500" />,
      colorClass: 'from-purple-500/10 to-transparent bg-purple-500/5',
    },
    {
      title: 'Highest Rated Prompt',
      badge: `${highestRated.stats.rating.toFixed(1)} rating`,
      prompt: highestRated,
      icon: <Star className="w-5 h-5 text-amber-500 fill-amber-500" />,
      colorClass: 'from-amber-500/10 to-transparent bg-amber-500/5',
    },
    {
      title: 'Trending Prompt',
      badge: 'Hot this week',
      prompt: trending,
      icon: <Flame className="w-5 h-5 text-rose-500" />,
      colorClass: 'from-rose-500/10 to-transparent bg-rose-500/5',
    },
  ];

  return (
    <section className="py-12 border-b border-neutral-100 dark:border-neutral-900/60 select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* Header Title */}
        <div className="mb-10 text-center md:text-left">
          <span className="font-sans text-[11px] font-extrabold tracking-[0.15em] text-brand-accent uppercase block mb-2">
            GLOBAL RANKINGS
          </span>
          <h3 className="font-display text-2xl md:text-3.5xl font-extrabold tracking-tight text-brand-text dark:text-brand-text-dark">
            Ecosystem Leaderboard
          </h3>
          <p className="font-sans text-sm text-neutral-550 dark:text-neutral-400 mt-1">
            Celebrating the top-performing recipes, authors, and contributions shaping PromptHub.
          </p>
        </div>

        {/* Dashboard Grid Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Main Cards Feed (3/4 Width) */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((item) => (
              <div
                key={item.title}
                onClick={() => onPromptClick(item.prompt.id)}
                className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/80 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200/40 dark:border-neutral-800">
                      {item.icon}
                    </div>
                    <span className="px-2.5 py-1 bg-neutral-50 dark:bg-neutral-950 font-mono text-[10px] font-bold text-neutral-400 dark:text-neutral-500 rounded-md border border-neutral-150 dark:border-neutral-850">
                      {item.badge}
                    </span>
                  </div>

                  <span className="font-sans text-[11px] font-bold text-neutral-400 tracking-wider uppercase block mb-1">
                    {item.title}
                  </span>
                  <h4 className="font-display text-[15px] sm:text-base font-bold text-brand-text dark:text-white line-clamp-2 leading-tight group-hover:text-brand-accent transition-colors">
                    {item.prompt.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-850 text-xs text-neutral-400/80 font-medium md:text-[11px]">
                  <span>by</span>
                  <span className="font-bold text-neutral-600 dark:text-neutral-300 select-all">{item.prompt.author.handle}</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-neutral-300 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          {/* Top Contributor Spotlight Column (1/4 Width) */}
          <div className="lg:col-span-1 relative overflow-hidden rounded-[28px] border border-brand-accent/20 bg-gradient-to-br from-brand-accent/[0.08] via-white to-yellow-50 dark:from-brand-accent/[0.08] dark:via-neutral-900 dark:to-neutral-950 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4.5 h-4.5 text-brand-accent" />
                <span className="font-sans text-xs font-bold text-brand-accent tracking-wider uppercase">
                  Contributor Spotlight
                </span>
              </div>

              {/* Contributor Visual */}
              {topContributor && (
                <div className="flex items-center gap-3.5 mt-5">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-accent/20 shrink-0">
                    {topContributor.avatarUrl ? (
                      <img
                        src={topContributor.avatarUrl}
                        alt={topContributor.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-accent/10 text-brand-accent flex items-center justify-center text-sm font-bold">
                        {topContributor.name.slice(0, 1)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-display font-black text-brand-text dark:text-white leading-none text-[15px] truncate">
                      {topContributor.name}
                    </h4>
                    <span className="text-[11px] font-sans text-neutral-500 font-medium">
                      Leaderboard #1 spot
                    </span>
                  </div>
                </div>
              )}

              {/* Contributor metrics list */}
              <div className="space-y-2 mt-6">
                <div className="flex justify-between text-xs font-medium text-neutral-500">
                  <span>Submitted templates</span>
                  <span className="font-bold text-brand-text dark:text-white">{topContributor?.promptsCount || 0} prompts</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-neutral-500">
                  <span>Audience reached</span>
                  <span className="font-bold text-brand-text dark:text-white">{contributorCopyEvents.toLocaleString()} copy events</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-neutral-500">
                  <span>Design status</span>
                  <span className="font-bold text-brand-accent">{topContributor?.verified ? 'VERIFIED' : 'COMMUNITY'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onContributorClick}
              className="w-full mt-6 py-2.5 bg-brand-accent hover:bg-brand-hover text-white rounded-xl font-sans font-bold text-xs uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View Leaderboard</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
