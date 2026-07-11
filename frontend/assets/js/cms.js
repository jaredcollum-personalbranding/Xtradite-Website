import { supabase } from "./supabase-client.js";

/**
 * Supabase content helpers — thin wrappers over supabase-js, returning the same shape
 * (camelCase field names) the page scripts already expect from the old Wix CMS layer.
 * Table columns are snake_case (idiomatic Postgres); this is where that gets bridged.
 */

function toCamel(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camelKey] = value;
  }
  return out;
}

/**
 * Query all items from a table, optionally sorted.
 * @param {string} table
 * @param {{ sort?: Array<{ fieldName: string, order?: "ASC"|"DESC" }> }} [options]
 * @returns {Promise<{ items: object[] }>}
 */
export async function queryItems(table, { sort } = {}) {
  let query = supabase.from(table).select("*");
  for (const { fieldName, order = "ASC" } of sort ?? []) {
    query = query.order(fieldName, { ascending: order === "ASC" });
  }
  const { data, error } = await query;
  if (error) throw error;
  return { items: (data ?? []).map(toCamel) };
}

/**
 * Get the first row where `fieldKey` equals `value`. Returns null if no match.
 * @param {string} table
 * @param {string} fieldKey
 * @param {unknown} value
 * @returns {Promise<object|null>}
 */
export async function getItemBySlug(table, fieldKey, value) {
  const { data, error } = await supabase.from(table).select("*").eq(fieldKey, value).limit(1).maybeSingle();
  if (error) throw error;
  return data ? toCamel(data) : null;
}
