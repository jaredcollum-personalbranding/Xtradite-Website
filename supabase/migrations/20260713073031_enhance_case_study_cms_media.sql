-- Add editorial metadata and a normalized media relationship for case studies.

alter table public.case_studies
  add column if not exists card_summary text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists published_at timestamptz,
  add column if not exists confidentiality_note text;

create table if not exists public.case_study_media (
  id uuid primary key default gen_random_uuid(),
  case_study_id uuid not null references public.case_studies(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  role text not null check (role in ('card', 'hero', 'approach', 'results', 'og', 'video', 'poster')),
  caption text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_study_id, role, media_asset_id),
  unique (case_study_id, role, sort_order)
);

create unique index if not exists case_study_media_one_primary_per_role_idx
  on public.case_study_media (case_study_id, role)
  where is_primary;
create index if not exists case_study_media_case_study_id_idx
  on public.case_study_media (case_study_id);
create index if not exists case_study_media_media_asset_id_idx
  on public.case_study_media (media_asset_id);

alter table public.case_study_media enable row level security;

drop policy if exists "Public read published case study media" on public.case_study_media;
create policy "Public read published case study media"
  on public.case_study_media
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.case_studies c
      where c.id = case_study_id and c.status = 'published'
    )
    and exists (
      select 1 from public.media_assets ma
      where ma.id = media_asset_id and ma.status = 'active'
    )
  );

-- Public clients only read published delivery content. Editorial writes use a trusted
-- server/database role and are intentionally not granted to browser roles.
revoke all on table public.case_studies from anon, authenticated;
revoke all on table public.media_assets from anon, authenticated;
revoke all on table public.case_study_media from anon, authenticated;
grant select on table public.case_studies to anon, authenticated;
grant select on table public.media_assets to anon, authenticated;
grant select on table public.case_study_media to anon, authenticated;

update public.case_studies set
  card_summary = 'Live-stock merchandising and structured experimentation recovered product visibility, lifted conversion and improved margin across five storefronts.',
  seo_title = 'eCommerce Conversion Case Study — Xtradite Digital',
  seo_description = 'How live-stock merchandising lifted product impression share from 32% to 98%, conversion by 10% and margin by 7% across five storefronts.',
  published_at = coalesce(published_at, created_at),
  confidentiality_note = 'Client name withheld by agreement. Generated visuals are sector illustrations, not photographs of the client.'
where slug = 'dtc-fragrance-beauty-retailer';

update public.case_studies set
  card_summary = 'Carrier renegotiation, proactive tracking and a new service operating model protected margin through exceptional growth.',
  seo_title = 'Retail Operations Case Study — Xtradite Digital',
  seo_description = 'How carrier renegotiation and a 24-person service restructure delivered nearly £2M in savings while supporting rapid fashion retail growth.',
  published_at = coalesce(published_at, created_at),
  confidentiality_note = 'Client name withheld by agreement. Generated visuals are sector illustrations, not photographs of the client.'
where slug = 'fast-growth-fashion-retailer';

update public.case_studies set
  card_summary = 'AI-assisted process mining and structured workflow design cut unnecessary stakeholder time and improved on-time delivery in two weeks.',
  seo_title = 'AI Operations Case Study — Xtradite Digital',
  seo_description = 'How AI-assisted process mining reduced unnecessary stakeholder time by 70% and improved on-time delivery by 30% in around two weeks.',
  published_at = coalesce(published_at, created_at),
  confidentiality_note = 'Client name withheld by agreement. Visuals abstract the workflow and do not reproduce private messages or documents.'
where slug = 'scale-up-consumer-brand-ai-operations';

update public.case_studies set
  card_summary = 'A 13-marketplace plan combined lower advertising cost, stronger margin controls and a coordinated 36-SKU international launch.',
  seo_title = 'Marketplace Growth Case Study — Xtradite Digital',
  seo_description = 'How a margin-led 13-marketplace plan reached a 7.0% TACoS, 26.3% peak net margin and coordinated a 36-SKU international launch.',
  published_at = coalesce(published_at, created_at),
  confidentiality_note = 'Client name withheld by agreement. Generated visuals are sector illustrations and contain no marketplace branding.'
