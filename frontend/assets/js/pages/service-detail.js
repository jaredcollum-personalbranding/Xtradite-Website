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
} from "../render-helpers.js";
import { enhanceServicePage } from "./service-page-enhancements.js";

const root = document.getElementById("service-detail-root");
const notFound = document.getElementById("not-found");
const slug = window.__CONTENT_SLUG__ || getSlugParam();
const serverRendered = window.__SERVER_RENDERED__ === true;
const PUBLIC_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isEligibleRelatedCaseStudy(item) {
  return item?.status === "published"
    && item?.publicApprovalStatus === "approved"
    && PUBLIC_SLUG.test(item.slug || "")
    && Boolean(item.client)
    && item.noindex !== true;
}

function isEligibleRelatedPost(item, now = new Date()) {
  const publicationDate = new Date(item?.firstPublishedDate || item?.firstPublishedAt || "");
  return item?.status === "published"
    && PUBLIC_SLUG.test(item.slug || "")
    && Number.isFinite(publicationDate.getTime())
    && publicationDate.getTime() <= now.getTime();
}

function setMetaByName(name, content) {
  if (!content) return;
  let element = document.querySelector(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setMetaByProperty(property, content) {
  if (!content) return;
  let element = document.querySelector(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setCanonical(href) {
  let element = document.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

function setRobots(noindex) {
  setMetaByName("robots", noindex ? "noindex, nofollow" : "index, follow");
}

function setJsonLd(item, title, description, url) {
  if (document.getElementById("xd-schema-graph")) return;
  const script = document.createElement("script");
  script.id = "xd-client-service-schema";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    description,
    serviceType: item.category,
    provider: { "@type": "Organization", name: "Xtradite Digital", url: window.location.origin },
    areaServed: { "@type": "Country", name: "United Kingdom" },
    url,
  });
  document.head.appendChild(script);
}

function applySeo(item) {
  const title = `${item.seoTitle || item.title} — Xtradite Digital`;
  const description = item.seoDescription || item.summary || "";
  const canonicalPath = item.canonicalPath || `/services/${encodeURIComponent(item.slug)}`;
  const url = new URL(canonicalPath, window.location.origin).href;
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
  setRobots(item.noindex === true);
  setJsonLd(item, item.seoTitle || item.title, description, url);
}

function renderList(targetId, items) {
  const target = document.getElementById(targetId);
  if (!target || !Array.isArray(items) || !items.length) return false;
  target.innerHTML = `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  return true;
}

function renderRelatedCaseStudy(item) {
  const relatedCaseStudy = (item.relatedCaseStudies || []).find(isEligibleRelatedCaseStudy);
  const relatedWrap = document.getElementById("related-case-study");
  if (!relatedCaseStudy || !relatedWrap) return;
  const heading = relatedCaseStudy.headline || relatedCaseStudy.client;
  const summary = relatedCaseStudy.challenge || relatedCaseStudy.summary || "Read the related delivery story and the evidence currently available.";
  relatedWrap.innerHTML = `<span class="eyebrow">Related case study</span><h3>${escapeHtml(heading)}</h3><p class="card-desc">${escapeHtml(summary)}</p><a class="card-link" href="/case-studies/${encodeURIComponent(relatedCaseStudy.slug)}">Read the case study <i data-lucide="arrow-right"></i></a>`;
  relatedWrap.hidden = false;
}

function enhanceServerRenderedPage() {
  if (root) root.hidden = false;
  enhanceServicePage();
  renderIcons();
}

async function load() {
  if (serverRendered) {
    enhanceServerRenderedPage();
    return;
  }
  if (!slug) return showNotFound();

  let item;
  try {
    item = await getItemBySlug("services_delivery", "slug", slug);
  } catch (error) {
    console.error(error);
    return showNotFound("Couldn't load this page", "We couldn't reach the live content service. Please refresh, or try again in a moment.");
  }
  if (!item) return showNotFound();

  applySeo(item);
  document.getElementById("breadcrumb-current").textContent = item.title;
  document.getElementById("service-icon").setAttribute("data-lucide", item.icon || "circle");
  document.getElementById("service-eyebrow").textContent = item.category || "Service";
  document.getElementById("service-title").textContent = item.title;
  document.getElementById("service-subheading").textContent = item.heroSubheading || item.summary || "";
  document.getElementById("service-description").innerHTML = item.description || `<p>${escapeHtml(item.summary || "")}</p>`;

  const topicParam = `?topic=${encodeURIComponent(item.title)}`;
  document.getElementById("hero-cta").href = `/contact${topicParam}`;
  document.getElementById("banner-cta").href = `/contact${topicParam}`;

  const hasAudience = renderList("service-who-its-for", item.whoItsFor);
  const hasInclusions = renderList("service-what-included", item.whatIncluded);
  if (hasAudience || hasInclusions) document.getElementById("who-what-section").hidden = false;

  if (item.deliverables?.length) {
    document.getElementById("service-deliverables").innerHTML = deliverableListHtml(item.deliverables);
    document.getElementById("deliverables-section").hidden = false;
  }
  if (item.howItWorks?.length) {
    document.getElementById("service-how-it-works").innerHTML = timelineHtml(item.howItWorks);
    document.getElementById("how-it-works-section").hidden = false;
  }
  if (item.technologyExamples?.length) {
    const technologySection = document.getElementById("tech-section");
    const technologyGrid = document.getElementById("service-tech-grid");
    technologyGrid.innerHTML = item.technologyExamples.map((example) => `<article class="card service-technology-example"><span class="eyebrow">${escapeHtml(example.category || "Workflow example")}</span><h3>${escapeHtml(example.useCase || "Technology-supported workflow")}</h3><p>${escapeHtml(example.explanation || "Compatible tools are selected according to the agreed workflow and evidence requirements.")}</p>${(example.technologies || []).length ? `<p class="service-technology-products">${escapeHtml(example.technologies.map((technology) => technology.name).join(" · "))}</p>` : ""}</article>`).join("");
    technologySection.hidden = false;
  } else if (item.techCategories?.length) {
    document.getElementById("service-tech-grid").innerHTML = techLogoGridHtml(item.techCategories);
    document.getElementById("tech-section").hidden = false;
  }

  renderRelatedCaseStudy(item);
  const relatedPosts = (item.relatedBlogPosts || []).filter((post) => isEligibleRelatedPost(post));
  if (relatedPosts.length) {
    document.getElementById("related-insights").innerHTML = relatedPosts.map(relatedPostCardHtml).join("");
    document.getElementById("related-insights-section").hidden = false;
  }
  if (item.faqs?.length) {
    document.getElementById("service-faq").innerHTML = faqListHtml(item.faqs);
    document.getElementById("faq-section").hidden = false;
  }

  root.hidden = false;
  enhanceServicePage();
  renderIcons();
}

function showNotFound(title, message) {
  root.hidden = true;
  if (title) notFound.querySelector("h1").textContent = title;
  if (message) notFound.querySelector("p").textContent = message;
  notFound.hidden = false;
}

load();
export { isEligibleRelatedCaseStudy, isEligibleRelatedPost };
