import { escapeHtml, renderIcons } from "../render-helpers.js";

const REGIONS = {
  "South East": [
    ["Brighton & Hove", "/uk/england/south-east/east-sussex/brighton-and-hove"],
    ["London", "/uk/england/london/greater-london/london"],
    ["Oxford", "/uk/england/south-east/oxfordshire/oxford"],
    ["Reading", "/uk/england/south-east/berkshire/reading"],
    ["Guildford", "/uk/england/south-east/surrey/guildford"],
    ["Southampton", "/uk/england/south-east/hampshire/southampton"],
  ],
  "Midlands & East": [
    ["Birmingham", "/uk/england/west-midlands/west-midlands/birmingham"],
    ["Nottingham", "/uk/england/east-midlands/nottinghamshire/nottingham"],
    ["Leicester", "/uk/england/east-midlands/leicestershire/leicester"],
    ["Derby", "/uk/england/east-midlands/derbyshire/derby"],
    ["Cambridge", "/uk/england/east-of-england/cambridgeshire/cambridge"],
    ["Norwich", "/uk/england/east-of-england/norfolk/norwich"],
  ],
  "North & Nations": [
    ["Manchester", "/uk/england/north-west/greater-manchester/manchester"],
    ["Liverpool", "/uk/england/north-west/merseyside/liverpool"],
    ["Leeds", "/uk/england/yorkshire-and-humber/west-yorkshire/leeds"],
    ["Newcastle", "/uk/england/north-east/tyne-and-wear/newcastle-upon-tyne"],
    ["Edinburgh", "/uk/scotland/central-scotland/city-of-edinburgh/edinburgh"],
    ["Cardiff", "/uk/wales/south-east-wales/cardiff/cardiff"],
    ["Belfast", "/uk/northern-ireland/belfast-region/belfast/belfast"],
  ],
};

function ensureStyles() {
  if (document.querySelector('link[data-service-locations-css]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.dataset.serviceLocationsCss = "true";
  link.href = "/assets/css/service-locations.css";
  document.head.appendChild(link);
}

function cityLink([name, basePath], serviceSlug) {
  return `<a class="service-location-link" href="${basePath}/services/${encodeURIComponent(serviceSlug)}"><span>${escapeHtml(name)}</span><i data-lucide="arrow-right"></i></a>`;
}

function addAreaServedSchema(item) {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Service",
    name: item.title,
    serviceType: item.category || item.title,
    provider: {
      "@type": "Organization",
      name: "Xtradite Digital",
      url: "https://www.xtradite-digital.co.uk/",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        url: "https://www.xtradite-digital.co.uk/contact",
        areaServed: "GB",
        availableLanguage: "English",
      },
    },
    areaServed: { "@type": "Country", name: "United Kingdom" },
    url: `${window.location.origin}/services/${encodeURIComponent(item.slug)}`,
  });
  document.head.appendChild(script);
}

export function renderServiceLocationCoverage(item) {
  const root = document.getElementById("service-detail-root");
  if (!root || document.getElementById("service-location-coverage")) return;

  ensureStyles();
  addAreaServedSchema(item);

  const section = document.createElement("section");
  section.id = "service-location-coverage";
  section.className = "service-location-section";

  const tabs = Object.keys(REGIONS);
  section.innerHTML = `
    <div class="section-head left" style="margin-bottom:var(--space-24);">
      <span class="eyebrow">UK Coverage</span>
      <h2>${escapeHtml(item.title)} across the United Kingdom</h2>
    </div>
    <p class="service-location-intro">Xtradite Digital provides ${escapeHtml(item.title.toLowerCase())} support to ambitious businesses throughout the UK. Delivery is primarily remote, allowing us to work closely with teams across England, Scotland, Wales and Northern Ireland without adding unnecessary agency overhead. On-site workshops and project sessions can be arranged where the scope benefits from in-person collaboration. Use the regional directory below to view localised service information, nearby coverage and direct enquiry routes for your area.</p>
    <div class="service-location-layout">
      <div class="service-location-map">
        <iframe title="Xtradite Digital UK service coverage map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=United%20Kingdom&z=5&output=embed"></iframe>
      </div>
      <div class="service-location-directory">
        <div class="service-location-tabs" role="tablist" aria-label="UK service regions">
          ${tabs.map((name, index) => `<button class="service-location-tab" type="button" role="tab" aria-selected="${index === 0}" aria-controls="service-location-panel-${index}" id="service-location-tab-${index}">${escapeHtml(name)}</button>`).join("")}
        </div>
        ${tabs.map((name, index) => `<div class="service-location-panel" id="service-location-panel-${index}" role="tabpanel" aria-labelledby="service-location-tab-${index}" ${index ? "hidden" : ""}><div class="service-location-links">${REGIONS[name].map((city) => cityLink(city, item.slug)).join("")}</div></div>`).join("")}
        <div class="service-location-actions">
          <a class="btn btn-primary" href="/locations">Browse all UK locations <i data-lucide="map-pin" class="btn-icon"></i></a>
          <a class="btn btn-secondary" href="/contact?topic=${encodeURIComponent(`${item.title} in my area`)}">Ask about your location</a>
        </div>
      </div>
    </div>`;

  const relatedCaseStudy = document.getElementById("related-case-study");
  if (relatedCaseStudy) root.insertBefore(section, relatedCaseStudy);
  else root.appendChild(section);

  const tabButtons = section.querySelectorAll('[role="tab"]');
  tabButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((tab, tabIndex) => {
        const selected = tabIndex === index;
        tab.setAttribute("aria-selected", String(selected));
        section.querySelector(`#service-location-panel-${tabIndex}`).hidden = !selected;
      });
    });
  });

  renderIcons();
}
