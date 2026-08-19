/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Moderation service for admin operations
 */

import { supabase } from "./supabase";
import {
  ModerationLog,
  RejectedPrompt,
  ModerationQueueItem,
  PromptCard,
} from "../types";
import { assertNoError } from "./errors";
import { ERROR_MESSAGES } from "./constants";

export type ModerationSort =
  | "Newest"
  | "Oldest"
  | "Most Likes"
  | "Most Saves"
  | "Recently Approved";

export interface ModerationFilterOptions {
  search?: string;
  sortBy?: ModerationSort;
  limit?: number;
  offset?: number;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error(ERROR_MESSAGES.SUPABASE_NOT_CONFIGURED);
  }
  return supabase;
}

async function performApiAudit(db: any, queryName: string, resultData: any, queryError: any) {
  try {
    const { data: authData } = await db.auth.getUser();
    const currentUserId = authData?.user?.id || null;
    let authorId = null;
    let isAdmin = false;

    if (currentUserId) {
      const { data: authorData } = await db
        .from("authors")
        .select("id, is_admin")
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (authorData) {
        authorId = authorData.id;
        isAdmin = (authorData as any).is_admin === true;
      }
    }

    // console.log(`--- API Audit Log: ${queryName} ---`);
    // console.log('currentUserId:', currentUserId);
    // console.log('authorId:', authorId);
    // console.log('isAdmin:', isAdmin);
    // console.log('query result count:', resultData?.length || 0);
    // console.log('error:', queryError);
    // console.log('----------------------------------------');
  } catch (err) {
    console.error(`[API Audit] Error during audit logging:`, err);
  }
}

/**
 * Get pending prompts for moderation queue
 */
export async function getPendingPrompts(
  filters?: ModerationFilterOptions
): Promise<ModerationQueueItem[]> {
  const db = requireSupabase();

  let query = db
    .from("prompts")
    .select(
      `
      id,
      slug,
      title,
      short_description,
      category_id,
      featured,
      verified,
      community_validated,
      updated_at,
      created_at,
      submitted_at,
      moderation_status,
      authors:authors!prompts_author_id_fkey (
        id,
        name,
        handle,
        avatar_url,
        verified
      )
    `, // 👈 "tags", "views", "likes", "bookmarks", "rating", "rating_count" removed
      { count: "exact" }
    )
    .eq("moderation_status", "pending");

  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  // Sorting
  const sort = filters?.sortBy || "Newest";
  switch (sort) {
    case "Newest":
      query = query.order("submitted_at", { ascending: false });
      break;
    case "Oldest":
      query = query.order("submitted_at", { ascending: true });
      break;
    default:
      query = query.order("submitted_at", { ascending: false });
  }

  const limit = filters?.limit;
  const offset = filters?.offset;

  if (limit !== undefined) {
    const from = offset || 0;
    const to = from + limit - 1;
    query = query.range(from, to);
  } else if (offset !== undefined) {
    query = query.range(offset, offset + 49);
  }

  const { data, error } = await query;
  await performApiAudit(db, "getPendingPrompts", data, error);
  assertNoError(error, "Failed to fetch pending prompts");

  return (data || []).map((row: any) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description || "",
    category: row.category_id || "",
    subCategory: "",
    tags: [], // 👈 Local fallback
    aiPlatforms: [],
    featured: row.featured || false,
    verified: row.verified || false,
    communityValidated: row.community_validated || false,
    stats: {
      views: 0, // 👈 Local fallback
      copies: 0,
      bookmarks: 0, // 👈 Local fallback
      rating: 0, // 👈 Local fallback
      ratingCount: 0, // 👈 Local fallback
      updated: row.updated_at || "",
    },
    results: {
      hasProof: false,
      successRate: 0,
    },
    author: {
      name: row.authors?.name || "",
      handle: row.authors?.handle || "",
      avatarUrl: row.authors?.avatar_url || "",
      verified: row.authors?.verified || false,
    },
    engagement: {
      trendingScore: 0,
      weeklyGrowth: 0,
    },
    moderation: {
      status: row.moderation_status || "pending",
      submittedAt: row.submitted_at,
    },
    submittedAt: row.submitted_at,
  }));
}

/**
 * Get approved prompts for moderation dashboard
 */
