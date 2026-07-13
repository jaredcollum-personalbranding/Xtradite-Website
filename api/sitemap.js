const { fetchAll, loadLocationCatalogue } = require("./lib/location-catalogue");

const SITE_URL = "https://www.xtradite-digital.co.uk";

const STATIC_PATHS = [
  { path: "/", priority: "1.0" },
  { path: "/about", priority: "0.7" },
  { path: "/services", priority: "0.9" },
  { path: "/locations", priority: "0.9" },
  { path: "/industries", priority: "0.8" },
  { path: "/case-studies", priority: "0.8" },
  { path: "/insights", priority: "0.7" },
  { path: "/contact", priority: "0.8" },
  { path: "/legal/privacy", priority: "0.3" },
  { path: "/legal/cookies", priority: "0.3" },
  { path: "/legal/terms", priority: "0.3" },
];

const toDate = (value) => (typeof value === "string" ? value.slice(0, 10) : undefined);
const cityPath = (location) => `/uk/${location.nationSlug}/${location.regionSlug}/${location.countySlug}/${location.slug}`;
const escapeXml = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function urlEntry(path, lastmod, priority) {
  return [
    "  <url>",
    `    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>`,
    lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : null,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].filter(Boolean).join("\n");
}

function newerDate(current, candidate) {
  const date = toDate(candidate);
  return !current || (date && date > current) ? date : current;
}

function locationEntries(locations, servicesByLocation) {
  const hierarchy = new Map();
  const leafEntries = [];

  for (const location of locations) {
    const lastmod = toDate(location.updatedAt);
    const hierarchyPaths = [
      "/uk",
      `/uk/${location.nationSlug}`,
      `/uk/${location.nationSlug}/${location.regionSlug}`,
      `/uk/${location.nationSlug}/${location.regionSlug}/${location.countySlug}`,
    ];

    for (const path of hierarchyPaths) {
      hierarchy.set(path, newerDate(hierarchy.get(path), location.updatedAt));
    }

    const basePath = cityPath(location);
    leafEntries.push({ path: basePath, lastmod, priority: "0.5" });

    for (const service of servicesByLocation.get(location.id) || []) {
      leafEntries.push({
        path: `${basePath}/services/${service.slug}`,
        lastmod: toDate(service.updatedAt),
        priority: "0.6",
      });
    }
  }

  return [
    ...[...hierarchy].map(([path, lastmod]) => ({ path, lastmod, priority: "0.5" })),
    ...leafEntries,
  ];
}

module.exports = async (req, res) => {
  let catalogue;
  let services;
  let industries;
  let caseStudies;
  let posts;

  try {
    [catalogue, services, industries, caseStudies, posts] = await Promise.all([
      loadLocationCatalogue(),
      fetchAll("services_delivery", "slug,updated_at"),
      fetchAll("industries_delivery", "slug,updated_at"),
      fetchAll("case_studies_delivery", "slug,updated_at"),
      fetchAll("blog_posts_delivery", "slug,updated_at,first_published_at"),
    ]);
  } catch (error) {
    console.error("sitemap: failed to fetch published content", error);
    res.setHeader("Retry-After", "60");
    return res.status(503).send("Sitemap temporarily unavailable");
  }

  const entries = [
    ...STATIC_PATHS.map((item) => urlEntry(item.path, undefined, item.priority)),
    ...locationEntries(catalogue.locations, catalogue.servicesByLocation)
      .map((item) => urlEntry(item.path, item.lastmod, item.priority)),
    ...services.map((item) => urlEntry(`/services/${item.slug}`, toDate(item.updated_at), "0.8")),
    ...industries.map((item) => urlEntry(`/industries/${item.slug}`, toDate(item.updated_at), "0.6")),
    ...caseStudies.map((item) => urlEntry(`/case-studies/${item.slug}`, toDate(item.updated_at), "0.6")),
    ...posts.map((item) => urlEntry(`/insights/${item.slug}`, toDate(item.updated_at || item.first_published_at), "0.6")),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(xml);
};
