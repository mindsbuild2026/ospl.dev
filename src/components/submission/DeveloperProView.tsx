import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sliders,
  Code,
  FileCode,
  Check,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  Eye,
  Layers,
  Settings,
  Zap,
} from 'lucide-react';
import { PromptSubmissionPayload, PromptSubmissionVariable, PromptSubmissionAsset, PromptWorkflowStep } from '../../types';
import { PromptSubmissionLookups } from '../../lib/promptRepository';
import { ImageProofUploader } from './ImageProofUploader';
import { EnvironmentalImpactCard } from './EnvironmentalImpactCard';
import { VariableInfoTooltip } from './VariableInfoTooltip';
import { UnifiedClassificationForm } from './UnifiedClassificationForm';

export interface DeveloperProViewProps {
  submission: PromptSubmissionPayload;
  lookupData: PromptSubmissionLookups | null;
  fieldErrors: Record<string, string>;
  onUpdateField: (patch: Partial<PromptSubmissionPayload>) => void;
  onAddWorkflowStep?: () => string;
  onUpdateWorkflowStep?: (stepId: string, patch: Partial<PromptWorkflowStep>) => void;
  onRemoveWorkflowStep?: (stepId: string) => void;
  onMoveWorkflowStep?: (stepId: string, direction: 'up' | 'down') => void;
  onAnalyzeWorkflowStep?: (stepId: string) => Promise<void>;
  onAnalyzeAllWorkflowSteps?: () => Promise<void>;
  onAddVariable: () => void;
  onUpdateVariable: (index: number, patch: Partial<PromptSubmissionVariable>) => void;
  onRemoveVariable: (index: number) => void;
  onUploadAsset: (file: File) => Promise<void>;
  onRemoveAsset: (assetId: string) => Promise<void>;
  onRetryAssetUpload?: (asset: PromptSubmissionAsset) => Promise<void>;
  onGenerateAiDetails?: (promptText: string) => Promise<void>;
  isAiLoading?: boolean;
}

