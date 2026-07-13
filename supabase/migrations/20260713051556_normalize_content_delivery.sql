-- Normalize reusable content, media mappings, and cross-content relationships.
-- Legacy JSON columns remain in place during the transition; delivery views expose
-- the same payload shapes from relational data.

-- -----------------------------------------------------------------------------
-- Publishing state and operational fields
-- -----------------------------------------------------------------------------

alter table public.services
  add column if not exists status text not null default 'published';
alter table public.industries
  add column if not exists status text not null default 'published';
alter table public.case_studies
  add column if not exists status text not null default 'published';
alter table public.blog_posts
  add column if not exists status text not null default 'published';
alter table public.contact_submissions
  add column if not exists status text not null default 'new';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'services_status_check' and conrelid = 'public.services'::regclass) then
    alter table public.services add constraint services_status_check check (status in ('draft', 'published', 'archived'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'industries_status_check' and conrelid = 'public.industries'::regclass) then
    alter table public.industries add constraint industries_status_check check (status in ('draft', 'published', 'archived'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'case_studies_status_check' and conrelid = 'public.case_studies'::regclass) then
    alter table public.case_studies add constraint case_studies_status_check check (status in ('draft', 'published', 'archived'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'blog_posts_status_check' and conrelid = 'public.blog_posts'::regclass) then
    alter table public.blog_posts add constraint blog_posts_status_check check (status in ('draft', 'published', 'archived'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'contact_submissions_status_check' and conrelid = 'public.contact_submissions'::regclass) then
    alter table public.contact_submissions add constraint contact_submissions_status_check check (status in ('new', 'in_progress', 'closed', 'spam'));
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Utility and normalized child tables
-- -----------------------------------------------------------------------------

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null unique,
  bucket_id text not null,
  object_path text not null,
  public_url text not null,
  alt_text text,
  mime_type text,
  width integer,
  height integer,
  bytes bigint,
  checksum text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket_id, object_path)
);

create table if not exists public.technologies (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  website_url text,
  logo_asset_id uuid references public.media_assets(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_list_items (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  kind text not null check (kind in ('audience', 'inclusion', 'deliverable')),
  content text not null check (char_length(btrim(content)) > 0),
  sort_order integer not null default 0,
  unique (service_id, kind, sort_order)
);

create table if not exists public.service_steps (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 0,
  unique (service_id, sort_order)
);

create table if not exists public.service_faqs (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  unique (service_id, sort_order)
);

create table if not exists public.service_technology_groups (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  unique (service_id, sort_order),
  unique (service_id, title)
);

create table if not exists public.service_technologies (
  group_id uuid not null references public.service_technology_groups(id) on delete cascade,
  technology_id uuid not null references public.technologies(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (group_id, technology_id),
  unique (group_id, sort_order)
);

create table if not exists public.case_study_metrics (
  id uuid primary key default gen_random_uuid(),
  case_study_id uuid not null references public.case_studies(id) on delete cascade,
  label text not null,
  value text not null,
  animate boolean not null default false,
  sort_order integer not null default 0,
  unique (case_study_id, sort_order)
);

create table if not exists public.case_study_approach_steps (
  id uuid primary key default gen_random_uuid(),
  case_study_id uuid not null references public.case_studies(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 0,
  unique (case_study_id, sort_order)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_post_tags (
  blog_post_id uuid not null references public.blog_posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (blog_post_id, tag_id),
  unique (blog_post_id, sort_order)
);

create table if not exists public.service_industries (
  service_id uuid not null references public.services(id) on delete cascade,
  industry_id uuid not null references public.industries(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (service_id, industry_id),
  unique (industry_id, sort_order)
);

create table if not exists public.case_study_industries (
  case_study_id uuid not null references public.case_studies(id) on delete cascade,
  industry_id uuid not null references public.industries(id) on delete cascade,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  primary key (case_study_id, industry_id)
);

create unique index if not exists case_study_industries_one_primary_idx
  on public.case_study_industries (case_study_id)
  where is_primary;

create table if not exists public.service_case_studies (
  service_id uuid not null references public.services(id) on delete cascade,
  case_study_id uuid not null references public.case_studies(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (service_id, case_study_id),
  unique (service_id, sort_order)
);

create table if not exists public.service_blog_posts (
  service_id uuid not null references public.services(id) on delete cascade,
  blog_post_id uuid not null references public.blog_posts(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (service_id, blog_post_id),
  unique (service_id, sort_order)
);

-- -----------------------------------------------------------------------------
-- Query indexes
-- -----------------------------------------------------------------------------

create index if not exists technologies_logo_asset_id_idx on public.technologies (logo_asset_id);
create index if not exists service_list_items_service_id_idx on public.service_list_items (service_id);
create index if not exists service_steps_service_id_idx on public.service_steps (service_id);
create index if not exists service_faqs_service_id_idx on public.service_faqs (service_id);
create index if not exists service_technology_groups_service_id_idx on public.service_technology_groups (service_id);
create index if not exists service_technologies_technology_id_idx on public.service_technologies (technology_id);
create index if not exists case_study_metrics_case_study_id_idx on public.case_study_metrics (case_study_id);
create index if not exists case_study_approach_steps_case_study_id_idx on public.case_study_approach_steps (case_study_id);
create index if not exists blog_post_tags_tag_id_idx on public.blog_post_tags (tag_id);
create index if not exists service_industries_industry_id_idx on public.service_industries (industry_id);
create index if not exists case_study_industries_industry_id_idx on public.case_study_industries (industry_id);
create index if not exists service_case_studies_case_study_id_idx on public.service_case_studies (case_study_id);
create index if not exists service_blog_posts_blog_post_id_idx on public.service_blog_posts (blog_post_id);

create index if not exists services_published_sort_idx on public.services (sort_order, id) where status = 'published';
create index if not exists industries_published_sort_idx on public.industries (sort_order, id) where status = 'published';
create index if not exists case_studies_published_sort_idx on public.case_studies (sort_order, id) where status = 'published';
create index if not exists blog_posts_published_date_idx on public.blog_posts (first_published_at desc, id desc) where status = 'published';
create index if not exists contact_submissions_created_at_idx on public.contact_submissions (created_at desc);
create index if not exists contact_submissions_new_idx on public.contact_submissions (created_at) where status = 'new';

alter table public.blog_posts
  add column if not exists search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content_text, ''))
  ) stored;
create index if not exists blog_posts_search_vector_idx on public.blog_posts using gin (search_vector);

-- -----------------------------------------------------------------------------
-- Backfill normalized content from the legacy JSON columns
-- -----------------------------------------------------------------------------

insert into public.service_list_items (service_id, kind, content, sort_order)
select s.id, 'audience', item.value, item.ordinality::integer
from public.services s
cross join lateral jsonb_array_elements_text(coalesce(s.who_its_for, '[]'::jsonb)) with ordinality as item(value, ordinality)
on conflict do nothing;

insert into public.service_list_items (service_id, kind, content, sort_order)
select s.id, 'inclusion', item.value, item.ordinality::integer
from public.services s
cross join lateral jsonb_array_elements_text(coalesce(s.what_included, '[]'::jsonb)) with ordinality as item(value, ordinality)
on conflict do nothing;

insert into public.service_list_items (service_id, kind, content, sort_order)
select s.id, 'deliverable', item.value, item.ordinality::integer
from public.services s
cross join lateral jsonb_array_elements_text(coalesce(s.deliverables, '[]'::jsonb)) with ordinality as item(value, ordinality)
on conflict do nothing;

insert into public.service_steps (service_id, title, description, sort_order)
select s.id, item.value->>'title', item.value->>'description', item.ordinality::integer
from public.services s
cross join lateral jsonb_array_elements(coalesce(s.how_it_works, '[]'::jsonb)) with ordinality as item(value, ordinality)
on conflict do nothing;

insert into public.service_faqs (service_id, question, answer, sort_order)
select s.id, item.value->>'question', item.value->>'answer', item.ordinality::integer
from public.services s
cross join lateral jsonb_array_elements(coalesce(s.faqs, '[]'::jsonb)) with ordinality as item(value, ordinality)
on conflict do nothing;

insert into public.case_study_metrics (case_study_id, label, value, animate, sort_order)
select c.id, item.value->>'label', item.value->>'value', coalesce((item.value->>'animate')::boolean, false), item.ordinality::integer
from public.case_studies c
cross join lateral jsonb_array_elements(coalesce(c.metrics, '[]'::jsonb)) with ordinality as item(value, ordinality)
on conflict do nothing;

insert into public.case_study_approach_steps (case_study_id, title, description, sort_order)
select c.id, item.value->>'title', item.value->>'description', item.ordinality::integer
from public.case_studies c
cross join lateral jsonb_array_elements(coalesce(c.approach, '[]'::jsonb)) with ordinality as item(value, ordinality)
on conflict do nothing;

with storage_logos as (
  select distinct on (substring(o.name from 'Brand=(.*), Style=Light[.]png$'))
    substring(o.name from 'Brand=(.*), Style=Light[.]png$') as asset_key,
    o.bucket_id,
    o.name as object_path,
    'https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/' || o.bucket_id || '/' ||
      replace(replace(o.name, ',', '%2C'), ' ', '%20') as public_url,
    o.metadata->>'mimetype' as mime_type,
    nullif(o.metadata->>'size', '')::bigint as bytes,
    o.created_at,
    o.updated_at
  from storage.objects o
  where o.bucket_id = 'rich-media'
    and o.name ~ '(^|/)Brand=.*Style=Light[.]png$'
  order by substring(o.name from 'Brand=(.*), Style=Light[.]png$'),
    (case when o.name like 'Tech Stack Logos/%' then 1 else 0 end),
    o.updated_at desc
)
insert into public.media_assets (asset_key, bucket_id, object_path, public_url, mime_type, bytes, created_at, updated_at)
select asset_key, bucket_id, object_path, public_url, mime_type, bytes, created_at, updated_at
from storage_logos
where asset_key is not null
on conflict (asset_key) do update set
  bucket_id = excluded.bucket_id,
  object_path = excluded.object_path,
  public_url = excluded.public_url,
  mime_type = excluded.mime_type,
  bytes = excluded.bytes,
  updated_at = excluded.updated_at;

with source_technologies as (
  select distinct on (item.value->>'file')
    item.value->>'file' as key,
    item.value->>'label' as name
  from public.services s
  cross join lateral jsonb_array_elements(coalesce(s.tech_categories, '[]'::jsonb)) as category(value)
  cross join lateral jsonb_array_elements(coalesce(category.value->'items', '[]'::jsonb)) as item(value)
  where nullif(item.value->>'file', '') is not null
  order by item.value->>'file', item.value->>'label'
)
insert into public.technologies (key, name, logo_asset_id)
select st.key, st.name, ma.id
from source_technologies st
left join public.media_assets ma on ma.asset_key = st.key
on conflict (key) do update set
  name = excluded.name,
  logo_asset_id = coalesce(excluded.logo_asset_id, public.technologies.logo_asset_id),
  updated_at = now();

insert into public.service_technology_groups (service_id, title, sort_order)
select s.id, category.value->>'category', category.ordinality::integer
from public.services s
cross join lateral jsonb_array_elements(coalesce(s.tech_categories, '[]'::jsonb)) with ordinality as category(value, ordinality)
on conflict do nothing;

insert into public.service_technologies (group_id, technology_id, sort_order)
select g.id, t.id, item.ordinality::integer
from public.services s
cross join lateral jsonb_array_elements(coalesce(s.tech_categories, '[]'::jsonb)) with ordinality as category(value, ordinality)
join public.service_technology_groups g
  on g.service_id = s.id and g.sort_order = category.ordinality::integer
cross join lateral jsonb_array_elements(coalesce(category.value->'items', '[]'::jsonb)) with ordinality as item(value, ordinality)
join public.technologies t on t.key = item.value->>'file'
on conflict do nothing;

insert into public.tags (name, slug)
select distinct tag_name,
  trim(both '-' from regexp_replace(lower(tag_name), '[^a-z0-9]+', '-', 'g'))
from public.blog_posts b
cross join lateral unnest(coalesce(b.tags, '{}'::text[])) as tag_name
where nullif(btrim(tag_name), '') is not null
on conflict (slug) do nothing;

insert into public.blog_post_tags (blog_post_id, tag_id, sort_order)
select b.id, t.id, tag.ordinality::integer
from public.blog_posts b
cross join lateral unnest(coalesce(b.tags, '{}'::text[])) with ordinality as tag(name, ordinality)
join public.tags t on t.slug = trim(both '-' from regexp_replace(lower(tag.name), '[^a-z0-9]+', '-', 'g'))
on conflict do nothing;

insert into public.case_study_industries (case_study_id, industry_id, is_primary, sort_order)
select c.id, i.id, true, 1
from public.case_studies c
join public.industries i on lower(i.title) = lower(c.industry)
on conflict do nothing;

with links(industry_slug, service_slug, sort_order) as (values
  ('retail', 'ecommerce-growth', 1), ('retail', 'operational-excellence', 2), ('retail', 'ai-automation', 3),
  ('ecommerce', 'ecommerce-growth', 1), ('ecommerce', 'digital-strategy', 2), ('ecommerce', 'ai-automation', 3),
  ('manufacturing', 'ai-automation', 1), ('manufacturing', 'operational-excellence', 2), ('manufacturing', 'project-delivery', 3),
  ('consumer-goods', 'operational-excellence', 1), ('consumer-goods', 'digital-strategy', 2), ('consumer-goods', 'project-delivery', 3),
  ('professional-services', 'fractional-leadership', 1), ('professional-services', 'operational-excellence', 2), ('professional-services', 'digital-strategy', 3),
  ('startups', 'fractional-leadership', 1), ('startups', 'digital-strategy', 2), ('startups', 'project-delivery', 3)
)
insert into public.service_industries (service_id, industry_id, sort_order)
select s.id, i.id, l.sort_order
from links l
join public.services s on s.slug = l.service_slug
join public.industries i on i.slug = l.industry_slug
on conflict do nothing;

with links(service_slug, case_study_slug, sort_order) as (values
  ('ai-automation', 'scale-up-consumer-brand-ai-operations', 1),
  ('digital-strategy', 'multi-marketplace-consumer-goods-brand', 1),
  ('ecommerce-growth', 'dtc-fragrance-beauty-retailer', 1),
  ('operational-excellence', 'fast-growth-fashion-retailer', 1),
  ('fractional-leadership', 'subscription-led-coffee-brand', 1),
  ('project-delivery', 'digital-healthcare-platform', 1)
)
insert into public.service_case_studies (service_id, case_study_id, sort_order)
select s.id, c.id, l.sort_order
from links l
join public.services s on s.slug = l.service_slug
join public.case_studies c on c.slug = l.case_study_slug
on conflict do nothing;

with links(service_slug, blog_post_slug, sort_order) as (values
  ('ai-automation', 'the-hidden-cost-of-manual-reconciliation', 1),
  ('ai-automation', 'why-growth-slows-when-systems-dont-speak-to-each-other', 2),
  ('digital-strategy', 'what-happens-when-strategy-outruns-operations', 1),
  ('digital-strategy', 'why-digital-transformation-fails-without-operational-readiness', 2),
  ('ecommerce-growth', 'how-better-fulfilment-data-improves-conversion', 1),
  ('ecommerce-growth', 'why-inventory-accuracy-is-a-revenue-issue', 2),
  ('operational-excellence', 'what-multi-channel-retailers-get-wrong-about-fulfilment', 1),
  ('operational-excellence', 'early-signs-your-fulfilment-data-is-costing-you-money', 2),
  ('fractional-leadership', 'fractional-leadership-the-smarter-way-to-access-senior-expertise', 1),
  ('fractional-leadership', 'when-to-hire-full-time-vs-fractional-leadership', 2),
  ('project-delivery', 'why-your-website-launch-didnt-fix-the-real-problem', 1),
  ('project-delivery', 'the-cost-of-treating-operations-as-an-afterthought', 2)
)
insert into public.service_blog_posts (service_id, blog_post_id, sort_order)
select s.id, b.id, l.sort_order
from links l
join public.services s on s.slug = l.service_slug
join public.blog_posts b on b.slug = l.blog_post_slug
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- RLS and grants
-- -----------------------------------------------------------------------------

alter table public.media_assets enable row level security;
alter table public.technologies enable row level security;
alter table public.service_list_items enable row level security;
alter table public.service_steps enable row level security;
alter table public.service_faqs enable row level security;
alter table public.service_technology_groups enable row level security;
alter table public.service_technologies enable row level security;
alter table public.case_study_metrics enable row level security;
alter table public.case_study_approach_steps enable row level security;
alter table public.tags enable row level security;
alter table public.blog_post_tags enable row level security;
alter table public.service_industries enable row level security;
alter table public.case_study_industries enable row level security;
alter table public.service_case_studies enable row level security;
alter table public.service_blog_posts enable row level security;

drop policy if exists "Public read services" on public.services;
drop policy if exists "Public read industries" on public.industries;
drop policy if exists "Public read case_studies" on public.case_studies;
drop policy if exists "Public read blog_posts" on public.blog_posts;
create policy "Public read services" on public.services for select to anon, authenticated using (status = 'published');
create policy "Public read industries" on public.industries for select to anon, authenticated using (status = 'published');
create policy "Public read case_studies" on public.case_studies for select to anon, authenticated using (status = 'published');
create policy "Public read blog_posts" on public.blog_posts for select to anon, authenticated using (status = 'published');

create policy "Public read active media" on public.media_assets for select to anon, authenticated using (status = 'active');
create policy "Public read active technologies" on public.technologies for select to anon, authenticated using (active);
create policy "Public read service list items" on public.service_list_items for select to anon, authenticated
  using (exists (select 1 from public.services s where s.id = service_id and s.status = 'published'));
create policy "Public read service steps" on public.service_steps for select to anon, authenticated
  using (exists (select 1 from public.services s where s.id = service_id and s.status = 'published'));
create policy "Public read service faqs" on public.service_faqs for select to anon, authenticated
  using (exists (select 1 from public.services s where s.id = service_id and s.status = 'published'));
create policy "Public read service technology groups" on public.service_technology_groups for select to anon, authenticated
  using (exists (select 1 from public.services s where s.id = service_id and s.status = 'published'));
create policy "Public read service technologies" on public.service_technologies for select to anon, authenticated
  using (exists (
    select 1 from public.service_technology_groups g
    join public.services s on s.id = g.service_id
    where g.id = group_id and s.status = 'published'
  ));
create policy "Public read case study metrics" on public.case_study_metrics for select to anon, authenticated
  using (exists (select 1 from public.case_studies c where c.id = case_study_id and c.status = 'published'));
create policy "Public read case study approach" on public.case_study_approach_steps for select to anon, authenticated
  using (exists (select 1 from public.case_studies c where c.id = case_study_id and c.status = 'published'));
create policy "Public read tags" on public.tags for select to anon, authenticated using (true);
create policy "Public read blog post tags" on public.blog_post_tags for select to anon, authenticated
  using (exists (select 1 from public.blog_posts b where b.id = blog_post_id and b.status = 'published'));
create policy "Public read service industries" on public.service_industries for select to anon, authenticated
  using (exists (select 1 from public.services s where s.id = service_id and s.status = 'published'));
create policy "Public read case study industries" on public.case_study_industries for select to anon, authenticated
  using (exists (select 1 from public.case_studies c where c.id = case_study_id and c.status = 'published'));
create policy "Public read service case studies" on public.service_case_studies for select to anon, authenticated
  using (exists (select 1 from public.services s where s.id = service_id and s.status = 'published'));
create policy "Public read service blog posts" on public.service_blog_posts for select to anon, authenticated
  using (exists (select 1 from public.services s where s.id = service_id and s.status = 'published'));

grant select on public.media_assets, public.technologies, public.service_list_items,
  public.service_steps, public.service_faqs, public.service_technology_groups,
  public.service_technologies, public.case_study_metrics,
  public.case_study_approach_steps, public.tags, public.blog_post_tags,
  public.service_industries, public.case_study_industries,
  public.service_case_studies, public.service_blog_posts to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Security-invoker delivery views. These preserve the frontend's current JSON shape
-- while sourcing arrays and relationships from normalized tables.
-- -----------------------------------------------------------------------------

create or replace view public.services_delivery
with (security_invoker = true) as
select
  s.id, s.title, s.slug, s.category, s.icon, s.summary, s.hero_subheading,
  s.description, s.sort_order, s.created_at, s.updated_at, s.status,
  coalesce((select jsonb_agg(li.content order by li.sort_order) from public.service_list_items li where li.service_id = s.id and li.kind = 'audience'), '[]'::jsonb) as who_its_for,
  coalesce((select jsonb_agg(li.content order by li.sort_order) from public.service_list_items li where li.service_id = s.id and li.kind = 'inclusion'), '[]'::jsonb) as what_included,
  coalesce((select jsonb_agg(jsonb_build_object('title', st.title, 'description', st.description) order by st.sort_order) from public.service_steps st where st.service_id = s.id), '[]'::jsonb) as how_it_works,
  coalesce((select jsonb_agg(li.content order by li.sort_order) from public.service_list_items li where li.service_id = s.id and li.kind = 'deliverable'), '[]'::jsonb) as deliverables,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'category', g.title,
        'items', coalesce((
          select jsonb_agg(jsonb_build_object('file', t.key, 'label', t.name, 'url', ma.public_url) order by st.sort_order)
          from public.service_technologies st
          join public.technologies t on t.id = st.technology_id
          left join public.media_assets ma on ma.id = t.logo_asset_id
          where st.group_id = g.id
        ), '[]'::jsonb)
      ) order by g.sort_order
    )
    from public.service_technology_groups g where g.service_id = s.id
  ), '[]'::jsonb) as tech_categories,
  coalesce((select jsonb_agg(jsonb_build_object('question', f.question, 'answer', f.answer) order by f.sort_order) from public.service_faqs f where f.service_id = s.id), '[]'::jsonb) as faqs,
  s.seo_title, s.seo_description,
  coalesce((
    select jsonb_agg(jsonb_build_object('id', c.id, 'slug', c.slug, 'client', c.client, 'challenge', c.challenge, 'metric', c.metric) order by sc.sort_order)
    from public.service_case_studies sc join public.case_studies c on c.id = sc.case_study_id
    where sc.service_id = s.id and c.status = 'published'
  ), '[]'::jsonb) as related_case_studies,
  coalesce((
    select jsonb_agg(jsonb_build_object('id', b.id, 'slug', b.slug, 'title', b.title, 'excerpt', b.excerpt, 'coverImageUrl', b.cover_image_url, 'minutesToRead', b.minutes_to_read, 'firstPublishedDate', b.first_published_at, 'tags', b.tags) order by sb.sort_order)
    from public.service_blog_posts sb join public.blog_posts b on b.id = sb.blog_post_id
    where sb.service_id = s.id and b.status = 'published'
  ), '[]'::jsonb) as related_blog_posts
from public.services s
where s.status = 'published';

create or replace view public.industries_delivery
with (security_invoker = true) as
select
  i.id, i.title, i.slug, i.summary, i.challenge, i.solution, i.outcomes,
  i.sort_order, i.created_at, i.updated_at, i.status,
  coalesce((
    select jsonb_agg(jsonb_build_object('id', s.id, 'slug', s.slug, 'title', s.title, 'icon', s.icon, 'summary', s.summary) order by si.sort_order)
    from public.service_industries si join public.services s on s.id = si.service_id
    where si.industry_id = i.id and s.status = 'published'
  ), '[]'::jsonb) as related_services
from public.industries i
where i.status = 'published';

create or replace view public.case_studies_delivery
with (security_invoker = true) as
select
  c.id, c.client, c.slug,
  coalesce((select i.title from public.case_study_industries ci join public.industries i on i.id = ci.industry_id where ci.case_study_id = c.id order by ci.is_primary desc, ci.sort_order limit 1), c.industry) as industry,
  c.headline, c.challenge, c.description, c.metric, c.sort_order,
  c.created_at, c.updated_at, c.status,
  coalesce((select jsonb_agg(jsonb_build_object('label', m.label, 'value', m.value, 'animate', m.animate) order by m.sort_order) from public.case_study_metrics m where m.case_study_id = c.id), '[]'::jsonb) as metrics,
  coalesce((select jsonb_agg(jsonb_build_object('title', a.title, 'description', a.description) order by a.sort_order) from public.case_study_approach_steps a where a.case_study_id = c.id), '[]'::jsonb) as approach,
  c.results_detail, c.testimonial_quote, c.testimonial_author, c.testimonial_pending,
  coalesce((
    select jsonb_agg(jsonb_build_object('id', s.id, 'slug', s.slug, 'title', s.title, 'icon', s.icon, 'summary', s.summary) order by sc.sort_order)
    from public.service_case_studies sc join public.services s on s.id = sc.service_id
    where sc.case_study_id = c.id and s.status = 'published'
  ), '[]'::jsonb) as related_services
from public.case_studies c
where c.status = 'published';

create or replace view public.blog_posts_delivery
with (security_invoker = true) as
select
  b.id, b.title, b.slug, b.excerpt, b.content_text, b.rich_content,
  b.cover_image_url, b.minutes_to_read, b.featured, b.pinned,
  b.first_published_at, b.created_at, b.updated_at, b.status,
  coalesce((select array_agg(t.name order by bt.sort_order) from public.blog_post_tags bt join public.tags t on t.id = bt.tag_id where bt.blog_post_id = b.id), '{}'::text[]) as tags,
  b.seo_title, b.seo_description
from public.blog_posts b
where b.status = 'published';

grant select on public.services_delivery, public.industries_delivery,
  public.case_studies_delivery, public.blog_posts_delivery to anon, authenticated;

-- Public contact submissions are insert-only; do not expose their rows through Data API schemas.
revoke select on public.contact_submissions from public, anon, authenticated;

-- The existing RLS event-trigger helper runs with elevated privileges and is not a public RPC.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end
$$;
