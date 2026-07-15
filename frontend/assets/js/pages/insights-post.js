import { getPostBySlug, queryPosts } from "../blog.js";
import { renderRicos, renderPlainText } from "../ricos-render.js";
import { escapeHtml, relatedPostCardHtml, tagLinksHtml, renderIcons, openLightbox, getSlugParam } from "../render-helpers.js";

const root = document.getElementById("post-root");
const notFound = document.getElementById("not-found");
const slug = window.__CONTENT_SLUG__ || getSlugParam();
const serverRendered = window.__SERVER_RENDERED__ === true;

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function setMetaByName(name, content) {
  if (!content) return;
  let element = document.querySelector(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setMetaByProperty(property, content) {
  if (!content) return;
  let element = document.querySelector(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setCanonical(href) {
  let element = document.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

function setJsonLd(post, title, description, url) {
  if (document.getElementById("xd-schema-graph")) return;
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    datePublished: post.firstPublishedDate,
    dateModified: post.updatedAt || post.firstPublishedDate,
    author: { "@type": "Person", "@id": "https://www.xtradite-digital.co.uk/about/#jared-collum", name: "Jared Collum" },
    publisher: { "@type": "Organization", "@id": "https://www.xtradite-digital.co.uk/#organisation", name: "Xtradite Digital" },
    keywords: (post.tags || []).join(", ") || undefined,
    mainEntityOfPage: url,
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
  setJsonLd(post, post.seoTitle || post.title, description, url);
}

async function load() {
  if (serverRendered) {
    if (root) root.hidden = false;
    renderIcons();
    return;
  }
  if (!slug) return showNotFound();
  const post = await getPostBySlug(slug);
  if (!post) return showNotFound();

  applySeo(post);
  document.getElementById("post-title").textContent = post.title;
  document.getElementById("post-date").textContent = formatDate(post.firstPublishedDate);
  const readTimeElement = document.getElementById("post-read-time");
  if (post.minutesToRead) readTimeElement.textContent = `${post.minutesToRead} min read`;
  else readTimeElement.remove();

  const tagsElement = document.getElementById("post-tags");
  if (tagsElement) tagsElement.innerHTML = tagLinksHtml(post.tags);

  const coverWrap = document.getElementById("post-cover-wrap");
  if (coverWrap && post.coverImageUrl) {
    const coverAlt = `Whiteboard summary diagram: ${post.title}`;
    coverWrap.innerHTML = `<button type="button" class="post-cover" aria-label="Expand full-size diagram"><img src="${escapeHtml(post.coverImageUrl)}" alt="${escapeHtml(coverAlt)}" loading="eager"><span class="post-cover-expand"><i data-lucide="maximize-2"></i><span>View full size</span></span></button>`;
    coverWrap.querySelector(".post-cover").addEventListener("click", () => openLightbox(post.coverImageUrl, coverAlt));
  }

  const bodyElement = document.getElementById("post-body");
  const rendered = renderRicos(post.richContent);
  bodyElement.innerHTML = rendered || renderPlainText(post.contentText) || `<p>${escapeHtml(post.excerpt || "")}</p>`;

  const relatedWrap = document.getElementById("related-posts");
  if (relatedWrap) {
    try {
      const { posts } = await queryPosts({ limit: 20 });
      const others = posts.filter((candidate) => candidate.slug !== post.slug);
      const sameTag = others.filter((candidate) => (candidate.tags || []).some((tag) => (post.tags || []).includes(tag)));
      const related = [...sameTag, ...others.filter((candidate) => !sameTag.includes(candidate))].slice(0, 2);
      if (related.length) {
        relatedWrap.innerHTML = related.map(relatedPostCardHtml).join("");
        relatedWrap.parentElement.hidden = false;
      }
    } catch (error) {
      console.error(error);
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
