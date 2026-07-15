const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const FRONTEND = path.join(ROOT, "frontend");
const OUTPUT = path.join(ROOT, "artifacts", "seo-release-quality");
const CANONICAL_HOST = "www.xtradite-digital.co.uk";
const DYNAMIC_TEMPLATES = new Set(["service-detail.html", "industry-detail.html", "case-study-detail.html", "insights-post.html"]);
const MOJIBAKE = ["Â£", "Â©", "Â®", "Â·", "Â ", "â€”", "â€“", "â€™", "â€˜", "â€œ", "â€", "â€¦"];
const UNSUPPORTED_CLAIMS = [/6\s*[–-]\s*12\s*wk/i, /30%\+/i, /capacity gain/i, /payback range/i, /estimated leverage/i];

function files(directory, matcher) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return files(target, matcher);
    return entry.isFile() && matcher.test(entry.name) ? [target] : [];
  });
}

function occurrences(source, expression) {
  return [...source.matchAll(expression)].map((match) => match[1] ?? match[0]);
}

function routeFor(file) {
  const relative = path.relative(FRONTEND, file).replace(/\\/g, "/");
  if (relative === "index.html") return "/";
  return `/${relative.replace(/\/index\.html$/i, "").replace(/\.html?$/i, "")}`;
}

function localAssetFailures(source, fileName) {
  const failures = [];
  const urls = occurrences(source, /(?:src|href)=["'](\/[^"'#?]+\.(?:css|js|mjs|png|jpe?g|webp|svg|ico|woff2?))["']/gi);
  for (const url of urls) {
    const target = path.join(FRONTEND, decodeURIComponent(url.replace(/^\//, "")));
    if (!fs.existsSync(target)) failures.push({ rule: "local-asset", message: `${fileName}: missing ${url}` });
  }
  return failures;
}

function validateHtml(source, fileName = "fixture.html", { checkAssets = false } = {}) {
  const failures = [];
  const relative = fileName.replace(/\\/g, "/");
  const dynamic = DYNAMIC_TEMPLATES.has(relative);
  const add = (rule, message) => failures.push({ rule, message: `${relative}: ${message}` });

  const titles = occurrences(source, /<title>([\s\S]*?)<\/title>/gi).map((value) => value.trim()).filter(Boolean);
  if (titles.length !== 1) add("title", `expected one non-empty title, found ${titles.length}`);

  const descriptions = occurrences(source, /<meta\s+name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/gi);
  if (descriptions.length !== 1) add("description", `expected one non-empty meta description, found ${descriptions.length}`);

  const h1s = occurrences(source, /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi);
  if (!h1s.length) add("h1", "missing H1 element");
  if (!dynamic && h1s.filter((value) => value.replace(/<[^>]*>/g, "").trim()).length !== 1) {
    add("h1", "expected one non-empty static-page H1");
  }

  const canonicals = occurrences(source, /<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/gi);
  if (canonicals.length !== 1) add("canonical", `expected one canonical, found ${canonicals.length}`);
  for (const value of canonicals) {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:") add("canonical", `canonical must use HTTPS: ${value}`);
      if (url.hostname !== CANONICAL_HOST) add("canonical", `canonical host must be ${CANONICAL_HOST}: ${value}`);
      if (url.search || url.hash) add("canonical", `canonical must not contain query or fragment: ${value}`);
    } catch {
      add("canonical", `invalid canonical URL: ${value}`);
    }
  }

  const ogUrls = occurrences(source, /<meta\s+property=["']og:url["'][^>]*content=["']([^"']+)["'][^>]*>/gi);
  if (!dynamic && canonicals.length === 1 && ogUrls.length === 1 && canonicals[0] !== ogUrls[0]) {
    add("og-url", `Open Graph URL does not match canonical (${ogUrls[0]} vs ${canonicals[0]})`);
  }

  const idDefinitions = new Map();
  const jsonBlocks = occurrences(source, /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const [index, block] of jsonBlocks.entries()) {
    let parsed;
    try {
      parsed = JSON.parse(block);
    } catch (error) {
      add("json-ld", `JSON-LD block ${index + 1} is invalid: ${error.message}`);
      continue;
    }
    const nodes = Array.isArray(parsed?.["@graph"]) ? parsed["@graph"] : [parsed];
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      const id = node["@id"];
      if (!id) continue;
      const definition = JSON.stringify(node);
      if (idDefinitions.has(id) && idDefinitions.get(id) !== definition) add("json-ld-id", `conflicting definitions for ${id}`);
      else idDefinitions.set(id, definition);
    }
  }

  for (const pattern of MOJIBAKE) if (source.includes(pattern)) add("encoding", `contains mojibake ${JSON.stringify(pattern)}`);
  if (/https?:\/\/xtradite-digital\.co\.uk(?:[/'"]|$)/i.test(source)) add("hostname", "contains apex-domain absolute URL");
  if (/\/(?:industry-detail|case-study-detail|insights-post)\?slug=/i.test(source)) add("legacy-route", "contains legacy query-string detail route");
  if (/LocalBusiness|AggregateRating|"@type"\s*:\s*"Review"/i.test(source)) add("unsupported-schema", "contains unsupported local-business, rating or review schema");
  for (const pattern of UNSUPPORTED_CLAIMS) if (pattern.test(source)) add("unsupported-claim", `contains unsupported service claim matching ${pattern}`);
  if (checkAssets) failures.push(...localAssetFailures(source, relative));

  return failures;
}

function markdown(report) {
  if (!report.failures.length) return `# SEO release quality\n\nResult: **PASS**\n\nChecked ${report.filesChecked} HTML files at ${report.checkedAt}.\n`;
  return `# SEO release quality\n\nResult: **FAIL**\n\nChecked ${report.filesChecked} HTML files at ${report.checkedAt}.\n\n| Rule | Failure |\n|---|---|\n${report.failures.map((failure) => `| ${failure.rule} | ${failure.message.replace(/\|/g, "\\|")} |`).join("\n")}\n`;
}

function run() {
  const htmlFiles = files(FRONTEND, /\.html?$/i);
  const failures = htmlFiles.flatMap((file) => validateHtml(
    fs.readFileSync(file, "utf8"),
    path.relative(FRONTEND, file),
    { checkAssets: true }
  ));
  const report = { checkedAt: new Date().toISOString(), filesChecked: htmlFiles.length, failures };
  fs.mkdirSync(OUTPUT, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT, "report.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(OUTPUT, "report.md"), markdown(report));
  console.log(markdown(report));
  if (failures.length) process.exitCode = 1;
  return report;
}

if (require.main === module) run();

module.exports = { validateHtml, run };
