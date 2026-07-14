const SUPABASE_URL = process.env.SUPABASE_URL || "https://bmhkdyshluiloorgnwoy.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_Aj9nCJLFY9aMycZeQ3buTQ_-n-Q7SFK";

function encode(value) {
  return encodeURIComponent(String(value ?? ""));
}

async function fetchRows(table, { select = "*", filters = {}, limit } = {}) {
  const params = new URLSearchParams({ select });
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, value);
  });
  if (limit) params.set("limit", String(limit));

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Supabase ${table} request failed (${response.status}): ${body.slice(0, 240)}`);
  }
  return response.json();
}

async function fetchPublishedBySlug(table, slug, select = "*") {
  const rows = await fetchRows(table, {
    select,
    filters: { slug: `eq.${encode(slug)}`, status: "eq.published" },
    limit: 1
  });
  return rows[0] || null;
}

module.exports = { fetchRows, fetchPublishedBySlug };
