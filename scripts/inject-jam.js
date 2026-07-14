const fs = require("node:fs");
const path = require("node:path");

const frontendDirectory = path.join(__dirname, "..", "frontend");
const teamMarker = 'name="jam:team"';
const metadataMarker = 'src="/assets/js/jam-metadata.js"';
const designSystemMarker = 'src="/assets/js/design-system.js"';

const jamHead = `
  <meta name="jam:team" content="e8e1b81a-519b-40e4-9720-4d2182dbc6da" />
  <script type="module" src="https://js.jam.dev/recorder.js"></script>
  <script type="module" src="https://js.jam.dev/capture.js"></script>
  <script type="module" src="/assets/js/jam-metadata.js"></script>`;

const sharedStyles = [
  ["xtradite-brand-logo-css", "/assets/css/brand-logo.css?v=20260714"],
  ["xtradite-mobile-css", "/assets/css/mobile.css?v=20260714"],
  ["xtradite-tabs-css", "/assets/css/tabs.css?v=20260714"],
  ["xtradite-mega-menu-css", "/assets/css/mega-menu.css?v=20260714"],
  ["xtradite-enquiry-css", "/assets/css/enquiry.css?v=20260714"],
  ["service-content-architecture-css", "/assets/css/service-content-architecture.css?v=20260714"],
  ["service-delivery-timeline-css", "/assets/css/service-delivery-timeline-v2.css?v=20260714"],
  ["service-template-v3-css", "/assets/css/service-template-v3.css?v=20260714"],
  ["case-study-experience-css", "/assets/css/case-study-experience.css?v=20260714"],
  ["xtradite-jam-refinement-css", "/assets/css/jam-refinement.css?v=20260714-2"],
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

function removeObsoleteRuntimeRepairs(source, file) {
  if (path.basename(file) !== "site.js") return source;
  return source
    .replace(/\n\s*function loadStylesheet\(datasetName, href\) \{[\s\S]*?loadStylesheet\("xtradite-jam-refinement-css"[^\n]*\);\n/, "\n")
    .replace(/\n\s*function repairKnownMojibake\(root = document\) \{[\s\S]*?\n\s*\}\n/, "\n")
    .replace(/^\s*repairKnownMojibake\([^;]*\);\s*$/gm, "");
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
    if (!output.includes(designSystemMarker)) output = output.replace(/<\/body>/i, `  <script src="/assets/js/design-system.js" defer></script>\n</body>`);
  }

  if (output === source) { unchanged += 1; continue; }
  fs.writeFileSync(file, output, "utf8");
  updated += 1;
}

console.log(`Prepared ${updated} frontend file(s); ${unchanged} unchanged; ${repaired} source repair(s).`);
