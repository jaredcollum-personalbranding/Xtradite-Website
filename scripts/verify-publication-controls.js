const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const mode = process.argv[2] || "all";

function requireText(source, pattern, message) {
  assert.match(source, pattern, message);
}

function forbidText(source, pattern, message) {
  assert.doesNotMatch(source, pattern, message);
}

function lint() {
  const serverSupabase = read("api/lib/supabase.js");
  const locationCatalogue = read("api/lib/location-catalogue.js");
  const browserCms = read("frontend/assets/js/cms.js");
  const migration = read("supabase/migrations/20260714140225_gold_seal_publication_controls.sql");
  const contentViews = read("supabase/migrations/20260715015215_harden_public_delivery_views.sql");
  const remainingViews = read("supabase/migrations/20260715021229_harden_remaining_public_delivery_views.sql");

  requireText(serverSupabase, /PUBLIC_CONTENT_SELECTS/, "Server public field allowlists are required");
  requireText(browserCms, /PUBLIC_SELECTS/, "Browser public field allowlists are required");
  forbidText(locationCatalogue, /fetchAll\([^,]+,\s*["']\*["']/, "Location delivery queries must not select every column");
  forbidText(browserCms, /\.select\(["']\*["']\)/, "Browser delivery queries must not select every column");
  requireText(migration, /column_name not in \('editorial_owner', 'last_reviewed_at'\)/, "Private governance fields must be removed from direct public grants");
  requireText(contentViews, /grant select on table[\s\S]*public\.services_delivery,[\s\S]*public\.blog_posts_delivery[\s\S]*to anon, authenticated/i, "Public roles must receive SELECT-only access to content delivery views");
  forbidText(contentViews, /revoke all privileges on table[\s\S]*public\.services,/, "Base-table revocation must wait until every dependent public view is hardened");
  requireText(remainingViews, /revoke all privileges on table[\s\S]*public\.services,[\s\S]*public\.location_services[\s\S]*from public, anon, authenticated/i, "Public roles must not access CMS, evidence or location source tables directly");
  requireText(remainingViews, /grant select on table[\s\S]*public\.published_content_sitemap,[\s\S]*public\.location_service_routes_delivery[\s\S]*to anon, authenticated/i, "Sitemap and location delivery views must be SELECT-only public contracts");
}

function routes() {
  const contentPage = read("api/content-page.js");
  const serverSupabase = read("api/lib/supabase.js");
  const locationCatalogue = read("api/lib/location-catalogue.js");
  const serviceDetail = read("frontend/assets/js/pages/service-detail.js");

  requireText(serverSupabase, /first_published_at\s*=\s*`lte\./, "Insight routes must enforce the effective publication date at query time");
  requireText(contentPage, /X-Robots-Tag["'],\s*["']noindex, nofollow/, "Rejected detail routes must return a noindex response");
  requireText(locationCatalogue, /\.filter\(isEligibleLocation\)/, "Location route lookup must consume only eligible locations");
  requireText(locationCatalogue, /isEligibleLocationService/, "Location-service route lookup must consume only eligible relationships");
  requireText(serviceDetail, /isEligibleRelatedCaseStudy/, "Related case-study cards must be defensively filtered");
  requireText(serviceDetail, /isEligibleRelatedPost/, "Related insight cards must be defensively filtered");
}

function sitemap() {
  const source = read("api/sitemap.js");
  requireText(source, /published_content_sitemap/, "Content sitemaps must use the governed sitemap view");
  requireText(source, /row\.canonical_path === `\/\$\{config\.route\}\/\$\{row\.slug\}`/, "Sitemap routes must match their approved canonical paths");
  requireText(source, /if \(!locations\.length\) return \[\]/, "Empty location catalogues must not emit route entries");
}

function structuredData() {
  const contentPage = read("api/content-page.js");
  const locationPage = read("api/location.js");
  const contentLookup = contentPage.search(/if\s*\(\s*!item\b/);
  const contentSchema = Math.max(
    contentPage.indexOf("injectSeo(primaryHtml"),
    contentPage.indexOf("injectSeo(template")
  );
  const locationLookup = locationPage.search(/if\s*\(\s*!route\b/);
  const locationSchema = locationPage.lastIndexOf("schemas(route, crumbs");

  assert.ok(contentLookup >= 0 && contentSchema > contentLookup, "Content JSON-LD must be generated only after public eligibility succeeds");
  assert.ok(locationLookup >= 0 && locationSchema > locationLookup, "Location JSON-LD must be generated only after eligible route resolution succeeds");
}

function migration() {
  const source = read("supabase/migrations/20260714140225_gold_seal_publication_controls.sql");
  const contentViews = read("supabase/migrations/20260715015215_harden_public_delivery_views.sql");
  const remainingViews = read("supabase/migrations/20260715021229_harden_remaining_public_delivery_views.sql");
  [
    /publication_is_effective/,
    /is_indexable boolean not null default false/,
    /Public read eligible locations/,
    /Public read eligible location services/,
    /c\.status = 'published'/,
    /join public\.blog_posts_delivery b/,
  ].forEach((pattern) => requireText(source, pattern, `Migration contract missing: ${pattern}`));

  [
    /alter view public\.services_delivery set \(security_invoker = false\)/,
    /alter view public\.industries_delivery set \(security_invoker = false\)/,
    /alter view public\.case_studies_delivery set \(security_invoker = false\)/,
    /alter view public\.blog_posts_delivery set \(security_invoker = false\)/,
  ].forEach((pattern) => requireText(contentViews, pattern, `Content view security contract missing: ${pattern}`));

  [
    /alter view public\.published_content_sitemap set \(security_invoker = false\)/,
    /alter view public\.location_routes_delivery set \(security_invoker = false\)/,
    /alter view public\.location_service_routes_delivery set \(security_invoker = false\)/,
    /revoke all privileges on table/,
    /grant select on table/,
  ].forEach((pattern) => requireText(remainingViews, pattern, `Remaining view security contract missing: ${pattern}`));
}

const checks = { lint, routes, sitemap, structuredData, migration };
if (mode === "all") Object.values(checks).forEach((check) => check());
else {
  const check = checks[mode];
  if (!check) throw new Error(`Unknown verification mode: ${mode}`);
  check();
}

console.log(`Publication control verification passed: ${mode}`);