export function DeveloperProView({
  submission,
  lookupData,
  fieldErrors,
  onUpdateField,
  onAddWorkflowStep,
  onUpdateWorkflowStep,
  onRemoveWorkflowStep,
  onMoveWorkflowStep,
  onAnalyzeWorkflowStep,
  onAnalyzeAllWorkflowSteps,
  onAddVariable,
  onUpdateVariable,
  onRemoveVariable,
  onUploadAsset,
  onRemoveAsset,
  onRetryAssetUpload,
  onGenerateAiDetails,
  isAiLoading = false,
}: DeveloperProViewProps) {
  const [tagInput, setTagInput] = useState('');
  const stepTextareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const stepCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const workflowSteps = submission.workflow_steps || [];

  // Collapsible Step Cards State (default expanded for step 1, collapsed for others if > 2)
  const [expandedStepIds, setExpandedStepIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (workflowSteps.length > 0) initial.add(workflowSteps[0].id);
    return initial;
  });

  // Collapsible Progressive Disclosure Drawers
  const [showAdvancedPipeline, setShowAdvancedPipeline] = useState(false);
  const [showVariablesBuilder, setShowVariablesBuilder] = useState(false);
  const [showSchemaEditor, setShowSchemaEditor] = useState(false);

  // Auto-expand step 1 when workflow initialized
  useEffect(() => {
    if (workflowSteps.length > 0 && expandedStepIds.size === 0) {
      setExpandedStepIds(new Set([workflowSteps[0].id]));
    }
  }, [workflowSteps]);

  const toggleStepExpand = (stepId: string) => {
    setExpandedStepIds((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const handleAddTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed) return;
    const match = lookupData?.tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase() || t.slug.toLowerCase() === trimmed.toLowerCase());
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

  const handleAddStepAndFocus = () => {
    if (!onAddWorkflowStep) return;
    if (workflowSteps.length >= 10) return;
    const createdId = onAddWorkflowStep();
    setExpandedStepIds((prev) => new Set(prev).add(createdId));
    setTimeout(() => {
      if (createdId && stepTextareaRefs.current[createdId]) {
        stepTextareaRefs.current[createdId]?.focus();
      }
      if (createdId && stepCardRefs.current[createdId]) {
        stepCardRefs.current[createdId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  };

  const handleJumpToStep = (stepId: string) => {
    setExpandedStepIds((prev) => new Set(prev).add(stepId));
    setTimeout(() => {
      if (stepCardRefs.current[stepId]) {
        stepCardRefs.current[stepId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (stepTextareaRefs.current[stepId]) {
        stepTextareaRefs.current[stepId]?.focus();
      }
    }, 100);
  };

  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);

  const handleAnalyzeAll = async () => {
    if (!onAnalyzeAllWorkflowSteps || isAnalyzingAll) return;
    setIsAnalyzingAll(true);
    try {
      await onAnalyzeAllWorkflowSteps();
    } finally {
      setIsAnalyzingAll(false);
    }
  };

  const categoryOptions = lookupData?.categories || [];
  const availableSubcategories = lookupData?.subcategories.filter((s) => s.categoryId === submission.category_id) || [];
  const aiPlatforms = lookupData?.aiPlatforms || [];
  const allTags = lookupData?.tags || [];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
      {/* LEFT COLUMN: Developer Pro Authoring Workspace (~65%) */}
      <div className="space-y-6">

        {/* PRIMARY SECTION: PROMPT WORKFLOW BUILDER (1-10 Ordered Steps) */}
        <div className="rounded-[28px] border border-neutral-200/80 bg-white p-6 md:p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">
                  Workflow Steps Builder
                </h2>
                <span className="rounded-full bg-purple-100 dark:bg-purple-950/50 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300">
                  {workflowSteps.length} / 10 Steps
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Build an ordered sequence of 1 to 10 prompt steps. Each step is independently validated and parameterizable.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onAnalyzeAllWorkflowSteps && (
                <button
                  type="button"
                  onClick={handleAnalyzeAll}
                  disabled={workflowSteps.length === 0 || isAnalyzingAll}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 px-3.5 py-2 text-xs font-bold text-purple-700 dark:text-purple-300 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isAnalyzingAll ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Analyzing Steps...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Analyze All Steps</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleAddStepAndFocus}
                disabled={workflowSteps.length >= 10}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                title={workflowSteps.length >= 10 ? 'Maximum 10 steps reached' : 'Add new step (max 10)'}
              >
                <Plus className="h-4 w-4" />
                <span>{workflowSteps.length >= 10 ? 'Max Steps Reached' : '+ Add Step'}</span>
              </button>
            </div>
          </div>

          {/* STEP QUICK-NAV BAR (Mini-Map Navigation Pill Bar) */}
          {workflowSteps.length > 1 && (
            <div className="mb-6 p-2 rounded-2xl bg-neutral-100/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-2 shrink-0">
                  Quick Jump:
                </span>
                {workflowSteps.map((s) => {
                  const isExpanded = expandedStepIds.has(s.id);
                  return (
                    <button
                      key={`nav-${s.id}`}
                      type="button"
                      onClick={() => handleJumpToStep(s.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                        isExpanded
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-white dark:bg-neutral-850 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <span>0{s.order}</span>
                      <span className="max-w-[100px] truncate">{s.title || `Step ${s.order}`}</span>
                      <span className="text-[10px]">
                        {s.analysisState === 'valid' && '✓'}
                        {s.analysisState === 'loading' && '⏳'}
                        {s.analysisState === 'stale' && '⚠'}
                        {s.analysisState === 'invalid' && '✕'}
                        {s.analysisState === 'idle' && '•'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Workflow Steps Stack (Collapsible Step Cards) */}
          <div className="space-y-4">
            {workflowSteps.map((step, idx) => {
              const isExpanded = expandedStepIds.has(step.id);
              const charCount = step.prompt.length;

              return (
                <div
                  key={step.id}
                  ref={(el) => {
                    stepCardRefs.current[step.id] = el;
                  }}
                  className={`rounded-2xl border transition-all ${
                    isExpanded
                      ? 'border-purple-300/80 bg-neutral-50/70 dark:border-purple-900/50 dark:bg-neutral-900/50 shadow-md p-5 space-y-4'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/30 dark:hover:bg-neutral-900/60 p-4'
                  }`}
                >
                  {/* COLLAPSED / EXPANDED HEADER TOOLBAR */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    
                    {/* Left: Step Number, Collapse Toggle, Title */}
                    <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                      <button
                        type="button"
                        onClick={() => toggleStepExpand(step.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white text-xs font-black shrink-0 hover:bg-purple-700 transition"
                        title={isExpanded ? 'Collapse Step' : 'Expand Step'}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>

                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-black text-purple-600 dark:text-purple-400 shrink-0 font-mono">
                          0{step.order}
                        </span>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => onUpdateWorkflowStep && onUpdateWorkflowStep(step.id, { title: e.target.value })}
                          placeholder={`Step ${step.order} Title (e.g. Scaffold Architecture)`}
                          className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* Right: Validation Status Badge & Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      
                      {/* High-Contrast Validation Status Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        step.analysisState === 'loading'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 animate-pulse'
                          : step.analysisState === 'valid'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : step.analysisState === 'invalid'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          : step.analysisState === 'stale'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : step.analysisState === 'error'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                          : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}>
                        {step.analysisState === 'loading' && <Loader2 className="h-3 w-3 animate-spin" />}
                        {step.analysisState === 'valid' && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                        {step.analysisState === 'invalid' && <AlertCircle className="h-3 w-3 text-red-600" />}
                        {step.analysisState === 'stale' && <AlertTriangle className="h-3 w-3 text-amber-600" />}
                        <span>
                          {step.analysisState === 'loading' && 'Analyzing...'}
                          {step.analysisState === 'valid' && `✓ Valid (${step.qualityScore ?? 90}/100)`}
                          {step.analysisState === 'invalid' && '✕ Invalid'}
                          {step.analysisState === 'stale' && '⚠ Stale (Prompt Changed)'}
                          {step.analysisState === 'error' && '✕ Error'}
                          {step.analysisState === 'idle' && 'Not Analyzed'}
                        </span>
                      </span>

                      {/* Step Reorder & Delete Actions */}
                      <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => onMoveWorkflowStep && onMoveWorkflowStep(step.id, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-neutral-400 hover:text-purple-600 disabled:opacity-30 rounded transition"
                          title="Move step up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onMoveWorkflowStep && onMoveWorkflowStep(step.id, 'down')}
                          disabled={idx === workflowSteps.length - 1}
                          className="p-1 text-neutral-400 hover:text-purple-600 disabled:opacity-30 rounded transition"
                          title="Move step down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveWorkflowStep && onRemoveWorkflowStep(step.id)}
                          disabled={workflowSteps.length <= 1}
                          className="p-1 text-neutral-400 hover:text-red-500 disabled:opacity-30 rounded transition"
                          title={workflowSteps.length <= 1 ? 'Minimum 1 step required' : 'Delete step'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* COLLAPSED SUMMARY LINE (when closed) */}
                  {!isExpanded && (
                    <div
                      onClick={() => toggleStepExpand(step.id)}
                      className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/50 flex items-center justify-between text-xs text-neutral-500 cursor-pointer"
                    >
                      <span className="font-mono text-[11px] truncate max-w-[400px]">
                        {step.prompt ? `"${step.prompt.slice(0, 70)}..."` : 'No prompt written yet'}
                      </span>
                      <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                        Click to Expand ({charCount} chars) →
                      </span>
                    </div>
                  )}

                  {/* EXPANDED STEP CARD BODY */}
                  {isExpanded && (
                    <div className="space-y-4 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
                      
                      {/* Validation Issues Banner */}
                      {step.validationIssues && step.validationIssues.length > 0 && (
                        <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                          <p className="font-bold flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>Step {step.order} Quality Issues:</span>
                          </p>
                          <ul className="mt-1 list-disc list-inside space-y-0.5 opacity-90 pl-1">
                            {step.validationIssues.map((issue, i) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Primary Prompt Code Editor */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                            Step Prompt Code <span className="text-purple-600">*</span>
                          </label>
                          <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                            <span>Use <code className="font-bold text-purple-600">{`{{variable_name}}`}</code> for dynamic inputs</span>
                            <VariableInfoTooltip />
                          </span>
                        </div>
                        <textarea
                          ref={(el) => {
                            stepTextareaRefs.current[step.id] = el;
                          }}
                          value={step.prompt}
                          onChange={(e) => onUpdateWorkflowStep && onUpdateWorkflowStep(step.id, { prompt: e.target.value })}
                          rows={6}
                          placeholder={`Write prompt instructions for Step ${step.order}...`}
                          className="w-full resize-none rounded-xl border border-neutral-200 bg-white p-3.5 font-mono text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 leading-relaxed"
                        />
                      </div>

                      {/* Compact Image Attachments (Reference & Proof Images) */}
                      <div className="rounded-xl border border-neutral-200/80 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                            <ImageIcon className="h-3.5 w-3.5 text-purple-600" />
                            <span>Step Image Attachments</span>
                          </span>
                          <span className="text-[10px] text-neutral-400">Optional reference / output proof</span>
                        </div>

                        <ImageProofUploader
                          assets={submission.assets || []}
                          onUploadAsset={onUploadAsset}
                          onRemoveAsset={onRemoveAsset}
                          onRetryUpload={onRetryAssetUpload}
                        />
                      </div>

                      {/* Step Description & Single Step AI Validation */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <input
                          type="text"
                          value={step.description || ''}
                          onChange={(e) => onUpdateWorkflowStep && onUpdateWorkflowStep(step.id, { description: e.target.value })}
                          placeholder="Optional description / expected output for this step"
                          className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 outline-none"
                        />

                        {onAnalyzeWorkflowStep && (
                          <button
                            type="button"
                            onClick={() => onAnalyzeWorkflowStep(step.id)}
                            disabled={step.analysisState === 'loading' || !step.prompt.trim()}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-850 px-3.5 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all disabled:opacity-50 shrink-0"
                          >
                            {step.analysisState === 'loading' ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                            )}
                            <span>{step.analysisState === 'stale' ? 'Re-analyze Step' : 'Analyze Step'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom + Add Step Primary Trigger */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAddStepAndFocus}
                disabled={workflowSteps.length >= 10}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-250 dark:border-neutral-800 bg-neutral-50/50 hover:bg-neutral-100/50 dark:bg-neutral-900/20 dark:hover:bg-neutral-900/40 py-4 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 text-purple-600" />
                <span>{workflowSteps.length >= 10 ? 'Maximum 10 Steps Reached' : `+ Add Step ${workflowSteps.length + 1}`}</span>
              </button>
            </div>
          </div>
        </div>

        {/* PROGRESSIVE DISCLOSURE: COLLAPSIBLE ADVANCED CONFIGURATION DRAWERS */}
        
        {/* Drawer 1: Variables Mapping Builder */}
        <div className="rounded-[28px] border border-neutral-200/80 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950 shadow-sm">
          <button
            type="button"
            onClick={() => setShowVariablesBuilder(!showVariablesBuilder)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600">
                <Code className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">
                  Variables Mapping Builder
                </h3>
                <div className="text-xs text-neutral-500 flex items-center gap-1">
                  <span>{submission.variables.length} parameters configured (extracted via <code className="font-mono font-bold text-purple-600">{`{{variable_name}}`}</code>)</span>
                  <VariableInfoTooltip />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                {showVariablesBuilder ? 'Hide Variables' : 'Configure Variables'}
              </span>
              {showVariablesBuilder ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </button>

          {showVariablesBuilder && (
            <div className="mt-6 pt-6 border-t border-neutral-200/80 dark:border-neutral-800 space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onAddVariable}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-250 bg-white hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 px-3.5 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Variable</span>
                </button>
              </div>

              {submission.variables.length === 0 ? (
                <div className="text-xs text-neutral-500 italic text-center py-4 flex items-center justify-center gap-1">
                  <span>No variables defined. Write <code className="font-mono font-bold text-purple-600">{`{{variable_name}}`}</code> in your prompt steps to automatically extract parameters.</span>
                  <VariableInfoTooltip />
                </div>
              ) : (
                <div className="space-y-3">
                  {submission.variables.map((v, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-purple-600 dark:text-purple-400 text-xs font-bold">{`{{`}</span>
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => onUpdateVariable(idx, { name: e.target.value })}
                          placeholder="variable_name"
                          className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-mono font-bold text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        />
                        <span className="font-mono text-purple-600 dark:text-purple-400 text-xs font-bold">{`}}`}</span>
                        <VariableInfoTooltip variableName={v.name} />
                      </div>
                      <input
                        type="text"
                        value={v.description}
                        onChange={(e) => onUpdateVariable(idx, { description: e.target.value })}
                        placeholder="Variable description & input guidance"
                        className="flex-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveVariable(idx)}
                        className="p-1.5 text-neutral-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer 2: Advanced Pipeline & Parameters */}
        <div className="rounded-[28px] border border-neutral-200/80 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950 shadow-sm">
          <button
            type="button"
            onClick={() => setShowAdvancedPipeline(!showAdvancedPipeline)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600">
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">
                  Advanced Pipeline Settings
                </h3>
                <p className="text-xs text-neutral-500">
                  Temperature ({submission.temperature ?? 0.7}), Max Tokens ({submission.max_tokens ?? 2048}), Format ({submission.output_format || 'markdown'})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                {showAdvancedPipeline ? 'Hide Settings' : 'Configure Pipeline'}
              </span>
              {showAdvancedPipeline ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </button>

          {showAdvancedPipeline && (
            <div className="mt-6 pt-6 border-t border-neutral-200/80 dark:border-neutral-800 grid gap-6 sm:grid-cols-2">
              {/* Temperature Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Temperature</span>
                  <span className="font-mono text-purple-600">{submission.temperature ?? 0.70}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={submission.temperature ?? 0.70}
                  onChange={(e) => onUpdateField({ temperature: parseFloat(e.target.value) })}
                  className="w-full accent-purple-600"
                />
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Max Tokens</label>
                <input
                  type="number"
                  value={submission.max_tokens ?? 2048}
                  onChange={(e) => onUpdateField({ max_tokens: parseInt(e.target.value, 10) })}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-mono font-bold dark:border-neutral-800 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                />
              </div>

              {/* Output Format */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Output Format</label>
                <select
                  value={submission.output_format || 'markdown'}
                  onChange={(e) => onUpdateField({ output_format: e.target.value as any })}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold dark:border-neutral-800 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                >
                  <option value="markdown">Markdown</option>
                  <option value="json">JSON Schema</option>
                  <option value="code">Source Code</option>
                  <option value="text">Plain Text</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Developer Pro Sidebar Metadata (~35%) */}
      <div className="space-y-6 lg:sticky lg:top-8">
        
        {/* Card: Workflow Metadata (Shared Backend Classification Form) */}
        <UnifiedClassificationForm
          sectionTitle="Workflow Metadata"
          submission={submission}
          lookupData={lookupData}
          fieldErrors={fieldErrors}
          onUpdateField={onUpdateField}
          onGenerateAiDetails={
            onGenerateAiDetails
              ? async () => {
                  const combined = (submission.workflow_steps || [])
                    .filter((s) => s.prompt.trim())
                    .map((s) => `Step ${s.order} (${s.title || 'Step'}):\n${s.prompt.trim()}`)
                    .join('\n\n');
                  if (combined.trim()) {
                    await onGenerateAiDetails(combined.trim());
                  }
                }
              : undefined
          }
          isAiLoading={isAiLoading}
        />

        {/* Environmental Footprint Card */}
        <EnvironmentalImpactCard
          systemPrompt={submission.system_prompt}
          userPrompt={submission.user_prompt}
          expectedOutput={submission.expected_output}
          variables={submission.variables}
          targetModel={submission.recommended_models[0]?.name || 'Gemini 2.5 Flash'}
          imageCount={submission.assets?.length || 0}
          workflowSteps={workflowSteps.map((s) => ({
            stepNumber: s.order,
            stepTitle: s.title,
            prompt: s.prompt,
            imageCount: (s.referenceAssets?.length || 0) + (s.resultAssets?.length || 0) + (s.assets?.length || 0),
          }))}
        />
      </div>
    </div>
  );
}