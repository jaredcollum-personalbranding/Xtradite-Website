const fs = require("fs");
const path = require("path");
const { fetchAll } = require("./lib/location-catalogue");
const { SITE_URL, escapeHtml, stripHtml, graph, metaTags } = require("./lib/seo");

const TYPES = {
  service: { view: "services_delivery", template: "service-detail.html", base: "/services", parent: "Services", parentPath: "/services" },
  industry: { view: "industries_delivery", template: "industry-detail.html", base: "/industries", parent: "Industries", parentPath: "/industries" },
  "case-study": { view: "case_studies_delivery", template: "case-study-detail.html", base: "/case-studies", parent: "Case Studies", parentPath: "/case-studies" },
  insight: { view: "blog_posts_delivery", template: "insights-post.html", base: "/insights", parent: "Insights", parentPath: "/insights" },
};

function safeUrl(value) {
  const url = String(value || "");
  return /^(https?:\/\/|\/)/i.test(url) ? url : "";
}

function nodeText(node) {
  if (node?.type === "TEXT") return node.textData?.text || "";
  return (node?.nodes || []).map(nodeText).join("");
}

function inlineNodes(nodes) {
  return (nodes || []).map((node) => {
    if (node?.type !== "TEXT") return escapeHtml(nodeText(node));
    let value = escapeHtml(node.textData?.text || "");
    const decorations = node.textData?.decorations || [];
    if (decorations.some((item) => item.type === "BOLD")) value = `<strong>${value}</strong>`;
    if (decorations.some((item) => item.type === "ITALIC")) value = `<em>${value}</em>`;
    const link = decorations.find((item) => item.type === "LINK")?.linkData?.link;
    const href = safeUrl(link?.url);
    if (href) value = `<a href="${escapeHtml(href)}"${link?.target === "BLANK" ? ' target="_blank" rel="noopener noreferrer"' : ""}>${value}</a>`;
    return value;
  }).join("");
}

function renderRicosNode(node) {
  const children = node?.nodes || [];
  if (node?.type === "PARAGRAPH") return `<p>${inlineNodes(children)}</p>`;
  if (node?.type === "HEADING") {
    const level = Math.min(4, Math.max(2, Number(node.headingData?.level) || 2));
    const id = String(node.id || "").replace(/[^a-z0-9-]/gi, "");
    return `<h${level}${id ? ` id="${escapeHtml(id)}"` : ""}>${inlineNodes(children)}</h${level}>`;
  }
  if (node?.type === "BULLETED_LIST" || node?.type === "ORDERED_LIST") {
    const tag = node.type === "ORDERED_LIST" ? "ol" : "ul";
    return `<${tag}>${children.map(renderRicosNode).join("")}</${tag}>`;
  }
  if (node?.type === "LIST_ITEM") return `<li>${children.map((child) => child.type === "PARAGRAPH" ? inlineNodes(child.nodes) : renderRicosNode(child)).join("")}</li>`;
  if (node?.type === "BLOCKQUOTE") return `<blockquote>${children.map(renderRicosNode).join("")}</blockquote>`;
  return children.map(renderRicosNode).join("");
}

function renderRichContent(item) {
  const nodes = item.rich_content?.nodes || item.richContent?.nodes;
  if (Array.isArray(nodes) && nodes.length) return nodes.map(renderRicosNode).join("\n");
  const value = item.content_text || item.contentText || "";
  return String(value).split(/\n\s*\n/).map((paragraph) => `<p>${escapeHtml(paragraph.trim()).replace(/\n/g, "<br>")}</p>`).join("\n");
}

function richParagraphs(value) {
  const text = stripHtml(value);
  return text ? text.split(/\n\s*\n/).map((item) => `<p>${escapeHtml(item)}</p>`).join("") : "";
}

function list(items) {
  return Array.isArray(items) && items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(typeof item === "string" ? item : item.content || item.title || "")}</li>`).join("")}</ul>` : "";
}

function replaceEmpty(html, id, content) {
  const pattern = new RegExp(`(<([a-z][a-z0-9]*)\\b[^>]*\\bid="${id}"[^>]*>)(\\s*)(<\\/\\2>)`, "i");
  return html.replace(pattern, `$1${content}$4`);
}

function reveal(html, id) {
  const pattern = new RegExp(`(<[^>]+\\bid="${id}"[^>]*?)\\s+hidden(?=[\\s>])`, "i");
  return html.replace(pattern, "$1");
}

function removeLegacySeo(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/gi, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<meta\s+(?:name=["'](?:description|robots|twitter:[^"']+)["']|property=["'](?:og:|article:)[^"']*["'])[^>]*>\s*/gi, "")
    .replace(/<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>\s*/gi, "");
}

function injectSeo(html, seo) {
  return removeLegacySeo(html).replace("</head>", `${seo}\n</head>`);
}

