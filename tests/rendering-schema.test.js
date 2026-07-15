const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { renderPrimaryContent } = require("../api/lib/content-renderer");
const { buildGraph, primaryEntityFor, additionalEntitiesFor, PERSON_ID, ORGANISATION_ID } = require("../api/lib/schema");
const { injectSeo } = require("../api/content-page");

const frontend = path.join(__dirname, "..", "frontend");
const readTemplate = (name) => fs.readFileSync(path.join(frontend, name), "utf8");

function render(type, item, template, route, parentName, pageType = "WebPage") {
  const canonical = `https://www.xtradite-digital.co.uk/${route}/${item.slug}`;
  const config = { route, parentName, pageType };
  const title = `${item.title || item.headline || item.client} — Xtradite Digital`;
  const description = item.seo_description || item.summary || item.excerpt || item.card_summary || item.challenge || "";
  const body = renderPrimaryContent(type, item, readTemplate(template));
  return injectSeo(body, {
    type,
    item,
    config,
    canonical,
    title,
    description,
    robots: item.noindex ? "noindex, nofollow" : "index, follow"
  });
}

test("service raw HTML contains governed primary content and matching FAQ schema", () => {
  const item = {
    slug: "digital-strategy",
    title: "Digital Strategy",
    category: "Strategy",
    summary: "A governed summary.",
    description: "<p>Primary service content.</p>",
    who_its_for: ["Leadership teams"],
    what_included: ["Decision framework"],
    deliverables: ["Prioritised roadmap"],
    how_it_works: [{ title: "Diagnose", description: "Review the current evidence." }],
    faqs: [{ question: "How does this start?", answer: "With a scoped diagnosis." }],
    related_case_studies: [{
      slug: "approved-example",
      status: "published",
      public_approval_status: "approved",
      client: "Approved example",
      headline: "Approved evidence"
    }]
  };

  const html = render("service", item, "service-detail.html", "services", "Services");
  assert.match(html, /<h1[^>]*id="service-title"[^>]*>Digital Strategy<\/h1>/);
  assert.match(html, /Primary service content/);
  assert.match(html, /Diagnose/);
  assert.match(html, /How does this start\?/);
  assert.doesNotMatch(html, /6–12wk|30%\+|payback|capacity gain|leverage/i);

  const graph = JSON.parse(html.match(/id="xd-schema-graph"[^>]*>([\s\S]*?)<\/script>/)[1]);
  const faq = graph["@graph"].find((entity) => entity["@type"] === "FAQPage");
  assert.equal(faq.mainEntity[0].name, "How does this start?");
  assert.equal(faq.mainEntity[0].acceptedAnswer.text, "With a scoped diagnosis.");
  assert.ok(graph["@graph"].some((entity) => entity["@id"] === PERSON_ID));
  assert.ok(graph["@graph"].some((entity) => entity["@id"] === ORGANISATION_ID));
});

test("industry raw HTML includes principal content and truthful related-service ItemList", () => {
  const item = {
    slug: "retail",
    title: "Retail",
    summary: "Retail operating context.",
    challenge: "<p>Fragmented customer journeys.</p>",
    solution: "<p>Prioritised operating change.</p>",
    outcomes: "<p>Clearer ownership and measurement.</p>",
    related_services: [{ slug: "digital-strategy", title: "Digital Strategy" }]
  };
  const html = render("industry", item, "industry-detail.html", "industries", "Industries", "CollectionPage");
  assert.match(html, /<h1[^>]*id="industry-title"[^>]*>Retail<\/h1>/);
  assert.match(html, /Fragmented customer journeys/);
  assert.match(html, /aria-label="Breadcrumb"/);
  assert.doesNotMatch(html, /Ready to Accelerate Your Business/);

  const graph = JSON.parse(html.match(/id="xd-schema-graph"[^>]*>([\s\S]*?)<\/script>/)[1]);
  const list = graph["@graph"].find((entity) => entity["@type"] === "ItemList");
  assert.equal(list.itemListElement[0].item["@id"], "https://www.xtradite-digital.co.uk/services/digital-strategy#primary");
});

