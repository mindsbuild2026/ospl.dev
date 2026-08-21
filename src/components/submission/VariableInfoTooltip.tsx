/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * VariableInfoTooltip Component
 * Renders a small 'i' rounded info badge that displays a sample prompt paragraph
 * and usage guidance when hovered over by the user.
 */

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

export interface VariableInfoTooltipProps {
  variableName?: string;
  samplePrompt?: string;
  customHint?: string;
}

export function VariableInfoTooltip({
  variableName = 'variable_name',
  samplePrompt,
  customHint,
}: VariableInfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const cleanName = variableName.replace(/[\{\}]/g, '').trim() || 'variable_name';
  const defaultSamplePrompt = `Act as an expert AI assistant. Generate a production-ready solution for {{${cleanName}}}. Ensure the output satisfies {{target_audience}} requirements and adheres to strict quality guidelines.`;

  return (
    <span
      className="relative inline-flex items-center ml-1 z-20"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Small 'i' rounded icon badge */}
      <button
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer text-[10px] font-bold font-mono border border-purple-200 dark:border-purple-800 shrink-0 select-none"
        title="Hover to view dynamic variable hint"
        aria-label="Variable input hint"
      >
        i
      </button>

      {/* Hover Tooltip Popover */}
      {isOpen && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-72 md:w-80 rounded-2xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-neutral-900 p-4 shadow-xl z-50 pointer-events-none select-text text-left space-y-2.5 animate-in fade-in zoom-in-95 duration-150 block">
          <span className="flex items-center gap-2 border-b border-purple-100 dark:border-purple-950/80 pb-2 block">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 inline-block" />
            <span className="font-mono text-xs font-extrabold text-purple-700 dark:text-purple-300">
              {`{{${cleanName}}}`} Dynamic Input
            </span>
          </span>

          <span className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed block">
            {customHint || `Wrap variable names in double curly braces {{${cleanName}}} inside your prompt text. OSPL automatically detects them and creates input fields for end users.`}
          </span>

          <span className="rounded-xl border border-purple-100 dark:border-purple-900/50 bg-purple-50/50 dark:bg-neutral-950 p-3 space-y-1.5 block">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400 block">
              Sample Prompt Paragraph:
            </span>
            <span className="font-mono text-[11px] text-neutral-800 dark:text-neutral-200 leading-relaxed italic block">
              "{samplePrompt || defaultSamplePrompt}"
            </span>
          </span>

          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 italic block">
            💡 Example user input value: <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">"{cleanName} = SaaS Landing Page"</span>
          </span>

          {/* Arrow Indicator */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white dark:border-t-neutral-900 block" />
        </span>
      )}
    </span>
  );
}
