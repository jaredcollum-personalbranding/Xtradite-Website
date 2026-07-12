-- Xtradite Digital: deepen case_studies with structured metrics, approach and results.
-- Run this once in the Supabase SQL Editor (after 001/002).
--
-- Adds:
--   metrics            jsonb  — array of { label, value, animate } shown in the metrics strip
--   approach            jsonb  — array of { title, description } shown as timeline steps
--   results_detail      text   — fuller "Results" narrative beyond the one-line `metric`
--   testimonial_quote   text   — real client quote, nullable (never fabricated)
--   testimonial_author  text   — quote attribution, nullable
--   testimonial_pending boolean — true only where a real quote is expected but not yet signed off
--
-- Existing columns (client, slug, industry, headline, challenge, description, metric,
-- sort_order) are kept as-is; `challenge` is expanded in place to 2-3 sentences of real
-- context. `description` is left untouched for any other consumer but is no longer the
-- primary content block on the redesigned detail page (superseded by challenge/approach/
-- results_detail).

alter table case_studies
  add column if not exists metrics jsonb not null default '[]'::jsonb,
  add column if not exists approach jsonb not null default '[]'::jsonb,
  add column if not exists results_detail text,
  add column if not exists testimonial_quote text,
  add column if not exists testimonial_author text,
  add column if not exists testimonial_pending boolean not null default false;

-- 4.1 — A DTC Fragrance & Beauty Retailer (eCommerce)
update case_studies set
  challenge = $txt$This DTC fragrance and beauty retailer sourced through a grey-market supply chain, so stock moved in and out of availability unpredictably across five storefronts. Listings sat stale against live inventory, and product impression share had fallen 42% year-on-year — suppressing both visibility and conversion before a shopper ever reached checkout.$txt$,
  metrics = $json$[
    {"label": "Product Impression Share Recovery", "value": "32% → 98%", "animate": false},
    {"label": "Conversion Rate", "value": "+10%", "animate": true},
    {"label": "Margin Improvement", "value": "+7%", "animate": true}
  ]$json$::jsonb,
  approach = $json$[
    {"title": "Live-Availability Merchandising", "description": "Rebuilt product pages and category layouts to continuously re-sequence around real-time stock across five storefronts sourced through a volatile grey-market supply chain."},
    {"title": "Structured Testing Programme", "description": "Ran four tests a month for six months through our own tag-management deployment rather than a paid CRO platform, keeping test data transparent and running costs down."},
    {"title": "Notes vs. Brand Signal", "description": "Tested whether buyers were shopping fragrance notes or brand first, then fed that signal back into the funnel to sharpen merchandising and messaging."}
  ]$json$::jsonb,
  results_detail = $txt$<p>Within four weeks, product impression share climbed from 32% to 98%, fully reversing the prior 42% year-on-year decline. That recovered visibility converted directly into performance: conversion rate rose 10% and margins improved 7% — proof that a volatile grey-market supply chain doesn't have to mean a volatile funnel, if merchandising adapts to stock in real time.</p>$txt$
where slug = 'dtc-fragrance-beauty-retailer';

-- 4.2 — A Fast-Growth Fashion Retailer (Retail)
update case_studies set
  challenge = $txt$This occasionwear retailer came out of lockdown restrictions faster than its category, scaling from roughly £45K to a £10M single-weekend peak and a £3.5M+ monthly run-rate within two years. That pace put real pressure on carrier costs, and a 24-person customer service team was running as a single reactive queue with no clear ownership of logistics, returns, or social engagement.$txt$,
  metrics = $json$[
    {"label": "Carrier Cost Savings (2 Years)", "value": "£2M", "animate": true},
    {"label": "Two-Year Revenue Scale-Up", "value": "£45K → £3.5M+/mo", "animate": false},
    {"label": "CS Team Restructured", "value": "24 → 3 Functions", "animate": false}
  ]$json$::jsonb,
  approach = $json$[
    {"title": "Carrier Rate Renegotiation", "description": "Renegotiated carrier rates in step with volume growth, securing service upgrades and privileged access to carrier tracking data as the brand scaled."},
    {"title": "Proactive, Returns-Led Service Model", "description": "Used that tracking access to power a proactive, returns-mitigation-led service model in place of a reactive one."},
    {"title": "Team Restructure", "description": "Restructured a 24-person customer service team out of a single reactive queue into three ownership clusters — logistics, product/returns, and social engagement — turning them into project owners driving business improvement."}
  ]$json$::jsonb,
  results_detail = $txt$<p>Over two years, carrier rate renegotiation delivered close to £2M in savings as the brand scaled from roughly £45K to a £10M single-weekend peak and a £3.5M+ monthly run-rate. Privileged carrier tracking access turned a reactive service model into a proactive, returns-mitigation-led one, and restructuring a 24-person team into three ownership clusters — logistics, product/returns, and social engagement — turned customer service into a function that drives business improvement rather than closes tickets.</p>$txt$
