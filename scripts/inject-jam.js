const fs = require("node:fs");
const path = require("node:path");

const frontendDirectory = path.join(__dirname, "..", "frontend");
const teamMarker = 'name="jam:team"';
const metadataMarker = 'src="/assets/js/jam-metadata.js"';
const designSystemMarker = 'src="/assets/js/design-system.js"';
const brandResilienceMarker = 'src="/assets/js/brand-resilience.js"';
const assetVersion = "20260714-3";

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
  ["service-content-architecture-css", `/assets/css/service-content-architecture.css?v=${assetVersion}`],
  ["service-delivery-timeline-css", `/assets/css/service-delivery-timeline-v2.css?v=${assetVersion}`],
  ["service-template-v3-css", `/assets/css/service-template-v3.css?v=${assetVersion}`],
  ["case-study-experience-css", `/assets/css/case-study-experience.css?v=${assetVersion}`],
  ["xtradite-jam-refinement-css", `/assets/css/jam-refinement.css?v=${assetVersion}`],
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

    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }
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

  let output = source.replace(
    /\n\s*const currentScript = document\.currentScript;[\s\S]*?new URL\("\/assets\/js\/", window\.location\.origin\);\n/,
    "\n",
  );
  output = removeNamedFunction(output, "loadStylesheet");
  output = removeNamedFunction(output, "repairKnownMojibake");
  output = output
    .replace(/^\s*loadStylesheet\([^;]+;\s*$/gm, "")
    .replace(/^\s*repairKnownMojibake\([^;]*\);\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n");

  if (/loadStylesheet|repairKnownMojibake|\bscriptBase\b/.test(output)) {
    throw new Error("site.js still contains obsolete runtime CSS or encoding-repair code after preparation");
  }

  return output;
}

function styleBlockFor(source) {
  return sharedStyles.filter(([marker]) => !source.includes(`data-${marker}`))
    .map(([marker, href]) => `  <link rel="stylesheet" href="${href}" data-${marker}>`).join("\n");
}

let updated = 0;
let unchanged = 0;
let repaired = 0;

for (const file of filesRecursively(frontendDirectory, /\.(?:html?|css|js)$/i)) {
  const source = fs.readFileSync(file, "utf8");
  let output = removeObsoleteRuntimeRepairs(repairSource(source), file);
  if (output !== source) repaired += 1;

  if (/\.html?$/i.test(file)) {
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
