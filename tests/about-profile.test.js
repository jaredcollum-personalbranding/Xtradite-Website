const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const about = fs.readFileSync(path.join(__dirname, "..", "frontend", "about.html"), "utf8");
const injectSeo = fs.readFileSync(path.join(__dirname, "..", "scripts", "inject-seo.js"), "utf8");

test("founder profile contains current evidence-safe professional context", () => {
  assert.match(about, /Jared Collum/);
  assert.match(about, /Founder and Digital Consultant/);
  assert.match(about, /Shopify Technical Partner/);
  assert.match(about, /Klaviyo Partner/);
  assert.match(about, /Read published insights|insights archive/i);
  assert.doesNotMatch(about, /PROMIXX|Present<|Revenue Influenced|\+65%|700%|200%|£40M|Â£|â€”|â†’/i);
  assert.doesNotMatch(about, /placeholder|add your real LinkedIn URL/i);
});

test("About build emits connected AboutPage and ProfilePage types", () => {
  assert.match(injectSeo, /\["AboutPage", "ProfilePage"\]/);
  assert.match(injectSeo, /PERSON_ID/);
});
