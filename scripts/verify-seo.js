const fs = require("fs");
const path = require("path");
const contentHandler = require("../api/content");
const sitemapHandler = require("../api/sitemap");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function invoke(handler, query = {}) {
  return new Promise((resolve, reject) => {
    const headers = {};
    const response = {
      statusCode: 200,
      setHeader(name, value) { headers[name.toLowerCase()] = value; },
      status(code) { this.statusCode = code; return this; },
      send(body) { resolve({ status: this.statusCode, headers, body: String(body) }); },
    };
    Promise.resolve(handler({ query }, response)).catch(reject);
  });
}

function schemaFrom(html) {
  const match = html.match(/<script id="seo-jsonld" type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert(match, "Missing canonical JSON-LD graph");
  return JSON.parse(match[1]);
}

function schemaTypes(schema) {
  return new Set((schema["@graph"] || []).flatMap((node) => Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]]));
}

async function verifyDynamic(type, slug, expectedPath, expectedType) {
  const result = await invoke(contentHandler, { type, slug });
  assert(result.status === 200, `${type}/${slug} returned ${result.status}`);
  assert(result.body.includes(`<link rel="canonical" href="https://www.xtradite-digital.co.uk${expectedPath}">`), `${type}/${slug} canonical is incorrect`);
  assert(result.body.includes('name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"'), `${type}/${slug} index controls are missing`);
  assert(!result.body.includes(`${type}-detail-root" hidden`) && !result.body.includes('id="post-root" hidden'), `${type}/${slug} has no server-rendered visible content`);
  assert((result.body.match(/id="seo-jsonld"/g) || []).length === 1, `${type}/${slug} has duplicate canonical JSON-LD`);
  const types = schemaTypes(schemaFrom(result.body));
  for (const required of ["Organization", "WebSite", "BreadcrumbList", expectedType]) {
    assert(types.has(required), `${type}/${slug} is missing ${required} schema`);
  }
  return { type, slug, status: result.status, schema: [...types] };
}

function verifyStatic() {
  const files = ["index.html", "about.html", "services.html", "industries.html", "case-studies.html", "insights.html", "contact.html", "legal/privacy.html", "legal/cookies.html", "legal/terms.html"];
  for (const relative of files) {
    const html = fs.readFileSync(path.join(__dirname, "..", "frontend", relative), "utf8");
    assert((html.match(/<title>/g) || []).length === 1, `${relative} does not have exactly one title`);
    assert((html.match(/rel="canonical"/g) || []).length === 1, `${relative} does not have exactly one canonical`);
    assert((html.match(/id="seo-jsonld"/g) || []).length === 1, `${relative} does not have exactly one JSON-LD graph`);
    const types = schemaTypes(schemaFrom(html));
    for (const required of ["Organization", "WebSite", "BreadcrumbList"]) assert(types.has(required), `${relative} is missing ${required}`);
  }
  return files.length;
}

async function main() {
  const dynamic = await Promise.all([
    verifyDynamic("service", "ai-automation", "/services/ai-automation", "Service"),
    verifyDynamic("industry", "retail", "/industries/retail", "ItemList"),
    verifyDynamic("case-study", "dtc-fragrance-beauty-retailer", "/case-studies/dtc-fragrance-beauty-retailer", "Article"),
    verifyDynamic("insight", "the-hidden-cost-of-manual-reconciliation", "/insights/the-hidden-cost-of-manual-reconciliation", "BlogPosting"),
  ]);
  const missing = await invoke(contentHandler, { type: "insight", slug: "not-a-real-article" });
  assert(missing.status === 404 && missing.headers["x-robots-tag"] === "noindex, nofollow", "Missing content is not a noindex 404");

  const sitemap = await invoke(sitemapHandler);
  assert(sitemap.status === 200, `Sitemap returned ${sitemap.status}`);
  assert(!/[?&]slug=/.test(sitemap.body), "Sitemap still contains query-string detail URLs");
  assert(sitemap.body.includes("/industries/retail</loc>"), "Sitemap is missing pretty industry URLs");
  assert(sitemap.body.includes("/case-studies/dtc-fragrance-beauty-retailer</loc>"), "Sitemap is missing pretty case-study URLs");
  assert(sitemap.body.includes("/insights/the-hidden-cost-of-manual-reconciliation</loc>"), "Sitemap is missing pretty insight URLs");
  assert(!sitemap.body.includes("/insights/ai-data-privacy-small-business-policies</loc>"), "A future-dated article leaked into the sitemap");

  console.log(JSON.stringify({
    staticPages: verifyStatic(),
    dynamic,
    missingStatus: missing.status,
    sitemapUrls: (sitemap.body.match(/<url>/g) || []).length,
  }));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
