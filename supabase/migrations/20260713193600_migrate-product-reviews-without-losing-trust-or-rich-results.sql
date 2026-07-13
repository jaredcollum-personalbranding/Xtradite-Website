-- Shopify migration insight 6: How to migrate product reviews without losing trust or rich results
begin;

insert into public.blog_posts
  (title, slug, excerpt, content_text, rich_content, minutes_to_read, featured, pinned,
   first_published_at, tags, seo_title, seo_description, status)
values (
  $title$How to migrate product reviews without losing trust or rich results$title$,
  'migrate-product-reviews-without-losing-trust-or-rich-results',
  $excerpt$Review migration is a data-governance and credibility exercise. Preserve the evidence, remove invalid records, map products correctly and validate structured data and Google Product Ratings after launch.$excerpt$,
  $article$Product reviews are not decorative content. They are commercial evidence.

They influence conversion, customer confidence, product discovery, merchandising and eligibility for review-related search and shopping features. A poor migration can damage all of those outcomes without visibly breaking the storefront.

The objective is not simply to reproduce the star rating. It is to preserve a trustworthy review record and reconnect it to the correct products, feeds and structured data.

## What a complete review export should contain

At minimum, preserve:

- source review ID;
- product and variant identifiers;
- SKU, GTIN or other matching keys;
- rating;
- title and body;
- reviewer display name;
- review date and original timestamp;
- verification status;
- moderation status;
- incentive or syndication flags;
- merchant response;
- media attachments;
- helpful-vote data where relevant;
- locale and market;
- source platform;
- deleted or unpublished state.

A spreadsheet containing rating, name and text is not enough to prove provenance or support a reliable re-import.

## Product mapping is the central risk

Products often change during migration.

SKUs are cleaned. Handles change. Variants are consolidated. Bundles are rebuilt. Regional catalogues are merged. Old products are retired and successors introduced.

Reviews must follow the product the customer actually reviewed, not whichever target title looks similar.

Use stable identifiers in this order where available:

1. Source product and review-platform IDs.
2. GTIN or another globally stable product identifier.
3. ERP or product-information-management ID.
4. SKU with variant context.
5. Explicit manual mapping.

Avoid title-only matching. It can assign reviews to a different size, formulation, edition or product generation.

Maintain a mapping table with source product, target product, method, confidence and exception status.

## Preserve dates and verification honestly

Migration should not make old reviews look new.

Keep the original review date and time. Preserve whether the purchase was verified and how that status was established. If verification cannot be reproduced in the target platform, do not silently label the review as verified.

The same principle applies to incentives, syndication and merchant responses. Trust depends on the record remaining materially truthful after migration.

## Clean without manufacturing credibility

A migration is an appropriate point to remove:

- confirmed spam;
- exact duplicates;
- empty records;
- reviews linked to test products;
- content already removed under the moderation policy;
- corrupted encoding;
- failed media references.

It is not an opportunity to remove valid criticism or selectively import only high ratings.

Document every exclusion rule and reconcile the source, excluded and imported counts.

## Review-family and variant decisions

Businesses need an explicit policy for review aggregation.

Should reviews sit at:

- variant level;
- parent-product level;
- product family;
- regional product;
- subscription and one-time versions separately?

There is no universal answer. The decision should reflect whether the products are materially the same and what customers expect the score to represent.

Where products are consolidated, preserve the original product reference in the archive even if reviews are displayed together.

## Structured data after launch

The storefront needs product structured data that accurately reflects the visible page.

Google’s product documentation supports `review` and `aggregateRating` properties within Product structured data. The values should match the reviews customers can access on the page. Do not output ratings that are hidden, stale or calculated from a different product set.

Validate:

- rating value;
- review count;
- product name and identifiers;
- offer and availability;
- duplicate Product markup from theme and application;
- consistency between visible reviews and JSON-LD;
- rich-result eligibility through Google’s testing tools.

A review application may inject its own markup. Confirm that it does not conflict with theme or feed markup.

## Google Product Ratings

Google Product Ratings is separate from on-page review markup.

Participation depends on account eligibility, sufficient review volume and accurate product matching. Google currently states that merchants need at least 50 reviews across their products to participate, while display also depends on data quality such as GTINs, MPNs and brand.

During migration, coordinate:

- product IDs in Merchant Center;
- review-feed product identifiers;
- GTIN, MPN and brand consistency;
- feed provider or aggregator status;
- new landing-page URLs;
- review counts and update cadence;
- account onboarding or revalidation where required.

A correct storefront import does not automatically guarantee continued ratings in Shopping placements.

## Migration validation

Reconcile reviews at several levels:

| Check | Evidence |
|---|---|
| Total records | Source, excluded and imported counts |
| Product coverage | Reviews by source and target product |
| Rating distribution | Count by star rating before and after |
| Dates | Earliest, latest and missing timestamps |
| Verification | Verified and unverified totals |
| Moderation | Published, hidden and rejected totals |
| Structured data | Visible score versus JSON-LD |
| Merchant Center | Product Ratings coverage and diagnostics |

Spot-check products with high review volume, recent reviews, low ratings, media and complex variant mappings.

## Cutover and hypercare

Freeze or record the final review delta close to launch. Decide where new reviews submitted during the cutover window will be stored and how they will be replayed.

After launch, monitor:

- missing widgets;
- slow loading;
- incorrect product associations;
- count and average-rating changes;
- structured-data errors;
- Merchant Center review diagnostics;
- customer reports of missing reviews;
- moderation and response workflows.

## Trust is the acceptance criterion

A review migration succeeds when a customer can see a credible, correctly dated and correctly matched history—and when search and shopping systems can interpret the same evidence accurately.

The star badge is only the surface.

> Xtradite Digital’s [Shopify Migration Strategy & Delivery service](/services/shopify-migration) includes review extraction, cleansing rules, product mapping, structured-data validation and launch monitoring.$article$,
  null,
  9,
  false,
  false,
  '2026-07-13T09:05:00+00:00'::timestamptz,
  array['Shopify Migration','Product Reviews','Conversion Rate Optimisation','SEO']::text[],
  $seot$How to migrate Shopify product reviews safely$seot$,
  $seod$Protect trust and rich results when migrating product reviews by preserving dates, verification, product mapping, moderation evidence and structured data.$seod$,
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
where b.slug = 'migrate-product-reviews-without-losing-trust-or-rich-results'
on conflict (slug) do update set name = excluded.name;

delete from public.blog_post_tags
where blog_post_id = (select id from public.blog_posts where slug = 'migrate-product-reviews-without-losing-trust-or-rich-results');

insert into public.blog_post_tags (blog_post_id, tag_id, sort_order)
select b.id, t.id, tag.ordinality::integer
from public.blog_posts b
cross join lateral unnest(coalesce(b.tags, '{}'::text[])) with ordinality as tag(name, ordinality)
join public.tags t on t.slug = trim(both '-' from regexp_replace(lower(tag.name), '[^a-z0-9]+', '-', 'g'))
where b.slug = 'migrate-product-reviews-without-losing-trust-or-rich-results'
on conflict do nothing;

delete from public.service_blog_posts
where service_id = (select id from public.services where slug = 'shopify-migration')
  and blog_post_id = (select id from public.blog_posts where slug = 'migrate-product-reviews-without-losing-trust-or-rich-results');

insert into public.service_blog_posts (service_id, blog_post_id, sort_order)
select s.id, b.id, 6
from public.services s
join public.blog_posts b on b.slug = 'migrate-product-reviews-without-losing-trust-or-rich-results'
where s.slug = 'shopify-migration'
on conflict do nothing;

commit;