where slug = 'fast-growth-fashion-retailer';

-- 4.3 — A Scale-Up Consumer Brand (Startups)
update case_studies set
  challenge = $txt$This scale-up consumer brand ran its busiest operational communication through a single Slack channel — purchase-order approvals, restock requests, compliance checks, review reporting, listing optimisation, and ad-hoc project chat all colliding with no clear ownership. Nothing carried a due date, an owner, or a dependency link, so bottlenecks surfaced only after they'd already caused delay.$txt$,
  metrics = $json$[
    {"label": "Admin Time Reduction", "value": "-70%", "animate": true},
    {"label": "On-Time Delivery Uplift", "value": "+30%", "animate": true},
    {"label": "Delivery Timeline", "value": "~2 Weeks", "animate": false}
  ]$json$::jsonb,
  approach = $json$[
    {"title": "AI Process-Mining", "description": "Used AI to process-mine every thread in the business's busiest Slack channel and pulled scattered documents into a structured repository."},
    {"title": "Project-Managed Rebuild", "description": "Rebuilt the whole workflow as a project-managed system split by stakeholder visibility, with every task carrying a dependency link, an owner, a due date, and automated recurrence where needed."},
    {"title": "Automated Bottleneck Detection", "description": "Set up daily automated sweeps of task comments and progress to flag bottlenecks and approval milestones for escalation before they cause delay."}
  ]$json$::jsonb,
  results_detail = $txt$<p>Delivered in around two weeks, the rebuild cut time spent by stakeholders who no longer needed to be in the loop by 70%, and lifted on-time delivery by 30% for the ones who did. Daily automated sweeps of task comments now flag bottlenecks and approval milestones before they cause delay — turning an unowned catch-all channel into a system that runs itself.</p>$txt$
where slug = 'scale-up-consumer-brand-ai-operations';

-- 4.4 — A Multi-Marketplace Consumer Goods Brand (Consumer Goods)
-- Honesty constraint preserved: TACoS/margin figures are cited only within this engagement's
-- tenure (from Feb-2026), co-delivered with the brand's performance media partner. The FY27
-- plan and product launch are this engagement's own work and are attributed in full.
update case_studies set
  challenge = $txt$This consumer goods brand's Amazon business had declined by around a third after a product-line discontinuation and stock disruption, across a footprint of 13 marketplaces reporting directly to the CEO. Advertising cost of sale was eating into margin at exactly the point the business needed a credible forward-year plan to rebuild both revenue and profitability.$txt$,
  metrics = $json$[
    {"label": "Blended TACoS (15-Month Low)", "value": "7.0%", "animate": true},
    {"label": "Peak Net Margin", "value": "26.3%", "animate": true},
    {"label": "FY27 Revenue Target", "value": "£6.0M", "animate": true},
    {"label": "Regional Revenue Majority", "value": "8 Weeks", "animate": false}
  ]$json$::jsonb,
  approach = $json$[
    {"title": "Diagnosing the Decline", "description": "Assessed a footprint of 13 marketplaces reporting directly to the CEO, and, working alongside the brand's performance media partner, brought blended TACoS to a 15-month low of 7.0% and net margin to a peak of 26.3% within our tenure."},
    {"title": "Margin-Protective FY27 Plan", "description": "Authored a forward-year plan targeting £6.0M in revenue on a 12.4% blended TACoS, built around per-line advertising ceilings, a hard net-margin kill-switch, and a no-markdown seasonal offer strategy."},
    {"title": "36-SKU Multi-Market Launch", "description": "Led a 36-SKU product launch across ten marketplaces and seven languages that reached the majority of one region's weekly revenue within eight weeks of going live."}
  ]$json$::jsonb,
  results_detail = $txt$<p>Working alongside the brand's performance media partner, we brought blended TACoS to a 15-month low of 7.0% and lifted net margin to a peak of 26.3% within our tenure. From there, the FY27 plan and the 36-SKU, ten-marketplace, seven-language launch are fully our own delivery: a plan targeting £6.0M in revenue on a 12.4% blended TACoS, protected by per-line advertising ceilings, a hard net-margin kill-switch, and a no-markdown seasonal offer strategy, plus a launch that reached the majority of one region's weekly revenue within eight weeks of going live.</p>$txt$
