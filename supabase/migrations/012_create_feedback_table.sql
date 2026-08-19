-- Migration 012: Create feedback table with Row Level Security (RLS)
-- Enables user feedback submission (authenticated & anonymous) and admin moderation.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),

  user_id uuid references auth.users(id) on delete set null,

  type text not null
    check (type in (
      'bug',
      'feature',
      'improvement',
      'general',
      'other'
    )),

  message text not null,

  rating smallint
    check (rating is null or (rating >= 1 and rating <= 5)),

  contact_email text,

  is_anonymous boolean not null default false,

  status text not null default 'new'
    check (status in (
      'new',
      'reviewed',
      'in_progress',
      'resolved',
      'archived'
    )),

  admin_notes text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

-- Performance Indexes
create index if not exists feedback_user_id_idx
  on public.feedback(user_id);

create index if not exists feedback_status_idx
  on public.feedback(status);

create index if not exists feedback_type_idx
  on public.feedback(type);

create index if not exists feedback_created_at_idx
  on public.feedback(created_at desc);

-- Enable Row Level Security
alter table public.feedback enable row level security;

-- Drop existing policies if any
drop policy if exists "Anyone can submit feedback" on public.feedback;
drop policy if exists "Admins can view feedback" on public.feedback;
drop policy if exists "Admins can update feedback" on public.feedback;
drop policy if exists "Admins can delete feedback" on public.feedback;

-- 1. INSERT policy: Anyone (anon or authenticated) can submit feedback.
-- Prevents impersonation by ensuring authenticated users can only insert with user_id = auth.uid() or user_id = null (if submitting anonymously).
-- Anonymous users (auth.uid() IS NULL) can only insert with user_id = null and is_anonymous = true.
create policy "Anyone can submit feedback"
  on public.feedback
  for insert
  with check (
    (auth.uid() is null and user_id is null and is_anonymous = true)
    or
    (auth.uid() is not null and (user_id = auth.uid() or (user_id is null and is_anonymous = true)))
  );

-- 2. SELECT policy: Restricted to authorized administrators.
create policy "Admins can view feedback"
  on public.feedback
  for select
  using (
    exists (
      select 1 from public.authors
      where authors.user_id = auth.uid()
        and authors.is_admin = true
    )
  );

-- 3. UPDATE policy: Restricted to authorized administrators.
create policy "Admins can update feedback"
  on public.feedback
  for update
  using (
    exists (
      select 1 from public.authors
      where authors.user_id = auth.uid()
        and authors.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.authors
      where authors.user_id = auth.uid()
        and authors.is_admin = true
    )
  );

-- 4. DELETE policy: Restricted to authorized administrators.
create policy "Admins can delete feedback"
  on public.feedback
  for delete
  using (
    exists (
      select 1 from public.authors
      where authors.user_id = auth.uid()
        and authors.is_admin = true
    )
  );

-- Table access permissions
grant select, insert, update, delete on public.feedback to authenticated;
grant insert on public.feedback to anon;
