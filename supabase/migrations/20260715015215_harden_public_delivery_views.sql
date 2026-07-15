begin;

-- Public website content views deliberately execute as their owner so callers can read
-- only the governed projections without receiving direct access to the underlying CMS
-- and evidence tables. Base-table privileges are revoked only after every dependent
-- public view has been converted in the following migration.
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

comment on view public.services_delivery is
  'Public read-only service projection. SECURITY DEFINER is intentional; callers receive only governed published fields and approved related evidence.';
comment on view public.industries_delivery is
  'Public read-only industry projection. SECURITY DEFINER is intentional; callers receive only governed published fields.';
comment on view public.case_studies_delivery is
  'Public read-only case-study projection. SECURITY DEFINER is intentional; only approved public case studies and approved evidence are returned.';
comment on view public.blog_posts_delivery is
  'Public read-only insight projection. SECURITY DEFINER is intentional; only effectively published insight fields are returned.';

commit;
