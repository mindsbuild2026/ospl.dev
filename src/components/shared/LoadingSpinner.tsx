/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * LoadingSpinner - Reusable loading indicator component
 */

import React from 'react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading',
  size = 'md',
  fullHeight = true,
}) => {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const containerClasses = fullHeight ? 'flex-1 flex items-center justify-center' : 'flex items-center justify-center';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-4 text-neutral-500 dark:text-neutral-400">
        <div className={`animate-spin rounded-full border-b-2 border-brand-accent ${sizeClasses[size]}`} />
        {label && <span className="text-xs font-bold uppercase tracking-wider">{label}</span>}
      </div>
    </div>
  );
};

LoadingSpinner.displayName = 'LoadingSpinner';
