/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CollectionSummary, PromptCard } from '../types';
import { Folder, Code, Award, Palette, Briefcase, Zap, GraduationCap, ArrowRight } from 'lucide-react';
import { EmptyState } from './shared';

interface FeaturedCollectionsProps {
  prompts: PromptCard[];
  collections: CollectionSummary[];
  onOpenCollection: (collectionId: string) => void;
}

export default function FeaturedCollections({
  prompts,
  collections,
  onOpenCollection,
}: FeaturedCollectionsProps) {
  const iconPalette = [
    { icon: <Code className="w-5 h-5 text-purple-500" />, colorClass: 'border-purple-200/50 hover:border-purple-400 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/20 bg-purple-100/10 dark:bg-purple-900/10' },
    { icon: <Award className="w-5 h-5 text-rose-500" />, colorClass: 'border-rose-200/50 hover:border-rose-400 group-hover:bg-rose-50 dark:group-hover:bg-rose-950/20 bg-rose-100/10 dark:bg-rose-900/10' },
    { icon: <Palette className="w-5 h-5 text-pink-500" />, colorClass: 'border-pink-200/50 hover:border-pink-400 group-hover:bg-pink-50 dark:group-hover:bg-pink-950/20 bg-pink-100/10 dark:bg-pink-900/10' },
    { icon: <Briefcase className="w-5 h-5 text-blue-500" />, colorClass: 'border-blue-200/50 hover:border-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/20 bg-blue-100/10 dark:bg-blue-900/10' },
    { icon: <Zap className="w-5 h-5 text-amber-500" />, colorClass: 'border-amber-200/50 hover:border-amber-400 group-hover:bg-amber-50 dark:group-hover:bg-amber-950/20 bg-amber-100/10 dark:bg-amber-900/10' },
    { icon: <GraduationCap className="w-5 h-5 text-emerald-500" />, colorClass: 'border-emerald-200/50 hover:border-emerald-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/20 bg-emerald-100/10 dark:bg-emerald-950/10' },
  ];

  return (
    <section className="py-12 border-b border-neutral-100 dark:border-neutral-900/60 select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
          <div>
            <span className="font-sans text-[11px] font-extrabold tracking-[0.15em] text-brand-accent uppercase block mb-2">
              CURATED SETS
            </span>
            <h3 className="font-display text-2xl md:text-3.5xl font-extrabold tracking-tight text-brand-text dark:text-brand-text-dark">
              Featured Collections
            </h3>
            <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mt-1 max-w-xl">
              Bundles of high-performing instructions grouped by workflow utility.
            </p>
          </div>
        </div>

        {/* Collections Grid */}
        {collections.length === 0 ? (
          <EmptyState type="no-collections" compact />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.slice(0, 6).map((coll, index) => {
            const visual = iconPalette[index % iconPalette.length];
            const relevantPrompts = coll.promptCount || prompts.filter(p => p.category.toLowerCase() === coll.name.toLowerCase()).length;
            
            return (
              <div
                key={coll.id}
                onClick={() => onOpenCollection(coll.id)}
                className="group border rounded-[24px] p-6 bg-white dark:bg-neutral-900 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1 select-none border-neutral-200/60 dark:border-neutral-800"
              >
                <div>
                  {/* Icon drawer folder look */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-3 rounded-2xl flex items-center justify-center transition-colors ${visual.colorClass}`}>
                      {visual.icon}
                    </div>
                    {/* Folder Tab-like tag */}
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                      <Folder className="w-3 h-3 text-neutral-300 dark:text-neutral-600" />
                      <span>{relevantPrompts.toLocaleString()} prompt specs</span>
                    </span>
                  </div>

                  <h4 className="font-display text-lg font-bold text-brand-text dark:text-white mb-2 leading-tight group-hover:text-brand-accent transition-colors">
                    {coll.name}
                  </h4>
                  <p className="font-sans text-neutral-500 dark:text-neutral-400 text-xs sm:text-[13px] leading-relaxed mb-4">
                    {coll.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-2">
                  <span className="text-[11px] font-sans font-bold text-neutral-400 dark:text-neutral-500 uppercase">
                    {relevantPrompts > 0 ? `${relevantPrompts} prompts live` : 'Active community'}
                  </span>
                  <div className="text-brand-accent flex items-center gap-1.5 font-sans font-bold text-xs group-hover:translate-x-1 transition-transform">
                    <span>Explore library</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
            </div>
          );
        })}
        </div>
        )}

      </div>
    </section>
  );
}
