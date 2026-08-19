/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ErrorAlert - Reusable error message display component
 */

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  title?: string;
  onDismiss?: () => void;
  variant?: 'inline' | 'banner' | 'page';
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  title = 'Error',
  onDismiss,
  variant = 'inline',
}) => {
  if (variant === 'banner') {
    return (
      <div className="absolute z-10 w-full left-0 top-[80px] bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30 transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-red-800 dark:text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">{title}</p>
              <p className="text-red-700 dark:text-red-200 text-xs">{message}</p>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="shrink-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
              aria-label="Dismiss error"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && <p className="font-semibold text-red-700 dark:text-red-300 text-sm">{title}</p>}
          <p className={`text-red-600 dark:text-red-400 text-sm ${title ? 'mt-1' : ''}`}>{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 -mr-2 -mt-2"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

ErrorAlert.displayName = 'ErrorAlert';