export async function getApprovedPrompts(
  filters?: ModerationFilterOptions
): Promise<ModerationQueueItem[]> {
  const db = requireSupabase();

  let query = db
    .from("prompts")
    .select(
      `
      id,
      slug,
      title,
      short_description,
      category_id,
      featured,
      verified,
      community_validated,
      updated_at,
      created_at,
      submitted_at,
      approved_at,
      moderation_status,
      authors:authors!prompts_author_id_fkey (
        id,
        name,
        handle,
        avatar_url,
        verified
      )
    `, // 👈 "tags", "views", "likes", "bookmarks", "rating", "rating_count" removed
      { count: "exact" }
    )
    .eq("moderation_status", "approved");

  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  // Sorting
  const sort = filters?.sortBy || "Recently Approved";
  switch (sort) {
    case "Newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "Oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "Recently Approved":
      query = query.order("approved_at", { ascending: false });
      break;
    default:
      query = query.order("approved_at", { ascending: false });
  }

  const limit = filters?.limit;
  const offset = filters?.offset;

  if (limit !== undefined) {
    const from = offset || 0;
    const to = from + limit - 1;
    query = query.range(from, to);
  } else if (offset !== undefined) {
    query = query.range(offset, offset + 49);
  }

  const { data, error } = await query;
  await performApiAudit(db, "getApprovedPrompts", data, error);
  assertNoError(error, "Failed to fetch approved prompts");

  return (data || []).map((row: any) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description || "",
    category: row.category_id || "",
    subCategory: "",
    tags: [], // 👈 Local fallback
    aiPlatforms: [],
    featured: row.featured || false,
    verified: row.verified || false,
    communityValidated: row.community_validated || false,
    stats: {
      views: 0, // 👈 Local fallback
      copies: 0,
      bookmarks: 0, // 👈 Local fallback
      rating: 0, // 👈 Local fallback
      ratingCount: 0, // 👈 Local fallback
      updated: row.updated_at || "",
    },
    results: {
      hasProof: false,
      successRate: 0,
    },
    author: {
      name: row.authors?.name || "",
      handle: row.authors?.handle || "",
      avatarUrl: row.authors?.avatar_url || "",
      verified: row.authors?.verified || false,
    },
    engagement: {
      trendingScore: 0,
      weeklyGrowth: 0,
    },
    moderation: {
      status: row.moderation_status || "approved",
      approvedAt: row.approved_at,
    },
    submittedAt: row.submitted_at,
  }));
}

/**
 * Get rejected prompts
 */
export async function getRejectedPrompts(
  filters?: ModerationFilterOptions
): Promise<RejectedPrompt[]> {
  const db = requireSupabase();

  let query = db.from("rejected_prompts").select(
    `
    id,
    original_prompt_id,
    author_id,
    title,
    short_description,
    description,
    category_id,
    prompt_type_id,
    system_prompt,
    user_prompt,
    expected_output,
    rejection_reason,
    rejected_at,
    rejected_by,
    original_created_at,
    authors:authors!rejected_prompts_author_id_fkey (
      id,
      name,
      handle,
      avatar_url
    ),
    rejected_by_author:authors!rejected_prompts_rejected_by_fkey (
      name,
      handle
    )
  `
  );

  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  // Sorting
  const sort = filters?.sortBy || "Newest";
  switch (sort) {
    case "Newest":
      query = query.order("rejected_at", { ascending: false });
      break;
    case "Oldest":
      query = query.order("rejected_at", { ascending: true });
      break;
    default:
      query = query.order("rejected_at", { ascending: false });
  }

  const limit = filters?.limit;
  const offset = filters?.offset;

  if (limit !== undefined) {
    const from = offset || 0;
    const to = from + limit - 1;
    query = query.range(from, to);
  } else if (offset !== undefined) {
    query = query.range(offset, offset + 49);
  }

  const { data, error } = await query;
  await performApiAudit(db, "getRejectedPrompts", data, error);
  assertNoError(error, "Failed to fetch rejected prompts");

  return (data || []).map((row: any) => ({
    id: row.id,
    originalPromptId: row.original_prompt_id,
    authorId: row.author_id,
    title: row.title,
    shortDescription: row.short_description,
    description: row.description,
    categoryId: row.category_id,
    promptTypeId: row.prompt_type_id,
    systemPrompt: row.system_prompt,
    userPrompt: row.user_prompt,
    expectedOutput: row.expected_output,
    rejectionReason: row.rejection_reason,
    rejectedAt: row.rejected_at,
    rejectedBy: row.rejected_by,
    originalCreatedAt: row.original_created_at,
    author: {
      name: row.authors?.name || "",
      handle: row.authors?.handle || "",
      avatarUrl: row.authors?.avatar_url || "",
    },
    rejectedByAuthor: {
      name: row.rejected_by_author?.name || "Admin",
      handle: row.rejected_by_author?.handle || "@admin",
    },
  }));
}

/**
 * Approve a prompt
 */
