const fs = require("node:fs");
const path = require("node:path");
const { fetchPublishedBySlug, publicSelectFor } = require("./lib/supabase");
const { SITE_URL, buildGraph, primaryEntityFor, additionalEntitiesFor } = require("./lib/schema");
const { renderPrimaryContent } = require("./lib/content-renderer");

const SOCIAL_IMAGE = `${SITE_URL}/assets/brand/xtradite-social-share.svg`;
const SOCIAL_IMAGE_ALT = "Xtradite Digital — practical consultancy for measurable growth";
const FAVICON = `${SITE_URL}/assets/brand/favicon.svg`;

const PAGE_TYPES = {
  service: {
    table: "services_delivery",
    template: "service-detail.html",
    route: "services",
    parentName: "Services",
    title: (item) => `${item.seo_title || item.title} — Xtradite Digital`,
    description: (item) => item.seo_description || item.summary || item.hero_subheading || `Explore Xtradite Digital's ${item.title} service.`,
    pageType: "WebPage"
  },
  industry: {
    table: "industries_delivery",
    template: "industry-detail.html",
    route: "industries",
    parentName: "Industries",
    title: (item) => item.seo_title || `${item.title} — Xtradite Digital`,
    description: (item) => item.seo_description || item.summary || `How Xtradite Digital helps ${item.title} businesses.`,
    pageType: "CollectionPage"
  },
  "case-study": {
    table: "case_studies_delivery",
    template: "case-study-detail.html",
    route: "case-studies",
    parentName: "Case Studies",
    title: (item) => item.seo_title || `${item.client} — Xtradite Digital Case Study`,
    description: (item) => item.seo_description || item.card_summary || item.headline || item.challenge || `How Xtradite Digital worked with ${item.client}.`,
    pageType: "WebPage"
  },
  insight: {
    table: "blog_posts_delivery",
    template: "insights-post.html",
    route: "insights",
    parentName: "Insights",
    title: (item) => `${item.seo_title || item.title} — Xtradite Digital Insights`,
    description: (item) => item.seo_description || item.excerpt || "",
    pageType: "WebPage"
  }
};

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function replaceOrInsert(html, pattern, replacement) {
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace(/<\/head>/i, `${replacement}\n</head>`);
}

function canonicalFor(item, config, slug) {
  const expectedPath = `/${config.route}/${slug}`;
  const candidate = typeof item.canonical_path === "string" ? item.canonical_path.trim() : "";
  const pathValue = candidate.startsWith("/") ? candidate : expectedPath;
  return new URL(pathValue, SITE_URL).href;
}

function robotsFor(item) {
  return item.noindex === true
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
}

function injectSeo(html, { type, item, config, canonical, title, description, robots }) {
  const primary = primaryEntityFor(type, item, canonical, description);
  const graph = buildGraph({
    canonical,
    title,
    description,
    pageType: config.pageType,
    primaryEntity: primary,
    additionalEntities: additionalEntitiesFor(type, item, canonical),
    breadcrumbItems: [
      { name: "Home", url: `${SITE_URL}/` },
      { name: config.parentName, url: `${SITE_URL}/${config.route}` },
      { name: item.title || item.headline || item.client, url: canonical }
    ]
  });

  const socialImage = type === "insight" && item.cover_image_url ? item.cover_image_url : SOCIAL_IMAGE;
  let output = html;
  output = replaceOrInsert(output, /<base\s+href=["'][^"']*["'][^>]*>/i, '<base href="/">');
  output = replaceOrInsert(output, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  output = replaceOrInsert(output, /<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeHtml(description)}">`);
  output = replaceOrInsert(output, /<meta\s+name=["']robots["'][^>]*>/i, `<meta name="robots" content="${robots}">`);
  output = replaceOrInsert(output, /<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${canonical}">`);
  output = replaceOrInsert(output, /<link\s+rel=["']icon["'][^>]*type=["']image\/svg\+xml["'][^>]*>/i, `<link rel="icon" type="image/svg+xml" href="${FAVICON}">`);
  output = replaceOrInsert(output, /<meta\s+name=["']theme-color["'][^>]*>/i, '<meta name="theme-color" content="#0D0D0D">');
  output = replaceOrInsert(output, /<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${escapeHtml(title)}">`);
  output = replaceOrInsert(output, /<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${escapeHtml(description)}">`);
  output = replaceOrInsert(output, /<meta\s+property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${canonical}">`);
  output = replaceOrInsert(output, /<meta\s+property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${escapeHtml(socialImage)}">`);
  output = replaceOrInsert(output, /<meta\s+property=["']og:image:width["'][^>]*>/i, '<meta property="og:image:width" content="1200">');
  output = replaceOrInsert(output, /<meta\s+property=["']og:image:height["'][^>]*>/i, '<meta property="og:image:height" content="630">');
  output = replaceOrInsert(output, /<meta\s+property=["']og:image:alt["'][^>]*>/i, `<meta property="og:image:alt" content="${SOCIAL_IMAGE_ALT}">`);
  output = replaceOrInsert(output, /<meta\s+name=["']twitter:card["'][^>]*>/i, '<meta name="twitter:card" content="summary_large_image">');
  output = replaceOrInsert(output, /<meta\s+name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${escapeHtml(title)}">`);
  output = replaceOrInsert(output, /<meta\s+name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${escapeHtml(description)}">`);
  output = replaceOrInsert(output, /<meta\s+name=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${escapeHtml(socialImage)}">`);
  output = replaceOrInsert(output, /<meta\s+name=["']twitter:image:alt["'][^>]*>/i, `<meta name="twitter:image:alt" content="${SOCIAL_IMAGE_ALT}">`);
  output = output.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, "");
  output = output.replace(/<\/head>/i, `<script>window.__CONTENT_SLUG__=${JSON.stringify(item.slug)};window.__SERVER_RENDERED__=true;</script>\n<script id="xd-schema-graph" data-schema="server" type="application/ld+json">${JSON.stringify(graph).replace(/</g, "\\u003c")}</script>\n</head>`);
  return output;
}

function sendNotFound(res) {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
  res.status(404).send("Not found");
}

module.exports = async (req, res) => {
  const type = String(req.query.type || "");
  const slug = String(req.query.slug || "").toLowerCase();
  const config = PAGE_TYPES[type];

  if (!config || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    sendNotFound(res);
    return;
  }

  try {
    const item = await fetchPublishedBySlug(config.table, slug, publicSelectFor(config.table));
    if (!item || (type === "case-study" && item.public_approval_status !== "approved")) {
      sendNotFound(res);
      return;
    }

    const canonical = canonicalFor(item, config, slug);
    const title = config.title(item);
    const description = config.description(item);
    const robots = robotsFor(item);
    const template = fs.readFileSync(path.join(process.cwd(), "frontend", config.template), "utf8");
    const primaryHtml = renderPrimaryContent(type, item, template);
    const html = injectSeo(primaryHtml, { type, item, config, canonical, title, description, robots });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("X-Robots-Tag", robots);
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=900, stale-while-revalidate=86400");
    res.status(200).send(html);
  } catch (error) {
    console.error("content-page render failed", { type, slug, message: error.message });
    res.status(500).send("Unable to load this page");
  }
};

module.exports.PAGE_TYPES = PAGE_TYPES;
module.exports.canonicalFor = canonicalFor;
module.exports.robotsFor = robotsFor;
module.exports.injectSeo = injectSeo;
module.exports.sendNotFound = sendNotFound;
