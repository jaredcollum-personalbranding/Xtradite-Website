# Xtradite Digital — Case Study CMS, Content and Generation Plan

## Executive recommendation

The six live case studies already contain strong, specific evidence. The main problem is not a lack of claims; it is that the current CMS and page renderer do not give those claims the best narrative or visual structure.

With the attached normalised database structure as the baseline, complete these steps before generating media:

1. Add a short card summary and dedicated SEO fields.
2. Render the existing `description` as the page overview—it is currently stored but invisible.
3. Create a proper case-study-to-media relationship instead of adding several image URL columns.
4. Treat generation prompts as production briefs, not public CMS content.
5. Use generated visuals only as clearly described sector/editorial illustrations. Never imply they show the real anonymous client.

The content below uses only facts already present in the live Supabase records. New wording improves structure but does not add unverified claims.

---

## 1. Review of the current database and content model

### Confirmed current structure

The attached schema confirms that the database has already moved beyond a four-table CMS. The plan should now treat the following as the current source-of-truth model:

| Content responsibility | Current table | How it should be used |
|---|---|---|
| Case-study identity and long-form copy | `case_studies` | Store client descriptor, slug, headline, challenge, overview, primary metric, results, testimonial and publishing state |
| Repeating proof points | `case_study_metrics` | One row per metric, ordered by `sort_order` |
| Repeating delivery steps | `case_study_approach_steps` | One row per approach step, ordered by `sort_order` |
| Industry taxonomy | `industries` | Canonical industry records |
| Case-study/industry assignment | `case_study_industries` | Canonical relationship; set one row as `is_primary = true` |
| Service relationship | `service_case_studies` | Connect each case study to the most relevant service without hard-coded frontend maps |
| Reusable file metadata | `media_assets` | Register final uploaded assets, URLs, dimensions and alt text |
| Publishability | `case_studies.status` | `draft`, `published` or `archived`; public delivery should expose only `published` records |

The `metrics` and `approach` JSONB columns still exist on `case_studies`, but the normalised child tables should now be treated as canonical. Keep the JSONB columns temporarily for compatibility only; do not manually maintain two independent versions of the same content.

The schema attachment lists tables and constraints, not views or policies. The frontend currently reads `case_studies_delivery`, so any schema enhancement must also update that security-invoker delivery view and retain its public read policy/grant behaviour.

### What already works

- `headline` gives every case study a strong outcome-led proposition.
- `challenge` clearly explains the commercial or operational problem.
- `case_study_metrics` supports ordered result proof points without embedding repeatable content in the parent row.
- `case_study_approach_steps` supports an ordered delivery sequence.
- `results_detail` closes the argument with quantified evidence.
- Anonymous `client` descriptors protect confidentiality without making the pages vague.
- Normalised `case_study_metrics`, `case_study_approach_steps`, industry and service relationships already exist in production.
- `media_assets` already gives the site a reusable asset registry.

### Gaps in the current page implementation

| Gap | Current effect | Recommendation |
|---|---|---|
| `description` is not rendered | The visitor jumps from the hero directly to Challenge, losing the concise engagement overview | Add an “At a glance” or “The engagement” section after the metrics |
| Cards show the full `challenge` | Card copy is long and problem-heavy | Add `card_summary` of 18–28 words |
| No case-study media relationship | Cards display “Case Study Photography” placeholders | Add `case_study_media` linked to `media_assets` |
| No dedicated SEO fields | Title/description are assembled in JavaScript | Add `seo_title` and `seo_description`, then expose them through the delivery view |
| Twitter card is `summary` | Shared pages lack a large visual preview | Use `summary_large_image` after OG artwork is available |
| No `og:image` | Case studies do not share visually | Map an `og` media role and expose its URL |
| `testimonial_pending` is public | A “pending sign-off” message can appear on the public page | Keep pending status internal and hide the section until a quote is approved |
| No media disclosure/caption | Generated sector imagery may be mistaken for the named client | Store an honest caption such as “Sector illustration” |
| No published date | Article structured data is incomplete | Add `published_at`; continue using `updated_at` as modified date |

### Minimal additions still required on `case_studies`

These are recommended fields, not SQL to run yet.

| Field | Type | Purpose |
|---|---|---|
| `card_summary` | text | Short listing-card copy; avoids placing the full challenge on cards |
| `seo_title` | text | Search title, ideally 50–60 characters |
| `seo_description` | text | Search description, ideally 140–160 characters |
| `published_at` | timestamptz | Article structured data and editorial control |
| `confidentiality_note` | text | Optional explanation that identifying details are withheld |

Do not add `hero_image_url`, `card_image_url`, `results_image_url` and `video_url` directly to `case_studies`. That becomes difficult to maintain and prevents asset reuse.

### Recommended media relationship still required

The new structure already has `media_assets`, but it has no relationship between an asset and a case study. Add a normalised `case_study_media` table linked to the existing registry.

| Field | Purpose |
|---|---|
| `case_study_id` | Parent case study |
| `media_asset_id` | Existing `media_assets` record |
| `role` | `card`, `hero`, `approach`, `results`, `og`, `video`, or `poster` |
| `caption` | Public caption; use “Sector illustration” when appropriate |
| `sort_order` | Ordering for galleries or supporting visuals |
| `is_primary` | Primary asset for a role |

Recommended constraints:

- Foreign keys to `case_studies(id)` and `media_assets(id)` with `ON DELETE CASCADE` for the relationship row.
- A role check covering `card`, `hero`, `approach`, `results`, `og`, `video` and `poster`.
- A unique primary asset per case study and role, implemented with a partial unique index.
- RLS enabled because the table is in `public`.
- Public `SELECT` only when the parent case study is `published` and the referenced media asset is `active`.
- Editorial writes restricted to the trusted CMS/admin workflow; never expose a service-role key in the browser.

