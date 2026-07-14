import { queryItems } from "../cms.js";
import { showSkeletons, showEmpty, escapeHtml, renderIcons, getIndustryParam } from "../render-helpers.js";

let allCaseStudies = [];

function uniqueIndustries(items) {
  const seen = new Set();
  items.forEach((item) => item.industry && seen.add(item.industry));
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

function caseStudyCardHtml(item) {
  const media = [...(item.media || item.mediaAssets || [])]
    .filter((asset) => ["card", "hero"].includes(asset.role) && (asset.url || asset.publicUrl || asset.src) && !String(asset.mimeType || "").startsWith("video/"))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || (a.sortOrder || 0) - (b.sortOrder || 0));
  const image = media.find((asset) => asset.role === "card") || media.find((asset) => asset.role === "hero");
  const imageUrl = image?.url || image?.publicUrl || image?.src;
  const imageHtml = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(image.altText || image.alt || `${item.client} case study`)}" loading="lazy" decoding="async">`
    : "<span>Case study</span>";

  return `
    <a class="card case-card" href="/case-studies/${encodeURIComponent(item.slug)}">
      <div class="card-image${imageUrl ? " has-media" : ""}">${imageHtml}</div>
      <span class="tag">${escapeHtml(item.industry || "Case study")}</span>
      <h3>${escapeHtml(item.headline || item.client)}</h3>
      <p class="card-desc">${escapeHtml(item.cardSummary || item.challenge || "Read the governed case-study record.")}</p>
      <span class="card-link">View case study <i data-lucide="arrow-right"></i></span>
    </a>`;
}

function renderFilterBar(industries, activeIndustry) {
  const bar = document.getElementById("industry-filter-bar");
  if (!bar) return;
  if (industries.length < 2) {
    bar.hidden = true;
    return;
  }

  bar.hidden = false;
  const options = [{ label: "All industries", industry: null }, ...industries.map((industry) => ({ label: industry, industry }))];
  bar.innerHTML = options.map((option) => `
    <button
      type="button"
      class="tag-filter-chip${option.industry === activeIndustry ? " active" : ""}"
      data-industry="${option.industry ? escapeHtml(option.industry) : ""}"
    >${escapeHtml(option.label)}</button>`).join("");

  bar.querySelectorAll(".tag-filter-chip").forEach((button) => {
    button.addEventListener("click", () => applyFilter(button.getAttribute("data-industry") || null));
  });
}

function applyFilter(industry) {
  const grid = document.getElementById("case-studies-grid");
  if (!grid) return;

  const url = new URL(window.location.href);
  if (industry) url.searchParams.set("industry", industry);
  else url.searchParams.delete("industry");
  window.history.replaceState({}, "", url);

  document.querySelectorAll("#industry-filter-bar .tag-filter-chip").forEach((button) => {
    button.classList.toggle("active", (button.getAttribute("data-industry") || null) === industry);
  });

  const filtered = industry ? allCaseStudies.filter((caseStudy) => caseStudy.industry === industry) : allCaseStudies;
  if (!filtered.length) {
    showEmpty(grid, industry ? `No approved case studies in "${industry}" yet.` : "Case studies are under evidence review. Approved records will appear here.");
    return;
  }

  grid.innerHTML = filtered.map(caseStudyCardHtml).join("");
  renderIcons();
}

async function loadCaseStudies() {
  const grid = document.getElementById("case-studies-grid");
  if (!grid) return;
  showSkeletons(grid, 6);

  try {
    const { items } = await queryItems("case_studies_delivery", { sort: [{ fieldName: "sort_order", order: "ASC" }] });
    allCaseStudies = items.filter((item) => item.publicApprovalStatus === "approved");
    if (!allCaseStudies.length) {
      renderFilterBar([], null);
      showEmpty(grid, "Case studies are under evidence review. Only independently approved records are published.");
      return;
    }

    renderFilterBar(uniqueIndustries(allCaseStudies), getIndustryParam());
    applyFilter(getIndustryParam());
  } catch (error) {
    console.error(error);
    showEmpty(grid, "Couldn't load approved case studies right now.");
  }
}

loadCaseStudies();
