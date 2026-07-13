import { queryItems } from "../cms.js";
import { caseStudyCardHtml, showSkeletons, showEmpty, escapeHtml, renderIcons, getIndustryParam } from "../render-helpers.js";

let allCaseStudies = [];

function uniqueIndustries(items) {
  const seen = new Set();
  items.forEach((i) => i.industry && seen.add(i.industry));
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

function renderFilterBar(industries, activeIndustry) {
  const bar = document.getElementById("industry-filter-bar");
  if (!bar) return;
  if (industries.length < 2) {
    bar.hidden = true;
    return;
  }
  bar.hidden = false;
  const chips = [{ label: "All Industries", industry: null }, ...industries.map((i) => ({ label: i, industry: i }))];
  bar.innerHTML = chips
    .map(
      (c) =>
        `<button type="button" class="tag-filter-chip${c.industry === activeIndustry ? " active" : ""}" data-industry="${c.industry ? escapeHtml(c.industry) : ""}">${escapeHtml(c.label)}</button>`
    )
    .join("");
  bar.querySelectorAll(".tag-filter-chip").forEach((btn) => {
    btn.addEventListener("click", () => applyFilter(btn.getAttribute("data-industry") || null));
  });
}

function applyFilter(industry) {
  const grid = document.getElementById("case-studies-grid");
  if (!grid) return;

  const url = new URL(window.location.href);
  if (industry) url.searchParams.set("industry", industry);
  else url.searchParams.delete("industry");
  window.history.replaceState({}, "", url);

  document.querySelectorAll("#industry-filter-bar .tag-filter-chip").forEach((btn) => {
    btn.classList.toggle("active", (btn.getAttribute("data-industry") || null) === industry);
  });

  const filtered = industry ? allCaseStudies.filter((c) => c.industry === industry) : allCaseStudies;
  if (!filtered.length) {
    showEmpty(grid, `No case studies in "${industry}" yet.`);
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
    if (!items.length) return showEmpty(grid, "Case studies are managed in Supabase — add rows to the case_studies table to show them here.");
    allCaseStudies = items;
    renderFilterBar(uniqueIndustries(items), getIndustryParam());
    applyFilter(getIndustryParam());
  } catch (e) {
    console.error(e);
    showEmpty(grid, "Couldn't load case studies right now.");
  }
}

loadCaseStudies();
