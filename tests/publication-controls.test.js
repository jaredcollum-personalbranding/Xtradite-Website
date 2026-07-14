const test = require("node:test");
const assert = require("node:assert/strict");

const {
  filterPublicRelationshipTargets,
  isEligibleLocation,
  isEligibleLocationService,
  isPublicBlogPost,
} = require("../api/lib/publication-eligibility");
const { PUBLIC_CONTENT_SELECTS, fetchPublishedBySlug } = require("../api/lib/supabase");
const { buildLocationEntries, normaliseSitemapRows } = require("../api/sitemap");
const contentPage = require("../api/content-page");
const { fetchLocationCatalogue } = require("../api/lib/location-catalogue");

const CLOCK = new Date("2026-07-14T12:00:00.000Z");
const completeLocation = {
  location_id: "location-1",
  name: "Brighton",
  slug: "brighton",
  latitude: 50.8225,
  longitude: -0.1372,
  local_intro: "A locally specific introduction for Brighton organisations.",
  seo_title: "Digital consultancy in Brighton",
  seo_description: "Practical digital consultancy for organisations operating in Brighton.",
  updated_at: "2026-07-14T10:00:00.000Z",
  county: "East Sussex",
  county_slug: "east-sussex",
  region: "South East",
  region_slug: "south-east",
  nation: "England",
  nation_slug: "england",
  status: "published",
  is_indexable: true,
};

function mockResponse() {
  const headers = new Map();
  return {
    statusCode: null,
    body: null,
    setHeader(name, value) { headers.set(name, value); return this; },
    getHeader(name) { return headers.get(name); },
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; return this; },
    headers,
  };
}

test("publication clock includes past and current posts but excludes future posts", () => {
  assert.equal(isPublicBlogPost({ status: "published", first_published_at: "2026-07-14T11:59:59.999Z" }, { now: CLOCK }), true);
  assert.equal(isPublicBlogPost({ status: "published", first_published_at: CLOCK.toISOString() }, { now: CLOCK }), true);
  assert.equal(isPublicBlogPost({ status: "published", first_published_at: "2026-07-14T12:00:00.001Z" }, { now: CLOCK }), false);
  assert.equal(isPublicBlogPost({ status: "draft", first_published_at: "2026-07-14T11:00:00.000Z" }, { now: CLOCK }), false);
});

test("draft and missing relationship targets are excluded", () => {
  const targets = filterPublicRelationshipTargets([
    { slug: "published-case", status: "published" },
    { slug: "draft-case", status: "draft" },
    null,
    { status: "published" },
  ]);
  assert.deepEqual(targets, [{ slug: "published-case", status: "published" }]);
});

test("location eligibility requires copy, metadata, route components and explicit approval", () => {
  assert.equal(isEligibleLocation(completeLocation), true);
  assert.equal(isEligibleLocation({ ...completeLocation, local_intro: "" }), false);
  assert.equal(isEligibleLocation({ ...completeLocation, seo_title: null }), false);
  assert.equal(isEligibleLocation({ ...completeLocation, seo_description: "   " }), false);
  assert.equal(isEligibleLocation({ ...completeLocation, is_indexable: false }), false);
  assert.equal(isEligibleLocation({ ...completeLocation, county_slug: "East Sussex" }), false);
});

test("location-service eligibility rejects missing metadata and missing targets", () => {
  const eligibleLocationIds = new Set([completeLocation.location_id]);
  const relationship = {
    location_id: completeLocation.location_id,
    service_slug: "digital-strategy",
    relationship_status: "published",
    service_status: "published",
    local_intro: "Digital strategy support tailored to organisations in Brighton.",
    seo_title: "Digital strategy consultancy in Brighton",
    seo_description: "Digital strategy diagnosis and delivery support for Brighton organisations.",
    is_indexable: true,
  };

  assert.equal(isEligibleLocationService(relationship, { eligibleLocationIds }), true);
  assert.equal(isEligibleLocationService({ ...relationship, seo_description: null }, { eligibleLocationIds }), false);
  assert.equal(isEligibleLocationService(relationship, { eligibleLocationIds: new Set() }), false);
  assert.equal(isEligibleLocationService({ ...relationship, relationship_status: "draft" }, { eligibleLocationIds }), false);
});

