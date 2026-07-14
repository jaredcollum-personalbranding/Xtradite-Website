const fs = require("node:fs");
const path = require("node:path");
const { SITE_URL, ORGANISATION_ID, PERSON_ID, buildGraph } = require("../api/lib/schema");

const frontendDirectory = path.join(__dirname, "..", "frontend");
const dynamicTemplates = new Set(["industry-detail.html", "case-study-detail.html", "insights-post.html", "service-detail.html"]);

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
  if (relative === "about.html") return "AboutPage";
  if (relative === "contact.html") return "ContactPage";
  if (["industries.html", "case-studies.html", "insights.html", "services.html"].includes(relative)) return "CollectionPage";
  if (relative === "legal/privacy.html") return "PrivacyPolicy";
  if (relative === "legal/terms.html") return "TermsOfService";
  return "WebPage";
}

let htmlUpdated = 0;
for (const file of files(frontendDirectory, /\.html?$/i)) {
  const relative = path.relative(frontendDirectory, file).replace(/\\/g, "/");
  const source = fs.readFileSync(file, "utf8");
  let output = normaliseInternalLinks(source);

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

console.log(`SEO metadata and internal routes normalised in ${htmlUpdated} HTML and ${scriptUpdated} JavaScript file(s).`);
