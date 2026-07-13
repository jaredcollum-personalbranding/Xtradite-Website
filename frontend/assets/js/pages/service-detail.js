import { getItemBySlug } from "../cms.js";
import {
  escapeHtml,
  renderIcons,
  getSlugParam,
  relatedPostCardHtml,
  timelineHtml,
  deliverableListHtml,
  techLogoGridHtml,
  faqListHtml,
  wireFaqAccordion,
} from "../render-helpers.js";
import { renderServiceLocationCoverage } from "./service-locations.js";
import { enhanceServiceExperience } from "./service-experience.js";
import { organiseServiceContentTabs, renderDetailedDeliveryTimeline } from "./service-content-architecture.js";
import { watchDeliveryTimeline } from "./service-delivery-timeline.js";

const root = document.getElementById("service-detail-root");
const notFound = document.getElementById("not-found");
const slug = getSlugParam();

function ensureContentArchitectureStyles() {
  const styles = [
    ["serviceContentArchitectureCss", "/assets/css/service-content-architecture.css"],
    ["serviceDeliveryTimelineCss", "/assets/css/service-delivery-timeline-v2.css"],
  ];

  styles.forEach(([datasetKey, href]) => {
    if (document.querySelector(`link[data-${datasetKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.dataset[datasetKey] = "true";
    link.href = href;
    document.head.appendChild(link);
  });
}

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
    "@type": "Service",
    name: title,
    description,
    serviceType: item.category,
    provider: { "@type": "Organization", name: "Xtradite Digital" },
    url,
  });
  document.head.appendChild(script);
}

function applySeo(item) {
  const title = `${item.seoTitle || item.title} — Xtradite Digital`;
  const description = item.seoDescription || item.summary || "";
  const url = `${window.location.origin}/services/${encodeURIComponent(item.slug)}`;

  document.title = title;
  setMetaByName("description", description);
  setMetaByProperty("og:title", item.seoTitle || item.title);
  setMetaByProperty("og:description", description);
  setMetaByProperty("og:type", "website");
  setMetaByProperty("og:url", url);
  setMetaByName("twitter:card", "summary");
  setMetaByName("twitter:title", item.seoTitle || item.title);
  setMetaByName("twitter:description", description);
  setCanonical(url);
  setJsonLd(item, item.seoTitle || item.title, description, url);
}

async function load() {
  if (!slug) return showNotFound();
  let item;
  try {
    item = await getItemBySlug("services_delivery", "slug", slug);
  } catch (e) {
    console.error(e);
    return showNotFound("Couldn't load this page", "We couldn't reach the live content service. Please refresh, or try again in a moment.");
  }
  if (!item) return showNotFound();

  applySeo(item);
  ensureContentArchitectureStyles();

  document.getElementById("breadcrumb-current").textContent = item.title;
  document.getElementById("service-icon").setAttribute("data-lucide", item.icon || "circle");
  document.getElementById("service-eyebrow").textContent = item.category || "Service";
  document.getElementById("service-title").textContent = item.title;
  document.getElementById("service-subheading").textContent = item.heroSubheading || item.summary || "";
  document.getElementById("service-description").innerHTML = item.description || `<p>${escapeHtml(item.summary || "")}</p>`;

  const topicParam = `?topic=${encodeURIComponent(item.title)}`;
  document.getElementById("hero-cta").href = `/contact${topicParam}`;
  document.getElementById("banner-cta").href = `/contact${topicParam}`;

  if (item.whoItsFor?.length || item.whatIncluded?.length) {
    document.getElementById("service-who-its-for").innerHTML = `<ul>${(item.whoItsFor || []).map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`;
    document.getElementById("service-what-included").innerHTML = `<ul>${(item.whatIncluded || []).map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`;
    document.getElementById("who-what-section").hidden = false;
  }

  if (item.howItWorks?.length) {
    document.getElementById("service-how-it-works").innerHTML = timelineHtml(item.howItWorks);
    document.getElementById("how-it-works-section").hidden = false;
  }

  if (item.deliverables?.length) {
    document.getElementById("service-deliverables").innerHTML = deliverableListHtml(item.deliverables);
    document.getElementById("deliverables-section").hidden = false;
  }

  if (item.techCategories?.length) {
    document.getElementById("service-tech-grid").innerHTML = techLogoGridHtml(item.techCategories);
    document.getElementById("tech-section").hidden = false;
  }

  if (item.faqs?.length) {
    const faqWrap = document.getElementById("service-faq");
    faqWrap.innerHTML = faqListHtml(item.faqs);
    wireFaqAccordion(faqWrap);
    document.getElementById("faq-section").hidden = false;
  }

  organiseServiceContentTabs(item);
  renderDetailedDeliveryTimeline(item);
  watchDeliveryTimeline();
  renderServiceLocationCoverage(item);
  enhanceServiceExperience(item);

  const relatedCaseStudy = item.relatedCaseStudies?.[0];
  const relatedSlug = relatedCaseStudy?.slug;
  if (relatedSlug) {
    try {
      const cs = relatedCaseStudy;
      const relatedWrap = document.getElementById("related-case-study");
      if (cs && relatedWrap) {
        relatedWrap.innerHTML = `<span class="eyebrow">Related Case Study</span><h3>${escapeHtml(cs.client)}</h3><p class="card-desc">${escapeHtml(cs.challenge || "")}</p><span class="metric">${escapeHtml(cs.metric || "")}</span><a class="card-link" href="/case-study-detail?slug=${encodeURIComponent(cs.slug)}">View Case Study <i data-lucide="arrow-right"></i></a>`;
        relatedWrap.hidden = false;
      }
    } catch (e) {
      console.error(e);
    }
  }

  const relatedPostSlugs = item.relatedBlogPosts || [];
  if (relatedPostSlugs.length) {
    try {
      const posts = relatedPostSlugs;
      if (posts.length) {
        document.getElementById("related-insights").innerHTML = posts.map(relatedPostCardHtml).join("");
        document.getElementById("related-insights-section").hidden = false;
      }
    } catch (e) {
      console.error(e);
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