test("sitemap normalisation excludes invalid or mismatched canonical records", () => {
  const rows = normaliseSitemapRows([
    { slug: "valid-post", canonical_path: "/insights/valid-post", updated_at: "2026-07-14T10:00:00Z" },
    { slug: "future-post", canonical_path: null, updated_at: "2026-07-14T10:00:00Z" },
    { slug: "wrong-path", canonical_path: "/blog/wrong-path", updated_at: "2026-07-14T10:00:00Z" },
    { slug: "Bad Slug", canonical_path: "/insights/Bad Slug", updated_at: "2026-07-14T10:00:00Z" },
  ], { route: "insights" });

  assert.deepEqual(rows, [{ path: "/insights/valid-post", lastmod: "2026-07-14" }]);
});

test("location sitemap emits only catalogue records already deemed eligible", () => {
  const entries = buildLocationEntries({
    locations: [{
      id: completeLocation.location_id,
      slug: completeLocation.slug,
      nationSlug: completeLocation.nation_slug,
      regionSlug: completeLocation.region_slug,
      countySlug: completeLocation.county_slug,
      updatedAt: completeLocation.updated_at,
    }],
    servicesByLocation: new Map([[completeLocation.location_id, [{ slug: "digital-strategy", updatedAt: "2026-07-14T11:00:00Z" }]]]),
  });

  assert.ok(entries.some((entry) => entry.path.endsWith("/brighton")));
  assert.ok(entries.some((entry) => entry.path.endsWith("/brighton/services/digital-strategy")));
  assert.deepEqual(buildLocationEntries({ locations: [], servicesByLocation: new Map() }), []);
});

test("server insight query enforces status and a fixed effective publication date", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  global.fetch = async (url) => {
    requestedUrl = String(url);
    return { ok: true, json: async () => [] };
  };

  try {
    await fetchPublishedBySlug("blog_posts_delivery", "future-post", undefined, { now: CLOCK });
    const url = new URL(requestedUrl);
    assert.equal(url.searchParams.get("status"), "eq.published");
    assert.equal(url.searchParams.get("first_published_at"), `lte.${CLOCK.toISOString()}`);
    assert.equal(url.searchParams.get("limit"), "1");
  } finally {
    global.fetch = originalFetch;
  }
});

test("ineligible direct routes return a safe noindex 404 even with a preview query parameter", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => [] });
  const response = mockResponse();

  try {
    await contentPage({ query: { type: "insight", slug: "future-post", preview: "1" } }, response);
    assert.equal(response.statusCode, 404);
    assert.equal(response.body, "Not found");
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
    assert.doesNotMatch(String(response.body), /application\/ld\+json/i);
  } finally {
    global.fetch = originalFetch;
  }
});

test("location catalogue excludes incomplete rows before route or schema generation", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    const path = new URL(String(url)).pathname;
    if (path.endsWith("/location_routes_delivery")) {
      return { ok: true, json: async () => [{ ...completeLocation, local_intro: "" }] };
    }
    if (path.endsWith("/location_service_routes_delivery")) return { ok: true, json: async () => [] };
    if (path.endsWith("/services_delivery")) return { ok: true, json: async () => [] };
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const catalogue = await fetchLocationCatalogue();
    assert.deepEqual(catalogue.locations, []);
    assert.deepEqual(catalogue.services, []);
    assert.equal(catalogue.servicesByLocation.size, 0);
  } finally {
    global.fetch = originalFetch;
  }
});

test("public server selections omit private review and ownership fields", () => {
  const fields = Object.values(PUBLIC_CONTENT_SELECTS).join(",");
  assert.doesNotMatch(fields, /editorial_owner/);
  assert.doesNotMatch(fields, /last_reviewed_at/);
  assert.doesNotMatch(fields, /select\(\*\)/);
});
