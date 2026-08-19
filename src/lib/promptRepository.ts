/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Data access layer for prompt operations
 */

import {
  Category,
  CollectionDetail,
  CollectionSummary,
  Contributor,
  FilterOptions,
  Prompt,
  PromptCard,
  PromptMode,
  LookupReference,
  LookupAuthor,
  PromptSubmissionPayload,
} from "../types";
import { supabase } from "./supabase";
import { assertNoError } from "./errors";
import { ERROR_MESSAGES } from "./constants";
import { apiCache } from "./cache";
import { validatePromptSubmission } from "./validation";

export type PromptSort =
  | "Trending"
  | "Most Popular"
  | "Most Copied"
  | "Most Viewed"
  | "Highest Rated"
  | "Most Bookmarked"
  | "Most Discussed"
  | "Newest"
  | "Recently Updated"
  | "A-Z";

export interface PromptCardQuery {
  search?: string;
  categorySlug?: string;
  difficulty?: string;
  aiPlatformId?: string;
  categoryId?: string;
  tags?: string[];
  sortBy?: PromptSort | string;
  limit?: number;
  offset?: number;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error(ERROR_MESSAGES.SUPABASE_NOT_CONFIGURED);
  }
  return supabase;
}

/**
 * Database row type definitions for type-safe operations
 */
interface DatabasePromptCardRow {
  id: string;
  slug: string;
  title: string;
  short_description?: string;
  category_name?: string;
  subcategory_name?: string;
  tags?: unknown;
  ai_platforms?: unknown;
  featured?: boolean;
  verified?: boolean;
  community_validated?: boolean;
  views?: number;
  copies?: number;
  bookmarks?: number;
  rating?: number;
  rating_count?: number;
  updated_label?: string;
  updated_at?: string;
  has_proof?: boolean;
  success_rate?: number;
  author_name?: string;
  author_handle?: string;
  author_avatar_url?: string;
  author_verified?: boolean;
  trending_score?: number;
  weekly_growth?: number;
}

interface DatabasePromptDetailRow extends DatabasePromptCardRow {
  description?: string;
  difficulty?: string;
  prompt_type?: string;
  industry?: unknown;
  recommended_models?: unknown;
  techniques?: unknown;
  system_prompt?: string;
  user_prompt?: string;
  expected_output?: string;
  variables?: unknown;
  usage_instructions?: unknown;
  examples?: unknown;
  test_cases?: unknown;
  collections?: unknown;
  related_prompts?: unknown;
  current_version?: string;
  version_history?: unknown;
  meta_title?: string;
  meta_description?: string;
  seo_keywords?: unknown;
  moderation_status?: string;
  license_type?: string;
  commercial_use?: boolean;
  attribution_required?: boolean;
  created_at?: string;
}

/**
 * Safely extract string array from JSON/unknown value
 */
function listFromJson(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

/**
 * Map database row to PromptCard with type safety
 */
function mapPromptCard(row: DatabasePromptCardRow): PromptCard {
  const modeRaw = (row as any).prompt_mode || ((row as any).creator_mode === 'developer' ? 'developer_pro' : 'casual');
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description || "",
    category: row.category_name || "",
    subCategory: row.subcategory_name || "",
    tags: listFromJson(row.tags),
    aiPlatforms: listFromJson(row.ai_platforms),
    featured: Boolean(row.featured),
    verified: Boolean(row.verified),
    communityValidated: Boolean(row.community_validated),
    prompt_mode: modeRaw === 'developer_pro' ? 'developer_pro' : 'casual',
    stats: {
      views: Number(row.views || 0),
      copies: Number(row.copies || 0),
      bookmarks: Number(row.bookmarks || 0),
      rating: Number(row.rating || 0),
      ratingCount: Number(row.rating_count || 0),
      updated: row.updated_label || row.updated_at || "",
    },
    results: {
      hasProof: Boolean(row.has_proof),
      successRate: Number(row.success_rate || 0),
    },
    author: {
      name: row.author_name || "Community",
      handle: row.author_handle || "@community",
      avatarUrl: row.author_avatar_url || "",
      verified: Boolean(row.author_verified),
    },
    engagement: {
      trendingScore: Number(row.trending_score || 0),
      weeklyGrowth: Number(row.weekly_growth || 0),
    },
  };
}

