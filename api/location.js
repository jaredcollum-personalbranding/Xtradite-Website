const { locations, services } = require("../data/uk-locations");
const { localServiceIntro, renderServiceDepth, serviceProfileFor } = require("./location-service-content");

const SITE_URL = "https://www.xtradite-digital.co.uk";
const SUPABASE_URL = "https://bmhkdyshluiloorgnwoy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Aj9nCJLFY9aMycZeQ3buTQ_-n-Q7SFK";
const LOGO_URL = "https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/Branding/icon-tile-light.png";

const esc = (value = "") => String(value)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
const stripHtml = (value = "") => String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const unique = (items) => [...new Set(items)];

async function fetchService(slug) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/services_delivery?slug=eq.${encodeURIComponent(slug)}&select=*`, {
      headers: { apikey: SUPABASE_ANON_KEY }
    });
    if (!response.ok) return null;
    const rows = await response.json();
    return rows[0] || null;
  } catch (error) {
    console.error("location router: service lookup failed", error);
    return null;
  }
}

function pathFor(location, serviceSlug) {
  const base = `/uk/${location.nationSlug}/${location.regionSlug}/${location.countySlug}/${location.slug}`;
  return serviceSlug ? `${base}/services/${serviceSlug}` : base;
}

function resolvePath(rawPath) {
  const parts = String(rawPath || "").split("/").filter(Boolean).map(decodeURIComponent);
  if (!parts.length || parts[0] === "locations") return { level: "root", parts: [] };
  const [nationSlug, regionSlug, countySlug, citySlug, servicesSegment, serviceSlug] = parts;
  let matches = locations.filter((l) => l.nationSlug === nationSlug);
  if (!matches.length) return null;
  if (!regionSlug) return { level: "nation", matches, nationSlug, parts };
  matches = matches.filter((l) => l.regionSlug === regionSlug);
  if (!matches.length) return null;
  if (!countySlug) return { level: "region", matches, nationSlug, regionSlug, parts };
  matches = matches.filter((l) => l.countySlug === countySlug);
  if (!matches.length) return null;
  if (!citySlug) return { level: "county", matches, nationSlug, regionSlug, countySlug, parts };
  const location = matches.find((l) => l.slug === citySlug);
  if (!location) return null;
  if (!servicesSegment) return { level: "city", matches, location, parts };
  if (servicesSegment !== "services" || !serviceSlug || !services.some((s) => s.slug === serviceSlug)) return null;
  return { level: "service", matches, location, serviceSlug, parts };
}

function breadcrumbsFor(route, service) {
  const crumbs = [{ name: "Home", url: "/" }, { name: "Locations", url: "/locations" }];
  if (route.level === "root") return crumbs;
  const sample = route.location || route.matches[0];
  crumbs.push({ name: sample.nation, url: `/uk/${sample.nationSlug}` });
  if (["region", "county", "city", "service"].includes(route.level)) {
    crumbs.push({ name: sample.region, url: `/uk/${sample.nationSlug}/${sample.regionSlug}` });
  }
  if (["county", "city", "service"].includes(route.level)) {
    crumbs.push({ name: sample.county, url: `/uk/${sample.nationSlug}/${sample.regionSlug}/${sample.countySlug}` });
  }
  if (["city", "service"].includes(route.level)) crumbs.push({ name: sample.name, url: pathFor(sample) });
  if (route.level === "service") crumbs.push({ name: service.title, url: pathFor(sample, service.slug) });
  return crumbs;
}

function breadcrumbHtml(crumbs) {
  return crumbs.map((crumb, index) => index === crumbs.length - 1
    ? `<span aria-current="page">${esc(crumb.name)}</span>`
    : `<a href="${esc(crumb.url)}">${esc(crumb.name)}</a><span aria-hidden="true">›</span>`).join("");
}

function organisationSchema() {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Xtradite Digital",
    legalName: "Xtradite Digital",
    url: `${SITE_URL}/`,
    logo: LOGO_URL,
    areaServed: { "@type": "Country", name: "United Kingdom" },
    contactPoint: [{
      "@type": "ContactPoint",
      contactType: "sales and enquiries",
      url: `${SITE_URL}/contact`,
      availableLanguage: ["English"]
    }]
  };
}

function schemas(route, crumbs, service) {
  const graph = [organisationSchema(), {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem", position: index + 1, name: crumb.name, item: `${SITE_URL}${crumb.url}`
    }))
  }];
  const location = route.location;
  if (location) {
    graph.push({
      "@type": "Place", name: location.name,
      geo: { "@type": "GeoCoordinates", latitude: location.latitude, longitude: location.longitude },
      containedInPlace: { "@type": "AdministrativeArea", name: `${location.county}, ${location.region}, ${location.nation}` }
    });
  }
  if (route.level === "service") {
    graph.push({
      "@type": "Service",
      name: `${service.title} in ${location.name}`,
      serviceType: service.searchLabel,
      description: stripHtml(service.seo_description || service.summary || service.hero_subheading || ""),
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: { "@type": "City", name: location.name },
      url: `${SITE_URL}${pathFor(location, service.slug)}`
    });
    if (Array.isArray(service.faqs) && service.faqs.length) {
      graph.push({
        "@type": "FAQPage",
        mainEntity: service.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer }
        }))
      });
    }
  } else if (location) {
    graph.push({
      "@type": "ItemList",
      name: `Services available in ${location.name}`,
      itemListElement: services.map((item, index) => ({
        "@type": "ListItem", position: index + 1, name: item.title,
        url: `${SITE_URL}${pathFor(location, item.slug)}`
      }))
    });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
}

function serviceLinks(location) {
  return services.map((item) => `<a class="location-link" href="${pathFor(location, item.slug)}"><span>${esc(item.title)}<small>${esc(item.searchLabel)} for ${esc(location.name)}</small></span><span>→</span></a>`).join("");
}

function nearbyLocations(location) {
  return locations
    .filter((item) => item.slug !== location.slug && (item.countySlug === location.countySlug || item.regionSlug === location.regionSlug))
    .slice(0, 12);
}

function directoryLinks(items, level) {
  return items.map((item) => {
    let url;
    if (level === "nation") url = `/uk/${item.nationSlug}`;
    else if (level === "region") url = `/uk/${item.nationSlug}/${item.regionSlug}`;
    else if (level === "county") url = `/uk/${item.nationSlug}/${item.regionSlug}/${item.countySlug}`;
    else url = pathFor(item);
    return `<a class="location-link" href="${url}"><span>${esc(item.label || item.name)}${item.meta ? `<small>${esc(item.meta)}</small>` : ""}</span><span>→</span></a>`;
  }).join("");
}

function introFor(route) {
  const sample = route.location || route.matches?.[0];
  const area = route.level === "root" ? "the United Kingdom" : route.level === "nation" ? sample.nation : route.level === "region" ? sample.region : route.level === "county" ? sample.county : sample.name;
  return `<p>Xtradite Digital supports ambitious retail, ecommerce, manufacturing and professional-services organisations across ${esc(area)}. Work is delivered remotely throughout the United Kingdom, with on-site sessions available by arrangement where they add value to discovery, stakeholder alignment or implementation.</p><p>The directory below connects businesses to locally relevant pages for digital strategy, ecommerce growth, AI and automation, operational excellence, fractional leadership and project delivery. Each page explains how the service is applied in context, while linking vertically through the UK, nation, region, county and city hierarchy.</p><p>Location pages describe areas served rather than physical branch offices. This keeps the information accurate while making it easier for organisations in ${esc(area)} to find the most relevant service route, nearby locations and enquiry options.</p>`;
}

function titleFor(route, service) {
  if (route.level === "root") return "UK Locations and Service Areas";
  const sample = route.location || route.matches[0];
  if (route.level === "service") return `${service.title} in ${sample.name}`;
  if (route.level === "city") return `Digital Consultancy Services in ${sample.name}`;
  const area = route.level === "nation" ? sample.nation : route.level === "region" ? sample.region : sample.county;
  return `Digital Consultancy Services Across ${area}`;
}

function directoryFor(route) {
  if (route.level === "root") {
    return unique(locations.map((l) => l.nationSlug)).map((slug) => {
      const item = locations.find((l) => l.nationSlug === slug);
      return { ...item, label: item.nation, meta: `${locations.filter((l) => l.nationSlug === slug).length} listed locations` };
    });
  }
  if (route.level === "nation") return unique(route.matches.map((l) => l.regionSlug)).map((slug) => {
    const item = route.matches.find((l) => l.regionSlug === slug); return { ...item, label: item.region, meta: item.nation };
  });
  if (route.level === "region") return unique(route.matches.map((l) => l.countySlug)).map((slug) => {
    const item = route.matches.find((l) => l.countySlug === slug); return { ...item, label: item.county, meta: item.region };
  });
  return route.matches.map((item) => ({ ...item, label: item.name, meta: item.county }));
}

function renderDirectoryUtility(location) {
  const nearby = nearbyLocations(location);
  const regionLocations = locations.filter((item) => item.regionSlug === location.regionSlug).slice(0, 30);
  return `<section class="local-service-directory"><div class="location-shell">
    <div class="local-directory-head"><div><span class="eyebrow">Location directory</span><h2>Other ways to navigate</h2></div><p>Browse another service for ${esc(location.name)}, a nearby location or the wider ${esc(location.region)} directory.</p></div>
    <div class="location-tabs"><div class="location-tab-list" role="tablist"><button class="location-tab" role="tab" aria-selected="true" aria-controls="services-panel">Services</button><button class="location-tab" role="tab" aria-selected="false" aria-controls="nearby-panel">Nearby locations</button><button class="location-tab" role="tab" aria-selected="false" aria-controls="region-panel">Regional directory</button></div><div id="services-panel" class="location-tab-panel" role="tabpanel"><div class="location-directory">${serviceLinks(location)}</div></div><div id="nearby-panel" class="location-tab-panel" role="tabpanel" hidden><div class="location-directory">${directoryLinks(nearby.map((item) => ({ ...item, label: item.name, meta: item.county })), "city") || '<p class="location-empty">No nearby locations are currently listed.</p>'}</div></div><div id="region-panel" class="location-tab-panel" role="tabpanel" hidden><div class="location-directory">${directoryLinks(regionLocations.map((item) => ({ ...item, label: item.name, meta: item.county })), "city")}</div></div></div>
  </div></section>`;
}

function renderLocalServicePage(route, service, crumbs) {
  const location = route.location;
  const profile = serviceProfileFor(service);
  const title = `${service.title} in ${location.name}`;
  return `<main class="local-service-page">
    <section class="local-service-hero"><div class="location-shell">
      <nav class="location-breadcrumbs" aria-label="Breadcrumb">${breadcrumbHtml(crumbs)}</nav>
      <div class="local-service-hero-grid">
        <div class="local-service-hero-copy"><span class="eyebrow">${esc(service.category || service.title)} consultancy</span><h1>${esc(title)}</h1><p>${esc(profile.proposition)}</p><div class="local-service-actions"><a class="btn btn-primary" href="/contact?topic=${encodeURIComponent(title)}">Discuss the constraint</a><a class="btn btn-secondary" href="#engagement">See what the work covers</a></div><div class="local-service-delivery-note"><i data-lucide="map-pin"></i><span>UK-wide delivery with on-site collaboration in ${esc(location.name)} by arrangement. Area served; no local office is implied.</span></div></div>
        <aside class="local-service-hero-panel"><div class="local-service-panel-label"><span>Service proposition</span><i aria-hidden="true"></i></div><h2>${esc(stripHtml(service.summary || service.hero_subheading || profile.proposition))}</h2><p>${esc(localServiceIntro(service, location))}</p><div class="local-service-outcomes">${profile.outcomes.map((outcome) => `<span>${esc(outcome)}</span>`).join("")}</div></aside>
      </div>
    </div></section>
    <div id="engagement">${renderServiceDepth(service, location)}</div>
    <section class="local-service-location"><div class="location-shell"><div class="local-location-grid"><article class="local-location-copy"><span class="eyebrow">Delivery in ${esc(location.name)}</span><h2>Local collaboration without a branch-office claim</h2><p>The engagement is led as one UK-wide consultancy service. Remote working supports continuity and pace; on-site sessions can be arranged where workshops, stakeholder decisions, process observation or implementation support benefit from direct collaboration.</p><div class="local-location-facts"><span><i data-lucide="map"></i>${esc(location.name)}, ${esc(location.county)}, ${esc(location.region)}</span><span><i data-lucide="monitor"></i>Remote delivery throughout the United Kingdom</span><span><i data-lucide="users"></i>On-site working by arrangement</span></div></article><div class="local-location-map"><iframe loading="lazy" title="Map of ${esc(location.name)}" src="https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=11&output=embed" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div></div></section>
    ${renderDirectoryUtility(location)}
  </main>`;
}

function pageChrome(title, description, canonical, schema, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — Xtradite Digital</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${esc(canonical)}"><link rel="stylesheet" href="/assets/css/tokens.css"><link rel="stylesheet" href="/assets/css/main.css"><link rel="stylesheet" href="/assets/css/locations.css"><link rel="stylesheet" href="/assets/css/location-service-detail.css?v=20260713-2"><script type="application/ld+json">${schema}</script></head><body><header class="site-header" id="site-header"><div class="container header-inner"><a href="/" class="logo"><img src="https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/Branding/wordmark-caps-light.png" alt="Xtradite Digital" class="logo-img"></a><nav class="site-nav" id="site-nav"><a href="/">Home</a><a href="/services">Services</a><a href="/locations" class="active">Locations</a><a href="/case-studies">Case Studies</a><a href="/insights">Insights</a><a href="/contact">Contact</a><a href="/contact" class="btn btn-primary btn-sm header-cta-mobile">Book a Consultation</a></nav><a href="/contact" class="btn btn-primary btn-sm header-cta">Book a Consultation</a><button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation"><span></span><span></span><span></span></button></div></header>${body}<footer class="site-footer"><div class="container"><div class="footer-bottom"><span>&copy; 2026 Xtradite Digital. All rights reserved.</span><div class="footer-legal"><a href="/services">Services</a><a href="/locations">Locations</a><a href="/legal/privacy">Privacy</a><a href="/contact">Contact</a></div></div></div></footer><script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js" defer></script><script src="/assets/js/site.js" defer></script><script>document.addEventListener('click',e=>{const tab=e.target.closest('[role=tab]');if(!tab)return;const wrap=tab.closest('.location-tabs');if(!wrap)return;wrap.querySelectorAll('[role=tab]').forEach(x=>x.setAttribute('aria-selected','false'));wrap.querySelectorAll('[role=tabpanel]').forEach(x=>x.hidden=true);tab.setAttribute('aria-selected','true');const panel=wrap.querySelector('#'+tab.getAttribute('aria-controls'));if(panel)panel.hidden=false;});window.addEventListener('DOMContentLoaded',()=>window.lucide?.createIcons());</script></body></html>`;
}

