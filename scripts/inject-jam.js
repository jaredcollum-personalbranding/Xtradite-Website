const fs = require("node:fs");
const path = require("node:path");

const frontendDirectory = path.join(__dirname, "..", "frontend");
const marker = 'name="jam:team"';
const jamHead = `
  <meta name="jam:team" content="e8e1b81a-519b-40e4-9720-4d2182dbc6da" />
  <script type="module" src="https://js.jam.dev/recorder.js"></script>
  <script type="module" src="https://js.jam.dev/capture.js"></script>`;

function htmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(target);
    return entry.isFile() && /\.html?$/i.test(entry.name) ? [target] : [];
  });
}

let updated = 0;
let unchanged = 0;

for (const file of htmlFiles(frontendDirectory)) {
  const source = fs.readFileSync(file, "utf8");
  if (source.includes(marker)) {
    unchanged += 1;
    continue;
  }

  const openingHead = source.match(/<head(?:\s[^>]*)?>/i);
  if (!openingHead) {
    throw new Error(`Cannot install Jam: no <head> element in ${path.relative(process.cwd(), file)}`);
  }

  const output = source.replace(openingHead[0], `${openingHead[0]}${jamHead}`);
  fs.writeFileSync(file, output, "utf8");
  updated += 1;
}

console.log(`Jam head installed in ${updated} static page(s); ${unchanged} page(s) already contained it.`);
