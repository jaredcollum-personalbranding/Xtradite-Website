/** Shared render helpers for turning live Wix CMS/Blog items into card HTML. */
import { supabase } from "./supabase-client.js";

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function serviceCardHtml(item) {
  return `
    <a class="card service-card" href="/services/${encodeURIComponent(item.slug)}">
      <div class="card-icon"><i data-lucide="${escapeHtml(item.icon || "circle")}"></i></div>
      <span class="card-category">${escapeHtml(item.category || "")}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p class="card-desc">${escapeHtml(item.summary)}</p>
      <span class="card-link">Learn More <i data-lucide="arrow-right"></i></span>
    </a>`;
}

export function industryCardHtml(item) {
  return `
    <a class="card" href="/industry-detail?slug=${encodeURIComponent(item.slug)}">
      <h3>${escapeHtml(item.title)}</h3>
      <p class="card-desc">${escapeHtml(item.summary)}</p>
      <span class="card-link">Explore <i data-lucide="arrow-right"></i></span>
    </a>`;
}

export function caseStudyCardHtml(item) {
  const media = [...(item.media || item.mediaAssets || [])]
    .filter((asset) => ["card", "hero"].includes(asset.role) && (asset.url || asset.publicUrl || asset.src) && !String(asset.mimeType || "").startsWith("video/"))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || (a.sortOrder || 0) - (b.sortOrder || 0));
  const image = media.find((asset) => asset.role === "card") || media.find((asset) => asset.role === "hero");
  const imageUrl = image?.url || image?.publicUrl || image?.src;
  const imageHtml = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(image.altText || image.alt || `${item.client} case study`)}" loading="lazy" decoding="async">`
    : `<span>Case study</span>`;
  return `
    <a class="card case-card" href="/case-study-detail?slug=${encodeURIComponent(item.slug)}">
      <div class="card-image${imageUrl ? " has-media" : ""}">${imageHtml}</div>
      <span class="tag">${escapeHtml(item.industry || "")}</span>
      <h3>${escapeHtml(item.client)}</h3>
      <p class="card-desc">${escapeHtml(item.cardSummary || item.challenge || "")}</p>
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
    .map((t) => `<a class="tag-chip tag-chip-link" href="/insights?tag=${encodeURIComponent(t)}">${escapeHtml(t)}</a>`)
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
    <a class="card blog-card" href="/insights-post?slug=${encodeURIComponent(post.slug)}" data-tags="${escapeHtml((post.tags || []).join("|"))}">
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
    <a class="card related-post-card" href="/insights-post?slug=${encodeURIComponent(post.slug)}">
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

/** Lightweight in-page lightbox for viewing a full-size image without leaving the page. */
let lightboxEl = null;
function ensureLightbox() {
  if (lightboxEl) return lightboxEl;
  lightboxEl = document.createElement("div");
  lightboxEl.className = "lightbox-overlay";
  lightboxEl.innerHTML = `
    <button type="button" class="lightbox-close" aria-label="Close"><i data-lucide="x"></i></button>
    <img class="lightbox-img" alt="">`;
  lightboxEl.addEventListener("click", (e) => {
    if (e.target === lightboxEl) closeLightbox();
  });
  lightboxEl.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
  document.body.appendChild(lightboxEl);
  renderIcons();
  return lightboxEl;
}

export function openLightbox(src, alt = "") {
  const el = ensureLightbox();
  const img = el.querySelector(".lightbox-img");
  img.src = src;
  img.alt = alt;
  el.classList.add("open");
  document.body.style.overflow = "hidden";
}

export function closeLightbox() {
  if (lightboxEl) lightboxEl.classList.remove("open");
  document.body.style.overflow = "";
}

export function showEmpty(container, message) {
  container.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
}

export function showSkeletons(container, count) {
  container.innerHTML = Array.from({ length: count }, () => `<div class="skeleton"></div>`).join("");
}

export function getSlugParam() {
  const fromQuery = new URLSearchParams(window.location.search).get("slug");
  if (fromQuery) return fromQuery;
  // /services/<slug> is a server-side rewrite (see vercel.json) — the browser's URL bar
  // and window.location keep showing the pretty path with no query string, so the slug
  // has to be parsed out of the pathname here instead.
  const pathMatch = window.location.pathname.match(/^\/services\/([a-z0-9-]+)\/?$/);
  return pathMatch ? pathMatch[1] : null;
}

export function getTagParam() {
  return new URLSearchParams(window.location.search).get("tag");
}

export function getIndustryParam() {
  return new URLSearchParams(window.location.search).get("industry");
}

/** Public URL for a "Tech Stack Logos" Storage file, given its bare brand key (e.g. "aws",
 * "postfresql", "c++") — matches the real uploaded filenames exactly, quirks included. */
export function techLogoUrl(file, publicUrl) {
  if (publicUrl) return publicUrl;
  return supabase.storage.from("rich-media").getPublicUrl(`Tech Stack Logos/Brand=${file}, Style=Light.png`).data.publicUrl;
}

/** Renders a "Technology & Applications" logo grid grouped by category.
 * @param {Array<{ category: string, items: Array<{ label: string, file: string }> }>} techCategories
 */
export function techLogoGridHtml(techCategories) {
  if (!techCategories?.length) return "";
  return techCategories
    .map(
      (group) => `
      <div class="tech-logo-section">
        <h4 class="tech-logo-category">${escapeHtml(group.category)}</h4>
        <div class="tech-logo-grid">
          ${group.items
            .map(
              (item) => `
              <div class="tech-logo-item">
                <img src="${escapeHtml(techLogoUrl(item.file, item.url))}" alt="${escapeHtml(item.label)}" loading="lazy" decoding="async">
                <span>${escapeHtml(item.label)}</span>
              </div>`
            )
            .join("")}
        </div>
      </div>`
    )
    .join("");
}

/** Renders a "What You'll Receive" deliverables checklist. */
export function deliverableListHtml(deliverables) {
  if (!deliverables?.length) return "";
  return `
    <div class="deliverable-list">
      ${deliverables
        .map(
          (d) => `
          <div class="deliverable-item"><i data-lucide="check-circle"></i><span>${escapeHtml(d)}</span></div>`
        )
        .join("")}
    </div>`;
}

/** Renders a "How It Works" / "Our Approach" timeline, reusing the homepage's .timeline
 * markup. Column count adapts to the number of steps (2-5) rather than forcing every
 * process onto a fixed 5-phase grid. */
export function timelineHtml(steps) {
  if (!steps?.length) return "";
  const cols = Math.min(steps.length, 5);
  return `
    <div class="timeline" style="--timeline-cols: ${cols};">
      ${steps
        .map(
          (s, i) => `
          <div class="timeline-step"><span class="step-num">${String(i + 1).padStart(2, "0")}</span><h4>${escapeHtml(s.title)}</h4><p>${escapeHtml(s.description)}</p></div>`
        )
        .join("")}
    </div>`;
}

/** Renders a metrics strip (2-4 stats), reusing the homepage's .stats-strip markup.
 * Entries with `animate: true` count up on scroll via wireMetricsCounters — the rest
 * (compound or qualitative values like "32% → 98%") render as static text. */
export function metricsStripHtml(metrics) {
  if (!metrics?.length) return "";
  const cols = Math.min(metrics.length, 4);
  return `
    <div class="stats-strip" style="--strip-cols: ${cols};">
      ${metrics
        .map((m) => {
          const canAnimate = Boolean(m.animate) && !/[→←↔<>]|\b(vs\.?|versus|to)\b/i.test(String(m.value ?? ""));
          return `
          <div class="stat-item"><span class="stat-number"${canAnimate ? ` data-count-to="${escapeHtml(m.value)}"` : ""}>${canAnimate ? "0" : escapeHtml(m.value)}</span><span class="stat-label">${escapeHtml(m.label)}</span></div>`;
        })
        .join("")}
    </div>`;
}

/** Wires the count-up animation for stat-number elements injected after site.js's initial
 * load-time pass (dynamically-rendered content misses that pass, since it doesn't exist
 * yet) — same duplication rationale as wireFaqAccordion above. */
export function wireMetricsCounters(container) {
  const counters = container.querySelectorAll(".stat-number[data-count-to]");
  if (!counters.length || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.4 }
  );
  counters.forEach((c) => observer.observe(c));
}

function animateCount(el) {
  const target = el.getAttribute("data-count-to");
  const match = target.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
  if (!match) {
    el.textContent = target;
    return;
  }
  const [, prefix, numStr, suffix] = match;
  const end = parseFloat(numStr);
  const decimals = (numStr.split(".")[1] || "").length;
  const duration = 1200;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = (end * eased).toFixed(decimals);
    el.textContent = `${prefix}${value}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/** Renders an FAQ accordion, reusing the homepage's .faq-item markup. */
export function faqListHtml(faqs) {
  if (!faqs?.length) return "";
  return `
    <div class="faq-list">
      ${faqs
        .map(
          (f) => `
          <div class="faq-item">
            <button class="faq-question">${escapeHtml(f.question)}<i data-lucide="plus"></i></button>
            <div class="faq-answer"><p>${escapeHtml(f.answer)}</p></div>
          </div>`
        )
        .join("")}
    </div>`;
}

/** Wires open/close click behavior for FAQ items injected after site.js's initial load-time
 * pass (dynamically-rendered content misses that pass, since it doesn't exist yet). */
export function wireFaqAccordion(container) {
  container.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-question");
    if (!q) return;
    q.addEventListener("click", () => {
      const wasOpen = item.classList.contains("open");
      item.parentElement.querySelectorAll(".faq-item").forEach((i) => i.classList.remove("open"));
      if (!wasOpen) item.classList.add("open");
    });
  });
}
