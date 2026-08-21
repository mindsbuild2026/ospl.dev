/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { copyTextToClipboard } from '../lib/clipboardService';
import {
  Sparkles,
  Check,
  Plus,
  Heart,
  User,
  Copy,
  Eye,
  ArrowUpRight,
  Globe,
  Github,
  Award,
  BookOpen,
  ArrowLeft,
  Settings,
  PlusCircle,
  ExternalLink,
  Clock,
  X,
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { LookupAuthor, PromptCard } from '../types';

interface DashboardViewProps {
  user: SupabaseUser | null;
  author: LookupAuthor | null;
  prompts: PromptCard[];
  userSubmissions?: PromptCard[];
  savedPrompts: PromptCard[];
  savedPromptIds: string[];
  toggleSavePrompt: (id: string) => void;
  onPromptClick: (id: string) => void;
  onEditProfile: () => void;
  onSubmitPromptClick: () => void;
  onExploreClick: () => void;
}

export default function DashboardView({
  user,
  author,
  prompts,
  userSubmissions,
  savedPrompts,
  savedPromptIds,
  toggleSavePrompt,
  onPromptClick,
  onEditProfile,
  onSubmitPromptClick,
  onExploreClick,
}: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'submissions' | 'bookmarks'>('submissions');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fallback if not logged in
  if (!user || !author) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent/10 text-brand-accent border border-brand-accent/20 mx-auto mb-6">
          <Award className="h-8 w-8 animate-bounce" />
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-brand-text dark:text-white">Access Denied</h2>
        <p className="text-sm text-neutral-500 mt-3 max-w-sm mx-auto">Please sign in with your GitHub account to access the creator dashboard.</p>
        <button
          onClick={onExploreClick}
          className="mt-8 px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-full font-sans text-xs font-bold uppercase tracking-wider transition-colors hover:bg-brand-accent hover:text-white cursor-pointer"
        >
          Back to Explore
        </button>
      </div>
    );
  }

  // Filter user's own prompts or use userSubmissions from context
  const normalizeHandle = (h: string) => h.toLowerCase().replace(/^@/, '');
  const submissionsList = (userSubmissions && userSubmissions.length > 0)
    ? userSubmissions
    : prompts.filter(
        (prompt) =>
          prompt.author &&
          normalizeHandle(prompt.author.handle) === normalizeHandle(author.handle)
      );

  // Handle clipboard copy
  const handleCopy = async (e: React.MouseEvent, id: string, text: string) => {
    e.stopPropagation();
    const success = await copyTextToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Helper formatting values
  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const getCategoryTheme = (category: string) => {
    const norm = category.toLowerCase();
    if (norm.includes('writing') || norm.includes('copywriting')) {
      return 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-300';
    }
    if (norm.includes('coding') || norm.includes('development') || norm.includes('programming')) {
      return 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300';
    }
    if (norm.includes('image') || norm.includes('art') || norm.includes('design')) {
      return 'bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-300';
    }
    if (norm.includes('marketing') || norm.includes('seo') || norm.includes('business')) {
      return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300';
    }
    return 'bg-neutral-50 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300';
  };

  // Total stats from user's prompts
  const totalViews = userSubmissions.reduce((acc, curr) => acc + (curr.stats?.views || 0), 0);
  const totalCopies = userSubmissions.reduce((acc, curr) => acc + (curr.stats?.copies || 0), 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-8 py-8 md:py-12 flex-1 flex flex-col justify-start">
      {/* Upper Navigation Row */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onExploreClick}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-brand-text dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore</span>
        </button>

        <div className="flex items-center gap-1.5 bg-brand-accent/5 dark:bg-brand-accent/10 px-3 py-1 rounded-full border border-brand-accent/15">
          <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
          <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">Creator Center</span>
        </div>
      </div>

      {/* Creator Header Profile Card */}
      <div className="relative overflow-hidden rounded-[32px] border border-neutral-200/50 bg-white/80 p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] dark:border-neutral-800/80 dark:bg-neutral-900/40 backdrop-blur-md mb-8">
        {/* Decorative background glows */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-550/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          {/* Avatar and bio details */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative shrink-0 select-none">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-brand-accent p-0.5 shadow-md bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center">
                {author.avatar_url ? (
                  <img
                    src={author.avatar_url}
                    alt={author.name}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(author.name || 'User')}`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-brand-accent/20 to-purple-500/20 text-brand-text dark:text-white flex items-center justify-center font-display font-black text-xl">
                    {author.name?.slice(0, 2).toUpperCase() || 'CR'}
                  </div>
                )}
              </div>
              {author.verified && (
                <span className="absolute bottom-0 right-0 p-1 bg-emerald-500 text-white rounded-full border-2 border-white dark:border-neutral-900" title="Verified Creator">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-2xl font-black text-neutral-900 dark:text-white tracking-tight">{author.name}</h3>
                {author.is_admin === true && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                    Admin
                  </span>
                )}
                {author.reputation >= 100 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Award className="w-3 h-3" /> Pro Creator
                  </span>
                )}
              </div>
              <p className="font-mono text-xs text-neutral-400 mt-0.5">@{author.handle}</p>
              {author.bio && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 max-w-md italic">
                  "{author.bio}"
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                {author.website && (
                  <a
                    href={author.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-brand-accent transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website</span>
                  </a>
                )}
                {author.github && (
                  <a
                    href={author.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-brand-accent transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onEditProfile}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Edit Profile
            </button>
            <button
              onClick={onSubmitPromptClick}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-accent text-white text-xs font-bold hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Prompt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Creator Analytics Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 select-none">
        <div className="rounded-2xl border border-neutral-200/50 bg-white/60 p-5 shadow-sm dark:border-neutral-800/60 dark:bg-neutral-900/20 backdrop-blur-sm">
          <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-450 dark:text-neutral-500">Reputation Score</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-brand-text dark:text-white">{author.reputation}</span>
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200/50 bg-white/60 p-5 shadow-sm dark:border-neutral-800/60 dark:bg-neutral-900/20 backdrop-blur-sm">
          <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-450 dark:text-neutral-500">Submitted Blueprints</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-900 dark:text-white">{submissionsList.length}</span>
            <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200/50 bg-white/60 p-5 shadow-sm dark:border-neutral-800/60 dark:bg-neutral-900/20 backdrop-blur-sm">
          <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-450 dark:text-neutral-500">Total Blueprint Views</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-900 dark:text-white">{formatNumber(totalViews)}</span>
            <Eye className="w-4 h-4 text-purple-500 shrink-0" />
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200/50 bg-white/60 p-5 shadow-sm dark:border-neutral-800/60 dark:bg-neutral-900/20 backdrop-blur-sm">
          <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-450 dark:text-neutral-500">Blueprint Copies</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-900 dark:text-white">{formatNumber(totalCopies)}</span>
            <Copy className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
        </div>
      </div>

      {/* Tabs Filter Controls */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800/80 mb-8 select-none">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex items-center gap-2 pb-4 font-sans text-sm font-bold uppercase tracking-wider relative cursor-pointer border-0 bg-transparent transition-colors ${activeTab === 'submissions'
            ? 'text-brand-text dark:text-white font-black'
            : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>My Blueprints ({submissionsList.length})</span>
          {activeTab === 'submissions' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`ml-8 flex items-center gap-2 pb-4 font-sans text-sm font-bold uppercase tracking-wider relative cursor-pointer border-0 bg-transparent transition-colors ${activeTab === 'bookmarks'
            ? 'text-brand-text dark:text-white font-black'
            : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
        >
          <Heart className="w-4 h-4" />
          <span>Saved Prompts ({savedPromptIds.length})</span>
          {activeTab === 'bookmarks' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent rounded-full" />
          )}
        </button>
      </div>

      {/* Grid of prompts */}
      {activeTab === 'submissions' ? (
        submissionsList.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-800 py-16 px-6 text-center select-none">
            <BookOpen className="w-12 h-12 text-neutral-450 dark:text-neutral-650 mx-auto mb-4" />
            <h4 className="font-display text-lg font-bold text-neutral-900 dark:text-white">No prompt templates published</h4>
            <p className="text-xs text-neutral-500 mt-2 max-w-sm mx-auto">
              You haven't submitted any prompts to OSPL yet. Share your expert prompt engineering templates with the community.
            </p>
            <button
              onClick={onSubmitPromptClick}
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-brand-accent dark:hover:bg-brand-accent dark:hover:text-white px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Publish First Blueprint
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {submissionsList.map((prompt) => {
              const isSaved = savedPromptIds.includes(prompt.id);
              const isCopied = copiedId === prompt.id;
              const modStatus = (prompt as any).moderation?.status || (prompt as any).moderation_status || 'approved';
              
              return (
                <div
                  key={prompt.id}
                  onClick={() => onPromptClick(prompt.id)}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200/40 dark:border-neutral-800/40 shadow-sm hover:shadow-lg hover:-translate-y-1 rounded-[32px] p-6 flex flex-col group relative transition-all duration-300 cursor-pointer min-h-[300px]"
                >
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-center mb-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full font-sans text-xs font-bold uppercase tracking-wider ${getCategoryTheme(prompt.category)}`}>
                          {prompt.category}
                        </span>

                        {/* Status Badge: Pending, Published, or Rejected */}
                        {modStatus === 'pending' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        )}
                        {modStatus === 'rejected' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                            <X className="w-3 h-3" />
                            Rejected
                          </span>
                        )}
                        {modStatus === 'approved' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Published
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleCopy(e, prompt.id, `${prompt.title}\n${prompt.shortDescription}`)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${isCopied ? 'bg-brand-accent text-white' : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-450 hover:text-brand-text dark:hover:text-white'
                            }`}
                        >
                          {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => toggleSavePrompt(prompt.id)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${isSaved ? 'bg-rose-500 text-white' : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-450 hover:text-rose-500'
                            }`}
                        >
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-display text-lg font-bold text-neutral-950 dark:text-white tracking-tight mb-2 line-clamp-2 leading-snug group-hover:text-brand-accent transition-colors">
                      {prompt.title}
                    </h4>

                    <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 line-clamp-3 mb-4 leading-relaxed">
                      {prompt.shortDescription}
                    </p>

                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-850 text-[11px] text-neutral-400">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{formatNumber(prompt.stats.views)} views</span>
                      <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                      <Copy className="w-3.5 h-3.5" />
                      <span>{formatNumber(prompt.stats.copies)} copies</span>

                      <ArrowUpRight className="w-4 h-4 ml-auto text-neutral-350 dark:text-neutral-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        savedPrompts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-800 py-16 px-6 text-center select-none">
            <Heart className="w-12 h-12 text-neutral-450 dark:text-neutral-650 mx-auto mb-4" />
            <h4 className="font-display text-lg font-bold text-neutral-900 dark:text-white">No saved prompts yet</h4>
            <p className="text-xs text-neutral-500 mt-2 max-w-sm mx-auto">
              Explore OSPL's vast library of blueprints and save your favorite prompt templates for quick access.
            </p>
            <button
              onClick={onExploreClick}
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-brand-accent dark:hover:bg-brand-accent dark:hover:text-white px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-0"
            >
              Explore Prompts
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedPrompts.map((prompt) => {
              const isSaved = savedPromptIds.includes(prompt.id);
              const isCopied = copiedId === prompt.id;

              return (
                <div
                  key={prompt.id}
                  onClick={() => onPromptClick(prompt.id)}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200/40 dark:border-neutral-800/40 shadow-sm hover:shadow-lg hover:-translate-y-1 rounded-[32px] p-6 flex flex-col group relative transition-all duration-300 cursor-pointer min-h-[300px]"
                >
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-center mb-4" onClick={(e) => e.stopPropagation()}>
                      <span className={`px-3.5 py-1 rounded-full font-sans text-xs font-bold uppercase tracking-wider ${getCategoryTheme(prompt.category)}`}>
                        {prompt.category}
                      </span>

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleCopy(e, prompt.id, `${prompt.title}\n${prompt.shortDescription}`)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${isCopied ? 'bg-brand-accent text-white' : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-450 hover:text-brand-text dark:hover:text-white'
                            }`}
                        >
                          {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => toggleSavePrompt(prompt.id)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${isSaved ? 'bg-rose-500 text-white' : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-450 hover:text-rose-500'
                            }`}
                        >
                          <Heart className="w-4 h-4 fill-white" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-display text-lg font-bold text-neutral-950 dark:text-white tracking-tight mb-2 line-clamp-2 leading-snug group-hover:text-brand-accent transition-colors">
                      {prompt.title}
                    </h4>

                    <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 line-clamp-3 mb-4 leading-relaxed">
                      {prompt.shortDescription}
                    </p>

                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-850 text-[11px] text-neutral-400">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {prompt.author?.avatarUrl ? (
                          <img
                            src={prompt.author.avatarUrl}
                            alt={prompt.author.name}
                            className="w-4 h-4 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <User className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span className="truncate">{prompt.author?.name || 'Creator'}</span>
                      </div>

                      <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 ml-auto shrink-0" />
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                      <span>{formatNumber(prompt.stats.views)}</span>

                      <ArrowUpRight className="w-4 h-4 text-neutral-350 dark:text-neutral-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
