const fs = require("node:fs");
const path = require("node:path");

const frontendDirectory = path.join(__dirname, "..", "frontend");
const teamMarker = 'name="jam:team"';
const metadataMarker = 'src="/assets/js/jam-metadata.js"';
const designSystemMarker = 'src="/assets/js/design-system.js"';
const brandResilienceMarker = 'src="/assets/js/brand-resilience.js"';
const assetVersion = "20260714-4";

const jamHead = `
  <meta name="jam:team" content="e8e1b81a-519b-40e4-9720-4d2182dbc6da" />
  <script type="module" src="https://js.jam.dev/recorder.js"></script>
  <script type="module" src="https://js.jam.dev/capture.js"></script>
  <script type="module" src="/assets/js/jam-metadata.js"></script>`;

const sharedStyles = [
  ["xtradite-brand-logo-css", `/assets/css/brand-logo.css?v=${assetVersion}`],
  ["xtradite-mobile-css", `/assets/css/mobile.css?v=${assetVersion}`],
  ["xtradite-tabs-css", `/assets/css/tabs.css?v=${assetVersion}`],
  ["xtradite-mega-menu-css", `/assets/css/mega-menu.css?v=${assetVersion}`],
  ["xtradite-enquiry-css", `/assets/css/enquiry.css?v=${assetVersion}`],
  ["case-study-experience-css", `/assets/css/case-study-experience.css?v=${assetVersion}`],
  ["xtradite-jam-refinement-css", `/assets/css/jam-refinement.css?v=${assetVersion}`],
];

const services = [
  ["ai-automation", "AI & Automation", "Practical automation for defined operational workflows."],
  ["digital-strategy", "Digital Strategy", "Commercial direction connected to delivery priorities."],
  ["ecommerce-growth", "eCommerce Growth", "Conversion, retention and merchandising within clear commercial measures."],
  ["operational-excellence", "Operational Excellence", "Processes, controls and systems designed for dependable execution."],
  ["fractional-leadership", "Fractional Leadership", "Embedded leadership around a defined mandate and cadence."],
  ["project-delivery", "Project Delivery", "Clear ownership for implementation, suppliers, testing and launch."],
];

const industries = [
  ["retail", "Retail"],
  ["ecommerce", "eCommerce"],
  ["manufacturing", "Manufacturing"],
  ["consumer-goods", "Consumer Goods"],
  ["professional-services", "Professional Services"],
  ["startups", "Start-ups"],
];

const encodingRepairs = new Map([
  ["Â£", "£"], ["Â©", "©"], ["Â®", "®"], ["Â·", "·"], ["Â ", " "],
  ["â€”", "—"], ["â€“", "–"], ["â€™", "’"], ["â€˜", "‘"], ["â€œ", "“"], ["â€", "”"], ["â€¦", "…"],
]);

function filesRecursively(directory, pattern) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesRecursively(target, pattern);
    return entry.isFile() && pattern.test(entry.name) ? [target] : [];
  });
}

function repairSource(source) {
  let output = source;
  encodingRepairs.forEach((replacement, broken) => { output = output.split(broken).join(replacement); });
  return output.replaceAll("overscroll-behaviour", "overscroll-behavior").replaceAll("scroll-behaviour", "scroll-behavior");
}

function removeNamedFunction(source, functionName) {
  const signature = `function ${functionName}`;
  const start = source.indexOf(signature);
  if (start === -1) return source;
  const openingBrace = source.indexOf("{", start + signature.length);
  if (openingBrace === -1) throw new Error(`Cannot remove ${functionName}: opening brace not found`);

  let depth = 0;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openingBrace; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (lineComment) { if (character === "\n") lineComment = false; continue; }
    if (blockComment) {
      if (character === "*" && next === "/") { blockComment = false; index += 1; }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === "/" && next === "/") { lineComment = true; index += 1; continue; }
    if (character === "/" && next === "*") { blockComment = true; index += 1; continue; }
    if (character === '"' || character === "'" || character === "`") { quote = character; continue; }
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        let end = index + 1;
        while (source[end] === "\r" || source[end] === "\n") end += 1;
        return `${source.slice(0, start)}${source.slice(end)}`;
      }
    }
  }
  throw new Error(`Cannot remove ${functionName}: closing brace not found`);
}

