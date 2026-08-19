/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { Category, FilterOptions, PromptCard } from "../types";
import { getPrimaryPlatform } from "../lib/promptSchema";
import { copyTextToClipboard } from "../lib/clipboardService";
import {
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  Eye,
  ChevronRight,
  Award,
  Flame,
  Search,
  Menu,
} from "lucide-react";
import FilterSidebar from "./FilterSidebar";
import { fetchPromptCards } from "../lib/promptRepository";

interface CategoryLandingPageProps {
  categorySlug: string;
  categories: Category[];
  filterOptions: FilterOptions;
  onPromptClick: (id: string) => void;
  onBack: () => void;
  onNavigateToCategorySlug: (slug: string) => void;
}

export default function CategoryLandingPage({
  categorySlug,
  categories,
  filterOptions,
  onPromptClick,
  onBack,
  onNavigateToCategorySlug,
}: CategoryLandingPageProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Advanced Filter state
  const [searchFilter, setSearchFilter] = useState("");
  const [sortBy, setSortBy] = useState("Trending");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [pagePrompts, setPagePrompts] = useState<PromptCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async (e: React.MouseEvent, id: string, text: string) => {
    e.stopPropagation();
    const success = await copyTextToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const normalizedSlug = categorySlug.replace("-prompts", "").toLowerCase();

  // Memoize finding the category to ensure a stable reference check
  const category = useMemo(() => {
    if (!categories || categories.length === 0) return null;
    return categories.find((item) =>
      [item.slug, item.name.toLowerCase(), item.id.toLowerCase()].includes(
        normalizedSlug,
      )
    ) || null;
  }, [categories, normalizedSlug]);

  const meta = useMemo(() => {
    return {
      title: category ? `${category.name} Prompts` : "Specialized Prompts",
      model: category?.name || "AI",
      description:
        category?.description ||
        "Explore community-curated system prompts designed for professional grade automation.",
      seoH1:
        category?.seoH1 ||
        category?.name ||
        "Specialized Generative AI System Prompts",
    };
  }, [category]);

  const serializedTags = useMemo(() => {
    return [...selectedTags].sort().join(",");
  }, [selectedTags]);

  useEffect(() => {
    // 1. BOOTSTRAPPING GUARD: If the metadata categories array is empty, we are still
    // loading the app context. Bribe out of the fetch completely to prevent null RPC payloads.
    if (!categories || categories.length === 0) {
      return;
    }

    // 2. STABLE CATEGORY RESOLUTION: Only proceed if we have actively resolved the category profile.
    if (!category) {
      return;
    }

    let cancelled = false;

    async function loadCategoryPrompts() {
      setIsLoading(true);
      setError(null);
      try {
        const tagsPayload = serializedTags ? serializedTags.split(",") : [];

        const data = await fetchPromptCards({
          categorySlug: category?.slug,
          search: searchFilter,
          tags: tagsPayload,
          sortBy,
          limit: 72,
        });

        if (!cancelled) {
          setPagePrompts(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load category prompts.",
          );
          setPagePrompts([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadCategoryPrompts();

    return () => {
      cancelled = true;
    };

    // We strictly depend on the resolved category's ID and properties, alongside metadata loading lengths.
  }, [category?.id, category?.slug, searchFilter, serializedTags, sortBy, categories.length, category]);

  const baseMatchedPrompts = pagePrompts;

  const filteredAndSortedPrompts = useMemo(() => {
    return [...baseMatchedPrompts];
  }, [baseMatchedPrompts]);

  const featured = filteredAndSortedPrompts.slice(0, 2);
  const trending =
    filteredAndSortedPrompts.length > 2
      ? filteredAndSortedPrompts.slice(2)
      : [];

  const otherSlugs = useMemo(() => {
    return categories
      .filter((item) => item.slug !== normalizedSlug)
      .slice(0, 7)
      .map((item) => ({ slug: item.slug, label: `${item.name} Prompts` }));
  }, [categories, normalizedSlug]);

  return (
    <div className="w-full relative py-8 md:py-16 px-4 md:px-8 max-w-[1600px] mx-auto transition-colors duration-300 select-none">
      {/* Breadcrumb / Back button */}
      <div className="mb-8 flex items-center gap-3 text-xs font-sans font-bold uppercase tracking-wider text-neutral-500">
        <button
          onClick={onBack}
          className="flex items-center gap-2 hover:text-brand-accent transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explore</span>
        </button>
        <span className="text-neutral-300 dark:text-neutral-700">/</span>
        <span className="text-brand-text dark:text-neutral-300">
          {meta.title}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left Sidebar Filters - Hidden on small screens unless toggled */}
        <div
          className={`lg:block ${isMobileFiltersOpen ? "block fixed inset-0 z-50 bg-white dark:bg-[#09090b] p-6 overflow-y-auto" : "hidden"}`}
        >
          {isMobileFiltersOpen && (
            <button
              onClick={() => setIsMobileFiltersOpen(false)}
              className="mb-4 text-xs font-bold uppercase tracking-wider text-brand-accent"
            >
              ← Back to Results
            </button>
          )}
          <FilterSidebar
            filterOptions={filterOptions}
            searchFilter={searchFilter}
            setSearchFilter={setSearchFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex lg:hidden mb-6">
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-900 rounded-lg text-sm font-bold text-brand-text dark:text-white"
            >
              <Menu className="w-4 h-4" /> Filter Results (
              {baseMatchedPrompts.length})
            </button>
          </div>

          <header className="mb-12 max-w-4xl space-y-4">
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-brand-text dark:text-brand-text-dark tracking-tight leading-tight">
              {meta.seoH1}
            </h1>
            <p className="font-sans text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl pt-2">
              {meta.description}
            </p>
          </header>

          {isLoading && (
            <div className="mb-8 text-xs font-bold uppercase tracking-wider text-brand-accent">
              Loading category prompts from Supabase...
            </div>
          )}

          {error && (
            <div className="mb-8 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-sm">
              {error}
            </div>
          )}

          {/* Grid: Featured Categories Prompts */}
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-8">
              <Award className="w-5 h-5 text-brand-accent" />
              <h3 className="font-display text-2xl font-extrabold text-brand-text dark:text-white">
                Featured {meta.title}
              </h3>
            </div>

            {featured.length === 0 && !isLoading ? (
              <p className="text-sm font-sans text-neutral-500">
                No prompts matched your filters.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {featured.map((p) => {
                  const isCopied = copiedId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => onPromptClick(p.id)}
                      className="bg-white dark:bg-neutral-900 border-2 border-brand-accent/20 hover:border-brand-accent rounded-[28px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-6">
                          <span className="px-3 py-1.5 bg-[#f3e8ff] dark:bg-purple-900/30 text-brand-accent font-sans text-[11px] font-bold uppercase tracking-wide rounded-full">
                            Curator Choice
                          </span>
                          <button
                            onClick={(e) =>
                              handleCopy(
                                e,
                                p.id,
                                `${p.title}\n${p.shortDescription}`,
                              )
                            }
                            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer ${isCopied
                                ? "bg-brand-accent border-brand-accent text-white"
                                : "bg-transparent text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:text-brand-accent hover:border-brand-accent"
                              }`}
                          >
                            {isCopied ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <h4 className="font-display text-xl sm:text-2xl font-bold text-brand-text dark:text-white mb-3 group-hover:text-brand-accent transition-colors">
                          {p.title}
                        </h4>
                        <p className="font-sans text-neutral-550 dark:text-neutral-400 text-sm leading-relaxed mb-6">
                          {p.shortDescription}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-between items-center gap-3 pt-5 border-t border-neutral-100 dark:border-neutral-850 mt-4 text-xs text-neutral-400 select-none">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{p.stats.views.toLocaleString()} VIEWS</span>
                        </span>
                        <span>{p.stats.copies.toLocaleString()} COPIES</span>
                        <span className="text-amber-500">
                          {p.stats.ratingCount > 0 && p.stats.rating > 0 ? `${p.stats.rating.toFixed(1)} RATING` : "NO RATINGS"}
                        </span>
                        <span>{p.verified ? "VERIFIED" : "COMMUNITY"}</span>
                        <span>{p.results.hasProof ? "PROOF" : "NO PROOF"}</span>
                        <span className="font-mono bg-brand-accent/5 text-brand-accent px-2.5 py-1 rounded-md border border-brand-accent/10">
                          {p.aiPlatforms.slice(0, 2).join(", ") ||
                            getPrimaryPlatform(p) ||
                            meta.model}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Grid: Trending list */}
          {trending.length > 0 && (
            <section className="mb-20">
              <div className="flex items-center justify-between gap-2 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h3 className="font-display text-xl font-extrabold text-brand-text dark:text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
                    All Results
                  </h3>
                  <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-sans text-xs font-bold px-2.5 py-1 rounded-md">
                    {featured.length + trending.length} Prompts
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                {trending.slice(0, 24).map((p) => {
                  const isCopied = copiedId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => onPromptClick(p.id)}
                      className="bg-white dark:bg-neutral-900 border border-neutral-205/50 dark:border-neutral-800/80 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-brand-accent/20 transition-all duration-300 cursor-pointer group flex flex-col justify-between h-[260px]"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-sans font-bold text-neutral-450 dark:text-neutral-500 uppercase tracking-wide">
                            {p.category}
                          </span>
                          <button
                            onClick={(e) =>
                              handleCopy(
                                e,
                                p.id,
                                `${p.title}\n${p.shortDescription}`,
                              )
                            }
                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${isCopied
                                ? "bg-brand-accent border-brand-accent text-white"
                                : "bg-transparent text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:text-brand-accent hover:border-brand-accent"
                              }`}
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <h4 className="font-display text-lg font-bold text-brand-text dark:text-white line-clamp-2 leading-tight group-hover:text-brand-accent transition-colors">
                          {p.title}
                        </h4>
                        <p className="font-sans text-neutral-550 dark:text-neutral-400 text-xs sm:text-[13px] line-clamp-2 leading-relaxed mt-2.5">
                          {p.shortDescription}
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-850 uppercase flex flex-wrap gap-2 justify-between select-none">
                        <span>{p.stats.ratingCount > 0 && p.stats.rating > 0 ? `${p.stats.rating.toFixed(1)} rating` : "no ratings"}</span>
                        <span>{p.stats.copies} copies</span>
                        <span>{p.stats.views} views</span>
                        <span>{p.results.hasProof ? "proof" : "no proof"}</span>
                        <span>
                          {p.aiPlatforms.slice(0, 2).join(", ") ||
                            getPrimaryPlatform(p) ||
                            meta.model}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Quick related collections */}
          <section className="bg-neutral-50 dark:bg-neutral-900/40 rounded-[32px] p-8 border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-display text-xl font-bold mb-6 text-brand-text dark:text-white">
              Explore Other Topics
            </h3>
            <div className="flex flex-wrap gap-3">
              {otherSlugs.map((item) => (
                <button
                  key={item.slug}
                  onClick={() => onNavigateToCategorySlug(item.slug)}
                  className="
                    flex items-center gap-2 px-4 py-2 rounded-full 
                    font-sans text-[13px] font-semibold
                    bg-neutral-50 dark:bg-neutral-900 
                    text-neutral-600 dark:text-neutral-300
                    border border-neutral-200 dark:border-neutral-800
                    hover:bg-brand-accent hover:text-white hover:border-brand-accent
                    dark:hover:bg-brand-accent dark:hover:text-white dark:hover:border-brand-accent
                    transition-all duration-200 ease-in-out
                    active:scale-95 hover:scale-[1.02]
                    focus:outline-none focus:ring-2 focus:ring-brand-accent/50
                    cursor-pointer
                  "
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
