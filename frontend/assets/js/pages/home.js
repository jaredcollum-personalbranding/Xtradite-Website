import { queryItems } from "../cms.js";
import { queryPosts } from "../blog.js";
import { serviceCardHtml, blogCardHtml, showSkeletons, showEmpty, renderIcons, escapeHtml } from "../render-helpers.js";

async function loadServices() {
  const grid = document.getElementById("services-grid");
  if (!grid) return;
  showSkeletons(grid, 6);
  try {
    const { items } = await queryItems("services_delivery", { sort: [{ fieldName: "sort_order", order: "ASC" }] });
    if (!items.length) return showEmpty(grid, "Services are being prepared. Please check back shortly.");
    grid.innerHTML = items.map(serviceCardHtml).join("");
    renderIcons();
  } catch (error) {
    console.error(error);
    showEmpty(grid, "Services could not be loaded right now.");
  }
}

function concise(value, fallback = "", limit = 190) {
  const text = String(value || fallback || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > limit ? `${text.slice(0, limit).replace(/\s+\S*$/, "")}…` : text;
}

function completenessScore(item) {
  return [
    item.challenge,
    item.approach?.[0]?.description || item.approach?.[0]?.title,
    item.metric || item.metrics?.[0]?.value,
    item.cardSummary || item.description,
    item.relatedServices?.[0]?.title,
  ].filter(Boolean).length;
}

function selectFeaturedWork(items) {
  const explicit = items.find((item) => item.isFeatured === true || item.featured === true || item.homepageFeatured === true);
  const ranked = [...items].sort((a, b) => completenessScore(b) - completenessScore(a) || Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  const primary = explicit || ranked[0];
  return { primary, secondary: ranked.filter((item) => item.slug !== primary?.slug).slice(0, 2) };
}

function featuredStoryHtml(primary, secondary) {
  const approach = primary.approach?.[0];
  const service = primary.relatedServices?.[0];
  const result = primary.metric || primary.metrics?.[0]?.value;
  const resultLabel = primary.metrics?.find((metric) => metric.value === result)?.label || primary.cardSummary;
  const challenge = concise(primary.challenge, "", 120);
  const intervention = concise(approach?.description, approach?.title, 120);
  const capability = concise(service?.title, "", 80);
  const journey = [
    challenge ? ["Constraint", challenge] : null,
    intervention ? ["Intervention", intervention] : null,
    capability ? ["Capability", capability] : null,
  ].filter(Boolean);

  return `<div class="featured-work-grid">
    <article class="featured-work-story">
      <div><span class="eyebrow">${escapeHtml(primary.industry || "Case study")}</span><h3>${escapeHtml(primary.headline || primary.client)}</h3><p>${escapeHtml(concise(primary.cardSummary || primary.description, primary.challenge, 240))}</p></div>
      ${journey.length ? `<div class="featured-work-journey" aria-label="Case-study journey">${journey.map(([label, value]) => `<div class="featured-work-step"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div>` : ""}
      <div class="featured-work-result">
        ${result ? `<div><strong>${escapeHtml(result)}</strong><span>${escapeHtml(concise(resultLabel, "Reported case-study result", 100))}</span></div>` : `<div><span>Read the complete evidence and outcome in the case study.</span></div>`}
        <a class="btn btn-primary" href="/case-studies/${encodeURIComponent(primary.slug)}">Read the full case study <i data-lucide="arrow-right"></i></a>
      </div>
    </article>
    <aside class="featured-work-aside" aria-label="More featured work">
      ${secondary.map((item) => `<a class="featured-work-secondary" href="/case-studies/${encodeURIComponent(item.slug)}"><span class="eyebrow">${escapeHtml(item.industry || "Case study")}</span><h4>${escapeHtml(item.headline || item.client)}</h4><p>${escapeHtml(concise(item.cardSummary, item.challenge, 130))}</p>${item.metric ? `<span class="metric">${escapeHtml(item.metric)}</span>` : ""}<span class="card-link">View case study <i data-lucide="arrow-right"></i></span></a>`).join("")}
      <a href="/case-studies" class="btn btn-secondary">View all case studies</a>
    </aside>
  </div>`;
}

async function loadFeaturedWork() {
  const root = document.getElementById("featured-work-root");
  if (!root) return;
  root.setAttribute("aria-busy", "true");
  root.innerHTML = '<div class="featured-work-empty" role="status"><strong>Loading featured work…</strong></div>';
  try {
    const { items } = await queryItems("case_studies_delivery", { sort: [{ fieldName: "sort_order", order: "ASC" }] });
    if (!items.length) {
      root.innerHTML = '<div class="featured-work-empty"><strong>Featured work is being prepared.</strong><p>Case studies will appear here when published in Supabase.</p><a class="btn btn-secondary" href="/case-studies">Browse case studies</a></div>';
      return;
    }
    const { primary, secondary } = selectFeaturedWork(items);
    if (!primary || completenessScore(primary) < 3) {
      root.innerHTML = '<div class="featured-work-empty"><strong>Case-study evidence is available in the library.</strong><p>The homepage feature will appear when a published record contains a clear constraint, intervention and result.</p><a class="btn btn-secondary" href="/case-studies">Browse case studies</a></div>';
      return;
    }
    root.innerHTML = featuredStoryHtml(primary, secondary);
    renderIcons();
  } catch (error) {
    console.error(error);
    root.innerHTML = '<div class="featured-work-empty"><strong>Featured work could not be loaded.</strong><p>Browse the case-study library directly.</p><a class="btn btn-secondary" href="/case-studies">View case studies</a></div>';
  } finally {
    root.removeAttribute("aria-busy");
  }
}

async function loadInsights() {
  const grid = document.getElementById("home-insights-grid");
  if (!grid) return;
  showSkeletons(grid, 3);
  try {
    const { posts } = await queryPosts({ limit: 3 });
    if (!posts.length) return showEmpty(grid, "Insights are being prepared. Please check back shortly.");
    grid.innerHTML = posts.map(blogCardHtml).join("");
    renderIcons();
  } catch (error) {
    console.error(error);
    showEmpty(grid, "Insights could not be loaded right now.");
  }
}

function animateHeroSystem() {
  const system = document.querySelector(".home-hero-system");
  const stages = Array.from(system?.querySelectorAll(".hero-system-stage") || []);
  if (stages.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let active = 0;
  let timer = null;
  let visible = true;
  const tick = () => {
    active = (active + 1) % stages.length;
    stages.forEach((stage, index) => stage.classList.toggle("is-active", index === active));
  };
  const schedule = () => {
    window.clearInterval(timer);
    timer = visible && !document.hidden ? window.setInterval(tick, 2400) : null;
  };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); }, { threshold: .25 }).observe(system);
  }
  document.addEventListener("visibilitychange", schedule);
  schedule();
}

loadServices();
loadFeaturedWork();
loadInsights();
animateHeroSystem();
