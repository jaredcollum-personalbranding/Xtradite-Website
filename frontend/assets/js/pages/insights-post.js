import { getPostBySlug, queryPosts } from "../blog.js";
import { renderRicos, renderPlainText } from "../ricos-render.js";
import { escapeHtml, relatedPostCardHtml, tagLinksHtml, renderIcons, openLightbox, getSlugParam } from "../render-helpers.js";

const root = document.getElementById("post-root");
const notFound = document.getElementById("not-found");
const slug = getSlugParam();

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function setMetaByName(name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setMetaByProperty(property, content) {
  if (!content) return;
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(post, title, description) {
  if (document.getElementById("seo-jsonld")) return;
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: post.firstPublishedDate,
    dateModified: post.firstPublishedDate,
    author: { "@type": "Organization", name: "Xtradite Digital" },
    publisher: { "@type": "Organization", name: "Xtradite Digital" },
    keywords: (post.tags || []).join(", ") || undefined,
    mainEntityOfPage: window.location.href,
  });
  document.head.appendChild(script);
}

function applySeo(post) {
  const title = `${post.seoTitle || post.title} — Xtradite Digital Insights`;
  const description = post.seoDescription || post.excerpt || "";
  const url = `${window.location.origin}/insights/${encodeURIComponent(post.slug)}`;

  document.title = title;
  setMetaByName("description", description);
  setMetaByProperty("og:title", post.seoTitle || post.title);
  setMetaByProperty("og:description", description);
  setMetaByProperty("og:type", "article");
  setMetaByProperty("og:url", url);
  setMetaByName("twitter:card", "summary_large_image");
  setMetaByName("twitter:title", post.seoTitle || post.title);
  setMetaByName("twitter:description", description);
  setCanonical(url);
  setJsonLd(post, post.seoTitle || post.title, description);
}

async function load() {
  if (!slug) return showNotFound();
  const post = await getPostBySlug(slug);
  if (!post) return showNotFound();

  applySeo(post);

  document.getElementById("post-title").textContent = post.title;
  document.getElementById("post-date").textContent = formatDate(post.firstPublishedDate);
  const readTimeEl = document.getElementById("post-read-time");
  if (post.minutesToRead) {
    readTimeEl.textContent = `${post.minutesToRead} min read`;
  } else {
    readTimeEl.remove();
  }

  const tagsEl = document.getElementById("post-tags");
  if (tagsEl) tagsEl.innerHTML = tagLinksHtml(post.tags);

  const coverWrap = document.getElementById("post-cover-wrap");
  if (coverWrap && post.coverImageUrl) {
    const coverAlt = `Whiteboard summary diagram: ${post.title}`;
    coverWrap.innerHTML = `
      <button type="button" class="post-cover" aria-label="Expand full-size diagram">
        <img src="${escapeHtml(post.coverImageUrl)}" alt="${escapeHtml(coverAlt)}" loading="eager">
        <span class="post-cover-expand"><i data-lucide="maximize-2"></i><span>View full size</span></span>
      </button>`;
    coverWrap.querySelector(".post-cover").addEventListener("click", () => openLightbox(post.coverImageUrl, coverAlt));
  }

  const bodyEl = document.getElementById("post-body");
  const rendered = renderRicos(post.richContent);
  bodyEl.innerHTML = rendered || renderPlainText(post.contentText) || `<p>${escapeHtml(post.excerpt || "")}</p>`;

  // Related Insights — prefer posts sharing a tag with this one, then fill up to 2
  // with other recent posts (excluding this one).
  const relatedWrap = document.getElementById("related-posts");
  if (relatedWrap) {
    try {
      const { posts } = await queryPosts({ limit: 20 });
      const others = posts.filter((p) => p.slug !== post.slug);
      const sameTag = others.filter((p) => (p.tags || []).some((t) => (post.tags || []).includes(t)));
      const rest = others.filter((p) => !sameTag.includes(p));
      const related = [...sameTag, ...rest].slice(0, 2);
      if (related.length) {
        relatedWrap.innerHTML = related.map(relatedPostCardHtml).join("");
        relatedWrap.parentElement.hidden = false;
      }
    } catch (e) {
      console.error(e); // non-critical — related posts are a bonus, not core content
    }
  }

  root.hidden = false;
  renderIcons();
}

function showNotFound() {
  root.hidden = true;
  notFound.hidden = false;
}

load();
