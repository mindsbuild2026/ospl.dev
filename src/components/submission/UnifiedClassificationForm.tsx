/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * UnifiedClassificationForm Component
 * Shared, backend-driven classification & metadata editor used by BOTH:
 * - Casual Creator (rendered under "Classification")
 * - Developer Pro (rendered under "Workflow Metadata")
 *
 * Sourced 100% from Supabase lookup tables (categories, subcategories, aiPlatforms, tags, collections).
 */

import React, { useState } from 'react';
import { ChevronDown, Sparkles, Loader2, Tag, Layers, Database, Cpu } from 'lucide-react';
import { PromptSubmissionPayload } from '../../types';
import { PromptSubmissionLookups } from '../../lib/promptRepository';

export interface UnifiedClassificationFormProps {
  sectionTitle: 'Classification' | 'Workflow Metadata';
  submission: PromptSubmissionPayload;
  lookupData: PromptSubmissionLookups | null;
  fieldErrors: Record<string, string>;
  onUpdateField: (patch: Partial<PromptSubmissionPayload>) => void;
  onGenerateAiDetails?: (promptText?: string) => Promise<void>;
  isAiLoading?: boolean;
}

export function UnifiedClassificationForm({
  sectionTitle,
  submission,
  lookupData,
  fieldErrors,
  onUpdateField,
  onGenerateAiDetails,
  isAiLoading = false,
}: UnifiedClassificationFormProps) {
  const [tagInput, setTagInput] = useState('');

  const categoryOptions = lookupData?.categories || [];
  const availableSubcategories = lookupData?.subcategories.filter(
    (s: any) => (s.categoryId || s.category_id) === submission.category_id
  ) || [];
  const aiPlatforms = lookupData?.aiPlatforms || [];
  const allTags = lookupData?.tags || [];
  const availableCollections = lookupData?.collections.filter(
    (c) => !c.categoryId || c.categoryId === submission.category_id
  ) || [];

  const handleCategoryChange = (categoryId: string) => {
    const defaultSub = lookupData?.subcategories.find((s) => s.categoryId === categoryId);
    const defaultCollection = lookupData?.collections.find((c) => c.categoryId === categoryId);
    
    onUpdateField({
      category_id: categoryId,
      subcategory_id: defaultSub?.id || null,
      collection_ids: defaultCollection ? [defaultCollection.id] : submission.collection_ids,
    });
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

  const handleAddTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed) return;
    
    // Check if tag exists in Supabase lookup by name or slug
    const match = allTags.find(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase() || t.slug?.toLowerCase() === trimmed.toLowerCase()
    );
    const tagId = match ? match.id : trimmed;
    
    if (!submission.tag_ids.includes(tagId)) {
      onUpdateField({ tag_ids: [...submission.tag_ids, tagId] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagId: string) => {
    onUpdateField({ tag_ids: submission.tag_ids.filter((id) => id !== tagId) });
  };

  const handleCollectionChange = (collectionId: string) => {
    if (!collectionId) {
      onUpdateField({ collection_ids: [] });
    } else {
      onUpdateField({ collection_ids: [collectionId] });
    }
  };

  return (
    <div className="rounded-[28px] border border-neutral-200/80 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 space-y-5">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/80 pb-4">
        <div>
          <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {sectionTitle}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Sourced from Supabase catalog & AI recommendation.
          </p>
        </div>

        {onGenerateAiDetails && (
          <button
            type="button"
            onClick={() => onGenerateAiDetails()}
            disabled={isAiLoading}
            className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 px-3 py-1 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            title="Auto-generate AI metadata recommendations"
          >
            {isAiLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
            )}
            <span>Auto-Generate</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Category & Subcategory Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
              <span>Category</span>
              <span className="text-purple-600">*</span>
            </label>
            <div className="relative">
              <select
                value={submission.category_id}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={`w-full appearance-none rounded-xl border bg-neutral-50/50 px-3.5 py-2.5 pr-8 text-xs text-neutral-900 dark:bg-neutral-900/50 dark:text-white outline-none transition focus:border-purple-500 ${
                  fieldErrors.category_id ? 'border-red-400 bg-red-50/30' : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <option value="">Select Category...</option>
                {categoryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            </div>
            {fieldErrors.category_id && <p className="text-[11px] text-red-600">{fieldErrors.category_id}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Subcategory
            </label>
            <div className="relative">
              <select
                value={submission.subcategory_id || ''}
                onChange={(e) => onUpdateField({ subcategory_id: e.target.value || null })}
                disabled={!submission.category_id}
                className="w-full appearance-none rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 pr-8 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-white outline-none disabled:opacity-50"
              >
                <option value="">
                  {!submission.category_id
                    ? 'Select Category First'
                    : availableSubcategories.length === 0
                    ? 'General / Default'
                    : 'Select Subcategory...'}
                </option>
                {availableSubcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            </div>
          </div>
        </div>

        {/* AI Platforms Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
            <span>Target AI Platforms</span>
            <span className="text-purple-600">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {aiPlatforms.map((platform) => {
              const isSelected = submission.ai_platform_ids.includes(platform.id);
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => handleTogglePlatform(platform.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                      : 'border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
                  }`}
                >
                  {platform.name}
                </button>
              );
            })}
          </div>
          {fieldErrors.ai_platform_ids && <p className="text-[11px] text-red-600">{fieldErrors.ai_platform_ids}</p>}
        </div>

        {/* Tags Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
            <span>Tags</span>
            <span className="text-purple-600">*</span>
          </label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag(tagInput);
              }
            }}
            placeholder="Type tag name & press enter..."
            className={`w-full rounded-xl border px-4 py-2.5 text-xs text-neutral-900 dark:text-white bg-neutral-50/50 dark:bg-neutral-900/50 outline-none transition focus:border-purple-500 ${
              fieldErrors.tag_ids ? 'border-red-400 bg-red-50/30' : 'border-neutral-200 dark:border-neutral-800'
            }`}
          />

          {/* Selected Tag Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {submission.tag_ids.map((tagId) => {
              const tagObj = allTags.find((t) => t.id === tagId);
              const label = tagObj ? tagObj.name : tagId;
              return (
                <span
                  key={tagId}
                  className="inline-flex items-center gap-1.5 rounded-md bg-purple-100 dark:bg-purple-950/60 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tagId)}
                    className="hover:text-red-500 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              );
            })}
          </div>

          {/* Recommended Supabase Tag Quick-Add Suggestions */}
          {allTags.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1.5">
                Available Supabase Tags:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {allTags.slice(0, 8).map((t) => {
                  const isAdded = submission.tag_ids.includes(t.id);
                  if (isAdded) return null;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleAddTag(t.name)}
                      className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-900 hover:bg-purple-50 text-[10px] text-neutral-600 dark:text-neutral-400 hover:text-purple-600 transition cursor-pointer border border-neutral-200/60 dark:border-neutral-800"
                    >
                      + {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {fieldErrors.tag_ids && <p className="text-[11px] text-red-600">{fieldErrors.tag_ids}</p>}
        </div>

        {/* Collection & Difficulty Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Collection Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Collection
            </label>
            <div className="relative">
              <select
                value={submission.collection_ids?.[0] || ''}
                onChange={(e) => handleCollectionChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 pr-8 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-white outline-none"
              >
                <option value="">Select Collection (Optional)</option>
                {availableCollections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            </div>
          </div>

          {/* Difficulty Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Target Difficulty
            </label>
            <div className="relative">
              <select
                value={submission.difficulty || 'Intermediate'}
                onChange={(e) => onUpdateField({ difficulty: e.target.value })}
                className="w-full appearance-none rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 pr-8 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-white outline-none"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
