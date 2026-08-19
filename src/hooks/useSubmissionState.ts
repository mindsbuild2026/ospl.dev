/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Custom Hook for Prompt Submission Architecture
 * Unified state management supporting Casual Creator & Developer Pro modes
 * without duplicating business logic or losing data on mode switches.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  PromptSubmissionPayload,
  PromptSubmissionVariable,
  PromptSubmissionAsset,
  PromptWorkflowStep,
  EnvironmentalEstimate,
  LookupAuthor,
} from '../types';
import { PromptSubmissionLookups } from '../lib/promptRepository';
import { validatePromptSubmission, errorsToMap, ValidationError } from '../lib/validation';
import { generatePromptDetailsWithGemini, analyzeWorkflowStepWithGemini, PromptAiGenerationResult } from '../lib/geminiPromptAssistant';
import { estimateEnvironmentalFootprint } from '../utils/environmentalEstimator';
import { uploadPromptAsset, deletePromptAsset } from '../lib/assetService';
import { STORAGE_KEYS } from '../lib/constants';

const DRAFT_KEY = STORAGE_KEYS.SUBMIT_DRAFT;

export function defaultSubmissionPayload(): PromptSubmissionPayload {
  return {
    slug: '',
    title: '',
    short_description: '',
    description: '',
    category_id: '',
    subcategory_id: null,
    author_id: '',
    prompt_type_id: null,
    difficulty: 'Intermediate',
    license_type: 'MIT',
    commercial_use: true,
    attribution_required: false,
    featured: false,
    verified: false,
    community_validated: false,
    current_version: '1.0.0',
    meta_title: '',
    meta_description: '',
    seo_keywords: [],
    system_prompt: '',
    user_prompt: '',
    expected_output: '',
    tag_ids: [],
    ai_platform_ids: [],
    collection_ids: [],
    industry_ids: [],
    technique_ids: [],
    recommended_models: [{ name: 'Claude 3.5 Sonnet', provider: 'Anthropic' }],
    variables: [
      {
        name: 'topic',
        label: 'Topic',
        required: true,
        description: 'Primary topic or subject matter.',
        variable_type: 'string',
        options: [],
      },
    ],
    usage_instructions: ['Paste system and user prompts into your AI tool.'],
    examples: [
      {
        title: 'Standard Execution',
        input: 'Example topic or input content',
        output: 'Structured expected response from the AI model',
      },
    ],
    test_cases: [
      {
        name: 'Quality Output Check',
        input: 'Sample query',
        expectedResult: 'Expected model response output',
        testedModel: 'Claude 3.5 Sonnet',
      },
    ],
    proof_items: [],
    version_history: [
      {
        version: '1.0.0',
        released_at: new Date().toISOString(),
        changes: ['Initial submission'],
      },
    ],
    // Developer Pro default fields
    creator_mode: 'casual',
    workflow_steps: [
      {
        id: `step_${Date.now()}_1`,
        order: 1,
        title: 'Step 1: Scaffold & Initial Prompt',
        prompt: '',
        description: 'First step in the developer prompt workflow.',
        analysisState: 'idle',
      },
    ],
    pipeline_type: 'single_shot',
    temperature: 0.7,
    max_tokens: 2048,
    output_format: 'markdown',
    structured_output_schema: '',
    assets: [],
  };
}

export interface UseSubmissionStateProps {
  author: LookupAuthor | null;
  lookupData: PromptSubmissionLookups | null;
  onSubmitPrompt: (payload: PromptSubmissionPayload) => Promise<string>;
}

