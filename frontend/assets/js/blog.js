import { supabase } from "./supabase-client.js";

/**
 * Supabase blog helpers — same shape (camelCase field names) the page scripts already
 * expect from the old Wix Blog layer: title, slug, excerpt, firstPublishedDate,
 * minutesToRead, richContent, contentText, plus tags and SEO overrides.
 */

function mapPost(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    contentText: row.content_text,
    richContent: row.rich_content,
    coverImageUrl: row.cover_image_url,
    minutesToRead: row.minutes_to_read,
    featured: row.featured,
    pinned: row.pinned,
    firstPublishedDate: row.first_published_at,
    tags: row.tags ?? [],
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
  };
}

/**
 * Query published posts (one page), newest first.
 * @param {{ limit?: number, cursor?: string }} [options]  `cursor` is the offset to resume from.
 * @returns {Promise<{ posts: object[], nextCursor: string|null }>}
 */
export async function queryPosts({ limit = 100, cursor } = {}) {
  const offset = cursor ? Number(cursor) : 0;
  const { data, error, count } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact" })
    .order("first_published_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  const nextOffset = offset + limit;
  return {
    posts: (data ?? []).map(mapPost),
    nextCursor: count && nextOffset < count ? String(nextOffset) : null,
  };
}

/**
 * Get one post by its URL slug. Returns null if no post matches.
 * @param {string} slug
 * @returns {Promise<object|null>}
 */
export async function getPostBySlug(slug) {
  const { data, error } = await supabase.from("blog_posts").select("*").eq("slug", slug).limit(1).maybeSingle();
  if (error) return null;
  return data ? mapPost(data) : null;
}

/**
 * Total number of blog posts. Used for empty-state logic.
 * @returns {Promise<number>}
 */
export async function getTotalPosts() {
  const { count, error } = await supabase.from("blog_posts").select("*", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}
