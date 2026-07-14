-- Enforce scheduled publication consistently across direct routes, related content and sitemaps.
-- Also normalise legacy Shopify insight links before those migrations are applied.

create or replace function public.enforce_shopify_insight_publication_plan()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  planned_at timestamptz;
begin
  planned_at := case new.slug
    when 'why-shopify-migration-should-never-replicate-yesterdays-problems' then '2026-07-21T09:00:00+00:00'::timestamptz
    when 'what-shopifys-native-exporter-misses' then '2026-07-28T09:00:00+00:00'::timestamptz
    when 'asset-preservation-matrix-shopify-migration' then '2026-08-04T09:00:00+00:00'::timestamptz
    when 'designing-commerce-estate-before-rebuilding-storefront' then '2026-08-11T09:00:00+00:00'::timestamptz
    when 'preserve-organic-visibility-during-shopify-migration' then '2026-08-18T09:00:00+00:00'::timestamptz
    when 'klaviyo-is-not-your-customer-database' then '2026-08-25T09:00:00+00:00'::timestamptz
    when 'migrate-product-reviews-without-losing-trust-or-rich-results' then '2026-09-01T09:00:00+00:00'::timestamptz
    when 'financial-records-new-shopify-store-will-not-contain' then '2026-09-08T09:00:00+00:00'::timestamptz
    when 'shopify-migration-hypercare' then '2026-09-15T09:00:00+00:00'::timestamptz
    else null
  end;

  if planned_at is not null then
    new.content_text := replace(coalesce(new.content_text, ''), '/insights-post?slug=', '/insights/');
    new.first_published_at := case
      when new.first_published_at is null or new.first_published_at < planned_at then planned_at
      else new.first_published_at
    end;
    new.canonical_path := '/insights/' || new.slug;
    new.editorial_owner := coalesce(
      new.editorial_owner,
      (select id from public.authors where slug = 'jared-collum' limit 1)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists blog_posts_enforce_shopify_insight_publication_plan on public.blog_posts;
create trigger blog_posts_enforce_shopify_insight_publication_plan
before insert or update of slug, content_text, first_published_at, canonical_path, editorial_owner
on public.blog_posts
for each row execute function public.enforce_shopify_insight_publication_plan();

-- Correct any matching records that already exist, while preserving any deliberately later schedule.
update public.blog_posts b
set content_text = replace(coalesce(b.content_text, ''), '/insights-post?slug=', '/insights/'),
    first_published_at = greatest(
      coalesce(b.first_published_at, planned.planned_at),
      planned.planned_at
    ),
    canonical_path = '/insights/' || b.slug,
    editorial_owner = coalesce(
      b.editorial_owner,
      (select id from public.authors where slug = 'jared-collum' limit 1)
    ),
    updated_at = now()
from (values
  ('why-shopify-migration-should-never-replicate-yesterdays-problems'::text, '2026-07-21T09:00:00+00:00'::timestamptz),
  ('what-shopifys-native-exporter-misses', '2026-07-28T09:00:00+00:00'::timestamptz),
  ('asset-preservation-matrix-shopify-migration', '2026-08-04T09:00:00+00:00'::timestamptz),
  ('designing-commerce-estate-before-rebuilding-storefront', '2026-08-11T09:00:00+00:00'::timestamptz),
  ('preserve-organic-visibility-during-shopify-migration', '2026-08-18T09:00:00+00:00'::timestamptz),
  ('klaviyo-is-not-your-customer-database', '2026-08-25T09:00:00+00:00'::timestamptz),
  ('migrate-product-reviews-without-losing-trust-or-rich-results', '2026-09-01T09:00:00+00:00'::timestamptz),
  ('financial-records-new-shopify-store-will-not-contain', '2026-09-08T09:00:00+00:00'::timestamptz),
  ('shopify-migration-hypercare', '2026-09-15T09:00:00+00:00'::timestamptz)
) as planned(slug, planned_at)
where b.slug = planned.slug;

-- Preserve the current services_delivery contract, but source related insights from the
-- publication-gated delivery view so scheduled articles cannot leak into service pages.
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

grant select on public.services_delivery to anon, authenticated;

-- Keep the governance sitemap view aligned with the same publication gate.
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
  from public.blog_posts
  where status = 'published'
    and noindex = false
    and canonical_path is not null
    and first_published_at <= now();

grant select on public.published_content_sitemap to anon, authenticated;
