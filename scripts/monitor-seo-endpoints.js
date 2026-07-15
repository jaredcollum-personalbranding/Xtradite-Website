const fs = require("node:fs");
const path = require("node:path");

const BASE_URL = new URL(process.env.SEO_BASE_URL || "https://www.xtradite-digital.co.uk");
const ATTEMPTS = Number(process.env.SEO_MONITOR_ATTEMPTS || 2);
const RETRY_DELAY_MS = Number(process.env.SEO_MONITOR_RETRY_DELAY_MS || 15000);
const RESPONSE_LIMIT_MS = Number(process.env.SEO_RESPONSE_LIMIT_MS || 5000);
const outputDirectory = path.join(process.cwd(), "artifacts", "seo-monitor");

const ENDPOINTS = [
  { path: "/", contentType: "text/html", marker: /<html[\s>]/i },
  { path: "/robots.txt", contentType: "text/plain", marker: /sitemap:\s*https:\/\/www\.xtradite-digital\.co\.uk\/sitemap\.xml/i },
  { path: "/sitemap.xml", contentType: "xml", marker: /<sitemapindex[\s>]/i },
  { path: "/sitemaps/static.xml", contentType: "xml", marker: /<urlset[\s>]/i },
  { path: "/sitemaps/services.xml", contentType: "xml", marker: /<urlset[\s>]/i },
  { path: "/sitemaps/industries.xml", contentType: "xml", marker: /<urlset[\s>]/i },
  { path: "/sitemaps/case-studies.xml", contentType: "xml", marker: /<urlset[\s>]/i },
  { path: "/sitemaps/insights.xml", contentType: "xml", marker: /<urlset[\s>]/i },
  { path: "/sitemaps/locations.xml", contentType: "xml", marker: /<urlset[\s>]/i }
];

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function inspect(endpoint) {
  const started = performance.now();
  const requestedUrl = new URL(endpoint.path, BASE_URL);
  try {
    const response = await fetch(requestedUrl, {
      redirect: "follow",
      headers: { "user-agent": "Xtradite-SEO-Monitor/1.0" },
      signal: AbortSignal.timeout(RESPONSE_LIMIT_MS * 2)
    });
    const body = await response.text();
    const elapsedMs = Math.round(performance.now() - started);
    const finalUrl = new URL(response.url);
    const contentType = response.headers.get("content-type") || "";
    const failures = [];

    if (response.status >= 500) failures.push(`server status ${response.status}`);
    else if (!response.ok) failures.push(`unexpected status ${response.status}`);
    if (finalUrl.protocol !== "https:") failures.push(`final protocol is ${finalUrl.protocol}`);
    if (finalUrl.hostname !== "www.xtradite-digital.co.uk") failures.push(`final hostname is ${finalUrl.hostname}`);
    if (!contentType.toLowerCase().includes(endpoint.contentType.toLowerCase())) failures.push(`content type is ${contentType || "missing"}`);
    if (!endpoint.marker.test(body)) failures.push("expected body marker missing");
    if (elapsedMs > RESPONSE_LIMIT_MS) failures.push(`response time ${elapsedMs}ms exceeds ${RESPONSE_LIMIT_MS}ms`);

    return {
      path: endpoint.path,
      requestedUrl: requestedUrl.href,
      finalUrl: response.url,
      status: response.status,
      contentType,
      elapsedMs,
      tlsValidated: finalUrl.protocol === "https:",
      passed: failures.length === 0,
      failures
    };
  } catch (error) {
    return {
      path: endpoint.path,
      requestedUrl: requestedUrl.href,
      finalUrl: null,
      status: null,
      contentType: null,
      elapsedMs: Math.round(performance.now() - started),
      tlsValidated: false,
      passed: false,
      failures: [error.message]
    };
  }
}

async function runAttempt(attempt) {
  const results = [];
  for (const endpoint of ENDPOINTS) results.push(await inspect(endpoint));
  return {
    attempt,
    checkedAt: new Date().toISOString(),
    passed: results.every((result) => result.passed),
    results
  };
}

function markdown(attempts) {
  const latest = attempts.at(-1);
  const rows = latest.results.map((result) => {
    const failure = result.failures.join("; ").replace(/\|/g, "\\|");
    return `| \`${result.path}\` | ${result.status ?? "—"} | ${result.elapsedMs}ms | ${result.contentType || "—"} | ${result.passed ? "Pass" : `Fail: ${failure}`} |`;
  }).join("\n");
  return `# SEO endpoint monitor\n\nChecked: ${latest.checkedAt}\n\nAttempts: ${attempts.length}\n\nFinal result: **${latest.passed ? "PASS" : "FAIL"}**\n\n| Endpoint | Status | Time | Content type | Result |\n|---|---:|---:|---|---|\n${rows}\n`;
}

async function main() {
  fs.mkdirSync(outputDirectory, { recursive: true });
  const attempts = [];

  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    const result = await runAttempt(attempt);
    attempts.push(result);
    if (result.passed) break;
    if (attempt < ATTEMPTS) await wait(RETRY_DELAY_MS);
  }

  fs.writeFileSync(path.join(outputDirectory, "report.json"), JSON.stringify({ baseUrl: BASE_URL.href, attempts }, null, 2));
  fs.writeFileSync(path.join(outputDirectory, "report.md"), markdown(attempts));

  const final = attempts.at(-1);
  console.log(markdown(attempts));
  if (!final.passed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
