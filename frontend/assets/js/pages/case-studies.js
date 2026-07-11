import { queryItems } from "../cms.js";
import { caseStudyCardHtml, showSkeletons, showEmpty, renderIcons } from "../render-helpers.js";

async function loadCaseStudies() {
  const grid = document.getElementById("case-studies-grid");
  if (!grid) return;
  showSkeletons(grid, 3);
  try {
    const { items } = await queryItems("case_studies", { sort: [{ fieldName: "sort_order", order: "ASC" }] });
    if (!items.length) return showEmpty(grid, "Case studies are managed in Supabase — add rows to the case_studies table to show them here.");
    grid.innerHTML = items.map(caseStudyCardHtml).join("");
    renderIcons();
  } catch (e) {
    console.error(e);
    showEmpty(grid, "Couldn't load case studies right now.");
  }
}

loadCaseStudies();
