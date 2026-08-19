/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ErrorBoundary - React error boundary for graceful error handling
 */

import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  static displayName = 'ErrorBoundary';

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-brand-bg dark:bg-brand-bg-dark p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#121214] rounded-[24px] border border-neutral-100 dark:border-neutral-800 p-8 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="font-display text-2xl font-bold text-brand-text dark:text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg text-left border border-red-100 dark:border-red-900/30">
                <p className="text-xs font-mono text-red-700 dark:text-red-300 whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <p className="text-xs font-mono text-red-600 dark:text-red-400 mt-2 max-h-32 overflow-y-auto">
                    {this.state.errorInfo.componentStack}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-brand-accent text-white px-6 py-3 font-semibold text-sm hover:bg-brand-hover transition-colors"
              >
                <RotateCw className="w-4 h-4" />
                Refresh Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 px-6 py-3 font-semibold text-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.displayName = 'ErrorBoundary';
