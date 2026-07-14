import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

const home = read("frontend/index.html");
const injector = read("scripts/inject-jam.js");
const acceptance = read("docs/jam-remediation-acceptance.md");
const packageJson = read("package.json");

const failures = [];
const reject = (pattern, content, message) => { if (pattern.test(content)) failures.push(message); };
const requirePattern = (pattern, content, message) => { if (!pattern.test(content)) failures.push(message); };

reject(/£50M\+|100\+|15\+[^<]*years|Revenue influenced|Projects delivered/i, home, "Unsupported homepage proof figures must remain removed.");
reject(/Sarah Whitfield|Daniel Okafor|Priya Anand|Sample testimonials/i, home, "Placeholder testimonials must not be present.");
reject(/three to nine months|director-level ownership|Average time saved/i, home, "Unsupported homepage FAQ claims must remain removed.");
reject(/data-count-to=/i, home, "Homepage must not animate unsupported proof numbers.");
requirePattern(/How engagements are governed/, home, "Homepage must explain evidence, ownership and delivery boundaries.");
requirePattern(/Evidence is published only after review/, home, "Homepage must explain the approved-only case-study state.");

for (const file of [
  "frontend/assets/css/service-content-architecture.css",
  "frontend/assets/css/service-delivery-timeline-v2.css",
  "frontend/assets/css/service-template-v3.css",
]) {
  if (exists(file)) failures.push(`${file} must remain removed.`);
}

requirePattern(/data-mega-static/, injector, "Build must pre-render the mega navigation.");
requirePattern(/preRenderNavigation/, injector, "Build must replace simple source navigation before deployment.");
reject(/service-content-architecture-css|service-delivery-timeline-css|service-template-v3-css/, injector, "Build must not inject retired service styles.");
requirePattern(/Original design feedback/, acceptance, "Manual acceptance document must cite the original Jam.");
requirePattern(/Post-release verification/, acceptance, "Manual acceptance document must cite the verification Jam.");
requirePattern(/Do not close issue #66 solely because automated checks pass/, acceptance, "Manual acceptance must remain an explicit close condition.");
requirePattern(/check:jam-remediation/, packageJson, "Final Jam regression check must run in the verification pipeline.");

if (failures.length) {
  console.error("Jam remediation verification failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("Jam remediation verification passed.");
