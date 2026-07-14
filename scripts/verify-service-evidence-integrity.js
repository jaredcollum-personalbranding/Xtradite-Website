import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "frontend/service-detail.html",
  "frontend/assets/js/pages/service-detail.js",
];

const forbidden = [
  { pattern: /6\s*[–-]\s*12\s*wk/i, reason: "unsupported delivery window" },
  { pattern: /30%\+/i, reason: "unsupported time-saving claim" },
  { pattern: /hours released/i, reason: "fabricated capacity model" },
  { pattern: /capacity gain/i, reason: "fabricated capacity model" },
  { pattern: /capacity released/i, reason: "fabricated capacity model" },
  { pattern: /indicative leverage/i, reason: "fabricated leverage model" },
  { pattern: /payback(?:\s+period|\s+horizon)?/i, reason: "fabricated payback model" },
  { pattern: /relatedCaseStudy\.metric/, reason: "unreviewed case-study metric reuse" },
  { pattern: /service-template-v3\.js/, reason: "obsolete service override import" },
  { pattern: /service-content-architecture\.js/, reason: "obsolete process override import" },
  { pattern: /service-experience\.js/, reason: "obsolete ROI override import" },
  { pattern: /service-delivery-timeline\.js/, reason: "obsolete timeline override import" },
];

const failures = [];
for (const relativePath of files) {
  const absolutePath = path.join(root, relativePath);
  const content = fs.readFileSync(absolutePath, "utf8");
  for (const rule of forbidden) {
    if (rule.pattern.test(content)) {
      failures.push(`${relativePath}: ${rule.reason}`);
    }
  }
}

const removedModules = [
  "frontend/assets/js/pages/service-template-v3.js",
  "frontend/assets/js/pages/service-content-architecture.js",
  "frontend/assets/js/pages/service-experience.js",
  "frontend/assets/js/pages/service-delivery-timeline.js",
];
for (const relativePath of removedModules) {
  if (fs.existsSync(path.join(root, relativePath))) {
    failures.push(`${relativePath}: obsolete override module still exists`);
  }
}

if (failures.length) {
  console.error("Service evidence-integrity verification failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("Service evidence-integrity verification passed.");
