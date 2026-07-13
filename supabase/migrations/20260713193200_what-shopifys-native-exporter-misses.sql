-- Shopify migration insight 2: What Shopify’s native exporter misses
begin;

insert into public.blog_posts
  (title, slug, excerpt, content_text, rich_content, minutes_to_read, featured, pinned,
   first_published_at, tags, seo_title, seo_description, status)
values (
  $title$What Shopify’s native exporter misses$title$,
  'what-shopifys-native-exporter-misses',
  $excerpt$Shopify’s CSV exports are useful operational tools, but they are not a complete migration specification. A defensible extraction plan combines native exports with GraphQL, application APIs, specialist tools and independent archives.$excerpt$,
  $article$Shopify makes it easy to export products, customers and orders. That convenience can create a false sense of completeness.

A CSV proves that a table can be downloaded. It does not prove that the business has captured every field, relationship, event, file, consent record or application dependency required to rebuild the commerce estate.

Native exports are valuable. They are readable, quick to produce and useful for reconciliation. They should form part of the migration evidence pack. They should not be treated as the migration plan.

## What the native exports are designed to do

Shopify’s native exports are primarily administrative tools.

The product CSV supports core catalogue fields and product metafields, but variant metafields require another route. Multi-location inventory is handled through a separate inventory CSV. Customer CSVs include profile and marketing-status fields, but they do not represent the full behavioural history held in connected platforms. Order exports provide a broad operational view and can include captured transaction history, but authorisation data is not included in that transaction export.

Those distinctions matter because migration teams often use “products exported”, “customers exported” and “orders exported” as binary completion points.

The better question is: which parts of each object have been captured, from which system, at what time and in what form?

## Native CSV, GraphQL, Matrixify and platform APIs

| Route | Best use | Strengths | Main limitations |
|---|---|---|---|
| Shopify native CSV | Human-readable baseline and reconciliation | Quick, familiar, easy to inspect | Object-specific, flat, split across exports and not a complete application archive |
| GraphQL Admin API | Structured extraction at scale | Select fields and nested connections; bulk queries produce downloadable JSONL | Requires development, permissions, query design and validation |
| Matrixify or similar tools | Repeatable bulk migration jobs | Practical mappings, scheduled jobs and broad object support | Third-party abstraction; still requires scope, testing and source control |
| Application APIs | Reviews, subscriptions, loyalty, search and other app-owned data | Captures platform-specific fields and relationships | Quality and availability vary by vendor and contract |
| Data warehouse or database extract | Historical analysis and independent archive | Preserves long-term reporting continuity | May not match current operational state without reconciliation |

Shopify’s [GraphQL bulk operations documentation](https://shopify.dev/docs/api/usage/bulk-operations/queries) explains how large queries can be executed asynchronously and returned as JSONL. That is particularly useful when a migration needs fields and relationships beyond a flat CSV.

## Products are more than product rows

A defensible product extract may need:

- products and variants;
- handles, status and publication state;
- options and option order;
- product and variant metafields;
- metaobjects referenced by products or options;
- media, alt text and file ownership;
- inventory items and location-level quantities;
- collections and collection membership;
- selling-plan relationships;
- markets, catalogues and price lists;
- redirects from previous handles;
- application-specific identifiers.

The target design may not use the same structure. Extracting all of it gives the team the evidence required to decide what should be transformed.

This is why the migration should begin with an [Asset Preservation Matrix](/insights-post?slug=asset-preservation-matrix-shopify-migration), not an import template.

## Customers are not just names and email addresses

A customer CSV can be useful for profile migration and baseline consent checks. It does not replace a customer data strategy.

Customer identity may be distributed across Shopify, Klaviyo, a subscription platform, a loyalty application, customer service and an ERP. Different systems may identify the same person by email, phone number, external ID, Shopify customer ID or application-specific profile ID.

The migration needs a crosswalk between those identifiers, plus rules for duplicates, household accounts, guest orders, changed email addresses and conflicting consent states.

Read [Klaviyo is not your customer database](/insights-post?slug=klaviyo-is-not-your-customer-database) before deciding that connecting the new store to the old CRM account will solve the problem.

## Orders are not the whole financial record

Order exports are important for cohort analysis, service history and commercial modelling. They are not a replacement for payment-provider statements, payout reports, chargeback records, gift-card liability or the finance ledger.

The order object, transaction object and settlement record answer different questions.

A migration archive should preserve them separately and document how they reconcile. The article [The financial records your new Shopify store will not contain](/insights-post?slug=financial-records-new-shopify-store-will-not-contain) sets out the financial evidence pack.

## Application data needs its own extraction plan

The highest-risk omissions often sit outside Shopify.

Examples include:

- review text, rating, date, verification and product mapping;
- subscription contracts, next billing dates and payment tokens;
- loyalty balances and points history;
- search synonyms and merchandising rules;
- wishlists and saved products;
- returns and exchange status;
- customer service conversations;
- fraud decisions and risk evidence;
- personalisation profiles;
- product-feed supplements and exclusions.

Each application should be classified as retained, replaced, rebuilt or retired. The team should then confirm the export method, data owner, deletion obligations and cutover sequence.

## Use more than one extraction route

A robust migration commonly uses multiple methods:

1. Native exports for transparent baselines.
2. GraphQL bulk queries for structured Shopify data.
3. Specialist tools for repeatable import and transformation jobs.
4. Vendor APIs or managed exports for application-owned records.
5. Independent files for audit and long-term reporting.
6. A final delta extraction immediately before cutover.

The routes should overlap deliberately. Overlap allows totals and relationships to be reconciled before the source store is closed.

## Validation is part of extraction

An export is not complete until it has been validated.

Record:

- extraction timestamp and timezone;
- source system and account;
- query, export settings or application version;
- row and object counts;
- file checksum;
- known omissions;
- failed records;
- duplicate logic;
- responsible owner;
- retention location.

Then reconcile high-risk totals: active products, variants, customers, orders by period, gross sales, refunds, gift-card balances, inventory by location and review counts by product.

## The real migration deliverable

The deliverable is not a folder of CSV files. It is a controlled evidence set that lets the business rebuild, validate, operate and audit the new estate.

Native exports are one layer of that evidence. GraphQL, specialist migration tools, vendor APIs and financial archives complete the picture.

> Xtradite Digital’s [Shopify Migration Strategy & Delivery service](/services/shopify-migration) includes asset discovery, extraction design, validation rules, delta planning and a governed cutover.$article$,
  null,
  10,
  false,
  false,
  '2026-07-13T09:01:00+00:00'::timestamptz,
  array['Shopify Migration','Data Extraction','Shopify GraphQL']::text[],
  $seot$What Shopify’s native exporter misses in a migration$seot$,
  $seod$Compare Shopify CSV exports, GraphQL bulk operations, Matrixify and platform APIs to build a complete migration extraction plan.$seod$,
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
where b.slug = 'what-shopifys-native-exporter-misses'
on conflict (slug) do update set name = excluded.name;

delete from public.blog_post_tags
where blog_post_id = (select id from public.blog_posts where slug = 'what-shopifys-native-exporter-misses');

insert into public.blog_post_tags (blog_post_id, tag_id, sort_order)
select b.id, t.id, tag.ordinality::integer
from public.blog_posts b
cross join lateral unnest(coalesce(b.tags, '{}'::text[])) with ordinality as tag(name, ordinality)
join public.tags t on t.slug = trim(both '-' from regexp_replace(lower(tag.name), '[^a-z0-9]+', '-', 'g'))
where b.slug = 'what-shopifys-native-exporter-misses'
on conflict do nothing;

delete from public.service_blog_posts
where service_id = (select id from public.services where slug = 'shopify-migration')
  and blog_post_id = (select id from public.blog_posts where slug = 'what-shopifys-native-exporter-misses');

insert into public.service_blog_posts (service_id, blog_post_id, sort_order)
select s.id, b.id, 2
from public.services s
join public.blog_posts b on b.slug = 'what-shopifys-native-exporter-misses'
where s.slug = 'shopify-migration'
on conflict do nothing;

commit;
