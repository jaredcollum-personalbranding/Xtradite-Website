-- Fail-closed public evidence controls for case studies.
-- Existing records remain available to authenticated editorial workflows, but are
-- removed from anonymous delivery until an explicit public approval is recorded.

alter table public.case_studies
  add column if not exists public_approval_status text not null default 'changes_required',
  add column if not exists public_primary_metric_approved boolean not null default false;

alter table public.case_study_metrics
  add column if not exists public_evidence_status text not null default 'blocked';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'case_studies_public_approval_status_check'
      and conrelid = 'public.case_studies'::regclass
  ) then
    alter table public.case_studies
      add constraint case_studies_public_approval_status_check
      check (public_approval_status in ('changes_required', 'approved', 'expired'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'case_study_metrics_public_evidence_status_check'
      and conrelid = 'public.case_study_metrics'::regclass
  ) then
    alter table public.case_study_metrics
      add constraint case_study_metrics_public_evidence_status_check
      check (public_evidence_status in ('blocked', 'qualified', 'approved'));
  end if;
end $$;

comment on column public.case_studies.public_approval_status is
  'Independent Gold Seal approval required before a case study is returned through public delivery surfaces.';
comment on column public.case_studies.public_primary_metric_approved is
  'Explicit approval for the legacy top-level metric field to be exposed publicly.';
comment on column public.case_study_metrics.public_evidence_status is
  'Per-metric evidence decision. Only qualified or approved metrics may be returned publicly.';

create index if not exists case_studies_public_approval_idx
  on public.case_studies (public_approval_status, sort_order, id)
  where status = 'published' and public_approval_status = 'approved';

create index if not exists case_study_metrics_public_evidence_idx
  on public.case_study_metrics (case_study_id, sort_order)
  where public_evidence_status in ('qualified', 'approved');

-- Base and child-table policies now require explicit case-study approval.
drop policy if exists "Public read case_studies" on public.case_studies;
create policy "Public read approved case studies"
on public.case_studies for select to anon, authenticated
using (status = 'published' and public_approval_status = 'approved');

drop policy if exists "Public read case study metrics" on public.case_study_metrics;
create policy "Public read approved case study metrics"
on public.case_study_metrics for select to anon, authenticated
using (
  public_evidence_status in ('qualified', 'approved')
  and exists (
    select 1 from public.case_studies c
    where c.id = case_study_id
      and c.status = 'published'
      and c.public_approval_status = 'approved'
  )
);

drop policy if exists "Public read case study approach" on public.case_study_approach_steps;
create policy "Public read approved case study approach"
on public.case_study_approach_steps for select to anon, authenticated
using (exists (
  select 1 from public.case_studies c
  where c.id = case_study_id
    and c.status = 'published'
    and c.public_approval_status = 'approved'
));

drop policy if exists "Public read case study industries" on public.case_study_industries;
create policy "Public read approved case study industries"
on public.case_study_industries for select to anon, authenticated
using (exists (
  select 1 from public.case_studies c
  where c.id = case_study_id
    and c.status = 'published'
    and c.public_approval_status = 'approved'
));

drop policy if exists "Public read published case study media" on public.case_study_media;
create policy "Public read approved case study media"
on public.case_study_media for select to anon, authenticated
using (exists (
  select 1 from public.case_studies c
  where c.id = case_study_id
    and c.status = 'published'
    and c.public_approval_status = 'approved'
));

drop policy if exists "Public read service case studies" on public.service_case_studies;
create policy "Public read approved service case studies"
on public.service_case_studies for select to anon, authenticated
using (
  exists (
    select 1 from public.services s
    where s.id = service_id and s.status = 'published'
  )
  and exists (
    select 1 from public.case_studies c
    where c.id = case_study_id
      and c.status = 'published'
      and c.public_approval_status = 'approved'
  )
);

create or replace view public.case_studies_delivery
with (security_invoker = true)
as
select
  c.id,
  c.client,
  c.slug,
  coalesce((
    select i.title
    from public.case_study_industries ci
    join public.industries i on i.id = ci.industry_id
    where ci.case_study_id = c.id
    order by ci.is_primary desc, ci.sort_order
    limit 1
  ), c.industry) as industry,
  c.headline,
  c.challenge,
  c.description,
  case when c.public_primary_metric_approved then c.metric else null end as metric,
  c.sort_order,
  c.created_at,
  c.updated_at,
  c.status,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'label', m.label,
      'value', m.value,
      'animate', m.animate,
      'evidenceStatus', m.public_evidence_status
    ) order by m.sort_order)
    from public.case_study_metrics m
    where m.case_study_id = c.id
      and m.public_evidence_status in ('qualified', 'approved')
  ), '[]'::jsonb) as metrics,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'title', a.title,
      'description', a.description
    ) order by a.sort_order)
    from public.case_study_approach_steps a
    where a.case_study_id = c.id
  ), '[]'::jsonb) as approach,
  c.results_detail,
  c.testimonial_quote,
  c.testimonial_author,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', s.id,
      'slug', s.slug,
      'title', s.title,
      'icon', s.icon,
      'summary', s.summary
    ) order by sc.sort_order)
    from public.service_case_studies sc
    join public.services s on s.id = sc.service_id
    where sc.case_study_id = c.id and s.status = 'published'
  ), '[]'::jsonb) as related_services,
  c.card_summary,
  c.seo_title,
  c.seo_description,
  c.published_at,
  c.confidentiality_note,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', ma.id,
      'assetKey', ma.asset_key,
      'role', csm.role,
      'caption', csm.caption,
      'sortOrder', csm.sort_order,
      'isPrimary', csm.is_primary,
      'url', ma.public_url,
      'altText', ma.alt_text,
      'mimeType', ma.mime_type,
      'width', ma.width,
      'height', ma.height,
      'bytes', ma.bytes
    ) order by csm.role, csm.is_primary desc, csm.sort_order)
    from public.case_study_media csm
    join public.media_assets ma on ma.id = csm.media_asset_id
    where csm.case_study_id = c.id and ma.status = 'active'
  ), '[]'::jsonb) as media,
  c.public_approval_status,
  c.public_primary_metric_approved,
  c.canonical_path,
  c.noindex
from public.case_studies c
where c.status = 'published'
  and c.public_approval_status = 'approved';

create or replace view public.published_content_sitemap
with (security_invoker = true)
as
  select 'service'::text as content_type, id, slug, canonical_path, updated_at, published_at
  from public.services
  where status = 'published' and noindex = false and canonical_path is not null
union all
  select 'industry'::text as content_type, id, slug, canonical_path, updated_at, published_at
  from public.industries
  where status = 'published' and noindex = false and canonical_path is not null
union all
  select 'case_study'::text as content_type, id, slug, canonical_path, updated_at, published_at
  from public.case_studies
  where status = 'published'
    and public_approval_status = 'approved'
    and noindex = false
    and canonical_path is not null
union all
  select 'blog_post'::text as content_type, id, slug, canonical_path, updated_at, first_published_at as published_at
  from public.blog_posts
  where public.publication_is_effective(status, first_published_at)
    and noindex = false
    and canonical_path is not null;

grant select on public.case_studies_delivery, public.published_content_sitemap to anon, authenticated;
