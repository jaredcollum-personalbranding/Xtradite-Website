-- Xtradite Digital: adds tags + SEO override fields to blog_posts.
-- Run this once in the Supabase SQL Editor (after supabase/schema.sql).

alter table blog_posts
  add column if not exists tags text[] not null default '{}',
  add column if not exists seo_title text,
  add column if not exists seo_description text;

create index if not exists blog_posts_tags_idx on blog_posts using gin (tags);

-- Seed tags for the 3 existing posts. seo_title/seo_description are left null —
-- the site falls back to title/excerpt automatically; fill these in later from the
-- Supabase Table Editor if you want copy tuned specifically for search/social.
update blog_posts set tags = array['Operations', 'Retail', 'Ecommerce']
  where slug = 'the-real-cost-of-fragmented-fulfilment-data';
update blog_posts set tags = array['Leadership', 'Strategy']
  where slug = 'fractional-leadership-when-it-beats-a-full-time-hire';
update blog_posts set tags = array['Operations', 'Strategy']
  where slug = 'why-most-digital-transformations-stall-at-the-operations-layer';
