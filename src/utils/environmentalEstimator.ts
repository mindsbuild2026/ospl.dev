/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * EnvironmentalImpactEstimator Service
 * Dedicated, deterministic, non-blocking environmental workload estimation service.
 */

import { EnvironmentalEstimate, PromptSubmissionVariable } from '../types';

export interface WorkflowStepWorkload {
  stepNumber: number;
  stepTitle: string;
  promptLength: number;
  imageCount: number;
  estimatedTokens: number;
  energyKwh: number;
  waterMlMin: number;
  waterMlMax: number;
}

export interface WorkloadInput {
  systemPrompt?: string;
  userPrompt?: string;
  expectedOutput?: string;
  variables?: PromptSubmissionVariable[];
  targetModel?: string;
  targetProvider?: string;
  imageCount?: number;
  pipelineMode?: string;
  maxTokens?: number;
  structuredOutput?: string;
  runCount?: number; // Default 1,000 runs
  workflowSteps?: {
    stepNumber: number;
    stepTitle: string;
    prompt: string;
    imageCount?: number;
  }[];
}

export const METHODOLOGY_VERSION = 'v1.0';

export interface EnvironmentalEstimate {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  imageCount: number;
  targetModel: string;
  targetProvider: string;
  energyKwh: number;
  waterMlMin: number;
  waterMlMax: number;
  co2Grams: number;
  confidenceScore: number;
  methodologyVersion: string;
  calculatedAt: string;
  stepBreakdown?: WorkflowStepWorkload[];
}

/**
 * Dedicated Environmental Impact Estimator
 * Accepts normalized workload parameters and produces deterministic range estimates.
 * Order: Prompt -> Gemini Validation -> Prompt/Step Analysis -> Workload Analysis -> Environmental Estimate
 */
export function estimateEnvironmentalImpact(workload: WorkloadInput): EnvironmentalEstimate {
  try {
    const {
      systemPrompt = '',
      userPrompt = '',
      expectedOutput = '',
      variables = [],
      targetModel = 'Gemini 2.5 Flash',
      targetProvider = 'Google',
      imageCount = 0,
      maxTokens = 2048,
      runCount = 1000,
      workflowSteps = [],
    } = workload;

    // Model kWh coefficient per 1M tokens
    let kWhPerMillionTokens = 0.25;
    const modelLower = targetModel.toLowerCase();
    if (modelLower.includes('flash') || modelLower.includes('mini') || modelLower.includes('haiku') || modelLower.includes('turbo')) {
      kWhPerMillionTokens = 0.15;
    } else if (modelLower.includes('opus') || modelLower.includes('o1') || modelLower.includes('ultra')) {
      kWhPerMillionTokens = 1.10;
    } else if (modelLower.includes('gpt-4') || modelLower.includes('claude') || modelLower.includes('pro')) {
      kWhPerMillionTokens = 0.45;
    }

    let stepBreakdown: WorkflowStepWorkload[] | undefined = undefined;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalImages = imageCount;

    if (workflowSteps.length > 0) {
      // Calculate per-step workload breakdown for multi-step workflows
      stepBreakdown = workflowSteps.map((step) => {
        const stepPromptLength = step.prompt?.length || 0;
        const stepInputTokens = Math.max(10, Math.ceil(stepPromptLength / 4));
        const stepImages = step.imageCount || 0;
        const stepTokensAllRuns = (stepInputTokens + 50) * runCount;
        const stepEnergy = (stepTokensAllRuns / 1_000_000) * kWhPerMillionTokens + stepImages * runCount * 0.002;
        
        return {
          stepNumber: step.stepNumber,
          stepTitle: step.stepTitle || `Step ${step.stepNumber}`,
          promptLength: stepPromptLength,
          imageCount: stepImages,
          estimatedTokens: stepInputTokens,
          energyKwh: Math.round(stepEnergy * 1000) / 1000,
          waterMlMin: Math.round(stepEnergy * 450 * 10) / 10,
          waterMlMax: Math.round(stepEnergy * 1400 * 10) / 10,
        };
      });

      totalInputTokens = stepBreakdown.reduce((sum, s) => sum + s.estimatedTokens, 0);
      totalOutputTokens = Math.min(maxTokens, Math.ceil(totalInputTokens * 0.8));
      totalImages = stepBreakdown.reduce((sum, s) => sum + s.imageCount, 0);
    } else {
      // Single prompt workload
      const systemChars = systemPrompt.length;
      const userChars = userPrompt.length;
      const varChars = variables.reduce((acc, v) => acc + (v.name.length + v.label.length + (v.description?.length || 0)), 0);
      const inputChars = systemChars + userChars + varChars;

      totalInputTokens = Math.max(10, Math.ceil(inputChars / 4));
      totalOutputTokens = expectedOutput.trim()
        ? Math.max(20, Math.ceil(expectedOutput.length / 4))
        : Math.min(maxTokens, Math.max(50, Math.ceil(totalInputTokens * 0.8)));
    }

    const totalTokensPerRun = totalInputTokens + totalOutputTokens;
    const totalTokensAllRuns = totalTokensPerRun * runCount;

    const baseEnergyKwh = (totalTokensAllRuns / 1_000_000) * kWhPerMillionTokens;
    const imageEnergyKwh = totalImages * runCount * 0.002;
    const totalEnergyKwh = Math.round((baseEnergyKwh + imageEnergyKwh) * 1000) / 1000;

    // Water Cooling Footprint Range (mL water per kWh data center cooling)
    const waterMlMin = Math.round(totalEnergyKwh * 450 * 10) / 10;
    const waterMlMax = Math.round(totalEnergyKwh * 1400 * 10) / 10;

    // CO2 Equivalent Emissions (g CO2e)
    const co2Grams = Math.round(totalEnergyKwh * 385 * 10) / 10;

    return {
      estimatedInputTokens: totalInputTokens,
      estimatedOutputTokens: totalOutputTokens,
      imageCount: totalImages,
      targetModel,
      targetProvider,
      energyKwh: totalEnergyKwh,
      waterMlMin,
      waterMlMax,
      co2Grams,
      confidenceScore: 0.85, // Medium Confidence
      methodologyVersion: METHODOLOGY_VERSION,
      calculatedAt: new Date().toISOString(),
      stepBreakdown,
    };
  } catch (err) {
    console.warn('[EnvironmentalImpactEstimator] Calculation error fallback applied:', err);
    return {
      estimatedInputTokens: 0,
      estimatedOutputTokens: 0,
      imageCount: workload.imageCount || 0,
      targetModel: workload.targetModel || 'Unknown',
      targetProvider: workload.targetProvider || 'Unknown',
      energyKwh: 0,
      waterMlMin: 0,
      waterMlMax: 0,
      co2Grams: 0,
      confidenceScore: 0.0,
      methodologyVersion: METHODOLOGY_VERSION,
      calculatedAt: new Date().toISOString(),
    };
  }
}

/** Alias wrapper for backwards compatibility */
export function estimateEnvironmentalFootprint(workload: WorkloadInput): EnvironmentalEstimate {
  return estimateEnvironmentalImpact(workload);
}
