-- Migration 016: Production-Grade Prompt Copy & Metric System
-- Handles atomic copy counter increments, deduplication, event logging, and RLS permissions.

-- 1. Ensure prompt_events table exists with required columns
create table if not exists public.prompt_events (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references public.prompts(id) on delete cascade,
  user_id uuid,
  event_type text not null,
  event_metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Index for prompt events analytics queries
create index if not exists idx_prompt_events_prompt_user_type
  on public.prompt_events(prompt_id, user_id, event_type, created_at);

-- Enable RLS on prompt_events
alter table public.prompt_events enable row level security;

-- RLS policies for prompt_events
drop policy if exists "Users can read own prompt events" on public.prompt_events;
create policy "Users can read own prompt events" on public.prompt_events
  for select using (auth.uid() = user_id or user_id is null);

drop policy if exists "Authenticated users can insert prompt events" on public.prompt_events;
create policy "Authenticated users can insert prompt events" on public.prompt_events
  for insert with check (auth.uid() = user_id or user_id is null);

-- 2. Dynamic Drop of existing functions to prevent signature/parameter overload conflicts
do $$
declare
  r record;
begin
  for r in select oid::regprocedure as func_name from pg_proc where proname in ('increment_prompt_copy', 'record_prompt_copy') and pronamespace = 'public'::regnamespace loop
    execute 'drop function ' || r.func_name || ' cascade';
  end loop;
end $$;

drop function if exists public.increment_prompt_copy(uuid) cascade;
drop function if exists public.record_prompt_copy(uuid) cascade;

-- 3. Primary RPC Function: increment_prompt_copy
create or replace function public.increment_prompt_copy(prompt_id_input uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_new_copies int := 0;
  v_last_event timestamp with time zone;
begin
  if prompt_id_input is null then
    raise exception 'prompt_id_input cannot be null';
  end if;

  -- Deduplication check: prevent rapid double-clicks from same user/session within 5 seconds
  if v_user_id is not null then
    select created_at into v_last_event
    from public.prompt_events
    where prompt_id = prompt_id_input
      and user_id = v_user_id
      and event_type = 'copy'
    order by created_at desc
    limit 1;

    if v_last_event is not null and v_last_event > (now() - interval '5 seconds') then
      -- Duplicate click within 5s window -> return current count without double counting
      select copies into v_new_copies
      from public.prompt_metrics
      where prompt_id = prompt_id_input;

      return jsonb_build_object(
        'success', true,
        'copies', coalesce(v_new_copies, 0),
        'deduplicated', true
      );
    end if;
  end if;

  -- Log copy event
  insert into public.prompt_events (prompt_id, user_id, event_type, event_metadata, created_at)
  values (prompt_id_input, v_user_id, 'copy', jsonb_build_object('timestamp', now()), now());

  -- Ensure prompt_metrics row exists and update copies atomically
  insert into public.prompt_metrics (prompt_id, views, copies, bookmarks, rating_count, rating_average, updated_at)
  values (prompt_id_input, 0, 1, 0, 0, null, now())
  on conflict (prompt_id) do update
  set copies = coalesce(prompt_metrics.copies, 0) + 1,
      updated_at = now();

  -- Get authoritative updated count
  select copies into v_new_copies
  from public.prompt_metrics
  where prompt_id = prompt_id_input;

  -- Update prompt_analytics table if present
  begin
    insert into public.prompt_analytics (prompt_id, copies, updated_at)
    values (prompt_id_input, 1, now())
    on conflict (prompt_id) do update
    set copies = coalesce(prompt_analytics.copies, 0) + 1,
        updated_at = now();
  exception when others then
    -- Ignore if prompt_analytics table doesn't exist
  end;

  return jsonb_build_object(
    'success', true,
    'copies', coalesce(v_new_copies, 1),
    'deduplicated', false
  );
end;
$$;

-- Grant execution permissions
grant execute on function public.increment_prompt_copy(uuid) to authenticated, anon;
