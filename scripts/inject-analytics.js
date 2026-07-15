const fs = require("node:fs");
const path = require("node:path");

const frontendDirectory = path.join(__dirname, "..", "frontend");
const SCRIPT = '<script type="module" src="/assets/js/analytics-events.js"></script>';

function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return files(target);
    return entry.isFile() && /\.html?$/i.test(entry.name) ? [target] : [];
  });
}

let updated = 0;
for (const file of files(frontendDirectory)) {
  const source = fs.readFileSync(file, "utf8");
  if (source.includes("/assets/js/analytics-events.js")) continue;
  const output = source.replace(/<\/body>/i, `${SCRIPT}\n</body>`);
  if (output === source) throw new Error(`Unable to inject analytics module into ${path.relative(frontendDirectory, file)}`);
  fs.writeFileSync(file, output, "utf8");
  updated += 1;
}

console.log(`Consent-aware analytics module injected into ${updated} HTML file(s).`);
