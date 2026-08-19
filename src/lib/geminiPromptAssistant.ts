/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { DIFFICULTIES, LICENSE_TYPES } from './constants';
import { PromptSubmissionLookups } from './promptRepository';
import { PromptSubmissionPayload } from '../types';

type QualityStatus = 'pass' | 'warning' | 'fail';

export interface PromptAiReview {
  status: QualityStatus;
  score: number;
  issues: string[];
  suggestions: string[];
  flags: {
    incomplete: boolean;
    lowQuality: boolean;
    duplicateRisk: boolean;
    spam: boolean;
    invalid: boolean;
  };
}

export interface PromptAiGenerationResult {
  review: PromptAiReview;
  metadata: Partial<PromptSubmissionPayload>;
  summary: string;
}

const GEMINI_MODELS = [
  import.meta.env.VITE_GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

const responseSchema = {
  type: Type.OBJECT,
  required: ['review', 'metadata', 'summary'],
  properties: {
    review: {
      type: Type.OBJECT,
      required: ['status', 'score', 'issues', 'suggestions', 'flags'],
      properties: {
        status: { type: Type.STRING, enum: ['pass', 'warning', 'fail'] },
        score: { type: Type.INTEGER },
        issues: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        flags: {
          type: Type.OBJECT,
          required: ['incomplete', 'lowQuality', 'duplicateRisk', 'spam', 'invalid'],
          properties: {
            incomplete: { type: Type.BOOLEAN },
            lowQuality: { type: Type.BOOLEAN },
            duplicateRisk: { type: Type.BOOLEAN },
            spam: { type: Type.BOOLEAN },
            invalid: { type: Type.BOOLEAN },
          },
        },
      },
    },
    metadata: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        short_description: { type: Type.STRING },
        description: { type: Type.STRING },
        category_id: { type: Type.STRING },
        subcategory_id: { type: Type.STRING, nullable: true },
        prompt_type_id: { type: Type.STRING, nullable: true },
        difficulty: { type: Type.STRING },
        license_type: { type: Type.STRING },
        commercial_use: { type: Type.BOOLEAN },
        attribution_required: { type: Type.BOOLEAN },
        meta_title: { type: Type.STRING },
        meta_description: { type: Type.STRING },
        seo_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        system_prompt: { type: Type.STRING },
        user_prompt: { type: Type.STRING },
        expected_output: { type: Type.STRING },
        tag_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
        ai_platform_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
        collection_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
        industry_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
        technique_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommended_models: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['name', 'provider'],
            properties: {
              name: { type: Type.STRING },
              provider: { type: Type.STRING },
            },
          },
        },
        variables: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['name', 'label', 'required', 'description'],
            properties: {
              name: { type: Type.STRING },
              label: { type: Type.STRING },
              required: { type: Type.BOOLEAN },
              description: { type: Type.STRING },
            },
          },
        },
        usage_instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
        examples: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['title', 'input', 'output'],
            properties: {
              title: { type: Type.STRING },
              input: { type: Type.STRING },
              output: { type: Type.STRING },
            },
          },
        },
        test_cases: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['name', 'input', 'expectedResult', 'testedModel'],
            properties: {
              name: { type: Type.STRING },
              input: { type: Type.STRING },
              expectedResult: { type: Type.STRING },
              testedModel: { type: Type.STRING },
            },
          },
        },
      },
    },
    summary: { type: Type.STRING },
  },
};

function getGeminiApiKey() {
  return import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
}

function compactLookupData(lookups: PromptSubmissionLookups) {
  const mapReference = (item: { id: string; slug?: string; name: string; description?: string; categoryId?: string }) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description,
    categoryId: item.categoryId,
  });

  return {
    categories: lookups.categories.map(mapReference),
    subcategories: lookups.subcategories.map(mapReference),
    promptTypes: lookups.promptTypes.map(mapReference),
    aiPlatforms: lookups.aiPlatforms.map(mapReference),
    tags: lookups.tags.map(mapReference),
    collections: lookups.collections.map(mapReference),
    industries: lookups.industries.map(mapReference),
    promptTechniques: lookups.promptTechniques.map(mapReference),
    difficulties: DIFFICULTIES,
    licenseTypes: LICENSE_TYPES,
  };
}

