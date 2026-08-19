/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Category } from '../types';
import { MessageSquare, Brain, Sparkles, Code2, Megaphone, Palette, GraduationCap, Rocket, Zap } from 'lucide-react';

interface CategoriesViewProps {
  categories: Category[];
  onCategorySelected: (category: string) => void;
  promptsCountMap: Record<string, number>;
}

export default function CategoriesView({
  categories,
  onCategorySelected,
  promptsCountMap
}: CategoriesViewProps) {
  // Map string category icon names to Lucide icon components
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'chat':
        return <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />;
      case 'psychology':
        return <Brain className="w-5 h-5 md:w-6 md:h-6" />;
      case 'auto_awesome':
        return <Sparkles className="w-5 h-5 md:w-6 md:h-6" />;
      case 'code_blocks':
        return <Code2 className="w-5 h-5 md:w-6 md:h-6" />;
      case 'campaign':
        return <Megaphone className="w-5 h-5 md:w-6 md:h-6" />;
      case 'design_services':
        return <Palette className="w-5 h-5 md:w-6 md:h-6" />;
      case 'school':
        return <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />;
      case 'rocket_launch':
        return <Rocket className="w-5 h-5 md:w-6 md:h-6" />;
      default:
        return <Zap className="w-5 h-5 md:w-6 md:h-6" />;
    }
  };

  return (
    <div className="w-full relative py-12 md:py-20 px-4 md:px-8 max-w-7xl mx-auto transition-colors duration-300">
      {/* Header Panel */}
      <header className="min-w-full mb-14 flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10 select-none max-w-5xl">
        <div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-[56px]} font-bold text-brand-text dark:text-brand-text-dark tracking-tight mb-4">
            Browse by Category
          </h2>
          <p className="font-sans text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
            Discover specialized prompts tailored for leading AI models and specific professional workflows.
          </p>
        </div>
        {/* Info pills */}
        <div className="flex gap-3 mt-2 md:mt-4 self-start">
          <span className="px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-900 text-brand-text dark:text-neutral-300 font-sans text-[13px]} font-semibold flex items-center gap-2 border border-neutral-200/50 dark:border-neutral-800">
            <span className="w-2 h-2 bg-brand-accent rounded-full shrink-0" />
            {categories.reduce((total, category) => total + (category.promptCount || 0), 0).toLocaleString()} Prompts
          </span>
          <span className="px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-900 text-brand-text dark:text-neutral-300 font-sans text-[13px]} font-semibold flex items-center gap-2 border border-neutral-200/50 dark:border-neutral-800">
            <Code2 className="w-4 h-4" />
            Open Source
          </span>
        </div>
      </header>

      {/* Categories Grid with grid-flow-row-dense to pack gaps automatically */}
      {categories.length === 0 ? (
        <div className="relative z-10 py-20 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-[24px] bg-white dark:bg-neutral-900">
          <h3 className="font-display text-2xl font-bold text-brand-text dark:text-white">No categories found</h3>
          <p className="text-sm text-neutral-500 mt-2">Create categories in Supabase to populate this page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 grid-flow-row-dense gap-6 relative z-10">
          {categories.map((cat) => {
            const isFeatured = cat.isTrending;
            if (isFeatured) {
              return (
                <div
                  key={cat.id}
                  onClick={() => onCategorySelected(cat.name)}
                  className="relative bg-white dark:bg-neutral-900 rounded-[24px] p-8 flex flex-col justify-between transition-all duration-300 group cursor-pointer md:col-span-2 min-h-[260px]} h-full select-none hover:shadow-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-[16px]} bg-[#f3e8ff] dark:bg-purple-900/30 text-brand-accent flex items-center justify-center transition-colors">
                      {renderCategoryIcon(cat.iconName)}
                    </div>
                    <span className="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black font-sans font-bold text-[11px]} rounded-full">
                      Trending
                    </span>
                  </div>
                  <div className="mt-8 flex flex-col flex-1 justify-end">
                    <h3 className="font-display text-[26px]} font-bold text-brand-text dark:text-brand-text-dark mb-2 tracking-tight group-hover:text-brand-accent transition-colors">
                      {cat.name}
                    </h3>
                    <p className="font-sans text-neutral-600 dark:text-neutral-400 text-[15px] leading-relaxed">
                      {cat.description}
                    </p>
                    <span className="font-mono text-[11px]} text-neutral-400 dark:text-neutral-500 uppercase block mt-4">
                      {(promptsCountMap[cat.name] || cat.promptCount || 0).toLocaleString()} prompts
                    </span>
                  </div>
                </div>
              );
            }
            return (
              <div
                key={cat.id}
                onClick={() => onCategorySelected(cat.name)}
                className="relative bg-white dark:bg-neutral-900 rounded-[24px] p-8 flex flex-col justify-between transition-all duration-300 group cursor-pointer min-h-[260px]} h-full select-none hover:shadow-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-[16px]} bg-neutral-100/80 text-brand-text dark:bg-neutral-800 dark:text-white flex items-center justify-center transition-all duration-300">
                  {renderCategoryIcon(cat.iconName)}
                </div>
                <div className="mt-8 pt-2 flex flex-col flex-1 justify-end">
                  <h3 className="font-display text-[22px]} font-bold text-brand-text dark:text-brand-text-dark mb-3 tracking-tight group-hover:text-brand-accent transition-colors">
                    {cat.name}
                  </h3>
                  <p className="font-sans text-neutral-600 dark:text-neutral-400 text-[15px] leading-relaxed">
                    {cat.description}
                  </p>
                  <span className="font-mono text-[11px]} text-neutral-400 dark:text-neutral-500 uppercase block mt-4">
                    {(promptsCountMap[cat.name] || cat.promptCount || 0).toLocaleString()} prompts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
