import { queryPosts, getTotalPosts } from "../blog.js";
import { blogCardHtml, showSkeletons, showEmpty, escapeHtml, getTagParam } from "../render-helpers.js";

let allPosts = [];

function uniqueTags(posts) {
  const seen = new Set();
  posts.forEach((p) => (p.tags || []).forEach((t) => seen.add(t)));
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

function renderFilterBar(tags, activeTag) {
  const bar = document.getElementById("tag-filter-bar");
  if (!bar) return;
  if (!tags.length) {
    bar.hidden = true;
    return;
  }
  bar.hidden = false;
  const chips = [{ label: "All", tag: null }, ...tags.map((t) => ({ label: t, tag: t }))];
  bar.innerHTML = chips
    .map(
      (c) =>
        `<button type="button" class="tag-filter-chip${c.tag === activeTag ? " active" : ""}" data-tag="${c.tag ? escapeHtml(c.tag) : ""}">${escapeHtml(c.label)}</button>`
    )
    .join("");
  bar.querySelectorAll(".tag-filter-chip").forEach((btn) => {
    btn.addEventListener("click", () => applyFilter(btn.getAttribute("data-tag") || null));
  });
}

function applyFilter(tag) {
  const grid = document.getElementById("insights-grid");
  if (!grid) return;

  const url = new URL(window.location.href);
  if (tag) url.searchParams.set("tag", tag);
  else url.searchParams.delete("tag");
  window.history.replaceState({}, "", url);

  document.querySelectorAll("#tag-filter-bar .tag-filter-chip").forEach((btn) => {
    btn.classList.toggle("active", (btn.getAttribute("data-tag") || null) === tag);
  });

  const filtered = tag ? allPosts.filter((p) => (p.tags || []).includes(tag)) : allPosts;
  if (!filtered.length) {
    showEmpty(grid, `No insights tagged "${tag}" yet.`);
    return;
  }
  grid.innerHTML = filtered.map(blogCardHtml).join("");
}

async function loadPosts() {
  const grid = document.getElementById("insights-grid");
  if (!grid) return;
  showSkeletons(grid, 3);
  try {
    const total = await getTotalPosts();
    if (!total) return showEmpty(grid, "No posts published yet — add rows to the blog_posts table in Supabase to show them here.");
    const { posts } = await queryPosts({ limit: 100 });
    allPosts = posts;
    renderFilterBar(uniqueTags(posts), getTagParam());
    applyFilter(getTagParam());
  } catch (e) {
    console.error(e);
    showEmpty(grid, "Couldn't load insights right now.");
  }
}

loadPosts();
