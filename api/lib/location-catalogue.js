const SUPABASE_URL = process.env.XTRADITE_SUPABASE_URL || "https://bmhkdyshluiloorgnwoy.supabase.co";
const SUPABASE_KEY = process.env.XTRADITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Aj9nCJLFY9aMycZeQ3buTQ_-n-Q7SFK";
const PAGE_SIZE = 1000;
const CACHE_TTL = 5 * 60 * 1000;

let cachedCatalogue = null;
let cacheExpiresAt = 0;
let pendingCatalogue = null;

async function fetchAll(table, select = "*", query = "") {
  const rows = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const separator = query ? `&${query}` : "";
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}${separator}`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          "Range-Unit": "items",
          Range: `${offset}-${offset + PAGE_SIZE - 1}`,
        },
      },
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Supabase ${table} lookup failed (${response.status}): ${body.slice(0, 180)}`);
    }

    const page = await response.json();
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

function mapLocation(row) {
  return {
    id: row.location_id,
    name: row.name,
    slug: row.slug,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    localIntro: row.local_intro,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    updatedAt: row.updated_at,
    county: row.county,
    countySlug: row.county_slug,
    region: row.region,
    regionSlug: row.region_slug,
    nation: row.nation,
    nationSlug: row.nation_slug,
  };
}

function mergeServiceRoute(row, serviceById, serviceBySlug) {
  const service = serviceById.get(row.service_id) || serviceBySlug.get(row.service_slug) || {};
  return {
    ...service,
    locationId: row.location_id,
    serviceId: row.service_id,
    slug: row.service_slug,
    title: row.service_title || service.title,
    category: row.service_category || service.category,
    summary: row.service_summary || service.summary,
    hero_subheading: row.service_hero_subheading || service.hero_subheading,
    searchLabel: row.service_search_label || row.service_title || service.title,
    localIntro: row.local_intro,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at || service.updated_at,
  };
}

async function fetchLocationCatalogue() {
  const [locationRows, serviceRouteRows, serviceRows] = await Promise.all([
    fetchAll("location_routes_delivery", "*", "order=nation_slug.asc,region_slug.asc,county_slug.asc,slug.asc"),
    fetchAll("location_service_routes_delivery", "*", "order=location_id.asc,sort_order.asc"),
    fetchAll("services_delivery", "*", "order=sort_order.asc"),
  ]);

  const locations = locationRows.map(mapLocation);
  const serviceById = new Map(serviceRows.map((service) => [service.id, service]));
  const serviceBySlug = new Map(serviceRows.map((service) => [service.slug, service]));
  const serviceRoutes = serviceRouteRows.map((row) => mergeServiceRoute(row, serviceById, serviceBySlug));
  const services = [...new Map(serviceRoutes.map((service) => [service.serviceId || service.slug, service])).values()]
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || String(a.title).localeCompare(String(b.title)));
  const servicesByLocation = new Map();

  for (const service of serviceRoutes) {
    const locationServices = servicesByLocation.get(service.locationId) || [];
    locationServices.push(service);
    servicesByLocation.set(service.locationId, locationServices);
  }

  return { locations, services, servicesByLocation };
}

async function loadLocationCatalogue({ force = false } = {}) {
  const now = Date.now();
  if (!force && cachedCatalogue && now < cacheExpiresAt) return cachedCatalogue;
  if (!force && pendingCatalogue) return pendingCatalogue;

  pendingCatalogue = fetchLocationCatalogue()
    .then((catalogue) => {
      cachedCatalogue = catalogue;
      cacheExpiresAt = Date.now() + CACHE_TTL;
      return catalogue;
    })
    .finally(() => {
      pendingCatalogue = null;
    });

  return pendingCatalogue;
}

module.exports = { fetchAll, loadLocationCatalogue };
