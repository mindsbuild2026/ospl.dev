/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PromptCardItem Component
 * Modern, information-rich PromptHub card design supporting:
 * - VARIANT A: With Result/Proof Image (visual focal point)
 * - VARIANT B: Without Result Image (clean dark aesthetic)
 * 
 * Uses 100% real backend data without hardcoded values.
 */

import React, { useState } from 'react';
import { PromptCard } from '../types';
import { copyTextToClipboard } from '../lib/clipboardService';
import {
  Copy,
  Check,
  Heart,
  Eye,
  Award,
  Layers,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { formatCompactNumber } from '../lib/promptSchema';

export interface PromptCardItemProps {
  prompt: PromptCard;
  onPromptClick: (id: string) => void;
  isSaved?: boolean;
  toggleSavePrompt?: (id: string) => void;
  isAuthenticated?: boolean;
  onCopy?: (id: string, copyText: string) => void;
}

export const PromptCardItem: React.FC<PromptCardItemProps> = ({
  prompt,
  onPromptClick,
  isSaved = false,
  toggleSavePrompt,
  isAuthenticated = false,
  onCopy,
}) => {
  const [copied, setCopied] = useState(false);

  // Extract author initials for fallback avatar
  const getAuthorInitials = (name: string) => {
    if (!name) return 'CH';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleCopyAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const copyText = prompt.systemPrompt || `${prompt.title}\n${prompt.shortDescription}`;
    const success = await copyTextToClipboard(copyText);
    if (success) {
      setCopied(true);
      if (onCopy) {
        onCopy(prompt.id, copyText);
      }
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLikeAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toggleSavePrompt) {
      toggleSavePrompt(prompt.id);
    }
  };

  const hasResultImage = Boolean(prompt.resultImageUrl);
  const stepCount = prompt.workflowStepCount || 0;
  const isWorkflow = prompt.creatorMode === 'developer' || stepCount > 0;
  const maxDisplayedTags = 3;
  const tagList = prompt.tags || [];
  const displayedTags = tagList.slice(0, maxDisplayedTags);
  const remainingTagCount = tagList.length > maxDisplayedTags ? tagList.length - maxDisplayedTags : 0;

  return (
    <div
      onClick={() => onPromptClick(prompt.id)}
      className="group relative flex flex-col justify-between bg-white dark:bg-neutral-900 rounded-[28px] border border-neutral-200/80 dark:border-neutral-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer select-none"
    >
      {/* ============================================================ */}
      {/* VARIANT A — WITH RESULT IMAGE */}
      {/* ============================================================ */}
      {hasResultImage ? (
        <div className="flex flex-col h-full">
          {/* Top Visual Focal Point Image */}
          <div className="relative h-48 w-full overflow-hidden bg-neutral-950">
            <img
              src={prompt.resultImageUrl}
              alt={prompt.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Subtle Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />

            {/* Overlaid Category Pill & Action Buttons */}
            <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
              <span className="px-3 py-1 rounded-full bg-neutral-900/80 backdrop-blur-md text-white font-sans text-xs font-bold border border-white/10 shadow-sm">
                {prompt.category || 'AI Prompt'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAction}
                  className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md cursor-pointer ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-neutral-900/80 hover:bg-white text-white hover:text-neutral-900 border border-white/10'
                  }`}
                  title={copied ? 'Copied' : 'Copy Prompt'}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>

                {isAuthenticated && toggleSavePrompt && (
                  <button
                    type="button"
                    onClick={handleLikeAction}
                    className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md cursor-pointer ${
                      isSaved
                        ? 'bg-rose-500 text-white'
                        : 'bg-neutral-900/80 hover:bg-rose-500 text-white border border-white/10'
                    }`}
                    title={isSaved ? 'Remove from saved' : 'Save prompt'}
                  >
                    <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Image Overlay Badges */}
            <div className="absolute bottom-3 inset-x-4 flex items-center justify-between z-10">
              {isWorkflow && (
                <span className="px-2.5 py-0.5 rounded-md bg-purple-900/80 backdrop-blur-md text-purple-200 text-[11px] font-mono font-bold flex items-center gap-1 border border-purple-500/30">
                  <Layers className="w-3 h-3 text-purple-400" />
                  <span>{stepCount > 0 ? `${stepCount} Steps` : 'Developer Pro'}</span>
                </span>
              )}

              {(prompt.verified || prompt.communityValidated) && (
                <span className="ml-auto px-2.5 py-0.5 rounded-md bg-emerald-900/80 backdrop-blur-md text-emerald-200 text-[11px] font-bold flex items-center gap-1 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Verified</span>
                </span>
              )}
            </div>
          </div>

          {/* Card Body Content */}
          <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white leading-snug line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-2">
                {prompt.title}
              </h3>

              {prompt.shortDescription && (
                <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-3">
                  {prompt.shortDescription}
                </p>
              )}

              {/* Dynamic Tags */}
              {displayedTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {displayedTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 text-[10px] font-mono uppercase font-bold"
                    >
                      #{tag}
                    </span>
                  ))}
                  {remainingTagCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-400 text-[10px] font-mono font-bold">
                      +{remainingTagCount}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Footer Details: Author & Real Metrics */}
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-3 text-xs">
              {/* Author */}
              <div className="flex items-center gap-2 min-w-0">
                {prompt.author.avatarUrl ? (
                  <img
                    src={prompt.author.avatarUrl}
                    alt={prompt.author.name}
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    {getAuthorInitials(prompt.author.name)}
                  </div>
                )}
                <span className="font-sans font-bold text-neutral-700 dark:text-neutral-300 truncate">
                  {prompt.author.name}
                </span>
              </div>

              {/* Real Metrics */}
              <div className="flex items-center gap-3 font-mono text-[11px] text-neutral-500 dark:text-neutral-400 shrink-0">
                {prompt.stats.ratingCount > 0 && prompt.stats.rating > 0 && (
                  <div className="flex items-center gap-1 text-amber-500 font-bold" title={`${prompt.stats.rating.toFixed(1)} / 5.0 (${prompt.stats.ratingCount} ${prompt.stats.ratingCount === 1 ? 'rating' : 'ratings'})`}>
                    <span>★</span>
                    <span>{prompt.stats.rating.toFixed(1)}</span>
                  </div>
                )}
                {prompt.stats.copies > 0 && (
                  <div className="flex items-center gap-1" title="Prompt Copies">
                    <Copy className="w-3 h-3 text-purple-500" />
                    <span>{formatCompactNumber(prompt.stats.copies)}</span>
                  </div>
                )}
                {prompt.stats.views > 0 && (
                  <div className="flex items-center gap-1" title="Views">
                    <Eye className="w-3 h-3 text-blue-500" />
                    <span>{formatCompactNumber(prompt.stats.views)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* VARIANT B — WITHOUT RESULT IMAGE (Clean Dark Aesthetic) */
        /* ============================================================ */
        <div className="p-6 md:p-7 flex flex-col justify-between h-full space-y-5">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-sans text-xs font-bold border border-purple-200 dark:border-purple-800">
                {prompt.category || 'AI Prompt'}
              </span>

              {isWorkflow && (
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[11px] font-mono font-bold flex items-center gap-1">
                  <Layers className="w-3 h-3 text-purple-500" />
                  <span>{stepCount > 0 ? `${stepCount} Steps` : 'Pro'}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAction}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-xs cursor-pointer ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
                title={copied ? 'Copied' : 'Copy Prompt'}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>

              {isAuthenticated && toggleSavePrompt && (
                <button
                  type="button"
                  onClick={handleLikeAction}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-xs cursor-pointer ${
                    isSaved
                      ? 'bg-rose-500 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-rose-500'
                  }`}
                  title={isSaved ? 'Remove from saved' : 'Save prompt'}
                >
                  <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-2 flex-1">
            <h3 className="font-display text-xl font-bold text-neutral-900 dark:text-white leading-snug line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {prompt.title}
            </h3>

            {prompt.shortDescription && (
              <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                {prompt.shortDescription}
              </p>
            )}
          </div>

          {/* Dynamic Tags */}
          {displayedTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {displayedTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-850 text-neutral-500 dark:text-neutral-400 text-[10px] font-mono uppercase font-bold"
                >
                  #{tag}
                </span>
              ))}
              {remainingTagCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-850 text-neutral-400 text-[10px] font-mono font-bold">
                  +{remainingTagCount}
                </span>
              )}
            </div>
          )}

          {/* Footer Details: Author & Real Metrics */}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3 text-xs">
            {/* Author */}
            <div className="flex items-center gap-2 min-w-0">
              {prompt.author.avatarUrl ? (
                <img
                  src={prompt.author.avatarUrl}
                  alt={prompt.author.name}
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  {getAuthorInitials(prompt.author.name)}
                </div>
              )}
              <span className="font-sans font-bold text-neutral-700 dark:text-neutral-300 truncate">
                {prompt.author.name}
              </span>
            </div>

            {/* Real Engagement Metrics */}
            <div className="flex items-center gap-3 font-mono text-[11px] text-neutral-500 dark:text-neutral-400 shrink-0">
              {prompt.stats.ratingCount > 0 && prompt.stats.rating > 0 && (
                <div className="flex items-center gap-1 text-amber-500 font-bold" title={`${prompt.stats.rating.toFixed(1)} / 5.0 (${prompt.stats.ratingCount} ${prompt.stats.ratingCount === 1 ? 'rating' : 'ratings'})`}>
                  <span>★</span>
                  <span>{prompt.stats.rating.toFixed(1)}</span>
                </div>
              )}
              {prompt.stats.copies > 0 && (
                <div className="flex items-center gap-1" title="Copies">
                  <Copy className="w-3 h-3 text-purple-500" />
                  <span>{formatCompactNumber(prompt.stats.copies)}</span>
                </div>
              )}
              {prompt.stats.views > 0 && (
                <div className="flex items-center gap-1" title="Views">
                  <Eye className="w-3 h-3 text-blue-500" />
                  <span>{formatCompactNumber(prompt.stats.views)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptCardItem;