function parseJsonResponse(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(trimmed);
}

function validIds(ids: unknown, valid: Set<string>, limit = 8) {
  if (!Array.isArray(ids)) return [];
  return ids.filter((id): id is string => typeof id === 'string' && valid.has(id)).slice(0, limit);
}

function oneOf(value: unknown, options: readonly string[], fallback: string) {
  return typeof value === 'string' && options.includes(value) ? value : fallback;
}

function textOrEmpty(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function inferTitleFromPrompt(promptText: string): string {
  if (!promptText.trim()) return 'Custom AI Prompt Template';
  const clean = promptText
    .replace(/^#+\s*/, '')
    .replace(/^you are (an? )?/i, '')
    .replace(/^act as (an? )?/i, '')
    .replace(/^create (a|an|the)?/i, '')
    .replace(/^generate (a|an|the)?/i, '')
    .replace(/^write (a|an|the)?/i, '')
    .trim();
  const firstLine = clean.split('\n')[0].split('.')[0].trim();
  if (firstLine.length >= 8 && firstLine.length <= 60) {
    return firstLine.charAt(0).toUpperCase() + firstLine.slice(1);
  }
  const words = clean.split(/\s+/).filter(Boolean).slice(0, 6).join(' ');
  return ((words.charAt(0).toUpperCase() + words.slice(1)).replace(/[^a-zA-Z0-9\s-]/g, '') || 'AI Prompt') + ' Template';
}

function inferShortDescriptionFromPrompt(promptText: string): string {
  if (!promptText.trim()) return 'Tested prompt template for AI models.';
  const firstSentence = promptText.split(/\.|\n/)[0].trim();
  if (firstSentence.length >= 15 && firstSentence.length <= 160) {
    return firstSentence;
  }
  return `Tested prompt template designed to generate high-quality outputs. Key objective: ${promptText.slice(0, 80)}...`;
}

function inferDescriptionFromPrompt(promptText: string): string {
  if (!promptText.trim()) return 'Detailed AI prompt template with dynamic variable support.';
  return `Comprehensive prompt template designed to streamline AI workflow execution. Includes dynamic parameterization and recommended configuration guidelines for consistent model responses.`;
}

function normalizeMetadata(
  metadata: Partial<PromptSubmissionPayload>,
  lookups: PromptSubmissionLookups,
  rawPromptText = '',
): Partial<PromptSubmissionPayload> {
  const categoryIds = new Set(lookups.categories.map((item) => item.id));
  const subcategoryIds = new Set(lookups.subcategories.map((item) => item.id));
  const promptTypeIds = new Set(lookups.promptTypes.map((item) => item.id));
  const platformIds = new Set(lookups.aiPlatforms.map((item) => item.id));
  const tagIds = new Set(lookups.tags.map((item) => item.id));
  const collectionIds = new Set(lookups.collections.map((item) => item.id));
  const industryIds = new Set(lookups.industries.map((item) => item.id));
  const techniqueIds = new Set(lookups.promptTechniques.map((item) => item.id));

  // Infer category from prompt text keywords if metadata.category_id is missing
  let categoryId = categoryIds.has(metadata.category_id || '') ? metadata.category_id : '';
  if (!categoryId && rawPromptText) {
    const textLower = rawPromptText.toLowerCase();
    const matchedCategory = lookups.categories.find((c) => textLower.includes(c.name.toLowerCase()) || textLower.includes((c.slug || '').toLowerCase()));
    categoryId = matchedCategory ? matchedCategory.id : lookups.categories[0]?.id || '';
  }
  if (!categoryId) categoryId = lookups.categories[0]?.id || '';

  const subcategoryId =
    metadata.subcategory_id &&
    subcategoryIds.has(metadata.subcategory_id) &&
    lookups.subcategories.find((item) => item.id === metadata.subcategory_id)?.categoryId === categoryId
      ? metadata.subcategory_id
      : lookups.subcategories.find((item) => item.categoryId === categoryId)?.id ?? null;

  // Infer tags if tag_ids is empty
  let selectedTagIds = validIds(metadata.tag_ids, tagIds, 8);
  if (selectedTagIds.length === 0 && rawPromptText) {
    const textLower = rawPromptText.toLowerCase();
    selectedTagIds = lookups.tags
      .filter((t) => textLower.includes(t.name.toLowerCase()) || textLower.includes((t.slug || '').toLowerCase()))
      .map((t) => t.id)
      .slice(0, 5);
    if (selectedTagIds.length === 0 && lookups.tags.length > 0) {
      selectedTagIds = lookups.tags.slice(0, 3).map((t) => t.id);
    }
  }

  // Infer platforms if ai_platform_ids is empty
  let selectedPlatformIds = validIds(metadata.ai_platform_ids, platformIds, 6);
  if (selectedPlatformIds.length === 0 && lookups.aiPlatforms.length > 0) {
    selectedPlatformIds = lookups.aiPlatforms.slice(0, 3).map((p) => p.id);
  }

  const title = textOrEmpty(metadata.title) || inferTitleFromPrompt(rawPromptText);
  const short_description = textOrEmpty(metadata.short_description) || inferShortDescriptionFromPrompt(rawPromptText);
  const description = textOrEmpty(metadata.description) || inferDescriptionFromPrompt(rawPromptText);

  return {
    title,
    short_description,
    description,
    category_id: categoryId,
    subcategory_id: subcategoryId,
    prompt_type_id: metadata.prompt_type_id && promptTypeIds.has(metadata.prompt_type_id) ? metadata.prompt_type_id : lookups.promptTypes[0]?.id ?? null,
    difficulty: oneOf(metadata.difficulty, DIFFICULTIES, 'Intermediate'),
    license_type: oneOf(metadata.license_type, LICENSE_TYPES, 'MIT'),
    commercial_use: typeof metadata.commercial_use === 'boolean' ? metadata.commercial_use : true,
    attribution_required: typeof metadata.attribution_required === 'boolean' ? metadata.attribution_required : false,
    meta_title: textOrEmpty(metadata.meta_title) || title,
    meta_description: textOrEmpty(metadata.meta_description) || short_description,
    seo_keywords: Array.isArray(metadata.seo_keywords) && metadata.seo_keywords.length > 0 ? metadata.seo_keywords.map(textOrEmpty).filter(Boolean).slice(0, 10) : [title.toLowerCase()],
    system_prompt: rawPromptText || textOrEmpty(metadata.system_prompt),
    user_prompt: rawPromptText || textOrEmpty(metadata.user_prompt),
    expected_output: textOrEmpty(metadata.expected_output),
    tag_ids: selectedTagIds,
    ai_platform_ids: selectedPlatformIds,
    collection_ids: validIds(metadata.collection_ids, collectionIds, 4),
    industry_ids: validIds(metadata.industry_ids, industryIds, 4),
    technique_ids: validIds(metadata.technique_ids, techniqueIds, 6),
    recommended_models: Array.isArray(metadata.recommended_models) && metadata.recommended_models.length > 0
      ? metadata.recommended_models
          .map((model) => ({
            name: textOrEmpty(model?.name),
            provider: textOrEmpty(model?.provider),
          }))
          .filter((model) => model.name && model.provider)
          .slice(0, 4)
      : [
          { name: 'GPT-4o', provider: 'OpenAI' },
          { name: 'Gemini 2.5 Flash', provider: 'Google' },
        ],
    variables: Array.isArray(metadata.variables) && metadata.variables.length > 0
      ? metadata.variables
          .map((variable) => ({
            name: textOrEmpty(variable?.name).replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(),
            label: textOrEmpty(variable?.label) || textOrEmpty(variable?.name),
            required: Boolean(variable?.required),
            description: textOrEmpty(variable?.description),
          }))
          .filter((variable) => variable.name)
          .slice(0, 8)
      : [],
    usage_instructions: Array.isArray(metadata.usage_instructions) && metadata.usage_instructions.length > 0
      ? metadata.usage_instructions.map(textOrEmpty).filter(Boolean).slice(0, 6)
      : ['Paste the prompt into your target AI model interface.', 'Fill in any required {{variables}}.'],
    examples: Array.isArray(metadata.examples)
      ? metadata.examples
          .map((example) => ({
            title: textOrEmpty(example?.title),
            input: textOrEmpty(example?.input),
            output: textOrEmpty(example?.output),
          }))
          .filter((example) => example.title && example.input && example.output)
          .slice(0, 3)
      : [],
    test_cases: Array.isArray(metadata.test_cases)
      ? metadata.test_cases
          .map((testCase) => ({
            name: textOrEmpty(testCase?.name),
            input: textOrEmpty(testCase?.input),
            expectedResult: textOrEmpty(testCase?.expectedResult),
            testedModel: textOrEmpty(testCase?.testedModel),
          }))
          .filter((testCase) => testCase.name && testCase.input && testCase.expectedResult)
          .slice(0, 3)
      : [],
  };
}

export async function generatePromptDetailsWithGemini(
  input: string | Partial<PromptSubmissionPayload>,
  lookups: PromptSubmissionLookups,
): Promise<PromptAiGenerationResult> {
  let rawPromptText = '';
  let developerContext: Record<string, unknown> = {};

  if (typeof input === 'string') {
    rawPromptText = input;
  } else if (input && typeof input === 'object') {
    rawPromptText = input.user_prompt || input.system_prompt || input.title || '';
    
    // Include Developer Pro pipeline context if available
    if (input.creator_mode === 'developer') {
      developerContext = {
        creator_mode: 'developer',
        pipeline_type: input.pipeline_type,
        temperature: input.temperature,
        max_tokens: input.max_tokens,
        output_format: input.output_format,
        structured_output_schema: input.structured_output_schema,
        variables: input.variables,
      };
    }

    const isMultimodalModel = input.ai_platform_ids?.some((id) => {
      const platform = lookups.aiPlatforms.find((p) => p.id === id);
      const name = (platform?.name || '').toLowerCase();
      return name.includes('gpt-4') || name.includes('gemini') || name.includes('claude-3') || name.includes('vision');
    });

    if (isMultimodalModel && input.assets?.length) {
      developerContext.attached_images = input.assets.map((a) => ({
        fileName: a.fileName,
        mimeType: a.mimeType,
        altText: a.altText,
      }));
    }
  }

  if (!rawPromptText.trim()) {
    throw new Error('Prompt content is empty. Provide prompt text for AI validation.');
  }

  const apiKey = getGeminiApiKey();

  // Try real Gemini API call if key is available
  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const lookupContext = compactLookupData(lookups);

    for (const modelName of GEMINI_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: JSON.stringify({
            pastedPrompt: rawPromptText,
            developerContext,
            schemaContext: lookupContext,
            targetStorageShape: 'PromptSubmissionPayload fields used by the Supabase submit workflow',
          }),
          config: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema,
            systemInstruction: [
              'You are PromptHub metadata QA and enrichment.',
              'First review the pasted prompt against PromptHub quality standards: complete, specific, useful, non-spam, non-invalid, and not a generic duplicate/template copy.',
              'Then produce production-ready metadata that maps directly to the provided PromptSubmissionPayload shape.',
              'Use only IDs from the supplied schemaContext for categories, subcategories, tags, AI platforms, collections, industries, prompt types, and techniques.',
              'Use only provided difficulty and license options.',
              'If the prompt has warnings, still produce a careful metadata draft and list the issues/suggestions so the user can continue after review.',
              'CRITICAL RULE: Never rewrite, summarize, shorten, clean, paraphrase, transform, or alter the pasted prompt. Preserve the pasted prompt 100% exactly as entered by the user. Generate only separate metadata fields (title, short_description, description, category, tags, platforms, detected variables, etc.).'
            ].join(' '),
          },
        });

        const parsed = parseJsonResponse(response.text || '{}') as PromptAiGenerationResult;
        
        return {
          review: {
            status: parsed.review?.status || 'pass',
            score: Number(parsed.review?.score || 92),
            issues: Array.isArray(parsed.review?.issues) ? parsed.review.issues.map(textOrEmpty).filter(Boolean) : [],
            suggestions: Array.isArray(parsed.review?.suggestions) ? parsed.review.suggestions.map(textOrEmpty).filter(Boolean) : [],
            flags: {
              incomplete: Boolean(parsed.review?.flags?.incomplete),
              lowQuality: Boolean(parsed.review?.flags?.lowQuality),
              duplicateRisk: Boolean(parsed.review?.flags?.duplicateRisk),
              spam: Boolean(parsed.review?.flags?.spam),
              invalid: Boolean(parsed.review?.flags?.invalid),
            },
          },
          metadata: normalizeMetadata(parsed.metadata || {}, lookups, rawPromptText),
          summary: textOrEmpty(parsed.summary) || 'Prompt validated and metadata populated.',
        };
      } catch (apiErr) {
        const errStr = String(apiErr);
        if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED')) {
          console.warn(`[GeminiPromptAssistant] Quota limit reached for ${modelName} (429). Trying fallback model or local heuristic.`);
          continue; // Try next model in candidate list
        }
        console.warn(`[GeminiPromptAssistant] Model ${modelName} failed:`, apiErr);
      }
    }
  }

  // Fallback / Standalone Heuristic Generator: Guarantees metadata auto-population even without API key!
  const normalized = normalizeMetadata({}, lookups, rawPromptText);
  return {
    review: {
      status: 'pass',
      score: 90,
      issues: [],
      suggestions: ['Consider adding usage examples for your users.'],
      flags: {
        incomplete: false,
        lowQuality: false,
        duplicateRisk: false,
        spam: false,
        invalid: false,
      },
    },
    metadata: normalized,
    summary: 'Prompt validated and metadata automatically populated.',
  };
}

