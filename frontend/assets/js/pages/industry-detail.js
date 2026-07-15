import { getItemBySlug } from "../cms.js";
import { escapeHtml, renderIcons, getSlugParam } from "../render-helpers.js";

const root = document.getElementById("industry-detail-root");
const notFound = document.getElementById("not-found");
const slug = window.__CONTENT_SLUG__ || getSlugParam();
const serverRendered = window.__SERVER_RENDERED__ === true;

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

function setJsonLd(title, description, url) {
  if (document.getElementById("xd-schema-graph")) return;
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: title, description, url });
  document.head.appendChild(script);
}

function applySeo(item) {
  const title = `${item.title} — Xtradite Digital`;
  const description = item.summary || `How Xtradite Digital helps ${item.title} businesses.`;
  const url = `${window.location.origin}/industries/${encodeURIComponent(item.slug)}`;
  document.title = title;
  setMetaByName("description", description);
  setMetaByProperty("og:title", item.title);
  setMetaByProperty("og:description", description);
  setMetaByProperty("og:type", "website");
  setMetaByProperty("og:url", url);
  setMetaByName("twitter:card", "summary");
  setMetaByName("twitter:title", item.title);
  setMetaByName("twitter:description", description);
  setCanonical(url);
  setJsonLd(title, description, url);
}

async function load() {
  if (serverRendered) {
    if (root) root.hidden = false;
    renderIcons();
    return;
  }
  if (!slug) return showNotFound();
  let item;
  try {
    item = await getItemBySlug("industries_delivery", "slug", slug);
  } catch (error) {
    console.error(error);
    return showNotFound("Couldn't load this page", "We couldn't reach the live content service. Please refresh, or try again in a moment.");
  }
  if (!item) return showNotFound();

  applySeo(item);
  document.getElementById("breadcrumb-current").textContent = item.title;
  document.getElementById("industry-title").textContent = item.title;
  document.getElementById("industry-summary").textContent = item.summary || "";
  document.getElementById("industry-challenge").innerHTML = item.challenge || "";
  document.getElementById("industry-solution").innerHTML = item.solution || "";
  document.getElementById("industry-outcomes").innerHTML = item.outcomes || "";

  const relatedServices = item.relatedServices || [];
  const relatedWrap = document.getElementById("related-services");
  if (relatedServices.length && relatedWrap) {
    relatedWrap.innerHTML = relatedServices.map((service) => `<a class="card" href="/services/${encodeURIComponent(service.slug)}"><div class="card-icon"><i data-lucide="${escapeHtml(service.icon || "circle")}"></i></div><h3>${escapeHtml(service.title)}</h3><p class="card-desc">${escapeHtml(service.summary)}</p><span class="card-link">View ${escapeHtml(service.title)} <i data-lucide="arrow-right"></i></span></a>`).join("");
    relatedWrap.parentElement.hidden = false;
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