export async function fetchCategories(): Promise<Category[]> {
  const cacheKey = 'categories';
  const cached = apiCache.get<Category[]>(cacheKey);
  if (cached) {
    console.log('[Cache] Returning cached categories');
    return cached;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from("category_summaries")
    .select("*")
    .order("sort_order", { ascending: true });

  assertNoError(error, "Unable to load categories.");
  const result = (data || []).map((row: any) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || "",
    iconName: row.icon_name || "auto_awesome",
    isTrending: Boolean(row.is_trending),
    promptCount: Number(row.prompt_count || 0),
    seoH1: row.seo_h1,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
  }));

  apiCache.set(cacheKey, result, 600); // Cache for 10 minutes
  return result;
}

export async function fetchCollections(): Promise<CollectionSummary[]> {
  const cacheKey = 'collections';
  const cached = apiCache.get<CollectionSummary[]>(cacheKey);
  if (cached) {
    console.log('[Cache] Returning cached collections');
    return cached;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from("collection_summaries")
    .select("*")
    .order("prompt_count", { ascending: false });

  assertNoError(error, "Unable to load collections.");
  const result = (data || []).map((row: any) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || "",
    iconName: row.icon_name,
    promptCount: Number(row.prompt_count || 0),
    categoryId: row.category_id,
  }));

  apiCache.set(cacheKey, result, 600); // Cache for 10 minutes
  return result;
}

export async function fetchCollectionById(
  collectionId: string,
): Promise<CollectionDetail | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("collections")
    .select(
      "id,slug,name,description,icon_name,image_url,category_id,featured,created_at,updated_at",
    )
    .eq("id", collectionId)
    .single();

  assertNoError(error, "Unable to load collection details.");
  if (!data) {
    return null;
  }

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    description: data.description || "",
    iconName: data.icon_name,
    imageUrl: data.image_url || null,
    promptCount: 0,
    categoryId: data.category_id,
    featured: Boolean(data.featured),
    createdAt: data.created_at || undefined,
    updatedAt: data.updated_at || undefined,
  };
}