test("case-study raw HTML suppresses every primary metric unless independently approved", () => {
  const item = {
    slug: "governed-example",
    client: "Confidential client",
    headline: "Governed delivery example",
    industry: "Retail",
    challenge: "A qualitative challenge.",
    card_summary: "A qualitative summary.",
    metric: "+10% conversion rate",
    public_primary_metric_approved: false,
    public_approval_status: "approved",
    approach: [{ title: "Review", description: "Assess the available evidence." }],
    results_detail: "<p>+10% conversion rate</p>"
  };
  const html = render("case-study", item, "case-study-detail.html", "case-studies", "Case Studies");
  assert.match(html, /Governed delivery example/);
  assert.doesNotMatch(html, /\+10% conversion rate/);
  assert.match(html, /id="cs-primary-proof"[^>]*hidden/);
  assert.match(html, /id="cs-results-section"[^>]*hidden/);
});

test("insight raw HTML includes author, publication date and body before JavaScript", () => {
  const item = {
    slug: "operating-models",
    title: "Operating Models",
    excerpt: "A governed article summary.",
    content_text: "Primary article body.",
    first_published_at: "2026-07-01T09:00:00.000Z",
    updated_at: "2026-07-02T09:00:00.000Z",
    minutes_to_read: 4,
    tags: ["Operations"]
  };
  const html = render("insight", item, "insights-post.html", "insights", "Insights");
  assert.match(html, /<h1[^>]*id="post-title"[^>]*>Operating Models<\/h1>/);
  assert.match(html, /Primary article body/);
  assert.match(html, /1 July 2026/);
  assert.match(html, /Jared Collum/);

  const graph = JSON.parse(html.match(/id="xd-schema-graph"[^>]*>([\s\S]*?)<\/script>/)[1]);
  const article = graph["@graph"].find((entity) => entity["@type"] === "BlogPosting");
  assert.equal(article.author["@id"], PERSON_ID);
  assert.equal(article.publisher["@id"], ORGANISATION_ID);
});

test("structured graph has unique IDs and no unsupported review, rating or LocalBusiness claims", () => {
  const canonical = "https://www.xtradite-digital.co.uk/services/example";
  const item = {
    title: "Example",
    category: "Strategy",
    faqs: [{ question: "Question?", answer: "Answer." }],
    related_case_studies: []
  };
  const graph = buildGraph({
    canonical,
    title: "Example",
    description: "Description",
    primaryEntity: primaryEntityFor("service", item, canonical, "Description"),
    additionalEntities: additionalEntitiesFor("service", item, canonical),
    breadcrumbItems: [{ name: "Home", url: "https://www.xtradite-digital.co.uk/" }, { name: "Example", url: canonical }]
  });
  const ids = graph["@graph"].map((entity) => entity["@id"]).filter(Boolean);
  assert.equal(ids.length, new Set(ids).size);
  assert.doesNotMatch(JSON.stringify(graph), /LocalBusiness|AggregateRating|Review|award/i);
});

test("static page templates expose primary raw HTML and truthful page metadata inputs", () => {
  const matrix = [
    ["index.html", /<h1[\s>]/i],
    ["about.html", /<h1[\s>]/i],
    ["contact.html", /<h1[\s>]/i],
    ["legal/privacy.html", /<h1[\s>]/i],
    ["legal/terms.html", /<h1[\s>]/i]
  ];
  for (const [file, h1] of matrix) {
    const source = readTemplate(file);
    assert.match(source, /<title>[^<]+<\/title>/i, `${file}: title`);
    assert.match(source, /<meta\s+name=["']description["'][^>]+content=["'][^"']+/i, `${file}: description`);
    assert.match(source, h1, `${file}: h1`);
  }
});

test("location renderer remains server-side and never emits LocalBusiness", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "api", "location.js"), "utf8");
  assert.match(source, /<h1>/);
  assert.match(source, /"@type": "Place"/);
  assert.match(source, /"@type": "Service"/);
  assert.match(source, /area served rather than/i);
  assert.doesNotMatch(source, /LocalBusiness/);
});

test("analytics contract contains all governed events and requires statistics consent", () => {
  const source = fs.readFileSync(path.join(frontend, "assets", "js", "analytics-events.js"), "utf8");
  for (const event of [
    "consultation_cta_click",
    "contact_form_start",
    "contact_form_submit",
    "email_click",
    "phone_click",
    "service_view",
    "case_study_view",
    "insight_view",
    "faq_expand",
    "related_content_click",
    "location_service_click"
  ]) assert.match(source, new RegExp(event));
  assert.match(source, /Cookiebot\?\.consent\?\.statistics === true/);
  assert.match(source, /xtradite:form-submitted/);
});
