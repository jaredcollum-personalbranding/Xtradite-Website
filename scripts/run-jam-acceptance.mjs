import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const localBase = process.env.JAM_BASE_URL || "http://127.0.0.1:4173";
const productionBase = process.env.JAM_BEFORE_URL || "https://www.xtradite-digital.co.uk";
const artifactRoot = path.resolve(process.env.JAM_ARTIFACT_DIR || "artifacts/jam-acceptance");
const screenshotsRoot = path.join(artifactRoot, "screenshots");

const viewports = [
  { name: "1536x826", width: 1536, height: 826 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "430x932", width: 430, height: 932 },
  { name: "390x844", width: 390, height: 844 },
  { name: "360x800", width: 360, height: 800 },
];

const pages = [
  { name: "homepage", path: "/", ready: "#featured-work-root" },
  { name: "service", path: "/service-detail?slug=ai-automation", ready: "#service-detail-root:not([hidden])" },
  { name: "case-study-unavailable", path: "/case-study-detail?slug=fast-growth-fashion-retailer", ready: "#not-found:not([hidden])" },
  { name: "case-studies", path: "/case-studies", ready: "main" },
  { name: "industry", path: "/industry-detail?slug=retail", ready: "#industry-detail-root:not([hidden])" },
];

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: localBase,
  productionComparisonUrl: productionBase,
  viewports: {},
  interactionChecks: [],
  reducedMotionChecks: [],
  consoleErrors: [],
  requestFailures: [],
  failures: [],
  screenshots: [],
};

function recordCheck(group, name, passed, detail = "") {
  report[group].push({ name, passed, detail });
  if (!passed) report.failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

async function ensureDirectory(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function screenshot(page, relativePath, options = {}) {
  const target = path.join(screenshotsRoot, relativePath);
  await ensureDirectory(target);
  if (options.selector) {
    const locator = page.locator(options.selector).first();
    if (!(await locator.count()) || !(await locator.isVisible())) return false;
    await locator.screenshot({ path: target });
  } else {
    await page.screenshot({ path: target, fullPage: options.fullPage !== false });
  }
  report.screenshots.push(relativePath);
  return true;
}

function attachDiagnostics(page, label) {
  page.on("pageerror", (error) => report.consoleErrors.push({ page: label, type: "pageerror", message: error.message }));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/Cookiebot|adsbygoogle|ERR_BLOCKED_BY_CLIENT|Failed to load resource/i.test(text)) return;
    report.consoleErrors.push({ page: label, type: "console", message: text });
  });
  page.on("requestfailed", (request) => {
    if (!request.url().startsWith(localBase)) return;
    report.requestFailures.push({ page: label, url: request.url(), error: request.failure()?.errorText || "Request failed" });
  });
}

async function waitForReady(page, definition) {
  await page.goto(`${localBase}${definition.path}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.locator(definition.ready).first().waitFor({ state: "visible", timeout: 15_000 });
  await page.waitForTimeout(800);
}

async function layoutAudit(page) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
    };
    const ignored = (element) => element.matches([
      "svg", "path", "defs", "script", "style", "link", "meta",
      "[aria-hidden='true']", "[hidden]", "[inert]", ".mega-menu-panel:not([aria-hidden='false'])",
      ".site-nav", ".deck-player-progress", "[data-horizontal-scroll]",
    ].join(",")) || Boolean(element.closest("[hidden],[inert],.mega-menu-panel[aria-hidden='true']"));

    const overflow = [];
    document.querySelectorAll("body *").forEach((element) => {
      if (!(element instanceof HTMLElement) || ignored(element) || !visible(element)) return;
      const rect = element.getBoundingClientRect();
      const horizontalContentOverflow = element.scrollWidth > element.clientWidth + 3 && getComputedStyle(element).overflowX === "visible";
      const viewportOverflow = rect.right > viewportWidth + 3 || rect.left < -3;
      if (horizontalContentOverflow || viewportOverflow) {
        overflow.push({
          selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${element.classList.length ? `.${Array.from(element.classList).slice(0, 3).join(".")}` : ""}`,
          rect: { left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) },
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
        });
      }
    });

    const headingOverflow = Array.from(document.querySelectorAll("h1,h2,h3"))
      .filter((element) => visible(element) && !ignored(element))
      .map((element) => ({ text: element.textContent.trim().slice(0, 100), rect: element.getBoundingClientRect() }))
      .filter(({ rect }) => rect.left < -2 || rect.right > viewportWidth + 2)
      .map(({ text, rect }) => ({ text, left: Math.round(rect.left), right: Math.round(rect.right) }));

    return {
      overflow: overflow.slice(0, 25),
      headingOverflow,
      bodyScrollWidth: document.body.scrollWidth,
      viewportWidth,
    };
  });
}

