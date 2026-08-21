/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { copyTextToClipboard } from "../lib/clipboardService";
import {
  Category,
  CollectionSummary,
  Contributor,
  FilterOptions,
  PromptCard,
} from "../types";
import {
  formatCompactNumber,
  getPlatformCode,
  getPrimaryPlatform,
} from "../lib/promptSchema";
import {
  Search,
  ArrowRight,
  Copy,
  Check,
  Eye,
  Sparkles,
  Brain,
  CheckCircle,
  RotateCcw,
  Lightbulb,
  TrendingUp,
  MousePointer,
  X,
  Heart,
  Plus,
} from "lucide-react";
import { useDebouncedCallback } from "../hooks/useDebounce";

// Import newly created modular sub-components
import HeroStats from "./HeroStats";
import PromptOfTheDay from "./PromptOfTheDay";
import FeaturedCollections from "./FeaturedCollections";
import TrendingToday from "./TrendingToday";
import LatestCommunityPrompts from "./LatestCommunityPrompts";
import LeaderboardPromo from "./LeaderboardPromo";
import OpenSourcePromo from "./OpenSourcePromo";
import NewsletterSubscribe from "./NewsletterSubscribe";
import WhyPromptHub from "./WhyPromptHub";
import PromptCardItem from "./PromptCardItem";
import { EmptyState } from "./shared";

interface ExploreViewProps {
  prompts: PromptCard[];
  categories: Category[];
  collections: CollectionSummary[];
  filterOptions: FilterOptions;
  contributors: Contributor[];
  isLoading: boolean;
  onPromptClick: (id: string) => void;
  onOpenCollection: (collectionId: string) => void;
  savedPromptIds: string[];
  toggleSavePrompt: (id: string) => void;
  isAuthenticated: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategoryFilter: string | null;
  setSelectedCategoryFilter: (category: string | null) => void;
  loadMorePrompts?: () => void;
}

