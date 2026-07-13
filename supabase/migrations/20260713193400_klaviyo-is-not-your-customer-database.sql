-- Shopify migration insight 4: Klaviyo is not your customer database
begin;

insert into public.blog_posts
  (title, slug, excerpt, content_text, rich_content, minutes_to_read, featured, pinned,
   first_published_at, tags, seo_title, seo_description, status)
values (
  $title$Klaviyo is not your customer database$title$,
  'klaviyo-is-not-your-customer-database',
  $excerpt$Klaviyo is a powerful activation platform, but connecting it to a new Shopify store does not resolve customer identity, consent or historical event quality. Those require a governed customer identity layer.$excerpt$,
  $article$Klaviyo can hold customer profiles, consent states, events, segments and messaging history. That does not make it the unquestioned master record for every customer relationship.

During a Shopify migration, teams are often advised to connect the new store to the existing Klaviyo account and allow the integration to continue. That may preserve campaign continuity. It does not prove that customer identities are clean, that consent is reliable or that historical events still describe the new operating model.

The migration needs a customer data strategy before it needs a new abandoned-basket flow.

## Activation platform versus customer identity layer

Klaviyo is designed to activate customer data through segmentation, reporting and communications. It is excellent at that job.

A customer identity layer has a different responsibility. It establishes who the customer is across systems, which identifiers belong together, what consent can be evidenced and which source owns each attribute.

That layer may be implemented through a customer data platform, data warehouse, CRM, integration service or carefully governed master table. The technology matters less than the rules.

The customer identity layer should answer:

- Which Shopify customer IDs belong to the same person?
- How are guest orders associated with known profiles?
- What happens when an email address changes?
- Is a phone number shared by more than one account?
- Which external ID remains stable across the migration?
- Which system owns email and SMS consent?
- How are conflicting values resolved?
- Which historical events may be replayed without triggering communications?

Klaviyo supports an `external_id` specifically to associate a profile with an external system. That capability is valuable only when the business has agreed what the external identifier means.

## Profile stitching needs explicit rules

Identity resolution is not the same as deduplication.

Deduplication removes records that appear identical. Identity resolution assesses whether different records represent the same person and whether they should be connected.

Useful matching signals include:

- stable customer or ERP ID;
- normalised email address;
- E.164-formatted phone number;
- subscription-platform customer ID;
- payment customer ID;
- loyalty membership ID;
- verified address and name combinations.

The hierarchy must be conservative. A shared family email address does not automatically mean one customer. A recycled phone number should not merge unrelated histories. Two records with similar names are not sufficient evidence.

The migration should produce a profile crosswalk showing the source IDs, target ID, match rule, confidence and any exceptions requiring manual review.

## Consent is evidence, not a boolean

A customer CSV may contain yes-or-no marketing fields. Operationally, consent should be treated as an evidenced record.

The business may need to know:

- channel;
- status;
- source;
- timestamp;
- form or experience used;
- wording or policy version;
- jurisdiction or market;
- double-opt-in evidence;
- withdrawal timestamp.

Where systems disagree, the safest rule is not “take the most permissive value”. The migration should apply the agreed legal and governance policy, normally favouring the most defensible evidence.

A customer identity can be preserved without being activated for marketing.

## Preserve events without re-firing journeys

Historical events are commercially valuable. They support segmentation, lifetime-value analysis, product affinity and service context.

They also create risk if imported incorrectly.

Klaviyo’s Events API supports original event timestamps, client-supplied unique IDs for idempotency and a backfill flag for historical events. Backfilled events remain available for metrics and segmentation without triggering flows. Those controls are important because a migration should not send a new welcome message, replenishment reminder or post-purchase sequence for an event that occurred months ago.

For every event type, define:

- source system;
- event name;
- original timestamp;
- stable unique ID;
- profile identifier;
- value and currency;
- product and order identifiers;
- required properties;
- whether it may trigger automation;
- retention period.

Event names should also be reviewed. Carrying forward years of duplicated metrics such as “Placed Order”, “Order Placed” and “Purchase Complete” weakens reporting and segmentation.

## What belongs in a customer experience database

A practical customer experience database may include:

- mastered customer identity;
- consent evidence by channel;
- order and refund summaries;
- product and category affinities;
- subscription status;
- loyalty status;
- service interactions;
- preference data;
- key lifecycle events;
- source-system identifiers;
- data-quality and match confidence.

It should not become an uncontrolled copy of every field from every platform. Each attribute needs a purpose, owner and retention rule.

## Migration sequence for customer data

1. Inventory every system containing customer data.
2. Identify stable source IDs and ownership.
3. Export profiles, consent and relevant events independently.
4. Normalise email, phone, dates, markets and identifiers.
5. Resolve duplicates using an approved match hierarchy.
6. Build the source-to-target identity crosswalk.
7. Apply consent rules and quarantine uncertain records.
8. Backfill approved events with original timestamps and idempotency keys.
9. Connect the new Shopify store only after identity rules are tested.
10. Reconcile profile counts, consent counts and event totals.

## What not to do

Avoid these shortcuts:

- connecting the new store and assuming the CRM will “sort itself out”;
- importing every email address as marketable;
- merging profiles on name alone;
- replaying historical events as live events;
- allowing new Shopify IDs to replace stable external identifiers;
- discarding the original consent source and timestamp;
- deleting the offline source archive after activation.

## The commercial reason to get this right

Bad identity resolution inflates audience size while reducing relevance. It creates duplicate messages, incorrect personalisation, broken suppression, misleading lifetime value and poor service experiences.

A governed identity layer gives the business a cleaner base for CRM, customer service, subscriptions, loyalty and analytics. It also makes future platform changes easier because the customer relationship is not trapped inside one activation tool.

Klaviyo should activate trusted customer data. It should not be expected to invent trust after the migration.

> Xtradite Digital’s [Shopify Migration Strategy & Delivery service](/services/shopify-migration) includes customer-data discovery, identity crosswalks, consent governance, event backfill and CRM activation planning.$article$,
  null,
  10,
  false,
  false,
  '2026-07-13T09:03:00+00:00'::timestamptz,
  array['Shopify Migration','CRM','Customer Data','Klaviyo']::text[],
  $seot$Klaviyo is not your customer database$seot$,
  $seod$Understand identity resolution, profile stitching, consent, event preservation and the customer identity layer required for a Shopify migration.$seod$,
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
where b.slug = 'klaviyo-is-not-your-customer-database'
on conflict (slug) do update set name = excluded.name;

delete from public.blog_post_tags
where blog_post_id = (select id from public.blog_posts where slug = 'klaviyo-is-not-your-customer-database');

insert into public.blog_post_tags (blog_post_id, tag_id, sort_order)
select b.id, t.id, tag.ordinality::integer
from public.blog_posts b
cross join lateral unnest(coalesce(b.tags, '{}'::text[])) with ordinality as tag(name, ordinality)
join public.tags t on t.slug = trim(both '-' from regexp_replace(lower(tag.name), '[^a-z0-9]+', '-', 'g'))
where b.slug = 'klaviyo-is-not-your-customer-database'
on conflict do nothing;

delete from public.service_blog_posts
where service_id = (select id from public.services where slug = 'shopify-migration')
  and blog_post_id = (select id from public.blog_posts where slug = 'klaviyo-is-not-your-customer-database');

insert into public.service_blog_posts (service_id, blog_post_id, sort_order)
select s.id, b.id, 4
from public.services s
join public.blog_posts b on b.slug = 'klaviyo-is-not-your-customer-database'
where s.slug = 'shopify-migration'
on conflict do nothing;

commit;
