# Frontend Production Audit & Refactoring Plan

## Executive Summary
The PromptHub frontend has been partially converted to database-driven architecture, but still contains client-side sorting, filtering, and calculations that should be removed per the architecture principle: **React is a presentation layer only. Supabase owns all business logic.**

## Critical Issues Found

### Issue 1: Client-Side Sorting in TrendingToday.tsx
**Location:** `src/components/TrendingToday.tsx:28-36`
**Problem:** Component performs sorting locally instead of requesting pre-sorted data from Supabase
**Current Code:**
```typescript
const copiedPrompts = [...prompts].sort((a, b) => b.stats.copies - a.stats.copies).slice(0, 3);
const growingPrompts = [...prompts].sort((a, b) => b.stats.views - a.stats.views).slice(0, 3);
const ratedPrompts = [...prompts].sort((a, b) => b.stats.rating - a.stats.rating).slice(0, 3);
const newPrompts = [...prompts].reverse().slice(0, 3);
```
**Fix Required:** Remove sorting logic. Pass 4 separate pre-sorted arrays from parent hook.

### Issue 2: Client-Side Filtering in DashboardView.tsx
**Location:** `src/components/DashboardView.tsx:77-81`
**Problem:** Filters user's own prompts locally using handle matching
**Current Code:**
```typescript
const userSubmissions = prompts.filter(
  (prompt) =>
    prompt.author &&
    normalizeHandle(prompt.author.handle) === normalizeHandle(author.handle)
);
```
**Fix Required:** Pass pre-filtered array from hook instead of filtering in component.

### Issue 3: Rating Calculation in TrendingToday.tsx
**Location:** `src/components/TrendingToday.tsx:48`
**Problem:** Formats rating locally with `.toFixed(1)` - formatting should happen at database level
**Current Code:**
```typescript
const getRating = (prompt: PromptCard) => {
  return prompt.stats.rating.toFixed(1);
};
```
**Fix Required:** Rating should already be formatted to 1 decimal place from Supabase.

### Issue 4: Copy Tracking Missing Calls to Backend
**Location:** `src/components/ExploreView.tsx:144-149`
**Problem:** Copy handler doesn't call `incrementPromptCopy()` RPC
**Fix:** Already resolved in previous PR - confirmed working.

### Issue 5: Missing Rating Action
**Location:** `usePromptHub.ts`
**Problem:** Rating action exists in repository but not exposed
**Fix:** Already resolved in previous PR - `submitRating()` added to actions.

---

## Data Flow Architecture

### Correct Pattern (Database-Driven)
1. **Page/Hook loads data** → Calls Supabase with sort/filter parameters
2. **Supabase returns sorted/filtered/calculated data** → Data already has:
   - Pre-calculated trending_score
   - Pre-calculated quality_score
   - Pre-calculated popularity_rank
   - Pre-calculated rating_average
   - Pre-formatted display values
3. **Component renders** → No sorting, filtering, or calculations
4. **User action** → Call Supabase RPC (increment_prompt_view, increment_prompt_copy, etc.)
5. **RPC executes** → Supabase updates metrics and recalculates scores
6. **React Query invalidates cache** → Component refetches and re-renders with new data

---

## Refactoring Tasks

### Task 1: Fix TrendingToday Sorting
- Remove client-side sort operations
- Add sort parameters to parent component props (e.g., `copiedPrompts`, `growingPrompts`, etc.)
- Update usePromptHub hook to fetch 4 separate sorted arrays

### Task 2: Fix Dashboard Filtering
- Remove handle-based filtering from DashboardView
- Pass pre-filtered `userSubmissions` array from parent hook

### Task 3: Verify Rating Format
- Check if Supabase rating_average already returns 1 decimal place
- If not, add database-level rounding

### Task 4: Remove .toFixed() Formatting
- Replace `rating.toFixed(1)` with direct display of database value

### Task 5: Add React Query Integration
- All data mutations should invalidate related queries
- Implement proper cache invalidation on metric updates

### Task 6: Verify Moderation Filtering
- Ensure only `moderation_status='approved'` prompts shown to public
- Admin sees pending/rejected only in admin pages

---

## Implementation Order

1. Update usePromptHub to fetch pre-sorted trending data
2. Update TrendingToday component to use props instead of sorting
3. Update DashboardView to expect pre-filtered data
4. Add React Query invalidation on all mutations
5. Verify moderation filtering at data access layer
6. Performance audit: ensure no N+1 queries

---

## Quality Assurance Checklist

- [ ] No `.sort()` calls in components
- [ ] No `.filter()` calls in components (except UI-level filtering)
- [ ] No calculations of trending_score, quality_score, popularity_rank
- [ ] No client-side rating average calculations
- [ ] All mutations call Supabase RPCs
- [ ] All mutations invalidate related React Query cache
- [ ] No hardcoded mock data
- [ ] No temporary arrays
- [ ] All metrics come from Supabase
- [ ] Moderation status properly filtered
- [ ] No page refreshes on mutations

---

## Success Metrics

- Build completes without errors
- All tests pass
- No console warnings about stale data
- Metrics update correctly on user actions
- Sorting works correctly across all pages
- Performance is optimal (no unnecessary renders)
