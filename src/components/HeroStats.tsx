/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PromptCard } from '../types';
import { Sparkles, Library, Users, Copy, Code } from 'lucide-react';

interface HeroStatsProps {
  prompts: PromptCard[];
  categoriesCount: number;
}

export default function HeroStats({ prompts, categoriesCount }: HeroStatsProps) {
  const activeCountTemplate = prompts.length;
  const totalCopies = prompts.reduce((total, prompt) => total + (prompt.stats?.copies || 0), 0);
  const totalViews = prompts.reduce((total, prompt) => total + (prompt.stats?.views || 0), 0);
  const contributorCount = new Set(prompts.map(p => p.author?.handle).filter(Boolean)).size;
  
  // Calculate verified/proof-backed prompts dynamically across all verification flags
  const verifiedOrProofCount = prompts.filter(
    prompt => prompt.results?.hasProof || prompt.verified || prompt.communityValidated || prompt.featured
  ).length;

  const displayCopies = totalCopies > 0 
    ? (totalCopies >= 1000 ? `${(totalCopies / 1000).toFixed(1)}k` : `${totalCopies}`)
    : (totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}k` : `${totalViews}`);

  // High-fidelity stats
  const statsList = [
    {
      label: 'Total Prompts',
      value: `${activeCountTemplate}`,
      description: 'Active templates',
      icon: <Library className="w-4 h-4 text-brand-accent" />,
    },
    {
      label: 'Categories',
      value: `${categoriesCount}`,
      description: 'Creative domains',
      icon: <Sparkles className="w-4 h-4 text-purple-500" />,
    },
    {
      label: 'Contributions',
      value: `${contributorCount}`,
      description: 'Submitted prompts',
      icon: <Users className="w-4 h-4 text-emerald-500" />,
    },
    {
      label: totalCopies > 0 ? 'Monthly Copies' : 'Live Usage',
      value: displayCopies,
      description: totalCopies > 0 ? 'Instant integrations' : 'Views & integrations',
      icon: <Copy className="w-4 h-4 text-blue-500" />,
    },
    {
      label: 'Open Source',
      value: `${verifiedOrProofCount}`,
      description: 'Verified & proofed',
      icon: <Code className="w-4 h-4 text-amber-500" />,
    },
  ];

  return (
    <div className="w-full max-w-5xl mt-12 bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/40 dark:border-neutral-800/60 shadow-[0_8px_32px_rgba(0,0,0,0.02)] backdrop-blur-md rounded-[28px] p-6 sm:p-8 z-10 select-none">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 divide-y md:divide-y-0 md:divide-x divide-neutral-200/40 dark:divide-neutral-800/60">
        {statsList.map((stat, i) => (
          <div 
            key={stat.label} 
            className={`flex flex-col items-center md:items-start text-center md:text-left ${
              i >= 2 ? 'pt-4 md:pt-0' : 'pt-0'
            } ${i === 1 ? 'pt-0 md:pt-0' : ''} md:px-5 hover:scale-[1.03] transition-transform duration-300`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 px-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg shrink-0">
                {stat.icon}
              </div>
              <span className="text-[10px] sm:text-[11px] font-sans font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
            <span className="font-display text-lg sm:text-2xl font-black text-brand-text dark:text-brand-text-dark tracking-tight leading-none mb-1">
              {stat.value}
            </span>
            <span className="text-[11px] font-sans text-neutral-500 dark:text-neutral-400">
              {stat.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
