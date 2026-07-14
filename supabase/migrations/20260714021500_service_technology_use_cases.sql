-- Additive service-to-use-case-to-technology content model.
create table if not exists public.service_technology_use_cases (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  category text not null,
  use_case text not null,
  explanation text not null,
  evidence_note text,
  status text not null default 'draft' check (status = any (array['draft'::text, 'published'::text, 'archived'::text])),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, slug)
);

create table if not exists public.service_technology_use_case_products (
  use_case_id uuid not null references public.service_technology_use_cases(id) on delete cascade,
  technology_id uuid not null references public.technologies(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (use_case_id, technology_id)
);

create index if not exists service_technology_use_cases_service_idx
  on public.service_technology_use_cases(service_id, status, sort_order);
create index if not exists service_technology_use_case_products_technology_idx
  on public.service_technology_use_case_products(technology_id);

create or replace function public.set_updated_at_timestamp()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists service_technology_use_cases_set_updated_at on public.service_technology_use_cases;
create trigger service_technology_use_cases_set_updated_at
  before update on public.service_technology_use_cases
  for each row execute function public.set_updated_at_timestamp();

alter table public.service_technology_use_cases enable row level security;
alter table public.service_technology_use_case_products enable row level security;

drop policy if exists "Public can read published technology use cases" on public.service_technology_use_cases;
create policy "Public can read published technology use cases"
  on public.service_technology_use_cases for select to anon, authenticated
  using (status = 'published');

drop policy if exists "Public can read technology use case products" on public.service_technology_use_case_products;
create policy "Public can read technology use case products"
  on public.service_technology_use_case_products for select to anon, authenticated
  using (exists (
    select 1 from public.service_technology_use_cases u
    where u.id = use_case_id and u.status = 'published'
  ));

revoke all on public.service_technology_use_cases, public.service_technology_use_case_products from anon, authenticated;
grant select on public.service_technology_use_cases, public.service_technology_use_case_products to anon, authenticated;

-- Seed only the workflow explicitly supported by the published AI operations case study.
insert into public.service_technology_use_cases
  (service_id, slug, category, use_case, explanation, evidence_note, status, sort_order)
select s.id,
       'conversation-workflow-analysis',
       'AI and orchestration',
       'Analyse work and conversation threads to identify recurring requests, approvals and bottlenecks',
       'Claude can analyse exported or appropriately permissioned task and conversation content from environments such as Asana and Slack. The resulting evidence can be used to redesign ownership, due dates, dependencies and exception handling; it does not imply a native integration unless one is separately implemented.',
       'Evidenced by the published Scale-Up Consumer Brand AI Operations case study.',
       'published',
       10
from public.services s
where s.slug = 'ai-automation'
on conflict (service_id, slug) do update set
  category = excluded.category,
  use_case = excluded.use_case,
  explanation = excluded.explanation,
  evidence_note = excluded.evidence_note,
  status = excluded.status,
  sort_order = excluded.sort_order;

insert into public.service_technology_use_case_products (use_case_id, technology_id, sort_order)
select u.id, t.id, keys.sort_order
from public.service_technology_use_cases u
join public.services s on s.id = u.service_id and s.slug = 'ai-automation'
join (values ('anthropic'::text, 10), ('asana'::text, 20), ('slack'::text, 30)) as keys(key, sort_order) on true
join public.technologies t on t.key = keys.key
where u.slug = 'conversation-workflow-analysis'
on conflict (use_case_id, technology_id) do update set sort_order = excluded.sort_order;

-- Preserve the established delivery contract and append technology_examples as the final column.
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
    coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'slug', c.slug, 'client', c.client, 'challenge', c.challenge, 'metric', c.metric) order by sc.sort_order)
      from public.service_case_studies sc
      join public.case_studies c on c.id = sc.case_study_id
      where sc.service_id = s.id and c.status = 'published'), '[]'::jsonb) as related_case_studies,
    coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'slug', b.slug, 'title', b.title, 'excerpt', b.excerpt, 'coverImageUrl', b.cover_image_url, 'minutesToRead', b.minutes_to_read, 'firstPublishedDate', b.first_published_at, 'tags', b.tags) order by sb.sort_order)
      from public.service_blog_posts sb
      join public.blog_posts b on b.id = sb.blog_post_id
      where sb.service_id = s.id and b.status = 'published'), '[]'::jsonb) as related_blog_posts,
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

grant select on public.services_delivery to anon, authenticated;
