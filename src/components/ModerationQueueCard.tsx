/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ModerationQueueItem } from '../types';
import { approvePrompt, rejectPrompt, deleteApprovedPrompt, getCurrentAuthor } from '../lib/moderationService';

interface ModerationQueueCardProps {
  prompt: ModerationQueueItem;
  isApproved?: boolean;
  onUpdate: () => void;
}

const REJECTION_REASONS = [
  'Duplicate content',
  'Low quality',
  'Spam',
  'Copyright issue',
  'Invalid formatting',
  'Offensive content',
  'Incomplete instructions',
  'Other',
];

export default function ModerationQueueCard({
  prompt,
  isApproved = false,
  onUpdate,
}: ModerationQueueCardProps) {
  const navigate = useNavigate();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      const author = await getCurrentAuthor();
      if (!author) {
        setError('Unable to get current user information');
        return;
      }

      const result = await approvePrompt(prompt.id, author.id);
      if (result.success) {
        setSuccess('Prompt approved successfully');
        setTimeout(() => {
          setSuccess(null);
          onUpdate();
        }, 1500);
      } else {
        setError(result.message || 'Failed to approve prompt');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = () => {
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    const reason = rejectionReason === 'Other' ? customReason : rejectionReason;

    if (!reason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const author = await getCurrentAuthor();
      if (!author) {
        setError('Unable to get current user information');
        return;
      }

      const result = await rejectPrompt(prompt.id, author.id, reason);
      if (result.success) {
        setSuccess('Prompt rejected successfully');
        setRejectDialogOpen(false);
        setRejectionReason('');
        setCustomReason('');
        setTimeout(() => {
          setSuccess(null);
          onUpdate();
        }, 1500);
      } else {
        setError(result.message || 'Failed to reject prompt');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApprovedConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const author = await getCurrentAuthor();
      if (!author) {
        setError('Unable to verify admin information');
        return;
      }

      const result = await deleteApprovedPrompt(prompt.id, author.id);
      if (result.success) {
        setSuccess('Prompt and all linked data permanently deleted');
        setDeleteDialogOpen(false);
        setTimeout(() => {
          setSuccess(null);
          onUpdate();
        }, 1200);
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
        onClick={() => navigate(`/prompt/${prompt.id}`)}
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
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                prompt.moderation.status === 'approved'
                  ? 'border-green-200 text-green-700 bg-green-50'
                  : 'border-yellow-200 text-yellow-700 bg-yellow-50'
              }`}
            >
              {prompt.moderation.status}
            </span>
            {prompt.moderation.submittedAt && (
              <span className="block text-xs text-gray-500 mt-2">
                Submitted: {new Date(prompt.moderation.submittedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {prompt.title}
          </h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {prompt.shortDescription}
          </p>

          <div className="mb-4">
            <span className="text-xs text-gray-500">
              By ({prompt.author.handle})
            </span>
          </div>

          <div 
            className="flex flex-row flex-wrap gap-2 mb-2" 
            onClick={(e) => e.stopPropagation()}
          >
            {prompt.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag} 
                className="inline-flex px-2 py-0.5 border border-gray-200 rounded-full text-xs text-gray-600 bg-gray-50"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex gap-3 mt-auto pt-4 text-xs text-gray-500">
            <span>❤️ {prompt.stats.bookmarks}</span>
            <span>👍 {prompt.stats.rating}</span>
            <span>👁️ {prompt.stats.views}</span>
          </div>
        </div>

        <div className="p-4 pt-0 flex gap-2" onClick={(e) => e.stopPropagation()}>
          {!isApproved ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove();
                }}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50 flex items-center justify-center transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  'Approve'
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRejectClick();
                }}
                disabled={loading}
                className="flex-1 border border-red-500 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50 transition-colors"
              >
                Reject
              </button>
            </>
          ) : (
            <div className="flex gap-2 w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/prompt/${prompt.id}`);
                }}
                className="flex-1 border border-blue-500 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                View Details
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteDialogOpen(true);
                }}
                disabled={loading}
                className="border border-red-500 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Dialog */}
      {rejectDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()} // Prevent clicking modal from closing it if background close was implemented
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Reject Prompt</h2>
            </div>
            
            <div className="px-6 py-4">
              {error && (
                <div className="bg-red-50 text-red-800 border border-red-200 px-3 py-2 rounded text-sm mb-4">
                  {error}
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  {prompt.title}
                </h3>
                
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">Rejection Reason</label>
                  <div className="relative">
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 appearance-none bg-white"
                    >
                      <option value="" disabled>Select a reason...</option>
                      {REJECTION_REASONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {rejectionReason === 'Other' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Custom Reason</label>
                    <textarea
                      rows={3}
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Please explain the rejection reason..."
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setRejectDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium disabled:opacity-50 flex items-center transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                ) : null}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Permanently Delete Approved Prompt?
            </h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              This action cannot be undone. The prompt <span className="font-bold">"{prompt.title}"</span> and all its linked data (variables, test cases, proof items, workflow steps, metrics, and saves) will be permanently deleted from the database.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteApprovedConfirm}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                ) : null}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
