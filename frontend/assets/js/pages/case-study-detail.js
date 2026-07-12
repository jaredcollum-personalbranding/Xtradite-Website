import { getItemBySlug, queryItems } from "../cms.js";
import { escapeHtml, caseStudyCardHtml, renderIcons, getSlugParam } from "../render-helpers.js";

const root = document.getElementById("case-study-detail-root");
const notFound = document.getElementById("not-found");
const slug = getSlugParam();

// Only Northfield has a documented client quote (from the completed design mockup).
// Kaldura and Verlane don't have a real testimonial on file yet — we don't fabricate one.
const TESTIMONIALS = {
  "northfield-retail-group": {
    quote: "Xtradite helped us redesign our digital operations and improve commercial performance across every channel.",
    name: "Sarah Whitfield",
    title: "COO, Northfield Retail Group",
  },
};

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

function setJsonLd(title, description, url) {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    author: { "@type": "Organization", name: "Xtradite Digital" },
    publisher: { "@type": "Organization", name: "Xtradite Digital" },
    mainEntityOfPage: url,
  });
  document.head.appendChild(script);
}

function applySeo(item) {
  const title = `${item.client} — Xtradite Digital Case Study`;
  const description = item.challenge || item.headline || `How Xtradite Digital helped ${item.client}.`;
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
  setJsonLd(title, description, url);
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
  document.getElementById("cs-challenge-line").textContent = item.challenge || "";
  document.getElementById("cs-metric").textContent = item.metric || "";
  document.getElementById("cs-description").innerHTML = item.description || "";

  const testimonial = TESTIMONIALS[item.slug];
  const testWrap = document.getElementById("cs-testimonial");
  if (testimonial && testWrap) {
    testWrap.innerHTML = `
      <blockquote>&ldquo;${escapeHtml(testimonial.quote)}&rdquo;</blockquote>
      <cite><strong>${escapeHtml(testimonial.name)}</strong>${escapeHtml(testimonial.title)}</cite>
      <span class="placeholder-flag">Sample quote — pending final client sign-off before launch.</span>`;
    testWrap.hidden = false;
  }

  const relatedWrap = document.getElementById("related-case-studies");
  if (relatedWrap) {
    try {
      const { items } = await queryItems("case_studies", { sort: [{ fieldName: "sort_order", order: "ASC" }] });
      const others = items.filter((c) => c.slug !== item.slug);
      if (others.length) {
        relatedWrap.innerHTML = others.map(caseStudyCardHtml).join("");
        relatedWrap.parentElement.hidden = false;
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
