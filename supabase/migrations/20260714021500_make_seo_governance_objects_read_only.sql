revoke all on public.authors, public.content_authors, public.content_citations, public.content_reviews, public.published_content_sitemap from anon, authenticated;
grant select on public.authors, public.content_authors, public.content_citations, public.published_content_sitemap to anon, authenticated;