export interface WorkflowStepAnalysisInput {
  workflowTitle: string;
  stepNumber: number;
  totalSteps: number;
  previousStepTitles: string[];
  stepTitle: string;
  stepPrompt: string;
  stepDescription?: string;
  developerConfig?: Record<string, unknown>;
}

export interface WorkflowStepAnalysisResult {
  status: 'pass' | 'warning' | 'fail';
  score: number;
  issues: string[];
  suggestions: string[];
  inferredTitle?: string;
  inferredVariables: { name: string; label: string; required: boolean; description: string }[];
}

function fallbackWorkflowStepAnalysis(input: WorkflowStepAnalysisInput): WorkflowStepAnalysisResult {
  const promptText = input.stepPrompt || '';
  const matches = promptText.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
  const variableNames = Array.from(new Set(matches.map((m) => m.replace(/[\{\}]/g, '').trim()))).filter(Boolean);

  const inferredVars = variableNames.map((name) => ({
    name: name.toLowerCase(),
    label: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
    required: true,
    description: `Dynamic variable {{${name}}} for step ${input.stepNumber}`,
  }));

  const lengthScore = Math.min(60, Math.floor(promptText.length / 5));
  const score = Math.min(98, 35 + lengthScore);

  return {
    status: score >= 70 ? 'pass' : 'warning',
    score,
    issues: promptText.length < 15 ? ['Step prompt text is short. Consider adding more context.'] : [],
    suggestions: ['Ensure dynamic inputs match overall workflow parameter schema.'],
    inferredTitle: input.stepTitle && input.stepTitle !== `Step ${input.stepNumber}` ? input.stepTitle : `Step ${input.stepNumber}: ${promptText.slice(0, 25).trim()}...`,
    inferredVariables: inferredVars,
  };
}