Generation prompts should remain in this planning document or a private production system. They do not need to be exposed through the public Data API.

### Media upload workflow

1. Generate or commission the asset.
2. Review it for accuracy, rights, visual quality and disclosure needs.
3. Export the final web file.
4. Upload it to the existing public `rich-media` Storage bucket under `Case Studies/<slug>/`.
5. Add one row to `media_assets` with its `asset_key`, bucket, object path, public URL, dimensions, MIME type, file size, checksum where available, alt text and `active` status.
6. Add one row to `case_study_media` with the case study, media asset, role and caption.
7. The delivery view should expose a `media` JSON array or named primary assets.

Public Storage is appropriate for published website media, but upload, update and delete operations should remain protected by Storage policies. Public bucket status only makes downloads public.

---

## 2. The ideal case-study page outline

### 1. Breadcrumb and sector label

- Breadcrumb: `Case Studies / [client descriptor]`
- Eyebrow: primary industry
- Optional confidentiality note: `Client name withheld by agreement.`

### 2. Outcome-led hero

- `headline`
- `client`
- `metric`
- Hero sector/editorial image or illustration
- Short `card_summary` can act as a standfirst on mobile

### 3. Evidence strip

- Three to four `metrics`
- Values should lead; labels should explain the measurement and timeframe
- Do not animate values containing comparisons such as `32% → 98%`

### 4. The engagement

- Render `description`
- Purpose: tell the complete story in 90–140 words before the detail
- Include context, intervention and the headline result without repeating every later sentence

### 5. The challenge

- Render `challenge`
- Pair with one contextual supporting visual only if it adds understanding

### 6. Our approach

- Render `approach` from the normalised child table
- Three steps is ideal; four is acceptable for genuine delivery complexity
- Add one simple vector/process illustration beneath or beside the steps

### 7. The results

- Render `results_detail`
- Repeat the most decision-relevant metrics in a static result graphic
- Distinguish delivered outcomes from targets. For example, `FY27 Revenue Target` must remain visibly labelled as a target.

### 8. Client voice

- Show only signed-off `testimonial_quote` and `testimonial_author`
- If no approved quote exists, hide the block entirely
- Keep “pending” as an editorial workflow state, not public copy

### 9. Related service and other engagements

- Existing normalised relationship already supports this
- Prefer two related case studies, not all five, once relevance ranking is available

### 10. CTA

- Use a context-aware line such as `Facing a similar operational ceiling?`
- Retain the existing consultation CTA

---

## 3. Content values for all six case-study pages

The following copy is publication-ready. Existing HTML-capable fields retain simple `<p>` wrappers.

For each case study:

- The **Core record** values go to `case_studies`; fields marked as proposed become available after the small enhancement migration.
- Each object in a **Metrics** JSON block becomes one row in `case_study_metrics`. Use the array position as `sort_order`, starting at 1. Do not paste the array back into `case_studies.metrics` as the new source of truth.
- Each object in an **Approach** JSON block becomes one row in `case_study_approach_steps`. Use the array position as `sort_order`, starting at 1.
- Resolve the canonical industry by slug and create/update `case_study_industries`; retain `case_studies.industry` only as a temporary compatibility fallback.
- Resolve the related service through `service_case_studies`; do not restore hard-coded relationships in frontend JavaScript.

## Case study 1 — DTC fragrance and beauty retailer

### Core record

| Field | Value |
|---|---|
| `client` | A DTC Fragrance & Beauty Retailer |
| `slug` | `dtc-fragrance-beauty-retailer` |
| `industry` | eCommerce |
| `headline` | Turning volatile stock availability into a compounding conversion engine. |
| `card_summary` | Live-stock merchandising and structured experimentation recovered product visibility, lifted conversion and improved margin across five storefronts. |
| `metric` | +10% CVR |
| `sort_order` | 1 |
| `status` | published |
| `confidentiality_note` | Client name withheld by agreement. Generated visuals are sector illustrations, not photographs of the client. |
| `seo_title` | eCommerce Conversion Case Study — Xtradite Digital |
| `seo_description` | How live-stock merchandising lifted product impression share from 32% to 98%, conversion by 10% and margin by 7% across five storefronts. |

### `challenge`

This DTC fragrance and beauty retailer sourced through a grey-market supply chain, so stock moved in and out of availability unpredictably across five storefronts. Listings remained stale against live inventory, while product impression share had fallen 42% year on year—suppressing visibility and conversion before shoppers reached checkout.

### `description`

```html
<p>We rebuilt merchandising around live availability, continuously re-sequencing product pages and category layouts as stock changed across five storefronts. Alongside that operational fix, we ran four structured tests a month for six months through our own tag-management deployment, avoiding unnecessary CRO platform costs while retaining transparent test data. The programme identified whether customers shopped fragrance notes or brands first and fed that behaviour back into the funnel. Within four weeks, product impression share rose from 32% to 98%; conversion increased 10% and margin improved 7%.</p>
```

### `case_study_metrics` rows

```json
[
  {"label":"Product Impression Share","value":"32% → 98%","animate":false},
  {"label":"Conversion Rate","value":"+10%","animate":true},
  {"label":"Margin Improvement","value":"+7%","animate":true},
  {"label":"Testing Cadence","value":"4 Tests / Month","animate":false}
]
```

### `case_study_approach_steps` rows

```json
[
  {"title":"Connect merchandising to live stock","description":"Rebuilt product and category sequencing around real-time availability across five storefronts, so unavailable products stopped consuming valuable visibility."},
  {"title":"Run a disciplined testing cadence","description":"Delivered four tests a month for six months through a transparent tag-management setup rather than adding an unnecessary paid CRO platform."},
  {"title":"Use customer behaviour to reshape the funnel","description":"Tested whether buyers navigated by fragrance note or brand, then used the result to sharpen merchandising and messaging."}
]
```

### `results_detail`

