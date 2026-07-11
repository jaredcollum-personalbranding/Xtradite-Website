import { getPostBySlug, queryPosts } from "../wix-blog.js";
import { renderRicos, renderPlainText } from "../ricos-render.js";
import { escapeHtml, relatedPostCardHtml, getSlugParam } from "../render-helpers.js";

const root = document.getElementById("post-root");
const notFound = document.getElementById("not-found");
const slug = getSlugParam();

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

async function load() {
  if (!slug) return showNotFound();
  const post = await getPostBySlug(slug);
  if (!post) return showNotFound();

  document.title = `${post.title} — Xtradite Digital Insights`;
  document.getElementById("post-title").textContent = post.title;
  document.getElementById("post-date").textContent = formatDate(post.firstPublishedDate);
  const readTimeEl = document.getElementById("post-read-time");
  if (post.minutesToRead) {
    readTimeEl.textContent = `${post.minutesToRead} min read`;
  } else {
    readTimeEl.remove();
  }

  const bodyEl = document.getElementById("post-body");
  const rendered = renderRicos(post.richContent);
  bodyEl.innerHTML = rendered || renderPlainText(post.contentText) || `<p>${escapeHtml(post.excerpt || "")}</p>`;

  // Related Insights — the live posts don't have relatedPostIds set, so show up to 2
  // other published posts (excluding this one) as related reading.
  const relatedWrap = document.getElementById("related-posts");
  if (relatedWrap) {
    try {
      const { posts } = await queryPosts({ limit: 10 });
      const others = posts.filter((p) => p.slug !== post.slug).slice(0, 2);
      if (others.length) {
        relatedWrap.innerHTML = others.map(relatedPostCardHtml).join("");
        relatedWrap.parentElement.hidden = false;
      }
    } catch (e) {
      console.error(e); // non-critical — related posts are a bonus, not core content
    }
  }

  root.hidden = false;
}

function showNotFound() {
  root.hidden = true;
  notFound.hidden = false;
}

load();
