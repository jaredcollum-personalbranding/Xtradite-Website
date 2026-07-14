-- Additive content-governance model for SEO, AEO and GEO delivery.

create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  role text,
  bio text,
  profile_url text,
  image_asset_id uuid references public.media_assets(id) on delete set null,
  same_as text[] not null default '{}',
  credentials jsonb not null default '[]'::jsonb,
  areas_of_expertise text[] not null default '{}',
  status text not null default 'draft' check (status = any (array['draft'::text, 'published'::text, 'archived'::text])),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_authors (
  content_type text not null check (content_type = any (array['service'::text, 'industry'::text, 'case_study'::text, 'blog_post'::text, 'page'::text])),
  content_id uuid not null,
  author_id uuid not null references public.authors(id) on delete cascade,
  role text not null default 'author',
  sort_order integer not null default 0,
  primary key (content_type, content_id, author_id, role)
);

create table if not exists public.content_citations (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type = any (array['service'::text, 'industry'::text, 'case_study'::text, 'blog_post'::text, 'page'::text])),
  content_id uuid not null,
  source_name text not null,
  source_url text not null,
  source_date date,
  claim_supported text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_reviews (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type = any (array['service'::text, 'industry'::text, 'case_study'::text, 'blog_post'::text, 'page'::text])),
  content_id uuid not null,
  reviewed_by uuid references public.authors(id) on delete set null,
  reviewed_at timestamptz,
  next_review_at timestamptz,
  review_notes text,
  status text not null default 'pending' check (status = any (array['pending'::text, 'approved'::text, 'changes_required'::text, 'expired'::text])),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.services
  add column if not exists canonical_path text,
  add column if not exists noindex boolean not null default false,
  add column if not exists schema_type text not null default 'Service',
  add column if not exists primary_entity jsonb not null default '{}'::jsonb,
  add column if not exists about_entities jsonb not null default '[]'::jsonb,
  add column if not exists mention_entities jsonb not null default '[]'::jsonb,
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists published_at timestamptz,
  add column if not exists editorial_owner uuid references public.authors(id) on delete set null;

alter table public.industries
  add column if not exists canonical_path text,
  add column if not exists noindex boolean not null default false,
  add column if not exists schema_type text not null default 'CollectionPage',
  add column if not exists primary_entity jsonb not null default '{}'::jsonb,
  add column if not exists about_entities jsonb not null default '[]'::jsonb,
  add column if not exists mention_entities jsonb not null default '[]'::jsonb,
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists published_at timestamptz,
  add column if not exists editorial_owner uuid references public.authors(id) on delete set null;

alter table public.case_studies
  add column if not exists canonical_path text,
  add column if not exists noindex boolean not null default false,
  add column if not exists schema_type text not null default 'Article',
  add column if not exists primary_entity jsonb not null default '{}'::jsonb,
  add column if not exists about_entities jsonb not null default '[]'::jsonb,
  add column if not exists mention_entities jsonb not null default '[]'::jsonb,
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists editorial_owner uuid references public.authors(id) on delete set null;

alter table public.blog_posts
  add column if not exists canonical_path text,
  add column if not exists noindex boolean not null default false,
  add column if not exists schema_type text not null default 'BlogPosting',
  add column if not exists primary_entity jsonb not null default '{}'::jsonb,
  add column if not exists about_entities jsonb not null default '[]'::jsonb,
  add column if not exists mention_entities jsonb not null default '[]'::jsonb,
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists editorial_owner uuid references public.authors(id) on delete set null;

update public.services
set canonical_path = '/services/' || slug,
    published_at = coalesce(published_at, created_at)
where canonical_path is null or published_at is null;

update public.industries
set canonical_path = '/industries/' || slug,
    published_at = coalesce(published_at, created_at)
where canonical_path is null or published_at is null;

update public.case_studies
set canonical_path = '/case-studies/' || slug
where canonical_path is null;

update public.blog_posts
set canonical_path = '/insights/' || slug
where canonical_path is null;

alter table public.services drop constraint if exists services_canonical_path_format;
alter table public.services add constraint services_canonical_path_format check (canonical_path is null or canonical_path ~ '^/[a-z0-9][a-z0-9/-]*$');
alter table public.industries drop constraint if exists industries_canonical_path_format;
alter table public.industries add constraint industries_canonical_path_format check (canonical_path is null or canonical_path ~ '^/[a-z0-9][a-z0-9/-]*$');
alter table public.case_studies drop constraint if exists case_studies_canonical_path_format;
alter table public.case_studies add constraint case_studies_canonical_path_format check (canonical_path is null or canonical_path ~ '^/[a-z0-9][a-z0-9/-]*$');
alter table public.blog_posts drop constraint if exists blog_posts_canonical_path_format;
alter table public.blog_posts add constraint blog_posts_canonical_path_format check (canonical_path is null or canonical_path ~ '^/[a-z0-9][a-z0-9/-]*$');

