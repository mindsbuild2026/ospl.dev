/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PromptStats {
  views: number;
  copies: number;
  likes: number;
  bookmarks: number;
  shares: number;
  comments: number;
  rating: number;
  ratingCount: number;
  downloads: number;
  updated: string;
}

export interface PromptAuthor {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  bio: string;
  website?: string;
  github?: string;
  verified: boolean;
  reputation: number;
  totalPrompts: number;
}

export interface RecommendedModel {
  name: string;
  provider: string;
}

export interface PromptVariable {
  name: string;
  label: string;
  required: boolean;
  description: string;
}

export interface PromptExample {
  title: string;
  input: string;
  output: string;
}

export interface PromptTestCase {
  name: string;
  input: string;
  result: string;
  expectedResult?: string;
  testedModel: string;
}

export interface ProofResultItem {
  id: string;
  type: 'image' | 'video' | 'text';
  title: string;
  thumbnailUrl?: string;
  url?: string;
  content?: string;
  description?: string;
  duration?: number;
}

export interface PromptResults {
  hasProof: boolean;
  successRate: number;
  testedModels: string[];
  items: ProofResultItem[];
}

export interface PromptCollection {
  id: string;
  name: string;
}

export interface RelatedPromptReference {
  id: string;
  title: string;
}

export interface PromptVersionHistory {
  version: string;
  releasedAt: string;
  changes: string[];
}

export interface PromptVersion {
  current: string;
  history: PromptVersionHistory[];
}

export interface SeoMetadata {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
}

