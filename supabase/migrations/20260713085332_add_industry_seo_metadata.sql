-- Add editable metadata to the one content type that did not yet expose it.
-- The delivery view remains security-invoker so the industries table's RLS policy applies.

alter table public.industries
  add column if not exists seo_title text,
  add column if not exists seo_description text;

update public.industries
set
  seo_title = coalesce(seo_title, title || ' Digital Consultancy | Xtradite Digital'),
  seo_description = coalesce(seo_description, nullif(btrim(summary), ''))
where seo_title is null or seo_description is null;

create or replace view public.industries_delivery
with (security_invoker = true) as
select
  i.id, i.title, i.slug, i.summary, i.challenge, i.solution, i.outcomes,
  i.sort_order, i.created_at, i.updated_at, i.status,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'slug', s.slug,
        'title', s.title,
        'icon', s.icon,
        'summary', s.summary
      ) order by si.sort_order
    )
    from public.service_industries si
    join public.services s on s.id = si.service_id
    where si.industry_id = i.id and s.status = 'published'
  ), '[]'::jsonb) as related_services,
  i.seo_title,
  i.seo_description
from public.industries i
where i.status = 'published';

revoke all on table public.industries_delivery from anon, authenticated;
grant select on table public.industries_delivery to anon, authenticated;
