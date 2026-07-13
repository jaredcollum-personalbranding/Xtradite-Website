const SITE_URL = "https://www.xtradite-digital.co.uk";
const BRAND_NAME = "Xtradite Digital";
const LOGO_URL = "https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/Branding/XD-logo-nbg.png";
const DEFAULT_DESCRIPTION = "UK digital consultancy helping ambitious retail, ecommerce and manufacturing businesses close operational and commercial gaps with hands-on delivery.";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripHtml(value) {
  return String(value ?? "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return undefined;
  return /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function organization() {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: BRAND_NAME,
    legalName: BRAND_NAME,
    url: `${SITE_URL}/`,
    logo: { "@type": "ImageObject", url: LOGO_URL },
    description: DEFAULT_DESCRIPTION,
    areaServed: { "@type": "Country", name: "United Kingdom" },
    knowsAbout: [
      "Digital Strategy",
      "AI and Automation",
      "eCommerce Growth",
      "Operational Excellence",
      "Fractional Leadership",
      "Digital Project Delivery",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales and enquiries",
      url: `${SITE_URL}/contact`,
      availableLanguage: "English",
    },
  };
}

function website() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: BRAND_NAME,
    description: DEFAULT_DESCRIPTION,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-GB",
  };
}

function breadcrumbs(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function graph({ path, title, description, type = "WebPage", breadcrumbs: crumbItems = [], primaryEntity, image, publishedAt, modifiedAt }) {
  const url = absoluteUrl(path);
  const page = {
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    inLanguage: "en-GB",
    ...(image ? { primaryImageOfPage: { "@type": "ImageObject", url: absoluteUrl(image) } } : {}),
    ...(publishedAt ? { datePublished: publishedAt } : {}),
    ...(modifiedAt ? { dateModified: modifiedAt } : {}),
  };
  const crumb = { ...breadcrumbs(crumbItems), "@id": `${url}#breadcrumb` };
  return {
    "@context": "https://schema.org",
    "@graph": [organization(), website(), page, crumb, ...(Array.isArray(primaryEntity) ? primaryEntity : primaryEntity ? [primaryEntity] : [])],
  };
}

function metaTags({ title, description, path, image, type = "website", publishedAt, modifiedAt, schema }) {
  const url = absoluteUrl(path);
  const socialImage = absoluteUrl(image);
  const robots = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<meta name="robots" content="${robots}">`,
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    `<meta property="og:site_name" content="${BRAND_NAME}">`,
    `<meta property="og:locale" content="en_GB">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    socialImage ? `<meta property="og:image" content="${escapeHtml(socialImage)}">` : null,
    socialImage ? `<meta property="og:image:alt" content="${escapeHtml(title)}">` : null,
    publishedAt ? `<meta property="article:published_time" content="${escapeHtml(publishedAt)}">` : null,
    modifiedAt ? `<meta property="article:modified_time" content="${escapeHtml(modifiedAt)}">` : null,
    `<meta name="twitter:card" content="${socialImage ? "summary_large_image" : "summary"}">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    socialImage ? `<meta name="twitter:image" content="${escapeHtml(socialImage)}">` : null,
    `<script id="seo-jsonld" type="application/ld+json">${jsonLd(schema)}</script>`,
  ].filter(Boolean).join("\n");
}

module.exports = {
  SITE_URL,
  BRAND_NAME,
  LOGO_URL,
  DEFAULT_DESCRIPTION,
  escapeHtml,
  stripHtml,
  absoluteUrl,
  jsonLd,
  organization,
  website,
  breadcrumbs,
  graph,
  metaTags,
};
