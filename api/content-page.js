const fs = require("node:fs");
const path = require("node:path");
const { fetchPublishedBySlug } = require("./lib/supabase");
const { SITE_URL, buildGraph, primaryEntityFor } = require("./lib/schema");

const PAGE_TYPES = {
  industry: {
    table: "industries",
    template: "industry-detail.html",
    route: "industries",
    parentName: "Industries",
    title: (item) => item.seo_title || `${item.title} — Xtradite Digital`,
    description: (item) => item.seo_description || item.summary || `How Xtradite Digital helps ${item.title} businesses.`,
    pageType: "CollectionPage"
  },
  "case-study": {
    table: "case_studies",
    template: "case-study-detail.html",
    route: "case-studies",
    parentName: "Case Studies",
    title: (item) => item.seo_title || `${item.client} — Xtradite Digital Case Study`,
    description: (item) => item.seo_description || item.card_summary || item.headline || item.challenge || `How Xtradite Digital helped ${item.client}.`,
    pageType: "WebPage"
  },
  insight: {
    table: "blog_posts",
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

function injectSeo(html, { type, item, config, canonical, title, description }) {
  const primary = primaryEntityFor(type, item, canonical, description);
  const graph = buildGraph({
    canonical,
    title,
    description,
    pageType: config.pageType,
    primaryEntity: primary,
    breadcrumbItems: [
      { name: "Home", url: `${SITE_URL}/` },
      { name: config.parentName, url: `${SITE_URL}/${config.route}` },
      { name: item.title || item.headline || item.client, url: canonical }
    ]
  });

  let output = html;
  output = replaceOrInsert(output, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  output = replaceOrInsert(output, /<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeHtml(description)}">`);
  output = replaceOrInsert(output, /<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${canonical}">`);
  output = replaceOrInsert(output, /<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${escapeHtml(title)}">`);
  output = replaceOrInsert(output, /<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${escapeHtml(description)}">`);
  output = replaceOrInsert(output, /<meta\s+property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${canonical}">`);
  output = replaceOrInsert(output, /<meta\s+name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${escapeHtml(title)}">`);
  output = replaceOrInsert(output, /<meta\s+name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${escapeHtml(description)}">`);
  output = output.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, "");
  output = output.replace(/<\/head>/i, `<script>window.__CONTENT_SLUG__=${JSON.stringify(item.slug)};</script>\n<script id="xd-schema-graph" data-schema="server" type="application/ld+json">${JSON.stringify(graph).replace(/</g, "\\u003c")}</script>\n</head>`);
  return output;
}

module.exports = async (req, res) => {
  const type = String(req.query.type || "");
  const slug = String(req.query.slug || "").toLowerCase();
  const config = PAGE_TYPES[type];

  if (!config || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    res.status(404).send("Not found");
    return;
  }

  try {
    const item = await fetchPublishedBySlug(config.table, slug);
    if (!item) {
      res.status(404).send("Not found");
      return;
    }

    const canonical = `${SITE_URL}/${config.route}/${slug}`;
    const title = config.title(item);
    const description = config.description(item);
    const template = fs.readFileSync(path.join(process.cwd(), "frontend", config.template), "utf8");
    const html = injectSeo(template, { type, item, config, canonical, title, description });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=900, stale-while-revalidate=86400");
    res.status(200).send(html);
  } catch (error) {
    console.error("content-page render failed", { type, slug, message: error.message });
    res.status(500).send("Unable to load this page");
  }
};