async function runViewportMatrix(browser) {
  for (const viewport of viewports) {
    report.viewports[viewport.name] = {};
    const context = await browser.newContext({ viewport, colorScheme: "light" });
    for (const definition of pages) {
      const page = await context.newPage();
      const label = `${definition.name}@${viewport.name}`;
      attachDiagnostics(page, label);
      try {
        await waitForReady(page, definition);
        const audit = await layoutAudit(page);
        report.viewports[viewport.name][definition.name] = audit;
        if (audit.headingOverflow.length) report.failures.push(`${label} has heading overflow: ${JSON.stringify(audit.headingOverflow)}`);
        if (audit.bodyScrollWidth > audit.viewportWidth + 3) report.failures.push(`${label} body width ${audit.bodyScrollWidth}px exceeds viewport ${audit.viewportWidth}px`);
        await screenshot(page, `matrix/${viewport.name}/${definition.name}.png`);
      } catch (error) {
        report.failures.push(`${label} failed: ${error.message}`);
      } finally {
        await page.close();
      }
    }
    await context.close();
  }
}

async function runInteractionChecks(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });

  const home = await context.newPage();
  attachDiagnostics(home, "interactions-home");
  await waitForReady(home, pages[0]);
  const trigger = home.locator(".mega-nav-trigger").first();
  await trigger.click();
  recordCheck("interactionChecks", "Mega-menu opens above content", await trigger.getAttribute("aria-expanded") === "true");
  await screenshot(home, "required/mega-menu-desktop.png", { selector: ".site-header" });
  await home.keyboard.press("Escape");
  recordCheck("interactionChecks", "Escape closes the mega-menu", await trigger.getAttribute("aria-expanded") === "false");
  await screenshot(home, "required/homepage-hero-desktop.png", { selector: ".home-hero" });
  await screenshot(home, "required/homepage-featured-work-desktop.png", { selector: "#featured-work-root" });

  const service = await context.newPage();
  attachDiagnostics(service, "interactions-service");
  await waitForReady(service, pages[1]);
  const process = service.locator("#service-how-it-works");
  const triggers = process.locator(".service-process-trigger");
  const triggerCount = await triggers.count();
  recordCheck("interactionChecks", "Service process controls are present", triggerCount >= 3, `Found ${triggerCount}`);
  if (triggerCount) {
    recordCheck("interactionChecks", "First service process step is selected initially", await triggers.first().getAttribute("aria-expanded") === "true");
    await triggers.first().focus();
    await service.keyboard.press("ArrowRight");
    recordCheck("interactionChecks", "Arrow keys move service process selection", await triggers.nth(1).getAttribute("aria-expanded") === "true");
  }
  await screenshot(service, "required/service-process-desktop.png", { selector: "#how-it-works-section" });
  await screenshot(service, "required/service-technology-desktop.png", { selector: "#tech-section" });
  const faq = service.locator(".faq-question").first();
  if (await faq.count()) {
    await faq.click();
    recordCheck("interactionChecks", "FAQ control exposes expanded state", await faq.getAttribute("aria-expanded") === "true");
    await screenshot(service, "required/faq-desktop.png", { selector: "#faq-section" });
  }
  recordCheck("interactionChecks", "Only one service process panel is expanded", await service.locator(".service-process-step.is-active").count() <= 1);

  const unavailableCase = await context.newPage();
  attachDiagnostics(unavailableCase, "interactions-case-study-unavailable");
  await waitForReady(unavailableCase, pages[2]);
  recordCheck("interactionChecks", "Unapproved case-study detail remains unavailable", await unavailableCase.locator("#case-study-detail-root").isHidden());
  const leakedMetric = await unavailableCase.locator("body").textContent();
  recordCheck("interactionChecks", "Unavailable case-study page exposes no blocked metric", !/[+-]?\d+(?:\.\d+)?%/.test(leakedMetric || ""));
  await screenshot(unavailableCase, "required/case-study-unavailable-desktop.png", { selector: "#not-found" });

  const caseStudies = await context.newPage();
  attachDiagnostics(caseStudies, "interactions-case-studies");
  await waitForReady(caseStudies, pages[3]);
  await screenshot(caseStudies, "required/case-studies-presentation-desktop.png", { selector: "main" });

  await Promise.all([home.close(), service.close(), unavailableCase.close(), caseStudies.close()]);
  await context.close();
}

