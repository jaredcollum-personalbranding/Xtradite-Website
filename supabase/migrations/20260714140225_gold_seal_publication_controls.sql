-- Gold Seal publication controls.
-- Centralises public eligibility, closes relationship leaks, requires explicit
-- approval for location indexing and removes private governance columns from
-- direct anonymous/authenticated table reads.

create or replace function public.publication_is_effective(
  content_status text,
  published_at timestamptz,
  effective_at timestamptz default now()
)
returns boolean
language sql
stable
set search_path = ''
as $$
  select content_status = 'published' and published_at is not null and published_at <= effective_at;
$$;

create or replace function public.has_public_text(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select nullif(btrim(value), '') is not null;
$$;

revoke all on function public.publication_is_effective(text, timestamptz, timestamptz) from public;
revoke all on function public.has_public_text(text) from public;
grant execute on function public.publication_is_effective(text, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.has_public_text(text) to anon, authenticated;

alter table public.locations
  add column if not exists is_indexable boolean not null default false;

alter table public.location_services
  add column if not exists is_indexable boolean not null default false;

comment on column public.locations.is_indexable is
  'Explicit editorial approval for a complete location route to be publicly indexable.';
comment on column public.location_services.is_indexable is
  'Explicit editorial approval for a complete location-service route to be publicly indexable.';

create index if not exists locations_public_eligibility_idx
  on public.locations (status, is_indexable)
  where status = 'published' and is_indexable = true;

create index if not exists location_services_public_eligibility_idx
  on public.location_services (status, is_indexable, location_id, service_id)
  where status = 'published' and is_indexable = true;

-- Public blog access requires both editorial publication and an effective date.
drop policy if exists "Public read blog_posts" on public.blog_posts;
create policy "Public read blog_posts"
on public.blog_posts for select to anon, authenticated
using (public.publication_is_effective(status, first_published_at));

drop policy if exists "Public read blog post tags" on public.blog_post_tags;
create policy "Public read blog post tags"
on public.blog_post_tags for select to anon, authenticated
using (exists (
  select 1
  from public.blog_posts b
  where b.id = blog_post_id
    and public.publication_is_effective(b.status, b.first_published_at)
));

drop policy if exists "Public read service blog posts" on public.service_blog_posts;
create policy "Public read service blog posts"
on public.service_blog_posts for select to anon, authenticated
using (
  exists (
    select 1 from public.services s
    where s.id = service_id and s.status = 'published'
  )
  and exists (
    select 1 from public.blog_posts b
    where b.id = blog_post_id
      and public.publication_is_effective(b.status, b.first_published_at)
  )
);

-- A relationship is public only when both ends are independently public.
drop policy if exists "Public read service case studies" on public.service_case_studies;
create policy "Public read service case studies"
on public.service_case_studies for select to anon, authenticated
using (
  exists (
    select 1 from public.services s
    where s.id = service_id and s.status = 'published'
  )
  and exists (
    select 1 from public.case_studies c
    where c.id = case_study_id and c.status = 'published'
  )
);

-- Location base rows fail closed unless complete and explicitly approved.
drop policy if exists "Public read published locations" on public.locations;
create policy "Public read eligible locations"
on public.locations for select to anon, authenticated
using (
  status = 'published'
  and is_indexable = true
  and public.has_public_text(local_intro)
  and public.has_public_text(seo_title)
  and public.has_public_text(seo_description)
  and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  and latitude between -90 and 90
  and longitude between -180 and 180
);

drop policy if exists "Public read published location services" on public.location_services;
create policy "Public read eligible location services"
on public.location_services for select to anon, authenticated
using (
  status = 'published'
  and is_indexable = true
  and public.has_public_text(local_intro)
  and public.has_public_text(seo_title)
  and public.has_public_text(seo_description)
  and exists (
    select 1
    from public.locations l
    where l.id = location_id
      and l.status = 'published'
      and l.is_indexable = true
      and public.has_public_text(l.local_intro)
      and public.has_public_text(l.seo_title)
      and public.has_public_text(l.seo_description)
  )
  and exists (
    select 1
    from public.services s
    where s.id = service_id and s.status = 'published'
  )
);

create or replace view public.blog_posts_delivery
with (security_invoker = true)
as
select
  b.id,
  b.title,
  b.slug,
  b.excerpt,
  b.content_text,
  b.rich_content,
  b.cover_image_url,
  b.minutes_to_read,
  b.featured,
  b.pinned,
  b.first_published_at,
  b.created_at,
  b.updated_at,
  b.status,
  coalesce((
    select array_agg(t.name order by bt.sort_order)
    from public.blog_post_tags bt
    join public.tags t on t.id = bt.tag_id
    where bt.blog_post_id = b.id
  ), '{}'::text[]) as tags,
  b.seo_title,
  b.seo_description
from public.blog_posts b
where public.publication_is_effective(b.status, b.first_published_at);

create or replace view public.location_routes_delivery
with (security_invoker = true)
as
select
  l.id as location_id,
  l.name,
  l.slug,
  l.latitude,
  l.longitude,
  l.local_intro,
  l.seo_title,
  l.seo_description,
  greatest(l.updated_at, c.updated_at, r.updated_at, n.updated_at) as updated_at,
  c.id as county_id,
  c.name as county,
  c.slug as county_slug,
  r.id as region_id,
  r.name as region,
  r.slug as region_slug,
  n.id as nation_id,
  n.name as nation,
  n.slug as nation_slug,
  l.status,
  l.is_indexable
from public.locations l
join public.location_counties c on c.id = l.county_id and c.status = 'published'
join public.location_regions r on r.id = c.region_id and r.status = 'published'
join public.location_nations n on n.id = r.nation_id and n.status = 'published'
where l.status = 'published'
  and l.is_indexable = true
  and public.has_public_text(l.local_intro)
  and public.has_public_text(l.seo_title)
  and public.has_public_text(l.seo_description)
  and l.slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  and c.slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  and r.slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  and n.slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$';

create or replace view public.location_service_routes_delivery
with (security_invoker = true)
as
select
  ls.location_id,
  ls.service_id,
  ls.local_intro,
  ls.seo_title,
  ls.seo_description,
  ls.sort_order,
  greatest(ls.updated_at, l.updated_at, s.updated_at) as updated_at,
  l.name,
  l.slug,
  l.latitude,
  l.longitude,
  l.county,
  l.county_slug,
  l.region,
  l.region_slug,
  l.nation,
  l.nation_slug,
  s.slug as service_slug,
  s.title as service_title,
  s.category as service_category,
  s.summary as service_summary,
  s.hero_subheading as service_hero_subheading,
  coalesce(s.location_search_label, s.title) as service_search_label,
  s.status as service_status,
  ls.status as relationship_status,
  ls.is_indexable
from public.location_services ls
join public.location_routes_delivery l on l.location_id = ls.location_id
join public.services s on s.id = ls.service_id
where ls.status = 'published'
  and ls.is_indexable = true
  and s.status = 'published'
  and public.has_public_text(ls.local_intro)
  and public.has_public_text(ls.seo_title)
  and public.has_public_text(ls.seo_description)
  and s.slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$';

-- Preserve the delivery contract while making relationship target state explicit
-- for browser-side defensive filtering.
create or replace view public.services_delivery
with (security_invoker = true)
as
select id, title, slug, category, icon, summary, hero_subheading, description,
    sort_order, created_at, updated_at, status,
    coalesce((select jsonb_agg(li.content order by li.sort_order)
      from public.service_list_items li where li.service_id = s.id and li.kind = 'audience'), '[]'::jsonb) as who_its_for,
    coalesce((select jsonb_agg(li.content order by li.sort_order)
      from public.service_list_items li where li.service_id = s.id and li.kind = 'inclusion'), '[]'::jsonb) as what_included,
    coalesce((select jsonb_agg(jsonb_build_object('title', st.title, 'description', st.description) order by st.sort_order)
      from public.service_steps st where st.service_id = s.id), '[]'::jsonb) as how_it_works,
    coalesce((select jsonb_agg(li.content order by li.sort_order)
      from public.service_list_items li where li.service_id = s.id and li.kind = 'deliverable'), '[]'::jsonb) as deliverables,
    coalesce((select jsonb_agg(jsonb_build_object(
      'category', g.title,
      'items', coalesce((select jsonb_agg(jsonb_build_object('file', t.key, 'label', t.name, 'url', ma.public_url) order by st.sort_order)
        from public.service_technologies st
        join public.technologies t on t.id = st.technology_id
        left join public.media_assets ma on ma.id = t.logo_asset_id
        where st.group_id = g.id), '[]'::jsonb)
      ) order by g.sort_order)
      from public.service_technology_groups g where g.service_id = s.id), '[]'::jsonb) as tech_categories,
    coalesce((select jsonb_agg(jsonb_build_object('question', f.question, 'answer', f.answer) order by f.sort_order)
      from public.service_faqs f where f.service_id = s.id), '[]'::jsonb) as faqs,
    seo_title, seo_description,
    coalesce((select jsonb_agg(jsonb_build_object(
        'id', c.id,
        'slug', c.slug,
        'client', c.client,
        'challenge', c.challenge,
        'metric', c.metric,
        'status', c.status
      ) order by sc.sort_order)
      from public.service_case_studies sc
      join public.case_studies c on c.id = sc.case_study_id
      where sc.service_id = s.id and c.status = 'published'), '[]'::jsonb) as related_case_studies,
    coalesce((select jsonb_agg(jsonb_build_object(
        'id', b.id,
        'slug', b.slug,
        'title', b.title,
        'excerpt', b.excerpt,
        'coverImageUrl', b.cover_image_url,
        'minutesToRead', b.minutes_to_read,
        'firstPublishedDate', b.first_published_at,
        'tags', b.tags,
        'status', b.status
      ) order by sb.sort_order)
      from public.service_blog_posts sb
      join public.blog_posts_delivery b on b.id = sb.blog_post_id
      where sb.service_id = s.id), '[]'::jsonb) as related_blog_posts,
    coalesce((select jsonb_agg(jsonb_build_object(
      'id', u.id,
      'slug', u.slug,
      'category', u.category,
      'useCase', u.use_case,
      'explanation', u.explanation,
      'evidenceNote', u.evidence_note,
      'technologies', coalesce((select jsonb_agg(jsonb_build_object('key', t.key, 'name', t.name, 'url', ma.public_url) order by p.sort_order)
        from public.service_technology_use_case_products p
        join public.technologies t on t.id = p.technology_id
        left join public.media_assets ma on ma.id = t.logo_asset_id
        where p.use_case_id = u.id), '[]'::jsonb)
      ) order by u.sort_order)
      from public.service_technology_use_cases u
      where u.service_id = s.id and u.status = 'published'), '[]'::jsonb) as technology_examples
from public.services s
where status = 'published';

create or replace view public.published_content_sitemap
with (security_invoker = true)
as
  select 'service'::text as content_type, id, slug, canonical_path, updated_at, published_at
  from public.services
  where status = 'published' and noindex = false and canonical_path is not null
  union all
  select 'industry'::text, id, slug, canonical_path, updated_at, published_at
  from public.industries
  where status = 'published' and noindex = false and canonical_path is not null
  union all
  select 'case_study'::text, id, slug, canonical_path, updated_at, published_at
  from public.case_studies
  where status = 'published' and noindex = false and canonical_path is not null
  union all
  select 'blog_post'::text, id, slug, canonical_path, updated_at, first_published_at
  from public.blog_posts
  where public.publication_is_effective(status, first_published_at)
    and noindex = false
    and canonical_path is not null;

grant select on public.blog_posts_delivery,
  public.services_delivery,
  public.location_routes_delivery,
  public.location_service_routes_delivery,
  public.published_content_sitemap
  to anon, authenticated;

-- Remove direct access to private review ownership/timing fields while retaining
-- column-level access needed by security-invoker delivery views.
do $$
declare
  target_table text;
  allowed_columns text;
begin
  foreach target_table in array array['services', 'industries', 'case_studies', 'blog_posts']
  loop
    execute format('revoke select on public.%I from public, anon, authenticated', target_table);

    select string_agg(format('%I', column_name), ', ' order by ordinal_position)
      into allowed_columns
    from information_schema.columns
    where table_schema = 'public'
      and table_name = target_table
      and column_name not in ('editorial_owner', 'last_reviewed_at');

    execute format('grant select (%s) on public.%I to anon, authenticated', allowed_columns, target_table);
  end loop;
end
$$;