```html
<p>Product impression share climbed from 32% to 98% in four weeks, fully reversing the visibility problem created by stale listings and the prior 42% year-on-year decline. Recovered visibility translated into commercial performance: conversion rate rose 10% and margin improved 7%. The result showed that a volatile supply chain does not have to create a volatile customer journey when merchandising responds to stock in real time.</p>
```

### Testimonials

- `testimonial_quote`: null
- `testimonial_author`: null
- `testimonial_pending`: false

### Media prompts and destinations

#### Hero/card photography

```text
Use case: photorealistic-natural
Asset type: anonymous eCommerce case-study hero and card image, 16:9
Primary request: candid editorial photograph of an unbranded fragrance and beauty ecommerce merchandising operation responding to frequently changing stock
Scene/backdrop: warm contemporary stockroom and merchandising workspace with small unbranded fragrance boxes, packing materials and a laptop with no readable interface
Subject: two ecommerce operators reviewing available products and reorganising a small merchandising plan; natural working gestures
Style/medium: premium British business documentary photography, photorealistic, real textures
Composition/framing: medium-wide 35mm shot; clear central safe crop for cards; calm negative space; hands naturally visible
Lighting/mood: soft daylight, focused and commercially capable
Colour palette: warm cream and neutral materials with one restrained blaze-orange accent
Constraints: generic sector illustration only; no client identity; no recognisable product packaging; no readable data; no embedded text
Avoid: perfume-ad glamour, luxury product hero shot, logos, trademarks, staged smiles, distorted hands, watermark
```

- Generate in: Codex image generation or Adobe Firefly.
- Upload to: `rich-media/Case Studies/dtc-fragrance-beauty-retailer/hero-16x9-v01.avif`
- `media_assets.asset_key`: `case-dtc-fragrance-hero`
- `media_assets.alt_text`: `Ecommerce operators reviewing unbranded fragrance stock in a merchandising workspace.`
- `case_study_media.role`: `hero`; reuse as `card` until a separate crop is needed.
- Caption: `Sector illustration.`

#### Approach illustration

```text
Use case: infographic-diagram
Asset type: case-study approach illustration, 16:9
Primary request: five storefront nodes receiving changing stock signals, with unavailable products automatically moving out of prime positions while one orange testing loop feeds customer behaviour back into merchandising
Style/medium: clean editorial diagram, rounded geometry, subtle paper grain
Composition/framing: left-to-right system flow; maximum eight major elements; no labels inside artwork
Colour palette: warm off-white, deep indigo-black, blaze orange, restrained magenta and indigo
Constraints: visually distinguish inventory signal, merchandising order and test feedback; no logos; no text; no watermark
Avoid: literal website screenshots, detailed dashboards, shopping-cart clip art
```

- Upload to: `rich-media/Case Studies/dtc-fragrance-beauty-retailer/approach-live-stock-flow-v01.webp`
- Role: `approach`
- Alt text: `Diagram showing live stock signals updating merchandising across five storefronts and feeding test insights back into the funnel.`

#### Results vector

Build as deterministic SVG in Figma or Illustrator rather than generating text inside an image.

- Data: `32% → 98% Product Impression Share`, `+10% Conversion Rate`, `+7% Margin`.
- Upload to: `rich-media/Case Studies/dtc-fragrance-beauty-retailer/results-v01.svg`
- Role: `results`
- Alt text: `Results: product impression share increased from 32% to 98%, conversion rose 10%, and margin improved 7%.`

---

## Case study 2 — Fast-growth fashion retailer

### Core record

| Field | Value |
|---|---|
| `client` | A Fast-Growth Fashion Retailer |
| `slug` | `fast-growth-fashion-retailer` |
| `industry` | Retail |
| `headline` | Cutting nearly £2M from carrier costs while building operations for rapid scale. |
| `card_summary` | Carrier renegotiation, proactive tracking and a new service operating model protected margin through exceptional growth. |
| `metric` | £2M Carrier Savings |
| `sort_order` | 2 |
| `status` | published |
| `confidentiality_note` | Client name withheld by agreement. Generated visuals are sector illustrations, not photographs of the client. |
| `seo_title` | Retail Operations Case Study — Xtradite Digital |
| `seo_description` | How carrier renegotiation and a 24-person service restructure delivered nearly £2M in savings while supporting rapid fashion retail growth. |

### `challenge`

This occasionwear retailer recovered from lockdown restrictions faster than its category, scaling from roughly £45K to a £10M single-weekend peak and a £3.5M+ monthly run rate within two years. That pace placed significant pressure on carrier costs, while a 24-person customer service team worked as one reactive queue with no clear ownership of logistics, returns or social engagement.

### `description`

```html
<p>We renegotiated carrier rates in step with volume growth, securing close to £2M in savings over two years as well as service upgrades and privileged access to carrier tracking data. That data enabled a proactive, returns-mitigation-led service model rather than one driven solely by incoming tickets. We also reorganised the 24-person customer service team into three ownership clusters—logistics, product and returns, and social engagement—giving each group responsibility for improving the operation, not simply closing queries.</p>
```

### `case_study_metrics` rows

```json
[
  {"label":"Carrier Cost Savings Over Two Years","value":"Nearly £2M","animate":false},
  {"label":"Monthly Revenue Run Rate","value":"£3.5M+","animate":true},
  {"label":"Single-Weekend Peak","value":"£10M","animate":true},
  {"label":"Service Team Operating Model","value":"24 People → 3 Functions","animate":false}
]
```

### `case_study_approach_steps` rows

```json
[
  {"title":"Renegotiate with growth, not after it","description":"Reset carrier rates as volume increased, while securing service upgrades and better access to tracking data."},
  {"title":"Move service from reactive to proactive","description":"Used carrier data to identify delivery issues earlier and support a returns-mitigation-led service model."},
  {"title":"Create clear operational ownership","description":"Reorganised 24 service colleagues into logistics, product and returns, and social engagement functions with responsibility for improvement projects."}
]
```

