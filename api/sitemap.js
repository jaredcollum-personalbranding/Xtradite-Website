// Auto-generated sitemap.xml — served at https://www.xtradite-digital.co.uk/sitemap.xml
// via the rewrite in vercel.json. Queries Supabase at request time (cached at the edge
// for an hour) so every new service/industry/case study/insights post is picked up
// automatically without a manual rebuild.
const SUPABASE_URL = "https://bmhkdyshluiloorgnwoy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Aj9nCJLFY9aMycZeQ3buTQ_-n-Q7SFK";
const SITE_URL = "https://www.xtradite-digital.co.uk";

const STATIC_PATHS = [
  { path: "/", priority: "1.0" },
  { path: "/about", priority: "0.7" },
  { path: "/services", priority: "0.9" },
  { path: "/industries", priority: "0.8" },
  { path: "/case-studies", priority: "0.8" },
  { path: "/insights", priority: "0.7" },
  { path: "/contact", priority: "0.8" },
  { path: "/legal/privacy", priority: "0.3" },
  { path: "/legal/cookies", priority: "0.3" },
  { path: "/legal/terms", priority: "0.3" },
];

async function fetchTable(table, select) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${select}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) return [];
  return res.json();
}

function urlEntry(loc, lastmod, priority) {
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

function toDate(value) {
  return typeof value === "string" ? value.slice(0, 10) : undefined;
}

module.exports = async (req, res) => {
  let services = [], industries = [], caseStudies = [], posts = [];
  try {
    [services, industries, caseStudies, posts] = await Promise.all([
      fetchTable("services", "slug,updated_at"),
      fetchTable("industries", "slug,updated_at"),
      fetchTable("case_studies", "slug,updated_at"),
      fetchTable("blog_posts", "slug,updated_at,first_published_at"),
    ]);
  } catch (e) {
    console.error("sitemap: failed to fetch dynamic content", e);
  }

  const entries = [
    ...STATIC_PATHS.map((p) => urlEntry(`${SITE_URL}${p.path}`, undefined, p.priority)),
    ...services.map((s) => urlEntry(`${SITE_URL}/services/${s.slug}`, toDate(s.updated_at), "0.8")),
    ...industries.map((i) => urlEntry(`${SITE_URL}/industry-detail?slug=${i.slug}`, toDate(i.updated_at), "0.6")),
    ...caseStudies.map((c) => urlEntry(`${SITE_URL}/case-study-detail?slug=${c.slug}`, toDate(c.updated_at), "0.6")),
    ...posts.map((b) => urlEntry(`${SITE_URL}/insights-post?slug=${b.slug}`, toDate(b.updated_at || b.first_published_at), "0.6")),
  ];

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries.join("\n") +
    "\n</urlset>\n";

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(xml);
};
