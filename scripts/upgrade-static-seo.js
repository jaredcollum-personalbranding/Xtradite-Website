const fs = require("fs");
const path = require("path");
const { graph, metaTags } = require("../api/lib/seo");

const pages = {
  "index.html": {
    path: "/",
    title: "Xtradite Digital — Practical Consultancy for Digital-First Growth",
    description: "UK digital consultancy helping ambitious retail, ecommerce and manufacturing businesses close operational and commercial gaps with hands-on delivery.",
    type: "WebPage",
    crumbs: [{ name: "Home", path: "/" }],
  },
  "about.html": {
    path: "/about",
    title: "About Xtradite Digital — Hands-On UK Digital Consultancy",
    description: "Meet Xtradite Digital, a UK consultancy built for hands-on delivery across strategy, ecommerce, operations, AI, leadership and implementation.",
    type: "AboutPage",
  },
  "services.html": {
    path: "/services",
    title: "Digital Consultancy Services — Xtradite Digital",
    description: "Explore Xtradite Digital services for AI and automation, digital strategy, ecommerce growth, operational excellence, fractional leadership and project delivery.",
    type: "CollectionPage",
  },
  "industries.html": {
    path: "/industries",
    title: "Industries We Support — Xtradite Digital",
    description: "Digital consultancy for retail, ecommerce, manufacturing, consumer goods, professional services and startup organisations across the UK.",
    type: "CollectionPage",
  },
  "case-studies.html": {
    path: "/case-studies",
    title: "Digital Transformation Case Studies — Xtradite Digital",
    description: "Explore documented digital strategy, ecommerce, operations, automation and delivery engagements with measurable outcomes.",
    type: "CollectionPage",
  },
  "insights.html": {
    path: "/insights",
    title: "Digital Strategy, Operations and AI Insights — Xtradite Digital",
    description: "Practical analysis and guidance on digital strategy, ecommerce, AI, operational performance, leadership and project delivery.",
    type: "CollectionPage",
  },
  "contact.html": {
    path: "/contact",
    title: "Contact Xtradite Digital — Book a Consultation",
    description: "Discuss your digital strategy, ecommerce, operations, AI, fractional leadership or delivery challenge with Xtradite Digital.",
    type: "ContactPage",
  },
  "legal/privacy.html": {
    path: "/legal/privacy",
    title: "Privacy Policy — Xtradite Digital",
    description: "How Xtradite Digital collects, uses, stores and protects personal information.",
    type: "WebPage",
  },
  "legal/cookies.html": {
    path: "/legal/cookies",
    title: "Cookie Policy — Xtradite Digital",
    description: "How Xtradite Digital uses cookies and similar technologies, including your available controls.",
    type: "WebPage",
  },
  "legal/terms.html": {
    path: "/legal/terms",
    title: "Terms of Service — Xtradite Digital",
    description: "The terms that apply when using the Xtradite Digital website and consultancy services.",
    type: "WebPage",
  },
};

function stripLegacySeo(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/gi, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<meta\s+(?:name=["'](?:description|robots|twitter:[^"']+)["']|property=["'](?:og:|article:)[^"']*["'])[^>]*>\s*/gi, "")
    .replace(/<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>\s*/gi, "");
}

for (const [relativePath, page] of Object.entries(pages)) {
  const file = path.join(__dirname, "..", "frontend", relativePath);
  let html = fs.readFileSync(file, "utf8");
  const crumbs = page.crumbs || [
    { name: "Home", path: "/" },
    { name: page.title.replace(/\s+[—|].*$/, ""), path: page.path },
  ];
  const schema = graph({
    path: page.path,
    title: page.title,
    description: page.description,
    type: page.type,
    breadcrumbs: crumbs,
  });
  html = stripLegacySeo(html)
    .replace(/<html\s+lang=["'][^"']+["']/i, '<html lang="en-GB"')
    .replace("</head>", `${metaTags({ ...page, schema })}\n</head>`);
  fs.writeFileSync(file, html, "utf8");
}

function htmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(target) : entry.isFile() && entry.name.endsWith(".html") ? [target] : [];
  });
}

for (const file of htmlFiles(path.join(__dirname, "..", "frontend"))) {
  const original = fs.readFileSync(file, "utf8");
  const normalized = original
    .replace(/\/service-detail\?slug=([a-z0-9-]+)/g, "/services/$1")
    .replace(/\/industry-detail\?slug=([a-z0-9-]+)/g, "/industries/$1")
    .replace(/\/case-study-detail\?slug=([a-z0-9-]+)/g, "/case-studies/$1")
    .replace(/\/insights-post\?slug=([a-z0-9-]+)/g, "/insights/$1");
  if (normalized !== original) fs.writeFileSync(file, normalized, "utf8");
}

console.log(`Updated structured metadata for ${Object.keys(pages).length} static pages and normalized internal content URLs.`);