### `results_detail`

```html
<p>Carrier rate renegotiation delivered close to £2M in savings over two years while the brand scaled to a £10M single-weekend peak and a £3.5M+ monthly run rate. Better tracking access helped shift customer service from reactive ticket handling toward proactive delivery and returns management. The team restructure created three clear ownership functions, turning customer service into an operational improvement capability as well as a customer contact channel.</p>
```

### Testimonials

- `testimonial_quote`: null
- `testimonial_author`: null
- `testimonial_pending`: false

### Media prompts and destinations

#### Hero/card photography

```text
Use case: photorealistic-natural
Asset type: anonymous retail operations case-study hero and card image, 16:9
Primary request: candid editorial view of a high-volume UK fashion fulfilment operation during a busy dispatch period
Scene/backdrop: organised warehouse with unbranded garment rails, parcel benches and carrier cages
Subject: fulfilment lead and customer operations colleague checking parcel flow and tracking exceptions together; natural movement, no one looking at camera
Style/medium: premium documentary photography, photorealistic, realistic workplace texture
Composition/framing: wide 35mm environmental shot; central card-safe action; visible scale without crowding
Lighting/mood: bright practical warehouse daylight; energetic but controlled
Constraints: safe working practice; generic sector scene; no client identity; no readable labels, addresses or screens
Avoid: fashion campaign styling, chaos, unsafe stacking, branded carriers, logos, staged smiles, watermark
```

- Upload to: `rich-media/Case Studies/fast-growth-fashion-retailer/hero-16x9-v01.avif`
- Asset key: `case-fashion-operations-hero`
- Role: `hero` and `card`
- Alt text: `Fashion fulfilment colleagues reviewing parcel flow in a busy warehouse.`
- Caption: `Sector illustration.`

#### Approach illustration

```text
Use case: infographic-diagram
Asset type: case-study approach illustration, 16:9
Primary request: parcel volume flowing through a carrier-data layer into three clear ownership streams representing logistics, product and returns, and social engagement
Style/medium: clean editorial vector-like diagram with rounded nodes and restrained paper texture
Composition/framing: one incoming flow, one central tracking signal, three organised output streams
Colour palette: warm off-white, deep indigo-black, blaze orange, restrained magenta and indigo
Constraints: no embedded text; maximum seven elements; clear at mobile width
Avoid: carrier logos, delivery vans with branding, corporate clip art, watermark
```

- Upload to: `rich-media/Case Studies/fast-growth-fashion-retailer/approach-service-model-v01.webp`
- Role: `approach`
- Alt text: `Diagram showing carrier tracking data feeding three customer service ownership functions.`

#### Results vector

- Data: `Nearly £2M Carrier Savings`, `£3.5M+ Monthly Run Rate`, `24 People → 3 Functions`.
- Upload to: `rich-media/Case Studies/fast-growth-fashion-retailer/results-v01.svg`
- Role: `results`
- Produce in: Figma or Illustrator.

---

## Case study 3 — Scale-up consumer brand AI operations

### Core record

| Field | Value |
|---|---|
| `client` | A Scale-Up Consumer Brand |
| `slug` | `scale-up-consumer-brand-ai-operations` |
| `industry` | Startups |
| `headline` | Turning an unowned communications channel into a self-running operations system. |
| `card_summary` | AI-assisted process mining and structured workflow design cut unnecessary stakeholder time and improved on-time delivery in two weeks. |
| `metric` | -70% Admin Time |
| `sort_order` | 3 |
| `status` | published |
| `confidentiality_note` | Client name withheld by agreement. Visuals abstract the workflow and do not reproduce private messages or documents. |
| `seo_title` | AI Operations Case Study — Xtradite Digital |
| `seo_description` | How AI-assisted process mining reduced unnecessary stakeholder time by 70% and improved on-time delivery by 30% in around two weeks. |

### `challenge`

This scale-up consumer brand ran its busiest operational communication through a single channel. Purchase-order approvals, restock requests, compliance checks, review reporting, listing optimisation and project discussion collided without clear ownership. Tasks carried no consistent owner, due date or dependency, so bottlenecks became visible only after they had delayed delivery.

### `description`

```html
<p>In around two weeks, we used AI-assisted process mining to analyse the operational patterns hidden across the channel and consolidated scattered working documents into a structured repository. We rebuilt the activity as a project-managed workflow organised by stakeholder visibility, with every task assigned an owner, due date and dependency, plus automated recurrence where appropriate. Daily automated reviews of task comments and progress now flag bottlenecks and approval milestones before they cause delay.</p>
```

### `case_study_metrics` rows

```json
[
  {"label":"Unnecessary Stakeholder Time","value":"-70%","animate":true},
  {"label":"On-Time Delivery","value":"+30%","animate":true},
  {"label":"Delivery Timeline","value":"Around 2 Weeks","animate":false}
]
```

### `case_study_approach_steps` rows

```json
[
  {"title":"Mine the real process","description":"Used AI-assisted analysis to identify recurring requests, approvals, hand-offs and bottlenecks across the business's busiest communication channel."},
  {"title":"Rebuild work around ownership","description":"Moved activity into a structured system where every task had the right visibility, owner, due date, dependency and recurrence."},
  {"title":"Detect risk before delay","description":"Introduced daily automated reviews of progress and comments to flag bottlenecks and approval milestones for escalation."}
]
```

### `results_detail`

```html
<p>The new operating system reduced time spent by stakeholders who no longer needed to remain in every conversation by 70%, while improving on-time delivery by 30% for those accountable for the work. Automated daily reviews now surface bottlenecks and approval milestones before they cause delay. A catch-all communication channel became a structured workflow with clear ownership and repeatable control.</p>
```

### Testimonials

- `testimonial_quote`: null
- `testimonial_author`: null
- `testimonial_pending`: false

