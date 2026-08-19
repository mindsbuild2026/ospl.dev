# Moderation System Implementation Guide

## Overview

This document describes the complete moderation system implemented for the PromptHub platform. The system ensures all new prompt submissions go through a review process before becoming publicly visible.

## Architecture

### Key Principles

1. **New prompts default to "pending" status** - No prompt is immediately public
2. **Only "approved" prompts are visible to public** - Enforced via RLS policies
3. **Authors always see their own prompts** - Regardless of moderation status
4. **Admins have full access** - Can view, approve, reject, restore, and delete
5. **Immutable audit trail** - All actions logged in moderation_logs

## Database Schema

### New Columns on `prompts` Table

```sql
-- Added to existing prompts table:
moderation_status moderation_status NOT NULL DEFAULT 'pending'  -- ENUM: pending|approved|rejected
submitted_at TIMESTAMPTZ DEFAULT NOW()  -- When submitted for review
approved_at TIMESTAMPTZ                 -- When approved (NULL if not approved)
approved_by UUID REFERENCES authors(id) -- Which admin approved it
```

### New `rejected_prompts` Table

Archive table storing rejected prompt snapshots with retention policy (30 days default).

**Columns:**
- `id` - Primary key (UUID)
- `original_prompt_id` - Reference to original prompt id
- `author_id` - FK to authors
- `title`, `short_description`, `description` - Prompt text data
- `category_id`, `prompt_type_id` - References to lookups
- `system_prompt`, `user_prompt`, `expected_output` - Prompt content
- `rejection_reason` - Why it was rejected
- `rejected_at`, `rejected_by` - Audit fields
- `original_created_at` - When the prompt was originally created
- `retained_until` - When this record should be auto-deleted (30 days)

### New `moderation_logs` Table

Immutable audit log of all moderation actions.

**Columns:**
- `id` - Primary key (UUID)
- `prompt_id` - FK to prompts (CASCADE delete)
- `action` - ENUM: submitted|approved|rejected|restored|deleted
- `old_status`, `new_status` - Status transition tracking
- `reason` - Additional context (rejection reason, etc.)
- `performed_by` - FK to authors (which admin)
- `performed_at` - Timestamp
- `metadata` - JSONB for extra context

### New Column on `authors` Table

```sql
is_admin BOOLEAN NOT NULL DEFAULT FALSE
```

## RLS Policies

### Public Users (Unauthenticated)

```
SELECT prompts WHERE moderation_status = 'approved'
```

Can only see approved prompts on:
- Home page, Explore page
- Search results
- Categories & trending
- Recommendations & popular
- Author profiles (only their approved prompts)
- Related prompts (only approved)

### Authors (Authenticated but not admin)

```
SELECT prompts WHERE moderation_status = 'approved' OR author_id = current_user
SELECT FROM prompt_* WHERE prompt is visible to author
```

Can see:
- All approved prompts (like public users)
- Their own pending prompts (with "Pending Review" badge)
- Their own rejected prompts (with rejection reason)

Cannot:
- See other users' pending or rejected prompts
- Approve, reject, or restore prompts
- Access moderation dashboard

### Admins (Authenticated with is_admin = TRUE)

```
Full access to all prompts, all statuses
Full access to rejected_prompts and moderation_logs
Can execute moderation functions
```

## API Endpoints (TypeScript Services)

### New File: `src/lib/moderationService.ts`

#### Query Functions
- `getPendingPrompts(filters)` - Get pending queue
- `getApprovedPrompts(filters)` - Get approved prompts
- `getRejectedPrompts(filters)` - Get rejected prompts

#### Action Functions
- `approvePrompt(promptId, adminId)` - Approve a prompt
- `rejectPrompt(promptId, adminId, reason)` - Reject and archive
- `restoreRejectedPrompt(rejectedId, adminId)` - Restore to pending
- `deleteRejectedPrompt(rejectedId, adminId)` - Permanently delete

#### Utility Functions
- `getModerationLogs(promptId)` - Get audit trail
- `isCurrentUserAdmin()` - Check admin status
- `getCurrentAuthor()` - Get current user's author data

## UI Components

### New Components

#### 1. `AdminModerationView.tsx`
- Main moderation dashboard with 3 tabs
- Pending, Approved, Rejected prompts
- Search and sort filters
- Reuses existing prompt card components

