-- Shopify migration insight 7: The financial records your new Shopify store will not contain
begin;

insert into public.blog_posts
  (title, slug, excerpt, content_text, rich_content, minutes_to_read, featured, pinned,
   first_published_at, tags, seo_title, seo_description, status)
values (
  $title$The financial records your new Shopify store will not contain$title$,
  'financial-records-new-shopify-store-will-not-contain',
  $excerpt$A new Shopify store may contain products, customers and live orders while still lacking the evidence finance needs. Refunds, settlements, chargebacks, gift-card liabilities and provider statements require their own migration archive.$excerpt$,
  $article$A commerce migration can be operationally complete and financially incomplete.

The new Shopify store may take payments, route orders and show customer histories. That does not mean it contains the settlement evidence, liabilities and historical records needed by finance, auditors, customer service or tax teams.

An order is a commercial record. A payment transaction, payout, refund, dispute and ledger posting are related records with different purposes.

The migration needs a financial preservation plan outside the storefront.

## Orders do not equal cash

An order total describes what was sold. It does not by itself prove:

- what was authorised;
- what was captured;
- which provider processed it;
- what fees were charged;
- when funds settled;
- which payout contained the transaction;
- whether a refund was later issued;
- whether a chargeback reversed the proceeds;
- how currency conversion affected the amount;
- how the transaction posted to the ledger.

Shopify order exports can include captured transaction history, but Shopify’s own documentation notes that authorisation data is not included in that exported transaction history. Payment-provider and payout records therefore remain necessary.

## The financial evidence pack

Preserve the following categories separately.

### Orders and line-level commerce data

- order number and IDs;
- customer and channel;
- lines, discounts, tax and shipping;
- fulfilment status;
- returns and cancellations;
- order currency and presentment currency;
- timestamps and market.

### Transactions

- authorisation;
- capture;
- sale;
- refund;
- void;
- failure;
- gateway;
- provider transaction ID;
- amount and currency;
- status and timestamp.

### Payouts and settlements

- payout ID;
- settlement period;
- gross transactions;
- refunds;
- fees;
- reserves or adjustments;
- net amount;
- bank destination;
- payout status;
- settlement date.

### Disputes and chargebacks

- case ID;
- related transaction;
- reason;
- evidence submitted;
- status;
- fee;
- provisional and final financial impact;
- response deadlines.

### Gift cards and store credit

- code or token reference;
- issue date;
- original value;
- remaining balance;
- expiry where lawful;
- currency;
- liability owner;
- redemption history.

### Reconciliation and ledger evidence

- provider-to-bank reconciliation;
- order-to-payment reconciliation;
- payout journals;
- tax reports;
- foreign-exchange adjustments;
- month-end close files;
- manual journals;
- documented exceptions.

## Gift cards are a liability, not a product list

Gift cards require special treatment because the unredeemed balance remains an obligation.

The new store needs the operational ability to honour valid balances. Finance also needs the opening liability, movement and breakage policy to reconcile.

Validate:

- number of active cards;
- total outstanding value by currency;
- cards with zero balance;
- partially redeemed cards;
- migrated codes or secure replacements;
- treatment of expired cards;
- post-launch redemption tests.

Do not email or expose complete card codes in uncontrolled migration files.

## Refunds can cross the migration boundary

A customer may return an order after the old store has stopped trading.

The business needs a process for:

- finding the original order;
- identifying the payment provider;
- determining refundable value;
- issuing the refund from the correct account;
- updating customer service records;
- recording the event in the new reporting model;
- reconciling the cash movement.

If the original order is not imported into the live store, staff still need a secure and searchable archive.

## Payment tokens and subscriptions

Payment credentials are normally controlled by payment providers and cannot be treated as ordinary exportable data.

Subscription migrations require provider-supported token transfer, contract mapping and careful cutover. The team must confirm what can legally and technically move, which customer action is required and how failed migrations will be handled.

Never assume a customer CSV can recreate subscription billing.

## Provider closure risk

Do not close the old payment or application accounts immediately after storefront launch.

Historic refunds, chargebacks, payout adjustments and evidence requests may continue. Contractual access to reports and APIs may end when the account is terminated.

Before closure, confirm:

- retention period;
- export format;
- dispute horizon;
- refund process;
- user access;
- encryption and archive location;
- responsible finance owner;
- final reconciliation date.

## Reconciliation controls

The migration should produce signed-off reconciliations for agreed cut-off dates.

Useful controls include:

- order gross sales to payment captures;
- captures and refunds to provider activity;
- provider activity to payouts;
- payouts to bank receipts;
- gift-card opening and closing liability;
- chargebacks to provider and ledger records;
- inventory and cost-of-goods implications;
- tax totals by market.

Differences should be classified, explained and owned. “The systems never match perfectly” is not an acceptance criterion.

## Define the operational archive

The archive needs to be usable, not merely retained.

Finance may need full files. Customer service may need a restricted search interface. Analysts may need anonymised historical facts. Auditors may need immutable evidence and change history.

Apply role-based access, encryption, retention rules and documented deletion processes.

## Financial migration acceptance criteria

Before launch:

- all relevant providers and accounts inventoried;
- exports completed and checksummed;
- gift-card liability reconciled;
- refund and dispute process tested;
- subscription migration agreed;
- cut-off and delta process documented;
- archive access tested by finance and service teams.

After launch:

- first payments and refunds validated;
- first payout reconciled;
- taxes and fees reviewed;
- gift-card redemption tested;
- chargeback ownership confirmed;
- reporting continuity checked.

## Commercial assurance requires a wider lens

The new Shopify store is an operating platform. It is not automatically the complete financial history of the business.

Preserve the evidence needed to explain what was sold, how it was paid, when cash settled, what remains owed and how every material difference is reconciled.

> Financial discovery, archive planning and launch reconciliation are included within Xtradite Digital’s [Shopify Migration Strategy & Delivery service](/services/shopify-migration).$article$,
  null,
  10,
  false,
  false,
  '2026-07-13T09:06:00+00:00'::timestamptz,
  array['Shopify Migration','Finance','Data Governance','Commercial Assurance']::text[],
  $seot$Financial records missing from a new Shopify store$seot$,
  $seod$Plan the financial archive for a Shopify migration across refunds, settlements, chargebacks, gift cards, payment providers, reconciliation and audit evidence.$seod$,
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
where b.slug = 'financial-records-new-shopify-store-will-not-contain'
on conflict (slug) do update set name = excluded.name;

delete from public.blog_post_tags
where blog_post_id = (select id from public.blog_posts where slug = 'financial-records-new-shopify-store-will-not-contain');

insert into public.blog_post_tags (blog_post_id, tag_id, sort_order)
select b.id, t.id, tag.ordinality::integer
from public.blog_posts b
cross join lateral unnest(coalesce(b.tags, '{}'::text[])) with ordinality as tag(name, ordinality)
join public.tags t on t.slug = trim(both '-' from regexp_replace(lower(tag.name), '[^a-z0-9]+', '-', 'g'))
where b.slug = 'financial-records-new-shopify-store-will-not-contain'
on conflict do nothing;

delete from public.service_blog_posts
where service_id = (select id from public.services where slug = 'shopify-migration')
  and blog_post_id = (select id from public.blog_posts where slug = 'financial-records-new-shopify-store-will-not-contain');

insert into public.service_blog_posts (service_id, blog_post_id, sort_order)
select s.id, b.id, 7
from public.services s
join public.blog_posts b on b.slug = 'financial-records-new-shopify-store-will-not-contain'
where s.slug = 'shopify-migration'
on conflict do nothing;

commit;