async function runReducedMotionChecks(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const service = await context.newPage();
  await waitForReady(service, pages[1]);
  const mode = await service.locator("#service-how-it-works").getAttribute("data-delivery-mode").catch(() => null);
  recordCheck("reducedMotionChecks", "Service process remains manual under reduced motion", mode === "manual", `Mode: ${mode}`);

  const unavailableCase = await context.newPage();
  await waitForReady(unavailableCase, pages[2]);
  recordCheck("reducedMotionChecks", "Unavailable case study stays fail-closed under reduced motion", await unavailableCase.locator("#case-study-detail-root").isHidden());
  await context.close();
}

async function captureBeforeAfter(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
  const comparisons = [
    ["homepage", "/", "/"],
    ["service", "/services/ai-automation", "/service-detail?slug=ai-automation"],
    ["case-study-unavailable", "/case-studies/fast-growth-fashion-retailer", "/case-study-detail?slug=fast-growth-fashion-retailer"],
  ];
  for (const [name, beforePath, afterPath] of comparisons) {
    const before = await context.newPage();
    try {
      await before.goto(`${productionBase}${beforePath}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await before.waitForTimeout(1_000);
      await screenshot(before, `comparison/before-${name}.png`);
    } catch (error) {
      report.failures.push(`Before screenshot for ${name} failed: ${error.message}`);
    } finally {
      await before.close();
    }
    const after = await context.newPage();
    try {
      await after.goto(`${localBase}${afterPath}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await after.waitForTimeout(1_000);
      await screenshot(after, `comparison/after-${name}.png`);
    } finally {
      await after.close();
    }
  }
  await context.close();
}

function markdownSummary() {
  const passedInteractions = report.interactionChecks.filter((check) => check.passed).length;
  const passedMotion = report.reducedMotionChecks.filter((check) => check.passed).length;
  return `# Jam acceptance report\n\nGenerated: ${report.generatedAt}\n\n## Matrix\n\n- Viewports: ${viewports.length}\n- Pages per viewport: ${pages.length}\n- Screenshots: ${report.screenshots.length}\n- Interaction checks passed: ${passedInteractions}/${report.interactionChecks.length}\n- Reduced-motion checks passed: ${passedMotion}/${report.reducedMotionChecks.length}\n- Console errors: ${report.consoleErrors.length}\n- Local request failures: ${report.requestFailures.length}\n- Failures: ${report.failures.length}\n\n## Failures\n\n${report.failures.length ? report.failures.map((failure) => `- ${failure}`).join("\n") : "None."}\n`;
}

await mkdir(artifactRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  await runViewportMatrix(browser);
  await runInteractionChecks(browser);
  await runReducedMotionChecks(browser);
  await captureBeforeAfter(browser);
} finally {
  await browser.close();
}

if (report.consoleErrors.length) report.failures.push(`${report.consoleErrors.length} application console error(s) recorded`);
if (report.requestFailures.length) report.failures.push(`${report.requestFailures.length} local request failure(s) recorded`);
await writeFile(path.join(artifactRoot, "report.json"), JSON.stringify(report, null, 2));
await writeFile(path.join(artifactRoot, "report.md"), markdownSummary());

console.log(markdownSummary());
if (report.failures.length) process.exitCode = 1;