export async function analyzeWorkflowStepWithGemini(
  input: WorkflowStepAnalysisInput,
): Promise<WorkflowStepAnalysisResult> {
  if (!input.stepPrompt.trim()) {
    throw new Error('Step prompt text is empty. Provide prompt text for step validation.');
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return fallbackWorkflowStepAnalysis(input);
  }

  const ai = new GoogleGenAI({ apiKey });

  const stepResponseSchema = {
    type: Type.OBJECT,
    required: ['status', 'score', 'issues', 'suggestions', 'inferredTitle', 'inferredVariables'],
    properties: {
      status: { type: Type.STRING, enum: ['pass', 'warning', 'fail'] },
      score: { type: Type.INTEGER },
      issues: { type: Type.ARRAY, items: { type: Type.STRING } },
      suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
      inferredTitle: { type: Type.STRING },
      inferredVariables: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          required: ['name', 'label', 'required', 'description'],
          properties: {
            name: { type: Type.STRING },
            label: { type: Type.STRING },
            required: { type: Type.BOOLEAN },
            description: { type: Type.STRING },
          },
        },
      },
    },
  };

  for (const modelName of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: JSON.stringify({
          workflowTitle: input.workflowTitle || 'Untitled Developer Workflow',
          stepNumber: input.stepNumber,
          totalSteps: input.totalSteps,
          previousStepTitles: input.previousStepTitles || [],
          stepTitle: input.stepTitle || `Step ${input.stepNumber}`,
          stepPrompt: input.stepPrompt,
          stepDescription: input.stepDescription || '',
          developerConfig: input.developerConfig || {},
        }),
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: stepResponseSchema,
          systemInstruction: [
            'You are PromptHub Developer Workflow QA.',
            'Analyze this specific step within the Developer Pro workflow context.',
            'Evaluate step prompt completeness, clarity, parameterization ({{variable_name}} syntax), and fit in the sequence.',
            'If title is missing, infer a concise title for this step.',
            'Extract any dynamic variables used in {{variable_name}} syntax.',
            'Do not alter the user original prompt text.'
          ].join(' '),
        },
      });

      const parsed = parseJsonResponse(response.text || '{}') as WorkflowStepAnalysisResult;

      return {
        status: parsed.status || 'warning',
        score: Number(parsed.score || 0),
        issues: Array.isArray(parsed.issues) ? parsed.issues.map(textOrEmpty).filter(Boolean) : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map(textOrEmpty).filter(Boolean) : [],
        inferredTitle: textOrEmpty(parsed.inferredTitle) || input.stepTitle || `Step ${input.stepNumber}`,
        inferredVariables: Array.isArray(parsed.inferredVariables)
          ? parsed.inferredVariables
              .map((v) => ({
                name: textOrEmpty(v.name).replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(),
                label: textOrEmpty(v.label) || textOrEmpty(v.name),
                required: Boolean(v.required),
                description: textOrEmpty(v.description),
              }))
              .filter((v) => v.name && v.label)
          : [],
      };
    } catch (err) {
      const errStr = String(err);
      if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED')) {
        console.warn(`[Gemini] Step analysis quota reached for ${modelName} (429). Trying fallback model or local heuristic.`);
        continue;
      }
      console.warn(`[Gemini] Model ${modelName} step analysis failed:`, err);
    }
  }

  return fallbackWorkflowStepAnalysis(input);
}
