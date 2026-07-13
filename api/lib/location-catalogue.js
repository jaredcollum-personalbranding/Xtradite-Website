const SUPABASE_URL = "https://bmhkdyshluiloorgnwoy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Aj9nCJLFY9aMycZeQ3buTQ_-n-Q7SFK";
const PAGE_SIZE = 1000;

async function fetchAll(table, select = "*", query = "") {
  const rows = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const separator = query ? `&${query}` : "";
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}${separator}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          "Range-Unit": "items",
          Range: `${offset}-${offset + PAGE_SIZE - 1}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Supabase ${table} lookup failed with ${response.status}`);
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

function mapServiceRoute(row) {
  return {
    locationId: row.location_id,
    serviceId: row.service_id,
    slug: row.service_slug,
    title: row.service_title,
    category: row.service_category,
    summary: row.service_summary,
    heroSubheading: row.service_hero_subheading,
    searchLabel: row.service_search_label || row.service_title,
    localIntro: row.local_intro,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  };
}

async function loadLocationCatalogue() {
  const [locationRows, serviceRouteRows] = await Promise.all([
    fetchAll("location_routes_delivery", "*", "order=nation_slug.asc,region_slug.asc,county_slug.asc,slug.asc"),
    fetchAll("location_service_routes_delivery", "*", "order=location_id.asc,sort_order.asc"),
  ]);

  const locations = locationRows.map(mapLocation);
  const serviceRoutes = serviceRouteRows.map(mapServiceRoute);
  const services = [...new Map(serviceRoutes.map((service) => [service.serviceId, service])).values()]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  const servicesByLocation = new Map();

  for (const service of serviceRoutes) {
    const locationServices = servicesByLocation.get(service.locationId) || [];
    locationServices.push(service);
    servicesByLocation.set(service.locationId, locationServices);
  }

  return { locations, services, servicesByLocation };
}

module.exports = { fetchAll, loadLocationCatalogue };
