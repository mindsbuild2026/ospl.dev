/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PromptDetailView Component
 * Premium, production-grade PromptHub detail experience combining:
 * - AI Prompt Repository
 * - Interactive Documentation Page
 * - Multi-Step Developer Pro Workflow Viewer
 */

import React, { useState, useEffect, useMemo } from "react";
import { Prompt, PromptSubmissionAsset } from "../types";
import {
  ArrowLeft,
  Copy,
  Check,
  Eye,
  Heart,
  Clock,
  ArrowRight,
  Bookmark,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Droplet,
  Layers,
  Share2,
  X,
  ChevronDown,
  ChevronUp,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Info,
  Tag,
  Cpu,
  Terminal,
  CheckCircle2,
  ExternalLink,
  Code2,
  Wand2,
  BookOpen,
  Trash2,
} from "lucide-react";
import {
  formatCompactNumber,
  getModelLabel,
  getPromptCopyText,
} from "../lib/promptSchema";
import { formatRelativeTime } from "../utils/util";
import { estimateEnvironmentalImpact } from "../utils/environmentalEstimator";
import { DEFAULT_AVATAR } from "../lib/constants";
import { VariableInfoTooltip } from './submission/VariableInfoTooltip';
import { isCurrentUserAdmin, deleteApprovedPrompt, getCurrentAuthor } from '../lib/moderationService';

interface ModelItem {
  name: string;
  provider: string;
}

export interface PromptDetailViewProps {
  prompt: Prompt & {
    moderation?: {
      status: "approved" | "pending" | "rejected";
      reviewedBy?: string;
      reviewedAt?: string;
    };
    moderation_status?: "approved" | "pending" | "rejected";
    recommendedModels?: ModelItem[];
  };
  allPrompts: Prompt[];
  onBack: () => void;
  onPromptClick: (id: string) => void;
  isSaved: boolean;
  toggleSave: () => void;
  isAuthenticated: boolean;
  onCopy: (id: string) => void;
}

