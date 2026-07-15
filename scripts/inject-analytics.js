const fs = require("node:fs");
const path = require("node:path");

const frontendDirectory = path.join(__dirname, "..", "frontend");
const scripts = [
  {
    marker: "/assets/js/menu-state-preserver.js",
    tag: '<script src="/assets/js/menu-state-preserver.js" defer></script>'
  },
  {
    marker: "/assets/js/analytics-events.js",
    tag: '<script type="module" src="/assets/js/analytics-events.js"></script>'
  }
];

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
  let output = source;
  for (const script of scripts) {
    if (!output.includes(script.marker)) output = output.replace(/<\/body>/i, `${script.tag}\n</body>`);
  }
  if (output === source) continue;
  if (!/<\/body>/i.test(source)) throw new Error(`Unable to inject shared modules into ${path.relative(frontendDirectory, file)}`);
  fs.writeFileSync(file, output, "utf8");
  updated += 1;
}

console.log(`Shared navigation-state and analytics modules injected into ${updated} HTML file(s).`);