function shared(item, config, type) {
  const route = `${config.base}/${item.slug}`;
  const baseTitle = item.seo_title || item.seoTitle || item.title || item.headline || item.client;
  const title = /xtradite digital/i.test(baseTitle) ? baseTitle : `${baseTitle} — Xtradite Digital`;
  const description = stripHtml(item.seo_description || item.seoDescription || item.excerpt || item.summary || item.card_summary || item.cardSummary || item.headline || item.challenge).slice(0, 300);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: config.parent, path: config.parentPath },
    { name: item.title || item.headline || item.client, path: route },
  ];
  return { route, title, description, crumbs, type };
}

function renderService(html, item, config) {
  const common = shared(item, config, "service");
  const faqs = item.faqs || [];
  const service = {
    "@type": "Service",
    "@id": `${SITE_URL}${common.route}#service`,
    name: item.title,
    description: common.description,
    serviceType: item.category || item.title,
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: { "@type": "Country", name: "United Kingdom" },
    url: `${SITE_URL}${common.route}`,
    audience: (item.who_its_for || []).map((name) => ({ "@type": "Audience", name })),
  };
  const entities = [service];
  if (faqs.length) entities.push({
    "@type": "FAQPage",
    "@id": `${SITE_URL}${common.route}#faq`,
    mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: stripHtml(faq.answer) } })),
  });
  const schema = graph({ path: common.route, title: common.title, description: common.description, breadcrumbs: common.crumbs, primaryEntity: entities, modifiedAt: item.updated_at });
  html = injectSeo(html, metaTags({ ...common, path: common.route, schema, type: "website" }));
  html = reveal(html, "service-detail-root");
  html = replaceEmpty(html, "breadcrumb-current", escapeHtml(item.title));
  html = replaceEmpty(html, "service-eyebrow", escapeHtml(item.category || "Service"));
  html = replaceEmpty(html, "service-title", escapeHtml(item.title));
  html = replaceEmpty(html, "service-subheading", escapeHtml(item.hero_subheading || item.summary || ""));
  html = replaceEmpty(html, "service-description", richParagraphs(item.description || item.summary));
  html = replaceEmpty(html, "service-who-its-for", list(item.who_its_for));
  html = replaceEmpty(html, "service-what-included", list(item.what_included));
  html = replaceEmpty(html, "service-how-it-works", `<ol>${(item.how_it_works || []).map((step) => `<li><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.description)}</p></li>`).join("")}</ol>`);
  html = replaceEmpty(html, "service-deliverables", list(item.deliverables));
  html = replaceEmpty(html, "service-faq", faqs.map((faq) => `<details class="faq-item"><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(stripHtml(faq.answer))}</p></details>`).join(""));
  return html;
}

function renderIndustry(html, item, config) {
  const common = shared(item, config, "industry");
  const related = item.related_services || [];
  const entity = {
    "@type": "ItemList",
    "@id": `${SITE_URL}${common.route}#services`,
    name: `Services for ${item.title}`,
    itemListElement: related.map((service, index) => ({ "@type": "ListItem", position: index + 1, name: service.title, url: `${SITE_URL}/services/${service.slug}` })),
  };
  const schema = graph({ path: common.route, title: common.title, description: common.description, type: "CollectionPage", breadcrumbs: common.crumbs, primaryEntity: entity, modifiedAt: item.updated_at });
  html = injectSeo(html, metaTags({ ...common, path: common.route, schema, type: "website" }));
  html = reveal(html, "industry-detail-root");
  html = replaceEmpty(html, "breadcrumb-current", escapeHtml(item.title));
  html = replaceEmpty(html, "industry-title", escapeHtml(item.title));
  html = replaceEmpty(html, "industry-summary", escapeHtml(item.summary || ""));
  html = replaceEmpty(html, "industry-challenge", richParagraphs(item.challenge));
  html = replaceEmpty(html, "industry-solution", richParagraphs(item.solution));
  html = replaceEmpty(html, "industry-outcomes", richParagraphs(item.outcomes));
  return html;
}

function mediaFor(item, role) {
  return (item.media || []).filter((asset) => asset.role === role && (asset.publicUrl || asset.url)).sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || Number(a.sortOrder) - Number(b.sortOrder))[0];
}