export async function fetchPromptsByCollectionId(
  collectionId: string,
): Promise<PromptCard[]> {
  const client = requireSupabase();
  const { data: promptIds, error: idError } = await client
    .from("collection_prompts")
    .select("prompt_id")
    .eq("collection_id", collectionId);

  assertNoError(idError, "Unable to load collection prompts.");

  const ids = (promptIds || [])
    .map((row: any) => row.prompt_id)
    .filter(Boolean);
  if (ids.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from("prompt_card_rows")
    .select("*")
    .in("id", ids)
    .order("trending_score", { ascending: false })
    .order("updated_at", { ascending: false });

  assertNoError(error, "Unable to load prompts for collection.");
  return (data || []).map(mapPromptCard);
}

export async function fetchPromptCardsByIds(
  ids: string[],
): Promise<PromptCard[]> {
  if (ids.length === 0) {
    return [];
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from("prompt_card_rows")
    .select("*")
    .in("id", ids)
    .order("trending_score", { ascending: false });

  assertNoError(error, "Unable to load saved prompts.");
  return (data || []).map(mapPromptCard);
}

export async function fetchTopContributors(limit = 4): Promise<Contributor[]> {
  const cacheKey = `contributors_${limit}`;
  const cached = apiCache.get<Contributor[]>(cacheKey);
  if (cached) {
    console.log('[Cache] Returning cached contributors');
    return cached;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from("author_summaries")
    .select("*")
    .order("reputation", { ascending: false })
    .limit(limit);

  assertNoError(error, "Unable to load contributors.");
  const result = (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    handle: row.handle,
    avatarUrl: row.avatar_url,
    promptsCount: Number(row.prompt_count || 0),
    reputation: Number(row.reputation || 0),
    verified: Boolean(row.verified),
  }));

  apiCache.set(cacheKey, result, 600); // Cache for 10 minutes
  return result;
}

export async function fetchFilterOptions(): Promise<FilterOptions> {
  const cacheKey = 'filterOptions';
  const cached = apiCache.get<FilterOptions>(cacheKey);
  if (cached) {
    console.log('[Cache] Returning cached filter options');
    return cached;
  }

  const client = requireSupabase();
  const [
    { data: tags, error: tagsError },
    { data: platforms, error: platformsError },
    { data: meta, error: metaError },
  ] = await Promise.all([
    client
      .from("tags")
      .select("name")
      .order("usage_count", { ascending: false })
      .limit(30),
    client
      .from("ai_platforms")
      .select("name")
      .order("name", { ascending: true }),
    client.from("prompt_filter_options").select("*").single(),
  ]);

  assertNoError(tagsError, "Unable to load tags.");
  assertNoError(platformsError, "Unable to load AI platforms.");
  assertNoError(metaError, "Unable to load filter metadata.");

  const result: FilterOptions = {
    tags: (tags || []).map((tag: any) => tag.name),
    aiPlatforms: (platforms || []).map((platform: any) => platform.name),
    promptTypes: meta?.prompt_types || [],
    difficulties: meta?.difficulties || [],
  };

  apiCache.set(cacheKey, result, 600); // Cache for 10 minutes
  return result;
}

export interface PromptSubmissionLookups {
  categories: LookupReference[];
  subcategories: LookupReference[];
  promptTypes: LookupReference[];
  aiPlatforms: LookupReference[];
  tags: LookupReference[];
  collections: LookupReference[];
  industries: LookupReference[];
  promptTechniques: LookupReference[];
  authors: LookupAuthor[];
}

export async function fetchPromptSubmissionLookups(): Promise<PromptSubmissionLookups> {
  const client = requireSupabase();
  const [
    { data: categories, error: categoriesError },
    { data: subcategories, error: subcategoriesError },
    { data: promptTypes, error: promptTypesError },
    { data: aiPlatforms, error: aiPlatformsError },
    { data: tags, error: tagsError },
    { data: collections, error: collectionsError },
    { data: industries, error: industriesError },
    { data: promptTechniques, error: promptTechniquesError },
    { data: authors, error: authorsError },
  ] = await Promise.all([
    client
      .from("categories")
      .select("id,slug,name,description")
      .order("name", { ascending: true }),
    client
      .from("subcategories")
      .select("id,category_id,slug,name,description")
      .order("name", { ascending: true }),
    client
      .from("prompt_types")
      .select("id,slug,name,description")
      .order("name", { ascending: true }),
    client
      .from("ai_platforms")
      .select("id,slug,name,description")
      .order("sort_order", { ascending: true }),
    client
      .from("tags")
      .select("id,slug,name,description")
      .order("usage_count", { ascending: false })
      .limit(100),
    client
      .from("collections")
      .select("id,slug,name,description,category_id")
      .order("name", { ascending: true }),
    client
      .from("industries")
      .select("id,slug,name,description")
      .order("name", { ascending: true }),
    client
      .from("prompt_techniques")
      .select("id,slug,name,description")
      .order("name", { ascending: true }),
    client
      .from("authors")
      .select("id,handle,name,avatar_url,verified,reputation")
      .order("name", { ascending: true }),
  ]);

  const defaultCategories: LookupReference[] = [
    { id: 'cat_creative', slug: 'creative', name: 'Creative' },
    { id: 'cat_coding', slug: 'coding', name: 'Coding' },
    { id: 'cat_productivity', slug: 'productivity', name: 'Productivity' },
  ];

  const defaultSubcategories: LookupReference[] = [
    { id: 'sub_coding_frontend', categoryId: 'cat_coding', slug: 'frontend', name: 'Frontend & UI' },
    { id: 'sub_coding_backend', categoryId: 'cat_coding', slug: 'backend', name: 'Backend & APIs' },
    { id: 'sub_coding_devops', categoryId: 'cat_coding', slug: 'devops', name: 'DevOps & Architecture' },
    { id: 'sub_creative_writing', categoryId: 'cat_creative', slug: 'writing', name: 'Creative Writing' },
    { id: 'sub_creative_copywriting', categoryId: 'cat_creative', slug: 'copywriting', name: 'Copywriting & Marketing' },
    { id: 'sub_productivity_automation', categoryId: 'cat_productivity', slug: 'automation', name: 'Workflow Automation' },
  ];

  const defaultPlatforms: LookupReference[] = [
    { id: 'plat_gpt4', slug: 'gpt-4', name: 'GPT-4' },
    { id: 'plat_claude3', slug: 'claude-3', name: 'Claude 3' },
    { id: 'plat_gemini', slug: 'gemini', name: 'Gemini' },
    { id: 'plat_mistral', slug: 'mistral', name: 'Mistral' },
  ];

  const mappedSubcategories: LookupReference[] = (subcategories && subcategories.length > 0)
    ? subcategories.map((s: any) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        description: s.description,
        categoryId: s.category_id || s.categoryId,
      }))
    : defaultSubcategories;

  return {
    categories: (categories && categories.length > 0) ? categories : defaultCategories,
    subcategories: mappedSubcategories,
    promptTypes: promptTypes || [],
    aiPlatforms: (aiPlatforms && aiPlatforms.length > 0) ? aiPlatforms : defaultPlatforms,
    tags: tags || [],
    collections: collections || [],
    industries: industries || [],
    promptTechniques: promptTechniques || [],
    authors: authors || [],
  };
}

