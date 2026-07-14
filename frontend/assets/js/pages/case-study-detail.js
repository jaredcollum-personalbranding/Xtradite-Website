import { getItemBySlug, queryItems } from "../cms.js";
import { escapeHtml, renderIcons, getSlugParam } from "../render-helpers.js";
import { renderEvidenceExperience, renderApproachExperience } from "./case-study-experience.js";

const root = document.getElementById("case-study-detail-root");
const notFound = document.getElementById("not-found");
const slug = window.__CONTENT_SLUG__ || getSlugParam();

function setMeta(selector, attribute, content) {
  if (!content) return;
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    const [, key, value] = selector.match(/meta\[([^=]+)="([^"]+)"\]/) || [];
    if (key && value) element.setAttribute(key, value);
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, content);
}

function setCanonical(href) {
  let element = document.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = href;
}

function mediaFor(item, role) {
  const media = item.media || item.mediaAssets || [];
  return media
    .filter((asset) => asset.role === role && (asset.publicUrl || asset.url || asset.src))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || (a.sortOrder || 0) - (b.sortOrder || 0))[0];
}

function applySeo(item) {
  const title = item.seoTitle || `${item.client} — Xtradite Digital Case Study`;
  const description = item.seoDescription || item.cardSummary || item.headline || item.challenge || `How Xtradite Digital helped ${item.client}.`;
  const url = `${window.location.origin}/case-studies/${encodeURIComponent(item.slug)}`;
  const hero = mediaFor(item, "og") || mediaFor(item, "hero");
  const heroUrl = hero?.publicUrl || hero?.url || hero?.src;

  document.title = title;
  setMeta('meta[name="description"]', "content", description);
  setMeta('meta[property="og:title"]', "content", title);
  setMeta('meta[property="og:description"]', "content", description);
  setMeta('meta[property="og:type"]', "content", "article");
  setMeta('meta[property="og:url"]', "content", url);
  setMeta('meta[property="og:image"]', "content", heroUrl);
  setMeta('meta[name="twitter:card"]', "content", heroUrl ? "summary_large_image" : "summary");
  setMeta('meta[name="twitter:title"]', "content", title);
  setMeta('meta[name="twitter:description"]', "content", description);
  setCanonical(url);

  if (document.getElementById("xd-schema-graph")) return;
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": ["Article", "CreativeWork"],
    headline: item.headline || item.client,
    description,
    about: item.industry,
    datePublished: item.publishedAt || undefined,
    dateModified: item.updatedAt || undefined,
    image: heroUrl || undefined,
    author: { "@type": "Organization", name: "Xtradite Digital" },
    publisher: { "@type": "Organization", name: "Xtradite Digital" },
    mainEntityOfPage: url,
  });
  document.head.appendChild(script);
}

function renderRichText(element, value) {
  if (!element || !value) return false;
  const text = String(value).trim();
  element.innerHTML = /<\/?[a-z][\s\S]*>/i.test(text) ? text : `<p>${escapeHtml(text)}</p>`;
  return true;
}

function isTargetMetric(metric) {
  return /\b(target|goal|forecast|projected|projection)\b/i.test(`${metric.label || ""} ${metric.value || ""}`);
}

function renderResultsGraphic(metrics) {
  const wrap = document.getElementById("cs-results-graphic");
  const selected = (metrics || []).slice(0, 3);
  if (!selected.length) {
    wrap.hidden = true;
    return;
  }
  wrap.innerHTML = `
    <div class="cs-results-graphic-head"><span>Outcome record</span><span>Delivered / target</span></div>
    ${selected.map((metric, index) => {
      const target = isTargetMetric(metric);
      return `<div class="cs-result-row">
        <span class="cs-result-index">0${index + 1}</span>
        <div><strong>${escapeHtml(metric.value)}</strong><span>${escapeHtml(metric.label)}</span></div>
        <em class="${target ? "is-target" : "is-delivered"}">${target ? "Target" : "Delivered"}</em>
      </div>`;
    }).join("")}`;
}

function relatedCaseHtml(item) {
  return `<a class="cs-related-case" href="/case-studies/${encodeURIComponent(item.slug)}">
    <span class="eyebrow">${escapeHtml(item.industry || "Case study")}</span>
    <h3>${escapeHtml(item.headline || item.client)}</h3>
    <div><span>${escapeHtml(item.client)}</span><strong>${escapeHtml(item.metric || "Read the story")}</strong></div>
    <span class="card-link">View case study <i data-lucide="arrow-right"></i></span>
  </a>`;
}

