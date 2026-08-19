/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CasualCreatorView Component
 * Renders the authoring interface matching Reference Image #1 with precision.
 */

import React, { useState } from 'react';
import { Sparkles, ChevronDown, Wand2, Type, Sliders, RefreshCw, CheckCircle2, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { PromptSubmissionPayload, PromptSubmissionAsset } from '../../types';
import { PromptSubmissionLookups } from '../../lib/promptRepository';
import { ImageProofUploader } from './ImageProofUploader';
import { EnvironmentalImpactCard } from './EnvironmentalImpactCard';
import { VariableInfoTooltip } from './VariableInfoTooltip';
import { UnifiedClassificationForm } from './UnifiedClassificationForm';

export interface CasualCreatorViewProps {
  submission: PromptSubmissionPayload;
  lookupData: PromptSubmissionLookups | null;
  fieldErrors: Record<string, string>;
  detectedVariables: string[];
  onUpdateField: (patch: Partial<PromptSubmissionPayload>) => void;
  onGenerateAiDetails: (promptText: string) => Promise<void>;
  onUploadAsset: (file: File) => Promise<void>;
  onRemoveAsset: (assetId: string) => Promise<void>;
  onRetryAssetUpload?: (asset: PromptSubmissionAsset) => Promise<void>;
  isAiLoading?: boolean;
}

export function CasualCreatorView({
  submission,
  lookupData,
  fieldErrors,
  detectedVariables,
  onUpdateField,
  onGenerateAiDetails,
  onUploadAsset,
  onRemoveAsset,
  onRetryAssetUpload,
  isAiLoading = false,
}: CasualCreatorViewProps) {
  const [tagInput, setTagInput] = useState('');

  const categoryOptions = lookupData?.categories || [];
  const availableSubcategories = lookupData?.subcategories.filter((s) => s.categoryId === submission.category_id) || [];
  const aiPlatforms = lookupData?.aiPlatforms || [];
  const allTags = lookupData?.tags || [];

  const handleAddTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed) return;
    const match = allTags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase() || t.slug.toLowerCase() === trimmed.toLowerCase());
    const tagId = match ? match.id : trimmed;
    if (!submission.tag_ids.includes(tagId)) {
      onUpdateField({ tag_ids: [...submission.tag_ids, tagId] });
    }
    setTagInput('');
  };

  const handleTogglePlatform = (platformId: string) => {
    const exists = submission.ai_platform_ids.includes(platformId);
    if (exists) {
      if (submission.ai_platform_ids.length > 1) {
        onUpdateField({ ai_platform_ids: submission.ai_platform_ids.filter((id) => id !== platformId) });
      }
    } else {
      onUpdateField({ ai_platform_ids: [...submission.ai_platform_ids, platformId] });
    }
  };

  const currentPrompt = submission.user_prompt || submission.system_prompt;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
      {/* LEFT COLUMN: Main Authoring Workspace (~65%) */}
      <div className="space-y-6">
        {/* Card: PRIMARY PROMPT INPUT EDITOR */}
        <div className="rounded-[28px] border border-neutral-200/80 bg-white p-6 md:p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">
                Paste Your Prompt
              </h2>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center flex-wrap gap-1">
                <span>Paste your tested AI prompt below. For dynamic inputs, use <code className="font-mono text-purple-600 font-bold">{`{{variable_name}}`}</code></span>
                <VariableInfoTooltip samplePrompt="Act as an expert AI assistant. Generate a high-converting landing page for {{product_name}} targeting {{target_audience}}." />
              </div>
            </div>

            <button
              type="button"
              onClick={() => onGenerateAiDetails(currentPrompt)}
              disabled={isAiLoading || !currentPrompt.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 px-4 py-2 text-xs font-bold transition-all disabled:opacity-50 shrink-0"
              title="Force re-generate AI metadata suggestions"
            >
              {isAiLoading ? (
                <Loader2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-300 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 text-purple-600 dark:text-purple-300" />
              )}
              <span>Regenerate AI Details</span>
            </button>
          </div>

          {/* Live AI Validation Status Banner */}
          {isAiLoading && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 p-3 text-xs text-purple-700 dark:text-purple-300 font-semibold animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>Gemini is validating and analyzing your prompt...</span>
            </div>
          )}

          {submission.ai_validation_status && !isAiLoading && (
            <div className={`mb-4 flex items-center justify-between rounded-xl p-3 text-xs font-semibold border ${
              submission.ai_validation_status === 'pass'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : submission.ai_validation_status === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}>
              <div className="flex items-center gap-2">
                {submission.ai_validation_status === 'pass' && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                {submission.ai_validation_status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />}
                {submission.ai_validation_status === 'fail' && <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />}
                <span>
                  {submission.ai_validation_status === 'pass' && 'Gemini Quality Check: Valid Prompt'}
                  {submission.ai_validation_status === 'warning' && 'Gemini Quality Check: Valid with Suggestions'}
                  {submission.ai_validation_status === 'fail' && 'Gemini Quality Check: Issue Detected'}
                </span>
              </div>
              {submission.ai_quality_score !== undefined && (
                <span className="font-mono font-bold text-xs bg-white/60 dark:bg-black/40 px-2.5 py-0.5 rounded-full">
                  Score: {submission.ai_quality_score}/100
                </span>
              )}
            </div>
          )}

          {/* Primary Textarea Prompt Editor Box */}
          <div className={`relative rounded-2xl border bg-neutral-50/50 dark:bg-neutral-900/40 p-4 transition-all focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-500/10 ${
            fieldErrors.user_prompt || fieldErrors.system_prompt ? 'border-red-400 bg-red-50/20' : 'border-neutral-200 dark:border-neutral-800'
          }`}>
            <textarea
              value={currentPrompt}
              onChange={(e) => {
                onUpdateField({
                  user_prompt: e.target.value,
                  system_prompt: e.target.value,
                });
              }}
              rows={12}
              placeholder="Paste or write your prompt here. For dynamic inputs, use {{variable_name}}..."
              className="w-full resize-none bg-transparent font-mono text-sm text-neutral-900 dark:text-white placeholder-neutral-400 outline-none leading-relaxed"
            />

            <div className="flex items-center justify-end border-t border-neutral-200/40 dark:border-neutral-800/40 pt-2 text-[10px] font-semibold text-neutral-400 gap-1">
              <span>Use <code className="font-mono font-bold text-purple-600">{`{{variable_name}}`}</code> for dynamic inputs</span>
              <VariableInfoTooltip />
            </div>

            {/* Live Detected Variables Footer Bar */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200/60 dark:border-neutral-800/60 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                  <span>DETECTED VARIABLES</span>
                  <VariableInfoTooltip />
                </span>

                {detectedVariables.length > 0 ? (
                  detectedVariables.map((varName) => (
                    <span
                      key={varName}
                      className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/50 px-2.5 py-0.5 text-xs font-bold text-purple-700 dark:text-purple-300"
                    >
                      <span>• {`{{${varName}}}`}</span>
                      <VariableInfoTooltip variableName={varName} />
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-neutral-400 italic">No variables detected yet</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                <span>Live Variable Detection Active</span>
              </div>
            </div>
          </div>

          {(fieldErrors.user_prompt || fieldErrors.system_prompt) && (
            <p className="mt-2 text-xs font-semibold text-red-600">{fieldErrors.user_prompt || fieldErrors.system_prompt}</p>
          )}
        </div>

        {/* Supplementary Non-Blocking Environmental Impact Estimation */}
        <EnvironmentalImpactCard
          systemPrompt={submission.system_prompt}
          userPrompt={submission.user_prompt}
          expectedOutput={submission.expected_output}
          variables={submission.variables}
          targetModel={submission.recommended_models[0]?.name}
          imageCount={submission.assets?.length || 0}
        />

        {/* Compact Reference Images Card (Optional) */}
        <div className="rounded-[28px] border border-neutral-200/80 bg-white p-6 md:p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mb-2">
            <h3 className="font-display text-base font-bold text-neutral-900 dark:text-white">
              Optional Reference Images / Proof
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Attach optional screenshots or visual output examples to illustrate prompt performance.
            </p>
          </div>
          <ImageProofUploader
            assets={submission.assets || []}
            onUploadFile={onUploadAsset}
            onRemoveAsset={onRemoveAsset}
            onRetryUpload={onRetryAssetUpload}
          />
        </div>
      </div>

      {/* RIGHT SIDEBAR COLUMN (~35%) */}
      <div className="space-y-6">
        {/* Card 1: BASIC INFORMATION */}
        <div className="rounded-[28px] border border-neutral-200/80 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-4">
            BASIC INFORMATION
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Prompt Title <span className="text-purple-600">*</span>
              </label>
              <input
                type="text"
                value={submission.title}
                onChange={(e) => onUpdateField({ title: e.target.value })}
                placeholder="e.g. Master Creative Copywriter"
                className={`w-full rounded-xl border px-4 py-3 text-xs text-neutral-900 dark:text-white bg-neutral-50/50 dark:bg-neutral-900/50 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 ${
                  fieldErrors.title ? 'border-red-400 bg-red-50/30' : 'border-neutral-200 dark:border-neutral-800'
                }`}
              />
              {fieldErrors.title && <p className="text-[11px] text-red-600">{fieldErrors.title}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Short Description <span className="text-purple-600">*</span>
              </label>
              <input
                type="text"
                value={submission.short_description}
                onChange={(e) => onUpdateField({ short_description: e.target.value })}
                placeholder="Briefly state what it does"
                className={`w-full rounded-xl border px-4 py-3 text-xs text-neutral-900 dark:text-white bg-neutral-50/50 dark:bg-neutral-900/50 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 ${
                  fieldErrors.short_description ? 'border-red-400 bg-red-50/30' : 'border-neutral-200 dark:border-neutral-800'
                }`}
              />
              {fieldErrors.short_description && <p className="text-[11px] text-red-600">{fieldErrors.short_description}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Detailed Description <span className="text-purple-600">*</span>
              </label>
              <textarea
                value={submission.description}
                onChange={(e) => onUpdateField({ description: e.target.value })}
                rows={4}
                placeholder="Explain the logic and use cases..."
                className={`w-full resize-none rounded-xl border px-4 py-3 text-xs text-neutral-900 dark:text-white bg-neutral-50/50 dark:bg-neutral-900/50 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 ${
                  fieldErrors.description ? 'border-red-400 bg-red-50/30' : 'border-neutral-200 dark:border-neutral-800'
                }`}
              />
              {fieldErrors.description && <p className="text-[11px] text-red-600">{fieldErrors.description}</p>}
            </div>
          </div>
        </div>

        {/* Card 2: CLASSIFICATION (Shared Backend Classification Form) */}
        <UnifiedClassificationForm
          sectionTitle="Classification"
          submission={submission}
          lookupData={lookupData}
          fieldErrors={fieldErrors}
          onUpdateField={onUpdateField}
        />

        {/* Card 3: AI OPTIMIZATION */}
        {/* <div className="rounded-[28px] border border-neutral-200/80 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI OPTIMIZATION</span>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onGenerateAiDetails(submission.user_prompt)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50/80 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-850 px-4 py-3 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-all"
            >
              <Type className="h-3.5 w-3.5 text-purple-600" />
              <span>Improve Tone</span>
            </button>

            <button
              type="button"
              onClick={() => onGenerateAiDetails(submission.user_prompt)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50/80 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-850 px-4 py-3 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-all"
            >
              <Sliders className="h-3.5 w-3.5 text-purple-600" />
              <span>Check Clarity</span>
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
}
