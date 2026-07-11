# Xtradite Digital — website frontend

Plain static HTML/CSS/JS. No build step, no framework, no npm install. Every page is wired
live to the **one** Wix site's CMS, Blog, and Forms data (site: "Xtradite Digital — H...",
id `9f424aed-f9a6-4cf1-aaaa-5bb610a9defb`) — content you edit in the Wix dashboard appears
here automatically, no code changes needed.

## How it's wired

- `assets/js/wix-client.js` — visitor-token transport, using this site's public
  `WIX_CLIENT_ID`. Safe to keep hardcoded (it only mints anonymous read tokens).
- `assets/js/wix-cms.js` / `wix-blog.js` — read helpers for the `Services`, `Industries`,
  `CaseStudies` collections and the Blog.
- `assets/js/forms.js` — submits the Contact page to the live "Contact Form"
  (id `8ae888de-ed1f-43b8-9627-26c9d9799eda`).
- `assets/js/pages/*.js` — one script per page, fetches and renders that page's data.

Hub pages (`services.html`, `industries.html`, `case-studies.html`, `insights.html`) list
everything live in their collection. Detail pages (`service-detail.html?slug=...`, etc.)
read the `slug` query param and fetch that one item — add/remove/edit items in the Wix CMS
dashboard and the site reflects it on next page load, no redeploy needed.

## Editing content

Everything text-wise on Services, Industries, Case Studies and Insights lives in the Wix
dashboard, not in this code:
- Collections & items — `https://manage.wix.com/dashboard/9f424aed-f9a6-4cf1-aaaa-5bb610a9defb/wix-cms`
- Blog posts — `https://manage.wix.com/dashboard/9f424aed-f9a6-4cf1-aaaa-5bb610a9defb/blog/posts`
- Contact form submissions — `https://manage.wix.com/dashboard/9f424aed-f9a6-4cf1-aaaa-5bb610a9defb/forms`

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
