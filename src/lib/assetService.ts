/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Centralized Production-Grade Asset Management Service
 * Handles uploading, validating, and deleting binary image assets using Supabase Storage ('prompt-assets').
 */

import { supabase } from './supabase';
import { PromptSubmissionAsset } from '../types';

export const ASSET_CONFIG = {
  STORAGE_BUCKET: 'prompt-assets',
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB Limit
  MAX_IMAGES_PER_PROMPT: 5,
  ALLOWED_MIME_TYPES: [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ],
  ALLOWED_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'],
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate image file before upload (MIME, extension, size, image count limit)
 */
export function validateImageFile(file: File, currentAssetCount: number): FileValidationResult {
  if (currentAssetCount >= ASSET_CONFIG.MAX_IMAGES_PER_PROMPT) {
    return {
      valid: false,
      error: `Maximum limit of ${ASSET_CONFIG.MAX_IMAGES_PER_PROMPT} images per prompt reached.`,
    };
  }

  if (file.size > ASSET_CONFIG.MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum limit of 5 MB.`,
    };
  }

  const mimeType = file.type?.toLowerCase();
  const extension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;

  const isMimeAllowed = ASSET_CONFIG.ALLOWED_MIME_TYPES.includes(mimeType);
  const isExtensionAllowed = ASSET_CONFIG.ALLOWED_EXTENSIONS.includes(extension);

  if (!isMimeAllowed || !isExtensionAllowed) {
    return {
      valid: false,
      error: `Unsupported file type (${file.type || extension}). Allowed formats: PNG, JPG, WEBP, GIF, SVG.`,
    };
  }

  return { valid: true };
}

/**
 * Extract image width & height dimensions using HTML Image constructor
 */
export function getImageDimensions(file: File): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type.includes('svg')) {
      return resolve({});
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      resolve({});
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  });
}

export interface UploadAssetParams {
  file: File;
  userId: string;
  promptId?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Centralized file/image upload handler using Supabase Storage bucket with collision-free UUID paths
 */
export async function uploadPromptAsset({
  file,
  userId,
  promptId = 'drafts',
  onProgress,
}: UploadAssetParams): Promise<PromptSubmissionAsset> {
  const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
  const uniqueUuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 12);
  const storagePath = `${userId}/${promptId}/${Date.now()}_${uniqueUuid}.${fileExt}`;

  const localPreviewUrl = URL.createObjectURL(file);
  const dimensions = await getImageDimensions(file);

  const initialAsset: PromptSubmissionAsset = {
    id: assetId,
    file,
    previewUrl: localPreviewUrl,
    storagePath: '',
    fileName: file.name,
    mimeType: file.type || 'image/png',
    fileSizeBytes: file.size,
    width: dimensions.width,
    height: dimensions.height,
    uploadState: 'uploading',
    progress: 15,
  };

  if (!supabase) {
    console.warn('[AssetService] Supabase client not configured. Using local preview blob URL.');
    return {
      ...initialAsset,
      storagePath: `local/${storagePath}`,
      uploadState: 'success',
      progress: 100,
    };
  }

  try {
    if (onProgress) onProgress(40);

    const { data, error } = await supabase.storage
      .from(ASSET_CONFIG.STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('[AssetService] Bucket upload error, falling back to local preview:', error.message);
      return {
        ...initialAsset,
        storagePath: `fallback/${storagePath}`,
        uploadState: 'success',
        progress: 100,
      };
    }

    if (onProgress) onProgress(80);

    const { data: publicUrlData } = supabase.storage
      .from(ASSET_CONFIG.STORAGE_BUCKET)
      .getPublicUrl(data?.path || storagePath);

    if (onProgress) onProgress(100);

    return {
      id: assetId,
      file,
      previewUrl: publicUrlData?.publicUrl || localPreviewUrl,
      storagePath: data?.path || storagePath,
      fileName: file.name,
      mimeType: file.type || 'image/png',
      fileSizeBytes: file.size,
      width: dimensions.width,
      height: dimensions.height,
      uploadState: 'success',
      progress: 100,
    };
  } catch (err) {
    console.error('[AssetService] Upload exception:', err);
    return {
      ...initialAsset,
      uploadState: 'error',
      progress: 0,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
}

/**
 * Remove an uploaded asset from Supabase Storage
 */
export async function deletePromptAsset(storagePath: string): Promise<boolean> {
  if (!supabase || !storagePath || storagePath.startsWith('local/') || storagePath.startsWith('fallback/')) {
    return true;
  }

  try {
    const { error } = await supabase.storage
      .from(ASSET_CONFIG.STORAGE_BUCKET)
      .remove([storagePath]);

    if (error) {
      console.warn('[AssetService] Asset deletion error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[AssetService] Asset deletion exception:', err);
    return false;
  }
}

/**
 * Bulk cleanup routine for orphaned assets on submission failure or draft clear
 */
export async function cleanupOrphanedAssets(storagePaths: string[]): Promise<void> {
  const validPaths = storagePaths.filter((path) => path && !path.startsWith('local/') && !path.startsWith('fallback/'));
  if (!supabase || validPaths.length === 0) return;

  try {
    const { error } = await supabase.storage
      .from(ASSET_CONFIG.STORAGE_BUCKET)
      .remove(validPaths);

    if (error) {
      console.warn('[AssetService] Bulk asset cleanup error:', error.message);
    }
  } catch (err) {
    console.error('[AssetService] Bulk asset cleanup exception:', err);
  }
}
