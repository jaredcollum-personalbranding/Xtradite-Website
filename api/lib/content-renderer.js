const { PERSON_ID } = require("./schema");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitiseRichHtml(value) {
  const source = String(value ?? "").trim();
  if (!source) return "";
  if (!/<[a-z][\s\S]*>/i.test(source)) return `<p>${escapeHtml(source)}</p>`;

  return source
    .replace(/<\s*(script|style|iframe|object|embed|form)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(["']).*?\1/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "")
    .replace(/<(\/?)(?!p\b|br\b|strong\b|em\b|b\b|i\b|ul\b|ol\b|li\b|h2\b|h3\b|h4\b|blockquote\b|a\b|code\b|pre\b)[a-z][^>]*>/gi, "");
}

function pick(object, ...keys) {
  for (const key of keys) {
    if (object && object[key] !== undefined && object[key] !== null) return object[key];
  }
  return undefined;
}

function array(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceInner(html, id, content) {
  const escapedId = escapeRegExp(id);
  const openingPattern = new RegExp(`<([a-z][\\w:-]*)\\b[^>]*\\bid=["']${escapedId}["'][^>]*>`, "i");
  const opening = openingPattern.exec(html);
  if (!opening) return html;

  const tag = opening[1];
  const contentStart = opening.index + opening[0].length;
  const tokenPattern = new RegExp(`<\\/?${escapeRegExp(tag)}\\b[^>]*>`, "gi");
  tokenPattern.lastIndex = contentStart;
  let depth = 1;
  let token;

  while ((token = tokenPattern.exec(html))) {
    if (token[0].startsWith("</")) depth -= 1;
    else if (!token[0].endsWith("/>")) depth += 1;
    if (depth === 0) {
      return `${html.slice(0, contentStart)}${content}${html.slice(token.index)}`;
    }
  }

  return html;
}

function reveal(html, id) {
  const escapedId = escapeRegExp(id);
  const pattern = new RegExp(`<([a-z][\\w:-]*)\\b([^>]*\\bid=["']${escapedId}["'][^>]*)>`, "i");
  return html.replace(pattern, (match, tag, attributes) => {
    const cleaned = attributes
      .replace(/\s+hidden(?:=["'][^"']*["'])?/gi, "")
      .replace(/\s+data-server-rendered=["'][^"']*["']/gi, "");
    return `<${tag}${cleaned} data-server-rendered="true">`;
  });
}

function conceal(html, id) {
  const escapedId = escapeRegExp(id);
  const pattern = new RegExp(`<([a-z][\\w:-]*)\\b([^>]*\\bid=["']${escapedId}["'][^>]*)>`, "i");
  return html.replace(pattern, (match, tag, attributes) => {
    if (/\shidden(?:\s|=|>)/i.test(match)) return match;
    return `<${tag}${attributes} hidden>`;
  });
}

function setText(html, id, value) {
  return replaceInner(html, id, escapeHtml(value));
}

function setRich(html, id, value) {
  return replaceInner(html, id, sanitiseRichHtml(value));
}

function listHtml(items) {
  const values = array(items)
    .map((item) => typeof item === "string" ? item : pick(item, "label", "title", "name", "description"))
    .filter((item) => String(item || "").trim());
  return values.length ? `<ul>${values.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "";
}

function deliverablesHtml(items) {
  const values = array(items);
  if (!values.length) return "";
  return `<div class="deliverable-list">${values.map((item) => {
    const title = typeof item === "string" ? item : pick(item, "title", "name", "label");
    const description = typeof item === "object" ? pick(item, "description", "detail", "summary") : "";
    return `<article class="deliverable-item"><h3>${escapeHtml(title || "Deliverable")}</h3>${description ? `<p>${escapeHtml(description)}</p>` : ""}</article>`;
  }).join("")}</div>`;
}

function timelineHtml(items) {
  const values = array(items);
  if (!values.length) return "";
  return `<ol class="timeline-list">${values.map((item, index) => {
    const title = typeof item === "string" ? item : pick(item, "title", "label", "name");
    const description = typeof item === "object" ? pick(item, "description", "detail", "summary") : "";
    return `<li><span aria-hidden="true">${String(index + 1).padStart(2, "0")}</span><div><h3>${escapeHtml(title || `Step ${index + 1}`)}</h3>${description ? `<p>${escapeHtml(description)}</p>` : ""}</div></li>`;
  }).join("")}</ol>`;
}

function faqHtml(items) {
  const values = array(items).map((item) => ({
    question: pick(item, "question", "title", "q"),
    answer: pick(item, "answer", "response", "description", "a")
  })).filter((item) => item.question && item.answer);
  if (!values.length) return "";
  return values.map((item) => `<details class="faq-item"><summary>${escapeHtml(item.question)}</summary><div>${sanitiseRichHtml(item.answer)}</div></details>`).join("");
}

function relatedServiceCards(items) {
  return array(items).map((item) => {
    const slug = pick(item, "slug");
    const title = pick(item, "title", "name");
    if (!slug || !title) return "";
    const summary = pick(item, "summary", "description");
    return `<article class="card"><h3>${escapeHtml(title)}</h3>${summary ? `<p>${escapeHtml(summary)}</p>` : ""}<a class="card-link" href="/services/${encodeURIComponent(slug)}">View ${escapeHtml(title)}</a></article>`;
  }).join("");
}

function eligibleCaseStudy(item) {
  const status = pick(item, "status");
  const approval = pick(item, "public_approval_status", "publicApprovalStatus");
  return status === "published" && approval === "approved" && pick(item, "noindex") !== true && Boolean(pick(item, "slug"));
}

function eligibleInsight(item, now = new Date()) {
  const status = pick(item, "status");
  const publishedAt = new Date(pick(item, "first_published_at", "firstPublishedAt", "firstPublishedDate") || "");
  return status === "published" && Number.isFinite(publishedAt.getTime()) && publishedAt <= now && Boolean(pick(item, "slug"));
}

function insightBody(item) {
  if (typeof item.rich_content === "string" && item.rich_content.trim()) return item.rich_content;
  return item.content_text || item.excerpt || "";
}

function renderService(html, item) {
  let output = html;
  output = setText(output, "breadcrumb-current", item.title);
  output = setText(output, "service-title", item.title);
  output = setText(output, "service-subheading", item.hero_subheading || item.summary || "");
  output = setRich(output, "service-description", item.description || item.summary || "");
  output = setText(output, "service-eyebrow", item.category || "Service");

  const audience = listHtml(item.who_its_for);
  const included = listHtml(item.what_included);
  if (audience) output = replaceInner(output, "service-who-its-for", audience);
  if (included) output = replaceInner(output, "service-what-included", included);
  if (audience || included) output = reveal(output, "who-what-section");

  const deliverables = deliverablesHtml(item.deliverables);
  if (deliverables) {
    output = replaceInner(output, "service-deliverables", deliverables);
    output = reveal(output, "deliverables-section");
  }

  const process = timelineHtml(item.how_it_works);
  if (process) {
    output = replaceInner(output, "service-how-it-works", process);
    output = reveal(output, "how-it-works-section");
  }

  const technologies = array(item.technology_examples);
  if (technologies.length) {
    output = replaceInner(output, "service-tech-grid", technologies.map((example) => {
      const names = array(pick(example, "technologies")).map((technology) => pick(technology, "name") || technology).filter(Boolean);
      return `<article class="card service-technology-example"><span class="eyebrow">${escapeHtml(pick(example, "category") || "Workflow example")}</span><h3>${escapeHtml(pick(example, "useCase", "use_case", "title") || "Technology-supported workflow")}</h3>${pick(example, "explanation", "description") ? `<p>${escapeHtml(pick(example, "explanation", "description"))}</p>` : ""}${names.length ? `<p class="service-technology-products">${escapeHtml(names.join(" · "))}</p>` : ""}</article>`;
    }).join(""));
    output = reveal(output, "tech-section");
  }

  const relatedCaseStudy = array(item.related_case_studies).find(eligibleCaseStudy);
  if (relatedCaseStudy) {
    const heading = pick(relatedCaseStudy, "headline", "client");
    const summary = pick(relatedCaseStudy, "card_summary", "challenge", "summary");
    output = replaceInner(output, "related-case-study", `<span class="eyebrow">Related case study</span><h3>${escapeHtml(heading)}</h3>${summary ? `<p class="card-desc">${escapeHtml(summary)}</p>` : ""}<a class="card-link" href="/case-studies/${encodeURIComponent(relatedCaseStudy.slug)}">Read the case study</a>`);
    output = reveal(output, "related-case-study");
  }

  const relatedPosts = array(item.related_blog_posts).filter((post) => eligibleInsight(post));
  if (relatedPosts.length) {
    output = replaceInner(output, "related-insights", relatedPosts.map((post) => `<article class="card"><h3>${escapeHtml(pick(post, "title"))}</h3>${pick(post, "excerpt") ? `<p>${escapeHtml(post.excerpt)}</p>` : ""}<a class="card-link" href="/insights/${encodeURIComponent(post.slug)}">Read insight</a></article>`).join(""));
    output = reveal(output, "related-insights-section");
  }

  const faqs = faqHtml(item.faqs);
  if (faqs) {
    output = replaceInner(output, "service-faq", faqs);
    output = reveal(output, "faq-section");
  }

  output = reveal(output, "service-detail-root");
  return output;
}

function renderIndustry(html, item) {
  let output = html;
  output = setText(output, "breadcrumb-current", item.title);
  output = setText(output, "industry-title", item.title);
  output = setText(output, "industry-summary", item.summary || "");
  output = setRich(output, "industry-challenge", item.challenge || "");
  output = setRich(output, "industry-solution", item.solution || "");
  output = setRich(output, "industry-outcomes", item.outcomes || "");

  const related = relatedServiceCards(item.related_services);
  if (related) output = replaceInner(output, "related-services", related);

  output = output.replace('<nav class="breadcrumb">', '<nav class="breadcrumb" aria-label="Breadcrumb">');
  output = output.replace("Ready to Accelerate Your Business?", "Discuss the operational constraint you need to resolve.");
  output = output.replace("Transform your digital operations with practical consultancy built for measurable commercial results.", "Use the first conversation to clarify the current position, available evidence and practical next step.");
  output = reveal(output, "industry-detail-root");
  return output;
}

function renderCaseStudy(html, item) {
  let output = html;
  const metricApproved = item.public_primary_metric_approved === true;
  output = setText(output, "breadcrumb-current", item.client || item.headline);
  output = setText(output, "cs-tag", item.industry || "Case study");
  output = setText(output, "cs-headline", item.headline || item.client);
  output = setText(output, "cs-client", item.client || "Confidential client");

  const summary = item.card_summary || item.description || item.challenge || "";
  if (summary) {
    output = setText(output, "cs-summary", summary);
    output = reveal(output, "cs-summary");
  }

  if (item.confidentiality_note) {
    output = setText(output, "cs-confidentiality", item.confidentiality_note);
    output = reveal(output, "cs-confidentiality");
  }

  if (item.description) {
    output = setRich(output, "cs-description", item.description);
    output = reveal(output, "cs-engagement-section");
  }

  output = setRich(output, "cs-challenge", item.challenge || "");
  const approach = timelineHtml(item.approach);
  if (approach) {
    output = replaceInner(output, "cs-approach", approach);
    output = reveal(output, "cs-approach-section");
  }

  if (metricApproved && item.metric) {
    output = setText(output, "cs-primary-metric", item.metric);
    output = setText(output, "cs-visual-metric", item.metric);
  } else {
    output = conceal(output, "cs-primary-proof");
    output = setText(output, "cs-primary-metric", "");
    output = setText(output, "cs-visual-metric", "");
    output = output.replace(/<div class="cs-visual-mark">[\s\S]*?<\/div>/i, "");
  }

  const approvedResults = metricApproved ? item.results_detail : "";
  if (approvedResults) {
    output = setRich(output, "cs-results", approvedResults);
  } else {
    output = conceal(output, "cs-results-section");
  }

  if (item.testimonial_quote && item.testimonial_author) {
    output = replaceInner(output, "cs-testimonial", `${escapeHtml(item.testimonial_quote)}<footer>${escapeHtml(item.testimonial_author)}</footer>`);
    output = reveal(output, "cs-testimonial-section");
  }

  output = output.replace("Facing a similar operational ceiling?", "Discuss a comparable operational constraint.");
  output = output.replace("Let’s identify the practical moves that turn pressure into measurable progress.", "Use the first conversation to clarify the context, evidence and practical next step.");
  output = reveal(output, "case-study-detail-root");
  return output;
}

function renderInsight(html, item) {
  let output = html;
  output = setText(output, "post-title", item.title);
  output = setText(output, "post-date", item.first_published_at ? new Date(item.first_published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "");
  if (item.minutes_to_read) output = setText(output, "post-read-time", `${item.minutes_to_read} min read`);
  const tags = array(item.tags);
  if (tags.length) output = replaceInner(output, "post-tags", tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join(""));
  output = setRich(output, "post-body", insightBody(item));
  if (item.cover_image_url) output = replaceInner(output, "post-cover-wrap", `<img src="${escapeHtml(item.cover_image_url)}" alt="" loading="eager">`);
  output = output.replace("<span>Xtradite Digital Team</span>", `<a href="${PERSON_ID.replace("https://www.xtradite-digital.co.uk", "")}">Jared Collum</a>`);
  output = reveal(output, "post-root");
  return output;
}

function renderPrimaryContent(type, item, html) {
  if (type === "service") return renderService(html, item);
  if (type === "industry") return renderIndustry(html, item);
  if (type === "case-study") return renderCaseStudy(html, item);
  if (type === "insight") return renderInsight(html, item);
  return html;
}

module.exports = {
  escapeHtml,
  sanitiseRichHtml,
  renderPrimaryContent,
  faqHtml,
  eligibleCaseStudy,
  eligibleInsight,
  insightBody
};