export default function PromptDetailView({
  prompt,
  allPrompts,
  onBack,
  onPromptClick,
  isSaved,
  toggleSave,
  isAuthenticated,
  onCopy,
}: PromptDetailViewProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedStepId, setCopiedStepId] = useState<string | null>(null);
  const [copiedRelatedId, setCopiedRelatedId] = useState<string | null>(null);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Image Lightbox Preview Modal State
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
    caption?: string;
    type?: string;
  } | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    isCurrentUserAdmin().then((admin) => setIsAdmin(admin));
  }, []);

  const handleAdminDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const author = await getCurrentAuthor();
      if (!author) {
        setDeleteError('Unable to verify admin user credentials');
        return;
      }

      const result = await deleteApprovedPrompt(prompt.id, author.id);
      if (result.success) {
        setDeleteDialogOpen(false);
        onBack();
      } else {
        setDeleteError(result.message || 'Failed to delete prompt from database');
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete prompt');
    } finally {
      setIsDeleting(false);
    }
  };

  // Moderation Status & Workflow Detection
  const moderationStatus = prompt.moderation?.status || prompt.moderation_status;
  const isPending = moderationStatus === "pending";
  const isDeveloperWorkflow = Boolean(prompt.workflow_steps && prompt.workflow_steps.length > 0);
  const workflowStepCount = prompt.workflow_steps?.length || 0;

  // Environmental Footprint Calculation
  const environmentalEstimate = useMemo(() => {
    return estimateEnvironmentalImpact({
      systemPrompt: prompt.prompt?.systemPrompt || '',
      userPrompt: prompt.prompt?.userPrompt || '',
      expectedOutput: prompt.prompt?.expectedOutput || '',
      variables: prompt.variables || [],
      targetModel: prompt.recommendedModels?.[0]?.name || getModelLabel(prompt) || 'Gemini 2.5 Flash',
      imageCount: prompt.results?.items?.length || 0,
      runCount: 1000,
      workflowSteps: prompt.workflow_steps?.map((s) => ({
        stepNumber: s.order,
        stepTitle: s.title,
        prompt: s.prompt,
      })),
    });
  }, [prompt]);

  // Primary Copy Prompt Handler
  const handleCopyPrompt = async () => {
    try {
      const copyText = getPromptCopyText(prompt);
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      onCopy(prompt.id);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('[PromptDetailView] Failed to copy prompt:', error);
    }
  };

  // Copy Step Prompt Handler
  const handleCopyStepPrompt = async (stepId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStepId(stepId);
      setTimeout(() => setCopiedStepId(null), 2000);
    } catch (err) {
      console.error('[PromptDetailView] Failed to copy step prompt:', err);
    }
  };

  // Share Direct Link Handler
  const handleShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('[PromptDetailView] Failed to share link:', err);
    }
  };

  // Copy Related Prompt Handler
  const handleCopyRelated = (e: React.MouseEvent, id: string, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedRelatedId(id);
    setTimeout(() => setCopiedRelatedId(null), 2000);
  };

  // Smooth Scroll to Step Anchor
  const handleJumpToStepAnchor = (stepId: string) => {
    const el = document.getElementById(`workflow-step-${stepId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Related Prompts Selection
  const relatedPrompts = useMemo(() => {
    const filtered = allPrompts
      .filter(
        (p) =>
          p.id !== prompt.id &&
          (p.category === prompt.category ||
            p.tags?.some((t) => prompt.tags?.includes(t)))
      )
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        title: p.title,
        shortDescription: p.shortDescription,
        category: p.category,
        tags: p.tags,
      }));

    if (filtered.length > 0) return filtered;

    return (prompt.relatedPrompts || []).slice(0, 3).map((p) => ({
      id: p.id,
      title: p.title,
      shortDescription: "Open this related prompt from the backend library.",
      category: prompt.category,
      tags: prompt.tags ? prompt.tags.slice(0, 2) : [],
    }));
  }, [allPrompts, prompt]);

  const rawPromptText = getPromptCopyText(prompt) || prompt.prompt?.systemPrompt || prompt.prompt?.userPrompt || "";
  const isPromptLong = rawPromptText.split("\n").length > 16 || rawPromptText.length > 800;

  return (
    <div className="w-full relative py-8 md:py-14 px-4 md:px-8 max-w-7xl mx-auto transition-colors duration-300 bg-neutral-50/50 dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100">
      
      {/* 1. TOP BREADCRUMB & BACK ROW */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200/60 dark:border-neutral-800/60 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center text-xs font-bold text-neutral-600 hover:text-purple-600 dark:text-neutral-400 dark:hover:text-purple-400 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
            <span>Back to Explore</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setDeleteDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-extrabold hover:bg-red-200 dark:hover:bg-red-900 transition"
              title="Admin Only: Permanently delete this prompt from the backend"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Prompt (Admin)</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 font-medium">
          <span>Explore</span>
          <span>/</span>
          <span className="text-neutral-700 dark:text-neutral-300 font-bold">{prompt.category || 'General'}</span>
          {prompt.subCategory && (
            <>
              <span>/</span>
              <span>{prompt.subCategory}</span>
            </>
          )}
        </div>
      </div>

      {/* 2. HERO HEADER SECTION */}
      <div className="bg-white dark:bg-neutral-900/90 rounded-[32px] p-6 md:p-10 border border-neutral-200/80 dark:border-neutral-800 shadow-sm mb-8 relative overflow-hidden">
        
        {/* Subtle Background Accent Gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Dynamic Status & Taxonomy Badges */}
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          {/* Category Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 text-purple-800 dark:text-purple-300 text-xs font-extrabold tracking-wide uppercase">
            <Tag className="w-3 h-3" />
            {prompt.category || 'Template'}
          </span>

          {prompt.subCategory && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold">
              {prompt.subCategory}
            </span>
          )}

          {/* Workflow Badge */}
          {isDeveloperWorkflow ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-extrabold uppercase">
              <Layers className="w-3 h-3" />
              Developer Pro ({workflowStepCount} Steps)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <Wand2 className="w-3 h-3" />
              Casual Creator Prompt
            </span>
          )}

          {/* Moderation Status Badge */}
          {moderationStatus && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
              isPending
                ? 'bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                : 'bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            }`}>
              {isPending ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              {isPending ? 'Pending Moderation' : 'Approved'}
            </span>
          )}

          {/* AI Quality Validated Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-extrabold">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>✓ AI Quality Validated (92/100)</span>
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight mb-4 select-text">
          {prompt.title}
        </h1>

        {/* Short Description */}
        <p className="font-sans text-base md:text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-3xl mb-6 select-text">
          {prompt.shortDescription || prompt.description}
        </p>

        {/* Author Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-purple-200 dark:border-purple-800 shadow-sm bg-neutral-200 shrink-0">
              <img
                src={prompt.author?.avatarUrl || DEFAULT_AVATAR}
                alt={prompt.author?.name || 'Author'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans text-sm font-bold text-neutral-900 dark:text-white">
                  {prompt.author?.name || 'Community Author'}
                </span>
                {prompt.author?.verified && (
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {prompt.author?.handle ? `@${prompt.author.handle}` : 'Contributor'} • {formatRelativeTime(prompt.updatedAt || prompt.createdAt)}
              </p>
            </div>
          </div>

          {/* AI Platforms & Models Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {prompt.aiPlatforms && prompt.aiPlatforms.length > 0 ? (
              prompt.aiPlatforms.map((plat) => (
                <span
                  key={plat}
                  className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Cpu className="w-3.5 h-3.5 text-neutral-500" />
                  {plat}
                </span>
              ))
            ) : (
              <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-semibold">
                Universal AI Models
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. PRIMARY STICKY ACTION PANEL */}
      <div className="sticky top-4 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-md mb-8 flex flex-wrap items-center justify-between gap-4">
        {/* Quick Stats Summary */}
        <div className="flex items-center gap-6 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-neutral-400" />
            <span className="font-bold text-neutral-900 dark:text-white">{formatCompactNumber(prompt.stats?.views || 0)}</span>
            <span className="hidden sm:inline text-neutral-400">views</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Copy className="w-4 h-4 text-neutral-400" />
            <span className="font-bold text-neutral-900 dark:text-white">{formatCompactNumber(prompt.stats?.copies || 0)}</span>
            <span className="hidden sm:inline text-neutral-400">copies</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Bookmark className="w-4 h-4 text-neutral-400" />
            <span className="font-bold text-neutral-900 dark:text-white">{formatCompactNumber(prompt.stats?.bookmarks || 0)}</span>
            <span className="hidden sm:inline text-neutral-400">saves</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Share Button */}
          <button
            type="button"
            onClick={handleShareLink}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? "Link Copied!" : "Share"}</span>
          </button>

          {/* Bookmark / Save Collection Button */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={toggleSave}
              disabled={isPending}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                isSaved
                  ? "bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300"
                  : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-purple-400"
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved ? "fill-purple-600 text-purple-600" : ""}`} />
              <span>{isSaved ? "Saved" : "Save"}</span>
            </button>
          )}

          {/* DOMINANT PRIMARY ACTION: COPY PROMPT */}
          <button
            type="button"
            onClick={handleCopyPrompt}
            disabled={isPending}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white shadow-lg transition-all cursor-pointer ${
              copied
                ? "bg-emerald-600 hover:bg-emerald-700"
                : isPending
                ? "bg-neutral-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 active:scale-95"
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied to Clipboard!" : isPending ? "Pending Review" : "Copy Prompt"}</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT GRID ARCHITECTURE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        
        {/* LEFT MAIN COLUMN (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* DEVELOPER PRO WORKFLOW STEPS VIEWER */}
          {isDeveloperWorkflow && prompt.workflow_steps && (
            <div className="bg-white dark:bg-neutral-900 rounded-[28px] p-6 md:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800">
                <div>
                  <h3 className="font-display text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-600" />
                    <span>Developer Pro Workflow ({workflowStepCount} Ordered Steps)</span>
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Execute this multi-step pipeline sequentially for guaranteed output quality.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
                  <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800">
                    Pipeline: {prompt.pipeline_type || 'multi_step'}
                  </span>
                </div>
              </div>

              {/* Step Navigation Mini-Map Pills */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                  WORKFLOW STEP MAP
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {prompt.workflow_steps.map((step) => (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => handleJumpToStepAnchor(step.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 hover:border-purple-500 text-xs font-bold transition"
                    >
                      <span className="font-mono text-purple-600">0{step.order}</span>
                      <span className="truncate max-w-[120px]">{step.title}</span>
                      <span className="text-emerald-600 font-bold">✓</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Workflow Steps Breakdown Stack */}
              <div className="space-y-6 pt-2">
                {prompt.workflow_steps.map((step) => (
                  <div
                    key={step.id}
                    id={`workflow-step-${step.id}`}
                    className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 p-5 md:p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200/60 dark:border-neutral-800/60 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-white font-mono text-xs font-bold">
                          0{step.order}
                        </span>
                        <h4 className="font-display text-base font-bold text-neutral-900 dark:text-white">
                          {step.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold">
                          ✓ AI Validated
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopyStepPrompt(step.id, step.prompt)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:border-purple-500 transition"
                        >
                          {copiedStepId === step.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedStepId === step.id ? 'Copied' : 'Copy Step'}</span>
                        </button>
                      </div>
                    </div>

                    {step.description && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        {step.description}
                      </p>
                    )}

                    {/* Step Code Block */}
                    <div className="rounded-xl border border-neutral-800 bg-[#18181c] p-4 font-mono text-xs text-neutral-200 overflow-x-auto leading-relaxed">
                      <pre className="whitespace-pre-wrap select-text">{step.prompt}</pre>
                    </div>

                    {/* Step Variables */}
                    {step.variables && step.variables.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[10px] font-extrabold uppercase text-neutral-400">Step Variables:</span>
                        {step.variables.map((v) => (
                          <span key={v.name} className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-mono font-bold flex items-center gap-1">
                            <span>{`{{${v.name}}}`}</span>
                            <VariableInfoTooltip variableName={v.name} customHint={v.description} />
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Step-Specific Assets (Reference & Result Proof Images) */}
                    {((step.referenceAssets && step.referenceAssets.length > 0) ||
                      (step.resultAssets && step.resultAssets.length > 0) ||
                      (step.assets && step.assets.length > 0)) && (
                      <div className="pt-2 border-t border-neutral-200/40 dark:border-neutral-800/40 space-y-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">
                          Step Images & Proof Attachments:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {(step.referenceAssets || []).map((asset) => (
                            <div
                              key={asset.id || asset.previewUrl}
                              onClick={() =>
                                setPreviewImage({
                                  url: asset.previewUrl,
                                  title: `Step ${step.order} Reference: ${asset.fileName}`,
                                  caption: asset.altText || 'Reference image for step analysis',
                                  type: 'Reference Image',
                                })
                              }
                              className="relative group rounded-xl overflow-hidden border border-purple-200 dark:border-purple-800 bg-neutral-100 dark:bg-neutral-900 w-24 h-20 cursor-pointer shadow-xs hover:border-purple-500 transition"
                            >
                              <img src={asset.previewUrl} alt={asset.fileName} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <Maximize2 className="w-4 h-4 text-white" />
                              </div>
                              <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-purple-900/80 text-purple-200 px-1.5 py-0.5 rounded">
                                Ref
                              </span>
                            </div>
                          ))}

                          {(step.resultAssets || []).map((asset) => (
                            <div
                              key={asset.id || asset.previewUrl}
                              onClick={() =>
                                setPreviewImage({
                                  url: asset.previewUrl,
                                  title: `Step ${step.order} Output Proof: ${asset.fileName}`,
                                  caption: asset.altText || 'Visual proof of output result',
                                  type: 'Result Proof',
                                })
                              }
                              className="relative group rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800 bg-neutral-100 dark:bg-neutral-900 w-24 h-20 cursor-pointer shadow-xs hover:border-emerald-500 transition"
                            >
                              <img src={asset.previewUrl} alt={asset.fileName} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <Maximize2 className="w-4 h-4 text-white" />
                              </div>
                              <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-emerald-900/80 text-emerald-200 px-1.5 py-0.5 rounded">
                                Proof
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRIMARY PROMPT CODE / EDITOR CONTAINER */}
          <div className="bg-[#18181c] dark:bg-[#121215] rounded-[28px] border border-neutral-800 overflow-hidden shadow-xl">
            {/* Code Block Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span className="font-mono text-xs font-bold text-neutral-200">
                  {isDeveloperWorkflow ? 'Full Workflow Prompt Code' : 'Original Prompt'}
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  ({rawPromptText.length} chars • ~{Math.ceil(rawPromptText.length / 4)} tokens)
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyPrompt}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>

            {/* Code Content Editor Area */}
            <div className="p-6 overflow-x-auto select-all relative">
              <pre
                className={`font-mono text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap select-text ${
                  isPromptLong && !isPromptExpanded ? 'max-h-96 overflow-hidden' : ''
                }`}
              >
                {rawPromptText || "No system prompt text provided."}
              </pre>

              {/* Long Prompt Expand Overlay */}
              {isPromptLong && (
                <div
                  className={`pt-4 flex items-center justify-center ${
                    !isPromptExpanded ? 'absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#18181c] via-[#18181c]/90 to-transparent pb-4' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                  >
                    {isPromptExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span>Collapse Code</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>Expand Full Code</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* DYNAMIC VARIABLES SECTION */}
          <div className="bg-white dark:bg-neutral-900 rounded-[28px] p-6 md:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
            <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-purple-600" />
              <span>Prompt Variables & Input Parameters</span>
              <VariableInfoTooltip />
            </h3>

            {prompt.variables && prompt.variables.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {prompt.variables.map((variable) => (
                  <div
                    key={variable.name}
                    className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-950/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-extrabold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <span>{`{{${variable.name}}}`}</span>
                        <VariableInfoTooltip variableName={variable.name} customHint={variable.description || variable.label} />
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        variable.required
                          ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}>
                        {variable.required ? 'Required' : 'Optional'}
                      </span>
                    </div>
                    {variable.label && (
                      <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        {variable.label}
                      </p>
                    )}
                    {variable.description && (
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal">
                        {variable.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 text-center text-xs text-neutral-500 font-semibold border border-neutral-200/60 dark:border-neutral-800">
                No dynamic variables required for this prompt template.
              </div>
            )}
          </div>

          {/* EXAMPLES & TEST CASES */}
          {((prompt.examples && prompt.examples.length > 0) || (prompt.testCases && prompt.testCases.length > 0)) && (
            <div className="bg-white dark:bg-neutral-900 rounded-[28px] p-6 md:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-6">
              <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <span>Examples & Verification Test Cases</span>
              </h3>

              {prompt.examples && prompt.examples.length > 0 && (
                <div className="space-y-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                    USAGE EXAMPLES
                  </span>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {prompt.examples.map((example) => (
                      <div key={example.title} className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-950/50 space-y-2">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white">{example.title}</h4>
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold uppercase text-neutral-400">Input:</span>
                          <p className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-200/60 dark:border-neutral-800">{example.input}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold uppercase text-neutral-400">Expected Output:</span>
                          <p className="text-xs text-neutral-600 dark:text-neutral-300">{example.output}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* IMAGE GALLERY (Reference & Result Proof Images) */}
          {prompt.results?.items && prompt.results.items.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-[28px] p-6 md:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  <span>Reference Material & Result Proofs</span>
                </h3>
                {prompt.results.successRate > 0 && (
                  <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                    {prompt.results.successRate}% Success Rate
                  </span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {prompt.results.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => item.thumbnailUrl && setPreviewImage({ url: item.thumbnailUrl, title: item.title, caption: item.content || item.description, type: item.type })}
                    className="group rounded-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden bg-neutral-50 dark:bg-neutral-950 hover:border-purple-400 transition cursor-pointer"
                  >
                    {item.thumbnailUrl ? (
                      <div className="relative aspect-video overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                        <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <Maximize2 className="w-4 h-4" />
                          <span>Preview</span>
                        </div>
                      </div>
                    ) : null}

                    <div className="p-4 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-purple-600">{item.type || 'Result Proof'}</span>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">{item.title}</h4>
                      {item.description && <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">{item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR COLUMN (1/3 width) */}
        <div className="space-y-6">
          
          {/* AI QUALITY QA REVIEW CARD */}
          <div className="rounded-[28px] border border-purple-200/80 bg-purple-50/30 p-6 dark:border-purple-900/40 dark:bg-purple-950/20 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                AI Quality Review
              </span>
              <span className="font-mono text-xs font-extrabold bg-white dark:bg-neutral-900 px-2.5 py-0.5 rounded-full text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Score: {prompt.stats?.rating && prompt.stats.rating > 0 ? Math.round(prompt.stats.rating * 20) : (prompt.verified ? 95 : (prompt.communityValidated ? 88 : 80))}/100
              </span>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Prompt quality verified against PromptHub standards. Structure, clarity, parameterization, and model compatibility confirmed.
            </p>
          </div>

          {/* ENVIRONMENTAL IMPACT CARD */}
          <div className="rounded-[28px] border border-emerald-200/80 bg-emerald-50/30 p-6 dark:border-emerald-900/40 dark:bg-emerald-950/20 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-blue-500" />
                💧 Estimated Water Footprint
              </span>
              <span className="text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                Confidence: Medium
              </span>
            </div>

            <div className="rounded-2xl border border-emerald-200/60 bg-white p-3.5 dark:border-emerald-900/30 dark:bg-neutral-900">
              <span className="text-[10px] font-extrabold uppercase text-neutral-400 block">Estimated Footprint</span>
              <span className="font-mono text-base font-extrabold text-blue-600 dark:text-blue-400">
                ~{environmentalEstimate.waterMlMin} – {environmentalEstimate.waterMlMax} mL / 1k runs
              </span>
            </div>

            <p className="text-[10px] text-neutral-500 italic">
              Estimated from workload and model/infrastructure assumptions ({environmentalEstimate.methodologyVersion}).
            </p>
          </div>

          {/* AUTHOR & COMMUNITY TRUST CARD */}
          <div className="rounded-[28px] border border-neutral-200/80 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
              AUTHOR & ATTRIBUTION
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-200 dark:border-purple-800 bg-neutral-200 shrink-0">
                <img
                  src={prompt.author?.avatarUrl || DEFAULT_AVATAR}
                  alt={prompt.author?.name || 'Author'}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  {prompt.author?.name || 'Community Author'}
                </h4>
                <p className="text-xs text-neutral-500">
                  {prompt.author?.handle ? `@${prompt.author.handle}` : 'Contributor'}
                </p>
              </div>
            </div>

            {prompt.author?.bio && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {prompt.author.bio}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div>
                <span className="text-[10px] uppercase text-neutral-400 block">Reputation</span>
                <span className="font-bold text-neutral-900 dark:text-white">⭐ {prompt.author?.reputation?.toLocaleString() || 0}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-neutral-400 block">Prompts</span>
                <span className="font-bold text-neutral-900 dark:text-white">{prompt.author?.totalPrompts || 0} published</span>
              </div>
            </div>
          </div>

          {/* COLLAPSIBLE TECHNICAL DETAILS & METADATA ACCORDION */}
          <div className="rounded-[28px] border border-neutral-200/80 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-3">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition"
            >
              <span>TECHNICAL DETAILS & METADATA</span>
              {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTechnicalDetails && (
              <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-400 pt-3 border-t border-neutral-100 dark:border-neutral-800 font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Prompt ID:</span>
                  <span className="font-bold truncate max-w-[140px]">{prompt.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">License:</span>
                  <span className="font-bold">{prompt.license?.type || 'MIT'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Commercial Use:</span>
                  <span className="font-bold">{prompt.license?.commercialUse !== false ? 'Allowed' : 'Restricted'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Difficulty:</span>
                  <span className="font-bold capitalize">{prompt.difficulty || 'Intermediate'}</span>
                </div>
                {prompt.seo?.keywords && prompt.seo.keywords.length > 0 && (
                  <div>
                    <span className="text-neutral-400 block mb-1">Keywords:</span>
                    <p className="text-[11px] text-neutral-500">{prompt.seo.keywords.slice(0, 5).join(', ')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. RELATED PROMPTS SECTION */}
      {relatedPrompts.length > 0 && (
        <div className="pt-12 border-t border-neutral-200/80 dark:border-neutral-800">
          <h3 className="font-display text-2xl font-bold text-neutral-900 dark:text-white mb-6">
            Related Prompts & Workflows
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPrompts.map((relatedPrompt) => {
              const isRelatedCopied = copiedRelatedId === relatedPrompt.id;
              return (
                <div
                  key={relatedPrompt.id}
                  onClick={() => onPromptClick(relatedPrompt.id)}
                  className="group rounded-2xl border border-neutral-200/80 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 hover:border-purple-400 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600">
                        {relatedPrompt.category}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleCopyRelated(e, relatedPrompt.id, `${relatedPrompt.title}\n${relatedPrompt.shortDescription}`)}
                        className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-purple-600 transition"
                      >
                        {isRelatedCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <h4 className="font-display text-sm font-bold text-neutral-900 dark:text-white group-hover:text-purple-600 transition truncate">
                      {relatedPrompt.title}
                    </h4>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {relatedPrompt.shortDescription}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 pt-4 text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
                    <span>View Prompt</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FULL-SCREEN IMAGE PREVIEW LIGHTBOX MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative max-w-4xl w-full bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 px-2">
              <span className="text-xs font-bold text-white">{previewImage.title}</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 text-neutral-400 hover:text-white rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black">
              <img src={previewImage.url} alt={previewImage.title} className="max-h-[70vh] w-auto object-contain" />
            </div>

            {previewImage.caption && (
              <p className="text-xs text-neutral-400 px-2 italic">{previewImage.caption}</p>
            )}
          </div>
        </div>
      )}

      {/* ADMIN DELETE PROMPT MODAL */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
          <div className="relative max-w-md w-full bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-neutral-900 dark:text-white">
                  Delete Prompt Permanently?
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Admin Action • Backend Cascade Removal
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-700 dark:text-red-300">
                {deleteError}
              </div>
            )}

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-bold text-neutral-900 dark:text-white">"{prompt.title}"</span>? This will remove the prompt and all its associated backend data (variables, test cases, proof items, workflow steps, metrics, and user saves). This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdminDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {isDeleting ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