#### 2. `ModerationQueueCard.tsx`
- Card component for pending/approved prompts
- Shows moderation badge, stats
- Approve/Reject buttons for pending
- Uses rejection reason dialog

#### 3. `RejectedPromptCard.tsx`
- Card component for rejected prompts
- Shows rejection reason in alert
- Restore and Delete buttons
- Deletion requires confirmation

#### 4. `ModerationStatusBadge.tsx`
- Small badge component showing status
- Color-coded: green (approved), yellow (pending), red (rejected)
- Tooltip showing detailed status info
- Reusable on prompt detail page

#### 5. `AdminModerationPage.tsx`
- Page component with admin access check
- Wraps AdminModerationView
- Redirects non-admins to home page

### Updated Components

#### `PromptDetailView.tsx`
Add moderation badge to show prompt status to author

#### `SubmitPromptView.tsx`
Update info text to clarify submissions go to review queue

#### `PromptCard.tsx`
Could optionally show badge for pending/rejected (author view only)

## Routes

### New Route

```
/admin/moderation
  - Protected route (ProtectedRoute wrapper)
  - Admin check inside page component
  - AdminModerationPage component
```

## Workflow Scenarios

### Scenario 1: Author Submits New Prompt

1. Author fills out SubmitPromptView form
2. Author clicks "Confirm & Publish Prompt"
3. SubmitPromptPage calls `actions.publishPrompt(payload)`
4. Prompt saved with:
   - `moderation_status = 'pending'`
   - `submitted_at = NOW()`
5. Trigger fires: `log_prompt_submission()` creates moderation_log entry
6. Author redirected to `/prompt/{id}`
7. Author sees their prompt with "Pending Review" badge
8. Public users cannot see this prompt

### Scenario 2: Admin Approves Prompt

1. Admin navigates to `/admin/moderation`
2. Clicks "Pending" tab to see queue
3. Sees card for author's prompt
4. Clicks "Approve" button
5. Calls `approvePrompt(promptId, adminId)`
   - Updates prompt: `moderation_status = 'approved'`, `approved_at = NOW()`, `approved_by = adminId`
   - Creates log entry with action='approved'
6. Toast: "Prompt approved successfully"
7. Card disappears from pending, reappears in approved tab
8. Prompt now visible to public users via search, explore, etc.
9. Author sees badge changed to "Approved"

### Scenario 3: Admin Rejects Prompt

1. Admin sees pending prompt
2. Clicks "Reject" button
3. Dialog opens with rejection reason dropdown
4. Admin selects "Low quality" (or types custom reason)
5. Confirms rejection
6. Calls `rejectPrompt(promptId, adminId, reason)`
   - Inserts snapshot into rejected_prompts table
   - Updates prompt to `moderation_status = 'rejected'`
   - Creates log entry with action='rejected', reason='Low quality'
7. Prompt moved to "Rejected" tab
8. Author notified (future: email/notification)
9. Author sees their rejected prompt with reason displayed
10. Original prompt not visible to public (was never approved)

### Scenario 4: Author's Prompt Rejected, They Restore It

1. Author views their profile/saved section
2. Sees rejected prompt with reason
3. Clicks "Restore" button on rejected prompt card
4. Calls `restoreRejectedPrompt(rejectedId, adminId)`
   - Creates new prompt entry (same content, new id)
   - Sets new prompt to `moderation_status = 'pending'`
   - Deletes old entry from rejected_prompts
   - Creates log entry with action='restored'
5. New prompt goes back to moderation queue
6. Admin sees it in "Pending" tab again
7. Cycle repeats

### Scenario 5: Admin Permanently Deletes Rejected Prompt

1. Admin sees rejected prompt
2. Clicks "Delete" button
3. Confirmation dialog appears
4. Confirms permanent deletion
5. Calls `deleteRejectedPrompt(rejectedId, adminId)`
   - Deletes from rejected_prompts table
6. Toast: "Prompt permanently deleted"
7. Cannot be recovered

## Database Functions (PostgreSQL)

### `approve_prompt(p_prompt_id UUID, p_admin_id UUID) → jsonb`

Approves a prompt and logs the action.

**Returns:**
```json
{
  "success": true,
  "message": "Prompt approved successfully",
  "prompt_id": "uuid"
}
```

### `reject_prompt(p_prompt_id UUID, p_admin_id UUID, p_rejection_reason TEXT) → jsonb`

