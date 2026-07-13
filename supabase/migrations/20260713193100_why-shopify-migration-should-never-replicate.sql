-- Shopify migration insight 1: Why a Shopify migration should never replicate yesterday’s problems
begin;

insert into public.blog_posts
  (title, slug, excerpt, content_text, rich_content, minutes_to_read, featured, pinned,
   first_published_at, tags, seo_title, seo_description, status)
values (
  $title$Why a Shopify migration should never replicate yesterday’s problems$title$,
  'why-shopify-migration-should-never-replicate-yesterdays-problems',
  $excerpt$A Shopify migration is a rare chance to remove accumulated technical debt, repair broken data structures and redesign the operating model. Treating it as a copy-and-paste exercise simply transfers yesterday’s constraints into a newer storefront.$excerpt$,
  $article$A migration is often commissioned as a technical project: move the catalogue, rebuild the theme, connect the applications and redirect the URLs. That description is tidy, measurable and dangerously incomplete.

The existing store is not just a collection of pages and records. It is the outcome of years of decisions about merchandising, customer data, fulfilment, reporting, applications, permissions and workarounds. Some of those decisions still create value. Others survive only because the business has learnt to operate around them.

Copying everything into a new Shopify store can therefore produce a technically successful launch that changes very little. The platform is newer, but the duplicated products remain duplicated. The collection logic remains inconsistent. Customer consent is still unclear. The same applications continue to overlap. The reporting remains difficult to reconcile.

A good migration does not ask, “How do we move everything?” It asks, “What deserves to exist in the new operating model?”

## Technical relocation versus business transformation

A technical relocation tries to preserve equivalence. Its success criteria are usually record counts, visual similarity and whether the replacement store can take orders.

Business transformation uses the migration window to improve how the commerce system works. It still protects continuity, but it also resolves structural problems that would otherwise become more expensive after launch.

That difference changes the discovery process.

A relocation inventory might list products, customers, orders, pages and applications. A transformation inventory also records ownership, quality, dependencies, commercial purpose and future-state decisions.

For every asset, the team should understand:

- What business process depends on it?
- Is the data complete, current and trustworthy?
- Does the target Shopify architecture support the same structure?
- Should the asset be preserved, reviewed or rebuilt?
- What evidence will prove the result is correct?

This is the point at which migration stops being an export exercise and becomes a governed programme.

## The preserve, review and rebuild model

The most useful decision framework is deliberately simple.

### Preserve

Preserve assets that remain valid, have a clear owner and can move without changing their meaning.

Examples include clean product identifiers, verified customer consent records, approved review content, historical order archives and media files with reliable ownership.

Preservation does not mean blindly importing the original format. It means protecting the information and its business value.

### Review

Review assets that are useful but structurally uncertain.

Products may need taxonomy changes. Customer records may contain duplicates. Inventory may need a location-level reconciliation. Metafields may hold valuable information in a structure that should not be recreated. Application data may overlap with native Shopify capability.

Review is where most migration value is created. It prevents a technically convenient import from becoming a long-term operating constraint.

### Rebuild

Rebuild assets where the existing implementation is part of the problem.

Themes are the obvious example. Rebuilding the storefront around current customer journeys is usually more valuable than reproducing old templates line by line. Manual collections, brittle navigation, fragmented tracking and duplicated applications often belong in the same category.

Rebuild decisions should be explicit and funded. Otherwise they tend to be discovered late, when launch pressure encourages compromise.

For a detailed working model, see [The Asset Preservation Matrix](/insights-post?slug=asset-preservation-matrix-shopify-migration).

## Migration discovery should expose the operating model

The migration team needs to map more than technology.

A commerce estate commonly includes Shopify, an ERP or inventory platform, warehouse systems, payment providers, customer service tools, review platforms, analytics, product feeds, search, subscriptions and CRM. Each system may hold a different version of the same product, customer or order.

The migration cannot be governed properly until the team agrees:

- which system owns each data object;
- which identifiers connect records between systems;
- where consent is mastered;
- which system defines inventory availability;
- how refunds and settlements are reconciled;
- which events need to reach analytics and CRM;
- which operational processes must keep running during cutover.

This future-state architecture should be agreed before the storefront is rebuilt. The companion article [Designing the new commerce estate before rebuilding the storefront](/insights-post?slug=designing-commerce-estate-before-rebuilding-storefront) explains that sequence.

## The cost of copying technical debt

Replicating an old store feels safer because it reduces visible change. In practice, it often defers risk rather than removing it.

The business pays twice: once for the migration and again for the remediation work that follows. Teams also lose the clean decision window created by the project. Once a new store is live, every structural change has to compete with trading priorities.

Typical duplicated problems include:

- outdated product types and inconsistent tags;
- manual collections that nobody confidently owns;
- customer profiles split across email addresses, phone numbers and applications;
- obsolete redirects and canonical errors;
- duplicated tracking and inconsistent event names;
- application contracts that reproduce native features;
- historic theme code that blocks future releases;
- reports that cannot be reconciled to finance.

A migration should reduce these liabilities, not award them a new lease of life.

## Build the migration around business outcomes

The programme should define commercial outcomes alongside technical acceptance criteria.

A stronger migration scorecard might include:

- catalogue accuracy and product discovery;
- organic visibility retained by URL group;
- feed approval and product coverage;
- customer profile match rate;
- consent integrity;
- checkout and payment success;
- order-routing accuracy;
- inventory variance;
- analytics event completeness;
- customer service contact rate;
- reconciliation of orders, refunds and settlements.

These measures make it possible to judge whether the new estate is working better, not merely whether it is working.

## A practical decision sequence

Before extraction begins, run the following sequence:

1. Map the existing commerce estate and data owners.
2. Build an asset inventory with counts, quality issues and dependencies.
3. Classify every asset as preserve, review, rebuild or archive.
4. Agree the future-state architecture and identifiers.
5. Define extraction routes for each data object.
6. Establish validation rules and acceptance thresholds.
7. Plan cutover, delta migration and rollback.
8. Define hypercare checks across technical and commercial performance.

The extraction method should follow the decision, not lead it. Shopify CSV files, GraphQL, specialist migration tools and platform APIs are all useful, but none of them decides what the business should carry forward. See [What Shopify’s native exporter misses](/insights-post?slug=what-shopifys-native-exporter-misses) for the technical comparison.

## The migration opportunity

A Shopify migration creates a temporary but valuable permission to question the current state.

Use it to preserve what is commercially valuable, review what is uncertain and rebuild what limits the next stage of growth. The result should not be an old business wearing a new theme. It should be a governed commerce system with clearer ownership, cleaner data and fewer operational compromises.

> Planning a migration? [Review the Shopify Migration Strategy & Delivery service](/services/shopify-migration) to see how Xtradite Digital structures discovery, extraction, rebuild, launch and hypercare.$article$,
  null,
  9,
  true,
  true,
  '2026-07-13T09:00:00+00:00'::timestamptz,
  array['Shopify Migration','Migration Strategy','eCommerce Transformation']::text[],
  $seot$Why Shopify migrations should not replicate old problems$seot$,
  $seod$Use a preserve, review and rebuild model to turn a Shopify migration into business transformation rather than a technical relocation.$seod$,
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
where b.slug = 'why-shopify-migration-should-never-replicate-yesterdays-problems'
on conflict (slug) do update set name = excluded.name;

delete from public.blog_post_tags
where blog_post_id = (select id from public.blog_posts where slug = 'why-shopify-migration-should-never-replicate-yesterdays-problems');

insert into public.blog_post_tags (blog_post_id, tag_id, sort_order)
select b.id, t.id, tag.ordinality::integer
from public.blog_posts b
cross join lateral unnest(coalesce(b.tags, '{}'::text[])) with ordinality as tag(name, ordinality)
join public.tags t on t.slug = trim(both '-' from regexp_replace(lower(tag.name), '[^a-z0-9]+', '-', 'g'))
where b.slug = 'why-shopify-migration-should-never-replicate-yesterdays-problems'
on conflict do nothing;

delete from public.service_blog_posts
where service_id = (select id from public.services where slug = 'shopify-migration')
  and blog_post_id = (select id from public.blog_posts where slug = 'why-shopify-migration-should-never-replicate-yesterdays-problems');

insert into public.service_blog_posts (service_id, blog_post_id, sort_order)
select s.id, b.id, 1
from public.services s
join public.blog_posts b on b.slug = 'why-shopify-migration-should-never-replicate-yesterdays-problems'
where s.slug = 'shopify-migration'
on conflict do nothing;

commit;
