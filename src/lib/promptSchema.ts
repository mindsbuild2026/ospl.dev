/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Prompt, PromptCard } from "../types";

const PLATFORM_CODES: Record<string, string> = {
  ChatGPT: "GPT",
  Claude: "CLA",
  Gemini: "GEM",
  Cursor: "CUR",
  Midjourney: "MJ",
  Flux: "FLX",
};

export function toPromptCard(prompt: Prompt): PromptCard {
  return {
    id: prompt.id,
    slug: prompt.slug,
    title: prompt.title,
    shortDescription: prompt.shortDescription,
    category: prompt.category,
    subCategory: prompt.subCategory,
    tags: prompt.tags,
    aiPlatforms: prompt.aiPlatforms,
    featured: prompt.featured,
    verified: prompt.verified,
    communityValidated: prompt.communityValidated,
    stats: {
      views: prompt.stats.views,
      copies: prompt.stats.copies,
      bookmarks: prompt.stats.bookmarks,
      rating: prompt.stats.rating,
      ratingCount: prompt.stats.ratingCount,
      updated: prompt.stats.updated,
    },
    results: {
      hasProof: prompt.results.hasProof,
      successRate: prompt.results.successRate,
    },
    author: {
      name: prompt.author.name,
      handle: prompt.author.handle,
      avatarUrl: prompt.author.avatarUrl,
      verified: prompt.author.verified,
    },
    engagement: {
      trendingScore: prompt.engagement.trendingScore,
      weeklyGrowth: prompt.engagement.weeklyGrowth,
    },
  };
}

export function getPrimaryPlatform(prompt: PromptCard): string {
  return prompt.aiPlatforms[0] || prompt.category || "AI";
}

export function getPlatformCode(prompt: PromptCard): string {
  const platform = getPrimaryPlatform(prompt);
  return PLATFORM_CODES[platform] || platform.slice(0, 3).toUpperCase();
}

export function getModelLabel(prompt: Prompt): string {
  return prompt.recommendedModels[0]?.name || getPrimaryPlatform(prompt);
}

export function getPromptCopyText(prompt: Prompt): string {
  // 1. If Developer Pro workflow steps are available, join exact step prompts
  if (prompt.workflow_steps && prompt.workflow_steps.length > 0) {
    const validSteps = prompt.workflow_steps.filter((s) => s.prompt && s.prompt.trim());
    if (validSteps.length > 0) {
      return validSteps
        .map((s) => `Step ${s.order}${s.title ? ` (${s.title})` : ''}:\n${s.prompt.trim()}`)
        .join('\n\n');
    }
  }

  const sys = prompt.prompt?.systemPrompt?.trim() || "";
  const usr = prompt.prompt?.userPrompt?.trim() || "";
  const exp = prompt.prompt?.expectedOutput?.trim() || "";

  const promptParts: string[] = [];

  if (sys && usr) {
    if (sys === usr) {
      // Single prompt pasted into both system_prompt and user_prompt
      promptParts.push(sys);
    } else {
      promptParts.push(`System Prompt:\n${sys}`);
      promptParts.push(`User Prompt:\n${usr}`);
    }
  } else if (sys) {
    promptParts.push(sys);
  } else if (usr) {
    promptParts.push(usr);
  }

  if (exp) {
    promptParts.push(`Expected output:\n${exp}`);
  }

  return promptParts.join("\n\n");
}

export function formatCompactNumber(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`;
}
