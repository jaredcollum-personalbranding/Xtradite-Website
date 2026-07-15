const DETAIL_STYLESHEET = '<link rel="stylesheet" href="/assets/css/content-detail.css">';
const INDUSTRY_SLUGS = [
  "retail",
  "ecommerce",
  "manufacturing",
  "consumer-goods",
  "professional-services",
  "startups"
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function addSharedDetailShell(html) {
  let output = html;
  if (!output.includes("content-detail.css")) {
    output = output.replace("</head>", `${DETAIL_STYLESHEET}\n</head>`);
  }
  output = output.replace("<body>", '<body class="content-detail-page">');
  for (const slug of INDUSTRY_SLUGS) {
    output = output.split(`/industry-detail?slug=${slug}`).join(`/industries/${slug}`);
  }
  return output;
}

function insertAfterElementById(html, id, addition) {
  const marker = `id="${id}"`;
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return html;

  const openingStart = html.lastIndexOf("<", markerIndex);
  const openingEnd = html.indexOf(">", markerIndex);
  if (openingStart < 0 || openingEnd < 0) return html;

  const openingTag = html.slice(openingStart + 1, openingEnd).trim();
  const tagName = openingTag.split(/[\s>]/)[0];
  if (!tagName) return html;

  const closingTag = `</${tagName}>`;
  const closingIndex = html.indexOf(closingTag, openingEnd + 1);
  if (closingIndex < 0) return html;

  const insertionPoint = closingIndex + closingTag.length;
  return `${html.slice(0, insertionPoint)}${addition}${html.slice(insertionPoint)}`;
}

function revealById(html, id) {
  const marker = `id="${id}"`;
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return html;

  const openingStart = html.lastIndexOf("<", markerIndex);
  const openingEnd = html.indexOf(">", markerIndex);
  if (openingStart < 0 || openingEnd < 0) return html;

  const opening = html.slice(openingStart, openingEnd + 1)
    .replace(/\s+hidden(?:="[^"]*")?/gi, "")
    .replace(/\s+data-server-rendered="[^"]*"/gi, "");

  return `${html.slice(0, openingStart)}${opening.slice(0, -1)} data-server-rendered="true">${html.slice(openingEnd + 1)}`;
}

function addIndustryHero(html) {
  const renderedRoot = '<div id="industry-detail-root" data-server-rendered="true">';
  const placeholderRoot = '<div id="industry-detail-root" hidden>';
  const renderedReplacement = '<div id="industry-detail-root" class="industry-detail" data-server-rendered="true"><header class="industry-hero"><div class="industry-hero__copy">';
  const placeholderReplacement = '<div id="industry-detail-root" class="industry-detail" hidden><header class="industry-hero"><div class="industry-hero__copy">';
  if (html.includes(renderedRoot)) return html.replace(renderedRoot, renderedReplacement);
  return html.replace(placeholderRoot, placeholderReplacement);
}

function addInsightHero(html) {
  const renderedRoot = '<div id="post-root" data-server-rendered="true">';
  const placeholderRoot = '<div id="post-root" hidden>';
  const renderedReplacement = '<div id="post-root" class="insight-detail" data-server-rendered="true"><header class="insight-hero"><span class="eyebrow">Insight</span>';
  const placeholderReplacement = '<div id="post-root" class="insight-detail" hidden><header class="insight-hero"><span class="eyebrow">Insight</span>';
  if (html.includes(renderedRoot)) return html.replace(renderedRoot, renderedReplacement);
  return html.replace(placeholderRoot, placeholderReplacement);
}

function enhanceIndustry(html, item) {
  let output = addIndustryHero(addSharedDetailShell(html));

  output = insertAfterElementById(
    output,
    "industry-summary",
    '<div class="hero-ctas" style="justify-content:flex-start;"><a href="#industry-context" class="btn btn-secondary">Review the operating context</a><a href="/contact" class="btn btn-primary">Discuss this industry</a></div></div><aside class="glance-card industry-hero__principles" aria-label="Page focus"><span class="eyebrow" style="margin-bottom:0;">Page focus</span><div class="glance-item"><span class="glance-num">Context</span><span class="glance-label">Recognise the sector-specific operating problem before selecting a service.</span></div><div class="glance-item"><span class="glance-num">Constraints</span><span class="glance-label">Make commercial, operational and evidence limitations visible.</span></div><div class="glance-item"><span class="glance-num">Next step</span><span class="glance-label">Identify the practical area that needs diagnosis or delivery support.</span></div></aside></header>'
  );

  output = output.replace(
    '<div class="grid-3" style="margin-bottom: var(--space-64);">',
    '<div class="grid-3 industry-story" id="industry-context" style="margin-bottom: var(--space-64);">'
  );
  output = output.replace("The Challenge", "Operating context");
  output = output.replace("Our Solution", "How Xtradite approaches it");
  output = output.replace("Outcomes", "Intended direction");

  output = output.replace(
    '<div hidden>\n          <div class="section-head left">\n            <span class="eyebrow">Related Services</span>',
    '<div id="industry-related-services-section" class="industry-related-services" hidden>\n          <div class="section-head left">\n            <span class="eyebrow">Relevant services</span>'
  );
  output = output.replace("How we'd help.", "Where support may fit");

  if (Array.isArray(item.related_services) && item.related_services.length) {
    output = revealById(output, "industry-related-services-section");
  }

  output = output.replace("Ready to Accelerate Your Business?", "Discuss the operational constraint you need to resolve.");
  output = output.replace("Transform your digital operations with practical consultancy built for measurable commercial results.", "Use the first conversation to clarify the current position, available evidence and practical next step.");

  return output;
}

function enhanceInsight(html, item) {
  let output = addInsightHero(addSharedDetailShell(html));

  output = insertAfterElementById(
    output,
    "post-title",
    `<p class="insight-standfirst">${escapeHtml(item.excerpt || "")}</p>`
  );

  output = insertAfterElementById(output, "post-cover-wrap", "</header>");
  output = output.replace('<div class="richtext" id="post-body">', '<div class="richtext insight-body" id="post-body">');
  output = output.replace('<div class="author-box">', '<div class="author-box insight-author-card">');
  output = output.replace("About Xtradite Digital", "About the author");
  output = output.replace("Practical consultancy for retail, ecommerce and manufacturing businesses ready to accelerate digital-first growth — hands-on delivery, not just strategy decks.", "Jared Collum writes about ecommerce, digital operations, measurement and practical delivery.");
  output = output.replace("Ready to explore this further?", "Discuss the operating problem behind the symptom.");
  output = output.replace("Book a consultation with our team to discuss how these insights apply to your business.", "Use the first conversation to clarify the context, available evidence and practical next step.");
  output = output.replace('<div style="margin-top: var(--space-64);" hidden>', '<div id="post-related-section" class="insight-related" hidden>');

  if (item.cover_image_url) {
    output = output.replace('alt="" loading="eager"', `alt="${escapeHtml(item.title)}" loading="eager"`);
  }

  return output;
}

function enhanceContentDetail(type, item, html) {
  if (type === "industry") return enhanceIndustry(html, item);
  if (type === "insight") return enhanceInsight(html, item);
  return html;
}

module.exports = {
  enhanceContentDetail,
  enhanceIndustry,
  enhanceInsight,
  addSharedDetailShell,
  insertAfterElementById,
  revealById
};
