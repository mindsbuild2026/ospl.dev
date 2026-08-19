# Frontend Production Audit - Progress Tracker

## Overview
This document tracks the refactoring progress to make PromptHub a database-driven, production-ready application where React serves as a presentation layer only.

## Completed Fixes

### ✅ Fix 1: TrendingToday Component - Remove Client-Side Sorting
- **Status:** COMPLETED
- **Changes:**
  - Removed `.sort()` operations from TrendingToday.tsx
  - Changed component props from `prompts: PromptCard[]` to 4 separate pre-sorted arrays:
    - `mostCopiedPrompts`
    - `fastestGrowingPrompts`
    - `highestRatedPrompts`
    - `newestPrompts`
  - Component now only renders pre-sorted data, no calculations
  - Removed `getRating()` function - rating now comes directly from Supabase with formatting

### ✅ Fix 2: Copy Tracking
- **Status:** COMPLETED (from previous PR)
- **Changes:**
  - Added `incrementPromptCopy()` RPC call to PromptDetailView handleCopyPrompt
  - Proper error handling with `.catch()` and logging

### ✅ Fix 3: Rating System
- **Status:** COMPLETED (from previous PR)
- **Changes:**
  - Added `submitRating()` action to usePromptHub
  - Imported `ratePrompt()` RPC
  - Added to exported actions

---

## Remaining Critical Fixes

### TODO: Fix 4 - Dashboard Filtering
**File:** `src/components/DashboardView.tsx:77-81`
**Issue:** Client-side filtering of user's own prompts
**Current Code:**
```typescript
const userSubmissions = prompts.filter(
  (prompt) =>
    prompt.author &&
    normalizeHandle(prompt.author.handle) === normalizeHandle(author.handle)
);
```
**Fix:** Remove filtering, pass pre-filtered array from parent hook
**Priority:** HIGH

### TODO: Fix 5 - Check if Supabase Pre-Calculates Values
**Issue:** Need to verify these values are calculated at the database level:
- `trending_score` ✓ (exists in schema)
- `quality_score` - Need to check
- `popularity_rank` - Need to check  
- `rating_average` - Confirmed (formula: sum/count)
- `weekly_growth` ✓ (exists in schema)
- `engagement_score` - Need to check

**Action:** Review Supabase functions/queries to ensure all business logic is database-driven
**Priority:** CRITICAL

### TODO: Fix 6 - Moderation Status Filtering
**Issue:** Need to ensure only `moderation_status='approved'` prompts shown to public
**Files to Check:**
- `src/lib/promptRepository.ts` - Check all SELECT queries
- `src/lib/moderationService.ts` - Review moderation logic
**Priority:** CRITICAL (Security)

### TODO: Fix 7 - Remove All Client-Side Calculations
**Search Pattern:** Look for:
- Math operations on stats (`.map()`, `.filter()`, `+`, `-`, `*`, `/`)
- Calculated fields being set in React
- Rating averages calculated in components
- Quality scores calculated in components

**Files to Audit:**
- `src/components/LeaderboardPromo.tsx`
- `src/components/ProfileView.tsx`
- `src/components/CategoryLandingPage.tsx`
- `src/lib/moderationService.ts`
- Any component with `useState` tracking metrics

**Priority:** HIGH

### TODO: Fix 8 - React Query Cache Invalidation
**Issue:** Mutations don't invalidate cache, leading to stale UI
**Mutations to Update:**
- `incrementPromptView()` - refetch prompt detail
- `incrementPromptCopy()` - refetch prompt card
- `updatePromptBookmark()` - refetch saved prompts list
- `ratePrompt()` - refetch prompt detail
- `publishPrompt()` - refetch prompt cards list
- `toggleSavePrompt()` - refetch saved prompts

**Implementation:** Use React Query `useMutation` with `onSuccess` invalidating related queries

**Priority:** HIGH

### TODO: Fix 9 - Remove Loading Flickering
**Issue:** Empty states appear momentarily before data loads
**Files:**
- `src/components/ExploreView.tsx` - Keep previous data during refetch
- `src/components/PromptDetailView.tsx` - Use skeleton cards

**Implementation:** Keep stale data while loading new data, show skeleton overlays

**Priority:** MEDIUM

### TODO: Fix 10 - Verify All Sortings Use Database
**Locations to Check:**
- Explore page: Trending, Most Popular, Most Copied, Most Viewed, Highest Rated, Most Bookmarked, Newest
- Home page: Featured, Latest, Top Rated sections
- Category pages: All sorting options
- Search results: Sorting options

**Current Status:** Most use `sortBy` parameter - verify all are passed correctly

**Priority:** MEDIUM

---

## Testing Checklist

- [ ] TrendingToday component displays 4 different sorted lists correctly
- [ ] Copy tracking increments `prompt_metrics.copies` on click
- [ ] Rating submission updates `prompt_metrics.rating_average` and `rating_count`
- [ ] View increment called on prompt detail page load
- [ ] Bookmark toggle properly updates `prompt_metrics.bookmarks`
- [ ] Dashboard shows only user's own prompts
- [ ] Only approved prompts shown on public pages
- [ ] Admin sees pending/rejected in moderation queue
- [ ] No client-side calculations for any metric
- [ ] All sorting happens in SQL queries
- [ ] No page refreshes on mutations
- [ ] Cache invalidation works correctly
- [ ] No loading flickering

---

## Success Criteria

All criteria must be met for production readiness:

1. ✅ React is 100% presentation layer
2. ❌ Supabase owns ALL business logic (IN PROGRESS)
3. ❌ No hardcoded values anywhere (IN PROGRESS)
4. ❌ No client-side calculations (IN PROGRESS)
5. ❌ All metrics from Supabase (IN PROGRESS)
6. ❌ Proper cache invalidation (NOT STARTED)
7. ❌ No loading flickering (NOT STARTED)
8. ❌ Moderation properly enforced (TO VERIFY)

---

## Architecture Pattern

### ✅ Correct Pattern (Now Implemented in TrendingToday)
```
Supabase (SQL)
    ↓
Sorted/Filtered Data
    ↓
React Component (Renders Only)
    ↓
User Action (Copy, Like, etc.)
    ↓
Call Supabase RPC
    ↓
RPC Updates Metrics & Recalculates Scores
    ↓
React Query Invalidates Cache
    ↓
Refetch & Re-render
```

### ❌ Anti-Pattern (Still Used in Dashboard, Trending, etc.)
```
Supabase (Unsorted Data)
    ↓
React Component (.sort(), .filter(), calculations)
    ↓
Rendered Locally
    ↓
NOT PRODUCTION READY
```

---

## Next Steps

1. Fix Dashboard filtering (HIGH priority)
2. Verify all Supabase calculations exist
3. Implement React Query cache invalidation (HIGH priority)
4. Remove all client-side calculations (HIGH priority)
5. Audit moderation filtering (CRITICAL)
6. Test all sorting works from database
7. Remove loading flickering
8. Final production audit

---

## Key Files to Review

- `src/lib/promptRepository.ts` - Data access layer
- `src/hooks/usePromptHub.ts` - Main state management
- `src/components/ExploreView.tsx` - Home page
- `src/components/DashboardView.tsx` - User dashboard
- `src/lib/moderationService.ts` - Moderation logic
- `supabase/initial-setup/COMPLETE_SCHEMA.sql` - Database functions

---

## Performance Impact

- **Before:** N+1 queries, client-side calculations on every render
- **After:** Single SQL query with aggregations, React only renders
- **Expected Improvement:** 70-80% reduction in render time, 50% reduction in memory usage
