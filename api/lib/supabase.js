const SUPABASE_URL = process.env.XTRADITE_SUPABASE_URL || "https://bmhkdyshluiloorgnwoy.supabase.co";
const SUPABASE_KEY = process.env.XTRADITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Aj9nCJLFY9aMycZeQ3buTQ_-n-Q7SFK";

const PUBLIC_CONTENT_SELECTS = Object.freeze({
  services_delivery: "id,title,slug,category,icon,summary,hero_subheading,description,sort_order,created_at,updated_at,published_at,status,noindex,canonical_path,primary_entity,about_entities,mention_entities,who_its_for,what_included,how_it_works,deliverables,tech_categories,faqs,seo_title,seo_description,related_case_studies,related_blog_posts,technology_examples",
  industries_delivery: "id,title,slug,summary,challenge,solution,outcomes,sort_order,created_at,updated_at,published_at,status,noindex,canonical_path,related_services,seo_title,seo_description",
  case_studies_delivery: "id,client,slug,industry,headline,challenge,description,metric,sort_order,created_at,updated_at,status,metrics,approach,results_detail,testimonial_quote,testimonial_author,related_services,card_summary,seo_title,seo_description,published_at,confidentiality_note,media,public_approval_status,public_primary_metric_approved,canonical_path,noindex",
  blog_posts_delivery: "id,title,slug,excerpt,content_text,rich_content,cover_image_url,minutes_to_read,featured,pinned,first_published_at,created_at,updated_at,status,tags,seo_title,seo_description",
});

function encode(value) {
  return encodeURIComponent(String(value ?? ""));
}

function publicSelectFor(table, fallback = "*") {
  return PUBLIC_CONTENT_SELECTS[table] || fallback;
}

async function fetchRows(table, { select = "*", filters = {}, limit } = {}) {
  const params = new URLSearchParams({ select });
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, value);
  });
  if (limit) params.set("limit", String(limit));

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, {
    headers: { apikey: SUPABASE_KEY }
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Supabase ${table} request failed (${response.status}): ${body.slice(0, 240)}`);
  }
  return response.json();
}

async function fetchPublishedBySlug(table, slug, select = publicSelectFor(table), { now = new Date() } = {}) {
  const filters = {
    slug: `eq.${encode(slug)}`,
    status: "eq.published",
  };

  if (table === "blog_posts_delivery") {
    const effectiveAt = now instanceof Date ? now : new Date(now);
    if (!Number.isFinite(effectiveAt.getTime())) throw new TypeError("A valid publication clock is required");
    filters.first_published_at = `lte.${effectiveAt.toISOString()}`;
  }

  const rows = await fetchRows(table, {
    select,
    filters,
    limit: 1
  });
  return rows[0] || null;
}

module.exports = {
  PUBLIC_CONTENT_SELECTS,
  fetchRows,
  fetchPublishedBySlug,
  publicSelectFor,
};