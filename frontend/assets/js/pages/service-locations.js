import { escapeHtml, renderIcons } from "../render-helpers.js";
import { submitContactForm } from "../forms.js";

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

function wirePrimaryTabs(section) {
  const tabs = Array.from(section.querySelectorAll("[data-coverage-tab]"));
  const panels = Array.from(section.querySelectorAll("[data-coverage-panel]"));
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      tabs.forEach((button, buttonIndex) => {
        const selected = index === buttonIndex;
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
        panels[buttonIndex].hidden = !selected;
      });
    });
  });
}

function wireRegionTabs(section) {
  const tabs = Array.from(section.querySelectorAll("[data-region-tab]"));
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      tabs.forEach((button, buttonIndex) => {
        const selected = index === buttonIndex;
        button.setAttribute("aria-selected", String(selected));
        section.querySelector(`#service-location-region-${buttonIndex}`).hidden = !selected;
      });
    });
  });
}

function wireEmbeddedForm(section, item) {
  const form = section.querySelector("#service-location-enquiry-form");
  const status = section.querySelector("#service-location-enquiry-status");
  if (!form || !status) return;
  form.message.value = `I'm interested in ${item.title} support in my area.`;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.className = "form-status loading";
    status.textContent = "Sending…";
    try {
      await submitContactForm({
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        company: form.company.value.trim(),
        message: `${form.message.value.trim()}\n\nSource: ${window.location.href}`,
      });
      status.className = "form-status success";
      status.textContent = "Thanks — your enquiry has been sent.";
      form.reset();
      if (typeof window.gtag === "function") window.gtag("event", "generate_lead", { form_location: "service_coverage" });
    } catch (error) {
      console.error(error);
      status.className = "form-status error";
      status.textContent = "Something went wrong. Please try again in a moment.";
    } finally {
      button.disabled = false;
    }
  });
}

export function renderServiceLocationCoverage(item) {
  const root = document.getElementById("service-detail-root");
  if (!root || document.getElementById("service-location-coverage")) return;

  ensureStyles();
  addAreaServedSchema(item);
  const regionNames = Object.keys(REGIONS);
  const section = document.createElement("section");
  section.id = "service-location-coverage";
  section.className = "service-location-section";
  section.innerHTML = `
    <div class="section-head left service-location-heading">
      <span class="eyebrow">UK Coverage</span>
      <h2>${escapeHtml(item.title)} across the United Kingdom</h2>
      <p>Work with Xtradite remotely across the UK, with on-site workshops available where the scope benefits from face-to-face collaboration.</p>
    </div>
    <div class="service-coverage-tabs" role="tablist" aria-label="UK coverage options">
      ${["Coverage", "Locations", "Enquire"].map((label, index) => `<button type="button" role="tab" data-coverage-tab aria-selected="${index === 0}" aria-controls="service-coverage-panel-${index}" id="service-coverage-tab-${index}" tabindex="${index === 0 ? 0 : -1}"><span>${String(index + 1).padStart(2, "0")}</span>${label}</button>`).join("")}
    </div>
    <div class="service-coverage-shell">
      <div id="service-coverage-panel-0" data-coverage-panel role="tabpanel" aria-labelledby="service-coverage-tab-0">
        <div class="service-coverage-overview">
          <div class="service-location-map service-location-map--compact">
            <iframe title="Xtradite Digital UK service coverage map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=United%20Kingdom&z=5&output=embed"></iframe>
          </div>
          <div class="service-coverage-copy">
            <span class="service-coverage-kicker">Remote-first, UK-wide</span>
            <p>Xtradite Digital provides ${escapeHtml(item.title.toLowerCase())} support to ambitious businesses across England, Scotland, Wales and Northern Ireland. The delivery model is designed to keep senior expertise close to the work without adding unnecessary agency overhead.</p>
            <p>Projects can combine remote delivery, structured workshops and on-site sessions by arrangement. The location pages provide relevant regional routes, nearby coverage and direct enquiry options without implying a physical branch in every city.</p>
            <a class="card-link" href="/locations">View the complete UK directory <i data-lucide="arrow-right"></i></a>
          </div>
        </div>
      </div>
      <div id="service-coverage-panel-1" data-coverage-panel role="tabpanel" aria-labelledby="service-coverage-tab-1" hidden>
        <div class="service-location-tabs" role="tablist" aria-label="UK service regions">
          ${regionNames.map((name, index) => `<button class="service-location-tab" type="button" role="tab" data-region-tab aria-selected="${index === 0}" aria-controls="service-location-region-${index}">${escapeHtml(name)}</button>`).join("")}
        </div>
        ${regionNames.map((name, index) => `<div class="service-location-panel" id="service-location-region-${index}" role="tabpanel" ${index ? "hidden" : ""}><div class="service-location-links">${REGIONS[name].map((city) => cityLink(city, item.slug)).join("")}</div></div>`).join("")}
      </div>
      <div id="service-coverage-panel-2" data-coverage-panel role="tabpanel" aria-labelledby="service-coverage-tab-2" hidden>
        <div class="service-coverage-enquiry">
          <div>
            <span class="service-coverage-kicker">Local question?</span>
            <h3>Tell us where you are and what needs to change.</h3>
            <p>This short form goes directly into the existing enquiry workflow. Include your location, current challenge and preferred delivery style.</p>
          </div>
          <form id="service-location-enquiry-form" novalidate>
            <div class="service-enquiry-grid">
              <div class="form-field"><label for="service-enquiry-name">Name</label><input id="service-enquiry-name" name="name" autocomplete="name" required></div>
              <div class="form-field"><label for="service-enquiry-email">Email</label><input id="service-enquiry-email" name="email" type="email" autocomplete="email" required></div>
            </div>
            <div class="form-field"><label for="service-enquiry-company">Company <span class="optional-tag">(optional)</span></label><input id="service-enquiry-company" name="company" autocomplete="organization"></div>
            <div class="form-field"><label for="service-enquiry-message">What would you like help with?</label><textarea id="service-enquiry-message" name="message" rows="4" required></textarea></div>
            <button class="btn btn-primary" type="submit">Send enquiry <i data-lucide="arrow-right" class="btn-icon"></i></button>
            <div id="service-location-enquiry-status" class="form-status" role="status"></div>
          </form>
        </div>
      </div>
    </div>`;

  const relatedCaseStudy = document.getElementById("related-case-study");
  if (relatedCaseStudy) root.insertBefore(section, relatedCaseStudy);
  else root.appendChild(section);

  wirePrimaryTabs(section);
  wireRegionTabs(section);
  wireEmbeddedForm(section, item);
  renderIcons();
}
