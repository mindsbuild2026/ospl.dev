/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Backend Saved Prompts Service
 * Supabase backend is the SINGLE SOURCE OF TRUTH for user saved prompts.
 */

import { supabase } from "./supabase";
import { PromptCard } from "../types";
import { fetchPromptCardsByIds, updatePromptBookmark } from "./promptRepository";
import { assertNoError } from "./errors";
import { ERROR_MESSAGES } from "./constants";

function requireSupabase() {
  if (!supabase) {
    throw new Error(ERROR_MESSAGES.SUPABASE_NOT_CONFIGURED);
  }
  return supabase;
}

/**
 * Fetch all saved prompt IDs for the authenticated user from Supabase
 */
export async function getUserSavedPromptIds(userId: string): Promise<string[]> {
  if (!userId) return [];

  const db = requireSupabase();
  const { data, error } = await db
    .from("saved_prompts")
    .select("prompt_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  assertNoError(error, "Failed to load saved prompt IDs from backend.");
  return (data || []).map((row: { prompt_id: string }) => row.prompt_id);
}

/**
 * Fetch full saved prompt cards for the authenticated user from Supabase
 */
export async function getUserSavedPrompts(userId: string): Promise<PromptCard[]> {
  if (!userId) return [];

  const savedIds = await getUserSavedPromptIds(userId);
  if (savedIds.length === 0) {
    return [];
  }

  return await fetchPromptCardsByIds(savedIds);
}

/**
 * Save a prompt to Supabase for the authenticated user
 */
export async function savePromptToBackend(
  userId: string,
  promptId: string
): Promise<{ success: boolean }> {
  if (!userId) {
    throw new Error("Authentication required to save prompts.");
  }
  if (!promptId) {
    throw new Error("Invalid prompt ID.");
  }

  const db = requireSupabase();
  
  // Upsert into saved_prompts
  const { error } = await db
    .from("saved_prompts")
    .upsert({ user_id: userId, prompt_id: promptId }, { onConflict: "user_id,prompt_id" });

  assertNoError(error, "Failed to save prompt to backend.");

  // Sync bookmark analytics counter
  updatePromptBookmark(promptId, 1).catch((err) => {
    console.warn("[savedPromptsService] Bookmark counter update warning:", err);
  });

  return { success: true };
}

/**
 * Remove a saved prompt from Supabase for the authenticated user
 */
export async function removeSavedPromptFromBackend(
  userId: string,
  promptId: string
): Promise<{ success: boolean }> {
  if (!userId) {
    throw new Error("Authentication required to remove saved prompts.");
  }
  if (!promptId) {
    throw new Error("Invalid prompt ID.");
  }

  const db = requireSupabase();

  const { error } = await db
    .from("saved_prompts")
    .delete()
    .eq("user_id", userId)
    .eq("prompt_id", promptId);

  assertNoError(error, "Failed to remove saved prompt from backend.");

  // Sync bookmark analytics counter
  updatePromptBookmark(promptId, -1).catch((err) => {
    console.warn("[savedPromptsService] Bookmark counter update warning:", err);
  });

  return { success: true };
}
