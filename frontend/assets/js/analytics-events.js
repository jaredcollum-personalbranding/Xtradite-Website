const SENT = new Set();
const FORM_STARTED = new WeakSet();
const SEARCH_REFERRER = /(^|\.)((google|bing|yahoo|duckduckgo|ecosia|brave)\.)/i;

function consentGranted() {
  return window.Cookiebot?.consent?.statistics === true;
}

function pageContext() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const parts = path.split("/").filter(Boolean);
  const contentType = parts[0] === "services" ? "service"
    : parts[0] === "industries" ? "industry"
      : parts[0] === "case-studies" ? "case_study"
        : parts[0] === "insights" && parts[1] ? "insight"
          : parts[0] === "locations" ? (parts.length > 2 ? "location_service" : "location")
            : parts[0] || "homepage";

  let organicLanding = sessionStorage.getItem("xd_organic_landing");
  if (organicLanding === null) {
    const medium = new URLSearchParams(window.location.search).get("utm_medium");
    let referrerHost = "";
    try {
      referrerHost = document.referrer ? new URL(document.referrer).hostname : "";
    } catch {
      referrerHost = "";
    }
    organicLanding = String(medium === "organic" || SEARCH_REFERRER.test(referrerHost));
    sessionStorage.setItem("xd_organic_landing", organicLanding);
  }

  return {
    content_type: contentType,
    page_slug: parts.at(-1) || "home",
    service: contentType === "service" ? parts[1] || "" : document.body.dataset.service || "",
    industry: contentType === "industry" ? parts[1] || "" : document.body.dataset.industry || "",
    location: contentType.startsWith("location") ? parts.slice(1).join("/") : document.body.dataset.location || "",
    content_group: contentType,
    organic_landing: organicLanding === "true"
  };
}

function normaliseParameters(parameters = {}) {
  return Object.fromEntries(
    Object.entries({ ...pageContext(), ...parameters })
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 100) : value])
  );
}

export function dispatchAnalyticsEvent(name, parameters = {}, { onceKey } = {}) {
  if (!name || !consentGranted() || typeof window.gtag !== "function") return false;
  const key = onceKey || "";
  if (key && SENT.has(key)) return false;
  if (key) SENT.add(key);
  window.gtag("event", name, normaliseParameters(parameters));
  return true;
}

function targetLink(event) {
  return event.target instanceof Element ? event.target.closest("a[href]") : null;
}

function eventForLink(link) {
  const href = link.getAttribute("href") || "";
  const url = new URL(href, window.location.href);
  const placement = link.dataset.ctaPlacement || (
    link.closest("header") ? "header"
      : link.closest("footer") ? "footer"
        : link.closest(".cta-banner") ? "banner"
          : link.closest("main") ? "content"
            : "unknown"
  );

  if (href.startsWith("mailto:")) return ["email_click", { cta_placement: placement, link_destination: href }];
  if (href.startsWith("tel:")) return ["phone_click", { cta_placement: placement, link_destination: href }];
  if (/\/contact\/?$/.test(url.pathname) || link.matches("[data-consultation-cta], .header-cta, .header-cta-mobile")) {
    return ["consultation_cta_click", { cta_placement: placement, link_destination: url.pathname }];
  }
  if (/^\/locations\/[^/]+\/services\/[^/]+/.test(url.pathname)) {
    return ["location_service_click", { cta_placement: placement, link_destination: url.pathname }];
  }
  if (link.closest("[id^='related-'], .related-grid, .cs-related")) {
    return ["related_content_click", { cta_placement: placement, link_destination: url.pathname }];
  }
  return null;
}

document.addEventListener("click", (event) => {
  const link = targetLink(event);
  if (link) {
    const definition = eventForLink(link);
    if (definition) {
      const [name, parameters] = definition;
      dispatchAnalyticsEvent(name, parameters);
    }
  }

  const faq = event.target instanceof Element ? event.target.closest("summary, .faq-question") : null;
  if (faq) {
    const container = faq.closest("details, .faq-item");
    const label = faq.textContent?.trim() || "";
    queueMicrotask(() => {
      const expanded = container?.matches("details") ? container.open : faq.getAttribute("aria-expanded") === "true";
      if (expanded) dispatchAnalyticsEvent("faq_expand", { link_destination: label });
    });
  }
});

document.addEventListener("focusin", (event) => {
  const form = event.target instanceof Element ? event.target.closest("form") : null;
  if (!form || FORM_STARTED.has(form)) return;
  FORM_STARTED.add(form);
  dispatchAnalyticsEvent("contact_form_start", {
    cta_placement: form.dataset.formPlacement || "contact_form"
  }, { onceKey: `form-start:${form.id || form.action || "contact"}` });
});

document.addEventListener("xtradite:form-submitted", (event) => {
  const detail = event.detail || {};
  dispatchAnalyticsEvent("contact_form_submit", {
    cta_placement: detail.placement || "contact_form",
    link_destination: detail.destination || "backend_confirmed"
  }, { onceKey: detail.submissionId ? `form-submit:${detail.submissionId}` : undefined });
});

function dispatchContentView() {
  const { content_type: contentType, page_slug: pageSlug } = pageContext();
  const eventName = contentType === "service" ? "service_view"
    : contentType === "case_study" ? "case_study_view"
      : contentType === "insight" ? "insight_view"
        : null;
  if (eventName) dispatchAnalyticsEvent(eventName, {}, { onceKey: `${eventName}:${pageSlug}` });
}

window.addEventListener("CookiebotOnConsentReady", dispatchContentView);
window.addEventListener("CookiebotOnAccept", dispatchContentView);
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", dispatchContentView, { once: true });
} else {
  dispatchContentView();
}
