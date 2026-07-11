import { getDataItemBy, queryDataItems } from "../wix-cms.js";
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

async function load() {
  if (!slug) return showNotFound();
  let item;
  try {
    item = await getDataItemBy("CaseStudies", "slug", slug);
  } catch (e) {
    console.error(e);
    return showNotFound("Couldn't load this page", "We couldn't reach the live content service. Please refresh, or try again in a moment.");
  }
  if (!item) return showNotFound();

  document.title = `${item.client} — Xtradite Digital`;
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
      const { items } = await queryDataItems("CaseStudies", { sort: [{ fieldName: "order", order: "ASC" }] });
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