export interface ModerationInfo {
  status: 'approved' | 'pending' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface RejectedPrompt {
  id: string;
  originalPromptId: string;
  authorId: string;
  title: string;
  shortDescription: string;
  description?: string;
  categoryId?: string;
  promptTypeId?: string;
  systemPrompt: string;
  userPrompt: string;
  expectedOutput?: string;
  rejectionReason: string;
  rejectedAt: string;
  rejectedBy: string;
  originalCreatedAt: string;
  author: Pick<PromptAuthor, 'name' | 'handle' | 'avatarUrl'>;
  rejectedByAuthor: Pick<PromptAuthor, 'name' | 'handle'>;
}

export interface ModerationLog {
  id: string;
  promptId?: string;
  action: 'submitted' | 'approved' | 'rejected' | 'restored' | 'deleted';
  oldStatus?: string;
  newStatus?: string;
  reason?: string;
  performedBy: string;
  performedAt: string;
  metadata?: Record<string, unknown>;
}

export interface ModerationQueueItem extends PromptCard {
  moderation: ModerationInfo;
  submittedAt: string;
}

export interface RejectionReasonOption {
  value: string;
  label: string;
  description?: string;
}

export interface PromptLicense {
  type: string;
  commercialUse: boolean;
  attributionRequired: boolean;
}

export interface PromptEngagement {
  trendingScore: number;
  popularityRank: number;
  weeklyGrowth: number;
}

export interface PromptContent {
  systemPrompt: string;
  userPrompt: string;
  expectedOutput: string;
}

export type PromptMode = 'casual' | 'developer_pro';

export interface PromptCard {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  subCategory: string;
  tags: string[];
  aiPlatforms: string[];
  featured: boolean;
  verified: boolean;
  communityValidated: boolean;
  stats: Pick<PromptStats, 'views' | 'copies' | 'bookmarks' | 'rating' | 'ratingCount' | 'updated'>;
  results: Pick<PromptResults, 'hasProof' | 'successRate'>;
  author: Pick<PromptAuthor, 'name' | 'handle' | 'avatarUrl' | 'verified'>;
  engagement: Pick<PromptEngagement, 'trendingScore' | 'weeklyGrowth'>;
  prompt_mode?: PromptMode;
  systemPrompt?: string;
  resultImageUrl?: string;
  workflowStepCount?: number;
  creatorMode?: 'casual' | 'developer';
}

export interface Prompt extends PromptCard {
  prompt_mode: PromptMode;
  description: string;
  difficulty: string;
  promptType: string;
  industry: string[];
  recommendedModels: RecommendedModel[];
  promptEngineeringTechniques: string[];
  prompt: PromptContent;
  variables: PromptVariable[];
  usageInstructions: string[];
  examples: PromptExample[];
  testCases: PromptTestCase[];
  results: PromptResults;
  author: PromptAuthor;
  stats: PromptStats;
  collections: PromptCollection[];
  relatedPrompts: RelatedPromptReference[];
  version: PromptVersion;
  seo: SeoMetadata;
  moderation: ModerationInfo;
  license: PromptLicense;
  workflow_steps?: PromptWorkflowStep[];
  createdAt: string;
  updatedAt: string;
  engagement: PromptEngagement;
}

export interface Contributor {
  id?: string;
  handle: string;
  name: string;
  avatarUrl: string;
  promptsCount: number;
  reputation?: number;
  verified?: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconName: string;
  isTrending?: boolean;
  promptCount?: number;
  seoH1?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface CollectionSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconName?: string;
  promptCount: number;
  categoryId?: string;
}

export interface CollectionDetail extends CollectionSummary {
  imageUrl?: string | null;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LookupReference {
  id: string;
  slug: string;
  name: string;
  description?: string;
  categoryId?: string;
}

export interface LookupAuthor {
  id: string;
  handle: string;
  name: string;
  avatar_url?: string;
  verified?: boolean;
  is_admin?: boolean;
  reputation: number;
  bio?: string | null;
  website?: string | null;
  github?: string | null;
  user_id?: string;
}

export interface PromptSubmissionModel {
  name: string;
  provider: string;
}

export interface PromptSubmissionVariable {
  name: string;
  label: string;
  required: boolean;
  description: string;
  variable_type?: 'string' | 'select' | 'number' | 'boolean';
  options?: string[];
}

export interface PromptSubmissionExample {
  title: string;
  input: string;
  output: string;
}

export interface PromptSubmissionTestCase {
  name: string;
  input: string;
  expectedResult: string;
  testedModel?: string;
}

export interface PromptSubmissionProofItem {
  type: 'image' | 'video' | 'text';
  title: string;
  url?: string;
  thumbnailUrl?: string;
  content?: string;
  description?: string;
  durationSeconds?: number;
}

export interface PromptSubmissionAsset {
  id: string;
  promptId?: string;
  assetType?: string;
  createdAt?: string;
  file?: File;
  previewUrl: string;
  storagePath?: string;
  fileName: string;
  mimeType?: string;
  fileSizeBytes?: number;
  width?: number;
  height?: number;
  altText?: string;
  uploadState?: 'idle' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

export type StepAnalysisState = 'idle' | 'loading' | 'valid' | 'invalid' | 'error' | 'stale' | 'warning';

export interface PromptWorkflowStep {
  id: string; // Stable step ID
  order: number; // 1-based display order (1..10)
  title: string;
  prompt: string;
  description?: string;
  analysisState: StepAnalysisState;
  validationStatus?: 'pass' | 'warning' | 'fail';
  qualityScore?: number;
  validationIssues?: string[];
  variables?: PromptSubmissionVariable[];
  assets?: PromptSubmissionAsset[];
  referenceAssets?: PromptSubmissionAsset[]; // Reference mockups / inputs sent to Gemini
  resultAssets?: PromptSubmissionAsset[]; // Result / proof images kept for visual verification
  temperature?: number;
  max_tokens?: number;
  output_format?: 'markdown' | 'json' | 'yaml' | 'xml' | 'custom';
  createdAt?: string;
  updatedAt?: string;
}

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
  stepBreakdown?: any[];
}

export interface PromptSubmissionPayload {
  slug: string;
  title: string;
  short_description: string;
  description: string;
  category_id: string;
  subcategory_id?: string | null;
  author_id: string;
  prompt_type_id?: string | null;
  difficulty?: string;
  license_type: string;
  commercial_use: boolean;
  attribution_required: boolean;
  featured: boolean;
  verified: boolean;
  community_validated: boolean;
  current_version: string;
  meta_title?: string | null;
  meta_description?: string | null;
  seo_keywords?: string[];
  system_prompt: string;
  user_prompt: string;
  expected_output?: string | null;
  tag_ids: string[];
  ai_platform_ids: string[];
  collection_ids: string[];
  industry_ids: string[];
  technique_ids: string[];
  recommended_models: PromptSubmissionModel[];
  variables: PromptSubmissionVariable[];
  usage_instructions: string[];
  examples: PromptSubmissionExample[];
  test_cases: PromptSubmissionTestCase[];
  proof_items: PromptSubmissionProofItem[];
  version_history: {
    version: string;
    released_at: string;
    changes: string[];
  }[];
  // Prompt Mode & Creator Mode Configuration
  prompt_mode: PromptMode;
  creator_mode?: 'casual' | 'developer';
  workflow_steps?: PromptWorkflowStep[];
  pipeline_type?: 'single_shot' | 'multi_prompt_chain';
  temperature?: number;
  max_tokens?: number;
  output_format?: 'markdown' | 'json' | 'yaml' | 'xml' | 'custom';
  structured_output_schema?: string;
  ai_validation_status?: 'pass' | 'warning' | 'fail';
  ai_quality_score?: number;
  last_analyzed_text?: string;
  ai_has_analyzed?: boolean;
  assets?: PromptSubmissionAsset[];
  environmental_estimate?: EnvironmentalEstimate;
}

export interface FilterOptions {
  tags: string[];
  aiPlatforms: string[];
  promptTypes: string[];
  difficulties: string[];
}

export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'general' | 'other';
export type FeedbackStatus = 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'archived';

export interface FeedbackItem {
  id: string;
  user_id?: string | null;
  type: FeedbackType;
  message: string;
  rating?: number | null;
  contact_email?: string | null;
  is_anonymous: boolean;
  status: FeedbackStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    name?: string;
    handle?: string;
    avatar_url?: string;
  } | null;
  user_email?: string | null;
}

export interface CreateFeedbackPayload {
  type: FeedbackType;
  message: string;
  rating?: number | null;
  contact_email?: string | null;
  is_anonymous?: boolean;
}

export interface FeedbackFilters {
  search?: string;
  status?: FeedbackStatus | 'all';
  type?: FeedbackType | 'all';
  rating?: number | 'all';
  authFilter?: 'all' | 'authenticated' | 'anonymous';
  startDate?: string;
  endDate?: string;
  sortBy?: 'newest' | 'oldest' | 'rating_desc' | 'rating_asc';
}

export interface FeedbackSummaryMetrics {
  total: number;
  newCount: number;
  bugsCount: number;
  featureRequestsCount: number;
  anonymousCount: number;
  averageRating: number | null;
}

export interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface PromptRatingSummary {
  averageRating: number | null;
  ratingCount: number;
  userRating: number | null;
  distribution: RatingDistribution;
}

export type ReputationEventType =
  | 'prompt_approved'
  | 'rating_received'
  | 'verified_bonus'
  | 'admin_adjustment';

export interface ReputationEvent {
  id: string;
  userId: string;
  authorId: string;
  eventType: ReputationEventType;
  points: number;
  referenceId?: string | null;
  description: string;
  createdAt: string;
}

export interface ReputationHistorySummary {
  totalReputation: number;
  approvedPromptsCount: number;
  fiveStarRatingsCount: number;
  fourStarRatingsCount: number;
  isVerified: boolean;
  adminAdjustmentsTotal: number;
  events: ReputationEvent[];
}



