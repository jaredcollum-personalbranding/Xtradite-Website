import { getItemBySlug } from "../cms.js";
import { escapeHtml, renderIcons, getSlugParam } from "../render-helpers.js";
import { SERVICE_TO_CASE_STUDY } from "./shared-data.js";

const root = document.getElementById("service-detail-root");
const notFound = document.getElementById("not-found");
const slug = getSlugParam();

async function load() {
  if (!slug) return showNotFound();
  let item;
  try {
    item = await getItemBySlug("services", "slug", slug);
  } catch (e) {
    console.error(e);
    return showNotFound("Couldn't load this page", "We couldn't reach the live content service. Please refresh, or try again in a moment.");
  }
  if (!item) return showNotFound();

  document.title = `${item.title} — Xtradite Digital`;
  document.getElementById("breadcrumb-current").textContent = item.title;
  document.getElementById("service-icon").setAttribute("data-lucide", item.icon || "circle");
  document.getElementById("service-eyebrow").textContent = item.category || "Service";
  document.getElementById("service-title").textContent = item.title;
  document.getElementById("service-subheading").textContent = item.heroSubheading || item.summary || "";
  document.getElementById("service-description").innerHTML = item.description || `<p>${escapeHtml(item.summary || "")}</p>`;

  const relatedSlug = SERVICE_TO_CASE_STUDY[item.slug];
  if (relatedSlug) {
    try {
      const cs = await getItemBySlug("case_studies", "slug", relatedSlug);
      const relatedWrap = document.getElementById("related-case-study");
      if (cs && relatedWrap) {
        relatedWrap.innerHTML = `
          <span class="eyebrow">Related Case Study</span>
          <h3>${escapeHtml(cs.client)}</h3>
          <p class="card-desc">${escapeHtml(cs.challenge || "")}</p>
          <span class="metric">${escapeHtml(cs.metric || "")}</span>
          <a class="card-link" href="case-study-detail.html?slug=${encodeURIComponent(cs.slug)}">View Case Study <i data-lucide="arrow-right"></i></a>`;
        relatedWrap.hidden = false;
      }
    } catch (e) {
      console.error(e); // non-critical — related case study is a bonus, not core content
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
