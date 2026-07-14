const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..", "frontend");
const errors = [];
const warnings = [];

const requiredStyleMarkers = [
  "xtradite-brand-logo-css",
  "xtradite-mobile-css",
  "xtradite-tabs-css",
  "xtradite-mega-menu-css",
  "xtradite-enquiry-css",
  "service-content-architecture-css",
  "service-delivery-timeline-css",
  "service-template-v3-css",
  "case-study-experience-css",
  "xtradite-jam-refinement-css",
];

const mojibakePatterns = [
  "Â£", "Â©", "Â®", "Â·", "Â ",
  "â€”", "â€“", "â€™", "â€˜", "â€œ", "â€", "â€¦",
];

function filesRecursively(directory, matcher) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesRecursively(target, matcher);
    return entry.isFile() && matcher.test(entry.name) ? [target] : [];
  });
}

function relative(file) {
  return path.relative(path.join(__dirname, ".."), file).replace(/\\/g, "/");
}

function count(source, expression) {
  return [...source.matchAll(expression)].length;
}

if (!fs.existsSync(root)) {
  throw new Error(`Frontend directory not found: ${root}`);
}

const frontendFiles = filesRecursively(root, /\.(?:html?|css|js)$/i);
const htmlFiles = frontendFiles.filter((file) => /\.html?$/i.test(file));

for (const file of frontendFiles) {
  const source = fs.readFileSync(file, "utf8");
  const name = relative(file);

  for (const pattern of mojibakePatterns) {
    if (source.includes(pattern)) errors.push(`${name}: contains mojibake pattern ${JSON.stringify(pattern)}`);
  }

  if (source.includes("overscroll-behaviour")) errors.push(`${name}: use overscroll-behavior`);
  if (source.includes("scroll-behaviour")) errors.push(`${name}: use scroll-behavior`);
}

for (const file of htmlFiles) {
  const source = fs.readFileSync(file, "utf8");
  const name = relative(file);

  if (!/<head(?:\s[^>]*)?>/i.test(source)) {
    errors.push(`${name}: missing <head>`);
    continue;
  }

  for (const marker of requiredStyleMarkers) {
    const occurrences = count(source, new RegExp(`data-${marker}(?:\\s|>|=)`, "g"));
    if (occurrences === 0) errors.push(`${name}: missing critical stylesheet marker data-${marker}`);
    if (occurrences > 1) errors.push(`${name}: duplicates critical stylesheet marker data-${marker}`);
  }
}

const siteScriptPath = path.join(root, "assets", "js", "site.js");
if (fs.existsSync(siteScriptPath)) {
  const siteScript = fs.readFileSync(siteScriptPath, "utf8");
  if (/function\s+loadStylesheet\s*\(/.test(siteScript)) {
    errors.push("frontend/assets/js/site.js: runtime shared stylesheet loader remains after build");
  }
  if (/repairKnownMojibake/.test(siteScript)) {
    errors.push("frontend/assets/js/site.js: runtime mojibake repair remains after build");
  }
} else {
  errors.push("frontend/assets/js/site.js: missing shared site controller");
}

const foundationPath = path.join(root, "assets", "css", "jam-refinement.css");
if (fs.existsSync(foundationPath)) {
  const foundation = fs.readFileSync(foundationPath, "utf8");
  const requiredSignals = [
    ["text-wrap: balance", "balanced heading wrapping"],
    ["min-width: 0", "intrinsic grid containment"],
    ["clamp(", "responsive type scaling"],
    ["overscroll-behavior", "valid overscroll containment"],
  ];
  for (const [signal, description] of requiredSignals) {
    if (!foundation.includes(signal)) errors.push(`frontend/assets/css/jam-refinement.css: missing ${description}`);
  }
} else {
  errors.push("frontend/assets/css/jam-refinement.css: missing foundation stylesheet");
}

if (htmlFiles.length === 0) warnings.push("No HTML files were found to validate");

warnings.forEach((warning) => console.warn(`WARN: ${warning}`));

if (errors.length) {
  console.error(`Jam foundation validation failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Jam foundation validation passed across ${frontendFiles.length} frontend files and ${htmlFiles.length} HTML pages.`);
}
