drop policy if exists "Authenticated users can manage content reviews" on public.content_reviews;
revoke all on public.content_reviews from anon, authenticated;

comment on table public.content_reviews is 'Private editorial review workflow. Access is restricted to server-side or elevated database roles.';
