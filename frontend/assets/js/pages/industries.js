import { queryItems } from "../cms.js";
import { industryCardHtml, showSkeletons, showEmpty, renderIcons } from "../render-helpers.js";

async function loadIndustries() {
  const grid = document.getElementById("industries-grid");
  if (!grid) return;
  showSkeletons(grid, 6);
  try {
    const { items } = await queryItems("industries_delivery", { sort: [{ fieldName: "sort_order", order: "ASC" }] });
    if (!items.length) return showEmpty(grid, "Industries are managed in Supabase — add rows to the industries table to show them here.");
    grid.innerHTML = items.map(industryCardHtml).join("");
    renderIcons();
  } catch (e) {
    console.error(e);
    showEmpty(grid, "Couldn't load industries right now.");
  }
}

loadIndustries();
