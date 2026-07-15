const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { renderPrimaryContent } = require("../api/lib/content-renderer");
const { enhanceContentDetail } = require("../api/lib/content-detail-enhancer");

const frontend = path.join(__dirname, "..", "frontend");
const readTemplate = (name) => fs.readFileSync(path.join(frontend, name), "utf8");

function render(type, item, template) {
  return enhanceContentDetail(type, item, renderPrimaryContent(type, item, readTemplate(template)));
}

test("industry detail uses the shared designed shell and reveals eligible services", () => {
  const html = render("industry", {
    slug: "retail",
    title: "Retail",
    summary: "Coordinate stores, ecommerce and marketplaces.",
    challenge: "Inventory and customer promises are fragmented.",
    solution: "Clarify ownership, evidence and practical priorities.",
    outcomes: "A more coherent operating direction.",
    related_services: [{ slug: "operational-excellence", title: "Operational Excellence" }]
  }, "industry-detail.html");

  assert.match(html, /content-detail\.css/);
  assert.match(html, /class="industry-detail"/);
  assert.match(html, /class="industry-hero"/);
  assert.match(html, /id="industry-context"/);
  assert.match(html, /Operating context/);
  assert.match(html, /How Xtradite approaches it/);
  assert.match(html, /Intended direction/);
  assert.match(html, /id="industry-related-services-section"[^>]*data-server-rendered="true"/);
  assert.match(html, /View Operational Excellence/);
  assert.match(html, /href="\/industries\/retail"/);
  assert.doesNotMatch(html, /industry-detail\?slug=/);
  assert.doesNotMatch(html, /Ready to Accelerate Your Business/);
});

test("insight detail uses the shared article design and governed author treatment", () => {
  const html = render("insight", {
    slug: "why-your-website-launch-didnt-fix-the-real-problem",
    title: "Why your website launch didn't fix the real problem",
    excerpt: "A website launch cannot resolve an operating problem on its own.",
    first_published_at: "2026-07-01T00:00:00.000Z",
    minutes_to_read: 7,
    tags: ["Digital operations"],
    content_text: "<h2>Start with the operating model</h2><p>Technology only exposes the underlying constraints.</p>",
    cover_image_url: "https://example.com/cover.jpg"
  }, "insights-post.html");

  assert.match(html, /content-detail\.css/);
  assert.match(html, /class="insight-detail"/);
  assert.match(html, /class="insight-hero"/);
  assert.match(html, /class="insight-standfirst"/);
  assert.match(html, /class="richtext insight-body"/);
  assert.match(html, /About the author/);
  assert.match(html, /Jared Collum writes about ecommerce/);
  assert.match(html, /alt="Why your website launch didn't fix the real problem"/);
  assert.match(html, /href="\/industries\/retail"/);
  assert.doesNotMatch(html, /industry-detail\?slug=/);
  assert.doesNotMatch(html, /Ready to explore this further\?/);
});

test("detail stylesheet contains responsive industry and insight layouts", () => {
  const css = fs.readFileSync(path.join(frontend, "assets", "css", "content-detail.css"), "utf8");
  assert.match(css, /\.industry-hero/);
  assert.match(css, /\.industry-story/);
  assert.match(css, /\.insight-hero/);
  assert.match(css, /\.insight-body/);
  assert.match(css, /@media \(max-width: 900px\)/);
});