Archives prompt and marks as rejected.

**Returns:**
```json
{
  "success": true,
  "message": "Prompt rejected and archived",
  "prompt_id": "uuid"
}
```

### `restore_rejected_prompt(p_rejected_prompt_id UUID, p_admin_id UUID) → jsonb`

Restores a rejected prompt as a new pending submission.

**Returns:**
```json
{
  "success": true,
  "message": "Prompt restored to pending status",
  "new_prompt_id": "uuid"
}
```

### `delete_rejected_prompt(p_rejected_prompt_id UUID, p_admin_id UUID) → jsonb`

Permanently deletes a rejected prompt record.

**Returns:**
```json
{
  "success": true,
  "message": "Rejected prompt permanently deleted",
  "rejected_prompt_id": "uuid"
}
```

### `cleanup_old_rejected_prompts() → TABLE(deleted_count INT)`

Removes rejected prompts older than retention period (30 days).

**Usage:**
```sql
SELECT * FROM cleanup_old_rejected_prompts();
-- Returns count of deleted records

-- Schedule with pg_cron:
SELECT cron.schedule('cleanup_rejected_prompts', '0 2 * * *', 
  'SELECT cleanup_old_rejected_prompts()');
```

## Triggers

### `trigger_log_prompt_submission`

Fires on INSERT to prompts table.

**Action:** Creates entry in moderation_logs with action='submitted'

## Indexes for Performance

```sql
-- Moderation queue queries
idx_prompts_moderation_status
idx_prompts_submitted_at
idx_prompts_moderation_status_created
idx_prompts_author_moderation

-- Approval tracking
idx_prompts_approved_at

-- Admin lookups
idx_authors_is_admin

-- Rejected prompts
idx_rejected_prompts_author_id
idx_rejected_prompts_rejected_at
idx_rejected_prompts_retained_until

-- Audit logs
idx_moderation_logs_prompt_id
idx_moderation_logs_performed_at
idx_moderation_logs_action
```

## Deployment Steps

### Phase 1: Database Migration

1. **Backup production database**
2. **Review migration script** (001_moderation_system_complete.sql)
3. **Run migration** via Supabase dashboard or CLI:
   ```bash
   supabase db push
   ```
4. **Verify** all tables and functions created
5. **Set admin users**:
   ```sql
   UPDATE authors SET is_admin = TRUE WHERE handle = '@admin_username';
   ```
6. **(Optional) Set up pg_cron**:
   ```sql
   SELECT cron.schedule('cleanup_rejected_prompts', '0 2 * * *', 
     'SELECT cleanup_old_rejected_prompts()');
   ```

### Phase 2: Code Deployment

1. **Deploy TypeScript files:**
   - `src/lib/moderationService.ts`
   - `src/components/AdminModerationView.tsx`
   - `src/components/ModerationQueueCard.tsx`
   - `src/components/RejectedPromptCard.tsx`
   - `src/components/ModerationStatusBadge.tsx`
   - `src/pages/AdminModerationPage.tsx`

2. **Update TypeScript files:**
   - `src/types.ts` - Add new types (already done)
   - `src/routes/AppRoutes.tsx` - Add admin route (already done)

3. **Update Components** (optional, for better UX):
   - `PromptDetailView.tsx` - Add status badge for author view
   - `SubmitPromptView.tsx` - Update info text about review process

### Phase 3: Testing

1. **Admin user creation:**
   - Have one user create a test account
   - Make them admin via database

2. **Submit test prompt:**
   - Submit new prompt as non-admin user
   - Verify it appears in pending queue
   - Verify it's NOT visible to public on explore/search

3. **Test approval workflow:**
   - Admin approves the prompt
   - Verify prompt now visible on explore page
   - Verify author sees "Approved" badge
   - Verify moderation_logs entry created

4. **Test rejection workflow:**
   - Submit another test prompt
   - Admin rejects with reason
   - Verify prompt moved to rejected tab
   - Verify author can see reason
   - Verify prompt NOT visible to public

5. **Test restore workflow:**
   - Author restores their rejected prompt
   - Verify new prompt created with new id
   - Verify old rejected entry deleted
   - Verify appears in pending queue again

6. **Test permanent delete:**
   - Admin deletes rejected prompt
   - Verify record completely removed

