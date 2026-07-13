-- Flagship Shopify migration service.
begin;
insert into public.services
  (title, slug, category, icon, summary, hero_subheading, description, sort_order, seo_title, seo_description, status)
values (
  $svc$Shopify Migration Strategy & Delivery$svc$,
  'shopify-migration',
  $cat$eCommerce Transformation$cat$,
  'replace',
  $sum$A governed Shopify migration that protects revenue, data, search visibility and operational continuity while rebuilding what should not be carried forward.$sum$,
  $hero$Move the business forward—not just the storefront.$hero$,
  $html$<p>A successful Shopify migration is not a copy of the old store. It is a controlled transformation of the catalogue, customer data, integrations, search estate and operating model.</p>
<p>Xtradite Digital works from discovery through hypercare: mapping the current estate, deciding what to preserve, review, rebuild or archive, designing the target architecture, governing extraction and validation, and protecting trading continuity through launch.</p>
<h2>From fragmented estate to governed commerce system</h2>
<p>We bring storefront, data, CRM, inventory, payments, analytics, feeds and operational integrations into one migration plan. Every asset has an owner, an extraction route, a target decision and an acceptance test.</p>
<h2>The Asset Preservation Matrix</h2>
<p>The centrepiece of the engagement is a practical matrix covering products, variants, metafields, metaobjects, collections, customers, orders, inventory, reviews, URLs, applications and financial records. It prevents valuable information from being missed and stops technical debt being copied into the new estate.</p>
<h2>Native Shopify export is not a migration plan</h2>
<p>Native CSV files are used as transparent baselines, then supplemented with GraphQL bulk operations, specialist migration tools, vendor APIs and independent archives where the business requires more complete or better-structured evidence.</p>
<h2>Customer identity before CRM activation</h2>
<p>We resolve source identifiers, duplicates, guest histories, consent evidence and event backfill before the new store activates CRM. Klaviyo and other platforms receive governed customer data rather than being expected to repair it after launch.</p>
<h2>Launch with commercial assurance</h2>
<p>Cutover and hypercare cover checkout, payments, inventory, order routing, customer journeys, SEO, feeds, analytics, finance and data reconciliation. The migration exits hypercare only when the estate is stable and accountable owners can run it.</p>$html$,
  7,
  $st$Shopify Migration Strategy & Delivery$st$,
  $sd$End-to-end Shopify migration consultancy covering architecture, data extraction, customer identity, SEO, rebuild, cutover and hypercare.$sd$,
  'published'
)
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  icon = excluded.icon,
  summary = excluded.summary,
  hero_subheading = excluded.hero_subheading,
  description = excluded.description,
  sort_order = excluded.sort_order,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  status = excluded.status,
  updated_at = now();
