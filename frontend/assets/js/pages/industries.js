import { queryDataItems } from "../wix-cms.js";
import { industryCardHtml, showSkeletons, showEmpty, renderIcons } from "../render-helpers.js";

async function loadIndustries() {
  const grid = document.getElementById("industries-grid");
  if (!grid) return;
  showSkeletons(grid, 6);
  try {
    const { items } = await queryDataItems("Industries", { sort: [{ fieldName: "order", order: "ASC" }] });
    if (!items.length) return showEmpty(grid, "Industries are managed in the Wix CMS — add items in the dashboard to show them here.");
    grid.innerHTML = items.map(industryCardHtml).join("");
    renderIcons();
  } catch (e) {
    console.error(e);
    showEmpty(grid, "Couldn't load industries right now.");
  }
}

loadIndustries();
