import { queryItems } from "../cms.js";
import { serviceCardHtml, showSkeletons, showEmpty, renderIcons } from "../render-helpers.js";

async function loadServices() {
  const grid = document.getElementById("services-grid");
  if (!grid) return;
  showSkeletons(grid, 6);
  try {
    const { items } = await queryItems("services", { sort: [{ fieldName: "sort_order", order: "ASC" }] });
    if (!items.length) return showEmpty(grid, "Services are managed in Supabase — add rows to the services table to show them here.");
    grid.innerHTML = items.map(serviceCardHtml).join("");
    renderIcons();
  } catch (e) {
    console.error(e);
    showEmpty(grid, "Couldn't load services right now.");
  }
}

loadServices();
