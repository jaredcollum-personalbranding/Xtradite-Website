const fs = require("node:fs");
const path = require("node:path");
const { SITE_URL, ORGANISATION_ID, PERSON_ID, buildGraph } = require("../api/lib/schema");

const frontendDirectory = path.join(__dirname, "..", "frontend");
const dynamicTemplates = new Set(["industry-detail.html", "case-study-detail.html", "insights-post.html", "service-detail.html"]);
const SOCIAL_IMAGE = `${SITE_URL}/assets/brand/xtradite-social-share.svg`;
const SOCIAL_IMAGE_ALT = "Xtradite Digital — practical consultancy for measurable growth";
const FAVICON = `${SITE_URL}/assets/brand/favicon.svg`;

function files(directory, matcher) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return files(target, matcher);
    return entry.isFile() && matcher.test(entry.name) ? [target] : [];
  });
}

function textFromTag(source, pattern) {
  return (source.match(pattern)?.[1] || "").replace(/\s+/g, " ").trim();
}

function publicPath(file) {
  const relative = path.relative(frontendDirectory, file).replace(/\\/g, "/");
  if (relative === "index.html") return "/";
  return `/${relative.replace(/\.html?$/i, "")}`;
}

function replaceMeta(source, selector, replacement) {
  return selector.test(source) ? source.replace(selector, replacement) : source.replace(/<\/head>/i, `${replacement}\n</head>`);
}

function normaliseInternalLinks(source) {
  return source
    .replace(/\/industry-detail\?slug=([a-z0-9-]+)/gi, "/industries/$1")
    .replace(/\/case-study-detail\?slug=([a-z0-9-]+)/gi, "/case-studies/$1")
    .replace(/\/insights-post\?slug=([a-z0-9-]+)/gi, "/insights/$1");
}

function normaliseScriptLinks(source) {
  return source
    .replace(/\/industry-detail\?slug=\$\{encodeURIComponent\(([^)]+)\)\}/g, "/industries/${encodeURIComponent($1)}")
    .replace(/\/case-study-detail\?slug=\$\{encodeURIComponent\(([^)]+)\)\}/g, "/case-studies/${encodeURIComponent($1)}")
    .replace(/\/insights-post\?slug=\$\{encodeURIComponent\(([^)]+)\)\}/g, "/insights/${encodeURIComponent($1)}");
}

function primaryEntity(filePath, title, description, canonical) {
  const relative = path.relative(frontendDirectory, filePath).replace(/\\/g, "/");
  if (relative.startsWith("services/") && relative !== "services/index.html") {
    return {
      "@type": "Service",
      "@id": `${canonical}#service`,
      name: title.replace(/\s*[—|-]\s*Xtradite Digital.*$/i, ""),
      description,
      url: canonical,
      provider: { "@id": ORGANISATION_ID },
      areaServed: { "@type": "Country", name: "United Kingdom" }
    };
  }
  if (relative === "about.html") {
    return {
      "@type": "Person",
      "@id": PERSON_ID,
      name: "Jared Collum",
      jobTitle: "Founder and Digital Consultant",
      worksFor: { "@id": ORGANISATION_ID },
      url: canonical,
      description
    };
  }
  return undefined;
}

function pageTypeFor(relative) {
  if (relative === "about.html") return ["AboutPage", "ProfilePage"];
  if (relative === "contact.html") return "ContactPage";
  if (["industries.html", "case-studies.html", "insights.html", "services.html"].includes(relative)) return "CollectionPage";
  if (relative === "legal/privacy.html") return "PrivacyPolicy";
  if (relative === "legal/terms.html") return "TermsOfService";
  return "WebPage";
}

function applySharedBrandMetadata(source) {
  let output = source;
  output = replaceMeta(output, /<link\s+rel=["']icon["'][^>]*type=["']image\/svg\+xml["'][^>]*>/i, `<link rel="icon" type="image/svg+xml" href="${FAVICON}">`);
  output = replaceMeta(output, /<meta\s+name=["']theme-color["'][^>]*>/i, '<meta name="theme-color" content="#0D0D0D">');
  return output;
}

function applySocialMetadata(source, title, description) {
  let output = source;
  output = replaceMeta(output, /<meta\s+property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${SOCIAL_IMAGE}">`);
  output = replaceMeta(output, /<meta\s+property=["']og:image:width["'][^>]*>/i, '<meta property="og:image:width" content="1200">');
  output = replaceMeta(output, /<meta\s+property=["']og:image:height["'][^>]*>/i, '<meta property="og:image:height" content="630">');
  output = replaceMeta(output, /<meta\s+property=["']og:image:alt["'][^>]*>/i, `<meta property="og:image:alt" content="${SOCIAL_IMAGE_ALT}">`);
  output = replaceMeta(output, /<meta\s+name=["']twitter:card["'][^>]*>/i, '<meta name="twitter:card" content="summary_large_image">');
  output = replaceMeta(output, /<meta\s+name=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${SOCIAL_IMAGE}">`);
  output = replaceMeta(output, /<meta\s+name=["']twitter:image:alt["'][^>]*>/i, `<meta name="twitter:image:alt" content="${SOCIAL_IMAGE_ALT}">`);
  output = replaceMeta(output, /<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${title.replace(/"/g, "&quot;")}">`);
  output = replaceMeta(output, /<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${description.replace(/"/g, "&quot;")}">`);
  return output;
}

let htmlUpdated = 0;
for (const file of files(frontendDirectory, /\.html?$/i)) {
  const relative = path.relative(frontendDirectory, file).replace(/\\/g, "/");
  const source = fs.readFileSync(file, "utf8");
  let output = applySharedBrandMetadata(normaliseInternalLinks(source));

  if (dynamicTemplates.has(relative)) {
    output = replaceMeta(output, /<meta\s+name=["']robots["'][^>]*>/i, '<meta name="robots" content="noindex, follow">');
  } else {
    const pathname = publicPath(file);
    const canonical = `${SITE_URL}${pathname}`;
    const title = textFromTag(output, /<title>([\s\S]*?)<\/title>/i) || "Xtradite Digital";
    const description = textFromTag(output, /<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/i);
    const entity = primaryEntity(file, title, description, canonical);
    const graph = buildGraph({
      canonical,
      title,
      description,
      pageType: pageTypeFor(relative),
      primaryEntity: entity,
      breadcrumbItems: pathname === "/" ? [] : [
        { name: "Home", url: `${SITE_URL}/` },
        { name: title.replace(/\s*[—|-]\s*Xtradite Digital.*$/i, ""), url: canonical }
      ]
    });

    output = replaceMeta(output, /<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${canonical}">`);
    output = replaceMeta(output, /<meta\s+property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${canonical}">`);
    output = applySocialMetadata(output, title, description);
    output = output.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, "");
    output = output.replace(/<\/head>/i, `<script id="xd-schema-graph" type="application/ld+json">${JSON.stringify(graph).replace(/</g, "\\u003c")}</script>\n</head>`);
  }

  if (output !== source) {
    fs.writeFileSync(file, output, "utf8");
    htmlUpdated += 1;
  }
}

let scriptUpdated = 0;
for (const file of files(path.join(frontendDirectory, "assets", "js"), /\.js$/i)) {
  const source = fs.readFileSync(file, "utf8");
  const output = normaliseScriptLinks(source);
  if (output !== source) {
    fs.writeFileSync(file, output, "utf8");
    scriptUpdated += 1;
  }
}

console.log(`SEO metadata, brand assets and internal routes normalised in ${htmlUpdated} HTML and ${scriptUpdated} JavaScript file(s).`);
