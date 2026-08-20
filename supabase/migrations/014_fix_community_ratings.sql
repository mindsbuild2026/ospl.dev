-- 0. Fix legacy trigger bug on ratings table where NEW.verified was incorrectly referenced
create or replace function public.update_prompt_quality_score()
returns trigger as $$
declare
  rating_avg numeric;
  is_prompt_verified boolean := false;
begin
  select avg(rating_value) into rating_avg from public.ratings where prompt_id = NEW.prompt_id;
  select coalesce(verified, false) into is_prompt_verified from public.prompts where id = NEW.prompt_id;

  update public.prompts 
  set quality_score = least(
    coalesce(rating_avg::numeric(3, 2), 0) * 0.4 +
    least(1.0, coalesce((select count(*) from public.prompt_examples where prompt_id = NEW.prompt_id), 0) * 0.2) +
    least(1.0, coalesce((select count(*) from public.prompt_tags where prompt_id = NEW.prompt_id), 0) * 0.2) +
    case when is_prompt_verified then 1.0 else 0 end * 0.2,
    5.0
  )
  where id = NEW.prompt_id;

  return NEW;
end;
$$ language plpgsql security definer;

-- 1. Ensure unique constraint on ratings for (prompt_id, user_id)
create unique index if not exists prompt_ratings_prompt_user_unique
  on public.ratings(prompt_id, user_id)
  where user_id is not null;

-- 2. Ensure prompt_metrics initializes rating_count = 0 and rating_average = 0
create or replace function public.initialize_prompt_metrics()
returns trigger as $$
begin
  insert into public.prompt_metrics (prompt_id, views, copies, bookmarks, rating_count, rating_average)
  values (NEW.id, 0, 0, 0, 0, 0)
  on conflict (prompt_id) do nothing;
  return NEW;
end;
$$ language plpgsql security definer;

-- 3. RPC Function: rate_prompt
-- Performs upsert on ratings table and recalculates metrics
do $$
declare
  r record;
begin
  for r in select oid::regprocedure as func_name from pg_proc where proname in ('rate_prompt', 'get_prompt_rating_summary') and pronamespace = 'public'::regnamespace loop
    execute 'drop function ' || r.func_name || ' cascade';
  end loop;
end $$;

drop function if exists public.rate_prompt(uuid, int) cascade;
drop function if exists public.rate_prompt(uuid, integer) cascade;
drop function if exists public.get_prompt_rating_summary(uuid) cascade;