### Media prompts and destinations

#### Hero illustration

Photography would add little here; use an abstract editorial system visual and avoid reproducing a real messaging application.

```text
Use case: stylized-concept
Asset type: AI operations case-study hero and card illustration, 16:9
Primary request: a dense cluster of unowned conversation fragments, requests and document shapes resolving into one calm project system with clear owners, due points and dependency paths
Style/medium: sophisticated editorial illustration, bold rounded geometry, subtle paper grain, mostly flat colour
Composition/framing: controlled left-to-right transformation; tangled cluster on the left, structured flow on the right; safe central crop
Colour palette: warm off-white, deep indigo-black, blaze-orange resolution path, restrained magenta and indigo exception nodes
Constraints: no text; no brand-specific interface; maximum ten major elements; commercially serious
Avoid: robot, brain, magic wand, glowing AI orb, Slack logo, chat-app screenshot, neon cyber effects, watermark
```

- Upload to: `rich-media/Case Studies/scale-up-consumer-brand-ai-operations/hero-system-v01.webp`
- Asset key: `case-ai-operations-hero`
- Role: `hero` and `card`
- Alt text: `Illustration of unstructured operational messages becoming a clear workflow with owners and dependencies.`
- Caption: `Operational workflow illustration.`

#### Motion version

```text
Asset type: muted seamless case-study hero loop, 16:9, 6 seconds
Primary request: conversation and document shapes drift into a crowded central queue, then an orange path calmly sorts them into assigned workflow nodes with dependencies and due points
Style/medium: match the supplied approved hero illustration exactly
Motion: slow and purposeful; nodes move once and settle; one small bottleneck warning appears and resolves
Camera: locked
Constraints: preserve shapes and palette; no text; no particles; no interface morphing; seamless loop; no audio
Avoid: fast loading animation, cyber glow, logos, watermark
```

- Upload to: `rich-media/Case Studies/scale-up-consumer-brand-ai-operations/hero-loop-v01.webm` with MP4 fallback and poster.
- Roles: `video` and `poster`.

#### Results vector

- Data: `-70% Unnecessary Stakeholder Time`, `+30% On-Time Delivery`, `Around 2 Weeks`.
- Upload to: `rich-media/Case Studies/scale-up-consumer-brand-ai-operations/results-v01.svg`
- Role: `results`

---

## Case study 4 — Multi-marketplace consumer goods brand

### Core record

| Field | Value |
|---|---|
| `client` | A Multi-Marketplace Consumer Goods Brand |
| `slug` | `multi-marketplace-consumer-goods-brand` |
| `industry` | Consumer Goods |
| `headline` | Rebuilding a declining marketplace business around margin-led growth. |
| `card_summary` | A 13-marketplace plan combined lower advertising cost, stronger margin controls and a coordinated 36-SKU international launch. |
| `metric` | 7.0% TACoS |
| `sort_order` | 4 |
| `status` | published |
| `confidentiality_note` | Client name withheld by agreement. Generated visuals are sector illustrations and contain no marketplace branding. |
| `seo_title` | Marketplace Growth Case Study — Xtradite Digital |
| `seo_description` | How a margin-led 13-marketplace plan reached a 7.0% TACoS, 26.3% peak net margin and coordinated a 36-SKU international launch. |

### `challenge`

The brand's marketplace business had declined by around a third following a product-line discontinuation and stock disruption. The operation spanned 13 marketplaces and reported directly to the CEO, while advertising cost was eroding margin at the point the business needed a credible plan to rebuild both revenue and profitability.

### `description`

```html
<p>Working alongside the brand's performance media partner, we helped bring blended advertising cost of sale to a 15-month low of 7.0% and net margin to a peak of 26.3%. We then authored a forward-year plan targeting £6.0M in revenue at a 12.4% blended TACoS, protected by per-line advertising ceilings, a hard net-margin kill switch and a no-markdown seasonal offer strategy. In parallel, we led a 36-SKU launch across ten marketplaces and seven languages.</p>
```

### `case_study_metrics` rows

```json
[
  {"label":"Blended TACoS — 15-Month Low","value":"7.0%","animate":true},
  {"label":"Peak Net Margin","value":"26.3%","animate":true},
  {"label":"Forward-Year Revenue Target","value":"£6.0M","animate":true},
  {"label":"Launch Scale","value":"36 SKUs / 10 Markets / 7 Languages","animate":false}
]
```

### `case_study_approach_steps` rows

```json
[
  {"title":"Stabilise commercial efficiency","description":"Worked alongside the performance media partner to bring blended TACoS to a 15-month low and improve net margin during the engagement."},
  {"title":"Build margin protection into the plan","description":"Set per-line advertising ceilings, a net-margin kill switch and a no-markdown seasonal strategy within the forward-year plan."},
  {"title":"Coordinate the international launch","description":"Led a 36-SKU launch across ten marketplaces and seven languages with a single delivery structure."}
]
```

### `results_detail`

```html
<p>Blended TACoS reached a 15-month low of 7.0% and net margin peaked at 26.3% during our tenure, working alongside the brand's performance media partner. We then delivered a forward-year plan targeting £6.0M in revenue at a 12.4% blended TACoS, with explicit margin controls. The 36-SKU launch across ten marketplaces and seven languages reached the majority of one region's weekly revenue within eight weeks. The £6.0M figure remains a forward-year target, not a delivered revenue result.</p>
```

### Testimonials

- `testimonial_quote`: null
- `testimonial_author`: null
- `testimonial_pending`: false

### Media prompts and destinations

#### Hero/card photography

