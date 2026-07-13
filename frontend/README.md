# Xtradite Digital — website frontend

Plain static HTML/CSS/JS. No build step, no framework, no npm install. Every page is wired
live to a Supabase project (Postgres + auto-generated REST API) — content you edit in the
Supabase Table Editor appears here automatically, no code changes needed.

## How it's wired

- `assets/js/supabase-client.js` — creates the Supabase client using this project's public
  URL and anon (publishable) key. Safe to keep hardcoded: Row Level Security policies (see
  `supabase/schema.sql`) restrict what the anon key can actually do — public read on content
  tables, insert-only on `contact_submissions`.
- `assets/js/cms.js` / `blog.js` — read helpers for the `services`, `industries`,
  `case_studies` and `blog_posts` tables.
- `assets/js/forms.js` — inserts Contact page submissions into `contact_submissions`.
- `assets/js/pages/*.js` — one script per page, fetches and renders that page's data.
- `../api/location.js` — renders the `/locations` and `/uk/...` hierarchy from the
  published Supabase location delivery views.

Hub pages (`services.html`, `industries.html`, `case-studies.html`, `insights.html`) list
everything live in their table. Detail pages (`service-detail.html?slug=...`, etc.) read the
`slug` query param and fetch that one row — add/remove/edit rows in the Supabase Table Editor
and the site reflects it on next page load, no redeploy needed.

## Editing content

Everything text-wise on Services, Industries, Case Studies and Insights lives in Supabase,
not in this code — edit rows directly in the Supabase dashboard's Table Editor for this
project (`services`, `industries`, `case_studies`, `blog_posts` tables). Contact form
submissions land in the `contact_submissions` table (not readable by the public site itself,
by design — RLS grants it insert-only).

UK location routing is managed in the normalized `location_nations`, `location_regions`,
`location_counties`, `locations` and `location_services` tables. Only rows with a published
status are exposed to the public router and sitemap. Location-specific introduction and SEO
overrides can be edited on `locations` or `location_services`; no code deployment is needed.

`supabase/schema.sql` at the repo root is the one-time setup script (tables, RLS policies,
and the content migrated from the site's original Wix CMS/Blog) — only needs running once
against a fresh Supabase project. `supabase/migrations/` holds later schema changes, applied
in order — e.g. `002_blog_tags_seo.sql` adds `blog_posts.tags` (a `text[]`, used for the
tag filter on the Insights page — just add tag strings to a post's `tags` array in the
Table Editor) and `blog_posts.seo_title` / `seo_description` (optional overrides for a
post's `<title>`/meta description/Open Graph tags; leave null to fall back to the post's
title/excerpt).

Static chrome copy (Home hero/stats/FAQ/timeline, About page body, legal pages, nav labels)
lives directly in the HTML files and is edited like any static site.

## Deploying

Any static host works — this is just files. Drag-and-drop the whole `frontend/` folder onto
Netlify or Vercel, push it to GitHub Pages, or upload it wherever you like. The one
requirement: it must be served over **http(s)**, not opened directly as a local `file://`
path — the page scripts use ES modules, which browsers block from `file://` for security
reasons.

Quick local preview: from inside this folder, run `python3 -m http.server 8000` (or any
static file server) and open `http://localhost:8000`.

## Analytics, ads, sitemap & LLM discoverability

- **Google Analytics (GA4)** — the `gtag.js` snippet (measurement ID `G-WYXTKGJ9JS`) is
  in every page's `<head>`, so page views are tracked on every load without any extra
  wiring (this is a multi-page site, not an SPA, so the default `gtag('config', ...)`
  call is all page-view tracking needs).
- **Server-side lead tracking** — `api/track-lead.js` (Vercel serverless function) sends
  a `generate_lead` event straight to GA4 via the Measurement Protocol after a successful
  Contact form submission (`assets/js/forms.js`), so leads are still recorded if the
  visitor's browser blocks `gtag.js`. **Requires a `GA_MP_API_SECRET` environment
  variable in the Vercel project settings** (the GA4 Measurement Protocol API secret) —
  without it the function no-ops silently.
- **AdSense** — the `adsbygoogle.js` loader (`ca-pub-7308041122340160`) is in every
  page's `<head>`; `ads.txt` at the site root declares the same publisher ID as Google
  requires.
- **Sitemap** — `https://www.xtradite-digital.co.uk/sitemap.xml` is served by
  `api/sitemap.js` (rewritten in `vercel.json`), which queries Supabase at request time
  for published locations, location/service mappings, services, industries, case studies
  and insights. Published Table Editor changes appear automatically, including `lastmod`
  values for geographic routes — nothing to regenerate.
- **Server-rendered detail SEO** — `../api/content.js` serves the canonical
  `/services/:slug`, `/industries/:slug`, `/case-studies/:slug` and `/insights/:slug`
  routes directly from the published delivery views. The initial HTML contains the page
  title, description, canonical, Open Graph/Twitter metadata, visible content and a single
  JSON-LD graph before client-side JavaScript runs.
- **Structured data** — `../api/lib/seo.js` provides stable `Organization`, `WebSite`,
  `WebPage` and `BreadcrumbList` entities. Detail routes add `Service` and visible FAQs,
  `CollectionPage`/`ItemList`, `Article`, or `BlogPosting` according to the content type.
  Location routes retain `Place` and area-served `Service` markup without claiming a local
  branch office.
- **Publishing controls** — only rows exposed by the published delivery views are indexable.
  `blog_posts_delivery` also requires `first_published_at <= now()`, so scheduled articles
  cannot leak into the website or sitemap early. Missing detail records return a noindex 404.
- **Static metadata** — run `npm run seo:static` after changing static-page titles or
  descriptions. The generator is repeatable and maintains one canonical JSON-LD graph per
  static page. `npm run seo:verify` checks representative live routes, schema types,
  canonicals, 404 indexing controls and sitemap URL policy.
- **robots.txt / llms.txt** — `robots.txt` allows all crawlers (including named AI/LLM
  bots) and points at the sitemap; `llms.txt` gives LLMs a plain-language summary of the
  site and its key pages (per the llmstxt.org convention). Per-page `<link
  rel="canonical">`, Open Graph/Twitter meta and `Organization`/`Article`/`Service`/
  `WebPage` JSON-LD are set statically in each HTML file and, on the dynamic detail
  pages, re-applied per-slug by their `assets/js/pages/*.js` script once the row loads.

## Known gaps to close before launch

- **LinkedIn link** — the footer's LinkedIn icon points to `#`. Update it in the footer
  markup (search `aria-label="LinkedIn"`) once you have the real company URL.
- **Testimonials** — the 3 testimonials on Home and About, and the 1 quote on the
  Northfield case study page, are sample copy pending real client sign-off. They're
  flagged with a small "Sample testimonials" note on the page itself as a reminder.
- **Legal pages** — `legal/privacy.html`, `legal/terms.html`, `legal/cookies.html` are
  lightweight drafted templates, not lawyer-reviewed. Have them checked before launch.
- **Photography** — case study card images are currently a placeholder gradient block.
  Swap in real photography when available (search `card-image` in `render-helpers.js`).
