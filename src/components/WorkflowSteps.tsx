/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Workflow Steps visualization component for multi-step prompts
 */

import React from 'react';
import { ArrowDown } from 'lucide-react';

interface WorkflowStepsProps {
  steps: string[];
}

export default function WorkflowSteps({ steps }: WorkflowStepsProps) {
  if (!steps || steps.length < 2) return null;

  return (
    <section className="space-y-6 mt-12 pt-12 border-t border-neutral-200 dark:border-neutral-800">
      <div>
        <h3 className="font-display text-2xl md:text-3xl font-bold text-brand-text dark:text-brand-text-dark tracking-tight mb-2">
          Workflow Steps
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          This is a multi-step workflow with {steps.length} sequential phases.
        </p>
      </div>

      {/* Timeline visualization */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex gap-4 items-start">
              {/* Step number badge */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-indigo-500 dark:bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  {index + 1}
                </div>
              </div>

              {/* Step content */}
              <div className="flex-1 pt-1">
                <div className="bg-neutral-50 dark:bg-neutral-900/40 rounded-xl p-4 border border-neutral-200/50 dark:border-neutral-800/50">
                  <p className="text-neutral-800 dark:text-neutral-200 font-medium leading-relaxed">
                    {step}
                  </p>
                </div>
              </div>
            </div>

            {/* Connector line between steps */}
            {index < steps.length - 1 && (
              <div className="flex justify-center py-2">
                <div className="flex flex-col items-center">
                  <ArrowDown className="w-5 h-5 text-neutral-300 dark:text-neutral-700 animate-bounce" />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-blue-50/40 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-4 mt-6">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <span className="font-semibold">💡 Tip:</span> Execute each step sequentially to achieve the desired outcome. You can adapt each step based on your specific requirements.
        </p>
      </div>
    </section>
  );
}
