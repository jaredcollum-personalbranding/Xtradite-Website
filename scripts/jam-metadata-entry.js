import { jam } from "@jam.dev/sdk";

const safeText = (value, maxLength = 120) => String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);

function pageType() {
  const path = window.location.pathname;
  if (/^\/uk\/.+\/services\//.test(path)) return "local-service";
  if (/^\/uk\//.test(path) || path === "/locations") return "location-router";
  if (/^\/services\//.test(path)) return "service";
  if (path === "/services") return "service-index";
  if (path === "/service-detail") return "service-detail";
  if (path === "/case-study-detail") return "case-study";
  if (path === "/case-studies") return "case-study-index";
  if (path === "/insights-post" || path === "/insight-detail") return "insight";
  if (path === "/insights") return "insight-index";
  if (path === "/industry-detail") return "industry";
  if (path === "/industries") return "industry-index";
  if (path === "/contact") return "contact";
  if (path === "/about") return "about";
  if (path === "/") return "home";
  return "other";
}

function contentSlug() {
  const search = new URLSearchParams(window.location.search);
  const querySlug = search.get("slug");
  if (querySlug) return safeText(querySlug, 100);

  const parts = window.location.pathname.split("/").filter(Boolean);
  const serviceIndex = parts.lastIndexOf("services");
  if (serviceIndex >= 0 && parts[serviceIndex + 1]) return safeText(parts[serviceIndex + 1], 100);
  return null;
}

function activeTab() {
  const tab = document.querySelector('[role="tab"][aria-selected="true"]');
  return tab ? safeText(tab.textContent, 80) : null;
}

function visibleSection() {
  const viewportPoint = Math.min(window.innerHeight * 0.42, 420);
  const sections = [...document.querySelectorAll("main section")];
  const current = sections.find((section) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= viewportPoint && rect.bottom >= viewportPoint;
  });
  if (!current) return null;

  const heading = current.querySelector("h1, h2, h3");
  return {
    id: safeText(current.id || current.className, 100),
    heading: heading ? safeText(heading.textContent, 100) : null,
  };
}

function navigationType() {
  const entry = performance.getEntriesByType?.("navigation")?.[0];
  return entry?.type || "unknown";
}

function connectionContext() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return null;
  return {
    effectiveType: connection.effectiveType || null,
    downlinkMbps: Number.isFinite(connection.downlink) ? connection.downlink : null,
    roundTripTimeMs: Number.isFinite(connection.rtt) ? connection.rtt : null,
    saveData: Boolean(connection.saveData),
  };
}

jam.metadata(() => {
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  const referrerHost = document.referrer ? new URL(document.referrer).hostname : null;
  const scrollableHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);

  return {
    route: {
      pageType: pageType(),
      pathname: window.location.pathname,
      contentSlug: contentSlug(),
      canonicalPath: canonical ? new URL(canonical, window.location.origin).pathname : null,
    },
    page: {
      title: safeText(document.title, 160),
      language: document.documentElement.lang || null,
      activeTab: activeTab(),
      visibleSection: visibleSection(),
      referrerHost,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      scrollY: Math.round(window.scrollY),
      scrollPercent: scrollableHeight ? Math.round((window.scrollY / scrollableHeight) * 100) : 0,
    },
    runtime: {
      timeSincePageLoadMs: Math.round(performance.now()),
      navigationType: navigationType(),
      online: navigator.onLine,
      visibilityState: document.visibilityState,
      connection: connectionContext(),
    },
  };
});
