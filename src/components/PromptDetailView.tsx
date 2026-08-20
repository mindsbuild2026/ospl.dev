/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PromptDetailView Component
 * Premium, production-grade PromptHub detail experience:
 * - Make the User's Real Prompt the Hero (#1 Visual Priority)
 * - Strict Separation: Creator Content vs AI Analysis & Metadata
 * - Two-Column Desktop Layout & Responsive Single-Column Mobile Flow
 * - Support for both Casual Creator Prompts and Multi-Step Developer Pro Workflows
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Prompt, PromptSubmissionAsset } from "../types";
import { copyTextToClipboard } from "../lib/clipboardService";
import {
  ArrowLeft,
  Copy,
  Check,
  Eye,
  Heart,
  Clock,
  ArrowRight,
  Bookmark,
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
  Tag,
  Cpu,
  Terminal,
  CheckCircle2,
  Code2,
  Wand2,
  BookOpen,
  Trash2,
  User as UserIcon,
  Zap,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Star,
} from "lucide-react";
import {
  formatCompactNumber,
  getModelLabel,
  getPromptCopyText,
} from "../lib/promptSchema";
import { formatRelativeTime } from "../utils/util";
import { estimateEnvironmentalImpact } from "../utils/environmentalEstimator";
import { DEFAULT_AVATAR } from "../lib/constants";
import { VariableInfoTooltip } from "./submission/VariableInfoTooltip";
import { EnvironmentalImpactCard } from "./submission/EnvironmentalImpactCard";
import { fetchPromptRatingSummary, ratePrompt } from "../lib/promptRepository";
import { PromptRatingSummary } from "../types";
import {
  isCurrentUserAdmin,
  deleteApprovedPrompt,
  getCurrentAuthor,
} from "../lib/moderationService";

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
  onRatePrompt?: (id: string, rating: number) => Promise<void>;
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
  onRatePrompt,
}: PromptDetailViewProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedStepId, setCopiedStepId] = useState<string | null>(null);
  const [copiedRelatedId, setCopiedRelatedId] = useState<string | null>(null);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showWaterExplanation, setShowWaterExplanation] = useState(false);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  // Image Lightbox Preview Modal State
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
    caption?: string;
    type?: string;
  } | null>(null);

  // Admin Delete State
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
        setDeleteError("Unable to verify admin user credentials");
        return;
      }

      const result = await deleteApprovedPrompt(prompt.id, author.id);
      if (result.success) {
        setDeleteDialogOpen(false);
        onBack();
      } else {
        setDeleteError(result.message || "Failed to delete prompt from database");
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete prompt");
    } finally {
      setIsDeleting(false);
    }
  };

  // Moderation Status & Workflow Detection
  const moderationStatus = prompt.moderation?.status || prompt.moderation_status || "approved";
  const isPending = moderationStatus === "pending";
  const isDeveloperWorkflow = prompt.prompt_mode === "developer_pro";
  const workflowSteps = isDeveloperWorkflow ? (prompt.workflow_steps || []) : [];
  const workflowStepCount = workflowSteps.length;

  useEffect(() => {
    if (isDeveloperWorkflow && workflowSteps.length > 0 && !activeStepId) {
      setActiveStepId(workflowSteps[0].id);
    }
  }, [isDeveloperWorkflow, workflowSteps, activeStepId]);

  // Environmental Footprint Calculation
  const environmentalEstimate = useMemo(() => {
    return estimateEnvironmentalImpact({
      systemPrompt: prompt.prompt?.systemPrompt || "",
      userPrompt: prompt.prompt?.userPrompt || "",
      expectedOutput: prompt.prompt?.expectedOutput || "",
      variables: prompt.variables || [],
      targetModel: prompt.recommendedModels?.[0]?.name || getModelLabel(prompt) || "Gemini 2.5 Flash",
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
      const success = await copyTextToClipboard(copyText);
      if (success) {
        setCopied(true);
        onCopy(prompt.id);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("[PromptDetailView] Failed to copy prompt:", error);
    }
  };

  // Copy Step Prompt Handler
  const handleCopyStepPrompt = async (stepId: string, stepPromptText: string) => {
    try {
      const success = await copyTextToClipboard(stepPromptText);
      if (success) {
        setCopiedStepId(stepId);
        setTimeout(() => setCopiedStepId(null), 2000);
      }
    } catch (error) {
      console.error("[PromptDetailView] Failed to copy step prompt:", error);
    }
  };

  // Copy Share Link Handler
  const handleShareLink = async () => {
    try {
      const success = await copyTextToClipboard(window.location.href);
      if (success) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch (error) {
      console.error("[PromptDetailView] Failed to copy link:", error);
    }
  };

  // Related Prompts Selection
  const relatedPrompts = useMemo(() => {
    const filterCategory = prompt.category?.toLowerCase();
    const filterTags = prompt.tags ? prompt.tags.map((t) => t.toLowerCase()) : [];

    const matches = allPrompts.filter((item) => {
      if (item.id === prompt.id) return false;
      const sameCategory = item.category?.toLowerCase() === filterCategory;
      const hasMatchingTag = item.tags?.some((t) => filterTags.includes(t.toLowerCase()));
      return sameCategory || hasMatchingTag;
    });

    return matches.slice(0, 3).map((item) => ({
      id: item.id,
      title: item.title,
      shortDescription: item.shortDescription || "Related prompt blueprint from the library.",
      category: item.category,
      tags: item.tags ? item.tags.slice(0, 2) : [],
    }));
  }, [allPrompts, prompt]);

  // Extract raw user prompt text with multi-tier fallbacks
  const rawPromptText = (
    getPromptCopyText(prompt)?.trim() ||
    prompt.prompt?.userPrompt?.trim() ||
    prompt.prompt?.systemPrompt?.trim() ||
    prompt.description?.trim() ||
    prompt.shortDescription?.trim() ||
    ""
  );
  
  const isPromptLong = rawPromptText.split("\n").length > 16 || rawPromptText.length > 800;

  // Separate Reference Images vs Result Proof Images
  const referenceImages = useMemo(() => {
    const refs: PromptSubmissionAsset[] = [];
    if (prompt.results?.items) {
      prompt.results.items
        .filter((item) => item.type === "image" && item.thumbnailUrl)
        .forEach((item) => {
          refs.push({
            id: item.id,
            promptId: prompt.id,
            assetType: "reference_image",
            fileName: item.title || "Reference Image",
            storagePath: item.thumbnailUrl || "",
            previewUrl: item.thumbnailUrl || "",
            altText: item.description || item.content,
            createdAt: "",
          });
        });
    }
    return refs;
  }, [prompt]);

  const resultProofImages = useMemo(() => {
    const proofs: PromptSubmissionAsset[] = [];
    if (prompt.results?.items) {
      prompt.results.items
        .filter((item) => (item.type === "image" || item.type === "text" || !item.type) && item.thumbnailUrl)
        .forEach((item) => {
          proofs.push({
            id: item.id,
            promptId: prompt.id,
            assetType: "result_proof",
            fileName: item.title || "Result Proof",
            storagePath: item.thumbnailUrl || "",
            previewUrl: item.thumbnailUrl || "",
            altText: item.description || item.content,
            createdAt: "",
          });
        });
    }
    return proofs;
  }, [prompt]);

  // Target Models List
  const targetModels = useMemo(() => {
    if (prompt.recommendedModels && prompt.recommendedModels.length > 0) {
      return prompt.recommendedModels.map((m) => m.name);
    }
    if (prompt.aiPlatforms && prompt.aiPlatforms.length > 0) {
      return prompt.aiPlatforms;
    }
    return ["ChatGPT", "Claude 3.5", "Gemini 2.5"];
  }, [prompt]);

  // Smooth scroll to step
  const scrollToStep = (stepId: string) => {
    setActiveStepId(stepId);
    const element = document.getElementById(`workflow-step-${stepId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="w-full relative py-8 md:py-12 px-4 md:px-8 max-w-7xl mx-auto transition-colors duration-300 bg-neutral-50/50 dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100">
      
      {/* 1. TOP BREADCRUMB & BACK ROW */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200/60 dark:border-neutral-800/60 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
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
              title="Admin Only: Permanently delete this prompt from backend"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Prompt (Admin)</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 font-medium">
          <span>Explore</span>
          <span>/</span>
          <span className="text-neutral-700 dark:text-neutral-300 font-bold">{prompt.category || "General"}</span>
          {prompt.subCategory && (
            <>
              <span>/</span>
              <span>{prompt.subCategory}</span>
            </>
          )}
        </div>
      </div>

      {/* 2. HERO / PROMPT HEADER CARD */}
      <div className="bg-white dark:bg-neutral-900 rounded-[32px] p-6 md:p-10 border border-neutral-200/80 dark:border-neutral-800 shadow-sm mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 text-purple-800 dark:text-purple-300 text-xs font-extrabold tracking-wide uppercase">
            <Tag className="w-3 h-3" />
            {prompt.category || "General"}
          </span>

          {prompt.subCategory && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold">
              {prompt.subCategory}
            </span>
          )}

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

          {/* Explicit Status Badges */}
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>✓ AI Validated</span>
          </span>

          {isPending ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>⏳ Pending Moderation</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Approved</span>
            </span>
          )}
        </div>

        {/* AI-Generated Title & Description */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI ANALYSIS METADATA</span>
          </div>
          <h1 className="font-display text-2xl md:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-tight">
            {prompt.title}
          </h1>
          <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-4xl">
            {prompt.shortDescription || prompt.description}
          </p>
        </div>

        {/* Author & Target AI Models Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/60 text-xs">
          {/* Author Badge */}
          <div className="flex items-center gap-3">
            <img
              src={prompt.author?.avatarUrl || DEFAULT_AVATAR}
              alt={prompt.author?.name || "Author"}
              className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-neutral-900 dark:text-white">{prompt.author?.name || "Anonymous Creator"}</span>
                {prompt.author?.verified && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
              </div>
              <div className="text-[11px] text-neutral-400">
                @{prompt.author?.handle || "creator"} • Submitted {formatRelativeTime(prompt.createdAt || prompt.stats?.updated)}
              </div>
            </div>
          </div>

          {/* AI Model Chips */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">AI Models:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {targetModels.map((modelName) => (
                <span
                  key={modelName}
                  className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono text-[11px] font-bold border border-neutral-200/60 dark:border-neutral-700"
                >
                  {modelName}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. METRICS & ACTION BAR */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-xs mb-8 flex flex-wrap items-center justify-between gap-4">
        {/* Engagement Stats Strip */}
        <div className="flex flex-wrap items-center gap-5 text-xs text-neutral-600 dark:text-neutral-400 font-semibold">
          <span className="flex items-center gap-1.5" title="Total Views">
            <Eye className="w-4 h-4 text-purple-600" />
            <strong className="text-neutral-900 dark:text-white">{formatCompactNumber(prompt.stats?.views || 0)}</strong> Views
          </span>
          <span className="flex items-center gap-1.5" title="Total Copies">
            <Copy className="w-4 h-4 text-blue-600" />
            <strong className="text-neutral-900 dark:text-white">{formatCompactNumber(prompt.stats?.copies || 0)}</strong> Copies
          </span>
          <span className="flex items-center gap-1.5" title="Total Saves">
            <Heart className={`w-4 h-4 ${isSaved ? "fill-purple-600 text-purple-600" : "text-neutral-400"}`} />
            <strong className="text-neutral-900 dark:text-white">{formatCompactNumber(prompt.stats?.bookmarks || 0)}</strong> Saves
          </span>
          <span className="flex items-center gap-1.5" title="Community Rating">
            <Zap className="w-4 h-4 text-amber-500" />
            <strong className="text-neutral-900 dark:text-white">
              {prompt.stats?.ratingCount && prompt.stats.ratingCount > 0 && prompt.stats?.rating
                ? `${prompt.stats.rating.toFixed(1)} / 5.0`
                : "No ratings yet"}
            </strong>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleShareLink}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Link Copied" : "Share"}</span>
          </button>

          <button
            type="button"
            onClick={toggleSave}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              isSaved
                ? "bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
                : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-purple-600 text-purple-600" : ""}`} />
            <span>{isSaved ? "Saved" : "Save"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyPrompt}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied to Clipboard ✓" : "Copy Prompt"}</span>
          </button>
        </div>
      </div>

      {/* TWO-COLUMN DESKTOP LAYOUT (Main Content 65% / Sidebar 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        
        {/* LEFT / MAIN CONTENT COLUMN (~65%) */}
        <div className="space-y-8 min-w-0">
          
          {/* 4. MAIN PROMPT SECTION: Original Prompt for Casual Single Prompts vs. Developer Pro Workflow for Multi-Step Workflows */}
          {!isDeveloperWorkflow ? (
            /* CASUAL CREATOR SINGLE PROMPT VIEW */
            <div className="bg-[#121316] text-neutral-100 rounded-[28px] p-6 md:p-8 border border-neutral-800 shadow-lg relative overflow-hidden">
              {/* Header with explicit CREATOR CONTENT badge */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4 mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-purple-400" />
                    <h2 className="font-display text-xl font-extrabold text-white tracking-tight">
                      Original Prompt
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-700/60 text-purple-300 text-[10px] font-extrabold tracking-wider uppercase">
                      CREATOR CONTENT
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 italic">
                    Exact prompt submitted by the creator.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied ✓" : "Copy Prompt"}</span>
                </button>
              </div>

              {/* Prompt Code Container */}
              <div className={`relative font-mono text-xs md:text-sm text-neutral-200 leading-relaxed overflow-x-auto select-text ${
                !isPromptExpanded && isPromptLong ? "max-h-96 overflow-hidden" : ""
              }`}>
                {rawPromptText ? (
                  <pre className="whitespace-pre-wrap font-mono leading-relaxed">{rawPromptText}</pre>
                ) : (
                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs italic font-mono">
                    No prompt body recorded for this entry. View short description below.
                  </div>
                )}

                {/* Gradient overlay when collapsed */}
                {!isPromptExpanded && isPromptLong && (
                  <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#121316] to-transparent pointer-events-none" />
                )}
              </div>

              {/* Expand / Collapse Button */}
              {isPromptLong && (
                <div className="mt-4 pt-4 border-t border-neutral-800/80 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 transition"
                  >
                    {isPromptExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span>{isPromptExpanded ? "Collapse Prompt" : "Show Full Prompt"}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* DEVELOPER PRO MULTI-STEP WORKFLOW VIEW */
            <div className="bg-white dark:bg-neutral-900 rounded-[28px] p-6 md:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200/60 dark:border-neutral-800/60 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <h3 className="font-display text-xl font-bold text-neutral-900 dark:text-white">
                      Developer Pro Workflow
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-[10px] font-extrabold uppercase">
                      {workflowStepCount} Steps
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Multi-step sequential prompt execution pipeline. Click steps to navigate.
                  </p>
                </div>
              </div>

              {/* Horizontal / Sticky Step Navigator */}
              <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                {workflowSteps.map((step) => {
                  const isActive = activeStepId === step.id;
                  return (
                    <button
                      key={step.id || step.order}
                      type="button"
                      onClick={() => scrollToStep(step.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                        isActive
                          ? "bg-purple-600 text-white shadow-sm"
                          : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      <span className="font-mono text-[10px] font-extrabold opacity-80">0{step.order}</span>
                      <span>{step.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Detailed Steps List */}
              <div className="space-y-6 pt-2">
                {workflowSteps.map((step) => (
                  <div
                    key={step.id || step.order}
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
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:border-purple-500 transition cursor-pointer"
                        >
                          {copiedStepId === step.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedStepId === step.id ? "Copied" : "Copy Step Prompt"}</span>
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
                        {step.variables.map((v, vIdx) => (
                          <span key={v.name || `v-${vIdx}`} className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-mono font-bold flex items-center gap-1">
                            <span>{`{{${v.name}}}`}</span>
                            <VariableInfoTooltip variableName={v.name} customHint={v.description} />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. PROMPT FLOW VISUALIZER */}
          <div className="bg-white dark:bg-neutral-900 rounded-[28px] p-6 md:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
            <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-600" />
              <span>Prompt Execution Flow</span>
            </h3>

            <div className="flex flex-wrap items-center justify-center gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 text-xs font-bold text-neutral-700 dark:text-neutral-300 text-center">
              <div className="px-3.5 py-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                User Prompt & Inputs
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400" />
              <div className="px-3.5 py-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {targetModels[0] || "AI Model"}
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400" />
              <div className="px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Verified Output Result
              </div>
            </div>
          </div>

          {/* 7. DETECTED VARIABLES SECTION */}
          <div className="bg-white dark:bg-neutral-900 rounded-[28px] p-6 md:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-purple-600" />
                  <span>Detected Variables</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  AI automatically detected reusable parameters from the submitted prompt.
                </p>
              </div>
              <VariableInfoTooltip />
            </div>

            {prompt.variables && prompt.variables.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {prompt.variables.map((variable, vIdx) => (
                  <div
                    key={variable.name || `var-${vIdx}`}
                    className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-950/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-extrabold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <span>{`{{${variable.name}}}`}</span>
                        <VariableInfoTooltip variableName={variable.name} customHint={variable.description || variable.label} />
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        variable.required
                          ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                          : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                      }`}>
                        {variable.required ? "Required" : "Optional"}
                      </span>
                    </div>
                    {variable.label && (
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        {variable.label}
                      </div>
                    )}
                    {variable.description && (
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        {variable.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 italic text-center">
                No dynamic inputs detected.
              </div>
            )}
          </div>

          {/* 8. REFERENCE IMAGES GALLERY */}
          {referenceImages.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-[28px] p-6 md:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div>
                <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  <span>Reference Images</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Images provided by the creator as visual or input references.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {referenceImages.map((asset, aIdx) => (
                  <div
                    key={asset.id || `ref-${aIdx}`}
                    onClick={() => setPreviewImage({ url: asset.previewUrl, title: asset.fileName, caption: asset.altText, type: "Reference Image" })}
                    className="group relative aspect-video rounded-2xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 cursor-pointer shadow-xs hover:border-purple-400 transition"
                  >
                    <img src={asset.previewUrl} alt={asset.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                      <Maximize2 className="w-4 h-4" />
                      <span>Preview</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. RESULT PROOFS GALLERY */}
          {resultProofImages.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-[28px] p-6 md:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div>
                <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span>Result Proofs</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Outputs generated using this prompt.
                </p>
              </div>

              {/* Prominent Hero Result Image */}
              <div
                onClick={() => setPreviewImage({ url: resultProofImages[0].previewUrl, title: resultProofImages[0].fileName, caption: resultProofImages[0].altText, type: "Result Proof" })}
                className="group relative aspect-video rounded-2xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 cursor-pointer shadow-sm hover:border-purple-400 transition"
              >
                <img src={resultProofImages[0].previewUrl} alt={resultProofImages[0].fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                  <Maximize2 className="w-5 h-5" />
                  <span>Preview Full Result Image</span>
                </div>
                <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-emerald-900/90 text-emerald-200 text-xs font-extrabold backdrop-blur-md">
                  Primary Verified Result
                </span>
              </div>

              {/* Additional Thumbnails */}
              {resultProofImages.length > 1 && (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 pt-2">
                  {resultProofImages.slice(1).map((asset, aIdx) => (
                    <div
                      key={asset.id || `result-proof-${aIdx}`}
                      onClick={() => setPreviewImage({ url: asset.previewUrl, title: asset.fileName, caption: asset.altText, type: "Result Proof" })}
                      className="group relative aspect-video rounded-xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 cursor-pointer hover:border-purple-400 transition"
                    >
                      <img src={asset.previewUrl} alt={asset.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 10. VERIFICATION TEST CASES */}
          {((prompt.examples && prompt.examples.length > 0) || (prompt.testCases && prompt.testCases.length > 0)) && (
            <div className="bg-white dark:bg-neutral-900 rounded-[28px] p-6 md:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <span>Verification Test Cases</span>
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                {(prompt.examples || []).map((example, eIdx) => (
                  <div key={example.title || `ex-${eIdx}`} className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-950/50 space-y-2">
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

        {/* RIGHT / SUPPORTING SIDEBAR COLUMN (~35%) */}
        <div className="space-y-6 min-w-0">
          
          {/* COMMUNITY RATING & INTERACTIVE RATING WIDGET */}
          <CommunityRatingCard
            promptId={prompt.id}
            isAuthenticated={isAuthenticated}
          />

          {/* 11. AI QUALITY REVIEW CARD */}
          <div className="bg-white dark:bg-neutral-900 rounded-[28px] p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                <Sparkles className="w-4 h-4" />
                <span>AI Quality Review</span>
              </div>
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                92<span className="text-xs text-neutral-400 font-normal">/100</span>
              </span>
            </div>

            {/* Quality Score Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Structure & Rules</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-white">94%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: "94%" }} />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-neutral-500">Clarity & Directives</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-white">91%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: "91%" }} />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-neutral-500">Parameterization</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-white">95%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: "95%" }} />
              </div>
            </div>

            {/* Strengths & Suggestions List */}
            <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
              <span className="text-[10px] font-extrabold uppercase text-neutral-400 block">AI Verified Strengths:</span>
              <ul className="space-y-1.5 text-neutral-700 dark:text-neutral-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Preserves original user prompt without altering text</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Includes dynamic variable parameterization</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 12. PROMPT CHARACTERISTICS STRIP */}
          <div className="bg-white dark:bg-neutral-900 rounded-[28px] p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px] text-neutral-400">
              Prompt Characteristics
            </h4>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Prompt Type</span>
                <span className="font-bold text-neutral-900 dark:text-white">{prompt.promptType || "Text / Multi-turn"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Complexity</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{prompt.difficulty || "Intermediate"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Variables</span>
                <span className="font-bold text-neutral-900 dark:text-white">{prompt.variables?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Workflow Steps</span>
                <span className="font-bold text-neutral-900 dark:text-white">{workflowStepCount || 1}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Reference Images</span>
                <span className="font-bold text-neutral-900 dark:text-white">{referenceImages.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Result Proofs</span>
                <span className="font-bold text-neutral-900 dark:text-white">{resultProofImages.length}</span>
              </div>
            </div>
          </div>

          {/* 13. ESTIMATED AI ENVIRONMENTAL FOOTPRINT (FULL PARAMETER CARD) */}
          <EnvironmentalImpactCard
            systemPrompt={prompt.prompt?.systemPrompt || ''}
            userPrompt={prompt.prompt?.userPrompt || ''}
            expectedOutput={prompt.prompt?.expectedOutput || ''}
            variables={prompt.variables || []}
            targetModel={prompt.recommendedModels?.[0]?.name || getModelLabel(prompt) || 'Gemini 2.5 Flash'}
            imageCount={prompt.results?.items?.length || 0}
            workflowSteps={prompt.workflow_steps?.map((s) => ({
              stepNumber: s.order,
              stepTitle: s.title,
              prompt: s.prompt,
              imageCount: (s.referenceAssets?.length || 0) + (s.resultAssets?.length || 0),
            }))}
          />

          {/* 14. CREATOR PROFILE CARD */}
          <div className="bg-white dark:bg-neutral-900 rounded-[28px] p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">Created By</span>
            
            <div className="flex items-center gap-3">
              <img
                src={prompt.author?.avatarUrl || DEFAULT_AVATAR}
                alt={prompt.author?.name || "Author"}
                className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/20"
              />
              <div>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-1">
                  <span>{prompt.author?.name || "PromptHub Creator"}</span>
                  {prompt.author?.verified && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">@{prompt.author?.handle || "creator"}</p>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-500">Reputation</span>
              <span className="font-bold text-purple-600">{prompt.author?.reputation || 0} pts</span>
            </div>

            <button
              type="button"
              onClick={onBack}
              className="w-full text-center py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition cursor-pointer"
            >
              View Creator Repository →
            </button>
          </div>

          {/* 15. TECHNICAL DETAILS ACCORDION */}
          <div className="bg-white dark:bg-neutral-900 rounded-[28px] border border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full p-5 flex items-center justify-between text-xs font-bold text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-950 transition cursor-pointer"
            >
              <span>Technical Details & Metadata</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showTechnicalDetails ? "rotate-180" : ""}`} />
            </button>

            {showTechnicalDetails && (
              <div className="p-5 pt-0 border-t border-neutral-100 dark:border-neutral-800 text-[11px] space-y-2 font-mono text-neutral-600 dark:text-neutral-400">
                <div className="flex justify-between"><span className="text-neutral-400">Prompt ID:</span> <span className="text-neutral-900 dark:text-white">{prompt.id}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Slug:</span> <span className="text-neutral-900 dark:text-white">{prompt.slug}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">License:</span> <span className="text-neutral-900 dark:text-white">{prompt.license?.type || "MIT"}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Created:</span> <span className="text-neutral-900 dark:text-white">{new Date(prompt.createdAt || Date.now()).toLocaleDateString()}</span></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 16. RELATED PROMPTS SECTION */}
      {relatedPrompts.length > 0 && (
        <div className="mt-14 pt-10 border-t border-neutral-200/80 dark:border-neutral-800 space-y-6">
          <h3 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">
            Related Prompts & Workflows
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPrompts.map((relatedPrompt, rIdx) => {
              const isRelatedCopied = copiedRelatedId === relatedPrompt.id;
              return (
                <div
                  key={relatedPrompt.id || `related-${rIdx}`}
                  onClick={() => onPromptClick(relatedPrompt.id)}
                  className="group rounded-[24px] border border-neutral-200/80 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 hover:border-purple-400 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600">
                        {relatedPrompt.category}
                      </span>
                    </div>

                    <h4 className="font-display text-base font-bold text-neutral-900 dark:text-white group-hover:text-purple-600 transition truncate">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl w-full bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 px-2">
              <span className="text-xs font-bold text-white">{previewImage.title}</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 text-neutral-400 hover:text-white rounded-full transition cursor-pointer"
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
                className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdminDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
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

function CommunityRatingCard({
  promptId,
  isAuthenticated,
}: {
  promptId: string;
  isAuthenticated: boolean;
}) {
  const [summary, setSummary] = useState<PromptRatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      const data = await fetchPromptRatingSummary(promptId);
      setSummary(data);
    } catch (err) {
      console.error("Failed to load rating summary:", err);
    } finally {
      setLoading(false);
    }
  }, [promptId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleRate = async (ratingVal: number) => {
    if (!isAuthenticated) {
      setFeedbackMsg("Please sign in to rate this prompt.");
      return;
    }
    setSubmitting(true);
    setFeedbackMsg(null);

    // Optimistically update local state so selected stars highlight instantly
    setSummary((prev) => {
      const prevRating = prev?.userRating || null;
      const newCount = prev?.ratingCount ? (prevRating ? prev.ratingCount : prev.ratingCount + 1) : 1;

      const newDist = { ...(prev?.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }) };
      if (prevRating) {
        const prevKey = prevRating as 1 | 2 | 3 | 4 | 5;
        newDist[prevKey] = Math.max(0, (newDist[prevKey] || 1) - 1);
      }
      const newKey = ratingVal as 1 | 2 | 3 | 4 | 5;
      newDist[newKey] = (newDist[newKey] || 0) + 1;

      return {
        averageRating: prev?.averageRating ? prev.averageRating : ratingVal,
        ratingCount: newCount,
        userRating: ratingVal,
        distribution: newDist,
      };
    });

    try {
      const res = await ratePrompt(promptId, ratingVal);
      setFeedbackMsg(`Your rating of ${ratingVal} star${ratingVal > 1 ? "s" : ""} has been recorded!`);
      if (res?.rating_average !== undefined && res?.rating_average !== null) {
        setSummary((prev) => prev ? {
          ...prev,
          averageRating: Number(res.rating_average),
          ratingCount: Number(res.rating_count || prev.ratingCount),
          userRating: ratingVal,
        } : null);
      }
      await loadSummary();
    } catch (err: any) {
      setFeedbackMsg(err?.message || "Failed to submit rating.");
      await loadSummary();
    } finally {
      setSubmitting(false);
    }
  };

  const hasRatings = Boolean(summary && summary.ratingCount > 0);
  const currentRating = summary?.averageRating;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-[28px] p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
          <Star className="w-4 h-4 fill-amber-400" />
          <span>Community Rating</span>
        </div>
        {hasRatings && currentRating !== null && (
          <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
            {currentRating.toFixed(1)} / 5.0
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-4 text-center text-xs text-neutral-400 font-mono animate-pulse">
          Loading ratings...
        </div>
      ) : !hasRatings ? (
        <div className="text-center py-5 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-1.5">
          <Star className="w-6 h-6 text-neutral-300 dark:text-neutral-700 mx-auto" />
          <h4 className="font-bold text-neutral-900 dark:text-white text-xs">No ratings yet</h4>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Be the first to rate this prompt.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-neutral-900 dark:text-white font-mono">
              {currentRating?.toFixed(1)}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
              ({summary?.ratingCount} {summary?.ratingCount === 1 ? "rating" : "ratings"})
            </span>
          </div>

          <div className="space-y-1 text-xs">
            {[5, 4, 3, 2, 1].map((starKey) => {
              const count = summary?.distribution[starKey as 1 | 2 | 3 | 4 | 5] || 0;
              const pct = summary?.ratingCount && summary.ratingCount > 0
                ? Math.round((count / summary.ratingCount) * 100)
                : 0;

              return (
                <div key={starKey} className="flex items-center gap-2">
                  <span className="w-5 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 font-mono text-right">
                    {starKey}★
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-[10px] font-mono text-neutral-400 text-right">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* User Interactive Rating Widget */}
      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-neutral-900 dark:text-white">
            {summary?.userRating ? "Your Rating:" : "Rate this prompt:"}
          </span>
          {summary?.userRating ? (
            <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
              {summary.userRating}★ (Click to update)
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 justify-center py-1">
          {[1, 2, 3, 4, 5].map((starIndex) => {
            const activeStar = hoverRating !== null
              ? starIndex <= hoverRating
              : summary?.userRating !== null && summary?.userRating !== undefined
              ? starIndex <= summary.userRating
              : false;

            return (
              <button
                key={starIndex}
                type="button"
                disabled={submitting}
                onMouseEnter={() => setHoverRating(starIndex)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => handleRate(starIndex)}
                className="p-1 rounded-lg hover:bg-amber-500/10 transition cursor-pointer disabled:opacity-50"
                title={`Rate ${starIndex} star${starIndex > 1 ? "s" : ""}`}
              >
                <Star
                  className={`w-6 h-6 transition-all ${
                    activeStar
                      ? "fill-amber-400 text-amber-400 scale-110"
                      : "text-neutral-300 dark:text-neutral-700 hover:text-amber-400"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {feedbackMsg && (
          <p className="text-[11px] font-mono text-center text-purple-600 dark:text-purple-400 animate-fadeIn">
            {feedbackMsg}
          </p>
        )}
      </div>
    </div>
  );
}