export async function createPromptFromPayload(
  prompt: PromptSubmissionPayload,
): Promise<string> {
  // STRICT REPOSITORY GUARD: Abort database insertion if form validation errors exist
  const errors = validatePromptSubmission(prompt);
  if (errors.length > 0) {
    const errorMap = errors.map((e) => `${e.field}: ${e.message}`).join('; ');
    console.error('[createPromptFromPayload] Aborted database insertion due to validation errors:', errorMap);
    throw new Error(`Cannot save prompt to backend: Form validation errors present (${errorMap})`);
  }

  const client = requireSupabase();

  const rawTitle = prompt.title || 'prompt';
  const baseSlug = (prompt.slug || rawTitle)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'prompt';

  let uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

  const effectiveMode: PromptMode = prompt.prompt_mode || (prompt.creator_mode === 'developer' ? 'developer_pro' : 'casual');
  const isDeveloperPro = effectiveMode === 'developer_pro';

  const structuredOutputJson = JSON.stringify({
    custom_schema: prompt.structured_output_schema || null,
    workflow_steps: isDeveloperPro ? (prompt.workflow_steps || []) : [],
    proof_items: prompt.proof_items || [],
    assets: prompt.assets || [],
  });

  const workflowSteps = isDeveloperPro ? (prompt.workflow_steps || []) : [];
  const combinedStepsPrompt = workflowSteps.length > 0
    ? workflowSteps.map((s) => `### Step ${s.order}: ${s.title || 'Step'}\n${s.prompt || ''}`).join('\n\n')
    : '';

  const finalUserPrompt = (
    prompt.user_prompt?.trim() ||
    prompt.system_prompt?.trim() ||
    workflowSteps[0]?.prompt?.trim() ||
    combinedStepsPrompt ||
    ''
  );

  const finalSystemPrompt = (
    prompt.system_prompt?.trim() ||
    prompt.user_prompt?.trim() ||
    combinedStepsPrompt ||
    ''
  );

  let promptInsert = await client
    .from("prompts")
    .insert({
      slug: uniqueSlug,
      title: prompt.title,
      short_description: prompt.short_description,
      description: prompt.description,
      category_id: prompt.category_id,
      subcategory_id: prompt.subcategory_id || null,
      author_id: prompt.author_id,
      prompt_type_id: prompt.prompt_type_id || null,
      difficulty: prompt.difficulty || null,
      license_type: prompt.license_type,
      commercial_use: prompt.commercial_use,
      attribution_required: prompt.attribution_required,
      featured: prompt.featured,
      verified: prompt.verified,
      community_validated: prompt.community_validated,
      current_version: prompt.current_version,
      meta_title: prompt.meta_title || null,
      meta_description: prompt.meta_description || null,
      seo_keywords: prompt.seo_keywords || [],
      moderation_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      system_prompt: finalSystemPrompt,
      user_prompt: finalUserPrompt,
      expected_output: prompt.expected_output || null,
      prompt_mode: effectiveMode,
      creator_mode: prompt.creator_mode || (isDeveloperPro ? "developer" : "casual"),
      pipeline_type: prompt.pipeline_type || "single_shot",
      temperature: prompt.temperature ?? 0.70,
      max_tokens: prompt.max_tokens ?? 2048,
      output_format: prompt.output_format || "markdown",
      structured_output_schema: structuredOutputJson,
    })
    .select("id")
    .single();

  // Retry with secondary unique suffix if slug collision error occurs
  if (promptInsert.error && promptInsert.error.message?.includes('prompts_slug_key')) {
    uniqueSlug = `${baseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    promptInsert = await client
      .from("prompts")
      .insert({
        slug: uniqueSlug,
        title: prompt.title,
        short_description: prompt.short_description,
        description: prompt.description,
        category_id: prompt.category_id,
        subcategory_id: prompt.subcategory_id || null,
        author_id: prompt.author_id,
        prompt_type_id: prompt.prompt_type_id || null,
        difficulty: prompt.difficulty || null,
        license_type: prompt.license_type,
        commercial_use: prompt.commercial_use,
        attribution_required: prompt.attribution_required,
        featured: prompt.featured,
        verified: prompt.verified,
        community_validated: prompt.community_validated,
        current_version: prompt.current_version,
        meta_title: prompt.meta_title || null,
        meta_description: prompt.meta_description || null,
        seo_keywords: prompt.seo_keywords || [],
        moderation_status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        system_prompt: finalSystemPrompt,
        user_prompt: finalUserPrompt,
        expected_output: prompt.expected_output || null,
        prompt_mode: effectiveMode,
        creator_mode: prompt.creator_mode || (isDeveloperPro ? "developer" : "casual"),
        pipeline_type: prompt.pipeline_type || "single_shot",
        temperature: prompt.temperature ?? 0.70,
        max_tokens: prompt.max_tokens ?? 2048,
        output_format: prompt.output_format || "markdown",
        structured_output_schema: structuredOutputJson,
      })
      .select("id")
      .single();
  }

  assertNoError(promptInsert.error, "Unable to create prompt record.");

  const promptId = promptInsert.data?.id;
  if (!promptId) {
    throw new Error("Missing prompt ID after create.");
  }

  const insertPairs = async <T extends object>(table: string, rows: T[]) => {
    if (!rows || rows.length === 0) return;
    const { error } = await client.from(table).insert(rows as unknown);
    if (error) {
      if (error.message?.includes('row-level security') || error.code === '42501') {
        console.warn(`[PromptRepository] Gracefully handling RLS policy restriction for optional table '${table}':`, error.message);
        return;
      }
      assertNoError(error, `Unable to create ${table} rows.`);
    }
  };

  // NOTE: prompt_metrics row is now automatically created by database trigger
  // on INSERT to prompts table, so manual insertion is no longer needed

  await insertPairs(
    "prompt_tags",
    prompt.tag_ids.map((tag_id) => ({ prompt_id: promptId, tag_id })),
  );
  await insertPairs(
    "prompt_ai_platforms",
    prompt.ai_platform_ids.map((ai_platform_id) => ({
      prompt_id: promptId,
      ai_platform_id,
    })),
  );
  await insertPairs(
    "prompt_collections",
    prompt.collection_ids.map((collection_id) => ({
      prompt_id: promptId,
      collection_id,
    })),
  );
  await insertPairs(
    "prompt_industries",
    prompt.industry_ids.map((industry_id) => ({
      prompt_id: promptId,
      industry_id,
    })),
  );
  await insertPairs(
    "prompt_techniques_map",
    prompt.technique_ids.map((technique_id) => ({
      prompt_id: promptId,
      technique_id,
    })),
  );

  await insertPairs(
    "prompt_recommended_models",
    prompt.recommended_models.map((model, index) => ({
      prompt_id: promptId,
      name: model.name,
      provider: model.provider,
      sort_order: index + 1,
    })),
  );
  await insertPairs(
    "prompt_variables",
    prompt.variables.map((variable, index) => ({
      prompt_id: promptId,
      name: variable.name,
      label: variable.label,
      required: variable.required,
      description: variable.description,
      variable_type: variable.variable_type || 'string',
      options: variable.options || [],
      sort_order: index + 1,
    })),
  );
  await insertPairs(
    "prompt_usage_instructions",
    prompt.usage_instructions.map((instruction, index) => ({
      prompt_id: promptId,
      instruction,
      sort_order: index + 1,
    })),
  );
  await insertPairs(
    "prompt_examples",
    prompt.examples.map((example, index) => ({
      prompt_id: promptId,
      title: example.title,
      input: example.input,
      output: example.output,
      sort_order: index + 1,
    })),
  );
  await insertPairs(
    "prompt_test_cases",
    prompt.test_cases.map((testCase, index) => ({
      prompt_id: promptId,
      name: testCase.name,
      input: testCase.input,
      expected_result: testCase.expectedResult,
      tested_model: testCase.testedModel || null,
      sort_order: index + 1,
    })),
  );
  await insertPairs(
    "prompt_proof_items",
    prompt.proof_items.map((proof, index) => ({
      prompt_id: promptId,
      type: proof.type,
      title: proof.title,
      url: proof.url || null,
      thumbnail_url: proof.thumbnailUrl || null,
      content: proof.content || null,
      description: proof.description || null,
      duration_seconds: proof.durationSeconds || null,
      sort_order: index + 1,
    })),
  );
  await insertPairs(
    "prompt_version_history",
    prompt.version_history.map((version, index) => ({
      prompt_id: promptId,
      version: version.version,
      released_at: version.released_at,
      changes: version.changes,
      sort_order: index + 1,
    })),
  );

  if (isDeveloperPro && prompt.workflow_steps && prompt.workflow_steps.length > 0) {
    await insertPairs(
      "prompt_workflow_steps",
      prompt.workflow_steps.map((step, index) => ({
        prompt_id: promptId,
        step_order: step.order || index + 1,
        title: step.title || `Step ${index + 1}`,
        prompt: step.prompt || '',
        description: step.description || '',
        analysis_state: step.analysisState || 'valid',
        validation_status: step.validationStatus || 'pass',
        quality_score: step.qualityScore ?? 90,
        validation_issues: step.validationIssues || [],
        variables: step.variables || [],
        reference_assets: step.referenceAssets || [],
        result_assets: step.resultAssets || [],
      }))
    );
  }

  // Insert Environmental Footprint Estimate if calculated
  if (prompt.environmental_estimate) {
    const env = prompt.environmental_estimate;
    await insertPairs("prompt_environmental_metrics", [
      {
        prompt_id: promptId,
        estimated_input_tokens: env.estimatedInputTokens,
        estimated_output_tokens: env.estimatedOutputTokens,
        image_count: env.imageCount,
        target_model: env.targetModel,
        target_provider: env.targetProvider,
        energy_kwh: env.energyKwh,
        water_ml_min: env.waterMlMin,
        water_ml_max: env.waterMlMax,
        co2_grams: env.co2Grams,
        confidence_score: env.confidenceScore,
        methodology_version: env.methodologyVersion,
        calculated_at: env.calculatedAt,
      },
    ]);
  }

  return promptId;
}

export async function fetchPromptCards(
  query: PromptCardQuery = {},
): Promise<PromptCard[]> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("search_prompt_cards", {
  p_search: query.search || "",
  p_category_id: query.categoryId || null,
  p_difficulty: query.difficulty || null,
  p_ai_platform_id: query.aiPlatformId || null,
  p_tags: query.tags && query.tags.length > 0 ? query.tags : null,
  p_sort_by: query.sortBy || "trending",
  p_limit: query.limit || 60,
  p_offset: query.offset || 0,
});

  assertNoError(error, "Unable to load prompts.");
  return (data || []).map(mapPromptCard);
}

export async function fetchPromptDetail(
  idOrSlug: string,
): Promise<Prompt | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("prompt_details")
    .select("*")
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .maybeSingle();

  assertNoError(error, "Unable to load prompt details.");
  if (!data) return null;
  const card = mapPromptCard(data);

  const rawMode = data.prompt_mode || (data.creator_mode === 'developer' ? 'developer_pro' : 'casual');
  const promptMode: PromptMode = rawMode === 'developer_pro' ? 'developer_pro' : 'casual';

  let parsedWorkflowSteps: any[] | undefined = undefined;

  if (promptMode === 'developer_pro') {
    // 1. Try reading workflow_steps from structured_output_schema JSON payload
    if (data.structured_output_schema) {
      try {
        const parsed = JSON.parse(data.structured_output_schema);
        if (Array.isArray(parsed?.workflow_steps) && parsed.workflow_steps.length > 0) {
          parsedWorkflowSteps = parsed.workflow_steps;
        }
      } catch {
        // Ignore non-JSON schema strings
      }
    }

    // 2. Try fetching from relational `prompt_workflow_steps` table in Supabase if JSON payload was empty
    if (!parsedWorkflowSteps || parsedWorkflowSteps.length === 0) {
      try {
        const { data: stepRows, error: stepErr } = await client
          .from("prompt_workflow_steps")
          .select("*")
          .eq("prompt_id", data.id)
          .order("step_order", { ascending: true });

        if (!stepErr && stepRows && stepRows.length > 0) {
          parsedWorkflowSteps = stepRows.map((row: any, idx: number) => ({
            id: row.id || `step_${row.step_order || idx + 1}`,
            order: Number(row.step_order || row.order || idx + 1),
            title: row.title || `Step ${row.step_order || idx + 1}`,
            prompt: row.prompt || row.prompt_text || "",
            description: row.description || "",
            analysisState: row.analysis_state || "valid",
            validationStatus: row.validation_status || "pass",
            qualityScore: row.quality_score ? Number(row.quality_score) : 90,
            validationIssues: Array.isArray(row.validation_issues) ? row.validation_issues : [],
            variables: Array.isArray(row.variables) ? row.variables : [],
            referenceAssets: Array.isArray(row.reference_assets) ? row.reference_assets : [],
            resultAssets: Array.isArray(row.result_assets) ? row.result_assets : [],
          }));
        }
      } catch {
        // Ignore missing optional relational table
      }
    }

    // 3. Guarantee ascending step_order sorting for multi-step workflows
    if (parsedWorkflowSteps && Array.isArray(parsedWorkflowSteps)) {
      const validSteps = parsedWorkflowSteps.filter((s: any) => s && (s.prompt?.trim() || s.title?.trim()));
      if (validSteps.length > 0) {
        parsedWorkflowSteps = validSteps.sort((a: any, b: any) => {
          const orderA = Number(a.order ?? a.step_order ?? 0);
          const orderB = Number(b.order ?? b.step_order ?? 0);
          return orderA - orderB;
        });
      } else {
        parsedWorkflowSteps = undefined;
      }
    } else {
      parsedWorkflowSteps = undefined;
    }
  }

  const combinedStepPrompts = (parsedWorkflowSteps || [])
    .map((s: any) => s.prompt || s.description || '')
    .filter(Boolean)
    .join('\n\n');

  const resolvedUserPrompt = (
    data.user_prompt?.trim() ||
    data.system_prompt?.trim() ||
    combinedStepPrompts ||
    data.description ||
    ""
  );

  const resolvedSystemPrompt = (
    data.system_prompt?.trim() ||
    data.user_prompt?.trim() ||
    combinedStepPrompts ||
    ""
  );

  return {
    ...card,
    prompt_mode: promptMode,
    workflow_steps: parsedWorkflowSteps,
    description: data.description || card.shortDescription,
    difficulty: data.difficulty || "",
    promptType: data.prompt_type || "",
    industry: listFromJson(data.industry),
    recommendedModels: Array.isArray(data.recommended_models)
      ? data.recommended_models
      : [],
    promptEngineeringTechniques: listFromJson(
      data.prompt_engineering_techniques,
    ),
    prompt: {
      systemPrompt: resolvedSystemPrompt,
      userPrompt: resolvedUserPrompt,
      expectedOutput: data.expected_output || "",
    },
    variables: Array.isArray(data.variables) ? data.variables : [],
    usageInstructions: listFromJson(data.usage_instructions),
    examples: Array.isArray(data.examples) ? data.examples : [],
    testCases: Array.isArray(data.test_cases) ? data.test_cases : [],
    results: {
      hasProof: Boolean(data.has_proof),
      successRate: Number(data.success_rate || 0),
      testedModels: listFromJson(data.tested_models),
      items: Array.isArray(data.proof_results) ? data.proof_results : [],
    },
    author: {
      id: data.author_id || "",
      name: data.author_name || "Community",
      handle: data.author_handle || "@community",
      avatarUrl: data.author_avatar_url || "",
      bio: data.author_bio || "",
      website: data.author_website || undefined,
      github: data.author_github || undefined,
      verified: Boolean(data.author_verified),
      reputation: Number(data.author_reputation || 0),
      totalPrompts: Number(data.author_total_prompts || 0),
    },
    stats: {
      views: Number(data.views || 0),
      copies: Number(data.copies || 0),
      likes: Number(data.likes || 0),
      bookmarks: Number(data.bookmarks || 0),
      shares: Number(data.shares || 0),
      comments: Number(data.comments || 0),
      rating: Number(data.rating || 0),
      ratingCount: Number(data.rating_count || 0),
      downloads: Number(data.downloads || 0),
      updated: data.updated_label || data.updated_at || "",
    },
    collections: Array.isArray(data.collections) ? data.collections : [],
    relatedPrompts: Array.isArray(data.related_prompts)
      ? data.related_prompts
      : [],
    version: {
      current: data.current_version || "1.0.0",
      history: Array.isArray(data.version_history) ? data.version_history : [],
    },
    seo: {
      metaTitle: data.meta_title || card.title,
      metaDescription: data.meta_description || card.shortDescription,
      keywords: listFromJson(data.seo_keywords),
    },
    moderation: {
      status: data.moderation_status || "pending",
      reviewedBy: data.reviewed_by || "",
      reviewedAt: data.reviewed_at || "",
    },
    license: {
      type: data.license_type || "MIT",
      commercialUse: Boolean(data.commercial_use),
      attributionRequired: Boolean(data.attribution_required),
    },
    createdAt: data.created_at || "",
    updatedAt: data.updated_at || "",
    engagement: {
      trendingScore: Number(data.trending_score || 0),
      popularityRank: Number(data.popularity_rank || 0),
      weeklyGrowth: Number(data.weekly_growth || 0),
    },
  };
}

export async function incrementPromptView(promptId: string) {
  const client = requireSupabase();
  const { error } = await client.rpc("increment_prompt_view", {
    _prompt_id: promptId,
  });
  assertNoError(error, "Unable to update prompt view analytics.");
}

export async function updatePromptBookmark(promptId: string, delta: 1 | -1) {
  const client = requireSupabase();
  const { error } = await client.rpc("increment_prompt_bookmark", {
    _prompt_id: promptId,
    delta_input: delta,
  });
  assertNoError(error, "Unable to update prompt bookmark analytics.");
}

export async function incrementPromptCopy(promptId: string) {
  const client = requireSupabase();
  const { error } = await client.rpc("increment_prompt_copy", {
    _prompt_id: promptId,
  });
  assertNoError(error, "Unable to update prompt copy analytics.");
}

export async function ratePrompt(promptId: string, rating: number) {
  const client = requireSupabase();
  const { error } = await client.rpc("rate_prompt", {
    prompt_id: promptId,
    rating_input: rating,
  });
  assertNoError(error, "Unable to submit prompt rating.");
}

export async function updateAuthorReputation(userId: string) {
  const client = requireSupabase();
  const { error } = await client.rpc("update_author_reputation", {
    user_id_input: userId,
  });
  assertNoError(error, "Unable to update author reputation.");
}
