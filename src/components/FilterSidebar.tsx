import React, { useState } from "react";
import { ChevronDown, Check, SlidersHorizontal, Search } from "lucide-react";
import { FilterOptions } from "../types";

interface FilterSidebarProps {
  filterOptions: FilterOptions;
  searchFilter: string;
  setSearchFilter: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  selectedTags: string[];
  setSelectedTags: (v: string[]) => void;
}

export default function FilterSidebar({
  filterOptions,
  searchFilter,
  setSearchFilter,
  sortBy,
  setSortBy,
  selectedTags,
  setSelectedTags,
}: FilterSidebarProps) {
  const SORT_OPTIONS = [
    "Trending",
    "Most Popular",
    "Most Copied",
    "Most Viewed",
    "Highest Rated",
    "Most Bookmarked",
    "Most Discussed",
    "Newest",
    "Recently Updated",
    "A-Z",
  ];

  const TIME = ["Today", "This Week", "This Month", "This Year", "All Time"];

  const difficulties = filterOptions.difficulties || [];
  const promptTypes = filterOptions.promptTypes || [];
  const aiPlatforms = filterOptions.aiPlatforms || [];
  const tags = filterOptions.tags || [];

  // Local state for selected Platforms & Difficulty to bind state safely
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const toggleTag = (t: string) => {
    // Check first if it is actually different to stop redundant parent renders
    const exists = selectedTags.includes(t);
    const updated = exists ? selectedTags.filter((x) => x !== t) : [...selectedTags, t];
    setSelectedTags(updated);
  };

  return (
    <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-6 select-none bg-white dark:bg-[#09090b] border border-neutral-200 dark:border-neutral-800 p-6 rounded-[24px]">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-brand-text dark:text-white flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </h3>
        <button
          onClick={() => {
            setSearchFilter("");
            setSortBy("Trending");
            setSelectedTags([]);
            setSelectedPlatforms([]);
            setSelectedDifficulty("");
          }}
          className="text-xs text-brand-accent hover:underline font-bold cursor-pointer"
        >
          Clear All
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Search category..."
          className="w-full bg-neutral-100 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all text-neutral-800 dark:text-neutral-200"
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Sort By
        </h4>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-neutral-100 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-lg px-3 py-2 pr-8 text-sm font-sans focus:outline-none text-neutral-800 dark:text-neutral-200 appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          AI Platform
        </h4>
        <div className="flex flex-col gap-2">
          {aiPlatforms.slice(0, 6).map((d) => {
            const isChecked = selectedPlatforms.includes(d);
            return (
              <label
                key={d}
                className="flex items-center gap-2 text-sm cursor-pointer group"
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={isChecked}
                  onChange={() => togglePlatform(d)}
                />
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    isChecked
                      ? "bg-brand-accent border-brand-accent"
                      : "border-neutral-300 dark:border-neutral-700 group-hover:border-brand-accent"
                  }`}
                >
                  {isChecked && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-neutral-600 dark:text-neutral-400 group-hover:text-brand-text dark:group-hover:text-neutral-200 transition-colors">
                  {d}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Difficulty Level
        </h4>
        <div className="flex flex-col gap-2">
          {difficulties.map((d) => {
            const isSelected = selectedDifficulty === d;
            return (
              <label
                key={d}
                className="flex items-center gap-2 text-sm cursor-pointer group"
              >
                <input
                  type="radio"
                  name="diff"
                  className="hidden"
                  checked={isSelected}
                  onChange={() => setSelectedDifficulty(d)}
                />
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? "border-brand-accent"
                      : "border-neutral-300 dark:border-neutral-700 group-hover:border-brand-accent"
                  }`}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-brand-accent" />
                  )}
                </div>
                <span className="text-neutral-600 dark:text-neutral-400 group-hover:text-brand-text dark:group-hover:text-neutral-200 transition-colors">
                  {d}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Prompt Type
        </h4>
        <div className="flex flex-wrap gap-2 text-sm">
          {promptTypes.slice(0, 8).map((d) => (
            <span
              key={d}
              className="px-2.5 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 cursor-pointer hover:text-brand-accent hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition-colors text-xs"
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Popular Tags
        </h4>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => {
            const isActive = selectedTags.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold border transition-colors cursor-pointer ${
                  isActive
                    ? "bg-brand-accent text-white border-brand-accent"
                    : "bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-brand-accent hover:text-brand-accent"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Time Filter
        </h4>
        <div className="relative">
          <select className="w-full bg-neutral-100 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-lg px-3 py-2 pr-8 text-sm font-sans focus:outline-none text-neutral-800 dark:text-neutral-200 appearance-none cursor-pointer">
            {TIME.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