function renderHeroMedia(item) {
  const media = mediaFor(item, "hero");
  const video = mediaFor(item, "video");
  if (!media && !video) return;
  const visual = document.getElementById("cs-hero-visual");
  visual.classList.add("has-media");
  const imageUrl = media?.publicUrl || media?.url || media?.src;
  if (imageUrl) {
    visual.style.backgroundImage = `linear-gradient(180deg, transparent 35%, rgba(23, 19, 34, .72)), url("${String(imageUrl).replace(/"/g, "%22")}")`;
  }
  if (video && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const videoUrl = video.publicUrl || video.url || video.src;
    const element = document.createElement("video");
    element.className = "cs-hero-video";
    element.muted = true;
    element.loop = true;
    element.autoplay = true;
    element.playsInline = true;
    element.preload = "metadata";
    if (imageUrl) element.poster = imageUrl;
    element.innerHTML = `<source src="${escapeHtml(videoUrl)}" type="${escapeHtml(video.mimeType || "video/mp4")}">`;
    visual.prepend(element);
  }
  visual.setAttribute("aria-label", media?.altText || media?.alt || video?.altText || "Case study editorial media");
  visual.removeAttribute("aria-hidden");
}

async function renderRelated(item) {
  let hasRelated = false;
  const service = item.relatedServices?.[0];
  const serviceWrap = document.getElementById("related-service");
  if (service?.slug && serviceWrap) {
    serviceWrap.href = `/services/${encodeURIComponent(service.slug)}`;
    serviceWrap.innerHTML = `
      <span class="eyebrow">Related service</span>
      <div class="cs-service-icon"><i data-lucide="${escapeHtml(service.icon || "arrow-up-right")}"></i></div>
      <h3>${escapeHtml(service.title)}</h3>
      <p>${escapeHtml(service.summary || "Explore the capability behind this engagement.")}</p>
      <span class="card-link">Explore this service <i data-lucide="arrow-right"></i></span>`;
    serviceWrap.hidden = false;
    hasRelated = true;
  }

  try {
    const { items } = await queryItems("case_studies_delivery", { sort: [{ fieldName: "sort_order", order: "ASC" }] });
    const others = items
      .filter((candidate) => candidate.slug !== item.slug)
      .sort((a, b) => Number(b.industry === item.industry) - Number(a.industry === item.industry))
      .slice(0, 2);
    if (others.length) {
      document.getElementById("related-case-studies").innerHTML = others.map(relatedCaseHtml).join("");
      hasRelated = true;
    }
  } catch (error) {
    console.error(error);
  }
  document.getElementById("cs-related-section").hidden = !hasRelated;
}

async function load() {
  if (!slug) return showNotFound();
  let item;
  try {
    item = await getItemBySlug("case_studies_delivery", "slug", slug);
  } catch (error) {
    console.error(error);
    return showNotFound("Couldn't load this page", "We couldn't reach the live content service. Please refresh, or try again in a moment.");
  }
  if (!item) return showNotFound();

  applySeo(item);
  root.dataset.caseStudySlug = item.slug;
  document.getElementById("breadcrumb-current").textContent = item.client;
  document.getElementById("cs-tag").textContent = item.industry || "Case study";
  document.getElementById("cs-headline").textContent = item.headline || item.client;
  document.getElementById("cs-client").textContent = item.client;
  document.getElementById("cs-primary-metric").textContent = item.metric || "";
  document.getElementById("cs-visual-metric").textContent = item.metric || item.industry || "Impact";
  document.getElementById("cs-primary-proof").hidden = !item.metric;

  if (item.cardSummary) {
    document.getElementById("cs-summary").textContent = item.cardSummary;
    document.getElementById("cs-summary").hidden = false;
  }
  if (item.confidentialityNote) {
    document.getElementById("cs-confidentiality").textContent = item.confidentialityNote;
    document.getElementById("cs-confidentiality").hidden = false;
  }
  renderHeroMedia(item);

  const metrics = item.metrics || [];
  if (metrics.length) {
    renderEvidenceExperience(item, metrics);
    document.getElementById("cs-evidence-section").hidden = false;
  }

  if (renderRichText(document.getElementById("cs-description"), item.description)) {
    document.getElementById("cs-engagement-section").hidden = false;
  }
  renderRichText(document.getElementById("cs-challenge"), item.challenge);
  if (item.approach?.length) renderApproachExperience(item.approach);
  const hasResultsCopy = renderRichText(document.getElementById("cs-results"), item.resultsDetail);
  renderResultsGraphic(metrics);
  document.getElementById("cs-results-section").hidden = !hasResultsCopy && !metrics.length;

  if (item.testimonialQuote) {
    document.getElementById("cs-testimonial").innerHTML = `
      <p>“${escapeHtml(item.testimonialQuote)}”</p>
      ${item.testimonialAuthor ? `<cite>${escapeHtml(item.testimonialAuthor)}</cite>` : ""}`;
    document.getElementById("cs-testimonial-section").hidden = false;
  }

  await renderRelated(item);
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