where slug = 'multi-marketplace-consumer-goods-brand';

update public.case_studies set
  card_summary = 'Lifecycle automation increased email value while new reseller and wholesale funnels reduced dependence on a single DTC channel.',
  seo_title = 'Subscription Retention Case Study — Xtradite Digital',
  seo_description = 'How lifecycle automation drove 66% of email revenue, increased campaign AOV by 31% and supported new B2B and wholesale growth channels.',
  published_at = coalesce(published_at, created_at),
  confidentiality_note = 'Client name withheld by agreement. Generated visuals are sector illustrations, not photographs of the client.'
where slug = 'subscription-led-coffee-brand';

update public.case_studies set
  card_summary = 'Platform selection, information architecture, moderation and launch were delivered as one end-to-end engagement.',
  seo_title = 'Digital Platform Delivery Case Study — Xtradite Digital',
  seo_description = 'How Xtradite selected, structured, moderated and launched a patient community platform through one end-to-end delivery engagement.',
  published_at = coalesce(published_at, created_at),
  confidentiality_note = 'Client name withheld by agreement. Visuals are conceptual and do not depict real patients or clinical interactions.'
where slug = 'digital-healthcare-platform';

-- Register the case-study uploads already present in the public rich-media bucket.
-- The asset key is editorial and stable; the object path remains the Storage source of truth.
insert into public.media_assets
  (asset_key, bucket_id, object_path, public_url, alt_text, mime_type, bytes, checksum, status)
values
  ('case-dtc-fragrance-beauty-retailer-hero', 'rich-media', 'dtc-fragrance-beauty-retailer.jpg', 'https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/dtc-fragrance-beauty-retailer.jpg', 'Beauty ecommerce team sorting unbranded product parcels during an operational review', 'image/jpeg', 2915282, '66e61c0c56b2ed62ff572d77fb5e383e-1', 'active'),
  ('case-dtc-fragrance-beauty-retailer-approach-1', 'rich-media', 'dtc-fragrance-beauty-retailer2.jpg', 'https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/dtc-fragrance-beauty-retailer2.jpg', 'Team reviewing beauty products alongside a merchandising workflow', 'image/jpeg', 2731594, '7466a5de2cf7fe4c19e7cc086c66e99a-1', 'active'),
  ('case-dtc-fragrance-beauty-retailer-approach-2', 'rich-media', 'dtc-fragrance-beauty-retailer3.jpg', 'https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/dtc-fragrance-beauty-retailer3.jpg', 'Team arranging unbranded beauty parcels over an ecommerce plan', 'image/jpeg', 3091504, '471e48621e38e437d5e74a1360a712f5-1', 'active'),
  ('case-fast-growth-fashion-retailer-hero', 'rich-media', 'fast-growth-fashion-retailer.jpg', 'https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/fast-growth-fashion-retailer.jpg', 'Busy fashion fulfilment warehouse with garments, parcels and operations staff', 'image/jpeg', 3433188, '65d65c878915f026cfad5ec515c8dc93-1', 'active'),
  ('case-fast-growth-fashion-retailer-approach-2', 'rich-media', 'fast-growth-fashion-retailer2.jpg', 'https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/fast-growth-fashion-retailer2.jpg', 'Fashion fulfilment team coordinating parcels around a central workbench', 'image/jpeg', 3535294, '35e84130e2222c4034b25cf77dd3b91c-1', 'active'),
  ('case-fast-growth-fashion-retailer-approach-1', 'rich-media', 'fast-growth-fashion-retailer3.jpg', 'https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/fast-growth-fashion-retailer3.jpg', 'Two fashion operations staff mapping a high-volume parcel workflow', 'image/jpeg', 3335710, '993a784765320a32cb16048f092c22f0-1', 'active'),
  ('case-scale-up-ai-operations-hero', 'rich-media', 'scale-up-consumer-brand-ai-operations.jpg', 'https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/scale-up-consumer-brand-ai-operations.jpg', 'Editorial illustration showing fragmented messages becoming a structured operational workflow', 'image/jpeg', 148554, 'c9ddb3ee7fbcb52a1e15a272a2a9d97f-1', 'active'),
  ('case-scale-up-ai-operations-approach-1', 'rich-media', 'scale-up-consumer-brand-ai-operations2.0.jpg', 'https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/scale-up-consumer-brand-ai-operations2.0.jpg', 'Editorial illustration of scattered work becoming an ordered delivery plan', 'image/jpeg', 1567311, '0a3e8dae88f971c7bb9e1936263cdd9e-1', 'active'),
  ('case-scale-up-ai-operations-approach-2', 'rich-media', 'scale-up-consumer-brand-ai-operations.png', 'https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/scale-up-consumer-brand-ai-operations.png', 'Operations leaders discussing a consumer brand workflow in an office', 'image/png', 3710555, '36085bfdb53f7ded9f0e7a5b5a18a234-1', 'active'),
  ('case-scale-up-ai-operations-video-1', 'rich-media', 'scale-up-consumer-brand-ai-operations.mp4', 'https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/scale-up-consumer-brand-ai-operations.mp4', 'Animated editorial workflow for the AI operations case study', 'video/mp4', 4535717, '05c3d27365dba8f9047e1ce1994a6919-1', 'active'),
  ('case-scale-up-ai-operations-video-2', 'rich-media', 'scale-up-consumer-brand-ai-operations2.mp4', 'https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/scale-up-consumer-brand-ai-operations2.mp4', 'Alternative animated workflow for the AI operations case study', 'video/mp4', 4549387, '2612b00fb7381b98e48129cf950b1762-1', 'active'),
  ('case-multi-marketplace-consumer-goods-hero', 'rich-media', 'multi-marketplace-consumer-goods-brand.jpg', 'https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/multi-marketplace-consumer-goods-brand.jpg', 'Consumer goods operators coordinating parcels and a multi-marketplace growth plan', 'image/jpeg', 2405953, 'de63a83c69ff8142481d645bb1b8a735-1', 'active')
