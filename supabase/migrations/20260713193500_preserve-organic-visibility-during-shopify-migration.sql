-- Shopify migration insight 5: How to preserve organic visibility during a Shopify migration
begin;

insert into public.blog_posts
  (title, slug, excerpt, content_text, rich_content, minutes_to_read, featured, pinned,
   first_published_at, tags, seo_title, seo_description, status)
values (
  $title$How to preserve organic visibility during a Shopify migration$title$,
  'preserve-organic-visibility-during-shopify-migration',
  $excerpt$Organic visibility is preserved through evidence, mapping and monitoring—not a last-minute redirect spreadsheet. This guide covers URL inventories, redirects, canonicals, Merchant Center, Search Console and post-launch controls.$excerpt$,
  $article$A Shopify migration changes how search engines discover, interpret and rank the store. Even when the domain stays the same, templates, handles, collections, internal links, canonicals, structured data and page content can all change at once.

SEO protection therefore cannot be reduced to “add 301 redirects before launch”.

The migration needs a search evidence set, a URL-level decision model and a monitoring plan capable of detecting loss by page type and commercial value.

## Build the URL inventory before rebuilding

Start with more than one source:

- a full crawl of the current site;
- XML sitemaps;
- Google Search Console landing-page data;
- analytics landing pages and revenue;
- Google Ads and Merchant Center destinations;
- backlink data;
- internal search and navigation;
- product-feed URLs;
- server logs where available;
- known campaign and affiliate URLs.

No single source is complete. A crawler misses orphaned URLs. A sitemap may contain stale pages. Analytics excludes pages without recent traffic. Search Console samples and aggregates.

Merge the sources into one inventory and record:

- current URL;
- page type;
- index status;
- canonical;
- status code;
- organic clicks and impressions;
- revenue or assisted value;
- backlinks;
- target decision;
- redirect destination;
- owner;
- validation result.

## Decide the future of every valuable URL

Each old URL needs one of four outcomes:

- **Keep:** the URL and intent remain valid.
- **Redirect:** a relevant replacement exists.
- **Consolidate:** several pages legitimately become one stronger destination.
- **Retire:** no replacement exists and a truthful 404 or 410 is preferable.

Do not redirect every removed page to the home page. Google warns that irrelevant mass redirects may be treated as soft 404s.

Where a redirect is required, point directly to the final destination. Avoid chains such as old product → old collection → new collection. Google recommends server-side permanent redirects and advises keeping chains low.

## Shopify-specific URL decisions

Shopify imposes route patterns for products, collections, pages and blogs. A migration from another platform may therefore change large parts of the URL structure.

Common decisions include:

- old category paths to `/collections/...`;
- old product paths to `/products/...`;
- product handle changes;
- retired products to suitable successors or collections;
- collection consolidation;
- blog and guide restructuring;
- international or market-specific paths;
- parameter and faceted-navigation controls.

The redirect map should be built from the URL inventory and target catalogue, not generated solely by matching titles.

## Canonicals, robots and indexation

Before launch, inspect every target template for:

- self-referencing canonicals;
- correct protocol, host and path;
- no accidental staging-domain references;
- no inherited `noindex`;
- robots.txt accessibility;
- sitemap inclusion;
- pagination and filtering behaviour;
- duplicate product routes;
- market and language annotations where relevant.

Google’s migration guidance specifically calls for checking canonical annotations and removing temporary noindex controls when the move starts.

## Preserve content and intent

A redirect transfers users and signals, but it does not make two pages equivalent.

If a high-performing collection page ranks because of its product range, copy, internal links and intent, replacing it with a visually attractive but semantically thin page can still lose visibility.

Record the elements that make priority pages valuable:

- primary topic and search intent;
- title and heading;
- body copy;
- product coverage;
- FAQs;
- internal links;
- structured data;
- reviews and trust content;
- media and alt text.

Preserve the intent even when the design changes.

## Merchant Center is part of migration SEO

Shopping visibility depends on the product feed and landing pages remaining aligned.

Before launch, prepare for changes to:

- product URLs;
- image URLs;
- IDs and variant identifiers;
- GTIN, MPN and brand;
- availability;
- price and sale price;
- shipping and returns settings;
- market-specific feeds;
- supplemental feeds;
- custom labels;
- product ratings.

After launch, monitor disapprovals, mismatches, crawl issues and coverage changes. A storefront can appear healthy while paid and free product listings quietly lose eligibility.

## Search Console launch controls

Use Search Console to monitor:

- page indexing;
- sitemap processing;
- URL inspection for priority pages;
- crawl and server errors;
- canonical selection;
- structured-data reports;
- product and merchant-listing enhancements;
- clicks and impressions by page group.

The Change of Address tool is relevant when the domain changes. It is not required for a routine same-domain platform migration. For domain moves, verify all relevant host variants and follow Google’s current site-move process.

## Post-launch monitoring by cohort

Do not look only at total organic sessions.

Create cohorts for:

- top products;
- top collections;
- editorial content;
- brand pages;
- international routes;
- URLs with backlinks;
- pages driving assisted conversions;
- new pages without a direct predecessor.

Track status code, indexation, clicks, impressions, average position, revenue and feed status. Compare against an agreed baseline and account for seasonality.

## A launch checklist

### Before launch

- Crawl and merge the full URL inventory.
- Approve the old-to-new mapping.
- Test redirects in staging or a rules engine.
- Validate canonicals, robots and sitemaps.
- Compare priority content and structured data.
- Prepare Merchant Center feed changes.
- Annotate analytics and reporting.

### First 24 hours

- Crawl the live site.
- Test priority redirects and response codes.
- Submit the sitemap.
- Inspect top URLs.
- Check feed fetches and disapprovals.
- Confirm analytics landing-page data.

### First four weeks

- Monitor organic performance by cohort.
- Repair soft 404s, chains and unmapped URLs.
- Review Google-selected canonicals.
- Track product and merchant enhancement errors.
- update high-value external and internal links.
- Keep redirects in place for at least the recommended migration period.

Google recommends keeping redirects for as long as possible, generally at least one year.

## SEO protection is migration governance

Search performance is not owned by a redirect file. It depends on catalogue decisions, content, architecture, development, analytics, feeds and launch operations working together.

Treat organic visibility as a measurable migration workstream from discovery through hypercare.

> The [Shopify Migration Strategy & Delivery service](/services/shopify-migration) includes URL inventory, redirect governance, technical SEO validation, feed checks and post-launch search monitoring.$article$,
  null,
  11,
  false,
  false,
  '2026-07-13T09:04:00+00:00'::timestamptz,
  array['Shopify Migration','SEO','Technical SEO']::text[],
  $seot$How to preserve SEO during a Shopify migration$seot$,
  $seod$A practical Shopify migration SEO guide covering URL inventories, redirects, canonicals, Search Console, Merchant Center and post-launch monitoring.$seod$,
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
where b.slug = 'preserve-organic-visibility-during-shopify-migration'
on conflict (slug) do update set name = excluded.name;

delete from public.blog_post_tags
where blog_post_id = (select id from public.blog_posts where slug = 'preserve-organic-visibility-during-shopify-migration');

insert into public.blog_post_tags (blog_post_id, tag_id, sort_order)
select b.id, t.id, tag.ordinality::integer
from public.blog_posts b
cross join lateral unnest(coalesce(b.tags, '{}'::text[])) with ordinality as tag(name, ordinality)
join public.tags t on t.slug = trim(both '-' from regexp_replace(lower(tag.name), '[^a-z0-9]+', '-', 'g'))
where b.slug = 'preserve-organic-visibility-during-shopify-migration'
on conflict do nothing;

delete from public.service_blog_posts
where service_id = (select id from public.services where slug = 'shopify-migration')
  and blog_post_id = (select id from public.blog_posts where slug = 'preserve-organic-visibility-during-shopify-migration');

insert into public.service_blog_posts (service_id, blog_post_id, sort_order)
select s.id, b.id, 5
from public.services s
join public.blog_posts b on b.slug = 'preserve-organic-visibility-during-shopify-migration'
where s.slug = 'shopify-migration'
on conflict do nothing;

commit;
