const { loadLocationCatalogue } = require("./lib/location-catalogue");

const SITE_URL = "https://www.xtradite-digital.co.uk";
const LOGO_URL = "https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/Branding/icon-tile-light.png";

const esc = (value = "") => String(value)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
const stripHtml = (value = "") => String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const unique = (items) => [...new Set(items)];

function pathFor(location, serviceSlug) {
  const base = `/uk/${location.nationSlug}/${location.regionSlug}/${location.countySlug}/${location.slug}`;
  return serviceSlug ? `${base}/services/${serviceSlug}` : base;
}

function resolvePath(rawPath, locations, servicesByLocation) {
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
  const service = servicesByLocation.get(location.id)?.find((item) => item.slug === serviceSlug);
  if (servicesSegment !== "services" || !serviceSlug || !service) return null;
  return { level: "service", matches, location, service, serviceSlug, parts };
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
    : `<a href="${esc(crumb.url)}">${esc(crumb.name)}</a><span aria-hidden="true">â€º</span>`).join("");
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

function schemas(route, crumbs, service, locationServices) {
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
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: { "@type": "City", name: location.name },
      url: `${SITE_URL}${pathFor(location, service.slug)}`
    });
  } else if (location) {
    graph.push({
      "@type": "ItemList",
      name: `Services available in ${location.name}`,
      itemListElement: locationServices.map((item, index) => ({
        "@type": "ListItem", position: index + 1, name: item.title,
        url: `${SITE_URL}${pathFor(location, item.slug)}`
      }))
    });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
}

function serviceLinks(location, locationServices) {
  return locationServices.map((item) => `<a class="location-link" href="${pathFor(location, item.slug)}"><span>${esc(item.title)}<small>${esc(item.searchLabel)} for ${esc(location.name)}</small></span><span>â†’</span></a>`).join("");
}

function nearbyLocations(location, locations) {
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
    return `<a class="location-link" href="${url}"><span>${esc(item.label || item.name)}${item.meta ? `<small>${esc(item.meta)}</small>` : ""}</span><span>â†’</span></a>`;
  }).join("");
}

function introFor(route, service) {
  if (route.level === "service") {
    const l = route.location;
    if (service.localIntro) return service.localIntro;
    return `<p>Xtradite Digital provides ${esc(service.searchLabel)} for businesses in ${esc(l.name)} and across ${esc(l.county)}. Engagements are delivered remotely throughout the UK, with on-site working available by arrangement when the programme benefits from direct collaboration with leadership, commercial or delivery teams.</p><p>Our work connects strategy to implementation. For organisations in ${esc(l.name)}, that can include diagnosing operational constraints, improving ecommerce and customer journeys, introducing practical automation, strengthening measurement, or providing senior fractional leadership. The scope is shaped around the commercial outcome rather than a fixed agency package.</p><p>${esc(l.name)} sits within ${esc(l.region)}, giving businesses access to a broad regional customer and talent market. This page provides a local route into the same UK-wide consultancy capability, with clear links to nearby areas and related services. Xtradite does not claim a permanent office in ${esc(l.name)}; the location is an area served.</p>`;
  }
  const sample = route.location || route.matches?.[0];
  if (route.level === "city" && sample.localIntro) return sample.localIntro;
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

function pageChrome(title, description, canonical, schema, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} â€” Xtradite Digital</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${esc(canonical)}"><link rel="stylesheet" href="/assets/css/tokens.css"><link rel="stylesheet" href="/assets/css/main.css"><link rel="stylesheet" href="/assets/css/locations.css"><script type="application/ld+json">${schema}</script></head><body><header class="site-header" id="site-header"><div class="container header-inner"><a href="/" class="logo"><img src="https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/Branding/wordmark-caps-light.png" alt="Xtradite Digital" class="logo-img"></a><nav class="site-nav" id="site-nav"><a href="/">Home</a><a href="/services">Services</a><a href="/locations" class="active">Locations</a><a href="/case-studies">Case Studies</a><a href="/insights">Insights</a><a href="/contact">Contact</a><a href="/contact" class="btn btn-primary btn-sm header-cta-mobile">Book a Consultation</a></nav><a href="/contact" class="btn btn-primary btn-sm header-cta">Book a Consultation</a><button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation"><span></span><span></span><span></span></button></div></header>${body}<footer class="site-footer"><div class="container"><div class="footer-bottom"><span>&copy; 2026 Xtradite Digital. All rights reserved.</span><div class="footer-legal"><a href="/services">Services</a><a href="/locations">Locations</a><a href="/legal/privacy">Privacy</a><a href="/contact">Contact</a></div></div></div></footer><script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js" defer></script><script src="/assets/js/site.js" defer></script><script>document.addEventListener('click',e=>{const tab=e.target.closest('[role=tab]');if(!tab)return;const wrap=tab.closest('.location-tabs');wrap.querySelectorAll('[role=tab]').forEach(x=>x.setAttribute('aria-selected','false'));wrap.querySelectorAll('[role=tabpanel]').forEach(x=>x.hidden=true);tab.setAttribute('aria-selected','true');wrap.querySelector('#'+tab.getAttribute('aria-controls')).hidden=false;});</script></body></html>`;
}

