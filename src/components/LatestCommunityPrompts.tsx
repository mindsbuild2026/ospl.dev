/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PromptCard } from "../types";
import {
  Clock,
  Check,
  Copy,
  Heart,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { formatRelativeTime } from "../utils/util";
import { EmptyState } from "./shared";

interface LatestCommunityPromptsProps {
  prompts: PromptCard[];
  onPromptClick: (id: string) => void;
}

export default function LatestCommunityPrompts({
  prompts,
  onPromptClick,
}: LatestCommunityPromptsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, id: string, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const latestItems = [...prompts]
    .sort((a, b) =>
      String(b.stats.updated).localeCompare(String(a.stats.updated)),
    )
    .slice(0, 4);

  return (
    <section className="py-12 border-b border-neutral-100 dark:border-neutral-900/60 select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Feed Title Intro Column */}
          <div className="lg:col-span-1 flex flex-col justify-between">
            <div>
              <span className="font-sans text-[11px] font-extrabold tracking-[0.15em] text-brand-accent uppercase block mb-2">
                CHRONOLOGICAL STREAM
              </span>
              <h3 className="font-display text-2xl md:text-3.5xl font-extrabold tracking-tight text-brand-text dark:text-brand-text-dark">
                Latest Community Prompts
              </h3>
              <p className="font-sans text-sm text-neutral-550 dark:text-neutral-400 leading-relaxed mt-2.5 max-w-sm">
                A live feed of the newest and most effective recipes submitted
                and shared by builders around the world.
              </p>
            </div>

            <div className="hidden lg:block pt-8 border-t border-neutral-200/40 dark:border-neutral-800">
              <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500 uppercase font-black block mb-1">
                Ecosystem Growth
              </span>
              <span className="font-sans text-xs text-neutral-500">
                {latestItems.length} recent additions are available from the
                live Supabase dataset.
              </span>
            </div>
          </div>

          {/* Time Stream Feed List Column */}
          <div className="lg:col-span-2">
            {latestItems.length === 0 ? (
              <EmptyState type="no-prompts" compact />
            ) : (
            <div className="space-y-5">
            {latestItems.map((item) => {
              const isCopied = copiedId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => onPromptClick(item.id)}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/80 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 group cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 flex-1">
                    {/* Timestamp circular visual indicator */}
                    <div className="w-10 h-10 rounded-full bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center shrink-0 border border-neutral-150 dark:border-neutral-800/50">
                      <Clock className="w-4.5 h-4.5 text-brand-accent" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-display text-[15px] sm:text-base font-bold text-brand-text dark:text-white group-hover:text-brand-accent transition-colors leading-tight">
                          {item.title}
                        </h4>
                        <span className="px-2 py-0.5 roundedbg-neutral-100 dark:bg-neutral-800 text-[10px] font-sans font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                          {item.category}
                        </span>
                      </div>

                      <p className="font-sans text-xs sm:text-[13px] text-neutral-500 dark:text-neutral-400 line-clamp-1 max-w-xl">
                        {item.shortDescription}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] font-sans text-neutral-400 select-none">
                        <span className="font-semibold text-brand-accent">
                          {formatRelativeTime(item.stats.updated)}
                        </span>
                        <span>•</span>
                        <span>by {item.author.handle}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div
                    className="flex items-center gap-2 self-end sm:self-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) =>
                        handleCopy(
                          e,
                          item.id,
                          `${item.title}\n${item.shortDescription}`,
                        )
                      }
                      className={`h-9 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-sans font-bold cursor-pointer ${
                        isCopied
                          ? "bg-brand-accent border-brand-accent text-white"
                          : "bg-transparent text-neutral-500 border-neutral-200 dark:border-neutral-800 hover:text-brand-accent hover:border-brand-accent"
                      }`}
                      title="Copy System Prompt"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onPromptClick(item.id)}
                      className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-neutral-850 hover:border-brand-accent/60 text-neutral-400 hover:text-brand-accent flex items-center justify-center backdrop-blur-sm transition-all"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