create or replace function public.rate_prompt(prompt_id_input uuid, rating_input int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_author_id uuid;
  v_count int;
  v_avg numeric;
  v_existing_id uuid;
begin
  if v_user_id is null then
    raise exception 'Must be authenticated to rate prompts';
  end if;

  if rating_input < 1 or rating_input > 5 then
    raise exception 'Rating must be an integer between 1 and 5';
  end if;

  -- Lookup author_id if present
  select id into v_author_id from public.authors where user_id = v_user_id limit 1;

  -- Check existing rating row
  select id into v_existing_id
  from public.ratings
  where prompt_id = prompt_id_input and user_id = v_user_id
  limit 1;

  if v_existing_id is not null then
    update public.ratings
    set rating_value = rating_input,
        updated_at = now()
    where id = v_existing_id;
  else
    insert into public.ratings (prompt_id, user_id, rating_value, created_at, updated_at)
    values (prompt_id_input, v_user_id, rating_input, now(), now());
  end if;

  -- Recalculate exact total count and average rating
  select count(*), round(avg(rating_value)::numeric, 1)
  into v_count, v_avg
  from public.ratings
  where prompt_id = prompt_id_input;

  -- Update prompt_metrics
  update public.prompt_metrics
  set rating_count = v_count,
      rating_average = v_avg,
      updated_at = now()
  where prompt_id = prompt_id_input;

  return jsonb_build_object(
    'success', true,
    'rating_average', v_avg,
    'rating_count', v_count,
    'user_rating', rating_input
  );
end;
$$;

-- 4. RPC Function: get_prompt_rating_summary
-- Returns total rating count, average, distribution breakdown (5 to 1 stars), and current user rating.
create or replace function public.get_prompt_rating_summary(p_prompt_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_count int := 0;
  v_avg numeric := null;
  v_user_rating int := null;
  v_c5 int := 0;
  v_c4 int := 0;
  v_c3 int := 0;
  v_c2 int := 0;
  v_c1 int := 0;
begin
  select count(*), round(avg(rating_value)::numeric, 1)
  into v_count, v_avg
  from public.ratings
  where prompt_id = p_prompt_id;

  if v_user_id is not null then
    select rating_value into v_user_rating
    from public.ratings
    where prompt_id = p_prompt_id and user_id = v_user_id
    limit 1;
  end if;

  select
    count(*) filter (where rating_value = 5),
    count(*) filter (where rating_value = 4),
    count(*) filter (where rating_value = 3),
    count(*) filter (where rating_value = 2),
    count(*) filter (where rating_value = 1)
  into v_c5, v_c4, v_c3, v_c2, v_c1
  from public.ratings
  where prompt_id = p_prompt_id;

  return jsonb_build_object(
    'rating_count', v_count,
    'average_rating', case when v_count > 0 then v_avg else null end,
    'user_rating', v_user_rating,
    'distribution', jsonb_build_object(
      '5', v_c5,
      '4', v_c4,
      '3', v_c3,
      '2', v_c2,
      '1', v_c1
    )
  );
end;
$$;

-- 5. Re-create prompt_details view cleanly
drop view if exists public.prompt_details cascade;

create view public.prompt_details as
select
  p.id,
  p.slug,
  p.title,
  p.short_description,
  p.description,
  p.category_id,
  c.name as category_name,
  p.subcategory_id,
  sc.name as subcategory_name,
  p.author_id,
  a.name as author_name,
  a.handle as author_handle,
  a.avatar_url as author_avatar_url,
  a.bio as author_bio,
  a.website as author_website,
  a.github as author_github,
  a.verified as author_verified,
  a.reputation as author_reputation,
  coalesce(a_prompt_counts.total_prompts, 0) as author_total_prompts,
  p.difficulty,
  pt.name as prompt_type,
  p.license_type,
  p.commercial_use,
  p.attribution_required,
  p.featured,
  p.verified,
  p.community_validated,
  p.current_version,
  p.meta_title,
  p.meta_description,
  p.seo_keywords,
  p.moderation_status,
  p.approved_by as reviewed_by,
  p.approved_at as reviewed_at,
  p.created_at,
  p.updated_at,
  pm.views,
  pm.copies,
  pm.likes,
  pm.bookmarks,
  pm.shares,
  pm.comments,
  pm.downloads,
  case when pm.rating_count > 0 then pm.rating_average else null end as rating,
  coalesce(pm.rating_count, 0) as rating_count,
  pm.popularity_rank,
  pm.trending_score,
  pm.weekly_growth,
  pm.has_proof,
  pm.success_rate,
  pm.tested_models,
  array_remove(array_agg(distinct t.name), NULL) as tags,
  array_remove(array_agg(distinct ap.name), NULL) as ai_platforms,
  jsonb_agg(distinct jsonb_build_object(
      'name', pv.name,
      'label', pv.label,
      'required', pv.required,
      'description', pv.description
  )) filter (where pv.id is not null) as variables,
  jsonb_agg(distinct jsonb_build_object(
      'title', pe.title,
      'input', pe.input,
      'output', pe.output
  )) filter (where pe.id is not null) as examples,
  jsonb_agg(distinct jsonb_build_object(
      'name', ptc.name,
      'input', ptc.input,
      'expectedResult', ptc.expected_result,
      'testedModel', ptc.tested_model
  )) filter (where ptc.id is not null) as test_cases,
  jsonb_agg(distinct jsonb_build_object(
      'type', ppi.type,
      'title', ppi.title,
      'url', ppi.url,
      'thumbnailUrl', ppi.thumbnail_url,
      'content', ppi.content,
      'description', ppi.description,
      'durationSeconds', ppi.duration_seconds
  )) filter (where ppi.id is not null) as proof_results,
  jsonb_agg(distinct jsonb_build_object(
      'name', prm.name,
      'provider', prm.provider
  )) filter (where prm.id is not null) as recommended_models,
  jsonb_agg(distinct jsonb_build_object(
      'id', col.id,
      'name', col.name,
      'slug', col.slug
  )) filter (where col.id is not null) as collections,
  jsonb_agg(distinct jsonb_build_object(
      'id', rp.related_prompt_id,
      'title', rp_prompt.title,
      'slug', rp_prompt.slug
  )) filter (where rp.id is not null) as related_prompts,
  jsonb_agg(distinct jsonb_build_object(
      'version', pvh.version,
      'releasedAt', pvh.released_at,
      'changes', pvh.changes
  )) filter (where pvh.id is not null) as version_history,
  jsonb_agg(distinct jsonb_build_object(
      'id', ind.id,
      'name', ind.name,
      'slug', ind.slug
  )) filter (where ind.id is not null) as industries,
  jsonb_agg(distinct jsonb_build_object(
      'id', tech.id,
      'name', tech.name,
      'slug', tech.slug
  )) filter (where tech.id is not null) as prompt_engineering_techniques,
  p.system_prompt,
  p.user_prompt,
  p.expected_output,
  p.prompt_mode,
  p.creator_mode,
  p.pipeline_type,
  p.temperature,
  p.max_tokens,
  p.output_format,
  p.structured_output_schema
from prompts p
left join categories c on c.id = p.category_id
left join subcategories sc on sc.id = p.subcategory_id
left join authors a on a.id = p.author_id
left join prompt_metrics pm on pm.prompt_id = p.id
left join prompt_types pt on pt.id = p.prompt_type_id
left join prompt_tags ptg on ptg.prompt_id = p.id
left join tags t on t.id = ptg.tag_id
left join prompt_ai_platforms pap on pap.prompt_id = p.id
left join ai_platforms ap on ap.id = pap.ai_platform_id
left join prompt_variables pv on pv.prompt_id = p.id
left join prompt_examples pe on pe.prompt_id = p.id
left join prompt_test_cases ptc on ptc.prompt_id = p.id
left join prompt_proof_items ppi on ppi.prompt_id = p.id
left join prompt_recommended_models prm on prm.prompt_id = p.id
left join prompt_collections pc on pc.prompt_id = p.id
left join collections col on col.id = pc.collection_id
left join prompt_related_prompts rp on rp.prompt_id = p.id
left join prompts rp_prompt on rp_prompt.id = rp.related_prompt_id
left join prompt_version_history pvh on pvh.prompt_id = p.id
left join prompt_industries pi on pi.prompt_id = p.id
left join industries ind on ind.id = pi.industry_id
left join prompt_techniques_map ptm on ptm.prompt_id = p.id
left join prompt_techniques tech on tech.id = ptm.technique_id
left join (
  select author_id, count(*) as total_prompts
  from prompts
  group by author_id
) a_prompt_counts on a_prompt_counts.author_id = a.id
group by
  p.id, c.name, sc.name,
  a.name, a.handle, a.avatar_url, a.bio, a.website, a.github, a.verified, a.reputation,
  a_prompt_counts.total_prompts,
  p.difficulty, pt.name, p.license_type, p.commercial_use, p.attribution_required,
  p.featured, p.verified, p.community_validated, p.current_version,
  p.meta_title, p.meta_description, p.seo_keywords,
  p.moderation_status, p.approved_by, p.approved_at,
  p.created_at, p.updated_at,
  pm.views, pm.copies, pm.likes, pm.bookmarks, pm.shares, pm.comments,
  pm.downloads, pm.rating_average, pm.rating_count, pm.popularity_rank,
  pm.trending_score, pm.weekly_growth, pm.has_proof, pm.success_rate,
  pm.tested_models, p.category_id, p.subcategory_id, p.author_id,
  p.system_prompt, p.user_prompt, p.expected_output, p.prompt_mode,
  p.creator_mode, p.pipeline_type, p.temperature, p.max_tokens,
  p.output_format, p.structured_output_schema;

grant select on public.prompt_details to authenticated, anon;
grant execute on function public.rate_prompt(uuid, int) to authenticated, anon;
grant execute on function public.get_prompt_rating_summary(uuid) to authenticated, anon;