function removeObsoleteRuntimeRepairs(source, file) {
  if (path.basename(file) !== "site.js") return source;
  let output = removeNamedFunction(source, "loadStylesheet");
  output = removeNamedFunction(output, "repairKnownMojibake");
  output = output
    .replace(/^\s*loadStylesheet\([^;]+;\s*$/gm, "")
    .replace(/^\s*repairKnownMojibake\([^;]*\);\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n");
  if (/loadStylesheet|repairKnownMojibake/.test(output)) throw new Error("site.js still contains obsolete runtime CSS or encoding-repair code after preparation");
  return output;
}

function styleBlockFor(source) {
  return sharedStyles.filter(([marker]) => !source.includes(`data-${marker}`))
    .map(([marker, href]) => `  <link rel="stylesheet" href="${href}" data-${marker}>`).join("\n");
}

function megaNavigationHtml() {
  return `<nav class="site-nav mega-nav" id="site-nav" aria-label="Primary navigation" data-mega-static="true">
    <a class="mega-nav-link" href="/">Home</a>
    <a class="mega-nav-link" href="/about">About</a>
    <div class="mega-nav-item mega-nav-item--what-we-do">
      <button class="mega-nav-trigger" type="button" aria-expanded="false" aria-controls="mega-menu-what-we-do"><span>What We Do</span><span class="mega-nav-chevron" aria-hidden="true"></span></button>
      <div class="mega-menu-panel mega-menu-panel--what-we-do" id="mega-menu-what-we-do" aria-hidden="true" inert>
        <div class="mega-menu-intro"><span class="mega-menu-kicker">Capabilities</span><h2>Commercial thinking connected to implementation.</h2><p>Choose a core service or browse the sectors where the work is applied.</p></div>
        <div class="mega-menu-columns">
          <section class="mega-menu-column mega-menu-column--services"><div class="mega-menu-column-head"><div><span>Services</span><small>How we help</small></div><a href="/services">View all services <span aria-hidden="true">→</span></a></div><div class="mega-menu-list mega-menu-list--services">${services.map(([slug, title, summary]) => `<a class="mega-menu-entry" href="/services/${slug}"><span class="mega-menu-entry-title">${title}</span><span class="mega-menu-entry-copy">${summary}</span></a>`).join("")}</div></section>
          <section class="mega-menu-column mega-menu-column--industries"><div class="mega-menu-column-head"><div><span>Industries</span><small>Where we work</small></div><a href="/industries">View all industries <span aria-hidden="true">→</span></a></div><div class="mega-menu-list mega-menu-list--industries">${industries.map(([slug, title]) => `<a class="mega-menu-entry mega-menu-entry--compact" href="/industries/${slug}"><span class="mega-menu-entry-title">${title}</span></a>`).join("")}</div></section>
        </div>
      </div>
    </div>
    <div class="mega-nav-item mega-nav-item--insights">
      <button class="mega-nav-trigger" type="button" aria-expanded="false" aria-controls="mega-menu-project-insights"><span>Project Insights</span><span class="mega-nav-chevron" aria-hidden="true"></span></button>
      <div class="mega-menu-panel mega-menu-panel--insights" id="mega-menu-project-insights" aria-hidden="true" inert>
        <div class="mega-menu-intro mega-menu-intro--compact"><span class="mega-menu-kicker">Evidence & thinking</span><h2>Review governed work and practical analysis.</h2></div>
        <div class="mega-insight-links"><a href="/case-studies"><span class="mega-insight-index">01</span><strong>Case Studies</strong><small>Records published after evidence review.</small><span class="mega-insight-arrow" aria-hidden="true">→</span></a><a href="/insights"><span class="mega-insight-index">02</span><strong>Insights</strong><small>Analysis on growth, operations, technology and leadership.</small><span class="mega-insight-arrow" aria-hidden="true">→</span></a></div>
      </div>
    </div>
    <a class="mega-nav-link mega-nav-contact" href="/contact">Contact Us</a>
  </nav>`;
}

function preRenderNavigation(source) {
  if (!/<nav[^>]+id=["']site-nav["']/i.test(source)) return source;
  let output = source.replace(/<nav[^>]+id=["']site-nav["'][^>]*>[\s\S]*?<\/nav>/i, megaNavigationHtml());
  output = output.replace(/\s*<a[^>]+class=["'][^"']*header-cta(?:-mobile)?[^"']*["'][^>]*>[\s\S]*?<\/a>/gi, "");
  return output;
}

let updated = 0;
let unchanged = 0;
let repaired = 0;

for (const file of filesRecursively(frontendDirectory, /\.(?:html?|css|js)$/i)) {
  const source = fs.readFileSync(file, "utf8");
  let output = removeObsoleteRuntimeRepairs(repairSource(source), file);
  if (output !== source) repaired += 1;

  if (/\.html?$/i.test(file)) {
    output = preRenderNavigation(output);
    const openingHead = output.match(/<head(?:\s[^>]*)?>/i);
    if (!openingHead) throw new Error(`Cannot prepare page: no <head> element in ${path.relative(process.cwd(), file)}`);
    if (!output.includes(teamMarker)) output = output.replace(openingHead[0], `${openingHead[0]}${jamHead}`);
    else if (!output.includes(metadataMarker)) output = output.replace(/<\/head>/i, `  <script type="module" src="/assets/js/jam-metadata.js"></script>\n</head>`);
    const styles = styleBlockFor(output);
    if (styles) output = output.replace(/<\/head>/i, `${styles}\n</head>`);
    const sharedScripts = [];
    if (!output.includes(brandResilienceMarker)) sharedScripts.push('  <script src="/assets/js/brand-resilience.js" defer></script>');
    if (!output.includes(designSystemMarker)) sharedScripts.push('  <script src="/assets/js/design-system.js" defer></script>');
    if (sharedScripts.length) output = output.replace(/<\/body>/i, `${sharedScripts.join("\n")}\n</body>`);
  }

  if (output === source) { unchanged += 1; continue; }
  fs.writeFileSync(file, output, "utf8");
  updated += 1;
}

console.log(`Prepared ${updated} frontend file(s); ${unchanged} unchanged; ${repaired} source repair(s).`);
