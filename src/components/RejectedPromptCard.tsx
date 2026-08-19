/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { RejectedPrompt } from '../types';
import {
  restoreRejectedPrompt,
  deleteRejectedPrompt,
  getCurrentAuthor,
} from '../lib/moderationService';

interface RejectedPromptCardProps {
  prompt: RejectedPrompt;
  onUpdate: () => void;
}

export default function RejectedPromptCard({
  prompt,
  onUpdate,
}: RejectedPromptCardProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleRestore = async () => {
    setLoading(true);
    setError(null);
    try {
      const author = await getCurrentAuthor();
      if (!author) {
        setError('Unable to get current user information');
        return;
      }

      const result = await restoreRejectedPrompt(prompt.id, author.id);
      if (result.success) {
        setSuccess('Prompt restored to pending status');
        setTimeout(() => {
          setSuccess(null);
          onUpdate();
        }, 1500);
      } else {
        setError(result.message || 'Failed to restore prompt');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const author = await getCurrentAuthor();
      if (!author) {
        setError('Unable to get current user information');
        return;
      }

      const result = await deleteRejectedPrompt(prompt.id, author.id);
      if (result.success) {
        setSuccess('Prompt permanently deleted');
        setDeleteDialogOpen(false);
        setTimeout(() => {
          setSuccess(null);
          onUpdate();
        }, 1500);
      } else {
        setError(result.message || 'Failed to delete prompt');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prompt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={() => navigate(`/prompt/${prompt.originalPromptId}`)}
        className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="p-4 flex-1 flex flex-col">
          {error && (
            <div 
              className="bg-red-50 text-red-800 border border-red-200 px-3 py-2 rounded text-sm mb-2"
              onClick={(e) => e.stopPropagation()}
            >
              {error}
            </div>
          )}
          {success && (
            <div 
              className="bg-green-50 text-green-800 border border-green-200 px-3 py-2 rounded text-sm mb-2"
              onClick={(e) => e.stopPropagation()}
            >
              {success}
            </div>
          )}

          <div className="mb-4">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-red-200 text-red-700 bg-red-50">
              Rejected
            </span>
            <span className="block text-xs text-gray-500 mt-2">
              Rejected: {new Date(prompt.rejectedAt).toLocaleDateString()}
            </span>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {prompt.title}
          </h3>
          
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {prompt.shortDescription}
          </p>

          <div className="mb-4">
            <span className="text-xs text-gray-500">
              By {prompt.author.name} (@{prompt.author.handle})
            </span>
          </div>

          <div 
            className="mt-auto bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-xs font-bold mb-1">
              Rejection Reason:
            </h4>
            <p className="text-sm">
              {prompt.rejectionReason}
            </p>
          </div>
        </div>

        <div className="p-4 pt-0 flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRestore();
            }}
            disabled={loading}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50 flex items-center justify-center transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              'Restore'
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteDialogOpen(true);
            }}
            disabled={loading}
            className="flex-1 border border-red-500 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Permanently Delete Rejected Prompt?</h2>
            </div>
            
            <div className="px-6 py-4">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded text-sm mt-2">
                This action cannot be undone. The prompt "{prompt.title}" will be permanently deleted.
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium disabled:opacity-50 flex items-center transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                ) : null}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
