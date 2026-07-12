/** Hand-picked cross-link maps (curatorial choice, not fabricated data — every slug it
 * points to is a real, live CMS item). Used by service-detail and industry-detail pages. */
export const SERVICE_TO_CASE_STUDY = {
  "ai-automation": "scale-up-consumer-brand-ai-operations",
  "digital-strategy": "multi-marketplace-consumer-goods-brand",
  "ecommerce-growth": "dtc-fragrance-beauty-retailer",
  "operational-excellence": "fast-growth-fashion-retailer",
  "fractional-leadership": "subscription-led-coffee-brand",
  "project-delivery": "digital-healthcare-platform",
};

/** Two related Insights posts per service, hand-picked by topical overlap. */
export const SERVICE_TO_RELATED_POSTS = {
  "ai-automation": ["the-hidden-cost-of-manual-reconciliation", "why-growth-slows-when-systems-dont-speak-to-each-other"],
  "digital-strategy": ["what-happens-when-strategy-outruns-operations", "why-digital-transformation-fails-without-operational-readiness"],
  "ecommerce-growth": ["how-better-fulfilment-data-improves-conversion", "why-inventory-accuracy-is-a-revenue-issue"],
  "operational-excellence": ["what-multi-channel-retailers-get-wrong-about-fulfilment", "early-signs-your-fulfilment-data-is-costing-you-money"],
  "fractional-leadership": ["fractional-leadership-the-smarter-way-to-access-senior-expertise", "when-to-hire-full-time-vs-fractional-leadership"],
  "project-delivery": ["why-your-website-launch-didnt-fix-the-real-problem", "the-cost-of-treating-operations-as-an-afterthought"],
};

/** Reverse of SERVICE_TO_CASE_STUDY — the single most relevant service for a case study's
 * cross-link, derived from the same curatorial map so the two pages never disagree. */
export const CASE_STUDY_TO_SERVICE = Object.fromEntries(
  Object.entries(SERVICE_TO_CASE_STUDY).map(([service, caseStudy]) => [caseStudy, service])
);

export const INDUSTRY_TO_SERVICES = {
  retail: ["ecommerce-growth", "operational-excellence", "ai-automation"],
  ecommerce: ["ecommerce-growth", "digital-strategy", "ai-automation"],
  manufacturing: ["ai-automation", "operational-excellence", "project-delivery"],
  "consumer-goods": ["operational-excellence", "digital-strategy", "project-delivery"],
  "professional-services": ["fractional-leadership", "operational-excellence", "digital-strategy"],
  startups: ["fractional-leadership", "digital-strategy", "project-delivery"],
};