export async function approvePrompt(
  promptId: string,
  adminId: string
): Promise<{ success: boolean; message: string }> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("approve_prompt", {
    p_prompt_id: promptId,
    p_admin_id: adminId,
  });

  assertNoError(error, "Failed to approve prompt");
  return data as { success: boolean; message: string };
}

/**
 * Reject a prompt
 */
export async function rejectPrompt(
  promptId: string,
  adminId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("reject_prompt", {
    p_prompt_id: promptId,
    p_admin_id: adminId,
    p_rejection_reason: reason,
  });

  assertNoError(error, "Failed to reject prompt");
  return data as { success: boolean; message: string };
}

/**
 * Restore a rejected prompt
 */
export async function restoreRejectedPrompt(
  rejectedPromptId: string,
  adminId: string
): Promise<{ success: boolean; message: string; new_prompt_id?: string }> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("restore_rejected_prompt", {
    p_rejected_prompt_id: rejectedPromptId,
    p_admin_id: adminId,
  });

  assertNoError(error, "Failed to restore rejected prompt");
  return data as { success: boolean; message: string; new_prompt_id?: string };
}

/**
 * Permanently delete a rejected prompt
 */
export async function deleteRejectedPrompt(
  rejectedPromptId: string,
  adminId: string
): Promise<{ success: boolean; message: string }> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("delete_rejected_prompt", {
    p_rejected_prompt_id: rejectedPromptId,
    p_admin_id: adminId,
  });

  assertNoError(error, "Failed to delete rejected prompt");
  return data as { success: boolean; message: string };
}

/**
 * Permanently delete any approved prompt and all its linked data (Admin only)
 */
export async function deleteApprovedPrompt(
  promptId: string,
  adminId: string
): Promise<{ success: boolean; message: string }> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("delete_approved_prompt", {
    p_prompt_id: promptId,
    p_admin_id: adminId,
  });

  if (error) {
    console.warn("[deleteApprovedPrompt] RPC call failed, falling back to direct CASCADE deletion:", error);
    // Direct delete fallback with select to verify row deletion
    const { data: deletedRows, error: directErr } = await db
      .from("prompts")
      .delete()
      .eq("id", promptId)
      .select("id");

    if (directErr) {
      assertNoError(directErr, "Failed to delete approved prompt from database.");
    }

    if (!deletedRows || deletedRows.length === 0) {
      return {
        success: false,
        message: "Deletion blocked by Supabase RLS policy. Please execute migration 007 (007_admin_delete_approved_prompts.sql) in your Supabase SQL Editor to grant admin deletion RPC permissions.",
      };
    }

    return { success: true, message: "Approved prompt permanently deleted from backend." };
  }

  return data as { success: boolean; message: string };
}

/**
 * Get moderation logs for a prompt
 */
export async function getModerationLogs(
  promptId: string
): Promise<ModerationLog[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("moderation_logs")
    .select("*")
    .eq("prompt_id", promptId)
    .order("performed_at", { ascending: false });

  assertNoError(error, "Failed to fetch moderation logs");
  return (data || []).map((row: any) => ({
    id: row.id,
    promptId: row.prompt_id,
    action: row.action,
    oldStatus: row.old_status,
    newStatus: row.new_status,
    reason: row.reason,
    performedBy: row.performed_by,
    performedAt: row.performed_at,
    metadata: row.metadata,
  }));
}

/**
 * Check if current user is admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const db = requireSupabase();

  const { data: authData, error: authError } = await db.auth.getUser();
  if (authError || !authData.user) {
    return false;
  }

  const { data, error } = await db
    .from("authors")
    .select("is_admin")
    .eq("user_id", authData.user.id)
    .single();

  if (error) {
    const isLegacyColumnMissing = error.details?.includes('is_admin') || error.code === '42703';
    if (isLegacyColumnMissing) {
      const { data: legacyData, error: legacyError } = await db
        .from("authors")
        .select("reputation")
        .eq("user_id", authData.user.id)
        .single();

      if (legacyError || !legacyData) {
        return false;
      }
      return (legacyData.reputation ?? 0) >= 5000;
    }
    return false;
  }

  if (!data) {
    return false;
  }

  return data.is_admin === true;
}

/**
 * Get current user's author data
 */
export async function getCurrentAuthor() {
  const db = requireSupabase();
  const { data: authData, error: authError } = await db.auth.getUser();

  if (authError || !authData.user) {
    return null;
  }

  const { data, error } = await db
    .from("authors")
    .select("id, name, handle")
    .eq("user_id", authData.user.id)
    .single();

  assertNoError(error, "Failed to fetch current author");
  return data;
}
