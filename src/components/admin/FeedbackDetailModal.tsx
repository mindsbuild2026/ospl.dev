/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Admin Feedback Detail Modal component.
 * Allows administrators to inspect full details, update status, and manage internal admin notes.
 */

import React, { useState } from 'react';
import {
  X,
  Star,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Archive,
  RotateCcw,
  Sparkles,
  FileText,
  Save,
  Loader2,
} from 'lucide-react';
import { FeedbackItem, FeedbackStatus } from '../../types';
import { updateFeedbackStatus, updateFeedbackNotes } from '../../lib/feedbackService';

interface FeedbackDetailModalProps {
  feedback: FeedbackItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function FeedbackDetailModal({
  feedback,
  isOpen,
  onClose,
  onUpdate,
}: FeedbackDetailModalProps) {
  if (!isOpen || !feedback) return null;

  const [notes, setNotes] = useState(feedback.admin_notes || '');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: FeedbackStatus) => {
    setIsUpdatingStatus(true);
    setError(null);
    try {
      const res = await updateFeedbackStatus(feedback.id, newStatus, notes);
      if (res.success) {
        onUpdate();
        onClose();
      } else {
        setError(res.error || 'Failed to update status.');
      }
    } catch (err) {
      console.error('[FeedbackDetailModal] Error updating status:', err);
      setError('An error occurred while updating status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    setError(null);
    setNotesSavedSuccess(false);
    try {
      const res = await updateFeedbackNotes(feedback.id, notes);
      if (res.success) {
        setNotesSavedSuccess(true);
        onUpdate();
        setTimeout(() => setNotesSavedSuccess(false), 3000);
      } else {
        setError(res.error || 'Failed to save admin notes.');
      }
    } catch (err) {
      console.error('[FeedbackDetailModal] Error saving notes:', err);
      setError('An error occurred while saving notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'bug':
        return 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'feature':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'improvement':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'general':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'resolved':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'archived':
        return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
      default:
        return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getTypeBadgeColor(
                feedback.type,
              )}`}
            >
              {feedback.type.replace('_', ' ')}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border ${getStatusBadgeColor(
                feedback.status,
              )}`}
            >
              {feedback.status.replace('_', ' ')}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* User Info Metadata Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 text-xs">
            <div className="space-y-1.5">
              <div className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">Submitted By</div>
              {feedback.is_anonymous || !feedback.author ? (
                <div className="flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300">
                  <UserX className="w-4 h-4 text-neutral-400" />
                  <span>Anonymous User</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100">
                  <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>{feedback.author.name || 'Identified User'}</span>
                  {feedback.author.handle && (
                    <span className="text-neutral-400 font-normal">({feedback.author.handle})</span>
                  )}
                </div>
              )}
            </div>

            {/* Optional Contact Email */}
            <div className="space-y-1.5">
              <div className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">Contact Email</div>
              {feedback.contact_email ? (
                <div className="flex items-center gap-2 font-medium text-neutral-800 dark:text-neutral-200">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <a href={`mailto:${feedback.contact_email}`} className="hover:underline text-blue-600 dark:text-blue-400">
                    {feedback.contact_email}
                  </a>
                </div>
              ) : (
                <span className="text-neutral-400 italic">None provided</span>
              )}
            </div>

            {/* Rating */}
            <div className="space-y-1.5">
              <div className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">Rating</div>
              {feedback.rating ? (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= (feedback.rating || 0)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-neutral-300 dark:text-neutral-700'
                      }`}
                    />
                  ))}
                  <span className="ml-1 font-bold text-neutral-900 dark:text-neutral-100">
                    {feedback.rating} / 5
                  </span>
                </div>
              ) : (
                <span className="text-neutral-400 italic">No rating given</span>
              )}
            </div>

            {/* Timestamps */}
            <div className="space-y-1.5">
              <div className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">Submitted Date</div>
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-medium">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <span>{new Date(feedback.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Feedback Message */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
              Full Feedback Message
            </label>
            <div className="p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap leading-relaxed shadow-inner">
              {feedback.message}
            </div>
          </div>

          {/* Admin Notes Section */}
          <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <label htmlFor="admin-notes" className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Admin Notes</span>
              </label>
              {notesSavedSuccess && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>
            <textarea
              id="admin-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal moderator notes, resolution steps, or action items..."
              className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/50 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSavingNotes ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Notes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Actions Footer */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-900/80 border-t border-neutral-100 dark:border-neutral-800 shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Set Status:
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {feedback.status !== 'reviewed' && (
              <button
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange('reviewed')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Mark Reviewed
              </button>
            )}

            {feedback.status !== 'in_progress' && (
              <button
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange('in_progress')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Mark In Progress
              </button>
            )}

            {feedback.status !== 'resolved' && (
              <button
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange('resolved')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Resolved</span>
              </button>
            )}

            {feedback.status !== 'archived' ? (
              <button
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange('archived')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive</span>
              </button>
            ) : (
              <button
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange('reviewed')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