on conflict (asset_key) do update set
  bucket_id = excluded.bucket_id,
  object_path = excluded.object_path,
  public_url = excluded.public_url,
  alt_text = excluded.alt_text,
  mime_type = excluded.mime_type,
  bytes = excluded.bytes,
  checksum = excluded.checksum,
  status = excluded.status,
  updated_at = now();

with assignments(slug, asset_key, role, caption, sort_order, is_primary) as (
  values
    ('dtc-fragrance-beauty-retailer', 'case-dtc-fragrance-beauty-retailer-hero', 'card', 'Generated sector illustration.', 0, true),
    ('dtc-fragrance-beauty-retailer', 'case-dtc-fragrance-beauty-retailer-hero', 'hero', 'Generated sector illustration.', 0, true),
    ('dtc-fragrance-beauty-retailer', 'case-dtc-fragrance-beauty-retailer-hero', 'og', 'Generated sector illustration.', 0, true),
    ('dtc-fragrance-beauty-retailer', 'case-dtc-fragrance-beauty-retailer-approach-1', 'approach', 'Merchandising workflow review.', 0, true),
    ('dtc-fragrance-beauty-retailer', 'case-dtc-fragrance-beauty-retailer-approach-2', 'approach', 'Structured product planning.', 1, false),
    ('fast-growth-fashion-retailer', 'case-fast-growth-fashion-retailer-hero', 'card', 'Generated sector illustration.', 0, true),
    ('fast-growth-fashion-retailer', 'case-fast-growth-fashion-retailer-hero', 'hero', 'Generated sector illustration.', 0, true),
    ('fast-growth-fashion-retailer', 'case-fast-growth-fashion-retailer-hero', 'og', 'Generated sector illustration.', 0, true),
    ('fast-growth-fashion-retailer', 'case-fast-growth-fashion-retailer-approach-1', 'approach', 'High-volume fulfilment workflow.', 0, true),
    ('fast-growth-fashion-retailer', 'case-fast-growth-fashion-retailer-approach-2', 'approach', 'Service and fulfilment coordination.', 1, false),
    ('scale-up-consumer-brand-ai-operations', 'case-scale-up-ai-operations-hero', 'card', 'Generated workflow illustration.', 0, true),
    ('scale-up-consumer-brand-ai-operations', 'case-scale-up-ai-operations-hero', 'hero', 'Generated workflow illustration.', 0, true),
    ('scale-up-consumer-brand-ai-operations', 'case-scale-up-ai-operations-hero', 'og', 'Generated workflow illustration.', 0, true),
    ('scale-up-consumer-brand-ai-operations', 'case-scale-up-ai-operations-approach-1', 'approach', 'From fragmented messages to structured delivery.', 0, true),
    ('scale-up-consumer-brand-ai-operations', 'case-scale-up-ai-operations-approach-2', 'approach', 'Operational workflow review.', 1, false),
    ('scale-up-consumer-brand-ai-operations', 'case-scale-up-ai-operations-video-1', 'video', 'Animated workflow transformation.', 0, true),
    ('scale-up-consumer-brand-ai-operations', 'case-scale-up-ai-operations-video-2', 'video', 'Alternative workflow animation.', 1, false),
    ('multi-marketplace-consumer-goods-brand', 'case-multi-marketplace-consumer-goods-hero', 'card', 'Generated sector illustration.', 0, true),
    ('multi-marketplace-consumer-goods-brand', 'case-multi-marketplace-consumer-goods-hero', 'hero', 'Generated sector illustration.', 0, true),
    ('multi-marketplace-consumer-goods-brand', 'case-multi-marketplace-consumer-goods-hero', 'og', 'Generated sector illustration.', 0, true)
)
insert into public.case_study_media
  (case_study_id, media_asset_id, role, caption, sort_order, is_primary)