function renderCaseStudy(html, item, config) {
  const common = shared(item, config, "case-study");
  const image = mediaFor(item, "og")?.url || mediaFor(item, "og")?.publicUrl || mediaFor(item, "hero")?.url || mediaFor(item, "hero")?.publicUrl;
  const entity = {
    "@type": "Article",
    "@id": `${SITE_URL}${common.route}#article`,
    headline: item.headline || item.client,
    description: common.description,
    image: image || undefined,
    datePublished: item.published_at || undefined,
    dateModified: item.updated_at,
    author: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: { "@id": `${SITE_URL}${common.route}#webpage` },
    about: item.industry ? { "@type": "Thing", name: item.industry } : undefined,
  };
  const schema = graph({ path: common.route, title: common.title, description: common.description, breadcrumbs: common.crumbs, primaryEntity: entity, image, publishedAt: item.published_at, modifiedAt: item.updated_at });
  html = injectSeo(html, metaTags({ ...common, path: common.route, schema, type: "article", image, publishedAt: item.published_at, modifiedAt: item.updated_at }));
  html = reveal(html, "case-study-detail-root");
  html = replaceEmpty(html, "breadcrumb-current", escapeHtml(item.client));
  html = replaceEmpty(html, "cs-tag", escapeHtml(item.industry || "Case study"));
  html = replaceEmpty(html, "cs-headline", escapeHtml(item.headline || item.client));
  html = replaceEmpty(html, "cs-summary", escapeHtml(item.card_summary || item.headline || ""));
  html = reveal(html, "cs-summary");
  html = replaceEmpty(html, "cs-client", escapeHtml(item.client));
  html = replaceEmpty(html, "cs-primary-metric", escapeHtml(item.metric || ""));
  html = replaceEmpty(html, "cs-description", richParagraphs(item.description));
  html = replaceEmpty(html, "cs-challenge", richParagraphs(item.challenge));
  html = replaceEmpty(html, "cs-results", richParagraphs(item.results_detail));
  if (item.description) html = reveal(html, "cs-engagement-section");
  return html;
}

function renderInsight(html, item, config) {
  const common = shared(item, config, "insight");
  const body = renderRichContent(item);
  const wordCount = stripHtml(item.content_text || body).split(/\s+/).filter(Boolean).length;
  const entity = {
    "@type": "BlogPosting",
    "@id": `${SITE_URL}${common.route}#article`,
    headline: item.title,
    description: common.description,
    image: item.cover_image_url || undefined,
    datePublished: item.first_published_at,
    dateModified: item.updated_at,
    author: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Xtradite Digital Team" },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: { "@id": `${SITE_URL}${common.route}#webpage` },
    keywords: item.tags || [],
    wordCount,
    timeRequired: item.minutes_to_read ? `PT${item.minutes_to_read}M` : undefined,
    inLanguage: "en-GB",
  };
  const schema = graph({ path: common.route, title: common.title, description: common.description, breadcrumbs: common.crumbs, primaryEntity: entity, image: item.cover_image_url, publishedAt: item.first_published_at, modifiedAt: item.updated_at });
  html = injectSeo(html, metaTags({ ...common, path: common.route, schema, type: "article", image: item.cover_image_url, publishedAt: item.first_published_at, modifiedAt: item.updated_at }));
  html = reveal(html, "post-root");
  html = replaceEmpty(html, "breadcrumb-current", escapeHtml(item.title));
  html = replaceEmpty(html, "post-title", escapeHtml(item.title));
  html = replaceEmpty(html, "post-date", escapeHtml(new Date(item.first_published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" })));
  html = replaceEmpty(html, "post-read-time", item.minutes_to_read ? `${escapeHtml(item.minutes_to_read)} min read` : "");
  html = replaceEmpty(html, "post-tags", (item.tags || []).map((tag) => `<a class="tag-chip" href="/insights?tag=${encodeURIComponent(tag)}">${escapeHtml(tag)}</a>`).join(""));
  html = replaceEmpty(html, "post-cover-wrap", item.cover_image_url ? `<img src="${escapeHtml(item.cover_image_url)}" alt="${escapeHtml(item.title)}" width="1200" height="630" fetchpriority="high">` : "");
  html = replaceEmpty(html, "post-body", body);
  return html;
}

function notFound(res) {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  return res.status(404).send("<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"robots\" content=\"noindex,nofollow\"><title>Page not found — Xtradite Digital</title></head><body><main><h1>Page not found</h1><p>The requested page is not available.</p><a href=\"/\">Return home</a></main></body></html>");
}

module.exports = async (req, res) => {
  const type = String(req.query.type || "");
  const slug = String(req.query.slug || "");
  const config = TYPES[type];
  if (!config || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return notFound(res);

  let item;
  try {
    [item] = await fetchAll(config.view, "*", `slug=eq.${encodeURIComponent(slug)}&limit=1`);
  } catch (error) {
    console.error("content page: Supabase lookup failed", { type, slug, error: error.message });
    res.setHeader("Retry-After", "60");
    return res.status(503).send("Content temporarily unavailable");
  }
  if (!item) return notFound(res);

  const templatePath = path.join(process.cwd(), "frontend", config.template);
  let html = fs.readFileSync(templatePath, "utf8");
  if (type === "service") html = renderService(html, item, config);
  else if (type === "industry") html = renderIndustry(html, item, config);
  else if (type === "case-study") html = renderCaseStudy(html, item, config);
  else html = renderInsight(html, item, config);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=900, stale-while-revalidate=86400");
  return res.status(200).send(html);
};
