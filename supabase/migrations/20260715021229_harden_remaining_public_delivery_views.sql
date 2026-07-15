begin;

-- Convert every remaining anonymous website projection before removing direct access to
-- its source tables. This ordering prevents sitemap or location-route outages in a fresh
-- environment while preserving a view-only public contract.
alter view public.published_content_sitemap set (security_invoker = false);
alter view public.location_routes_delivery set (security_invoker = false);
alter view public.location_service_routes_delivery set (security_invoker = false);

revoke all privileges on table
  public.published_content_sitemap,
  public.location_routes_delivery,
  public.location_service_routes_delivery
from public, anon, authenticated;

grant select on table
  public.published_content_sitemap,
  public.location_routes_delivery,
  public.location_service_routes_delivery
to anon, authenticated;

-- All public-facing projections are now owner-executed, filtered and read-only. Public
-- roles no longer need direct privileges on CMS, evidence or location source tables.
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
  public.media_assets,
  public.location_nations,
  public.location_regions,
  public.location_counties,
  public.locations,
  public.location_services
from public, anon, authenticated;

comment on view public.published_content_sitemap is
  'Public read-only sitemap projection. SECURITY DEFINER is intentional; only effectively published, indexable canonical content is returned.';
comment on view public.location_routes_delivery is
  'Public read-only location route projection. SECURITY DEFINER is intentional; only published, indexable, complete locations are returned.';
comment on view public.location_service_routes_delivery is
  'Public read-only location-service projection. SECURITY DEFINER is intentional; only published, indexable, complete relationships are returned.';

commit;
