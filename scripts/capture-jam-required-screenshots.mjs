import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.JAM_BASE_URL || "http://127.0.0.1:4173";
const artifactRoot = path.resolve(process.env.JAM_ARTIFACT_DIR || "artifacts/jam-acceptance");
const screenshotsRoot = path.join(artifactRoot, "screenshots", "required");
const reportPath = path.join(artifactRoot, "report.json");

await mkdir(screenshotsRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
const captured = [];

try {
  const home = await context.newPage();
  await home.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await home.locator("#featured-work-root").waitFor({ state: "visible", timeout: 15_000 });
  const trigger = home.locator(".mega-nav-trigger").first();
  await trigger.click();
  await home.locator('.mega-menu-panel[aria-hidden="false"]').first().waitFor({ state: "visible", timeout: 5_000 });
  await home.screenshot({ path: path.join(screenshotsRoot, "mega-menu-desktop.png"), fullPage: false });
  captured.push("required/mega-menu-desktop.png");
  await home.close();

  const service = await context.newPage();
  await service.goto(`${baseUrl}/service-detail?slug=ai-automation`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await service.locator("#service-detail-root:not([hidden])").waitFor({ state: "visible", timeout: 15_000 });

  const processSection = service.locator("#how-it-works-section").first();
  await processSection.waitFor({ state: "visible", timeout: 5_000 });
  await processSection.scrollIntoViewIfNeeded();
  await processSection.screenshot({ path: path.join(screenshotsRoot, "service-process-desktop.png") });
  captured.push("required/service-process-desktop.png");

  const technologySection = service.locator("#tech-section").first();
  await technologySection.waitFor({ state: "visible", timeout: 5_000 });
  await technologySection.scrollIntoViewIfNeeded();
  await technologySection.screenshot({ path: path.join(screenshotsRoot, "service-technology-desktop.png") });
  captured.push("required/service-technology-desktop.png");
  await service.close();

  const unavailableCase = await context.newPage();
  await unavailableCase.goto(`${baseUrl}/case-study-detail?slug=fast-growth-fashion-retailer`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  const unavailable = unavailableCase.locator("#not-found:not([hidden])").first();
  await unavailable.waitFor({ state: "visible", timeout: 15_000 });
  await unavailable.screenshot({ path: path.join(screenshotsRoot, "case-study-unavailable-desktop.png") });
  captured.push("required/case-study-unavailable-desktop.png");
  await unavailableCase.close();
} finally {
  await context.close();
  await browser.close();
}

const report = JSON.parse(await readFile(reportPath, "utf8"));
report.screenshots = Array.from(new Set([...(report.screenshots || []), ...captured]));
await writeFile(reportPath, JSON.stringify(report, null, 2));

const markdownPath = path.join(artifactRoot, "report.md");
let markdown = await readFile(markdownPath, "utf8");
markdown = markdown.replace(/- Screenshots: \d+/, `- Screenshots: ${report.screenshots.length}`);
await writeFile(markdownPath, markdown);

console.log(`Captured ${captured.length} required evidence screenshot(s); ${report.screenshots.length} screenshots recorded.`);
