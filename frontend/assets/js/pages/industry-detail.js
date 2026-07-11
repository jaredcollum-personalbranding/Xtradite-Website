import { getItemBySlug } from "../cms.js";
import { escapeHtml, renderIcons, getSlugParam } from "../render-helpers.js";
import { INDUSTRY_TO_SERVICES } from "./shared-data.js";

const root = document.getElementById("industry-detail-root");
const notFound = document.getElementById("not-found");
const slug = getSlugParam();

async function load() {
  if (!slug) return showNotFound();
  let item;
  try {
    item = await getItemBySlug("industries", "slug", slug);
  } catch (e) {
    console.error(e);
    return showNotFound("Couldn't load this page", "We couldn't reach the live content service. Please refresh, or try again in a moment.");
  }
  if (!item) return showNotFound();

  document.title = `${item.title} — Xtradite Digital`;
  document.getElementById("breadcrumb-current").textContent = item.title;
  document.getElementById("industry-title").textContent = item.title;
  document.getElementById("industry-summary").textContent = item.summary || "";
  document.getElementById("industry-challenge").innerHTML = item.challenge || "";
  document.getElementById("industry-solution").innerHTML = item.solution || "";
  document.getElementById("industry-outcomes").innerHTML = item.outcomes || "";

  const serviceSlugs = INDUSTRY_TO_SERVICES[item.slug] || [];
  const relatedWrap = document.getElementById("related-services");
  if (serviceSlugs.length && relatedWrap) {
    try {
      const services = (await Promise.all(serviceSlugs.map((s) => getItemBySlug("services", "slug", s)))).filter(Boolean);
      if (services.length) {
        relatedWrap.innerHTML = services
          .map(
            (s) => `
          <a class="card" href="/service-detail?slug=${encodeURIComponent(s.slug)}">
            <div class="card-icon"><i data-lucide="${escapeHtml(s.icon || "circle")}"></i></div>
            <h3>${escapeHtml(s.title)}</h3>
            <p class="card-desc">${escapeHtml(s.summary)}</p>
            <span class="card-link">Learn More <i data-lucide="arrow-right"></i></span>
          </a>`
          )
          .join("");
        relatedWrap.parentElement.hidden = false;
      }
    } catch (e) {
      console.error(e); // non-critical — related services are a bonus, not core content
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