select c.id, ma.id, a.role, a.caption, a.sort_order, a.is_primary
from assignments a
join public.case_studies c on c.slug = a.slug
join public.media_assets ma on ma.asset_key = a.asset_key
on conflict (case_study_id, role, media_asset_id) do update set
  caption = excluded.caption,
  sort_order = excluded.sort_order,
  is_primary = excluded.is_primary,
  updated_at = now();

drop view if exists public.case_studies_delivery;
create view public.case_studies_delivery
with (security_invoker = true) as
select
  c.id, c.client, c.slug,
  coalesce((
    select i.title
    from public.case_study_industries ci
    join public.industries i on i.id = ci.industry_id
    where ci.case_study_id = c.id
    order by ci.is_primary desc, ci.sort_order
    limit 1
  ), c.industry) as industry,
  c.headline, c.challenge, c.description, c.metric, c.sort_order,
  c.created_at, c.updated_at, c.status,
  coalesce((
    select jsonb_agg(
      jsonb_build_object('label', m.label, 'value', m.value, 'animate', m.animate)
      order by m.sort_order
    )
    from public.case_study_metrics m where m.case_study_id = c.id
  ), '[]'::jsonb) as metrics,
  coalesce((
    select jsonb_agg(
      jsonb_build_object('title', a.title, 'description', a.description)
      order by a.sort_order
    )
    from public.case_study_approach_steps a where a.case_study_id = c.id
  ), '[]'::jsonb) as approach,
  c.results_detail, c.testimonial_quote, c.testimonial_author,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'slug', s.slug,
        'title', s.title,
        'icon', s.icon,
        'summary', s.summary
      ) order by sc.sort_order
    )
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
    select jsonb_agg(
      jsonb_build_object(
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
      ) order by csm.role, csm.is_primary desc, csm.sort_order
    )
    from public.case_study_media csm
    join public.media_assets ma on ma.id = csm.media_asset_id
    where csm.case_study_id = c.id and ma.status = 'active'
  ), '[]'::jsonb) as media
from public.case_studies c
where c.status = 'published';

revoke all on table public.case_studies_delivery from anon, authenticated;
grant select on table public.case_studies_delivery to anon, authenticated;