export function useSubmissionState({ author, lookupData, onSubmitPrompt }: UseSubmissionStateProps) {
  const [creatorMode, setCreatorModeState] = useState<'casual' | 'developer'>('casual');
  const [submission, setSubmission] = useState<PromptSubmissionPayload>(defaultSubmissionPayload());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showDraftSaved, setShowDraftSaved] = useState(false);

  // AI Validation state
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'applied'>('idle');
  const [aiResult, setAiResult] = useState<PromptAiGenerationResult | null>(null);
  const [aiError, setAiError] = useState('');

  // Track fields manually edited by the user so AI auto-population never overwrites user edits
  const [manuallyEditedFields, setManuallyEditedFields] = useState<Set<string>>(new Set());
  const [lastAnalyzedPrompt, setLastAnalyzedPrompt] = useState<string>('');

  // 1. Restore local draft on mount
  useEffect(() => {
    if (!lookupData) return;
    const savedDraft = window.localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft) as PromptSubmissionPayload;
        setSubmission((prev) => ({
          ...prev,
          ...parsed,
          category_id: parsed.category_id || lookupData.categories[0]?.id || '',
          author_id: author?.id || parsed.author_id || lookupData.authors[0]?.id || '',
          ai_platform_ids: parsed.ai_platform_ids?.length ? parsed.ai_platform_ids : lookupData.aiPlatforms.slice(0, 1).map((p) => p.id),
        }));
        if (parsed.creator_mode) {
          setCreatorModeState(parsed.creator_mode);
        }
      } catch {
        // Fallback to default
      }
    } else {
      setSubmission((prev) => ({
        ...prev,
        category_id: lookupData.categories[0]?.id || '',
        author_id: author?.id || lookupData.authors[0]?.id || '',
        ai_platform_ids: lookupData.aiPlatforms.slice(0, 1).map((p) => p.id),
      }));
    }
  }, [lookupData, author]);

  // 2. Auto-save draft on form change
  useEffect(() => {
    if (!lookupData) return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...submission, creator_mode: creatorMode }));
  }, [submission, creatorMode, lookupData]);

  // 3. Mode Switcher (Casual <-> Developer) preserving ALL state
  const setCreatorMode = useCallback((mode: 'casual' | 'developer') => {
    setCreatorModeState(mode);
    setSubmission((prev) => ({
      ...prev,
      creator_mode: mode,
    }));
  }, []);

  // 4. Live Variable Extraction across single prompts & workflow steps combined
  const detectedVariables = useMemo(() => {
    const stepText = (submission.workflow_steps || []).map((s) => s.prompt).join(' ');
    const fullText = `${submission.user_prompt} ${submission.system_prompt} ${stepText}`;
    const matches = fullText.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
    const names = Array.from(new Set(matches.map((m) => m.replace(/[\{\}]/g, '').trim()))).filter(Boolean);
    return names;
  }, [submission.user_prompt, submission.system_prompt, submission.workflow_steps]);

  // Collect all active variable definitions inferred from AI step analysis across workflow steps
  const allActiveStepVariables = useMemo(() => {
    const steps = submission.workflow_steps || [];
    return steps.flatMap((s) => s.variables || []);
  }, [submission.workflow_steps]);

  // Auto-sync active variables to `submission.variables` and purge stale entries upon step re-analysis
  useEffect(() => {
    setSubmission((prev) => {
      const activeNamesSet = new Set<string>();

      // 1. Regex detected variables
      detectedVariables.forEach((name) => activeNamesSet.add(name.toLowerCase()));

      // 2. AI inferred step variables
      allActiveStepVariables.forEach((v) => {
        if (v.name) activeNamesSet.add(v.name.toLowerCase());
      });

      // If no active variables anywhere and prev.variables is empty, do nothing
      if (activeNamesSet.size === 0 && prev.variables.length === 0) return prev;

      const existingMap = new Map(prev.variables.map((v) => [v.name.toLowerCase(), v]));
      const nextVariables: PromptSubmissionVariable[] = [];

      activeNamesSet.forEach((varName) => {
        const existing = existingMap.get(varName);
        const aiInferred = allActiveStepVariables.find((v) => v.name.toLowerCase() === varName);

        if (existing) {
          nextVariables.push({
            ...existing,
            label: existing.label || aiInferred?.label || varName.charAt(0).toUpperCase() + varName.slice(1).replace(/_/g, ' '),
            description: existing.description || aiInferred?.description || `Dynamic input for ${varName}`,
          });
        } else {
          nextVariables.push({
            name: varName,
            label: aiInferred?.label || varName.charAt(0).toUpperCase() + varName.slice(1).replace(/_/g, ' '),
            required: aiInferred?.required ?? true,
            description: aiInferred?.description || `Dynamic input for ${varName}`,
            variable_type: 'string',
            options: [],
          });
        }
      });

      const prevNames = prev.variables.map((v) => v.name.toLowerCase()).join(',');
      const nextNames = nextVariables.map((v) => v.name.toLowerCase()).join(',');

      if (prevNames === nextNames && prev.variables.length === nextVariables.length) {
        return prev;
      }

      return {
        ...prev,
        variables: nextVariables,
      };
    });
  }, [detectedVariables, allActiveStepVariables]);

  // 5. Update Field Handler (tracks user manual edits)
  const updateField = useCallback((patch: Partial<PromptSubmissionPayload>) => {
    setSubmission((prev) => ({ ...prev, ...patch }));
    
    // Mark modified fields as manually edited (excluding prompt text updates)
    const modifiedKeys = Object.keys(patch).filter(
      (k) => k !== 'user_prompt' && k !== 'system_prompt' && k !== 'creator_mode'
    );
    if (modifiedKeys.length > 0) {
      setManuallyEditedFields((prev) => {
        const next = new Set(prev);
        modifiedKeys.forEach((key) => next.add(key));
        return next;
      });
    }

    setFieldErrors((prev) => {
      const copy = { ...prev };
      Object.keys(patch).forEach((key) => delete copy[key]);
      return copy;
    });
  }, []);

  // 6. Dynamic Array Helpers
  const addArrayItem = useCallback(<T extends object | string>(key: keyof PromptSubmissionPayload, item: T) => {
    setSubmission((prev) => ({
      ...prev,
      [key]: [...((prev[key] as unknown as T[]) || []), item],
    } as PromptSubmissionPayload));
  }, []);

  const updateArrayItem = useCallback(<T extends object>(key: keyof PromptSubmissionPayload, index: number, item: Partial<T>) => {
    setSubmission((prev) => ({
      ...prev,
      [key]: ((prev[key] as unknown as T[]) || []).map((val, idx) => (idx === index ? { ...val, ...item } : val)),
    } as PromptSubmissionPayload));
  }, []);

  const removeArrayItem = useCallback((key: keyof PromptSubmissionPayload, index: number) => {
    setSubmission((prev) => ({
      ...prev,
      [key]: ((prev[key] as unknown as any[]) || []).filter((_, idx) => idx !== index),
    } as PromptSubmissionPayload));
  }, []);

  // 6b. Developer Pro Workflow Steps Builder Helpers (Min 1, Max 10 steps, Stable IDs)
  const addWorkflowStep = useCallback(() => {
    let createdStepId = '';
    setSubmission((prev) => {
      const steps = prev.workflow_steps || [];
      if (steps.length >= 10) return prev; // UI prevents step 11 creation
      const nextOrder = steps.length + 1;
      createdStepId = `step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newStep: PromptWorkflowStep = {
        id: createdStepId,
        order: nextOrder,
        title: `Step ${nextOrder}`,
        prompt: '',
        description: `Description for Step ${nextOrder}`,
        analysisState: 'idle',
      };
      return {
        ...prev,
        workflow_steps: [...steps, newStep],
      };
    });
    return createdStepId;
  }, []);

  const updateWorkflowStep = useCallback((stepId: string, patch: Partial<PromptWorkflowStep>) => {
    setSubmission((prev) => {
      const steps = prev.workflow_steps || [];
      const updated = steps.map((s) => {
        if (s.id !== stepId) return s;
        // If prompt text changed after validation, automatically mark state as 'stale'
        let nextState = s.analysisState;
        if (patch.prompt !== undefined && patch.prompt !== s.prompt) {
          if (s.analysisState === 'valid' || s.analysisState === 'warning' || s.analysisState === 'invalid') {
            nextState = 'stale';
          }
        }
        return {
          ...s,
          ...patch,
          analysisState: patch.analysisState || nextState,
          updatedAt: new Date().toISOString(),
        };
      });
      return { ...prev, workflow_steps: updated };
    });
  }, []);

  const removeWorkflowStep = useCallback((stepId: string) => {
    setSubmission((prev) => {
      const steps = prev.workflow_steps || [];
      if (steps.length <= 1) return prev; // Minimum 1 step required
      const filtered = steps.filter((s) => s.id !== stepId);
      // Re-index display order (1..N) while preserving stable IDs!
      const reordered = filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
      return { ...prev, workflow_steps: reordered };
    });
  }, []);

  const moveWorkflowStep = useCallback((stepId: string, direction: 'up' | 'down') => {
    setSubmission((prev) => {
      const steps = [...(prev.workflow_steps || [])];
      const index = steps.findIndex((s) => s.id === stepId);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === steps.length - 1) return prev;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = steps[index];
      steps[index] = steps[targetIndex];
      steps[targetIndex] = temp;

      // Re-assign display order (1..N), stable IDs remain unchanged!
      const reordered = steps.map((s, idx) => ({ ...s, order: idx + 1 }));
      return { ...prev, workflow_steps: reordered };
    });
  }, []);

  // 6. AI Assistant Generation Handler with Auto-Metadata Population
  const handleGenerateAiDetails = useCallback(async (rawPromptText: string, forceRegenerate = false) => {
    if (!lookupData || !rawPromptText.trim()) {
      setAiError('Paste prompt text before generating details.');
      setAiStatus('error');
      return;
    }

    if (forceRegenerate) {
      setManuallyEditedFields(new Set());
    }

    setAiStatus('loading');
    setAiError('');

    try {
      const result = await generatePromptDetailsWithGemini(rawPromptText.trim(), lookupData);
      setAiResult(result);
      const { review, metadata } = result;

      if (review.status === 'fail' || review.flags.invalid || review.flags.spam) {
        setAiStatus('error');
        const issueMsg = review.issues.length > 0 ? review.issues.join('. ') : 'Prompt failed quality standards.';
        setAiError(issueMsg);
      } else {
        setAiStatus('success');
      }

      // Auto-populate inferable metadata fields WITHOUT overwriting user's prompt text or manual edits
      setSubmission((prev) => {
        const patch: Partial<PromptSubmissionPayload> = {
          ai_validation_status: review.status,
          ai_quality_score: review.score,
        };

        if (metadata) {
          if (!manuallyEditedFields.has('title') && metadata.title) {
            patch.title = metadata.title;
          }
          if (!manuallyEditedFields.has('short_description') && metadata.short_description) {
            patch.short_description = metadata.short_description;
          }
          if (!manuallyEditedFields.has('description') && metadata.description) {
            patch.description = metadata.description;
          }
          if (!manuallyEditedFields.has('category_id') && metadata.category_id) {
            patch.category_id = metadata.category_id;
          }
          if (!manuallyEditedFields.has('subcategory_id') && metadata.subcategory_id !== undefined) {
            patch.subcategory_id = metadata.subcategory_id;
          }
          if (!manuallyEditedFields.has('tag_ids') && metadata.tag_ids?.length) {
            patch.tag_ids = metadata.tag_ids;
          }
          if (!manuallyEditedFields.has('ai_platform_ids') && metadata.ai_platform_ids?.length) {
            patch.ai_platform_ids = metadata.ai_platform_ids;
          }
          if (!manuallyEditedFields.has('recommended_models') && metadata.recommended_models?.length) {
            patch.recommended_models = metadata.recommended_models;
          }
          if (!manuallyEditedFields.has('usage_instructions') && metadata.usage_instructions?.length) {
            patch.usage_instructions = metadata.usage_instructions;
          }
          if (!manuallyEditedFields.has('examples') && metadata.examples?.length) {
            patch.examples = metadata.examples;
          }
          if (!manuallyEditedFields.has('test_cases') && metadata.test_cases?.length) {
            patch.test_cases = metadata.test_cases;
          }
        }

        return { ...prev, ...patch };
      });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI generation failed.');
      setAiStatus('error');
    }
  }, [lookupData, manuallyEditedFields]);

  const submissionRef = useRef(submission);
  useEffect(() => {
    submissionRef.current = submission;
  }, [submission]);

  const analyzeWorkflowStep = useCallback(async (stepId: string) => {
    const currentSub = submissionRef.current;
    const steps = currentSub.workflow_steps || [];
    const targetStep = steps.find((s) => s.id === stepId);

    if (!targetStep || !targetStep.prompt.trim()) return;

    updateWorkflowStep(stepId, { analysisState: 'loading' });

    try {
      const prevTitles = steps.filter((s) => s.order < targetStep.order).map((s) => s.title);

      const result = await analyzeWorkflowStepWithGemini({
        workflowTitle: currentSub.title || 'Developer Prompt Workflow',
        stepNumber: targetStep.order,
        totalSteps: steps.length,
        previousStepTitles: prevTitles,
        stepTitle: targetStep.title,
        stepPrompt: targetStep.prompt,
        stepDescription: targetStep.description,
      });

      const finalState = result.status === 'fail' ? 'invalid' : 'valid';

      updateWorkflowStep(stepId, {
        analysisState: finalState,
        validationStatus: result.status,
        qualityScore: result.score,
        validationIssues: result.issues,
        title: targetStep.title || result.inferredTitle || `Step ${targetStep.order}`,
        variables: result.inferredVariables,
      });
    } catch (err) {
      updateWorkflowStep(stepId, {
        analysisState: 'error',
        validationIssues: [err instanceof Error ? err.message : 'Step analysis failed.'],
      });
    }
  }, [updateWorkflowStep]);

  const analyzeAllWorkflowSteps = useCallback(async () => {
    const steps = submissionRef.current.workflow_steps || [];
    for (const s of steps) {
      if (s.prompt.trim()) {
        await analyzeWorkflowStep(s.id);
      }
    }

    // Auto-generate overall workflow metadata from all step prompts combined
    const combinedText = steps
      .filter((s) => s.prompt.trim())
      .map((s) => `Step ${s.order} (${s.title || 'Step'}):\n${s.prompt.trim()}`)
      .join('\n\n');

    if (combinedText.length >= 15) {
      await handleGenerateAiDetails(combinedText);
    }
  }, [analyzeWorkflowStep, handleGenerateAiDetails]);

  // 7. Integrated Asset Attachment Upload Handler
  const handleUploadAsset = useCallback(async (file: File) => {
    if (!author?.user_id && !author?.id) return;
    const userId = author.user_id || author.id;

    // Optimistically add uploading asset
    const tempAsset: PromptSubmissionAsset = {
      id: `temp_${Date.now()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
      uploadState: 'uploading',
      progress: 20,
    };

    setSubmission((prev) => ({
      ...prev,
      assets: [...(prev.assets || []), tempAsset],
    }));

    const uploadedAsset = await uploadPromptAsset({ file, userId });

    setSubmission((prev) => ({
      ...prev,
      assets: (prev.assets || []).map((a) => (a.id === tempAsset.id ? uploadedAsset : a)),
      proof_items: [
        ...prev.proof_items,
        {
          type: 'image',
          title: uploadedAsset.fileName,
          url: uploadedAsset.previewUrl,
          thumbnailUrl: uploadedAsset.previewUrl,
          description: uploadedAsset.altText || 'User attached reference image',
        },
      ],
    }));
  }, [author]);

  const handleRemoveAsset = useCallback(async (assetId: string) => {
    const targetAsset = submission.assets?.find((a) => a.id === assetId);
    if (targetAsset?.previewUrl && targetAsset.previewUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(targetAsset.previewUrl);
      } catch (e) {
        // Ignore blob revocation warnings
      }
    }
    if (targetAsset?.storagePath) {
      await deletePromptAsset(targetAsset.storagePath);
    }
    setSubmission((prev) => ({
      ...prev,
      assets: (prev.assets || []).filter((a) => a.id !== assetId),
      proof_items: prev.proof_items.filter((item) => item.url !== targetAsset?.previewUrl),
    }));
  }, [submission.assets]);

  const handleRetryAssetUpload = useCallback(async (asset: PromptSubmissionAsset) => {
    if (!asset.file) return;
    const userId = author?.user_id || author?.id || 'guest';
    const retriedAsset = await uploadPromptAsset({ file: asset.file, userId });
    setSubmission((prev) => ({
      ...prev,
      assets: (prev.assets || []).map((a) => (a.id === asset.id ? retriedAsset : a)),
    }));
  }, [author]);

  // 8. Environmental Footprint Calculator (Supplementary & Non-blocking)
  const environmentalFootprint = useMemo(() => {
    const isDeveloperMode = creatorMode === 'developer';
    const steps = submission.workflow_steps || [];
    const combinedStepText = isDeveloperMode ? steps.map((s) => s.prompt).join('\n') : '';

    return estimateEnvironmentalFootprint({
      systemPrompt: submission.system_prompt || combinedStepText,
      userPrompt: submission.user_prompt || combinedStepText,
      expectedOutput: submission.expected_output || '',
      variables: submission.variables,
      targetModel: submission.recommended_models[0]?.name || 'Gemini 2.5 Flash',
      targetProvider: submission.recommended_models[0]?.provider || 'Google',
      imageCount: submission.assets?.length || 0,
      maxTokens: submission.max_tokens || 2048,
      pipelineMode: submission.pipeline_type || 'single_shot',
      runCount: 1000,
      workflowSteps: isDeveloperMode
        ? steps.map((s) => ({
            stepNumber: s.order,
            stepTitle: s.title,
            prompt: s.prompt,
          }))
        : undefined,
    });
  }, [
    creatorMode,
    submission.system_prompt,
    submission.user_prompt,
    submission.expected_output,
    submission.variables,
    submission.recommended_models,
    submission.assets,
    submission.workflow_steps,
    submission.max_tokens,
    submission.pipeline_type,
  ]);



  // Combine effective prompt text based on creator mode (Casual single prompt vs Developer Pro workflow steps)
  const effectivePromptText = useMemo(() => {
    if (creatorMode === 'developer') {
      const steps = submission.workflow_steps || [];
      return steps
        .filter((s) => s.prompt.trim())
        .map((s) => `Step ${s.order} (${s.title || 'Step'}):\n${s.prompt.trim()}`)
        .join('\n\n');
    }
    return (submission.user_prompt || submission.system_prompt || '').trim();
  }, [creatorMode, submission.workflow_steps, submission.user_prompt, submission.system_prompt]);

  // Debounced auto-analysis when prompt text changes (supporting BOTH Casual & Developer Pro modes)
  useEffect(() => {
    if (!lookupData) return;
    if (effectivePromptText.length < 15 || effectivePromptText === lastAnalyzedPrompt) return;

    const timer = setTimeout(() => {
      setLastAnalyzedPrompt(effectivePromptText);
      handleGenerateAiDetails(effectivePromptText);
    }, 1200);

    return () => clearTimeout(timer);
  }, [effectivePromptText, lookupData, lastAnalyzedPrompt, handleGenerateAiDetails]);

  // Explicit Regenerate trigger handler
  const handleRegenerateAiDetails = useCallback(async () => {
    if (!effectivePromptText) return;
    setLastAnalyzedPrompt(effectivePromptText);
    await handleGenerateAiDetails(effectivePromptText, true);
  }, [effectivePromptText, handleGenerateAiDetails]);

  const handleApplyAiDetails = useCallback(() => {
    if (!aiResult?.metadata) return;
    const meta = aiResult.metadata;

    setSubmission((prev) => ({
      ...prev,
      ...meta,
      // Preserve prompt text intact
      system_prompt: prev.system_prompt,
      user_prompt: prev.user_prompt,
      workflow_steps: prev.workflow_steps,
      creator_mode: creatorMode,
      author_id: author?.id || prev.author_id,
      ai_platform_ids: meta.ai_platform_ids?.length ? meta.ai_platform_ids : prev.ai_platform_ids,
      tag_ids: meta.tag_ids?.length ? meta.tag_ids : prev.tag_ids,
      variables: meta.variables?.length ? meta.variables : prev.variables,
    }));
    setAiStatus('applied');
  }, [aiResult, creatorMode, author]);

  // 10. Unified Validation & Submission Pipeline
  const validateForm = useCallback((): boolean => {
    // For Casual Creator, auto-populate required default arrays if empty
    let payloadToValidate = { ...submission };
    if (creatorMode === 'casual') {
      payloadToValidate = {
        ...payloadToValidate,
        recommended_models: payloadToValidate.recommended_models.length
          ? payloadToValidate.recommended_models
          : [{ name: 'GPT-4o', provider: 'OpenAI' }],
        variables: payloadToValidate.variables.length
          ? payloadToValidate.variables
          : [{ name: 'input', label: 'Input', required: true, description: 'Prompt input' }],
        usage_instructions: payloadToValidate.usage_instructions.length
          ? payloadToValidate.usage_instructions
          : ['Paste the prompt into your AI model.'],
        examples: payloadToValidate.examples.length
          ? payloadToValidate.examples
          : [{ title: 'Example', input: 'Input text', output: 'Output text' }],
      };
      setSubmission(payloadToValidate);
    } else if (creatorMode === 'developer') {
      const steps = payloadToValidate.workflow_steps || [];
      if (steps.length === 0) {
        setSubmitError('Developer Pro workflows require at least 1 step.');
        return false;
      }
      const invalidStep = steps.find((s) => s.analysisState === 'invalid');
      if (invalidStep) {
        setSubmitError(`Step ${invalidStep.order} ("${invalidStep.title}") has quality validation issues. Please fix before submitting.`);
        return false;
      }
      // Populate single-prompt fallbacks for backward compatibility
      const firstStepPrompt = steps[0]?.prompt || '';
      const combinedStepsText = steps.map((s) => `### Step ${s.order}: ${s.title}\n${s.prompt}`).join('\n\n');
      payloadToValidate = {
        ...payloadToValidate,
        system_prompt: payloadToValidate.system_prompt || combinedStepsText,
        user_prompt: payloadToValidate.user_prompt || firstStepPrompt || combinedStepsText,
      };
      setSubmission(payloadToValidate);
    }

    const errors = validatePromptSubmission(payloadToValidate);
    if (errors.length > 0) {
      setFieldErrors(errorsToMap(errors));
      setSubmitError('Please fix the highlighted errors before reviewing.');
      return false;
    }

    setFieldErrors({});
    return true;
  }, [submission, creatorMode]);

  const handleReviewSubmission = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitError('');
    setAiError('');

    // Stage 1: Client Form Validation
    const isFormValid = validateForm();
    if (!isFormValid) return;

    // Stage 2: AI Prompt Validation
    if (lookupData && creatorMode === 'casual') {
      setAiStatus('loading');
      try {
        const result = await generatePromptDetailsWithGemini(submission, lookupData);
        setAiResult(result);

        const { review } = result;

        // Stage 3: Validation Result Check
        if (review.status === 'fail' || review.flags.invalid || review.flags.spam) {
          setAiStatus('error');
          const issueMsg = review.issues.length > 0 ? review.issues.join('. ') : 'Prompt failed AI quality validation standards.';
          setSubmitError(`AI Validation Failed: ${issueMsg}`);
          return; // Do NOT proceed to review/submission, preserve form state
        }

        // Save validation score/status onto submission
        setSubmission((prev) => ({
          ...prev,
          ai_validation_status: review.status,
          ai_quality_score: review.score,
        }));

        setAiStatus('success');
      } catch (err) {
        setAiStatus('error');
        const errMsg = err instanceof Error ? err.message : 'AI validation service error';
        setAiError(errMsg);
        setSubmitError(`AI Validation Error: ${errMsg}. Please try again.`);
        return; // Do NOT silently mark valid on AI service error
      }
    } else if (creatorMode === 'developer') {
      // Analyze any unanalyzed or stale workflow steps before proceeding to review
      const invalidStep = submission.workflow_steps?.find((s) => s.analysisState === 'invalid');
      if (invalidStep) {
        setSubmitError(`Step ${invalidStep.order} ("${invalidStep.title}") is invalid. Please fix errors before proceeding.`);
        return;
      }
    }

    // Stage 4: Proceed to Review
    setIsReviewMode(true);
  }, [validateForm, lookupData, submission, creatorMode]);

  const handleFinalSubmit = useCallback(async () => {
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const finalPayload: PromptSubmissionPayload = {
        ...submission,
        author_id: author?.id || submission.author_id,
        creator_mode: creatorMode,
        environmental_estimate: environmentalFootprint,
      };

      const createdId = await onSubmitPrompt(finalPayload);
      window.localStorage.removeItem(DRAFT_KEY);
      return createdId;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed.');
      setIsSubmitting(false);
      throw err;
    }
  }, [submission, author, creatorMode, environmentalFootprint, onSubmitPrompt]);

  const handleSaveDraft = useCallback(() => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...submission, creator_mode: creatorMode }));
    setShowDraftSaved(true);
    setTimeout(() => setShowDraftSaved(false), 2000);
  }, [submission, creatorMode]);

  const handleClearDraft = useCallback(() => {
    if (submission.assets) {
      submission.assets.forEach((asset) => {
        if (asset.previewUrl && asset.previewUrl.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(asset.previewUrl);
          } catch (e) {
            // Ignore blob revocation warnings
          }
        }
      });
    }
    setSubmission(defaultSubmissionPayload());
    setFieldErrors({});
    window.localStorage.removeItem(DRAFT_KEY);
  }, [submission.assets]);

  const metadataOrigin = useMemo<'ai_generated' | 'user_edited' | 'mixed'>(() => {
    if (!aiResult) return 'user_edited';
    if (manuallyEditedFields.size === 0) return 'ai_generated';
    return 'mixed';
  }, [aiResult, manuallyEditedFields]);

  return {
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
    environmentalFootprint,
    metadataOrigin,
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
    handleRegenerateAiDetails,
    handleApplyAiDetails,
    manuallyEditedFields,
    handleReviewSubmission,
    handleFinalSubmit,
    handleSaveDraft,
    handleClearDraft,
  };
}
