import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const files = {
  home: read("frontend/assets/js/pages/home.js"),
  index: read("frontend/assets/js/pages/case-studies.js"),
  detail: read("frontend/assets/js/pages/case-study-detail.js"),
  service: read("frontend/assets/js/pages/service-detail.js"),
  experience: read("frontend/assets/js/pages/case-study-experience.js"),
  migration: read("supabase/migrations/20260714181500_case_study_evidence_publication_gate.sql"),
};

const failures = [];
const reject = (condition, message) => { if (condition) failures.push(message); };

reject(/item\.metric|primary\.metric/.test(files.home), "Homepage must not render legacy case-study metrics.");
reject(/item\.metric/.test(files.index), "Case-study index must not render legacy metrics.");
reject(/relatedCaseStudy\.metric/.test(files.service), "Service pages must not reuse related-case-study metrics.");
reject(/<span class=\"metric\">/.test(files.index + files.home + files.service), "Public cards must not contain metric badges.");
reject(/extractCadence|parseBeforeAfter|parsePercentageChange|indexed baseline/i.test(files.experience), "Evidence UI must not infer missing baselines, cadence or chart narratives.");
reject(!/public_approval_status/.test(files.migration), "Migration must require public case-study approval.");
reject(!/public_primary_metric_approved/.test(files.migration), "Migration must gate the legacy primary metric.");
reject(!/public_evidence_status/.test(files.migration), "Migration must gate individual metrics.");
reject(!/public_approval_status = 'approved'/.test(files.migration), "Delivery and sitemap queries must fail closed unless approved.");
reject(!/item\.publicApprovalStatus !== \"approved\"/.test(files.detail), "Detail renderer must defensively reject unapproved records.");

if (failures.length) {
  console.error("Case-study evidence-gate verification failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("Case-study evidence-gate verification passed.");
