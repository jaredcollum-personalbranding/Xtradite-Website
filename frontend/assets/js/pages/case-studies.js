import { queryDataItems } from "../wix-cms.js";
import { caseStudyCardHtml, showSkeletons, showEmpty, renderIcons } from "../render-helpers.js";

async function loadCaseStudies() {
  const grid = document.getElementById("case-studies-grid");
  if (!grid) return;
  showSkeletons(grid, 3);
  try {
    const { items } = await queryDataItems("CaseStudies", { sort: [{ fieldName: "order", order: "ASC" }] });
    if (!items.length) return showEmpty(grid, "Case studies are managed in the Wix CMS — add items in the dashboard to show them here.");
    grid.innerHTML = items.map(caseStudyCardHtml).join("");
    renderIcons();
  } catch (e) {
    console.error(e);
    showEmpty(grid, "Couldn't load case studies right now.");
  }
}

loadCaseStudies();
