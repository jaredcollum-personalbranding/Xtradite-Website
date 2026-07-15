begin;

-- Public website delivery views deliberately execute as their owner so callers can read
-- only the governed projections without receiving direct access to the underlying CMS
-- and evidence tables. Each view already contains its publication and approval filters.
alter view public.services_delivery set (security_invoker = false);
alter view public.industries_delivery set (security_invoker = false);
alter view public.case_studies_delivery set (security_invoker = false);
alter view public.blog_posts_delivery set (security_invoker = false);

revoke all privileges on table
  public.services_delivery,
  public.industries_delivery,
  public.case_studies_delivery,
  public.blog_posts_delivery
from public, anon, authenticated;

grant select on table
  public.services_delivery,
  public.industries_delivery,
  public.case_studies_delivery,
  public.blog_posts_delivery
to anon, authenticated;

-- The website must never read from or write to these CMS/evidence tables directly.
-- The delivery views above are the only public content contract.
revoke all privileges on table
  public.services,
  public.service_list_items,
  public.service_steps,
  public.service_technology_groups,
  public.service_technologies,
  public.service_faqs,
  public.service_case_studies,
  public.service_blog_posts,
  public.service_technology_use_cases,
  public.service_technology_use_case_products,
  public.industries,
  public.service_industries,
  public.case_studies,
  public.case_study_industries,
  public.case_study_metrics,
  public.case_study_approach_steps,
  public.case_study_media,
  public.blog_posts,
  public.blog_post_tags,
  public.tags,
  public.technologies,
  public.media_assets
from public, anon, authenticated;

comment on view public.services_delivery is
  'Public read-only service projection. SECURITY DEFINER is intentional; callers receive only governed published fields and approved related evidence.';
comment on view public.industries_delivery is
  'Public read-only industry projection. SECURITY DEFINER is intentional; callers receive only governed published fields.';
comment on view public.case_studies_delivery is
  'Public read-only case-study projection. SECURITY DEFINER is intentional; only approved public case studies and approved evidence are returned.';
comment on view public.blog_posts_delivery is
  'Public read-only insight projection. SECURITY DEFINER is intentional; only effectively published insight fields are returned.';

commit;