where slug = 'multi-marketplace-consumer-goods-brand';

-- 4.5 — A Subscription-Led Coffee Brand (Consumer Goods)
update case_studies set
  challenge = $txt$This subscription-first coffee brand was leaning heavily on one-time purchases and paid acquisition, with email running as broad, unsegmented campaigns rather than an always-on lifecycle system. Growth depended entirely on a single direct-to-consumer channel, with no B2B or wholesale funnel to diversify against rising acquisition costs.$txt$,
  metrics = $json$[
    {"label": "Automated Flows Share of Email Revenue", "value": "66%", "animate": true},
    {"label": "Campaign AOV", "value": "+31%", "animate": true}
  ]$json$::jsonb,
  approach = $json$[
    {"title": "Flow & Segmentation Rebuild", "description": "Rebuilt the flow and segmentation architecture end-to-end, replacing broad one-off campaigns with a segmented, always-on system."},
    {"title": "B2B & Wholesale Channel Build", "description": "Built new B2B reseller and wholesale-marketplace funnels alongside the retention rebuild, reducing reliance on any single direct-to-consumer channel."}
  ]$json$::jsonb,
  results_detail = $txt$<p>Automated flows now drive 66% of total email revenue, and campaign average order value is up 31%, compounding subscriber lifetime value instead of leaking it to churn. New B2B reseller and wholesale-marketplace funnels, built alongside the retention rebuild, mean growth no longer depends on any single direct-to-consumer channel.</p>$txt$
where slug = 'subscription-led-coffee-brand';

-- 4.6 — A Digital Healthcare Platform (Professional Services)
-- The one genuine paid Xtradite Digital client engagement of the six — flagged as the
-- natural candidate for a future real testimonial (testimonial_pending = true), never a
-- fabricated quote.
update case_studies set
  challenge = $txt$This healthcare provider wanted to give patients a dedicated space to connect and support one another, but had no platform, information architecture, or moderation model to build from. Without a scoped delivery partner, the project risked stalling at the strategy stage, as many platform initiatives do.$txt$,
  metrics = $json$[
    {"label": "Engagement Type", "value": "Full-Scope Xtradite Delivery", "animate": false},
    {"label": "Outcome", "value": "Live, Start to Finish", "animate": false}
  ]$json$::jsonb,
  approach = $json$[
    {"title": "Platform Selection", "description": "Selected a complete community platform to serve as the foundation for a dedicated patient community space where none existed before."},
    {"title": "Information Architecture", "description": "Designed the structure and categories the community would run on."},
    {"title": "Moderation Workflow", "description": "Built a moderation model to keep the space safe and well-run from day one."},
    {"title": "Launch", "description": "Saw the platform through to a live, running community rather than handing off after a strategy phase."}
  ]$json$::jsonb,
  results_detail = $txt$<p>As a fully scoped Xtradite Digital project, we saw this engagement through from platform selection to a live, running patient community — structure, categories, moderation workflow, and launch, without handing off after a strategy phase. It remains one of the clearest examples of what an Xtradite engagement looks like end-to-end: scoped, delivered, and live.</p>$txt$,
  testimonial_pending = true
where slug = 'digital-healthcare-platform';