module.exports = async (req, res) => {
  let catalogue;
  try {
    catalogue = await loadLocationCatalogue();
  } catch (error) {
    console.error("location router: catalogue lookup failed", error);
    res.setHeader("Retry-After", "60");
    return res.status(503).send("Location directory temporarily unavailable");
  }

  const { locations, services, servicesByLocation } = catalogue;
  const route = resolvePath(req.query.path, locations, servicesByLocation);
  if (!route) return res.status(404).send("Location page not found");
  const service = route.level === "service" ? route.service : null;
  const title = service?.seoTitle || route.location?.seoTitle || titleFor(route, service);
  const description = service?.seoDescription || route.location?.seoDescription || (route.level === "service"
    ? `${service.title} for organisations in ${route.location.name}, ${route.location.county}. UK-wide delivery with local and on-site support by arrangement.`
    : `${title}. Browse Xtradite Digital services and locations across the UK.`);
  const crumbs = breadcrumbsFor(route, service);
  const canonicalPath = route.level === "root" ? "/locations" : route.level === "service" ? pathFor(route.location, service.slug) : route.level === "city" ? pathFor(route.location) : `/${["uk", ...route.parts].join("/")}`;
  const canonical = `${SITE_URL}${canonicalPath}`;
  const intro = introFor(route, service);
  let content;
  if (route.level === "city" || route.level === "service") {
    const l = route.location;
    const locationServices = servicesByLocation.get(l.id) || [];
    const nearby = nearbyLocations(l, locations);
    content = `<main><section class="location-hero"><div class="location-shell"><nav class="location-breadcrumbs" aria-label="Breadcrumb">${breadcrumbHtml(crumbs)}</nav><span class="eyebrow">${route.level === "service" ? esc(service.title) : "UK Service Area"}</span><h1>${esc(title)}</h1><p>${esc(description)}</p></div></section><section class="location-section"><div class="location-shell"><div class="location-grid"><article class="location-card location-copy">${route.level === "service" ? `<div class="location-service-intro"><strong>${esc(service.title)}</strong><p>${esc(stripHtml(service.summary || service.heroSubheading || service.searchLabel))}</p></div>` : ""}${intro}<div class="location-actions"><a class="btn btn-primary" href="/contact?topic=${encodeURIComponent(title)}">Discuss a project in ${esc(l.name)}</a><a class="btn btn-secondary" href="/services">View core services</a></div><p class="location-note">Area served: ${esc(l.name)}, ${esc(l.county)}, ${esc(l.region)}. No local office is implied.</p></article><aside class="location-card location-map"><iframe loading="lazy" title="Map of ${esc(l.name)}" src="https://www.google.com/maps?q=${l.latitude},${l.longitude}&z=11&output=embed" referrerpolicy="no-referrer-when-downgrade"></iframe><div class="location-map-caption">City-centre reference: ${l.latitude.toFixed(4)}, ${l.longitude.toFixed(4)}</div></aside></div><div class="location-tabs"><div class="location-tab-list" role="tablist"><button class="location-tab" role="tab" aria-selected="true" aria-controls="services-panel">Services</button><button class="location-tab" role="tab" aria-selected="false" aria-controls="nearby-panel">Nearby locations</button><button class="location-tab" role="tab" aria-selected="false" aria-controls="region-panel">Regional directory</button></div><div id="services-panel" class="location-tab-panel" role="tabpanel"><div class="location-directory">${serviceLinks(l, locationServices)}</div></div><div id="nearby-panel" class="location-tab-panel" role="tabpanel" hidden><div class="location-directory">${directoryLinks(nearby.map(x=>({...x,label:x.name,meta:x.county})),"city") || '<p class="location-empty">No nearby locations are currently listed.</p>'}</div></div><div id="region-panel" class="location-tab-panel" role="tabpanel" hidden><div class="location-directory">${directoryLinks(locations.filter(x=>x.regionSlug===l.regionSlug).slice(0,30).map(x=>({...x,label:x.name,meta:x.county})),"city")}</div></div></div></div></section></main>`;
  } else {
    const directory = directoryFor(route);
    const nextLevel = route.level === "root" ? "nation" : route.level === "nation" ? "region" : route.level === "region" ? "county" : "city";
    content = `<main><section class="location-hero"><div class="location-shell"><nav class="location-breadcrumbs" aria-label="Breadcrumb">${breadcrumbHtml(crumbs)}</nav><span class="eyebrow">UK Locations</span><h1>${esc(title)}</h1><p>${esc(description)}</p></div></section><section class="location-section"><div class="location-shell"><article class="location-card location-copy">${intro}</article><div class="location-tabs"><div class="location-tab-list" role="tablist"><button class="location-tab" role="tab" aria-selected="true" aria-controls="directory-panel">Location directory</button><button class="location-tab" role="tab" aria-selected="false" aria-controls="service-panel">Services</button></div><div id="directory-panel" class="location-tab-panel" role="tabpanel"><div class="location-directory">${directoryLinks(directory,nextLevel)}</div></div><div id="service-panel" class="location-tab-panel" role="tabpanel" hidden><div class="location-directory">${services.map(s=>`<a class="location-link" href="/services/${s.slug}"><span>${esc(s.title)}<small>${esc(s.searchLabel)}</small></span><span>â†’</span></a>`).join("")}</div></div></div></div></section></main>`;
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  const schemaServices = route.location ? (servicesByLocation.get(route.location.id) || []) : services;
  res.status(200).send(pageChrome(title, description, canonical, schemas(route, crumbs, service, schemaServices), content));
};

