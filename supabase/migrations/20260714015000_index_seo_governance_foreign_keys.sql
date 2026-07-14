create index if not exists authors_image_asset_id_idx on public.authors(image_asset_id) where image_asset_id is not null;
create index if not exists services_editorial_owner_idx on public.services(editorial_owner) where editorial_owner is not null;
create index if not exists industries_editorial_owner_idx on public.industries(editorial_owner) where editorial_owner is not null;
create index if not exists case_studies_editorial_owner_idx on public.case_studies(editorial_owner) where editorial_owner is not null;
create index if not exists blog_posts_editorial_owner_idx on public.blog_posts(editorial_owner) where editorial_owner is not null;
create index if not exists content_authors_author_id_idx on public.content_authors(author_id);
create index if not exists content_reviews_reviewed_by_idx on public.content_reviews(reviewed_by) where reviewed_by is not null;
