# Next Fixes Implementation Guide

## Fix #1: Dashboard Filtering (HIGH PRIORITY)

### Current Problem
`src/components/DashboardView.tsx:77-81` performs client-side filtering by handle matching.

**Current Code:**
```typescript
const normalizeHandle = (h: string) => h.toLowerCase().replace(/^@/, '');
const userSubmissions = prompts.filter(
  (prompt) =>
    prompt.author &&
    normalizeHandle(prompt.author.handle) === normalizeHandle(author.handle)
);
```

**Problems:**
- Filtering happens in React (presentation layer)
- Inefficient: filters all prompts on every render
- If prompts list is incomplete, filtering is incorrect

### Solution
Pass pre-filtered array from usePromptHub hook instead.

**Step 1: Update usePromptHub.ts**
```typescript
// Add new state for user's own prompts
const [userSubmissions, setUserSubmissions] = useState<PromptCard[]>([]);

// Add this useEffect to filter when prompts or author changes
useEffect(() => {
  if (!author || !promptCards) {
    setUserSubmissions([]);
    return;
  }
  // Filter happens here, but should be moved to Supabase eventually
  const normalizeHandle = (h: string) => h.toLowerCase().replace(/^@/, '');
  const filtered = promptCards.filter(
    (prompt) =>
      prompt.author &&
      normalizeHandle(prompt.author.handle) === normalizeHandle(author.handle)
  );
  setUserSubmissions(filtered);
}, [promptCards, author]);

// Add to returned actions:
userSubmissions,
```

**Step 2: Update usePromptHubContext to expose userSubmissions**

**Step 3: Update DashboardView.tsx**
```typescript
interface DashboardViewProps {
  // ... existing props
  userSubmissions: PromptCard[]; // NEW - pre-filtered from hook
}

// Remove the client-side filtering:
// const userSubmissions = prompts.filter(...) // DELETE THIS

// Now userSubmissions is passed as prop from parent
```

**Step 4: Update DashboardPage.tsx** (the page that calls DashboardView)
```typescript
const { state, actions } = usePromptHubContext();

<DashboardView
  // ... existing props
  userSubmissions={state.userSubmissions}  // NEW
/>
```

### Expected Outcome
- Component only receives pre-filtered data
- No filtering logic in React
- Moves toward database-driven architecture

---

## Fix #2: React Query Cache Invalidation (HIGH PRIORITY)

### Current Problem
After mutations (copy, view, bookmark, rating), UI shows stale data because cache isn't invalidated.

### Solution
Implement React Query with proper cache invalidation.

**Step 1: Check if React Query is installed**
```bash
cd /vercel/share/v0-project
npm list @tanstack/react-query
# If not installed: npm install @tanstack/react-query
```

**Step 2: Add QueryClientProvider to root layout**
```typescript
// src/main.tsx or App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  );
}
```

**Step 3: Convert fetch functions to React Query hooks**
```typescript
// src/hooks/usePrompts.ts (NEW FILE)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPromptCards, incrementPromptCopy, incrementPromptView } from '../lib/promptRepository';

export function usePromptCards(params) {
  return useQuery({
    queryKey: ['prompts', params],
    queryFn: () => fetchPromptCards(params),
    staleTime: 30000, // 30 seconds
  });
}

export function useCopyPromptMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (promptId: string) => incrementPromptCopy(promptId),
    onSuccess: (data, promptId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['prompt', promptId] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });
}
```

**Step 4: Use mutations in components**
```typescript
// In PromptDetailView.tsx
import { useCopyPromptMutation } from '../hooks/usePrompts';

export function PromptDetailView() {
  const copyMutation = useCopyPromptMutation();
  
  const handleCopyPrompt = async () => {
    try {
      navigator.clipboard.writeText(text);
      setCopied(true);
      await copyMutation.mutateAsync(prompt.id);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };
}
```

### Expected Outcome
- All metric updates properly invalidate cache
- UI automatically updates without page refresh
- No stale data issues

---

## Fix #3: Verify Moderation Filtering (CRITICAL)

### Current Problem
Need to ensure only `moderation_status='approved'` prompts shown to public.

**Step 1: Audit all SELECT queries in promptRepository.ts**

Search for all `from("prompt_card_rows")` and `from("prompts")` queries:

```bash
cd /vercel/share/v0-project
grep -n "from(" src/lib/promptRepository.ts
```

**Step 2: Check each query has moderation filter**

**Example - Good:**
```typescript
const { data, error } = await client
  .from("prompt_card_rows")
  .select("*")
  .eq("moderation_status", "approved")  // ✓ FILTERED
  .order("trending_score", { ascending: false });
```

**Example - Bad:**
```typescript
const { data, error } = await client
  .from("prompt_card_rows")
  .select("*")
  .order("trending_score", { ascending: false }); // ✗ NOT FILTERED!
```

**Step 3: Add filter to any missing queries**

For each query that's NOT an admin query:
```typescript
// Add this line before executing
.eq("moderation_status", "approved")
```

**Step 4: Create admin-specific fetch functions**

```typescript
export async function fetchAdminPrompts(params) {
  // Admin can see ALL prompts regardless of moderation_status
  // This function should only be called if user.is_admin === true
  const client = requireSupabase();
  const { data, error } = await client
    .from("prompt_card_rows")
    .select("*")
    // NO moderation filter - admin sees all
    .order("created_at", { ascending: false });
  
  assertNoError(error);
  return (data || []).map(mapPromptCard);
}
```

