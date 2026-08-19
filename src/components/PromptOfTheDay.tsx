/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PromptCard } from '../types';
import { getPlatformCode } from '../lib/promptSchema';
import { copyTextToClipboard } from '../lib/clipboardService';
import { Calendar, Copy, Check, Eye, Heart, Sparkles, MessageSquare } from 'lucide-react';

interface PromptOfTheDayProps {
  prompts: PromptCard[];
  onPromptClick: (id: string) => void;
  savedPromptIds: string[];
  toggleSavePrompt: (id: string) => void;
  onCopyPrompt?: (id: string) => void;
  isAuthenticated: boolean;
}

export default function PromptOfTheDay({
  prompts,
  onPromptClick,
  savedPromptIds,
  toggleSavePrompt,
  onCopyPrompt,
  isAuthenticated,
}: PromptOfTheDayProps) {
  const [copied, setCopied] = useState(false);

  if (prompts.length === 0) return null;

  const potd = [...prompts].sort((a, b) => b.engagement.trendingScore - a.engagement.trendingScore || b.stats.rating - a.stats.rating)[0];
  const isSaved = savedPromptIds.includes(potd.id);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const copyText = potd.systemPrompt || `${potd.title}\n${potd.shortDescription}`;
    const success = await copyTextToClipboard(copyText);
    if (success) {
      setCopied(true);
      if (onCopyPrompt) {
        onCopyPrompt(potd.id);
      }
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div 
      onClick={() => onPromptClick(potd.id)}
      className="relative w-full bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/80 rounded-[32px] p-8 md:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden mb-16 select-none"
    >
      {/* Background soft purple glow accent matching brand accent */}
      <div className="absolute right-0 top-0 w-80 h-80 bg-brand-accent/5 dark:bg-brand-accent/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      
      {/* Container split layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start relative z-10">
        
        {/* Card Copy Column */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-4 py-1.5 bg-[#f3e8ff] dark:bg-purple-900/30 text-brand-accent font-sans text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Prompt of the Day</span>
            </span>
            <span className="px-3.5 py-1.5 bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 font-sans text-xs font-semibold rounded-full">
              {potd.category}
            </span>
          </div>

          <h3 className="font-display text-2xl sm:text-3.5xl font-extrabold text-brand-text dark:text-brand-text-dark tracking-tight leading-snug group-hover:text-brand-accent transition-colors">
            {potd.title}
          </h3>

          <p className="font-sans text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl">
            {potd.shortDescription}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-xs text-neutral-400 font-medium">
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-neutral-400" />
              <span>Copied {potd.stats.copies.toLocaleString()} times</span>
            </span>
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-neutral-400" />
              <span>Viewed {potd.stats.views.toLocaleString()} times</span>
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Community Rating: {potd.stats.ratingCount > 0 && potd.stats.rating > 0 ? `${potd.stats.rating.toFixed(1)}/5` : "No ratings yet"}</span>
            </span>
          </div>
        </div>

        {/* Action / Blueprint Box Column */}
        <div className="w-full lg:w-[380px] shrink-0 bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-150 dark:border-neutral-800/60 rounded-2xl p-6 flex flex-col justify-between self-stretch">
          
          {/* Inner Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">
              BLUEPRINT PREVIEW
            </span>
            <div className="w-5 h-5 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center text-[9px] font-bold font-mono">
              {getPlatformCode(potd)}
            </div>
          </div>

          {/* Card-safe metadata preview */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-xl p-4 mb-6 flex-1 min-h-[100px] max-h-[140px] overflow-hidden">
            <div className="font-sans text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed text-left space-y-3">
              <p className="line-clamp-2">{potd.shortDescription}</p>
              <div className="flex flex-wrap gap-2">
                {potd.aiPlatforms.map((platform) => (
                  <span key={platform} className="font-mono text-[10px] bg-neutral-100 dark:bg-neutral-800 rounded-md px-2 py-1">
                    {platform}
                  </span>
                ))}
              </div>
              <p className="font-mono text-[10px] uppercase text-neutral-400">
                {potd.results.hasProof ? 'Proof attached' : 'Awaiting proof'} · {potd.stats.copies.toLocaleString()} copies
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleCopy}
              className={`flex-1 py-3 px-4 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border ${
                copied
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-black hover:bg-neutral-850 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-white border-transparent'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy System Prompt</span>
                </>
              )}
            </button>

            {isAuthenticated && (
              <button
                onClick={() => toggleSavePrompt(potd.id)}
                className={`w-12 h-12 rounded-xl transition-all flex items-center justify-center cursor-pointer border ${
                  isSaved
                    ? 'border-brand-accent bg-brand-accent/5 text-brand-accent'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-brand-accent hover:border-brand-accent/60'
                }`}
                title={isSaved ? 'Saved' : 'Save to collection'}
              >
                <Heart className={`w-4.5 h-4.5 ${isSaved ? 'fill-brand-accent text-brand-accent' : ''}`} />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
