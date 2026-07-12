import { getItemBySlug, queryItems } from "../cms.js";
import {
  escapeHtml,
  caseStudyCardHtml,
  renderIcons,
  getSlugParam,
  metricsStripHtml,
  wireMetricsCounters,
  timelineHtml,
} from "../render-helpers.js";
import { CASE_STUDY_TO_SERVICE } from "./shared-data.js";

const root = document.getElementById("case-study-detail-root");
const notFound = document.getElementById("not-found");
const slug = getSlugParam();

function setMetaByName(name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setMetaByProperty(property, content) {
  if (!content) return;
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(item, title, description, url) {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    about: item.industry,
    url,
  });
  document.head.appendChild(script);
}

function applySeo(item) {
  const title = `${item.client} — Xtradite Digital`;
  const description = item.headline || item.challenge || "";
  const url = `${window.location.origin}/case-study-detail?slug=${encodeURIComponent(item.slug)}`;

  document.title = title;
  setMetaByName("description", description);
  setMetaByProperty("og:title", item.headline || item.client);
  setMetaByProperty("og:description", description);
  setMetaByProperty("og:type", "article");
  setMetaByProperty("og:url", url);
  setMetaByName("twitter:card", "summary");
  setMetaByName("twitter:title", item.headline || item.client);
  setMetaByName("twitter:description", description);
  setCanonical(url);
  setJsonLd(item, title, description, url);
}

async function load() {
  if (!slug) return showNotFound();
  let item;
  try {
    item = await getItemBySlug("case_studies", "slug", slug);
  } catch (e) {
    console.error(e);
    return showNotFound("Couldn't load this page", "We couldn't reach the live content service. Please refresh, or try again in a moment.");
  }
  if (!item) return showNotFound();

  applySeo(item);

  document.getElementById("breadcrumb-current").textContent = item.client;
  document.getElementById("cs-tag").textContent = item.industry || "";
  document.getElementById("cs-headline").textContent = item.headline || item.client;
  document.getElementById("cs-client").textContent = item.client;
  document.getElementById("cs-primary-metric").textContent = item.metric || "";
  document.getElementById("cs-challenge").textContent = item.challenge || "";
  document.getElementById("cs-results").innerHTML = item.resultsDetail || "";

  if (item.metrics?.length) {
    const metricsWrap = document.getElementById("cs-metrics");
    metricsWrap.innerHTML = metricsStripHtml(item.metrics);
    wireMetricsCounters(metricsWrap);
  }

  if (item.approach?.length) {
    document.getElementById("cs-approach").innerHTML = timelineHtml(
      item.approach.map((step) => ({ title: step.title, description: step.description }))
    );
    document.getElementById("cs-approach-section").hidden = false;
  }

  const relatedServiceSlug = CASE_STUDY_TO_SERVICE[item.slug];
  if (relatedServiceSlug) {
    try {
      const service = await getItemBySlug("services", "slug", relatedServiceSlug);
      const relatedWrap = document.getElementById("related-service");
      if (service && relatedWrap) {
        relatedWrap.href = `/services/${encodeURIComponent(service.slug)}`;
        relatedWrap.innerHTML = `
          <span class="eyebrow">Related Service</span>
          <h3>${escapeHtml(service.title)}</h3>
          <p class="card-desc">${escapeHtml(service.summary || "")}</p>
          <span class="card-link">Learn More <i data-lucide="arrow-right"></i></span>`;
        relatedWrap.hidden = false;
      }
    } catch (e) {
      console.error(e); // non-critical — related service is a bonus, not core content
    }
  }

  // Never fabricate a testimonial: only render this block for a real, signed-off quote,
  // or (for the one case flagged in Supabase as pending) a clearly-marked placeholder note.
  const testimonialSection = document.getElementById("cs-testimonial-section");
  const testWrap = document.getElementById("cs-testimonial");
  if (item.testimonialQuote) {
    testWrap.innerHTML = `
      <blockquote>&ldquo;${escapeHtml(item.testimonialQuote)}&rdquo;</blockquote>
      ${item.testimonialAuthor ? `<cite><strong>${escapeHtml(item.testimonialAuthor)}</strong></cite>` : ""}`;
    testimonialSection.hidden = false;
  } else if (item.testimonialPending) {
    testWrap.innerHTML = `<p class="placeholder-flag">A client testimonial for this engagement is pending sign-off.</p>`;
    testimonialSection.hidden = false;
  }

  const relatedWrap = document.getElementById("related-case-studies");
  if (relatedWrap) {
    try {
      const { items } = await queryItems("case_studies", { sort: [{ fieldName: "sort_order", order: "ASC" }] });
      const others = items.filter((c) => c.slug !== item.slug);
      if (others.length) {
        relatedWrap.innerHTML = others.map(caseStudyCardHtml).join("");
        document.getElementById("related-case-studies-section").hidden = false;
      }
    } catch (e) {
      console.error(e); // non-critical — related case studies are a bonus, not core content
    }
  }

  root.hidden = false;
  renderIcons();
}

function showNotFound(title, message) {
  root.hidden = true;
  if (title) notFound.querySelector("h1").textContent = title;
  if (message) notFound.querySelector("p").textContent = message;
  notFound.hidden = false;
}

load();