module.exports = async (req, res) => {
  const route = resolvePath(req.query.path);
  if (!route) return res.status(404).send("Location page not found");
  let service = null;
  if (route.level === "service") {
    const fallback = services.find((item) => item.slug === route.serviceSlug);
    const cms = await fetchService(route.serviceSlug);
    service = { ...fallback, ...(cms || {}), title: cms?.title || fallback.title };
  }
  const title = titleFor(route, service);
  const description = route.level === "service"
    ? stripHtml(service.seo_description || `${service.title} consultancy for organisations in ${route.location.name} and ${route.location.county}. Practical diagnosis, redesign and implementation support.`)
    : `${title}. Browse Xtradite Digital services and locations across the UK.`;
  const crumbs = breadcrumbsFor(route, service);
  const canonicalPath = route.level === "root" ? "/locations" : route.level === "service" ? pathFor(route.location, service.slug) : route.level === "city" ? pathFor(route.location) : `/${["uk", ...route.parts].join("/")}`;
  const canonical = `${SITE_URL}${canonicalPath}`;
  let content;
  if (route.level === "service") {
    content = renderLocalServicePage(route, service, crumbs);
  } else if (route.level === "city") {
    const location = route.location;
    const nearby = nearbyLocations(location);
    content = `<main><section class="location-hero"><div class="location-shell"><nav class="location-breadcrumbs" aria-label="Breadcrumb">${breadcrumbHtml(crumbs)}</nav><span class="eyebrow">UK Service Area</span><h1>${esc(title)}</h1><p>${esc(description)}</p></div></section><section class="location-section"><div class="location-shell"><div class="location-grid"><article class="location-card location-copy">${introFor(route)}<div class="location-actions"><a class="btn btn-primary" href="/contact?topic=${encodeURIComponent(title)}">Discuss a project in ${esc(location.name)}</a><a class="btn btn-secondary" href="/services">View core services</a></div><p class="location-note">Area served: ${esc(location.name)}, ${esc(location.county)}, ${esc(location.region)}. No local office is implied.</p></article><aside class="location-card location-map"><iframe loading="lazy" title="Map of ${esc(location.name)}" src="https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=11&output=embed" referrerpolicy="no-referrer-when-downgrade"></iframe><div class="location-map-caption">City-centre reference: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}</div></aside></div><div class="location-tabs"><div class="location-tab-list" role="tablist"><button class="location-tab" role="tab" aria-selected="true" aria-controls="services-panel">Services</button><button class="location-tab" role="tab" aria-selected="false" aria-controls="nearby-panel">Nearby locations</button><button class="location-tab" role="tab" aria-selected="false" aria-controls="region-panel">Regional directory</button></div><div id="services-panel" class="location-tab-panel" role="tabpanel"><div class="location-directory">${serviceLinks(location)}</div></div><div id="nearby-panel" class="location-tab-panel" role="tabpanel" hidden><div class="location-directory">${directoryLinks(nearby.map((item) => ({ ...item, label: item.name, meta: item.county })), "city") || '<p class="location-empty">No nearby locations are currently listed.</p>'}</div></div><div id="region-panel" class="location-tab-panel" role="tabpanel" hidden><div class="location-directory">${directoryLinks(locations.filter((item) => item.regionSlug === location.regionSlug).slice(0, 30).map((item) => ({ ...item, label: item.name, meta: item.county })), "city")}</div></div></div></div></section></main>`;
  } else {
    const directory = directoryFor(route);
    const nextLevel = route.level === "root" ? "nation" : route.level === "nation" ? "region" : route.level === "region" ? "county" : "city";
    content = `<main><section class="location-hero"><div class="location-shell"><nav class="location-breadcrumbs" aria-label="Breadcrumb">${breadcrumbHtml(crumbs)}</nav><span class="eyebrow">UK Locations</span><h1>${esc(title)}</h1><p>${esc(description)}</p></div></section><section class="location-section"><div class="location-shell"><article class="location-card location-copy">${introFor(route)}</article><div class="location-tabs"><div class="location-tab-list" role="tablist"><button class="location-tab" role="tab" aria-selected="true" aria-controls="directory-panel">Location directory</button><button class="location-tab" role="tab" aria-selected="false" aria-controls="service-panel">Services</button></div><div id="directory-panel" class="location-tab-panel" role="tabpanel"><div class="location-directory">${directoryLinks(directory, nextLevel)}</div></div><div id="service-panel" class="location-tab-panel" role="tabpanel" hidden><div class="location-directory">${services.map((item) => `<a class="location-link" href="/services/${item.slug}"><span>${esc(item.title)}<small>${esc(item.searchLabel)}</small></span><span>→</span></a>`).join("")}</div></div></div></div></section></main>`;
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(pageChrome(title, description, canonical, schemas(route, crumbs, service), content));
};