```text
Use case: photorealistic-natural
Asset type: anonymous multi-marketplace consumer goods case-study hero and card image, 16:9
Primary request: candid editorial scene of a consumer-goods commercial team coordinating an international product launch
Scene/backdrop: bright operational planning workspace with unbranded product samples, neutral shipping cartons and a printed market rollout grid with no readable text
Subject: two operators comparing product variants and launch sequencing; authentic working posture
Style/medium: premium British business documentary photography, photorealistic
Composition/framing: medium-wide 35mm; product range and people both visible; central card-safe crop
Lighting/mood: natural daylight, commercially focused, confident
Constraints: generic sector scene; no client identity; no marketplace logos; no country flags; no readable business data
Avoid: Amazon branding, fake dashboards, celebratory stock-photo poses, logos, watermark
```

- Upload to: `rich-media/Case Studies/multi-marketplace-consumer-goods-brand/hero-16x9-v01.avif`
- Asset key: `case-marketplace-growth-hero`
- Role: `hero` and `card`
- Alt text: `Consumer-goods team coordinating an international product launch with unbranded samples.`
- Caption: `Sector illustration.`

#### Approach illustration

```text
Use case: infographic-diagram
Asset type: multi-marketplace strategy illustration, 16:9
Primary request: thirteen marketplace nodes organised around one margin-control core, with a 36-item product wave expanding into ten market nodes and seven language markers
Style/medium: clean editorial diagram with rounded paths and restrained paper texture
Composition/framing: central margin-control core; organised radial network; keep visual density readable at mobile width
Colour palette: warm off-white, deep indigo-black, blaze-orange priority paths, restrained magenta and indigo
Constraints: no embedded text; no maps requiring geographic accuracy; no marketplace branding; maximum 13 small nodes
Avoid: Amazon logo, flags, globe cliché, tiny labels, watermark
```

- Upload to: `rich-media/Case Studies/multi-marketplace-consumer-goods-brand/approach-marketplace-system-v01.webp`
- Role: `approach`
- Alt text: `Diagram showing a margin-control core coordinating a multi-marketplace product launch.`

#### Results vector

- Delivered data: `7.0% TACoS`, `26.3% Peak Net Margin`, `Majority of Regional Weekly Revenue in 8 Weeks`.
- Target data must be visually labelled: `£6.0M Forward-Year Target`.
- Upload to: `rich-media/Case Studies/multi-marketplace-consumer-goods-brand/results-v01.svg`
- Role: `results`

---

## Case study 5 — Subscription-led coffee brand

### Core record

| Field | Value |
|---|---|
| `client` | A Subscription-Led Coffee Brand |
| `slug` | `subscription-led-coffee-brand` |
| `industry` | Consumer Goods |
| `headline` | Making retention the growth engine for a subscription-first coffee brand. |
| `card_summary` | Lifecycle automation increased email value while new reseller and wholesale funnels reduced dependence on a single DTC channel. |
| `metric` | +31% Campaign AOV |
| `sort_order` | 5 |
| `status` | published |
| `confidentiality_note` | Client name withheld by agreement. Generated visuals are sector illustrations, not photographs of the client. |
| `seo_title` | Subscription Retention Case Study — Xtradite Digital |
| `seo_description` | How lifecycle automation drove 66% of email revenue, increased campaign AOV by 31% and supported new B2B and wholesale growth channels. |

### `challenge`

This subscription-first coffee brand relied heavily on one-time purchases and paid acquisition. Email operated as broad, unsegmented campaigns rather than an always-on lifecycle system, while growth depended on a single direct-to-consumer channel with no B2B or wholesale funnel to offset rising acquisition costs.

### `description`

```html
<p>We rebuilt the email flow and segmentation architecture end to end, replacing broad campaign activity with an always-on lifecycle system designed around customer behaviour. Automated flows grew to represent 66% of total email revenue and campaign average order value increased 31%, while retention activity reduced churn and supported stronger subscriber lifetime value. Alongside the retention work, we created new B2B reseller and wholesale-marketplace funnels to reduce reliance on a single direct-to-consumer route to growth.</p>
```

### `case_study_metrics` rows

```json
[
  {"label":"Automated Flows Share of Email Revenue","value":"66%","animate":true},
  {"label":"Campaign Average Order Value","value":"+31%","animate":true}
]
```

### `case_study_approach_steps` rows

```json
[
  {"title":"Rebuild lifecycle architecture","description":"Replaced broad, one-off email activity with segmented journeys and always-on automated flows."},
  {"title":"Improve retention economics","description":"Used lifecycle communication to reduce churn and compound subscriber lifetime value rather than relying only on acquisition."},
  {"title":"Diversify routes to market","description":"Built B2B reseller and wholesale-marketplace funnels alongside the DTC retention programme."}
]
```

### `results_detail`

```html
<p>Automated flows grew to drive 66% of total email revenue, while campaign average order value increased 31%. The lifecycle system created a stronger base for subscriber retention and lifetime value instead of allowing growth to leak through churn. New B2B reseller and wholesale-marketplace funnels diversified the commercial model so future growth did not depend entirely on one direct-to-consumer channel.</p>
```

### Testimonials

- `testimonial_quote`: null
- `testimonial_author`: null
- `testimonial_pending`: false

### Media prompts and destinations

#### Hero/card photography

```text
Use case: photorealistic-natural
Asset type: anonymous coffee subscription case-study hero and card image, 16:9
Primary request: candid editorial photograph of an unbranded speciality coffee subscription packing and customer lifecycle operation
Scene/backdrop: warm small-batch fulfilment workspace with kraft mailers, coffee bags without labels and a tidy planning area
Subject: two operators preparing subscription parcels and reviewing customer segments on printed cards with no readable private data
Style/medium: natural British small-business documentary photography, photorealistic
Composition/framing: medium-wide 35mm shot; hands and materials visible; central card-safe crop
Lighting/mood: warm natural morning light; crafted, capable and calm
Materials/textures: kraft paper, coffee bag material, timber, real fabric
Constraints: generic sector scene; no client identity; no readable labels or screens; no embedded text
Avoid: café lifestyle shot, latte art close-up, visible coffee brands, staged smiles, watermark
```