### Expected Outcome
- Public sees only approved prompts
- Admins can access rejected/pending in admin area
- Security vulnerability closed

---

## Fix #4: Remove All Client-Side Sorting (MEDIUM PRIORITY)

### Pattern to Find
```typescript
// Bad patterns:
[...array].sort((a, b) => ...)
prompts.sort(...)
collection.reverse()
```

### Files to Check
```bash
# Search for all sort operations
cd /vercel/share/v0-project
grep -n "\.sort(" src/components/*.tsx
grep -n "\.reverse(" src/components/*.tsx
grep -n "\.filter(" src/components/*.tsx | grep -v "e.filter"
```

### For Each Sort Found:

**Option 1: If it's display sorting (safe to keep locally)**
```typescript
// This is OK - it's just for display UI state
const [sortedByName, setSortedByName] = useState(false);
const displayList = sortedByName ? [...prompts].sort(...) : prompts;
```

**Option 2: If it's for ranking (must move to database)**
```typescript
// BAD - was in component, now should be from Supabase
const topRated = [...prompts].sort((a, b) => b.stats.rating - a.stats.rating);

// GOOD - get from Supabase with correct sortBy parameter
const topRated = await fetchPromptCards({ sortBy: 'Highest Rated' });
```

---

## Fix #5: Add Provisional Trending Data Arrays (While We Wait For Backend)

### Interim Solution for TrendingToday
Until the hook fetches 4 separate sorted arrays, use this approach:

**In usePromptHub.ts:**
```typescript
// Temporary derived lists from the main prompts array
// TODO: Replace with separate Supabase queries for each sort type
const mostCopiedPrompts = useMemo(
  () => [...promptCards].sort((a, b) => b.stats.copies - a.stats.copies).slice(0, 3),
  [promptCards]
);

const fastestGrowingPrompts = useMemo(
  () => [...promptCards].sort((a, b) => b.engagement.weeklyGrowth - a.engagement.weeklyGrowth).slice(0, 3),
  [promptCards]
);

const highestRatedPrompts = useMemo(
  () => [...promptCards].sort((a, b) => b.stats.rating - a.stats.rating).slice(0, 3),
  [promptCards]
);

const newestPrompts = useMemo(
  () => [...promptCards].sort((a, b) => new Date(b.stats.updated).getTime() - new Date(a.stats.updated).getTime()).slice(0, 3),
  [promptCards]
);

// Add to return state
state: {
  // ... existing
  mostCopiedPrompts,
  fastestGrowingPrompts,
  highestRatedPrompts,
  newestPrompts,
}
```

**Then update ExploreView.tsx:**
```typescript
<TrendingToday
  mostCopiedPrompts={state.mostCopiedPrompts}
  fastestGrowingPrompts={state.fastestGrowingPrompts}
  highestRatedPrompts={state.highestRatedPrompts}
  newestPrompts={state.newestPrompts}
  onPromptClick={onPromptClick}
/>
```

### Why This Works
- Moves sorting from component to hook (closer to data)
- Uses useMemo to prevent recalculating every render
- Maintains same output while improving architecture
- Ready for replacement with separate Supabase queries

---

## Implementation Order

1. **First:** Fix #3 (Moderation Filtering) - SECURITY CRITICAL
2. **Second:** Fix #2 (Cache Invalidation) - Improves UX
3. **Third:** Fix #1 (Dashboard Filtering) - Cleaner architecture  
4. **Fourth:** Fix #5 (Trending Data Arrays) - Polish interim solution
5. **Fifth:** Fix #4 (Client-Side Sorting) - Final cleanup

## Estimated Timeline
- Fix #1: 30 minutes
- Fix #2: 2-3 hours (if React Query not installed)
- Fix #3: 1-2 hours
- Fix #4: 1 hour
- Fix #5: 30 minutes

**Total: 5-7 hours to reach next milestone**

## Testing After Each Fix
```bash
npm run build    # Verify no errors
npm run preview  # Test in browser
# Check console for [v0] debug logs
# Verify metrics update correctly
# Check Supabase logs for RPC calls
```

---

## Git Commit Messages

```
# Fix #1
git commit -m "refactor: move dashboard filtering to hook

- Remove client-side filtering from DashboardView
- Pass pre-filtered userSubmissions from hook
- Improves architecture alignment with database-driven pattern"

# Fix #2
git commit -m "feat: implement React Query cache invalidation

- Add useMutation wrappers for all metric updates
- Automatic cache invalidation on mutation success
- Fixes stale UI after copy/view/rate operations"

# Fix #3
git commit -m "fix: enforce moderation_status filtering on public queries

- Add moderation_status='approved' filter to all public endpoints
- Create separate admin-only fetch functions
- Prevents unauthorized prompt visibility

SECURITY: Blocks public access to rejected/pending prompts"

# Fix #4
git commit -m "refactor: consolidate client-side sorting cleanup

- Move remaining sorts to hook with useMemo
- Prepare for database-driven sorting
- Reduces component responsibilities"

# Fix #5
git commit -m "chore: add interim trending data arrays

- Use useMemo for efficient sorting
- Provides foundation for separate Supabase queries
- Improves perceived architecture"
```
