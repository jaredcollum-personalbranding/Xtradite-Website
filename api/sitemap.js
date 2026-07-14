const { fetchRows } = require("./lib/supabase");
const { loadLocationCatalogue } = require("./lib/location-catalogue");
const { SITE_URL } = require("./lib/schema");

const STATIC_PATHS = [
  { path: "/", lastmod: null },
  { path: "/about", lastmod: null },
  { path: "/services", lastmod: null },
  { path: "/locations", lastmod: null },
  { path: "/industries", lastmod: null },
  { path: "/case-studies", lastmod: null },
  { path: "/insights", lastmod: null },
  { path: "/contact", lastmod: null },
  { path: "/legal/privacy", lastmod: null },
  { path: "/legal/cookies", lastmod: null },
  { path: "/legal/terms", lastmod: null },
];

const TYPES = new Set(["static", "services", "industries", "case-studies", "insights", "locations"]);
const toDate = (value) => typeof value === "string" && value ? value.slice(0, 10) : undefined;
const unique = (items) => [...new Set(items)];
const cityPath = (location) => `/uk/${location.nationSlug}/${location.regionSlug}/${location.countySlug}/${location.slug}`;

function escapeXml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function urlEntry(path, lastmod) {
  return [
    "  <url>",
    `    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>`,
    lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : null,
    "  </url>",
  ].filter(Boolean).join("\n");
}

async function locationEntries() {
  const { locations, servicesByLocation } = await loadLocationCatalogue();
  const entries = [{ path: "/uk" }];

  unique(locations.map((location) => location.nationSlug))
    .forEach((nation) => entries.push({ path: `/uk/${nation}` }));
  unique(locations.map((location) => `${location.nationSlug}/${location.regionSlug}`))
    .forEach((item) => entries.push({ path: `/uk/${item}` }));
  unique(locations.map((location) => `${location.nationSlug}/${location.regionSlug}/${location.countySlug}`))
    .forEach((item) => entries.push({ path: `/uk/${item}` }));

  locations.forEach((location) => {
    const path = cityPath(location);
    entries.push({ path, lastmod: toDate(location.updatedAt) });
    (servicesByLocation.get(location.id) || []).forEach((service) => {
      entries.push({
        path: `${path}/services/${service.slug}`,
        lastmod: toDate(service.updatedAt || location.updatedAt),
      });
    });
  });

  return entries;
}

async function dynamicEntries(type) {
  const configs = {
    services: { table: "services", route: "services", select: "slug,updated_at" },
    industries: { table: "industries", route: "industries", select: "slug,updated_at" },
    "case-studies": { table: "case_studies", route: "case-studies", select: "slug,updated_at" },
    insights: { table: "blog_posts", route: "insights", select: "slug,updated_at,first_published_at" },
  };
  const config = configs[type];
  const rows = await fetchRows(config.table, {
    select: config.select,
    filters: { status: "eq.published", slug: "not.is.null" },
  });
  return rows
    .filter((row) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug || ""))
    .map((row) => ({
      path: `/${config.route}/${row.slug}`,
      lastmod: toDate(row.updated_at || row.first_published_at),
    }));
}

function sendXml(res, xml, cache = 3600) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("X-Robots-Tag", "noindex");
  res.setHeader("Cache-Control", `public, max-age=0, s-maxage=${cache}, stale-while-revalidate=86400`);
  res.status(200).send(xml);
}

module.exports = async (req, res) => {
  const type = String(req.query.type || "");

  if (!type) {
    const now = new Date().toISOString().slice(0, 10);
    const items = [...TYPES].map((name) => [
      "  <sitemap>",
      `    <loc>${SITE_URL}/sitemaps/${name}.xml</loc>`,
      `    <lastmod>${now}</lastmod>`,
      "  </sitemap>",
    ].join("\n"));
    sendXml(res, `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join("\n")}\n</sitemapindex>\n`, 900);
    return;
  }

  if (!TYPES.has(type)) {
    res.status(404).send("Unknown sitemap");
    return;
  }

  try {
    let entries;
    if (type === "static") entries = STATIC_PATHS;
    else if (type === "locations") entries = await locationEntries();
    else entries = await dynamicEntries(type);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map((entry) => urlEntry(entry.path, entry.lastmod)).join("\n")}\n</urlset>\n`;
    sendXml(res, xml);
  } catch (error) {
    console.error("sitemap generation failed", { type, message: error.message });
    res.status(503).setHeader("Retry-After", "300").send("Sitemap temporarily unavailable");
  }
};
