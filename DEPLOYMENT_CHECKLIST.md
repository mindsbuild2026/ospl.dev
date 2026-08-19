# Moderation System Deployment Checklist

## Pre-Deployment

- [ ] Read `MODERATION_SYSTEM.md` completely
- [ ] Review database migration script: `supabase/migrations/001_moderation_system_complete.sql`
- [ ] Backup production database
- [ ] Verify environment variables are correct
- [ ] Have Supabase dashboard access
- [ ] Have a test admin user account ready

## Phase 1: Database Migration (Production)

### Execute Migration
- [ ] Open Supabase dashboard
- [ ] Navigate to SQL Editor
- [ ] Paste entire migration script from `supabase/migrations/001_moderation_system_complete.sql`
- [ ] Review all statements
- [ ] Execute migration
- [ ] Verify no errors (check for SUCCESS messages)
- [ ] Check that all tables exist: `rejected_prompts`, `moderation_logs`
- [ ] Check new columns on `prompts`: `moderation_status`, `submitted_at`, `approved_at`, `approved_by`
- [ ] Check new column on `authors`: `is_admin`

### Set Admin Users
- [ ] Run query to set admin (choose your admin users):
  ```sql
  UPDATE authors SET is_admin = TRUE 
  WHERE handle = '@youradminhandle';
  ```
- [ ] Verify admin flag is set:
  ```sql
  SELECT id, handle, is_admin FROM authors WHERE is_admin = TRUE;
  ```