export default function ExploreView({
  prompts,
  categories,
  collections,
  filterOptions,
  contributors,
  isLoading,
  onPromptClick,
  savedPromptIds,
  toggleSavePrompt,
  isAuthenticated,
  searchQuery,
  setSearchQuery,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  onOpenCollection,
  loadMorePrompts,
}: ExploreViewProps) {
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState(searchQuery || "");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollToResults = useCallback(() => {
    setTimeout(() => {
      const el = document.getElementById("explore_list");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  }, []);

  // Sync local input state when searchQuery prop changes (e.g. from Header or URL sync)
  useEffect(() => {
    setLocalSearch(searchQuery || "");
  }, [searchQuery]);

  // Debounce search query update to prevent excessive API calls and flickering
  const debouncedSetSearchQuery = useDebouncedCallback((query: string) => {
    setSearchQuery(query);
  }, 300);

  // Close search suggestions overlay when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Infinite scroll observer: call loadMorePrompts when sentinel enters view
  useEffect(() => {
    if (!loadMorePrompts) return;
    const sentinel = document.getElementById("infinite-scroll-sentinel");
    if (!sentinel) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadMorePrompts();
        }
      });
    });

    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [loadMorePrompts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    setIsSearchFocused(false);
    scrollToResults();
  };

  const handleCopy = async (e: React.MouseEvent, id: string, text: string) => {
    e.stopPropagation();
    const success = await copyTextToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleTagClick = (tag: string) => {
    setLocalSearch("");
    const category = categories.find(
      (item) =>
        item.name.toLowerCase() === tag.toLowerCase() ||
        item.slug.toLowerCase() === tag.toLowerCase(),
    );
    if (category) {
      setSelectedCategoryFilter(category.name);
      setSearchQuery("");
    } else {
      setSearchQuery(tag);
      setSelectedCategoryFilter(null);
    }
    setIsSearchFocused(false);
  };

  const handleReset = () => {
    setLocalSearch("");
    setSearchQuery("");
    setSelectedCategoryFilter(null);
  };

  // Determine prompt filter matches
  const isSavedView = searchQuery === "saved_items_filter_special";

  const filteredPrompts = prompts.filter((prompt) => {
    if (isSavedView) {
      return savedPromptIds.includes(prompt.id);
    }

    const matchesSearch = searchQuery
      ? prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.shortDescription
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      prompt.subCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.aiPlatforms.some((platform) =>
        platform.toLowerCase().includes(searchQuery.toLowerCase()),
      ) ||
      prompt.author.handle
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      prompt.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      : true;

    const matchesCategory = selectedCategoryFilter
      ? prompt.category.toLowerCase() === selectedCategoryFilter.toLowerCase()
      : true;

    return matchesSearch && matchesCategory;
  });

  // Hot keywords for instant suggestions overlay
  const popularSearches = prompts.slice(0, 4).map((prompt) => prompt.title);
  const trendingKeywords = filterOptions.tags.slice(0, 6);
  const trendingCategories = categories
    .slice(0, 4)
    .map((category) => category.name);

  // Dynamic matching autocomplete values
  const suggestionsMatch = localSearch.trim()
    ? prompts
      .filter(
        (p) =>
          p.title.toLowerCase().includes(localSearch.toLowerCase()) ||
          p.category.toLowerCase().includes(localSearch.toLowerCase()) ||
          p.tags.some((t) =>
            t.toLowerCase().includes(localSearch.toLowerCase()),
          ),
      )
      .slice(0, 4)
    : [];

  const getCategoryTheme = (category: string) => {
    const lower = category.toLowerCase();
    if (lower === "coding" || lower === "development") {
      return "bg-purple-100/50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-305 border border-purple-200/20";
    }
    if (lower === "creative" || lower === "midjourney" || lower === "design") {
      return "bg-pink-100/50 text-pink-700 dark:bg-pink-905/30 dark:text-pink-300 border border-pink-200/20";
    }
    return "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 border border-transparent";
  };

  // Check if we are showing default home state vs active search-results/filtered grid view
  const isBrowsingNormalHome = !searchQuery && !selectedCategoryFilter;

  return (
    <div className="w-full relative transition-colors duration-300 dark:bg-[#09090b]">
      {/* 1. Hero / Search Area with Concentric Orbital Rings */}
      <section
        className="relative w-full min-h-[600px] md:min-h-[720px] flex flex-col items-center justify-center px-4 md:px-8 overflow-hidden pt-20 md:pt-28 pb-14 md:pb-24 border-b border-neutral-100/80 dark:border-neutral-900/40 select-none transition-colors duration-500 bg-white dark:bg-neutral-950"
        style={{
          backgroundImage:
            "radial-gradient(circle at top, rgba(139, 92, 246, 0.15) 0%, rgba(244, 63, 94, 0.03) 35%, transparent 70%)",
          backgroundSize: "100% 100%",
        }}
      >
        {/* Decorative High-fidelity Glows */}
        <div
          className="absolute top-[10%] left-[12%] w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none dark:bg-indigo-500/5 animate-pulse"
          style={{ animationDuration: "12s" }}
        />
        <div
          className="absolute top-[20%] right-[12%] w-[350px] h-[350px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none dark:bg-fuchsia-500/5 animate-pulse"
          style={{ animationDuration: "8s" }}
        />

        {/* Concentric Orbital Rings background elements */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center select-none">
          <div className="absolute w-[530px] md:w-[730px] h-[530px] md:h-[730px] rounded-full border border-neutral-200/20 dark:border-neutral-800/20 opacity-80" />
          <div
            className="absolute w-[360px] md:w-[480px] h-[360px] md:h-[480px] rounded-full border border-dashed border-neutral-300/30 dark:border-neutral-700/30 animate-spin opacity-60"
            style={{ animationDuration: "120s" }}
          />
          <div className="absolute w-[220px] md:w-[300px] h-[220px] md:h-[300px] rounded-full border border-neutral-200/40 dark:border-neutral-800/40 opacity-70" />

          {/* Floating Badges with floating animations */}
          <div
            className="absolute top-[22%] left-[14%] md:left-[22%] p-3.5 bg-white/70 dark:bg-neutral-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10 rounded-2xl shadow-xl shadow-indigo-500/5 z-10 animate-bounce hidden sm:flex items-center justify-center backdrop-blur-lg"
            style={{ animationDuration: "5s" }}
          >
            <Brain className="w-5.5 h-5.5 animate-pulse" />
          </div>

          <div
            className="absolute top-[16%] right-[16%] md:right-[20%] p-3.5 bg-white/70 dark:bg-neutral-900/60 text-fuchsia-500 dark:text-fuchsia-400 border border-fuchsia-500/10 rounded-2xl shadow-xl shadow-fuchsia-500/5 z-10 animate-bounce hidden sm:flex items-center justify-center backdrop-blur-lg"
            style={{ animationDuration: "7s" }}
          >
            <Sparkles className="w-5.5 h-5.5" />
          </div>

          <div
            className="absolute bottom-[26%] right-[10%] md:right-[18%] p-3.5 bg-white/70 dark:bg-neutral-900/60 text-emerald-500 dark:text-emerald-400 border border-emerald-500/10 rounded-2xl shadow-xl shadow-emerald-500/5 z-10 animate-pulse hidden sm:flex items-center justify-center backdrop-blur-lg"
            style={{ animationDuration: "4s" }}
          >
            <CheckCircle className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-6 md:gap-8 mt-2 w-full px-2">
          {/* Glowing Pill Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 dark:border-emerald-400/20 bg-emerald-50/60 dark:bg-emerald-950/20 backdrop-blur-md shadow-[0_4px_20px_rgba(16,185,129,0.08)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
              Community Driven & Free Forever
            </span>
          </div>

          {/* Heading with Elegant Multi-gradient Typography */}
          <div className="space-y-4 md:space-y-6">
            <h2 className="font-display text-4xl sm:text-6xl md:text-7.5xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 leading-[1.05]">
              The Free,{" "}
              <span className="bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500 bg-clip-text text-transparent drop-shadow-sm">
                Open-Source
              </span>{" "}
              <br />
              <span className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 dark:from-neutral-50 dark:via-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">
                Prompt Library for Everyone.
              </span>
            </h2>
            <p className="font-sans text-sm sm:text-base md:text-lg text-neutral-500 dark:text-neutral-400 max-w-2.5xl mx-auto leading-relaxed mt-4 px-2">
              Access community-tested prompts, workflows, and production blueprints across leading AI models.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('explore_list');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="bg-brand-accent hover:bg-brand-accent-hover text-white px-7 py-3.5 rounded-full font-sans font-bold text-sm tracking-wide transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer border-0"
              >
                <Search className="w-4 h-4" />
                <span>Browse Prompts</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/submit')}
                className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 px-7 py-3.5 rounded-full font-sans font-bold text-sm tracking-wide transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer border-0"
              >
                <Plus className="w-4 h-4" />
                <span>Submit a Prompt</span>
              </button>
            </div>
          </div>

          {/* Search Field Box Stadium Capsule shape with Suggestion Dropdowns */}
          <div
            ref={searchContainerRef}
            className="w-full max-w-3xl px-2 sm:px-4 mt-2 relative"
          >
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative flex items-center p-1.5 sm:p-2 bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/70 dark:border-neutral-800/60 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all duration-500 backdrop-blur-xl">
                {/* <div className="hidden lg:flex items-center pl-6 pr-2 text-neutral-400 select-none">
                  <span className="text-[13px] font-mono tracking-wide text-indigo-500 dark:text-indigo-400 font-semibold whitespace-nowrap">
                    "Act as a CTO..."
                  </span>
                </div> */}

                <Search className="text-neutral-400/80 ml-3 sm:ml-4 w-5 h-5 shrink-0" />

                <input
                  type="text"
                  placeholder="Search prompts, platform, tags, keywords..."
                  value={localSearch}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLocalSearch(value);
                    setIsSearchFocused(true);
                    // Use debounced callback to avoid flickering from excessive API calls
                    debouncedSetSearchQuery(value);
                  }}
                  className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-neutral-800 dark:text-neutral-100 font-sans text-sm sm:text-[15px] px-2 sm:px-4 placeholder:text-neutral-400 rounded-full h-10 sm:h-12 min-w-0"
                />

                {localSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSearch("");
                      setSearchQuery("");
                    }}
                    className="mr-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="submit"
                  className="bg-neutral-900 hover:bg-brand-accent text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-indigo-500 dark:hover:text-white px-5 sm:px-8 h-10 sm:h-12 rounded-full font-sans font-bold text-xs sm:text-[13px] tracking-wide transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 shadow-sm active:scale-95 hover:shadow-lg hover:shadow-indigo-500/10"
                >
                  <span className="hidden sm:inline">Search</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Instant Search Suggestions Popover Panel */}
            {isSearchFocused && (
              <div
                id="search-suggestions-container"
                className="absolute top-full left-0 right-0 mt-3 mx-2 sm:mx-4 bg-white/95 dark:bg-neutral-950/95 border border-neutral-200/80 dark:border-neutral-800/80 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 p-5 overflow-hidden text-left divide-y divide-neutral-100 dark:divide-neutral-800/80 select-all backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-300"
              >
                {/* Condition A: No search criteria typed yet */}
                {!localSearch.trim() ? (
                  <div className="space-y-5">
                    {/* Popular Searches */}
                    <div>
                      <span className="font-sans text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                        <Lightbulb className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        <span>Popular Searches</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {popularSearches.map((q) => (
                          <div
                            key={q}
                            onClick={() => {
                              setLocalSearch(q);
                              setSearchQuery(q);
                              setIsSearchFocused(false);
                              scrollToResults();
                            }}
                            className="text-xs sm:text-[13px] font-sans font-medium text-neutral-600 dark:text-neutral-350 hover:text-indigo-600 dark:hover:text-indigo-400 p-2.5 hover:bg-neutral-50/80 dark:hover:bg-neutral-900/30 rounded-xl cursor-pointer flex items-center gap-2 transition-all"
                          >
                            <MousePointer className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span>{q}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trending keywords lists */}
                    <div className="pt-4">
                      <span className="font-sans text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                        <TrendingUp className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                        <span>Trending Keywords</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {trendingKeywords.map((kw) => (
                          <button
                            key={kw}
                            onClick={() => {
                              setLocalSearch(kw);
                              setSearchQuery(kw);
                              setIsSearchFocused(false);
                              scrollToResults();
                            }}
                            className="px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-brand-accent hover:text-white dark:bg-neutral-850 dark:text-neutral-300 dark:hover:bg-indigo-500 dark:hover:text-white font-sans text-xs font-semibold cursor-pointer transition-all border-0 shadow-sm active:scale-95"
                          >
                            #{kw}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1">
                    <span className="font-sans text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                      <span>Instant matches ({suggestionsMatch.length})</span>
                    </span>

                    {suggestionsMatch.length === 0 ? (
                      <p className="text-xs font-sans text-neutral-450 dark:text-neutral-500 py-3 text-center">
                        No immediate match names. Press entry or search button
                        to query deep database content.
                      </p>
                    ) : (
                      <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
                        {suggestionsMatch.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setIsSearchFocused(false);
                              onPromptClick(p.id);
                            }}
                            className="p-3 hover:bg-neutral-50/80 dark:hover:bg-neutral-900/30 rounded-xl flex items-center justify-between cursor-pointer transition-all border border-transparent hover:border-neutral-100 dark:hover:border-neutral-800/40"
                          >
                            <div className="space-y-0.5">
                              <h5 className="font-sans text-xs sm:text-[14px] font-bold text-neutral-800 dark:text-neutral-150">
                                {p.title}
                              </h5>
                              <p className="font-sans text-[11px] text-neutral-400 dark:text-neutral-500">
                                in {p.category} by {p.author.name}
                              </p>
                            </div>
                            <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md border border-indigo-100/30 dark:border-indigo-900/20 font-medium">
                              {getPlatformCode(p)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Call To Action Button Hierarchy */}
          {/* <div className="flex items-center gap-3.5 mt-2 z-10 flex-wrap justify-center">
            <button
              onClick={() => {
                const exploreEl = document.getElementById("explore_list");
                if (exploreEl) {
                  exploreEl.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="px-6 py-3 bg-neutral-950 text-white hover:bg-brand-accent dark:bg-white dark:text-neutral-950 dark:hover:bg-indigo-500 dark:hover:text-white rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-indigo-500/10 active:scale-95 cursor-pointer"
            >
              Browse Database
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all duration-300 bg-white/50 backdrop-blur-sm shadow-sm active:scale-95 cursor-pointer"
            >
              Reset Filters
            </button>
          </div> */}

          {/* Trending Searches Row */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 px-4 z-10">
            <span className="text-[10px] sm:text-[11px] text-neutral-400 dark:text-neutral-500 font-bold tracking-wider mr-1 sm:mr-2 uppercase">
              Trending Categories:
            </span>
            {trendingCategories.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="px-3.5 py-1.5 rounded-full border border-neutral-200/70 dark:border-neutral-800/60 hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-400 dark:hover:text-indigo-400 text-[11px] sm:text-xs font-semibold text-neutral-600 dark:text-neutral-300 bg-white/50 dark:bg-neutral-900/30 hover:bg-white dark:hover:bg-neutral-900 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Core Stat numbers container located elegantly below Search Capsule */}
          <div className="w-full mt-2">
            <HeroStats prompts={prompts} categoriesCount={categories.length} />
          </div>
        </div>
      </section>

      {/* Conditional Homepage layout injection */}
      {isBrowsingNormalHome && (
        <>
          {/* A. Featured collections grouping folders */}
          <FeaturedCollections
            prompts={prompts}
            collections={collections}
            onOpenCollection={onOpenCollection}
          />

          {/* Premium Overview Section */}
          <WhyPromptHub />

          {/* B. Prompt of the Day Highlight Section */}
          <section className="pt-16 px-4 md:px-8 max-w-7xl mx-auto relative z-10 selection:bg-brand-accent selection:text-white">
            <PromptOfTheDay
              prompts={prompts}
              onPromptClick={onPromptClick}
              savedPromptIds={savedPromptIds}
              toggleSavePrompt={toggleSavePrompt}
              isAuthenticated={isAuthenticated}
            />
          </section>

          {/* C. Trending lists tabs container with dynamically sorted prompts */}
          <TrendingToday
            mostCopiedPrompts={[...prompts].sort((a, b) => b.stats.copies - a.stats.copies).slice(0, 6)}
            fastestGrowingPrompts={[...prompts].sort((a, b) => (b.engagement?.trendingScore || 0) - (a.engagement?.trendingScore || 0) || b.stats.views - a.stats.views).slice(0, 6)}
            highestRatedPrompts={[...prompts].sort((a, b) => (b.stats.ratingCount > 0 ? b.stats.rating : 0) - (a.stats.ratingCount > 0 ? a.stats.rating : 0) || b.stats.copies - a.stats.copies).slice(0, 6)}
            newestPrompts={[...prompts].sort((a, b) => new Date(b.stats.updated).getTime() - new Date(a.stats.updated).getTime()).slice(0, 6)}
            onPromptClick={onPromptClick}
          />

          {/* D. Latest human activities and timeline changes feeds */}
          <LatestCommunityPrompts
            prompts={prompts}
            onPromptClick={onPromptClick}
          />

          {/* E. Ratings Leaderboard section */}
          <LeaderboardPromo
            prompts={prompts}
            contributors={contributors}
            onPromptClick={onPromptClick}
          />

          {/* F. GitHub integration repository status indicators */}
          <OpenSourcePromo prompts={prompts} contributors={contributors} />
        </>
      )}

      {/* 2. Main Database List Grid - Displayed either on category filtering, search queries, or general search items */}
      <section
        id="explore_list"
        className="py-16 md:py-24 px-4 md:px-8 max-w-7xl mx-auto relative z-10 select-none"
      >
        {/* Row Heading / Filter metadata row */}
        {isLoading && (
          <div className="mb-6 text-xs font-bold uppercase tracking-wider text-brand-accent">
            Loading matching prompts from Supabase...
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h3 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-brand-text dark:text-brand-text-dark mb-2 select-none">
              {isSavedView
                ? "Your Saved Collection"
                : selectedCategoryFilter
                  ? `${selectedCategoryFilter} Hub`
                  : searchQuery
                    ? "Search Queries"
                    : "All Prompt Blueprints"}
            </h3>
            <p className="font-sans text-sm text-neutral-550 dark:text-neutral-400 leading-relaxed max-w-xl">
              {isSavedView
                ? `You have bookmarked ${filteredPrompts.length} templates in your local ledger.`
                : selectedCategoryFilter
                  ? `Filtering prompts listed inside the specialized ${selectedCategoryFilter} category.`
                  : searchQuery
                    ? `Displaying prompt search queries matchings &quot;${searchQuery}&quot;.`
                    : "Browse through our full ecosystem of open-concept instructions."}
            </p>
          </div>

          {/* Active clear breadcrumbs button */}
          {(selectedCategoryFilter || searchQuery) && (
            <button
              onClick={handleReset}
              className="px-4.5 py-2 border border-neutral-200 dark:border-neutral-805 hover:border-brand-accent text-neutral-700 dark:text-neutral-300 text-xs font-mono font-bold rounded-full flex items-center gap-2 transition-colors cursor-pointer hover:text-brand-accent active:scale-95 bg-white dark:bg-neutral-900"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>CLEAR FILTERS</span>
            </button>
          )}
        </div>

        {/* Empty state list */}
        {filteredPrompts.length === 0 ? (
          <div className="w-full py-20 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/50">
            <span className="text-4xl text-neutral-300 dark:text-neutral-700 font-mono">
              ∅
            </span>
            <h4 className="text-base font-bold text-brand-text dark:text-brand-text-dark mt-4 mb-1">
              No Matches Found
            </h4>
            <p className="text-xs text-neutral-450 dark:text-neutral-550 max-w-sm mx-auto leading-relaxed">
              We couldn&apos;t find any records matching &quot;
              {searchQuery || selectedCategoryFilter}&quot;. Try adjusting
              filters.
            </p>
            <button
              onClick={handleReset}
              className="mt-6 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black font-sans text-xs font-bold uppercase tracking-wide rounded-full cursor-pointer hover:bg-brand-accent hover:text-white transition-colors shadow-sm"
            >
              Reset Database Filters
            </button>
          </div>
        ) : (
          <>
            {/* Cards Grid Wrapper with dynamic grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPrompts.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState
                    type="no-search-results"
                    action={{
                      label: 'Reset Filters',
                      onClick: handleReset
                    }}
                  />
                </div>
              ) : (
                filteredPrompts.map((prompt) => (
                  <PromptCardItem
                    key={prompt.id}
                    prompt={prompt}
                    onPromptClick={onPromptClick}
                    isSaved={savedPromptIds.includes(prompt.id)}
                    toggleSavePrompt={toggleSavePrompt}
                    isAuthenticated={isAuthenticated}
                    onCopy={(id, copyText) => handleCopy({ stopPropagation: () => {} } as any, id, copyText)}
                  />
                ))
              )}
            </div>
            {/* Infinite scroll sentinel */}
            <div id="infinite-scroll-sentinel" className="w-full mt-8" />
          </>
        )}
      </section>

      {/* G. Weekly newsletter subscribe card */}
      {isBrowsingNormalHome && (
        <NewsletterSubscribe
          totalCopies={prompts.reduce((total, p) => total + p.stats.copies, 0)}
        />
      )}
    </div>
  );
}
