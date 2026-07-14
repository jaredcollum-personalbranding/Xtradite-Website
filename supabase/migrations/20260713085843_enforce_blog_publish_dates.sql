-- Treat first_published_at as a real publication gate so scheduled articles are not
-- crawlable, returned to clients, or included in the sitemap before their publish date.

create or replace view public.blog_posts_delivery
with (security_invoker = true) as
select
  b.id, b.title, b.slug, b.excerpt, b.content_text, b.rich_content,
  b.cover_image_url, b.minutes_to_read, b.featured, b.pinned,
  b.first_published_at, b.created_at, b.updated_at, b.status,
  coalesce((
    select array_agg(t.name order by bt.sort_order)
    from public.blog_post_tags bt
    join public.tags t on t.id = bt.tag_id
    where bt.blog_post_id = b.id
  ), '{}'::text[]) as tags,
  b.seo_title,
  b.seo_description
from public.blog_posts b
where b.status = 'published'
  and b.first_published_at <= now();

revoke all on table public.blog_posts_delivery from anon, authenticated;
grant select on table public.blog_posts_delivery to anon, authenticated;
