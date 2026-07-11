/** Hand-picked cross-link maps (curatorial choice, not fabricated data — every slug it
 * points to is a real, live CMS item). Used by service-detail and industry-detail pages. */
export const SERVICE_TO_CASE_STUDY = {
  "ai-automation": "kaldura-manufacturing",
  "digital-strategy": "verlane-marketplace",
  "ecommerce-growth": "verlane-marketplace",
  "operational-excellence": "northfield-retail-group",
  "fractional-leadership": "northfield-retail-group",
  "project-delivery": "kaldura-manufacturing",
};

export const INDUSTRY_TO_SERVICES = {
  retail: ["ecommerce-growth", "operational-excellence", "ai-automation"],
  ecommerce: ["ecommerce-growth", "digital-strategy", "ai-automation"],
  manufacturing: ["ai-automation", "operational-excellence", "project-delivery"],
  "consumer-goods": ["operational-excellence", "digital-strategy", "project-delivery"],
  "professional-services": ["fractional-leadership", "operational-excellence", "digital-strategy"],
  startups: ["fractional-leadership", "digital-strategy", "project-delivery"],
};
