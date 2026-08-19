/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SubmitPromptView Component
 * Orchestrates Casual Creator and Developer Pro workspace views.
 */

import React, { useEffect, useState } from 'react';
import { Lock, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { fetchPromptSubmissionLookups, PromptSubmissionLookups } from '../lib/promptRepository';
import { PromptSubmissionPayload, LookupAuthor } from '../types';
import { User } from '@supabase/supabase-js';
import { useSubmissionState } from '../hooks/useSubmissionState';
import { SubmissionHeader } from './submission/SubmissionHeader';
import { CasualCreatorView } from './submission/CasualCreatorView';
import { DeveloperProView } from './submission/DeveloperProView';
import { SubmissionReviewModal } from './submission/SubmissionReviewModal';
import { SubmissionActionBar } from './submission/SubmissionActionBar';

export interface SubmitPromptViewProps {
  onCancel: () => void;
  onSubmitPrompt: (payload: PromptSubmissionPayload) => Promise<string>;
  user: User | null;
  author: LookupAuthor | null;
  onSignInClick: () => void;
}

export default function SubmitPromptView({
  onCancel,
  onSubmitPrompt,
  user,
  author,
  onSignInClick,
}: SubmitPromptViewProps) {
  const [lookupData, setLookupData] = useState<PromptSubmissionLookups | null>(null);
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Hook managing shared submission state across Casual & Developer modes
  const {
    creatorMode,
    setCreatorMode,
    submission,
    fieldErrors,
    isReviewMode,
    setIsReviewMode,
    isSubmitting,
    submitError,
    showDraftSaved,
    aiStatus,
    aiResult,
    aiError,
    detectedVariables,
    updateField,
    addArrayItem,
    updateArrayItem,
    removeArrayItem,
    addWorkflowStep,
    updateWorkflowStep,
    removeWorkflowStep,
    moveWorkflowStep,
    analyzeWorkflowStep,
    analyzeAllWorkflowSteps,
    handleUploadAsset,
    handleRemoveAsset,
    handleRetryAssetUpload,
    handleGenerateAiDetails,
    handleReviewSubmission,
    handleFinalSubmit,
    handleSaveDraft,
    handleClearDraft,
  } = useSubmissionState({ author, lookupData, onSubmitPrompt });

  // Fetch Lookups on Mount
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchPromptSubmissionLookups()
      .then((data) => {
        if (!active) return;
        setLookupData(data);
      })
      .catch((err) => {
        if (active) setLoadError(err instanceof Error ? err.message : 'Failed to load lookups.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full min-h-[520px] py-16 px-4 md:px-8 mx-auto max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 w-1/3" />
          <div className="h-12 rounded-2xl bg-neutral-200 dark:bg-neutral-800 w-2/3" />
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-8">
            <div className="h-[420px] rounded-[28px] bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-[420px] rounded-[28px] bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full py-16 px-4 md:px-8 mx-auto max-w-4xl">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-8 rounded-3xl text-center">
          <h2 className="font-display text-2xl font-bold text-red-700 dark:text-red-300">Unable to load submission data</h2>
          <p className="mt-3 text-sm text-red-600 dark:text-red-200">{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-red-700 text-white px-5 py-3 text-xs font-bold uppercase tracking-wide hover:bg-red-800 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user || !author) {
    return (
      <div className="w-full relative py-12 md:py-20 px-4 md:px-8 max-w-md mx-auto text-center">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-neutral-500 hover:text-purple-600 font-sans font-bold text-xs tracking-wide uppercase transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Browse
        </button>

        <div className="rounded-[32px] border border-neutral-200 dark:border-neutral-800 bg-white p-8 dark:bg-neutral-950 shadow-xl">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mb-5">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-white">Protected Submission</h2>
          <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
            Please sign in to submit prompts. Only registered authors can submit prompt templates to the community catalog.
          </p>
          <button
            type="button"
            onClick={onSignInClick}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-purple-600 dark:hover:bg-purple-600 dark:hover:text-white px-5 py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md"
          >
            Sign In with Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100/50 dark:bg-[#0b0b0c] transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12 pb-24">
        {/* Header with Title & Creator Mode Segmented Toggle */}
        <SubmissionHeader
          creatorMode={creatorMode}
          onModeChange={setCreatorMode}
          onCancel={onCancel}
        />

        {submitError && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 text-red-600 dark:text-red-400 shrink-0" />
              <div>
                <p className="font-bold text-base">Validation Error</p>
                <p className="mt-1 text-xs opacity-90">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Casual Creator View (Matching Reference Image #1) */}
        {creatorMode === 'casual' && (
          <CasualCreatorView
            submission={submission}
            lookupData={lookupData}
            fieldErrors={fieldErrors}
            detectedVariables={detectedVariables}
            onUpdateField={updateField}
            onGenerateAiDetails={handleGenerateAiDetails}
            onUploadAsset={handleUploadAsset}
            onRemoveAsset={handleRemoveAsset}
            onRetryAssetUpload={handleRetryAssetUpload}
            isAiLoading={aiStatus === 'loading'}
          />
        )}

        {/* Developer Pro Mode Workspace (Matching Reference Image #2) */}
        {creatorMode === 'developer' && (
          <DeveloperProView
            submission={submission}
            lookupData={lookupData}
            fieldErrors={fieldErrors}
            onUpdateField={updateField}
            onAddWorkflowStep={addWorkflowStep}
            onUpdateWorkflowStep={updateWorkflowStep}
            onRemoveWorkflowStep={removeWorkflowStep}
            onMoveWorkflowStep={moveWorkflowStep}
            onAnalyzeWorkflowStep={analyzeWorkflowStep}
            onAnalyzeAllWorkflowSteps={analyzeAllWorkflowSteps}
            onAddVariable={() => addArrayItem('variables', { name: '', label: '', required: true, description: '', variable_type: 'string', options: [] })}
            onUpdateVariable={(index, patch) => updateArrayItem('variables', index, patch)}
            onRemoveVariable={(index) => removeArrayItem('variables', index)}
            onUploadAsset={handleUploadAsset}
            onRemoveAsset={handleRemoveAsset}
            onRetryAssetUpload={handleRetryAssetUpload}
            onGenerateAiDetails={handleGenerateAiDetails}
            isAiLoading={aiStatus === 'loading'}
          />
        )}

        {/* Review Submission Modal */}
        {isReviewMode && (
          <SubmissionReviewModal
            submission={submission}
            lookupData={lookupData}
            author={author}
            creatorMode={creatorMode}
            isSubmitting={isSubmitting}
            submitError={submitError}
            onConfirmSubmit={async () => {
              await handleFinalSubmit();
            }}
            onEditForm={() => setIsReviewMode(false)}
          />
        )}
      </div>

      {/* Bottom Action Bar */}
      <SubmissionActionBar
        onClearDraft={handleClearDraft}
        onSaveDraft={handleSaveDraft}
        onReviewSubmission={handleReviewSubmission}
        isSubmitting={isSubmitting}
        showDraftSaved={showDraftSaved}
      />
    </div>
  );
}
