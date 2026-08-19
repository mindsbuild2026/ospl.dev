/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Contributor, PromptCard } from '../types';
import { Github, ArrowRight, Star, GitFork, Award, HelpCircle, CheckCircle, Brain, Sparkles } from 'lucide-react';

interface CommunityViewProps {
  contributors: Contributor[];
  prompts: PromptCard[];
  onContributionClick: () => void;
}

export default function CommunityView({
  contributors,
  prompts,
  onContributionClick
}: CommunityViewProps) {
  const floatingContributors = contributors.slice(0, 4);
  const totalPrompts = prompts.length;

  return (
    <div className="w-full relative py-12 md:py-20 px-4 md:px-8 max-w-7xl mx-auto transition-colors duration-300 dark:bg-[#09090b]">
      
      {/* Concentric orbital rings background decoration per Image 2 */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
        <div className="absolute w-[650px] h-[650px] rounded-full border border-neutral-100 dark:border-neutral-900" />
        <div className="absolute w-[950px] h-[950px] rounded-full border border-neutral-100/60 dark:border-neutral-900/40" />
        <div className="absolute w-[350px] h-[350px] rounded-full border border-neutral-100 dark:border-neutral-900" />
      </div>

      <div className="relative z-10 w-full">
        {/* Centered Hero section per Image 2 */}
        <section className="text-center w-full max-w-4xl mx-auto mb-20 relative py-14 select-none">
          {/* Floating live circle avatars matching Image 2 */}
          <div className="absolute inset-0 pointer-events-none hidden md:block">
            {floatingContributors.map((contributor, index) => {
              const positions = [
                'top-0 left-[10%] w-12 h-12',
                'bottom-16 left-[15%] w-10 h-10',
                'top-[10%] right-[10%] w-12 h-12',
                'bottom-6 right-[15%] w-14 h-14',
              ];
              return (
                <div key={contributor.handle} className={`absolute ${positions[index]} rounded-full overflow-hidden border-2 border-white dark:border-neutral-900 shadow-md`}>
                  {contributor.avatarUrl ? (
                    <img 
                      src={contributor.avatarUrl} 
                      alt={contributor.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full bg-brand-accent/10 text-brand-accent flex items-center justify-center text-xs font-bold">
                      {contributor.name.slice(0, 1)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Subtitle Accent Badge */}
          <span className="font-sans text-xs font-bold text-brand-accent tracking-[0.1em] uppercase mb-6 block">
            OPEN SOURCE HUB
          </span>
          {/* Main Title */}
          <h2 className="font-display text-5xl md:text-7xl font-bold text-brand-text dark:text-brand-text-dark tracking-tight leading-[1] mb-6 max-w-2xl mx-auto">
            The home for prompt engineers
          </h2>
          {/* Subtext */}
          <p className="font-sans text-base md:text-[17px] text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Contribute, share ideas, and build the ultimate open-source prompt library together. <br className="hidden md:block"/>
            PromptHub is powered by the community, hosted on GitHub.
          </p>

          {/* Call-to-action buttons per Image 2 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-20">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer"
              className="bg-black text-white dark:bg-white dark:text-black px-8 py-3.5 rounded-full font-sans font-bold text-[13px] tracking-wide flex items-center gap-3 transition-transform hover:-translate-y-0.5 shadow-md"
            >
              <Github className="w-5 h-5 fill-current" />
              <span>View on GitHub</span>
            </a>
            <button
              onClick={onContributionClick}
              className="font-sans font-bold text-[13px] text-brand-text dark:text-brand-text-dark hover:text-brand-accent transition-colors flex items-center gap-2 cursor-pointer relative z-20 bg-transparent"
            >
              <span>Contribution Guide</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Bento Grid layouts per reference screenshots */}
        <section className="w-full max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 select-none relative z-10">
          
          {/* Quick Stats Rounded Cards Block */}
          <div className="bg-white dark:bg-neutral-900/80 p-10 rounded-[32px] md:col-span-1 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-shadow">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#f3e8ff] flex items-center justify-center mb-6">
                <Star className="w-5 h-5 text-brand-accent" />
              </div>
              <h3 className="font-display text-[40px] font-bold text-brand-text dark:text-brand-text-dark tracking-tight leading-none mb-2">
                {contributors.length.toLocaleString()}
              </h3>
              <p className="font-sans text-[13px] text-neutral-500 font-medium">
                Active Authors
              </p>
            </div>
            
            <div className="mt-10 pt-10 border-t border-neutral-100 dark:border-neutral-800">
              <h3 className="font-display text-[32px] font-bold text-brand-text dark:text-brand-text-dark tracking-tight leading-none mb-2">
                {totalPrompts.toLocaleString()}
              </h3>
              <p className="font-sans text-[13px] text-neutral-500 font-medium">
                Published Prompts
              </p>
            </div>
          </div>

          {/* Guide Steps Box Column */}
          <div className="bg-white dark:bg-neutral-900/80 p-10 rounded-[32px] md:col-span-2 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-shadow flex flex-col justify-between">
            <h3 className="font-display text-[28px] font-bold text-brand-text dark:text-white tracking-tight mb-8">
              Contribute to PromptHub
            </h3>

            <div className="space-y-8 pl-2">

              {/* Step 1 */}
              <div className="flex gap-5 items-start">
                <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800/60 flex items-center justify-center font-sans text-[13px] font-bold text-neutral-600 dark:text-neutral-300 shrink-0 select-none">
                  1
                </div>
                <div>
                  <h4 className="font-sans text-[16px] font-bold text-brand-text dark:text-brand-text-dark mb-1">
                    Fork the Repository
                  </h4>
                  <p className="font-sans text-[15px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Start by creating a fork of the main repository on GitHub to your own account.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-5 items-start">
                <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800/60 flex items-center justify-center font-sans text-[13px] font-bold text-neutral-600 dark:text-neutral-300 shrink-0 select-none">
                  2
                </div>
                <div>
                  <h4 className="font-sans text-[16px] font-bold text-brand-text dark:text-brand-text-dark mb-1">
                    Submit your Prompt
                  </h4>
                  <p className="font-sans text-[15px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Use the submission form to send prompt metadata into the Supabase-backed review flow.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-5 items-start">
                <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800/60 flex items-center justify-center font-sans text-[13px] font-bold text-neutral-600 dark:text-neutral-300 shrink-0 select-none">
                  3
                </div>
                <div>
                  <h4 className="font-sans text-[16px] font-bold text-brand-text dark:text-brand-text-dark mb-1">
                    Submit a Pull Request
                  </h4>
                  <p className="font-sans text-[15px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Open a PR against the `main` branch. Our automated tests will validate your prompt structure before merge.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Leaders Board Block */}
          <div className="bg-white dark:bg-neutral-900/80 p-10 rounded-[32px] md:col-span-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h3 className="font-display text-[28px] font-bold text-brand-text dark:text-white tracking-tight mb-1">
                  Top Contributors
                </h3>
                <p className="font-sans text-[15px] text-neutral-500">
                  Heroes shaping the open-source library.
                </p>
              </div>
              
              <button className="font-sans font-bold text-[13px] text-brand-accent hover:text-brand-hover transition-colors">
                View All
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 md:gap-12">
              {contributors.slice(0,4).map((contributor) => (
                <div 
                  key={contributor.handle}
                  className="flex items-center gap-4"
                >
                  {/* Avatar Circular display */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 shrink-0">
                    <img 
                      src={contributor.avatarUrl} 
                      alt={contributor.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-sans text-[15px] font-bold text-brand-text dark:text-brand-text-dark">
                      {contributor.handle}
                    </span>
                    <span className="font-sans text-[13px] text-neutral-500">
                      {contributor.promptsCount} Prompts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