create unique index if not exists services_canonical_path_unique on public.services(canonical_path) where canonical_path is not null;
create unique index if not exists industries_canonical_path_unique on public.industries(canonical_path) where canonical_path is not null;
create unique index if not exists case_studies_canonical_path_unique on public.case_studies(canonical_path) where canonical_path is not null;
create unique index if not exists blog_posts_canonical_path_unique on public.blog_posts(canonical_path) where canonical_path is not null;
create index if not exists content_authors_content_idx on public.content_authors(content_type, content_id, sort_order);
create index if not exists content_citations_content_idx on public.content_citations(content_type, content_id, sort_order);
create index if not exists content_reviews_due_idx on public.content_reviews(status, next_review_at);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists authors_set_updated_at on public.authors;
create trigger authors_set_updated_at before update on public.authors for each row execute function public.set_updated_at_timestamp();
drop trigger if exists content_citations_set_updated_at on public.content_citations;
create trigger content_citations_set_updated_at before update on public.content_citations for each row execute function public.set_updated_at_timestamp();
drop trigger if exists content_reviews_set_updated_at on public.content_reviews;
create trigger content_reviews_set_updated_at before update on public.content_reviews for each row execute function public.set_updated_at_timestamp();

insert into public.authors (name, slug, role, bio, profile_url, areas_of_expertise, status)
values (
  'Jared Collum',
  'jared-collum',
  'Founder and Digital Consultant',
  'Founder of Xtradite Digital, working across digital strategy, ecommerce growth, AI enablement, operational improvement and project delivery.',
  'https://www.xtradite-digital.co.uk/about',
  array['Digital strategy', 'Ecommerce growth', 'AI enablement', 'Operational excellence', 'Project delivery'],
  'published'
)
on conflict (slug) do update set
  name = excluded.name,
  role = excluded.role,
  bio = excluded.bio,
  profile_url = excluded.profile_url,
  areas_of_expertise = excluded.areas_of_expertise,
  status = excluded.status;

update public.services set editorial_owner = a.id from public.authors a where a.slug = 'jared-collum' and editorial_owner is null;
update public.industries set editorial_owner = a.id from public.authors a where a.slug = 'jared-collum' and editorial_owner is null;
update public.case_studies set editorial_owner = a.id from public.authors a where a.slug = 'jared-collum' and editorial_owner is null;
update public.blog_posts set editorial_owner = a.id from public.authors a where a.slug = 'jared-collum' and editorial_owner is null;

alter table public.authors enable row level security;
alter table public.content_authors enable row level security;
alter table public.content_citations enable row level security;
alter table public.content_reviews enable row level security;

drop policy if exists "Public can read published authors" on public.authors;
create policy "Public can read published authors" on public.authors for select to anon, authenticated using (status = 'published');
drop policy if exists "Public can read content authors" on public.content_authors;
create policy "Public can read content authors" on public.content_authors for select to anon, authenticated using (true);
drop policy if exists "Public can read content citations" on public.content_citations;
create policy "Public can read content citations" on public.content_citations for select to anon, authenticated using (true);
drop policy if exists "Authenticated users can manage content reviews" on public.content_reviews;
create policy "Authenticated users can manage content reviews" on public.content_reviews for all to authenticated using (true) with check (true);

create or replace view public.published_content_sitemap
with (security_invoker = true)
as
  select 'service'::text as content_type, id, slug, canonical_path, updated_at, published_at
  from public.services where status = 'published' and noindex = false and canonical_path is not null
  union all
  select 'industry'::text, id, slug, canonical_path, updated_at, published_at
  from public.industries where status = 'published' and noindex = false and canonical_path is not null
  union all
  select 'case_study'::text, id, slug, canonical_path, updated_at, published_at
  from public.case_studies where status = 'published' and noindex = false and canonical_path is not null
  union all
  select 'blog_post'::text, id, slug, canonical_path, updated_at, first_published_at
  from public.blog_posts where status = 'published' and noindex = false and canonical_path is not null;

grant select on public.authors, public.content_authors, public.content_citations, public.published_content_sitemap to anon, authenticated;
