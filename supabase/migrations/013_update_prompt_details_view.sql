-- Migration 013: Recreate prompt_details view to include system_prompt, user_prompt, and workflow metadata columns.

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
  pm.rating_average as rating,
  pm.rating_count,
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
