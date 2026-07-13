-- Shopify migration insight 8: Designing the new commerce estate before rebuilding the storefront
begin;

insert into public.blog_posts
  (title, slug, excerpt, content_text, rich_content, minutes_to_read, featured, pinned,
   first_published_at, tags, seo_title, seo_description, status)
values (
  $title$Designing the new commerce estate before rebuilding the storefront$title$,
  'designing-commerce-estate-before-rebuilding-storefront',
  $excerpt$The storefront is one interface within a wider commerce system. Platform selection, data ownership, consent, analytics, payments and operational integrations need an agreed architecture before theme delivery begins.$excerpt$,
  $article$The storefront is the most visible part of a commerce migration, so it naturally attracts the earliest design attention.

That sequence is often backwards.

The theme depends on product data, pricing, inventory, customer identity, applications, markets, payments, fulfilment, analytics and content. If those foundations are undecided, storefront work progresses through assumptions. Those assumptions later become rework, compromises or launch risk.

Design the commerce estate first. Then build the interface that operates it.

## Start with business capabilities

Architecture should begin with what the business needs to do, not which applications it already owns.

Typical capabilities include:

- product and content management;
- pricing and promotions;
- market and catalogue control;
- inventory availability;
- order orchestration;
- fulfilment and returns;
- payments and fraud;
- customer identity and consent;
- subscriptions and loyalty;
- reviews and user-generated content;
- search and merchandising;
- CRM activation;
- analytics and experimentation;
- finance and reconciliation;
- customer service.

For each capability, document the current platform, future owner, required integrations, critical data and service-level expectation.

## Establish systems of record

Every core object needs one authoritative owner.

| Object | Questions to resolve |
|---|---|
| Product | Is Shopify, ERP or PIM the master for title, attributes, media and status? |
| Price | Where are base prices, market prices and promotions approved? |
| Inventory | Which system determines sellable availability by location? |
| Customer | Which identifier remains stable across Shopify, CRM and service systems? |
| Consent | Where is channel consent mastered and evidenced? |
| Order | Which system owns lifecycle status after checkout? |
| Refund | Where is financial truth recorded and reconciled? |
| Content | Who owns editorial, legal and merchandising content? |
| Analytics | Which event contract defines the measurement layer? |

Without these decisions, integrations pass conflicting updates and teams resolve the differences manually.

## Define identifiers before data moves

Identifiers are the connective tissue of the estate.

Agree stable keys for:

- product;
- variant;
- inventory item;
- location;
- customer;
- order;
- fulfilment;
- payment transaction;
- subscription;
- review;
- promotion;
- content entry.

Do not rely only on Shopify-generated IDs when records must remain connected to external systems or future migrations. Preserve source IDs and create a documented crosswalk.

## Consent and privacy belong in architecture

Consent is not a CRM implementation detail.

The architecture needs to show:

- where preferences are collected;
- how the consent event is timestamped;
- which policy version applies;
- how consent reaches CRM, analytics and advertising platforms;
- how withdrawal propagates;
- which non-essential technologies remain blocked before consent;
- how subject-access and deletion requests are fulfilled.

A migration that connects every platform before defining this flow can distribute inconsistent or unlawful states at scale.

## Analytics needs an event contract

Rebuilding the theme without a measurement plan often reproduces fragmented analytics.

Define the required events, parameters, identifiers and consent behaviour before component development. Then every storefront feature can implement the same contract.

Include:

- page and content views;
- product-list impressions;
- product views;
- cart actions;
- checkout milestones;
- purchases and refunds;
- search;
- account and subscription actions;
- lead or enquiry events;
- application-specific interactions.

Specify which system emits each event, how duplicates are prevented and how server-side and client-side records reconcile.

## Operational integrations shape the customer experience

Inventory latency changes whether a product can be sold. Order-routing rules change delivery promises. Returns systems change account functionality. Customer-service platforms change what agents can see.

These are not back-office details. They determine the experience the storefront can truthfully offer.

For every integration, record:

- direction of data flow;
- trigger or schedule;
- fields and identifiers;
- expected latency;
- failure behaviour;
- retry and idempotency;
- monitoring;
- owner;
- manual fallback.

## Make application decisions deliberately

Classify every existing application:

- retain;
- replace;
- rebuild;
- retire.

Evaluate business value, data ownership, integration quality, performance, privacy, contract timing and native Shopify capability.

An application should not survive migration solely because uninstalling it feels risky. Equally, it should not be removed without an extraction and continuity plan.

## Architecture outputs

A useful architecture pack includes:

- current-state estate map;
- future-state estate map;
- system-of-record matrix;
- data-object and identifier model;
- integration catalogue;
- customer identity and consent flow;
- analytics event contract;
- security and access model;
- application disposition register;
- non-functional requirements;
- cutover and rollback dependencies.

The diagrams should be accompanied by decisions and owners. A picture without governance becomes outdated immediately.

## Sequence the delivery

A stronger migration sequence is:

1. Business capability discovery.
2. Current-state systems and data map.
3. Asset Preservation Matrix.
4. Future-state architecture and ownership.
5. Extraction and transformation design.
6. Storefront information architecture and component design.
7. Integration build and data rehearsals.
8. End-to-end testing.
9. Cutover and hypercare.

This does not delay design. It gives design reliable constraints.

## The commercial benefit

Architecture reduces hidden rework and gives the business a clearer operating model after launch.

It also makes supplier proposals easier to compare. Instead of buying overlapping applications and integrations, the business can assess each component against agreed capability, ownership and data requirements.

The new storefront then becomes the front end of a governed system—not the place where unresolved systems decisions are concealed.

> Xtradite Digital’s [Shopify Migration Strategy & Delivery service](/services/shopify-migration) establishes the commerce architecture, data ownership and integration model before rebuild and cutover.$article$,
  null,
  10,
  true,
  false,
  '2026-07-13T09:07:00+00:00'::timestamptz,
  array['Shopify Migration','Systems Architecture','Commerce Operations']::text[],
  $seot$Design the commerce architecture before the Shopify storefront$seot$,
  $seod$Plan platform selection, data ownership, consent, analytics and operational integrations before rebuilding a Shopify storefront.$seod$,
  'published'
)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  content_text = excluded.content_text,
  rich_content = excluded.rich_content,
  minutes_to_read = excluded.minutes_to_read,
  featured = excluded.featured,
  pinned = excluded.pinned,
  first_published_at = excluded.first_published_at,
  tags = excluded.tags,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  status = excluded.status,
  updated_at = now();