- Upload to: `rich-media/Case Studies/subscription-led-coffee-brand/hero-16x9-v01.avif`
- Asset key: `case-coffee-retention-hero`
- Role: `hero` and `card`
- Alt text: `Coffee subscription parcels being prepared in an unbranded fulfilment workspace.`
- Caption: `Sector illustration.`

#### Approach illustration

```text
Use case: infographic-diagram
Asset type: retention and channel strategy illustration, 16:9
Primary request: one customer lifecycle loop connecting welcome, repeat purchase, subscription and win-back behaviours, with two additional branches opening toward reseller and wholesale channels
Style/medium: clean editorial diagram, rounded geometry, subtle paper grain
Composition/framing: one dominant circular lifecycle with two clear outward branches; maximum eight nodes; no labels in artwork
Colour palette: warm off-white, deep indigo-black, blaze-orange lifecycle path, restrained magenta and indigo branches
Constraints: communicate retention and channel diversification without logos or detailed UI
Avoid: envelope clip art, shopping cart icons, coffee cup cliché, tiny text, watermark
```

- Upload to: `rich-media/Case Studies/subscription-led-coffee-brand/approach-lifecycle-v01.webp`
- Role: `approach`
- Alt text: `Diagram showing an automated customer lifecycle loop branching into reseller and wholesale channels.`

#### Results vector

- Data: `66% of Email Revenue from Automated Flows`, `+31% Campaign AOV`, plus a qualitative `New B2B and Wholesale Funnels` callout.
- Upload to: `rich-media/Case Studies/subscription-led-coffee-brand/results-v01.svg`
- Role: `results`

---

## Case study 6 — Digital healthcare platform

### Core record

| Field | Value |
|---|---|
| `client` | A Digital Healthcare Platform |
| `slug` | `digital-healthcare-platform` |
| `industry` | Professional Services |
| `headline` | Taking a patient community platform from first scope to live service. |
| `card_summary` | Platform selection, information architecture, moderation and launch were delivered as one end-to-end engagement. |
| `metric` | Live, Start to Finish |
| `sort_order` | 6 |
| `status` | published |
| `confidentiality_note` | Client name withheld by agreement. Visuals are conceptual and do not depict real patients or clinical interactions. |
| `seo_title` | Digital Platform Delivery Case Study — Xtradite Digital |
| `seo_description` | How Xtradite selected, structured, moderated and launched a patient community platform through one end-to-end delivery engagement. |

### `challenge`

The healthcare provider wanted to give patients a dedicated space to connect and support one another, but had no selected platform, information architecture or moderation model. Without a clearly scoped delivery partner, the initiative risked stopping at strategy rather than reaching a safe, usable live service.

### `description`

```html
<p>We scoped and delivered the initiative from platform selection through launch. The engagement covered the community structure, category model, moderation workflow and implementation needed to create a functioning patient space. Rather than handing over a recommendation after the strategy phase, we stayed accountable through configuration, readiness and go-live, resulting in a live community platform delivered through one engagement.</p>
```

### `case_study_metrics` rows

```json
[
  {"label":"Engagement Scope","value":"End-to-End Delivery","animate":false},
  {"label":"Outcome","value":"Live Community Platform","animate":false},
  {"label":"Delivery Stages","value":"Selection → Structure → Moderation → Launch","animate":false}
]
```

### `case_study_approach_steps` rows

```json
[
  {"title":"Select the platform","description":"Chose an appropriate community foundation for a dedicated patient support space."},
  {"title":"Design the information architecture","description":"Created the structure and category model needed to make the community understandable and usable."},
  {"title":"Build moderation into the service","description":"Defined the moderation workflow required to operate the space responsibly from launch."},
  {"title":"Deliver through go-live","description":"Configured and launched the platform rather than ending the engagement with a strategy handover."}
]
```

### `results_detail`

```html
<p>The engagement moved from platform selection to a live patient community without a hand-off gap between strategy and implementation. The final service included its information architecture, categories, moderation workflow and launch configuration. This is a qualitative delivery case study: its proof is a completed, operational platform, not a clinical or patient-outcome claim.</p>
```

### Testimonials

- `testimonial_quote`: null
- `testimonial_author`: null
- `testimonial_pending`: true internally; do not display publicly until a signed-off quote exists.

### Media prompts and destinations

#### Hero illustration

Avoid generated patient photography, which could imply real patients and introduce unnecessary sensitivity.

```text
Use case: stylized-concept
Asset type: digital healthcare platform case-study hero and card illustration, 16:9
Primary request: a safe, welcoming digital community represented by small human-centred nodes organised into clear topic spaces, protected by a subtle moderation layer
Style/medium: sophisticated editorial illustration; rounded geometry; soft tactile paper texture; calm and trustworthy
Composition/framing: central community structure with generous space; visible progression from unstructured nodes to organised categories; card-safe crop
Colour palette: warm off-white, deep indigo-black, blaze-orange guidance path, restrained magenta and indigo community nodes
Constraints: conceptual only; no real patients; no medical symbols; no text; no clinical claims; maximum nine major elements
Avoid: hospital photography, red cross, stethoscope, patient data, chat-interface screenshot, shield cliché dominating the image, logos, watermark
```

- Upload to: `rich-media/Case Studies/digital-healthcare-platform/hero-community-v01.webp`
- Asset key: `case-healthcare-community-hero`
- Role: `hero` and `card`
- Alt text: `Conceptual illustration of a moderated digital community organised into clear topic spaces.`
- Caption: `Conceptual service illustration; no real patients are depicted.`

#### Approach illustration

