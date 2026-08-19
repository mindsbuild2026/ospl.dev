/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * EnvironmentalImpactCard Component
 * Renders estimated water footprint range and environmental metrics per 1k runs.
 */

import React, { useMemo } from 'react';
import { Droplet, Leaf, Zap, Info, AlertCircle } from 'lucide-react';
import { estimateEnvironmentalImpact, WorkloadInput } from '../../utils/environmentalEstimator';
import { PromptSubmissionVariable } from '../../types';

export interface EnvironmentalImpactCardProps {
  systemPrompt?: string;
  userPrompt?: string;
  expectedOutput?: string;
  variables?: PromptSubmissionVariable[];
  targetModel?: string;
  targetProvider?: string;
  imageCount?: number;
  maxTokens?: number;
  pipelineMode?: string;
  workflowSteps?: {
    stepNumber: number;
    stepTitle: string;
    prompt: string;
    imageCount?: number;
  }[];
}

export function EnvironmentalImpactCard({
  systemPrompt = '',
  userPrompt = '',
  expectedOutput = '',
  variables = [],
  targetModel = 'Gemini 2.5 Flash',
  targetProvider = 'Google',
  imageCount = 0,
  maxTokens = 2048,
  pipelineMode = 'single_shot',
  workflowSteps = [],
}: EnvironmentalImpactCardProps) {
  const workload: WorkloadInput = useMemo(
    () => ({
      systemPrompt,
      userPrompt,
      expectedOutput,
      variables,
      targetModel,
      targetProvider,
      imageCount,
      maxTokens,
      pipelineMode,
      workflowSteps,
      runCount: 1000,
    }),
    [systemPrompt, userPrompt, expectedOutput, variables, targetModel, targetProvider, imageCount, maxTokens, pipelineMode, workflowSteps]
  );

  const estimate = useMemo(() => {
    return estimateEnvironmentalImpact(workload);
  }, [workload]);

  const isUnavailable = estimate.confidenceScore === 0 || (estimate.waterMlMin === 0 && estimate.waterMlMax === 0);

  if (isUnavailable) {
    return (
      <div className="rounded-[24px] border border-neutral-200 bg-neutral-50/50 p-5 dark:border-neutral-800 dark:bg-neutral-900/30 text-center">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-neutral-500">
          <AlertCircle className="h-4 w-4 text-neutral-400" />
          <span>Environmental estimate unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-emerald-200/80 bg-emerald-50/30 p-6 dark:border-emerald-900/40 dark:bg-emerald-950/20 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-300">
            <Droplet className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <span>💧 Estimated Water Footprint</span>
            </h4>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
              Per 1,000 runs ({estimate.methodologyVersion})
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
          <span>Confidence: Medium</span>
        </div>
      </div>

      {/* Main Water Footprint Range Display (Overall Workflow Estimate) */}
      <div className="rounded-2xl border border-emerald-200/60 bg-white p-4 dark:border-emerald-900/30 dark:bg-neutral-900">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
            {workflowSteps.length > 0 ? 'Overall Workflow Water Footprint' : 'Water Footprint'}
          </span>
          <span className="font-mono text-lg font-extrabold text-blue-600 dark:text-blue-400">
            ~{estimate.waterMlMin} – {estimate.waterMlMax} <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">mL / 1k runs</span>
          </span>
        </div>
      </div>

      {/* Per-Step Breakdown for Multi-Step Workflows */}
      {estimate.stepBreakdown && estimate.stepBreakdown.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 block">
            Step-by-step Workload Breakdown ({estimate.stepBreakdown.length} Steps)
          </span>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {estimate.stepBreakdown.map((step) => (
              <div
                key={step.stepNumber}
                className="flex items-center justify-between p-2 rounded-xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/60 dark:border-neutral-800 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-bold text-purple-600">0{step.stepNumber}</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[150px]">
                    {step.stepTitle}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
                  ~{step.waterMlMin} – {step.waterMlMax} mL
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid for Secondary Energy & Carbon Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-200/40 bg-white/80 p-3 dark:border-emerald-900/20 dark:bg-neutral-900/60">
          <div className="flex items-center gap-1 text-amber-500 mb-0.5">
            <Zap className="h-3.5 w-3.5" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Compute Energy</span>
          </div>
          <p className="text-xs font-bold text-neutral-900 dark:text-white">
            ~{estimate.energyKwh} <span className="text-[10px] font-normal text-neutral-500">kWh</span>
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200/40 bg-white/80 p-3 dark:border-emerald-900/20 dark:bg-neutral-900/60">
          <div className="flex items-center gap-1 text-emerald-600 mb-0.5">
            <Leaf className="h-3.5 w-3.5" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">CO₂e Grid Mix</span>
          </div>
          <p className="text-xs font-bold text-neutral-900 dark:text-white">
            ~{estimate.co2Grams} <span className="text-[10px] font-normal text-neutral-500">g</span>
          </p>
        </div>
      </div>

      {/* Supporting Disclaimer Text */}
      <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 dark:text-neutral-400 italic">
        <Info className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
        <span>Estimated from workload and model/infrastructure assumptions. Never an exact measurement.</span>
      </div>
    </div>
  );
}
