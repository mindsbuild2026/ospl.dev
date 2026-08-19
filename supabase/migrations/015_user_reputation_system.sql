-- Migration 015: User Reputation Points System
-- Implements event-based, deterministic, auditable reputation calculation and idempotency.

-- 1. Create author_reputation_logs table for auditable events & admin adjustments
create table if not exists public.author_reputation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  author_id uuid references public.authors(id) on delete cascade,
  event_type text not null check (event_type in ('prompt_approved', 'rating_received', 'verified_bonus', 'admin_adjustment')),
  points integer not null,
  reference_id text,
  description text,
  created_at timestamptz not null default now()
);

-- Unique index to enforce idempotency on (author_id, event_type, reference_id)
create unique index if not exists idx_reputation_log_unique
  on public.author_reputation_logs(author_id, event_type, reference_id)
  where reference_id is not null;

create index if not exists idx_reputation_log_user on public.author_reputation_logs(user_id);
create index if not exists idx_reputation_log_author on public.author_reputation_logs(author_id);

alter table public.author_reputation_logs enable row level security;

drop policy if exists "Users can read own reputation logs" on public.author_reputation_logs;
create policy "Users can read own reputation logs" on public.author_reputation_logs
  for select
  using (
    auth.uid() = user_id or
    exists (select 1 from public.authors where user_id = auth.uid() and (is_admin = true or reputation >= 5000))
  );

-- 2. Master Function: recalculate_author_reputation
do $$
declare
  r record;
begin
  for r in select oid::regprocedure as func_name from pg_proc where proname in ('recalculate_author_reputation', 'update_author_reputation', 'admin_adjust_reputation', 'get_author_reputation_history') and pronamespace = 'public'::regnamespace loop
    execute 'drop function ' || r.func_name || ' cascade';
  end loop;
end $$;

create or replace function public.recalculate_author_reputation(p_user_id_input uuid)
returns integer
language plpgsql
security definer
as $$
declare
  v_author_id uuid;
  v_user_id uuid;
  v_is_verified boolean := false;
  v_approved_count int := 0;
  v_5star_count int := 0;
  v_4star_count int := 0;
  v_admin_adjustments int := 0;
  v_total int := 0;
begin
  if p_user_id_input is null then
    return 0;
  end if;

  -- Find matching author row
  select id, user_id, coalesce(verified, false)
  into v_author_id, v_user_id, v_is_verified
  from public.authors
  where user_id = p_user_id_input or id = p_user_id_input
  limit 1;

  if v_author_id is null then
    return 0;
  end if;

  -- 1. Count approved prompts (+50 pts each)
  select count(*)
  into v_approved_count
  from public.prompts
  where author_id = v_author_id
    and moderation_status = 'approved';

  -- 2. Count 5-star ratings received from other users on approved prompts (+10 pts each)
  select count(*)
  into v_5star_count
  from public.ratings r
  join public.prompts p on p.id = r.prompt_id
  where p.author_id = v_author_id
    and p.moderation_status = 'approved'
    and r.rating_value = 5
    and r.user_id != v_user_id;

  -- 3. Count 4-star ratings received from other users on approved prompts (+5 pts each)
  select count(*)
  into v_4star_count
  from public.ratings r
  join public.prompts p on p.id = r.prompt_id
  where p.author_id = v_author_id
    and p.moderation_status = 'approved'
    and r.rating_value = 4
    and r.user_id != v_user_id;

  -- 4. Calculate total admin manual adjustments
  select coalesce(sum(points), 0)
  into v_admin_adjustments
  from public.author_reputation_logs
  where author_id = v_author_id
    and event_type = 'admin_adjustment';

  -- Calculate Total Reputation
  v_total := (v_approved_count * 50) + (v_5star_count * 10) + (v_4star_count * 5) + (case when v_is_verified then 100 else 0 end) + v_admin_adjustments;

  if v_total < 0 then
    v_total := 0;
  end if;

  -- Update authors table atomically
  update public.authors
  set reputation = v_total,
      updated_at = now()
  where id = v_author_id;

  return v_total;
end;
$$;

-- Alias helper function for RPC calls taking user_id_input
create or replace function public.update_author_reputation(user_id_input uuid)
returns integer
language plpgsql
security definer
as $$
begin
  return public.recalculate_author_reputation(user_id_input);
end;
$$;