```text
Use case: infographic-diagram
Asset type: digital platform delivery process illustration, 16:9
Primary request: four connected stages moving from platform selection to information architecture, moderation readiness and live community
Style/medium: minimal editorial vector-like diagram with rounded paths and subtle paper grain
Composition/framing: clear left-to-right four-stage progression; each stage visually distinct without labels
Colour palette: warm off-white, deep indigo-black, blaze-orange delivery path, restrained magenta and indigo
Constraints: no embedded text; no medical icons; no interface screenshots; accessible at mobile width
Avoid: clinical claims, security padlock cliché, logos, watermark
```

- Upload to: `rich-media/Case Studies/digital-healthcare-platform/approach-four-stage-v01.webp`
- Role: `approach`
- Alt text: `Four-stage platform delivery process from selection through structure and moderation to launch.`

#### Results vector

- Content: `Platform Selected`, `Information Architecture Built`, `Moderation Workflow Ready`, `Live Community Launched`.
- Do not present fabricated numerical metrics.
- Upload to: `rich-media/Case Studies/digital-healthcare-platform/results-v01.svg`
- Role: `results`

---

## 4. Where every content value belongs

| Content | Supabase destination | Public placement |
|---|---|---|
| Client descriptor | `case_studies.client` | Breadcrumb and hero metadata |
| Outcome headline | `case_studies.headline` | H1 |
| Short card copy | proposed `case_studies.card_summary` | Listing and related cards |
| Primary proof point | `case_studies.metric` | Hero |
| Complete overview | `case_studies.description` | New “The engagement” section |
| Problem narrative | `case_studies.challenge` | Challenge section |
| Metrics | `case_study_metrics`; join through `case_study_id` and order by `sort_order` | Evidence strip |
| Delivery steps | `case_study_approach_steps`; join through `case_study_id` and order by `sort_order` | Approach timeline |
| Result narrative | `case_studies.results_detail` | Results section |
| Approved quote | `testimonial_quote`, `testimonial_author` | Client voice section |
| Publishing state | `case_studies.status` | Delivery view/RLS |
| Primary industry | `case_study_industries` joined to `industries`; set `is_primary = true` | Eyebrow and structured metadata |
| Related service | `service_case_studies` joined to `services` | Related-service card |
| SEO title/description | proposed `seo_title`, `seo_description` | `<title>` and metadata |
| Asset binary | Supabase Storage `rich-media/Case Studies/<slug>/...` | CDN-delivered media |
| Asset metadata | `media_assets` | Alt text, dimensions and URL |
| Asset page role | proposed `case_study_media` | Card, hero, approach, results, OG and video slots |
| Generation prompt | This private production plan | Paste into the named generation tool; do not expose through public CMS |

---

## 5. Generation order

Do not generate all assets at once.

1. Generate three visual directions for the first case study only: documentary hero, approach illustration and results vector.
2. Approve one photographic grade, illustration grammar and vector system.
3. Use those approved outputs as style references for the remaining cases.
4. Generate one final hero per case study.
5. Produce the six approach illustrations.
6. Build the six results graphics in Figma or Illustrator using verified data.
7. Animate only the AI operations hero first; add more video only if it improves engagement without affecting performance.
8. Upload and map assets after final approval, not at draft stage.

## 6. Final editorial checks before publishing

- Confirm every number with source evidence.
- Keep target values visibly labelled as targets.
- Confirm “nearly £2M” versus “£2M” with the underlying evidence and use one convention consistently.
- Confirm whether “£10M single-weekend peak” is the intended and defensible wording.
- Confirm whether the grey-market supply-chain detail can be disclosed publicly.
- Never create or infer testimonial quotes.
- Hide pending testimonials from the public page.
- Caption all generated sector imagery honestly.
- Do not use generated patient photography for the healthcare case.
- Ensure no generated image contains readable confidential or nonsensical data.
- Check card crops at desktop and 360px mobile width.
- Add `og:image` and use a large social card only after the final asset exists.

## 7. Recommended implementation sequence after content approval

1. Create a migration for the five minimal `case_studies` fields and the new `case_study_media` relationship. Preserve the existing tables and foreign-key model.
2. Enable RLS on `case_study_media`, add the parent-published/asset-active public read policy, and grant only the required `SELECT` access to public API roles.
3. Update the six parent rows in `case_studies` with core copy and proposed fields. Keep their status as `draft` while reviewing if changes should not appear immediately.
4. Upsert repeating content into `case_study_metrics` and `case_study_approach_steps` by `case_study_id` and `sort_order`. Treat these child tables as canonical; leave the parent JSONB columns untouched as compatibility snapshots until removal is separately planned.
5. Verify `case_study_industries` has exactly one primary industry per case study and `service_case_studies` contains the intended service relationship.
6. Upload approved files to Storage, register them in `media_assets`, and map them through `case_study_media`.
7. Extend the security-invoker `case_studies_delivery` view with `card_summary`, SEO values, publication date, confidentiality note and ordered media. Continue sourcing metrics, approach, industries and services from their normalised relationships.
8. Update card rendering to use the primary `card` asset and `card_summary`.
9. Update the detail renderer to show the primary hero, `description`, approach/results assets and dedicated SEO/OG metadata.
10. Remove public pending-testimonial messaging; show the block only when an approved quote exists.
11. Run security and performance advisors, then verify all six pages, metadata, mobile crops, RLS, API grants and Storage access before changing records to `published`.

### Supabase Dashboard entry order for each page

1. Open `case_studies` and update the row found by `slug`.
2. Copy its `id`.
3. Open `case_study_metrics`; update or create the supplied metric rows using that `case_study_id` and sequential `sort_order` values.
4. Open `case_study_approach_steps`; update or create the supplied approach rows in the same way.
5. Open `case_study_industries`; link the canonical industry and make it the single primary row.
6. Open `service_case_studies`; confirm the intended service relationship.
7. After media approval, upload the file to Storage, register it in `media_assets`, then create its `case_study_media` role mapping.
8. Preview through `case_studies_delivery`, not by querying all child tables independently from the browser.