### Optional: Setup Automatic Cleanup (Requires pg_cron)
- [ ] Check if pg_cron is installed (Supabase may not have it enabled):
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  ```
- [ ] If available, schedule cleanup:
  ```sql
  SELECT cron.schedule('cleanup_rejected_prompts', '0 2 * * *', 
    'SELECT cleanup_old_rejected_prompts()');
  ```
- [ ] If not available, note: manual cleanup needed or alternative job scheduler

## Phase 2: Code Deployment

### New Files (Copy to repository)
- [ ] `src/lib/moderationService.ts` - Moderation API service
- [ ] `src/components/AdminModerationView.tsx` - Admin dashboard
- [ ] `src/components/ModerationQueueCard.tsx` - Pending card component
- [ ] `src/components/RejectedPromptCard.tsx` - Rejected card component
- [ ] `src/components/ModerationStatusBadge.tsx` - Status badge
- [ ] `src/pages/AdminModerationPage.tsx` - Admin page with auth check

### Updated Files (Check & merge changes)
- [ ] `src/types.ts` - New moderation types added
  - `RejectedPrompt`, `ModerationLog`, `ModerationQueueItem`, `RejectionReasonOption`
- [ ] `src/routes/AppRoutes.tsx` - Admin moderation route added at `/admin/moderation`

### Optional Enhancements (Recommended for better UX)
- [ ] Update `src/components/PromptDetailView.tsx` to show moderation badge for authors
- [ ] Update `src/components/SubmitPromptView.tsx` info text to mention review process
- [ ] Update `src/components/PromptCard.tsx` to conditionally show pending badge (author view)

## Phase 3: Build & Deploy

### Local Testing
- [ ] `npm install` (no new dependencies required)
- [ ] `npm run build` (verify no TypeScript errors)
- [ ] `npm run dev` (start dev server)
- [ ] Check for compilation errors

### Staging Deployment
- [ ] Deploy to staging environment
- [ ] Run complete test workflow (see Phase 4 below)
- [ ] Verify no console errors
- [ ] Check Network tab for failed requests

### Production Deployment
- [ ] Deploy to production
- [ ] Monitor error tracking (Sentry, etc.)
- [ ] Check application logs

## Phase 4: Testing Workflow

### Test 1: Submit Prompt (Non-Admin User)
- [ ] Create test user account (non-admin)
- [ ] Login as test user
- [ ] Navigate to "Submit Prompt"
- [ ] Fill out complete form
- [ ] Click "Review Submission"
- [ ] Click "Confirm & Publish Prompt"
- [ ] **Expected:** 
  - Prompt saved successfully
  - Redirected to prompt detail page
  - Prompt shows "Pending Review" badge
  - Prompt NOT visible on Explore page (public view)

### Test 2: Check Moderation Queue (Admin User)
- [ ] Create admin test user
- [ ] Set `is_admin = TRUE` in database for this user
- [ ] Login as admin user
- [ ] Navigate to `/admin/moderation`
- [ ] **Expected:**
  - Page loads without "Access Denied" error
  - "Pending" tab shows submitted prompt
  - Prompt card displays title, description, author, stats
  - Search and sort filters work

### Test 3: Approve Prompt
- [ ] In admin dashboard, click "Approve" on pending prompt
- [ ] **Expected:**
  - "Prompt approved successfully" toast message
  - Prompt disappears from Pending tab
  - Prompt appears in Approved tab
  - Prompt NOW visible on Explore page for public users
  - Prompt shows "Approved" badge when author views it
  - Check moderation_logs table has entry with action='approved'

### Test 4: Reject Prompt
- [ ] Submit another test prompt
- [ ] In admin dashboard, click "Reject"
- [ ] Dialog opens with rejection reason dropdown
- [ ] Select "Low quality" (or custom reason)
- [ ] Confirm rejection
- [ ] **Expected:**
  - "Prompt rejected and archived" toast message
  - Prompt moves to Rejected tab
  - Prompt NOT visible on Explore page
  - Check rejected_prompts table has the archived prompt
  - Check moderation_logs has entry with action='rejected'

### Test 5: View Rejection Reason (Author)
- [ ] Login as original author
- [ ] Navigate to profile or saved section
- [ ] **Expected:**
  - See rejected prompt
  - Red "Rejected" badge visible
  - Rejection reason displayed in alert box
  - "Restore" and "Delete" buttons available

### Test 6: Restore Rejected Prompt
- [ ] As author, click "Restore" on rejected prompt
- [ ] **Expected:**
  - "Prompt restored to pending status" toast
  - Rejected prompt card disappears
  - New prompt appears in pending queue (with new id)
  - Original rejected_prompts entry deleted
  - Check moderation_logs has entry with action='restored'
  - Admin sees it in Pending tab again

### Test 7: Permanently Delete Rejected Prompt
- [ ] Submit test prompt
- [ ] Admin rejects it
- [ ] As admin (or author with permission), click "Delete"
- [ ] Confirmation dialog appears
- [ ] Confirm deletion
- [ ] **Expected:**
  - "Prompt permanently deleted" toast
  - Rejected prompt completely removed from rejected_prompts table
  - No way to recover

### Test 8: RLS Policies
- [ ] As public user (not logged in), try to access rejected/pending prompts directly:
  - Query `/prompt/:id` with pending prompt id
  - Query `/prompt/:id` with rejected prompt id
- [ ] **Expected:** Error or prompt not found (RLS blocking)
- [ ] As author of pending prompt, access via direct URL:
- [ ] **Expected:** Can view their own prompt

### Test 9: Search & Filtering
- [ ] In admin dashboard, test search:
  - Search by title partial match
  - Search by author name
  - Search with special characters
- [ ] Test sorting:
  - Newest/Oldest
  - Most Likes/Most Saves
  - Recently Approved (Approved tab only)
- [ ] **Expected:** Results match filters correctly

### Test 10: Moderation Audit Trail
- [ ] Create prompt → Check moderation_logs for 'submitted' action
- [ ] Approve prompt → Check for 'approved' action
- [ ] Reject prompt → Check for 'rejected' action
- [ ] Restore prompt → Check for 'restored' action
- [ ] **Expected:** All entries correct with timestamp, admin id, metadata

## Post-Deployment

### Monitoring (First 24 hours)
- [ ] Monitor error tracking dashboard
- [ ] Check application logs for issues
- [ ] Verify admin can access dashboard
- [ ] Monitor database performance
- [ ] Check if pending queue accumulates properly

### Monitoring (First week)
- [ ] Track average time to approve/reject prompts
- [ ] Monitor rejected_prompts table growth
- [ ] Watch for common rejection reasons
- [ ] Gather admin feedback on UX

### Follow-up Tasks
- [ ] Set up email notifications (optional enhancement)
- [ ] Configure moderation SLA (approval time targets)
- [ ] Create moderation guidelines document
- [ ] Train admins on moderation dashboard
- [ ] Add to team documentation

## Rollback Plan (If Critical Issue)

If you need to rollback:

1. Stop using admin dashboard
2. Run rollback script from migration file comments
3. All moderation tables will be dropped
4. Columns will be removed
5. Original RLS policies restored
6. **WARNING:** Any data in rejected_prompts will be lost

```sql
-- Run this only if absolutely necessary:
-- Use script from end of 001_moderation_system_complete.sql
BEGIN;
-- ... run all DROP statements ...
COMMIT;
```

## Known Limitations & Workarounds

### Limitation: Approved Prompt Can't Be Revoked (Moved back to Pending)
**Status:** Optional feature, not implemented
**Workaround:** If needed, manually update in database:
```sql
UPDATE prompts SET moderation_status = 'pending' WHERE id = 'prompt-id';
INSERT INTO moderation_logs (...) VALUES (...);
```

### Limitation: Bulk Approve/Reject Not Implemented
**Status:** Optional feature, can be added later
**Workaround:** Admin must approve/reject one at a time

### Limitation: No Email Notifications
**Status:** Optional feature, for future enhancement
**Workaround:** Implement separately using email service

### Limitation: No Real-Time WebSocket Updates
**Status:** Optional feature, for future enhancement
**Workaround:** Page refresh to see updates

## Performance Notes

### Database Query Performance
- Moderation queue queries have indexes on `moderation_status`, `submitted_at`
- Approved/rejected lookups use composite indexes
- Search uses title/description ILIKE with TSVECTOR indexes

### Recommended Monitoring
```sql
-- Check moderation queue size
SELECT COUNT(*) FROM prompts WHERE moderation_status = 'pending';

-- Check rejected prompts (should auto-clean after 30 days)
SELECT COUNT(*) FROM rejected_prompts;

-- Monitor moderation_logs growth
SELECT COUNT(*) FROM moderation_logs;
```

## Success Criteria

Migration is successful when:

- [ ] All 5 test workflows complete without errors
- [ ] Admin dashboard loads without errors for admin users
- [ ] Public users cannot see pending/rejected prompts
- [ ] Authors see their own prompts correctly
- [ ] All database functions execute successfully
- [ ] RLS policies enforcing visibility correctly
- [ ] Moderation logs recording all actions
- [ ] No console errors in development tools

## Support Resources

- Full documentation: `MODERATION_SYSTEM.md`
- Migration script: `supabase/migrations/001_moderation_system_complete.sql`
- Service layer: `src/lib/moderationService.ts`
- Component source: `src/components/Admin*.tsx`