-- 3. RPC Function: admin_adjust_reputation
create or replace function public.admin_adjust_reputation(p_author_id uuid, p_points int, p_reason text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_caller_id uuid := auth.uid();
  v_is_admin boolean := false;
  v_target_user_id uuid;
  v_new_reputation int;
begin
  if v_caller_id is not null then
    select coalesce(is_admin, false) into v_is_admin
    from public.authors
    where user_id = v_caller_id;
  end if;

  if not v_is_admin then
    raise exception 'Unauthorized: Admin access required';
  end if;

  select user_id into v_target_user_id
  from public.authors
  where id = p_author_id or user_id = p_author_id;

  if v_target_user_id is null then
    raise exception 'Author not found';
  end if;

  -- Insert admin adjustment audit log
  insert into public.author_reputation_logs (user_id, author_id, event_type, points, description, created_at)
  values (v_target_user_id, p_author_id, 'admin_adjustment', p_points, coalesce(p_reason, 'Admin manual adjustment'), now());

  -- Recalculate author reputation
  v_new_reputation := public.recalculate_author_reputation(v_target_user_id);

  return jsonb_build_object(
    'success', true,
    'new_reputation', v_new_reputation,
    'points_added', p_points
  );
end;
$$;

-- 4. RPC Function: get_author_reputation_history
create or replace function public.get_author_reputation_history(p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_author_id uuid;
  v_user_id uuid;
  v_is_verified boolean := false;
  v_approved_count int := 0;
  v_5star_count int := 0;
  v_4star_count int := 0;
  v_admin_adjustments int := 0;
  v_total int := 0;
  v_logs jsonb;
begin
  select id, user_id, coalesce(verified, false)
  into v_author_id, v_user_id, v_is_verified
  from public.authors
  where user_id = p_user_id or id = p_user_id
  limit 1;

  if v_author_id is null then
    return jsonb_build_object(
      'totalReputation', 0,
      'approvedPromptsCount', 0,
      'fiveStarRatingsCount', 0,
      'fourStarRatingsCount', 0,
      'isVerified', false,
      'adminAdjustmentsTotal', 0,
      'events', '[]'::jsonb
    );
  end if;

  select count(*) into v_approved_count
  from public.prompts
  where author_id = v_author_id and moderation_status = 'approved';

  select count(*) into v_5star_count
  from public.ratings r
  join public.prompts p on p.id = r.prompt_id
  where p.author_id = v_author_id and p.moderation_status = 'approved' and r.rating_value = 5 and r.user_id != v_user_id;

  select count(*) into v_4star_count
  from public.ratings r
  join public.prompts p on p.id = r.prompt_id
  where p.author_id = v_author_id and p.moderation_status = 'approved' and r.rating_value = 4 and r.user_id != v_user_id;

  select coalesce(sum(points), 0) into v_admin_adjustments
  from public.author_reputation_logs
  where author_id = v_author_id and event_type = 'admin_adjustment';

  v_total := public.recalculate_author_reputation(v_user_id);

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'userId', user_id,
    'authorId', author_id,
    'eventType', event_type,
    'points', points,
    'referenceId', reference_id,
    'description', description,
    'createdAt', created_at
  ) order by created_at desc), '[]'::jsonb)
  into v_logs
  from public.author_reputation_logs
  where author_id = v_author_id;

  return jsonb_build_object(
    'totalReputation', v_total,
    'approvedPromptsCount', v_approved_count,
    'fiveStarRatingsCount', v_5star_count,
    'fourStarRatingsCount', v_4star_count,
    'isVerified', v_is_verified,
    'adminAdjustmentsTotal', v_admin_adjustments,
    'events', v_logs
  );
end;
$$;

-- 5. Automatic Triggers for Reputation Recalculation

-- Trigger on prompts table (fires upon moderation status change)
create or replace function public.on_prompt_status_recalculate_reputation()
returns trigger as $$
declare
  v_author_user_id uuid;
begin
  if (TG_OP = 'UPDATE' and OLD.moderation_status IS DISTINCT FROM NEW.moderation_status)
     or TG_OP = 'INSERT' or TG_OP = 'DELETE' then
    
    select user_id into v_author_user_id
    from public.authors
    where id = coalesce(NEW.author_id, OLD.author_id);

    if v_author_user_id is not null then
      perform public.recalculate_author_reputation(v_author_user_id);
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_prompt_status_recalculate_reputation on public.prompts;
create trigger trigger_prompt_status_recalculate_reputation
  after insert or update of moderation_status or delete on public.prompts
  for each row execute function public.on_prompt_status_recalculate_reputation();

-- Trigger on ratings table (fires upon rating insert/update/delete)
create or replace function public.on_rating_recalculate_reputation()
returns trigger as $$
declare
  v_prompt_author_id uuid;
  v_author_user_id uuid;
begin
  select author_id into v_prompt_author_id
  from public.prompts
  where id = coalesce(NEW.prompt_id, OLD.prompt_id);

  if v_prompt_author_id is not null then
    select user_id into v_author_user_id
    from public.authors
    where id = v_prompt_author_id;

    if v_author_user_id is not null then
      perform public.recalculate_author_reputation(v_author_user_id);
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_rating_recalculate_reputation on public.ratings;
create trigger trigger_rating_recalculate_reputation
  after insert or update of rating_value or delete on public.ratings
  for each row execute function public.on_rating_recalculate_reputation();

-- 6. Safe Historical Data Reconciliation for all existing authors
do $$
declare
  r record;
begin
  for r in select user_id from public.authors where user_id is not null loop
    perform public.recalculate_author_reputation(r.user_id);
  end loop;
end $$;

grant execute on function public.recalculate_author_reputation(uuid) to authenticated, anon;
grant execute on function public.update_author_reputation(uuid) to authenticated, anon;
grant execute on function public.admin_adjust_reputation(uuid, int, text) to authenticated;
grant execute on function public.get_author_reputation_history(uuid) to authenticated, anon;
