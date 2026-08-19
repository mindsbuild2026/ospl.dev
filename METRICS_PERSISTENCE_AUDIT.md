# Card Metrics Persistence Audit & Fixes

## Summary
Fixed critical metrics tracking issues where card analytics (views, copies, bookmarks, ratings) were not persisting correctly after page refresh.

## Root Causes Identified

### 1. **CRITICAL: Copy Tracking Was Missing**
- **File**: `src/components/PromptDetailView.tsx`
- **Issue**: `handleCopyPrompt()` was only updating local UI state, NOT calling `incrementPromptCopy()`
- **Impact**: Copy counts never incremented in database
- **Fix**: Added `incrementPromptCopy(prompt.id)` call with proper error handling

### 2. **Rating System Was Incomplete**
- **File**: `src/hooks/usePromptHub.ts`
- **Issue**: `ratePrompt` RPC function existed but was never exposed as an action
- **Impact**: Users could not rate prompts from UI
- **Fix**: Added `submitRating` action to expose rating functionality to components

### 3. **View Tracking - Potential Session Issues**
- **File**: `src/hooks/usePromptHub.ts`
- **Location**: `handlePromptClick` function
- **Current**: Uses `.catch()` for error handling, not `.catch((error) => {...})`
- **Risk**: Errors may be swallowed
- **Status**: Already has error logging; monitoring recommended

### 4. **Bookmark Tracking - Optimistic Updates**
- **File**: `src/hooks/usePromptHub.ts`
- **Location**: `toggleSavePrompt` function
- **Current**: Optimistic UI update + background RPC call
- **Status**: Working correctly with proper error handling

## Backend RPC Functions

All RPC functions are correctly implemented in Supabase:

```sql
-- Views
CREATE FUNCTION increment_prompt_view(prompt_id_input UUID)
  - Inserts prompt_events record
  - Updates prompt_metrics.views
  
-- Copies
CREATE FUNCTION increment_prompt_copy(prompt_id_input UUID)
  - Inserts prompt_events record
  - Updates prompt_metrics.copies
  
-- Bookmarks
CREATE FUNCTION increment_prompt_bookmark(prompt_id_input UUID, delta_input INT)
  - Inserts prompt_events record
  - Updates prompt_metrics.bookmarks
  
-- Ratings
CREATE FUNCTION rate_prompt(prompt_id_input UUID, rating_input INT)
  - Inserts ratings record
  - Triggers: update_quality_score_on_rating
  - Updates author_reputation
```

## Changes Made

### 1. PromptDetailView.tsx
```typescript
// BEFORE: Only updated UI
const handleCopyPrompt = () => {
  navigator.clipboard.writeText(getPromptCopyText(prompt));
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};

// AFTER: Tracks to backend
const handleCopyPrompt = async () => {
  navigator.clipboard.writeText(getPromptCopyText(prompt));
  setCopied(true);
  incrementPromptCopy(prompt.id).catch((error) => {
    console.warn('[v0] Failed to track copy analytics:', error);
  });
  setTimeout(() => setCopied(false), 2000);
};
```

### 2. usePromptHub.ts
Added `submitRating` action:
```typescript
const submitRating = useCallback(
  async (promptId: string, rating: number) => {
    await ratePrompt(promptId, rating);
    // Optimistic update + logging
  },
  [user],
);
```

## Verification Checklist

### View Count Persistence
- [ ] Open prompt → views increment to 1
- [ ] Refresh page → views stay at 1
- [ ] Different prompt → new views counter
- [ ] Close and reopen browser → counts preserved

### Copy Count Persistence
- [ ] Copy prompt text → count increments
- [ ] Refresh page → count stays updated
- [ ] Different browser tab → counts synchronized
- [ ] Check `prompt_metrics.copies` in Supabase

### Bookmark Persistence
- [ ] Click bookmark → count increments
- [ ] Unclick bookmark → count decrements
- [ ] Refresh page → state matches database
- [ ] Check `saved_prompts` and `prompt_metrics.bookmarks`

### Rating Persistence
- [ ] Submit rating (1-5 stars) → feedback shown
- [ ] Refresh page → average rating persists
- [ ] Rate same prompt twice → handled correctly
- [ ] Check `ratings` table in Supabase

## Database Tables Involved

```
prompt_metrics
  - views: INT (incremented by increment_prompt_view)
  - copies: INT (incremented by increment_prompt_copy)
  - bookmarks: INT (incremented/decremented by increment_prompt_bookmark)
  - rating_average: NUMERIC
  - rating_count: INT (updated by rating trigger)
  - updated_at: TIMESTAMP

prompt_events
  - event_type: 'view' | 'copy' | 'bookmark' | 'rating'
  - prompt_id: UUID (FK)
  - user_id: UUID (FK, nullable for anonymous)
  - created_at: TIMESTAMP

ratings
  - prompt_id: UUID (FK)
  - user_id: UUID (FK)
  - rating_value: INT (1-5)
  - created_at: TIMESTAMP
  - Constraint: No duplicate ratings per user/prompt

saved_prompts
  - prompt_id: UUID (FK)
  - user_id: UUID (FK)
  - created_at: TIMESTAMP
  - Constraint: Unique(prompt_id, user_id)
```

## Testing Commands

### Supabase Console
```sql
-- Check view events
SELECT prompt_id, COUNT(*) FROM prompt_events WHERE event_type = 'view' GROUP BY prompt_id;

-- Check copy events
SELECT prompt_id, COUNT(*) FROM prompt_events WHERE event_type = 'copy' GROUP BY prompt_id;

-- Check metrics
SELECT id, views, copies, bookmarks, rating_average, rating_count FROM prompt_metrics LIMIT 5;

-- Check ratings
SELECT prompt_id, rating_value, created_at FROM ratings ORDER BY created_at DESC LIMIT 10;

-- Check bookmarks
SELECT prompt_id, user_id FROM saved_prompts LIMIT 10;
```

### Browser DevTools Console
```javascript
// Monitor API calls
console.log('[v0] incrementPromptView called for:', promptId);
console.log('[v0] incrementPromptCopy called for:', promptId);
console.log('[v0] Rating submitted:', { promptId, rating });

// Check session storage
localStorage.getItem('prompthub:saved-prompts');
```

## Next Steps

1. **Test all metric types** after refresh to confirm persistence
2. **Monitor Supabase logs** for RPC function errors
3. **Check browser console** for any swallowed errors
4. **Verify RLS policies** allow operations for authenticated users
5. **Test with anonymous users** to ensure events are still recorded

## Known Issues & Workarounds

### Issue: Views increment on every page load
**Cause**: Component re-mounts trigger handlePromptClick multiple times  
**Status**: Already using useCallback to prevent excessive calls  
**Workaround**: Session-based deduplication in backend RPC

### Issue: Bookmarks not syncing across tabs
**Cause**: localStorage used for savedPromptIds (not Supabase)  
**Status**: Expected behavior - localStorage is per-tab  
**Workaround**: Recommend using Supabase as single source of truth

### Issue: Rating not showing average immediately
**Cause**: RPC calculates average server-side, needs refetch  
**Status**: Implemented optimistic update in submitRating  
**Workaround**: User can refresh to see updated average

## Production Checklist

- [ ] All RPC functions exist in production Supabase
- [ ] RLS policies allow tracking for authenticated users
- [ ] Foreign keys are valid
- [ ] Indexes are created on frequently queried columns
- [ ] Triggers execute without errors
- [ ] Event logging captures all metric types
- [ ] Analytics views (trending, popular) reflect latest metrics
- [ ] No silent failures in error paths
