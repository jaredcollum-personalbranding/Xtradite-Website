import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.JAM_BASE_URL || "http://127.0.0.1:4173";
const outputDirectory = path.resolve(process.env.JAM_ARTIFACT_DIR || "artifacts/jam-acceptance");

const routes = [
  { name: "homepage", path: "/", ready: "main" },
  { name: "service", path: "/service-detail?slug=ai-automation", ready: "#service-detail-root:not([hidden])" },
  { name: "case-study-unavailable", path: "/case-study-detail?slug=fast-growth-fashion-retailer", ready: "#not-found:not([hidden])" },
];

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const report = {
  generatedAt: new Date().toISOString(),
  checks: [],
  failures: [],
  contrastSamples: [],
  touchTargets: [],
  keyboardTraversal: [],
};

function record(name, passed, detail = "") {
  report.checks.push({ name, passed, detail });
  if (!passed) report.failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

async function waitForRoute(page, route) {
  await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.locator(route.ready).first().waitFor({ state: "visible", timeout: 15_000 });
  await page.waitForTimeout(800);
}

async function keyboardAudit(page, label) {
  const visited = [];
  await page.evaluate(() => {
    document.body.tabIndex = -1;
    document.body.focus();
  });
  for (let index = 0; index < 45; index += 1) {
    await page.keyboard.press("Tab");
    const state = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement) || element === document.body) return null;
      const style = getComputedStyle(element);
      return {
        tag: element.tagName.toLowerCase(),
        id: element.id,
        className: element.className,
        text: element.textContent?.trim().slice(0, 80) || element.getAttribute("aria-label") || "",
        hiddenAncestor: Boolean(element.closest('[hidden],[inert],[aria-hidden="true"]')),
        outline: `${style.outlineStyle} ${style.outlineWidth}`,
        boxShadow: style.boxShadow,
      };
    });
    if (state) visited.push(state);
  }

  const hiddenFocus = visited.filter((item) => item.hiddenAncestor);
  const controls = visited.filter((item) => ["a", "button", "input", "textarea", "select", "summary"].includes(item.tag));
  const missingFocusIndicator = controls.filter((item) => {
    const noOutline = item.outline.startsWith("none") || item.outline.endsWith("0px");
    const noShadow = !item.boxShadow || item.boxShadow === "none";
    return noOutline && noShadow;
  });

  report.keyboardTraversal.push({ label, visited: visited.length, hiddenFocus, missingFocusIndicator: missingFocusIndicator.slice(0, 10) });
  record(`${label}: keyboard traversal reaches interactive controls`, controls.length >= 5, `Visited ${controls.length} controls`);
  record(`${label}: keyboard focus never enters hidden or inert content`, hiddenFocus.length === 0, hiddenFocus.map((item) => item.text).join(", "));
  record(`${label}: focused controls expose a visible indicator`, missingFocusIndicator.length === 0, missingFocusIndicator.map((item) => item.text).join(", "));
}

