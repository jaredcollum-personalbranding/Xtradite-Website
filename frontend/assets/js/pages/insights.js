import { queryPosts, getTotalPosts } from "../blog.js";
import { blogCardHtml, showSkeletons, showEmpty } from "../render-helpers.js";

async function loadPosts() {
  const grid = document.getElementById("insights-grid");
  if (!grid) return;
  showSkeletons(grid, 3);
  try {
    const total = await getTotalPosts();
    if (!total) return showEmpty(grid, "No posts published yet — add rows to the blog_posts table in Supabase to show them here.");
    const { posts } = await queryPosts({ limit: 20 });
    grid.innerHTML = posts.map(blogCardHtml).join("");
  } catch (e) {
    console.error(e);
    showEmpty(grid, "Couldn't load insights right now.");
  }
}

loadPosts();
