import { queryItems } from "../cms.js";
import { queryPosts } from "../blog.js";
import { serviceCardHtml, caseStudyCardHtml, blogCardHtml, showSkeletons, showEmpty, renderIcons } from "../render-helpers.js";

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

async function loadCaseStudies() {
  const grid = document.getElementById("case-studies-grid");
  if (!grid) return;
  showSkeletons(grid, 3);
  try {
    const { items } = await queryItems("case_studies", { sort: [{ fieldName: "sort_order", order: "ASC" }] });
    if (!items.length) return showEmpty(grid, "Case studies are managed in Supabase — add rows to the case_studies table to show them here.");
    grid.innerHTML = items.slice(0, 3).map(caseStudyCardHtml).join("");
    renderIcons();
  } catch (e) {
    console.error(e);
    showEmpty(grid, "Couldn't load case studies right now.");
  }
}

async function loadInsights() {
  const grid = document.getElementById("home-insights-grid");
  if (!grid) return;
  showSkeletons(grid, 3);
  try {
    const { posts } = await queryPosts({ limit: 3 });
    if (!posts.length) return showEmpty(grid, "Insights are managed in Supabase — add rows to the blog_posts table to show them here.");
    grid.innerHTML = posts.map(blogCardHtml).join("");
    renderIcons();
  } catch (e) {
    console.error(e);
    showEmpty(grid, "Couldn't load insights right now.");
  }
}

loadServices();
loadCaseStudies();
loadInsights();
