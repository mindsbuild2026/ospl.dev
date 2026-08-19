/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ImageProofUploader Component
 * Production-grade drag-and-drop file uploader for prompt proof assets.
 * Supports image preview, upload progress, retry on failure, and item removal.
 */

import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { PromptSubmissionAsset } from '../../types';
import { validateImageFile, ASSET_CONFIG } from '../../lib/assetService';

export interface ImageProofUploaderProps {
  assets: PromptSubmissionAsset[];
  onUploadFile?: (file: File) => Promise<void>;
  onUploadAsset?: (file: File) => Promise<void>;
  onRemoveAsset: (assetId: string) => Promise<void>;
  onRetryUpload?: (asset: PromptSubmissionAsset) => Promise<void>;
  disabled?: boolean;
}

export function ImageProofUploader({
  assets = [],
  onUploadFile,
  onUploadAsset,
  onRemoveAsset,
  onRetryUpload,
  disabled = false,
}: ImageProofUploaderProps) {
  const handleUpload = onUploadFile || onUploadAsset;
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    setValidationError('');

    Array.from(files).forEach((file) => {
      const check = validateImageFile(file, assets.length);
      if (!check.valid) {
        setValidationError(check.error || 'Invalid image file.');
        return;
      }
      if (handleUpload) {
        handleUpload(file).catch((err) => {
          setValidationError(err instanceof Error ? err.message : 'Upload failed.');
        });
      }
    });
  }, [assets.length, onUploadFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = async (assetId: string) => {
    setRemovingId(assetId);
    try {
      await onRemoveAsset(assetId);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-450 dark:text-neutral-500">
          Proof & Reference Images ({assets.length}/{ASSET_CONFIG.MAX_IMAGES_PER_PROMPT})
        </label>
        <span className="text-[10px] text-neutral-400">Max 5MB each • PNG, JPG, WEBP, GIF, SVG</span>
      </div>

      {validationError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <p className="flex-1 font-medium">{validationError}</p>
          <button type="button" onClick={() => setValidationError('')} className="text-red-500 hover:text-red-700 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Drag and Drop Zone */}
      {assets.length < ASSET_CONFIG.MAX_IMAGES_PER_PROMPT && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
            isDragging
              ? 'border-brand-accent bg-brand-accent/5 ring-4 ring-brand-accent/10'
              : 'border-neutral-200 hover:border-brand-accent/40 bg-neutral-50/50 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/30 dark:hover:bg-neutral-900/60'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ASSET_CONFIG.ALLOWED_MIME_TYPES.join(',')}
            onChange={(e) => handleFiles(e.target.files)}
            disabled={disabled}
            multiple
            className="hidden"
          />

          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent mb-3">
            <UploadCloud className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Click to upload <span className="font-normal text-neutral-500">or drag and drop reference images</span>
          </p>
          <p className="mt-1 text-[10px] text-neutral-400">High-resolution execution screenshots or output proofs</p>
        </div>
      )}

      {/* Uploaded Images List */}
      {assets.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => {
            const isRemoving = removingId === asset.id;
            const isUploading = asset.uploadState === 'uploading';
            const isFailed = asset.uploadState === 'error';

            return (
              <div
                key={asset.id}
                className="group relative flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700">
                  {asset.previewUrl ? (
                    <img src={asset.previewUrl} alt={asset.fileName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-400">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-bold text-neutral-900 dark:text-white" title={asset.fileName}>
                    {asset.fileName}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    {(asset.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                  </p>

                  {isUploading && (
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        className="h-full bg-brand-accent transition-all duration-300"
                        style={{ width: `${asset.progress || 30}%` }}
                      />
                    </div>
                  )}

                  {isFailed && (
                    <p className="mt-0.5 text-[9px] font-bold text-red-500 truncate" title={asset.error}>
                      {asset.error || 'Upload failed'}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {isFailed && onRetryUpload && (
                    <button
                      type="button"
                      onClick={() => onRetryUpload(asset)}
                      title="Retry Upload"
                      className="p-1.5 text-neutral-400 hover:text-brand-accent rounded-lg transition"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {asset.uploadState === 'success' && (
                    <span className="text-emerald-500 p-1" title="Uploaded successfully">
                      <CheckCircle className="h-4 w-4" />
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemove(asset.id)}
                    disabled={isRemoving}
                    title="Remove asset"
                    className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition disabled:opacity-50"
                  >
                    {isRemoving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