### Phase 4: Production Monitoring

1. **Monitor moderation queue:**
   - How many pending prompts accumulate?
   - What's average approval/rejection time?

2. **Watch for rejection patterns:**
   - Most common rejection reasons
   - Which authors resubmit most?

3. **Track performance:**
   - Admin dashboard load times
   - Database query performance

## Future Enhancements

### Email Notifications
```typescript
// When prompt approved:
sendEmail(author.email, {
  subject: "Your Prompt Was Approved!",
  template: "prompt_approved",
  data: { promptTitle, approvalDate }
});

// When prompt rejected:
sendEmail(author.email, {
  subject: "Your Prompt Needs Revision",
  template: "prompt_rejected",
  data: { promptTitle, rejectionReason }
});
```

### In-App Notifications
```typescript
// In notification service:
createNotification({
  type: 'prompt_approved',
  userId: authorId,
  message: `Your prompt "${title}" has been approved!`,
  promptId: promptId
});
```

### WebSocket Real-Time Updates
- Admins get live updates when new prompts submitted
- Authors get real-time approval/rejection notifications

### Moderation Queue Statistics
```typescript
export async function getModerationStats() {
  return {
    pending: await db.count('prompts').eq('moderation_status', 'pending'),
    approved_today: await db.count('prompts').eq('moderation_status', 'approved').gte('approved_at', today),
    rejected_week: await db.count('rejected_prompts').gte('rejected_at', oneWeekAgo),
    avg_approval_time_hours: 24  // Calculate from logs
  };
}
```

### Bulk Operations
```typescript
// Approve multiple prompts
export async function approveBulk(promptIds: string[], adminId: string) {
  for (const id of promptIds) {
    await approvePrompt(id, adminId);
  }
}

// Reject multiple with same reason
export async function rejectBulk(promptIds: string[], adminId: string, reason: string) {
  for (const id of promptIds) {
    await rejectPrompt(id, adminId, reason);
  }
}
```

### Moderation Templates
```typescript
const REJECTION_TEMPLATES = {
  'Low Quality': 'This prompt does not meet our quality standards. Please review the guidelines and resubmit.',
  'Duplicate': 'A similar prompt already exists in our database.',
  'Spam': 'This appears to be spam or promotional content.',
  'Copyright': 'This content may violate copyright. Please ensure you have rights.',
  'Offensive': 'This content violates our community guidelines.'
};
```

## Migration Rollback

If needed, all changes can be rolled back using the SQL script at the end of the migration file. This will:
- Drop all new tables
- Drop all new functions and triggers
- Remove new columns
- Drop new indexes
- Restore original RLS policies

**WARNING:** This cannot be used after approved prompts have been in the system, as data would be lost.

## File Summary

### New Files Created
- `supabase/migrations/001_moderation_system_complete.sql` - Complete DB migration
- `src/lib/moderationService.ts` - Moderation service layer
- `src/components/AdminModerationView.tsx` - Admin dashboard
- `src/components/ModerationQueueCard.tsx` - Card for pending/approved
- `src/components/RejectedPromptCard.tsx` - Card for rejected prompts
- `src/components/ModerationStatusBadge.tsx` - Status badge component
- `src/pages/AdminModerationPage.tsx` - Admin page with access control

### Modified Files
- `src/types.ts` - Added moderation types
- `src/routes/AppRoutes.tsx` - Added admin route

### Reference Files
- This document (MODERATION_SYSTEM.md)

## Troubleshooting

### Prompt visible to public but not approved
- Check RLS policies are correct
- Check `moderation_status` is actually 'approved' in database
- Check user is not admin (admins see all)

### Admin can't access moderation dashboard
- Check user's `is_admin` flag in authors table
- Check auth.uid() matches user_id in authors
- Clear browser cache and refresh

### Rejected prompt restoration creates wrong slug
- This is expected - new slug includes timestamp to avoid conflicts
- Can be fixed by manually updating slug after restoration

### Old rejected prompts not being cleaned up
- Check pg_cron is installed and running (Supabase may not have it enabled)
- Manually run cleanup: `SELECT cleanup_old_rejected_prompts();`
- Or schedule via Supabase job scheduler if available

## Support & Questions

Refer to:
1. Database schema comments in migration file
2. Function docstrings in moderationService.ts
3. Component JSDoc comments
4. RLS policy descriptions in SQL

