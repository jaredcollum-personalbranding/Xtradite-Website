const test = require("node:test");
const assert = require("node:assert/strict");
const { validateHtml } = require("../scripts/seo-release-quality");
const { canonicalUrl, eligibleChange } = require("../api/indexnow");

test("a clean canonical HTML fixture passes the release-quality validator", () => {
  const html = `<!doctype html><html><head>
    <title>Example — Xtradite Digital</title>
    <meta name="description" content="Example description">
    <link rel="canonical" href="https://www.xtradite-digital.co.uk/example">
    <meta property="og:url" content="https://www.xtradite-digital.co.uk/example">
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","@id":"https://www.xtradite-digital.co.uk/example#webpage"}</script>
  </head><body><h1>Example</h1></body></html>`;
  assert.deepEqual(validateHtml(html, "example.html"), []);
});

test("malformed canonical, encoding and structured data produce readable failures", () => {
  const html = `<!doctype html><html><head>
    <title>Broken â€” page</title>
    <meta name="description" content="Broken description">
    <link rel="canonical" href="http://xtradite-digital.co.uk/example?slug=old">
    <meta property="og:url" content="https://www.xtradite-digital.co.uk/different">
    <script type="application/ld+json">{not-json}</script>
  </head><body><h1>Broken</h1><a href="/case-study-detail?slug=old">Old route</a></body></html>`;
  const failures = validateHtml(html, "malformed.html");
  const rules = failures.map((failure) => failure.rule);
  assert.ok(rules.includes("canonical"));
  assert.ok(rules.includes("og-url"));
  assert.ok(rules.includes("json-ld"));
  assert.ok(rules.includes("encoding"));
  assert.ok(rules.includes("hostname"));
  assert.ok(rules.includes("legacy-route"));
});

test("IndexNow accepts only material canonical production changes", () => {
  assert.equal(canonicalUrl("https://www.xtradite-digital.co.uk/insights/example"), "https://www.xtradite-digital.co.uk/insights/example");
  assert.equal(canonicalUrl("https://xtradite-digital.co.uk/insights/example"), null);
  assert.equal(canonicalUrl("https://www.xtradite-digital.co.uk/insights/example?preview=1"), null);

  assert.equal(eligibleChange({
    url: "https://www.xtradite-digital.co.uk/insights/example",
    changeType: "updated",
    status: "published",
    revision: "two",
    previousRevision: "one"
  }), "https://www.xtradite-digital.co.uk/insights/example");

  assert.equal(eligibleChange({
    url: "https://www.xtradite-digital.co.uk/insights/example",
    changeType: "updated",
    status: "published",
    revision: "same",
    previousRevision: "same"
  }), null);
  assert.equal(eligibleChange({
    url: "https://www.xtradite-digital.co.uk/insights/example",
    changeType: "updated",
    status: "draft"
  }), null);
});