delete from public.service_list_items where service_id = (select id from public.services where slug = 'shopify-migration');
delete from public.service_steps where service_id = (select id from public.services where slug = 'shopify-migration');
delete from public.service_faqs where service_id = (select id from public.services where slug = 'shopify-migration');
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'audience', $aud$Retailers and consumer brands moving to Shopify or Shopify Plus$aud$, 1 from public.services where slug = 'shopify-migration';
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'audience', $aud$Businesses acquiring or separating a Shopify store under a fixed closure deadline$aud$, 2 from public.services where slug = 'shopify-migration';
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'audience', $aud$Teams replacing a legacy platform, theme or fragmented application estate$aud$, 3 from public.services where slug = 'shopify-migration';
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'audience', $aud$Brands that need to preserve SEO, CRM, reviews, finance and operational continuity$aud$, 4 from public.services where slug = 'shopify-migration';
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'inclusion', $inc$Current-state estate and dependency mapping$inc$, 1 from public.services where slug = 'shopify-migration';
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'inclusion', $inc$Asset Preservation Matrix and migration decision register$inc$, 2 from public.services where slug = 'shopify-migration';
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'inclusion', $inc$Target commerce architecture and systems-of-record model$inc$, 3 from public.services where slug = 'shopify-migration';
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'inclusion', $inc$Extraction plan across CSV, GraphQL, APIs and application data$inc$, 4 from public.services where slug = 'shopify-migration';
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'inclusion', $inc$Product, customer, consent, review and URL transformation rules$inc$, 5 from public.services where slug = 'shopify-migration';
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'inclusion', $inc$Rehearsal, delta migration, cutover and rollback planning$inc$, 6 from public.services where slug = 'shopify-migration';
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'inclusion', $inc$Launch control room and structured hypercare$inc$, 7 from public.services where slug = 'shopify-migration';
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'deliverable', $del$Current-state and future-state commerce estate maps$del$, 1 from public.services where slug = 'shopify-migration';
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'deliverable', $del$Asset Preservation Matrix$del$, 2 from public.services where slug = 'shopify-migration';
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'deliverable', $del$Source-to-target field and identifier mapping$del$, 3 from public.services where slug = 'shopify-migration';
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'deliverable', $del$Extraction, transformation and validation workbook$del$, 4 from public.services where slug = 'shopify-migration';
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'deliverable', $del$Customer identity and consent crosswalk$del$, 5 from public.services where slug = 'shopify-migration';
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'deliverable', $del$SEO URL inventory and redirect map$del$, 6 from public.services where slug = 'shopify-migration';
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'deliverable', $del$Application disposition and integration register$del$, 7 from public.services where slug = 'shopify-migration';
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'deliverable', $del$Cutover, rollback and hypercare runbooks$del$, 8 from public.services where slug = 'shopify-migration';
insert into public.service_list_items (service_id, kind, content, sort_order) select id, 'deliverable', $del$Post-launch reconciliation and handover pack$del$, 9 from public.services where slug = 'shopify-migration';
insert into public.service_steps (service_id, title, description, sort_order) select id, $step$Discover$step$, $desc$Map systems, stakeholders, data objects, dependencies, commercial risks and closure constraints.$desc$, 1 from public.services where slug = 'shopify-migration';
insert into public.service_steps (service_id, title, description, sort_order) select id, $step$Decide$step$, $desc$Classify every asset as preserve, review, rebuild or archive, with a named owner and acceptance rule.$desc$, 2 from public.services where slug = 'shopify-migration';
insert into public.service_steps (service_id, title, description, sort_order) select id, $step$Design$step$, $desc$Agree the future-state commerce architecture, identifiers, consent flow, analytics contract and integration responsibilities.$desc$, 3 from public.services where slug = 'shopify-migration';
insert into public.service_steps (service_id, title, description, sort_order) select id, $step$Extract & validate$step$, $desc$Run overlapping extraction routes, reconcile counts and preserve an auditable evidence set.$desc$, 4 from public.services where slug = 'shopify-migration';
insert into public.service_steps (service_id, title, description, sort_order) select id, $step$Transform & rebuild$step$, $desc$Clean and remap catalogue, customer, review, URL and operational data while rebuilding the storefront and integrations.$desc$, 5 from public.services where slug = 'shopify-migration';
insert into public.service_steps (service_id, title, description, sort_order) select id, $step$Rehearse & launch$step$, $desc$Test full and delta migrations, execute cutover, validate trading and retain a rollback path.$desc$, 6 from public.services where slug = 'shopify-migration';
insert into public.service_steps (service_id, title, description, sort_order) select id, $step$Hypercare$step$, $desc$Monitor technical, commercial, customer, search, feed, finance and data outcomes until exit criteria are met.$desc$, 7 from public.services where slug = 'shopify-migration';
insert into public.service_faqs (service_id, question, answer, sort_order) select id, $question$What does Shopify’s native exporter miss?$question$, $answer$Native exports are useful baselines, but migration scope commonly also requires variant metafields, metaobjects, location-level inventory, application-owned data, customer events, review provenance, financial settlements and other records captured through GraphQL, APIs or specialist tools.$answer$, 1 from public.services where slug = 'shopify-migration';
insert into public.service_faqs (service_id, question, answer, sort_order) select id, $question$Can historic orders be moved into the new store?$question$, $answer$The answer depends on the source platform, migration method and operational purpose. We separate the need for live operational access from the need for a complete archive, cohort analysis, service history and finance evidence.$answer$, 2 from public.services where slug = 'shopify-migration';
insert into public.service_faqs (service_id, question, answer, sort_order) select id, $question$How do you protect SEO during migration?$question$, $answer$We combine crawl, sitemap, Search Console, analytics, feed and backlink data into a URL inventory; approve one-to-one decisions; test permanent redirects, canonicals and structured data; and monitor performance by page cohort after launch.$answer$, 3 from public.services where slug = 'shopify-migration';
insert into public.service_faqs (service_id, question, answer, sort_order) select id, $question$Should we connect the new Shopify store to our existing Klaviyo account?$question$, $answer$Only after customer identifiers, duplicates, consent evidence and historical event rules are agreed. Connecting the integration is not a substitute for customer-data governance.$answer$, 4 from public.services where slug = 'shopify-migration';
insert into public.service_faqs (service_id, question, answer, sort_order) select id, $question$How long does a Shopify migration take?$question$, $answer$Scope depends on catalogue complexity, applications, markets, customer and order history, integration requirements and the amount being rebuilt. The discovery phase establishes a realistic sequence and identifies work that can run in parallel.$answer$, 5 from public.services where slug = 'shopify-migration';
insert into public.service_faqs (service_id, question, answer, sort_order) select id, $question$What is included in hypercare?$question$, $answer$Technical stability, checkout and payments, inventory, order routing, customer journeys, analytics, SEO, product feeds, finance reconciliation and data-quality checks—each with owners, thresholds and exit criteria.$answer$, 6 from public.services where slug = 'shopify-migration';
delete from public.service_industries where service_id = (select id from public.services where slug = 'shopify-migration');
insert into public.service_industries (service_id, industry_id, sort_order)
select s.id, i.id,
  case i.slug when 'ecommerce' then 1 when 'retail' then 2 when 'consumer-goods' then 3 else 4 end
from public.services s
join public.industries i on i.slug in ('ecommerce', 'retail', 'consumer-goods', 'manufacturing')
where s.slug = 'shopify-migration'
on conflict do nothing;
commit;
