import { supabase } from "./supabase-client.js";

/**
 * Supabase content helpers — thin wrappers over supabase-js, returning the same shape
 * (camelCase field names) the page scripts already expect from the old Wix CMS layer.
 * Table columns are snake_case (idiomatic Postgres); this is where that gets bridged.
 */

const PUBLIC_SELECTS = Object.freeze({
  services_delivery: "id,title,slug,category,icon,summary,hero_subheading,description,sort_order,created_at,updated_at,status,who_its_for,what_included,how_it_works,deliverables,tech_categories,faqs,seo_title,seo_description,related_case_studies,related_blog_posts,technology_examples",
  industries_delivery: "id,title,slug,summary,challenge,solution,outcomes,sort_order,created_at,updated_at,status,related_services,seo_title,seo_description",
  case_studies_delivery: "id,client,slug,industry,headline,challenge,description,metric,sort_order,created_at,updated_at,status,metrics,approach,results_detail,testimonial_quote,testimonial_author,related_services,card_summary,seo_title,seo_description,published_at,confidentiality_note,media",
  blog_posts_delivery: "id,title,slug,excerpt,content_text,rich_content,cover_image_url,minutes_to_read,featured,pinned,first_published_at,created_at,updated_at,status,tags,seo_title,seo_description",
});

function toCamel(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camelKey] = value;
  }
  return out;
}

function publicSelect(table) {
  const select = PUBLIC_SELECTS[table];
  if (!select) throw new Error(`Unsupported public delivery source: ${table}`);
  return select;
}

function applyPublicFilters(query, table, now = new Date()) {
  let filtered = query.eq("status", "published");
  if (table === "blog_posts_delivery") filtered = filtered.lte("first_published_at", now.toISOString());
  return filtered;
}

/**
 * Query all public items from an approved delivery view, optionally sorted.
 * @param {string} table
 * @param {{ sort?: Array<{ fieldName: string, order?: "ASC"|"DESC" }> }} [options]
 * @returns {Promise<{ items: object[] }>}
 */
export async function queryItems(table, { sort } = {}) {
  let query = applyPublicFilters(supabase.from(table).select(publicSelect(table)), table);
  for (const { fieldName, order = "ASC" } of sort ?? []) {
    query = query.order(fieldName, { ascending: order === "ASC" });
  }
  const { data, error } = await query;
  if (error) throw error;
  return { items: (data ?? []).map(toCamel) };
}

/**
 * Get the first eligible public row where `fieldKey` equals `value`.
 * @param {string} table
 * @param {string} fieldKey
 * @param {unknown} value
 * @returns {Promise<object|null>}
 */
export async function getItemBySlug(table, fieldKey, value) {
  const query = applyPublicFilters(
    supabase.from(table).select(publicSelect(table)).eq(fieldKey, value),
    table,
  );
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data ? toCamel(data) : null;
}

export { PUBLIC_SELECTS };
