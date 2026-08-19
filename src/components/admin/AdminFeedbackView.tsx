/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Admin Feedback View component.
 * Dedicated dashboard section for administrators to view, filter, search, and manage user feedback.
 */

import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Bug,
  Lightbulb,
  UserX,
  Star,
  Search,
  Filter,
  Calendar,
  Eye,
  RefreshCw,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import {
  FeedbackFilters,
  FeedbackItem,
  FeedbackStatus,
  FeedbackSummaryMetrics,
  FeedbackType,
} from '../../types';
import { getAdminFeedback, getFeedbackSummaryMetrics } from '../../lib/feedbackService';
import FeedbackDetailModal from './FeedbackDetailModal';

export default function AdminFeedbackView() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [metrics, setMetrics] = useState<FeedbackSummaryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<FeedbackFilters>({
    search: '',
    status: 'all',
    type: 'all',
    rating: 'all',
    authFilter: 'all',
    startDate: '',
    endDate: '',
    sortBy: 'newest',
  });

  useEffect(() => {
    loadFeedbackData();
  }, [filters]);

  const loadFeedbackData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, summaryMetrics] = await Promise.all([
        getAdminFeedback(filters),
        getFeedbackSummaryMetrics(),
      ]);
      setItems(data);
      setMetrics(summaryMetrics);
    } catch (err) {
      console.error('[AdminFeedbackView] Error loading feedback data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feedback records.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = (item: FeedbackItem) => {
    setSelectedFeedback(item);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedFeedback(null);
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
    <div className="space-y-6">
      {/* Top Summary Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total</span>
              <MessageSquare className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-neutral-900 dark:text-white">{metrics.total}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">New</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.newCount}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Bugs</span>
              <Bug className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-black text-red-600 dark:text-red-400">{metrics.bugsCount}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Features</span>
              <Lightbulb className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {metrics.featureRequestsCount}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Anonymous</span>
              <UserX className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-2xl font-black text-neutral-700 dark:text-neutral-300">
              {metrics.anonymousCount}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Avg Rating</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div className="text-2xl font-black text-neutral-900 dark:text-white">
              {metrics.averageRating !== null ? `${metrics.averageRating} / 5` : 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search user, email, or feedback message..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />
          </div>

          {/* Sort selector */}
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="rating_desc">Sort: Highest Rating</option>
            <option value="rating_asc">Sort: Lowest Rating</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={loadFeedbackData}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
            title="Refresh Feedback Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Secondary Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-700/60">
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="improvement">Improvement</option>
              <option value="general">General</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Auth State Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Submission Type
            </label>
            <select
              value={filters.authFilter}
              onChange={(e) => setFilters((prev) => ({ ...prev, authFilter: e.target.value as any }))}
              className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="all">All Submissions</option>
              <option value="authenticated">Authenticated Users</option>
              <option value="anonymous">Anonymous</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Rating
            </label>
            <select
              value={filters.rating}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  rating: e.target.value === 'all' ? 'all' : Number(e.target.value),
                }))
              }
              className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Feedback Data Table */}
      <div className="bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 rounded-2xl shadow-sm overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-neutral-200 border-t-purple-600" />
            <p className="text-xs text-neutral-500 font-medium">Loading feedback records...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-400">
              <Inbox className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">No feedback yet</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm">
                User feedback will appear here once submitted. Try adjusting your filters if expecting records.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-700/60 text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Feedback Preview</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/40 text-xs">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenDetail(item)}
                    className="hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-colors cursor-pointer group"
                  >
                    {/* User */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.is_anonymous || !item.author ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-md">
                          <UserX className="w-3.5 h-3.5" />
                          <span>Anonymous</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-xs border border-purple-200 dark:border-purple-800">
                            {item.author.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {item.author.name}
                            </div>
                            {item.author.handle && (
                              <div className="text-[10px] text-neutral-400">{item.author.handle}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getTypeBadgeColor(
                          item.type,
                        )}`}
                      >
                        {item.type}
                      </span>
                    </td>

                    {/* Message Preview */}
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md truncate text-neutral-800 dark:text-neutral-200 font-normal">
                      {item.message}
                    </td>

                    {/* Rating */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-neutral-800 dark:text-neutral-200">
                            {item.rating}
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral-400 font-mono">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize border ${getStatusBadgeColor(
                          item.status,
                        )}`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(item);
                        }}
                        className="p-1.5 rounded-lg text-neutral-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <FeedbackDetailModal
        feedback={selectedFeedback}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onUpdate={loadFeedbackData}
      />
    </div>
  );
}
