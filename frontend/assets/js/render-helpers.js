/** Shared render helpers for turning live Wix CMS/Blog items into card HTML. */

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function serviceCardHtml(item) {
  return `
    <a class="card service-card" href="service-detail.html?slug=${encodeURIComponent(item.slug)}">
      <div class="card-icon"><i data-lucide="${escapeHtml(item.icon || "circle")}"></i></div>
      <span class="card-category">${escapeHtml(item.category || "")}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p class="card-desc">${escapeHtml(item.summary)}</p>
      <span class="card-link">Learn More <i data-lucide="arrow-right"></i></span>
    </a>`;
}

export function industryCardHtml(item) {
  return `
    <a class="card" href="industry-detail.html?slug=${encodeURIComponent(item.slug)}">
      <h3>${escapeHtml(item.title)}</h3>
      <p class="card-desc">${escapeHtml(item.summary)}</p>
      <span class="card-link">Explore <i data-lucide="arrow-right"></i></span>
    </a>`;
}

export function caseStudyCardHtml(item) {
  return `
    <a class="card case-card" href="case-study-detail.html?slug=${encodeURIComponent(item.slug)}">
      <div class="card-image">Case Study Photography</div>
      <span class="tag">${escapeHtml(item.industry || "")}</span>
      <h3>${escapeHtml(item.client)}</h3>
      <p class="card-desc">${escapeHtml(item.challenge || "")}</p>
      <span class="metric">${escapeHtml(item.metric || "")}</span>
      <span class="card-link">View Case Study <i data-lucide="arrow-right"></i></span>
    </a>`;
}

/** Non-interactive tag badges — used inside card links, where a nested <a> would be invalid HTML. */
export function tagListHtml(tags) {
  if (!tags?.length) return "";
  return `<div class="tag-chip-list">${tags.map((t) => `<span class="tag-chip">${escapeHtml(t)}</span>`).join("")}</div>`;
}

/** Clickable tag links to the filtered blog landing page — for use outside any wrapping <a>. */
export function tagLinksHtml(tags) {
  if (!tags?.length) return "";
  return `<div class="tag-chip-list">${tags
    .map((t) => `<a class="tag-chip tag-chip-link" href="insights.html?tag=${encodeURIComponent(t)}">${escapeHtml(t)}</a>`)
    .join("")}</div>`;
}

/**
 * Cover illustration slot for a blog card. Posts' covers are whiteboard-style hand-drawn
 * illustrations — shown uncropped-feeling on a plain light backdrop (object-fit: contain,
 * not cover) so linework doesn't get clipped, with a small doodle placeholder for posts
 * that don't have one yet so the grid stays visually uniform either way.
 */
export function blogCoverHtml(post) {
  if (post.coverImageUrl) {
    return `
      <div class="blog-card-cover">
        <img src="${escapeHtml(post.coverImageUrl)}" alt="" loading="lazy" decoding="async">
      </div>`;
  }
  return `
    <div class="blog-card-cover blog-card-cover-placeholder">
      <i data-lucide="pen-tool"></i>
    </div>`;
}

export function blogCardHtml(post) {
  const date = post.firstPublishedDate ? new Date(post.firstPublishedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
  return `
    <a class="card blog-card" href="insights-post.html?slug=${encodeURIComponent(post.slug)}" data-tags="${escapeHtml((post.tags || []).join("|"))}">
      ${blogCoverHtml(post)}
      <span class="card-category">${escapeHtml(date)}${post.minutesToRead ? ` &middot; ${post.minutesToRead} min read` : ""}</span>
      <h3>${escapeHtml(post.title)}</h3>
      <p class="card-desc">${escapeHtml(post.excerpt)}</p>
      ${tagListHtml(post.tags)}
      <span class="card-link">Read More <i data-lucide="arrow-right"></i></span>
    </a>`;
}

export function relatedPostCardHtml(post) {
  const date = post.firstPublishedDate ? new Date(post.firstPublishedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
  return `
    <a class="card related-post-card" href="insights-post.html?slug=${encodeURIComponent(post.slug)}">
      <div class="blog-card-cover blog-card-cover-sm${post.coverImageUrl ? "" : " blog-card-cover-placeholder"}">
        ${post.coverImageUrl ? `<img src="${escapeHtml(post.coverImageUrl)}" alt="" loading="lazy" decoding="async">` : `<i data-lucide="pen-tool"></i>`}
      </div>
      <h4>${escapeHtml(post.title)}</h4>
      <p class="card-desc">${escapeHtml(date)}</p>
    </a>`;
}

export function renderIcons() {
  if (window.lucide) window.lucide.createIcons();
}

export function showEmpty(container, message) {
  container.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
}

export function showSkeletons(container, count) {
  container.innerHTML = Array.from({ length: count }, () => `<div class="skeleton"></div>`).join("");
}

export function getSlugParam() {
  return new URLSearchParams(window.location.search).get("slug");
}

export function getTagParam() {
  return new URLSearchParams(window.location.search).get("tag");
}
