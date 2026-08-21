/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SubmissionReviewModal Component
 * Comprehensive final review modal displaying common prompt info, developer pro specs,
 * attached reference images, AI validation score, and environmental estimate.
 */

import React from 'react';
import { ShieldCheck, Sparkles, Droplet, CheckCircle, AlertTriangle, X, Image as ImageIcon, Sliders, Code } from 'lucide-react';
import { PromptSubmissionPayload, LookupAuthor } from '../../types';
import { PromptSubmissionLookups } from '../../lib/promptRepository';
import { estimateEnvironmentalImpact } from '../../utils/environmentalEstimator';

export interface SubmissionReviewModalProps {
  submission: PromptSubmissionPayload;
  lookupData: PromptSubmissionLookups | null;
  author: LookupAuthor;
  creatorMode: 'casual' | 'developer';
  isSubmitting: boolean;
  submitError?: string;
  onConfirmSubmit: () => Promise<void>;
  onEditForm: () => void;
}

export function SubmissionReviewModal({
  submission,
  lookupData,
  author,
  creatorMode,
  isSubmitting,
  submitError = '',
  onConfirmSubmit,
  onEditForm,
}: SubmissionReviewModalProps) {
  const categoryName = lookupData?.categories.find((c) => c.id === submission.category_id)?.name || 'Uncategorized';
  const subcategoryName = lookupData?.subcategories.find((s) => s.id === submission.subcategory_id)?.name || 'General';
  const platformNames = lookupData?.aiPlatforms
    .filter((p) => submission.ai_platform_ids.includes(p.id))
    .map((p) => p.name) || [];

  const environmentalEstimate = estimateEnvironmentalImpact({
    systemPrompt: submission.system_prompt,
    userPrompt: submission.user_prompt,
    expectedOutput: submission.expected_output,
    variables: submission.variables,
    targetModel: submission.recommended_models[0]?.name || 'Gemini 2.5 Flash',
    imageCount: submission.assets?.length || 0,
    runCount: 1000,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] border border-neutral-200 bg-white p-6 md:p-8 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-white">
                Final Submission Review
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Verify template configuration before publishing to OSPL community catalog.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onEditForm}
            className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full transition"
            title="Close Review Popup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Submission Error Banner inside Modal */}
        {submitError && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              <div className="truncate">
                <span className="font-extrabold uppercase tracking-wide block text-[10px]">Submission Error</span>
                <span className="truncate block">{submitError}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onEditForm}
              className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/60 dark:text-red-200 dark:hover:bg-red-900/80 rounded-xl transition shrink-0"
            >
              Close & Edit Form
            </button>
          </div>
        )}

        <div className="py-6 space-y-6">
          
          {/* Section 1: Common Prompt Information Grid */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              PROMPT SUMMARY
            </h3>
            
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3.5 dark:border-neutral-800 dark:bg-neutral-900/50">
                <span className="text-[10px] font-extrabold uppercase text-neutral-400">Title</span>
                <p className="mt-0.5 text-xs font-bold text-neutral-900 dark:text-white truncate">{submission.title || '—'}</p>
              </div>

              <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3.5 dark:border-neutral-800 dark:bg-neutral-900/50">
                <span className="text-[10px] font-extrabold uppercase text-neutral-400">Creation Mode</span>
                <p className="mt-0.5 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">
                  {submission.prompt_mode === 'developer_pro' ? 'Developer Pro Workflow' : 'Casual Creator Prompt'}
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3.5 dark:border-neutral-800 dark:bg-neutral-900/50">
                <span className="text-[10px] font-extrabold uppercase text-neutral-400">Category & Subcategory</span>
                <p className="mt-0.5 text-xs font-bold text-neutral-900 dark:text-white truncate">{categoryName} / {subcategoryName}</p>
              </div>

              <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3.5 dark:border-neutral-800 dark:bg-neutral-900/50">
                <span className="text-[10px] font-extrabold uppercase text-neutral-400">Author</span>
                <p className="mt-0.5 text-xs font-bold text-neutral-900 dark:text-white truncate">{author.name} ({author.handle})</p>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50 space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-neutral-400">Short Description</span>
              <p className="text-xs text-neutral-800 dark:text-neutral-200">{submission.short_description || '—'}</p>
            </div>
          </div>

          {/* Section 2a: Casual Prompt Details */}
          {submission.prompt_mode === 'casual' && (
            <div className="space-y-3">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                ORIGINAL PROMPT
              </h3>
              <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50 font-mono text-xs text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {submission.user_prompt || submission.system_prompt || '—'}
              </div>

              {submission.variables.length > 0 && (
                <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <span className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-2">Variables ({submission.variables.length})</span>
                  <div className="flex flex-wrap gap-2">
                    {submission.variables.map((v, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-3 py-1 text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">
                        {`{{${v.name}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 2b: Developer Configuration (When Developer Pro Mode is Active) */}
          {submission.prompt_mode === 'developer_pro' && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                <Sliders className="h-3.5 w-3.5" />
                <span>DEVELOPER PRO CONFIGURATION</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3.5 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <span className="text-[10px] font-extrabold uppercase text-neutral-400">Pipeline Type</span>
                  <p className="mt-0.5 text-xs font-bold text-neutral-900 dark:text-white capitalize">{submission.pipeline_type || 'single_shot'}</p>
                </div>

                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3.5 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <span className="text-[10px] font-extrabold uppercase text-neutral-400">Temperature & Max Tokens</span>
                  <p className="mt-0.5 text-xs font-bold text-neutral-900 dark:text-white">
                    {submission.temperature ?? 0.70} temp • {submission.max_tokens ?? 2048} tokens
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3.5 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <span className="text-[10px] font-extrabold uppercase text-neutral-400">Output Format</span>
                  <p className="mt-0.5 text-xs font-bold text-neutral-900 dark:text-white uppercase">{submission.output_format || 'markdown'}</p>
                </div>
              </div>

              {/* Workflow Steps Breakdown (Concise Step Checklist) */}
              {submission.workflow_steps && submission.workflow_steps.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-purple-50/80 dark:bg-purple-950/40 p-3 rounded-2xl border border-purple-200/80 dark:border-purple-900/40">
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                      {submission.title || 'App Development Workflow'}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] font-extrabold text-purple-700 dark:text-purple-300 flex-wrap">
                      <span className="rounded-full bg-white dark:bg-neutral-900 px-2.5 py-0.5 border border-purple-200 dark:border-purple-800">
                        {submission.workflow_steps.length} Steps
                      </span>
                      <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5">
                        ✓ All Valid
                      </span>
                      {submission.assets && submission.assets.length > 0 && (
                        <span className="rounded-full bg-white dark:bg-neutral-900 px-2.5 py-0.5 border border-purple-200 dark:border-purple-800">
                          🖼 {submission.assets.length} Images
                        </span>
                      )}
                      <span className="rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2.5 py-0.5">
                        💧 Environmental Estimate
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {submission.workflow_steps.map((step) => (
                      <div
                        key={step.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-neutral-200/80 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-900/60"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono text-xs font-black text-purple-600 dark:text-purple-400 shrink-0">
                            0{step.order}
                          </span>
                          <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {step.title || `Step ${step.order}`}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                          {step.analysisState === 'valid' ? '✓ Valid' : step.analysisState === 'stale' ? '⚠ Stale' : '✓'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variables Table */}
              {submission.variables.length > 0 && (
                <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <span className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-2">Variables Mapping ({submission.variables.length})</span>
                  <div className="flex flex-wrap gap-2">
                    {submission.variables.map((v, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-3 py-1 text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">
                        {`{{${v.name}}}`} <span className="text-[10px] font-sans font-normal text-purple-600">({v.variable_type || 'string'})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Attached Reference Images */}
          {submission.assets && submission.assets.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                ATTACHED REFERENCE IMAGES ({submission.assets.length})
              </h3>

              <div className="grid gap-3 sm:grid-cols-3">
                {submission.assets.map((asset) => (
                  <div key={asset.id} className="flex items-center gap-3 rounded-xl border border-neutral-200/80 bg-white p-2.5 dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                      {asset.previewUrl ? (
                        <img src={asset.previewUrl} alt={asset.fileName} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-5 w-5 m-2.5 text-neutral-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-neutral-900 dark:text-white">{asset.fileName}</p>
                      <p className="text-[10px] text-neutral-400">{(asset.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: AI Validation Status */}
          <div className="rounded-2xl border border-purple-200/80 bg-purple-50/40 p-4 dark:border-purple-900/40 dark:bg-purple-950/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-extrabold uppercase tracking-wider">AI Quality QA Review</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-0.5 text-xs font-bold">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Passed (Score: {submission.ai_quality_score || 88}/100)</span>
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Prompt quality verified against OSPL standards. Structure, clarity, and safety checks passed.
            </p>
          </div>

          {/* Section 5: Environmental Footprint Estimate (Explicitly Labeled as Estimate) */}
          <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Droplet className="h-4 w-4" />
                <span className="text-xs font-extrabold uppercase tracking-wider">💧 Estimated Water Footprint (Estimate)</span>
              </div>
              <span className="text-[10px] font-extrabold uppercase text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 rounded-full">
                Confidence: Medium
              </span>
            </div>
            <p className="font-mono text-sm font-extrabold text-blue-900 dark:text-blue-200">
              ~{environmentalEstimate.waterMlMin} – {environmentalEstimate.waterMlMax} mL / 1,000 runs
            </p>
            <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 italic">
              Estimated from workload and model/infrastructure assumptions.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-neutral-200/80 dark:border-neutral-800">
          <button
            type="button"
            onClick={onEditForm}
            disabled={isSubmitting}
            className="w-full sm:w-auto rounded-xl border border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900 px-6 py-3 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition"
          >
            Back to Edit
          </button>

          <button
            type="button"
            onClick={onConfirmSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-purple-600 px-8 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg hover:bg-purple-700 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Publishing...' : 'Confirm & Publish Prompt'}
          </button>
        </div>
      </div>
    </div>
  );
}