insert into public.tags (name, slug)
select distinct tag_name,
  trim(both '-' from regexp_replace(lower(tag_name), '[^a-z0-9]+', '-', 'g'))
from public.blog_posts b
cross join lateral unnest(coalesce(b.tags, '{}'::text[])) as tag_name
where b.slug = 'designing-commerce-estate-before-rebuilding-storefront'
on conflict (slug) do update set name = excluded.name;

delete from public.blog_post_tags
where blog_post_id = (select id from public.blog_posts where slug = 'designing-commerce-estate-before-rebuilding-storefront');

insert into public.blog_post_tags (blog_post_id, tag_id, sort_order)
select b.id, t.id, tag.ordinality::integer
from public.blog_posts b
cross join lateral unnest(coalesce(b.tags, '{}'::text[])) with ordinality as tag(name, ordinality)
join public.tags t on t.slug = trim(both '-' from regexp_replace(lower(tag.name), '[^a-z0-9]+', '-', 'g'))
where b.slug = 'designing-commerce-estate-before-rebuilding-storefront'
on conflict do nothing;

delete from public.service_blog_posts
where service_id = (select id from public.services where slug = 'shopify-migration')
  and blog_post_id = (select id from public.blog_posts where slug = 'designing-commerce-estate-before-rebuilding-storefront');

insert into public.service_blog_posts (service_id, blog_post_id, sort_order)
select s.id, b.id, 8
from public.services s
join public.blog_posts b on b.slug = 'designing-commerce-estate-before-rebuilding-storefront'
where s.slug = 'shopify-migration'
on conflict do nothing;

commit;