async function touchTargetAudit(page, label) {
  const selectors = [
    ".btn",
    ".mega-nav-trigger",
    ".nav-toggle",
    ".faq-question",
    "summary",
    ".service-process-trigger",
    "[data-deck-toggle]",
    "[data-deck-prev]",
    "[data-deck-next]",
  ];
  const results = await page.evaluate((targetSelectors) => {
    const seen = new Set();
    return targetSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)).map((element) => {
      if (!(element instanceof HTMLElement)) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const visible = style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0 && !element.closest('[hidden],[inert],[aria-hidden="true"]');
      if (!visible) return null;
      const key = `${selector}:${element.id}:${element.textContent?.trim().slice(0, 50)}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return {
        selector,
        label: element.getAttribute("aria-label") || element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) || element.id,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    })).filter(Boolean);
  }, selectors);

  const failures = results.filter((target) => target.width < 44 || target.height < 44);
  report.touchTargets.push({ label, tested: results.length, failures });
  record(`${label}: primary controls meet 44px touch-target guidance`, failures.length === 0, failures.map((item) => `${item.label} (${item.width}×${item.height})`).join(", "));
}

async function contrastAudit(page, label) {
  const samples = await page.evaluate(() => {
    function parseColour(value) {
      const match = String(value).match(/rgba?\((\d+(?:\.\d+)?)[, ]+(\d+(?:\.\d+)?)[, ]+(\d+(?:\.\d+)?)(?:[, /]+(\d+(?:\.\d+)?))?\)/i);
      if (!match) return null;
      return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]), a: match[4] === undefined ? 1 : Number(match[4]) };
    }
    function luminance(colour) {
      const channels = [colour.r, colour.g, colour.b].map((channel) => {
        const value = channel / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    }
    function ratio(foreground, background) {
      const lighter = Math.max(luminance(foreground), luminance(background));
      const darker = Math.min(luminance(foreground), luminance(background));
      return (lighter + 0.05) / (darker + 0.05);
    }
    function backgroundFor(element) {
      let current = element;
      while (current instanceof HTMLElement) {
        const style = getComputedStyle(current);
        if (style.backgroundImage && style.backgroundImage !== "none") return null;
        const colour = parseColour(style.backgroundColor);
        if (colour && colour.a >= 0.95) return colour;
        current = current.parentElement;
      }
      return { r: 255, g: 255, b: 255, a: 1 };
    }

    const selectors = ["h1", ".hero-sub", ".section-head h2", ".section-head p", ".card h3", ".card-desc", ".mega-nav-link", ".mega-nav-trigger", ".faq-question", "summary", ".service-process-trigger"];
    return selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)).slice(0, 3).map((element) => {
      if (!(element instanceof HTMLElement) || element.closest('[hidden],[inert],[aria-hidden="true"]')) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden" || rect.width === 0 || rect.height === 0) return null;
      const foreground = parseColour(style.color);
      const background = backgroundFor(element);
      if (!foreground || !background) return { selector, skipped: true, reason: "gradient or unparseable colour" };
      const fontSize = Number.parseFloat(style.fontSize);
      const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
      const large = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      return {
        selector,
        text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 90),
        ratio: Number(ratio(foreground, background).toFixed(2)),
        required: large ? 3 : 4.5,
        large,
      };
    }).filter(Boolean));
  });

  const evaluated = samples.filter((sample) => !sample.skipped);
  const failures = evaluated.filter((sample) => sample.ratio < sample.required);
  report.contrastSamples.push({ label, evaluated: evaluated.length, skipped: samples.length - evaluated.length, failures });
  record(`${label}: representative text meets WCAG contrast thresholds`, failures.length === 0, failures.map((item) => `${item.selector} ${item.ratio}:1`).join(", "));
}

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, colorScheme: "light" });
    for (const route of routes) {
      const page = await context.newPage();
      const label = `${route.name}@${viewport.name}`;
      try {
        await waitForRoute(page, route);
        await touchTargetAudit(page, label);
        await contrastAudit(page, label);
        await keyboardAudit(page, label);
      } catch (error) {
        record(`${label}: page accessibility audit completed`, false, error.message);
      } finally {
        await page.close();
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}

const markdown = `# Jam accessibility acceptance\n\nGenerated: ${report.generatedAt}\n\n- Checks: ${report.checks.length}\n- Passed: ${report.checks.filter((check) => check.passed).length}\n- Failures: ${report.failures.length}\n- Touch-target groups: ${report.touchTargets.length}\n- Contrast groups: ${report.contrastSamples.length}\n- Keyboard traversal groups: ${report.keyboardTraversal.length}\n\n## Failures\n\n${report.failures.length ? report.failures.map((failure) => `- ${failure}`).join("\n") : "None."}\n`;

await writeFile(path.join(outputDirectory, "accessibility-report.json"), JSON.stringify(report, null, 2));
await writeFile(path.join(outputDirectory, "accessibility-report.md"), markdown);
console.log(markdown);
if (report.failures.length) process.exitCode = 1;
