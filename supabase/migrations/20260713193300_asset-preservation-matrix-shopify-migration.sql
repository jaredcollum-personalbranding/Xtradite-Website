-- Shopify migration insight 3: The Asset Preservation Matrix: what should move, change or stay behind?
begin;

insert into public.blog_posts
  (title, slug, excerpt, content_text, rich_content, minutes_to_read, featured, pinned,
   first_published_at, tags, seo_title, seo_description, status)
values (
  $title$The Asset Preservation Matrix: what should move, change or stay behind?$title$,
  'asset-preservation-matrix-shopify-migration',
  $excerpt$The Asset Preservation Matrix turns a migration inventory into a decision system. It makes clear which assets should be preserved, reviewed, rebuilt or archived before anyone starts importing data.$excerpt$,
  $article$Migration inventories tell you what exists. They do not tell you what deserves to move.

The Asset Preservation Matrix closes that gap. It combines each asset’s commercial value, data quality, dependencies and target-state fit into a visible decision: **preserve**, **review**, **rebuild** or **archive**.

This prevents two common failures. The first is over-preservation, where every legacy structure is imported because it is available. The second is accidental loss, where commercially important information is missed because it sits outside the obvious Shopify export.

## The four decisions

### Preserve

Keep the information and its meaning. The storage format may change, but the asset remains valid and required.

### Review

Retain the source evidence, then assess quality, ownership and target structure before import.

### Rebuild

Create the asset again against the future-state requirements. Preserve the source for reference, but do not reproduce the implementation.

### Archive

Keep the record outside the live store for compliance, finance, analysis or service history. It remains accessible without burdening the operational platform.

## A practical Shopify Asset Preservation Matrix

| Asset | Default decision | Why | Migration action |
|---|---|---|---|
| Products and variants | Review | Core commercial data, but taxonomy and variant structures may be inconsistent | Export all fields and identifiers; cleanse and remap before import |
| Product metafields | Review | Valuable attributes may be mixed with obsolete application data | Inventory definitions, usage and owners; redesign namespaces where needed |
| Variant metafields | Review | Often omitted from simple product CSV workflows | Extract through API or specialist tooling and validate by variant ID/SKU |
| Metaobjects | Review | May contain reusable content or structural debt | Map references and decide whether the model remains appropriate |
| Collections | Rebuild | Manual and tag-led logic often encodes historic workarounds | Preserve membership for evidence; rebuild rules and merchandising intentionally |
| Theme and templates | Rebuild | Reproducing old code carries technical debt into the new store | Rebuild from approved journeys, components and performance requirements |
| Navigation | Rebuild | Legacy menus reflect old information architecture | Use search demand, merchandising and customer journeys to redesign |
| Customers | Review | Duplicates, guest identities and consent conflicts are common | Resolve identities, preserve consent evidence and define the master profile |
| Orders | Preserve and archive | Essential for service, analysis and audit; not always appropriate for live import | Store a complete archive and define any operational access requirement |
| Inventory | Review | Quantities are time-sensitive and location-specific | Extract by location, reconcile at cutover and apply a controlled delta |
| Product reviews | Preserve and review | Trust value is high, but spam and mapping errors damage credibility | Clean, deduplicate and map to stable product identifiers |
| URL inventory | Preserve and transform | Search equity depends on one-to-one destination decisions | Crawl the old estate and create a tested redirect map |
| Analytics events | Rebuild | Event names and parameters frequently drift over time | Define a measurement plan and validate against business questions |
| CRM profiles and events | Review | Profile history, identity and consent may span several systems | Build an identity crosswalk and backfill approved events safely |
| Applications | Review | Some are essential; others duplicate native capability | Classify retain, replace, rebuild or retire with contract and data implications |
| Financial records | Preserve and archive | Orders do not equal settlements, chargebacks or ledger evidence | Export provider reports and document reconciliation rules |

The default decision is a starting point, not a universal rule. A highly curated collection architecture may deserve preservation. A badly duplicated catalogue may require a deeper rebuild.

## Products: preserve the commercial truth, not every inconsistency

Products are usually marked “review” because they combine durable information with accumulated disorder.

Preserve stable identifiers, approved copy, media rights, option meaning, product relationships and regulated attributes. Review titles, handles, tags, product types, metafield structures, variant order and publication logic.

The product import should be generated from a governed target model, not directly from the source export.

A useful validation pack includes:

- source product and variant counts;
- unique SKU and barcode checks;
- orphaned media;
- invalid option combinations;
- duplicate handles;
- missing SEO fields;
- metafield definition and population rates;
- collection membership before and after transformation.

## Customers: identity and consent are separate decisions

Customer records are rarely safe to move as one undifferentiated list.

The same person may appear under multiple email addresses or in several systems. Consent may differ by channel, market, date and source. Guest orders may not be connected to an account.

The matrix should therefore separate:

- identity attributes;
- contactability;
- consent evidence;
- behavioural events;
- order relationships;
- loyalty or subscription status;
- service history.

A customer may be preserved as a commercial identity while remaining ineligible for marketing. That distinction must survive the migration.

See [Klaviyo is not your customer database](/insights-post?slug=klaviyo-is-not-your-customer-database) for the customer identity layer.

## Collections and navigation: rebuild the discovery system

Collections are often exported because they exist, then imported because the project is under time pressure.

That can recreate years of tag conventions, one-off campaigns and duplicated category logic. Preserve the old membership and performance data, but rebuild the collection model around the new taxonomy, search behaviour and merchandising responsibilities.

The same applies to navigation. A new theme with old information architecture is not a transformed customer experience.

## Themes: preserve evidence, rebuild the implementation

The old theme remains useful as evidence.

It shows content requirements, application dependencies, customer journeys, accessibility failures, conversion features and unusual operational needs. Preserve screenshots, templates, custom logic and analytics annotations.

Do not assume the code deserves to move. Rebuild components against the target design system and test them against current performance, accessibility and merchandising requirements.

## Reviews: protect trust

Reviews have high commercial value and high credibility risk.

Preserve the original review text, rating, date, reviewer display name, verification status, response, product identifier and moderation state. Review spam, duplicates, incentives, deleted products and product-family mappings before import.

A migration that changes dates, assigns reviews to the wrong product or inflates counts can damage both customer trust and eligibility for external ratings programmes.

Read [How to migrate product reviews without losing trust or rich results](/insights-post?slug=migrate-product-reviews-without-losing-trust-or-rich-results).

## Score the risk, not just the decision

Add three scores to the matrix:

- **Commercial impact:** what happens if this asset is wrong or unavailable?
- **Migration complexity:** how difficult is extraction, transformation and validation?
- **Evidence confidence:** how certain are we that the source is complete and trustworthy?

A high-impact, low-confidence asset deserves early discovery and senior ownership.

## Turn the matrix into governance

The matrix should be reviewed at migration checkpoints:

1. Discovery: establish assets and provisional decisions.
2. Solution design: confirm target models and owners.
3. Extraction: record method, timestamp and evidence.
4. Transformation: approve rules and exceptions.
5. Rehearsal: reconcile counts and business outcomes.
6. Cutover: process the final delta.
7. Hypercare: confirm the live result remains aligned.

Every change should have an owner and rationale. This creates an auditable record of why something moved, changed or stayed behind.

## The value of saying no

The most important output of the matrix is not the list of assets being migrated. It is the list the business has consciously decided not to recreate.

That is how a migration removes technical debt rather than relocating it.

> Use the matrix as part of a governed programme. [Shopify Migration Strategy & Delivery](/services/shopify-migration) covers asset classification, architecture, extraction, validation, launch and hypercare.$article$,
  null,
  11,
  true,
  false,
  '2026-07-13T09:02:00+00:00'::timestamptz,
  array['Shopify Migration','Data Governance','Migration Planning']::text[],
  $seot$Shopify Asset Preservation Matrix for migrations$seot$,
  $seod$Use this practical Shopify migration matrix to decide what to preserve, review, rebuild or archive across products, customers, themes, collections and reviews.$seod$,
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
where b.slug = 'asset-preservation-matrix-shopify-migration'
on conflict (slug) do update set name = excluded.name;

delete from public.blog_post_tags
where blog_post_id = (select id from public.blog_posts where slug = 'asset-preservation-matrix-shopify-migration');

insert into public.blog_post_tags (blog_post_id, tag_id, sort_order)
select b.id, t.id, tag.ordinality::integer
from public.blog_posts b
cross join lateral unnest(coalesce(b.tags, '{}'::text[])) with ordinality as tag(name, ordinality)
join public.tags t on t.slug = trim(both '-' from regexp_replace(lower(tag.name), '[^a-z0-9]+', '-', 'g'))
where b.slug = 'asset-preservation-matrix-shopify-migration'
on conflict do nothing;

delete from public.service_blog_posts
where service_id = (select id from public.services where slug = 'shopify-migration')
  and blog_post_id = (select id from public.blog_posts where slug = 'asset-preservation-matrix-shopify-migration');

insert into public.service_blog_posts (service_id, blog_post_id, sort_order)
select s.id, b.id, 3
from public.services s
join public.blog_posts b on b.slug = 'asset-preservation-matrix-shopify-migration'
where s.slug = 'shopify-migration'
on conflict do nothing;

commit;
