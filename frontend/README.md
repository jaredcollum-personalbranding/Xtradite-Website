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
