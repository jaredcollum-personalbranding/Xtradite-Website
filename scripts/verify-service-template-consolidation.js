import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

const files = {
  html: read("frontend/service-detail.html"),
  client: read("frontend/assets/js/pages/service-detail.js"),
  enhancement: read("frontend/assets/js/pages/service-page-enhancements.js"),
  server: read("api/content-page.js"),
  selects: read("api/lib/supabase.js"),
  schema: read("api/lib/schema/index.js"),
  migration: read("supabase/migrations/20260714183500_service_delivery_governance_fields.sql"),
};

const failures = [];
const requirePattern = (content, pattern, message) => { if (!pattern.test(content)) failures.push(message); };
const rejectPattern = (content, pattern, message) => { if (pattern.test(content)) failures.push(message); };

requirePattern(files.html, /service-page\.css/, "Service interaction CSS must load before first paint.");
requirePattern(files.client, /service-page-enhancements\.js/, "Service detail must use the single enhancement module.");
requirePattern(files.client, /enhanceServicePage\(\)/, "Service enhancements must run after CMS content is rendered.");
rejectPattern(files.client, /service-(?:locations|template-v3|experience|content-architecture|delivery-timeline)\.js/, "Obsolete service enhancement imports must not return.");

for (const file of [
  "frontend/assets/js/pages/service-locations.js",
  "frontend/assets/css/service-locations.css",
  "frontend/assets/js/pages/service-template-v3.js",
  "frontend/assets/js/pages/service-experience.js",
  "frontend/assets/js/pages/service-content-architecture.js",
  "frontend/assets/js/pages/service-delivery-timeline.js",
]) {
  if (exists(file)) failures.push(`${file} must remain removed.`);
}

requirePattern(files.enhancement, /aria-controls/, "Enhanced FAQ and process controls require aria-controls.");
requirePattern(files.enhancement, /aria-expanded/, "Enhanced FAQ and process controls require aria-expanded.");
requirePattern(files.enhancement, /IntersectionObserver/, "Desktop process activation must use the existing CMS steps without hardcoded phases.");
rejectPattern(files.enhancement, /Discover|Assess|Design|Deliver|Optimise/, "Enhancement code must not hardcode process labels.");

requirePattern(files.server, /canonicalFor\(item, config, slug\)/, "Server renderer must use the governed canonical resolver.");
requirePattern(files.server, /robotsFor\(item\)/, "Server renderer must use the governed robots resolver.");
requirePattern(files.server, /X-Robots-Tag/, "Server responses must carry an X-Robots-Tag.");
requirePattern(files.selects, /canonical_path/, "Server delivery selects must include canonical_path.");
requirePattern(files.selects, /primary_entity,about_entities,mention_entities/, "Server delivery selects must include governed entity fields.");
requirePattern(files.schema, /normaliseEntityList/, "Service schema must validate CMS entity lists.");
requirePattern(files.migration, /c\.public_approval_status = 'approved'/, "Service relationships must include only approved case studies.");
rejectPattern(files.migration, /'metric',\s*c\.metric/, "Service delivery must not redistribute case-study metrics.");

if (failures.length) {
  console.error("Service template consolidation verification failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("Service template consolidation verification passed.");
