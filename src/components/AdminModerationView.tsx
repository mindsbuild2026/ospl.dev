/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModerationQueueItem, RejectedPrompt } from '../types';
import {
  getPendingPrompts,
  getApprovedPrompts,
  getRejectedPrompts,
  ModerationSort,
} from '../lib/moderationService';
import ModerationQueueCard from './ModerationQueueCard';
import RejectedPromptCard from './RejectedPromptCard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`moderation-tabpanel-${index}`}
      aria-labelledby={`moderation-tab-${index}`}
      className="animate-in fade-in duration-300"
      {...other}
    >
      {value === index && <div className="py-6">{children}</div>}
    </div>
  );
}

interface ModerationFilters {
  search: string;
  sort: ModerationSort;
}

export default function AdminModerationView() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [pendingPrompts, setPendingPrompts] = useState<ModerationQueueItem[]>([]);
  const [approvedPrompts, setApprovedPrompts] = useState<ModerationQueueItem[]>([]);
  const [rejectedPrompts, setRejectedPrompts] = useState<RejectedPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ModerationFilters>({
    search: '',
    sort: 'Newest',
  });

  useEffect(() => {
    loadPrompts();
  }, [tabValue, filters]);

  const loadPrompts = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tabValue === 0) {
        const data = await getPendingPrompts({
          search: filters.search || undefined,
          sortBy: filters.sort,
          limit: 50,
        });
        setPendingPrompts(data);
      } else if (tabValue === 1) {
        const data = await getApprovedPrompts({
          search: filters.search || undefined,
          sortBy: filters.sort,
          limit: 50,
        });
        setApprovedPrompts(data);
      } else if (tabValue === 2) {
        const data = await getRejectedPrompts({
          search: filters.search || undefined,
          sortBy: filters.sort,
          limit: 50,
        });
        setRejectedPrompts(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, sort: e.target.value as ModerationSort });
  };

  const handleTabChange = (event: React.SyntheticEvent | React.MouseEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto p-4 sm:p-8 w-full">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-400 px-4 py-3 rounded-xl mb-6 shadow-sm flex items-center gap-3" role="alert">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Panel */}
          <div className="w-full md:w-[260px] shrink-0 md:border-r border-gray-200 dark:border-gray-800 md:pr-8 pb-6 md:pb-0">
            <h2 className="font-display text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-6">
              Dashboard
            </h2>
            <div className="flex flex-col gap-3">
              {/* Modernized Admin Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-500/20 text-purple-700 dark:text-purple-300 cursor-pointer transition-all hover:shadow-md hover:bg-purple-100 dark:hover:bg-purple-900/30 group">
                <span className="font-semibold text-sm">Administration</span>
                <span className="bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-lg shadow-sm group-hover:bg-purple-700 transition-colors">
                  Admin
                </span>
              </div>
            </div>
          </div>

          {/* Main Content panel */}
          <div className="flex-1 min-w-0">
            <div className="mb-8">
              <h1 className="font-display text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                Moderation Queue
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Review, approve, and manage community prompt submissions.
              </p>
            </div>

            {/* Modern Tabs */}
            <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 mb-8 scrollbar-hide" role="tablist">
              {[
                { label: 'Pending', count: pendingPrompts.length, id: 0 },
                { label: 'Approved', count: approvedPrompts.length, id: 1 },
                { label: 'Rejected', count: rejectedPrompts.length, id: 2 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={(e) => handleTabChange(e, tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 text-sm font-medium transition-all whitespace-nowrap ${
                    tabValue === tab.id
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-500'
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-700'
                  }`}
                  role="tab"
                  aria-selected={tabValue === tab.id}
                >
                  {tab.label}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    tabValue === tab.id 
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search prompts..."
                  value={filters.search}
                  onChange={handleSearchChange}
                  className="block w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 dark:focus:ring-purple-400/50 shadow-sm transition-all"
                />
              </div>
              <div className="sm:min-w-[200px] relative">
                <select
                  value={filters.sort}
                  onChange={handleSortChange}
                  className="block w-full pl-4 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 dark:focus:ring-purple-400/50 shadow-sm transition-all appearance-none"
                >
                  <option value="Newest">Newest First</option>
                  <option value="Oldest">Oldest First</option>
                  <option value="Most Likes">Most Likes</option>
                  <option value="Most Saves">Most Saves</option>
                  {tabValue === 1 && <option value="Recently Approved">Recently Approved</option>}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-100 dark:border-gray-800 border-t-purple-600 dark:border-t-purple-400"></div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading prompts...</p>
                </div>
              ) : (
                <>
                  {/* Pending Panel */}
                  <TabPanel value={tabValue} index={0}>
                    {pendingPrompts.length === 0 ? (
                      <EmptyState message="No pending prompts to review" />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {pendingPrompts.map((prompt) => (
                          <ModerationQueueCard key={prompt.id} prompt={prompt} onUpdate={loadPrompts} />
                        ))}
                      </div>
                    )}
                  </TabPanel>

                  {/* Approved Panel */}
                  <TabPanel value={tabValue} index={1}>
                    {approvedPrompts.length === 0 ? (
                      <EmptyState message="No approved prompts found" />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {approvedPrompts.map((prompt) => (
                          <ModerationQueueCard key={prompt.id} prompt={prompt} isApproved={true} onUpdate={loadPrompts} />
                        ))}
                      </div>
                    )}
                  </TabPanel>

                  {/* Rejected Panel */}
                  <TabPanel value={tabValue} index={2}>
                    {rejectedPrompts.length === 0 ? (
                      <EmptyState message="No rejected prompts found" />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {rejectedPrompts.map((prompt) => (
                          <RejectedPromptCard key={prompt.id} prompt={prompt} onUpdate={loadPrompts} />
                        ))}
                      </div>
                    )}
                  </TabPanel>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Extracted Empty State component for reusability and cleaner code
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{message}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Check back later for new submissions.</p>
    </div>
  );
}
