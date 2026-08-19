/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * EmptyState - Reusable component for empty state UI across the application
 */

import React from 'react';
import {
  Inbox,
  Search,
  Heart,
  BookOpen,
  Users,
  Star,
  Package,
  BarChart3,
  Lightbulb,
} from 'lucide-react';

export type EmptyStateType =
  | 'no-prompts'
  | 'no-search-results'
  | 'no-saved'
  | 'no-collections'
  | 'no-categories'
  | 'no-authors'
  | 'no-data'
  | 'no-related'
  | 'no-analytics'
  | 'no-tags'
  | 'custom';

const emptyStateConfig: Record<EmptyStateType, { icon: React.ReactNode; title: string; description: string }> = {
  'no-prompts': {
    icon: <Inbox className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />,
    title: 'No prompts found',
    description: 'Try adjusting your filters or search terms to find what you\'re looking for.',
  },
  'no-search-results': {
    icon: <Search className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />,
    title: 'No results found',
    description: 'We couldn\'t find anything matching your search. Try different keywords.',
  },
  'no-saved': {
    icon: <Heart className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />,
    title: 'No saved prompts yet',
    description: 'Start building your collection by saving prompts as you browse.',
  },
  'no-collections': {
    icon: <Package className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />,
    title: 'No collections available',
    description: 'Collections will appear here once they\'re created and populated.',
  },
  'no-categories': {
    icon: <BookOpen className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />,
    title: 'No categories available',
    description: 'Create categories in Supabase to organize prompts by topic.',
  },
  'no-authors': {
    icon: <Users className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />,
    title: 'No authors found',
    description: 'Authors will appear here as they publish prompts to the community.',
  },
  'no-data': {
    icon: <BarChart3 className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />,
    title: 'No data available',
    description: 'Data will be populated as activity occurs on the platform.',
  },
  'no-related': {
    icon: <Lightbulb className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />,
    title: 'No related prompts',
    description: 'Check back later for similar prompts in this category.',
  },
  'no-analytics': {
    icon: <BarChart3 className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />,
    title: 'No analytics data',
    description: 'Analytics will appear here once you start tracking activity.',
  },
  'no-tags': {
    icon: <Star className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />,
    title: 'No tags available',
    description: 'Tags will appear here as prompts are created and tagged.',
  },
  'custom': {
    icon: <Inbox className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />,
    title: 'Nothing to show',
    description: 'Check back later or try adjusting your search criteria.',
  },
};

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-data',
  title,
  description,
  message,
  icon,
  action,
  compact = false,
  className = '',
}) => {
  const config = emptyStateConfig[type];
  const displayTitle = title || (message ? message : config.title);
  const displayDescription = description || (title && message ? message : config.description);
  const displayIcon = icon || config.icon;

  if (compact) {
    return (
      <div className={`py-8 text-center ${className}`}>
        <div className="flex justify-center mb-3">{displayIcon}</div>
        <h3 className="font-display text-lg font-bold text-brand-text dark:text-white">{displayTitle}</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{displayDescription}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-4 px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent/90 text-white font-semibold text-sm transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-[24px] border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30 p-12 sm:p-16 text-center ${className}`}
    >
      <div className="flex justify-center mb-6">{displayIcon}</div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-text dark:text-white">
        {displayTitle}
      </h2>
      <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mt-3 max-w-md mx-auto leading-relaxed">
        {displayDescription}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 px-6 py-3 rounded-xl bg-brand-accent hover:bg-brand-accent/90 text-white font-semibold text-sm transition-colors inline-flex items-center gap-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';
