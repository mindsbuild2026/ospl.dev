/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Github, Star, GitBranch, GitFork, Users, ExternalLink } from 'lucide-react';

export default function OpenSourcePromo() {
  return (
    <section className="py-12 border-b border-neutral-100 dark:border-neutral-900/60 select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="bg-neutral-50 dark:bg-neutral-900/40 rounded-[32px] p-8 md:p-12 border border-neutral-200/50 dark:border-neutral-800/80 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-10">
          
          {/* Subtle decor grid */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          {/* Main Info */}
          <div className="space-y-4 max-w-2xl relative z-10">
            <span className="px-3.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-brand-text dark:text-brand-text-dark font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-full flex items-center gap-2 w-max border border-neutral-200/50 dark:border-neutral-700/55">
              <Github className="w-3.5 h-3.5" />
              <span>GitHub Community Repo</span>
            </span>

            <h3 className="font-display text-2xl sm:text-3.5xl font-extrabold text-brand-text dark:text-white tracking-tight leading-snug">
              Shape the Future of Conversational Engineering
            </h3>

            <p className="font-sans text-sm sm:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Every system prompt in PromptHub exists in the public domain. We celebrate collaboration, review requests, and contributions that establish rigorous blueprints for LLMs.
            </p>

            {/* Growth statistics row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 divide-x divide-neutral-200/55 dark:divide-neutral-800">
              <div className="space-y-1">
                <span className="text-[10px] font-sans font-bold text-neutral-400 dark:text-neutral-500 uppercase">CONTRIBUTORS</span>
                <p className="font-display text-xl font-extrabold text-brand-text dark:text-white">1,450+ members</p>
              </div>
              <div className="space-y-1 pl-4">
                <span className="text-[10px] font-sans font-bold text-neutral-400 dark:text-neutral-500 uppercase">MONTHLY PRs</span>
                <p className="font-display text-xl font-extrabold text-brand-text dark:text-white">120+ merged</p>
              </div>
              <div className="space-y-1 pl-4">
                <span className="text-[10px] font-sans font-bold text-neutral-400 dark:text-neutral-500 uppercase">STARS ACCRETION</span>
                <p className="font-display text-xl font-extrabold text-brand-text dark:text-white">+850 / week</p>
              </div>
              <div className="space-y-1 pl-4">
                <span className="text-[10px] font-sans font-bold text-neutral-400 dark:text-neutral-500 uppercase">STATUS</span>
                <p className="font-display text-xl font-extrabold text-brand-accent">100% MIT Public</p>
              </div>
            </div>
          </div>

          {/* Call to action boxes Column */}
          <div className="shrink-0 flex flex-col gap-3.5 w-full md:w-[260px] relative z-10">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="w-full py-4 px-6 bg-black hover:bg-neutral-850 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-white rounded-2xl font-sans font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <Github className="w-5 h-5 fill-current" />
              <span>Contribute Code</span>
            </a>

            <div className="bg-white dark:bg-neutral-950 p-4 border border-neutral-200/50 dark:border-neutral-800/80 rounded-2xl flex justify-between items-center text-xs text-neutral-400 font-sans font-medium select-none">
              <span className="flex items-center gap-1.5 font-bold text-neutral-500">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                <span>12.4k Stars</span>
              </span>
              <span className="flex items-center gap-1.5 font-bold text-neutral-500">
                <GitFork className="w-4 h-4 text-indigo-500" />
                <span>3.2k Forks</span>
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
