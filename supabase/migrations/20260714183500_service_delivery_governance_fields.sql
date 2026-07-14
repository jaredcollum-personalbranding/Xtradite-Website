-- Expose governed publication and entity fields through the public service view.
-- Related case studies remain fail-closed under the independent evidence gate.

create or replace view public.services_delivery
with (security_invoker = true)
as
select
  s.id,
  s.title,
  s.slug,
  s.category,
  s.icon,
  s.summary,
  s.hero_subheading,
  s.description,
  s.sort_order,
  s.created_at,
  s.updated_at,
  s.published_at,
  s.status,
  s.noindex,
  s.canonical_path,
  s.primary_entity,
  s.about_entities,
  s.mention_entities,
  coalesce((
    select jsonb_agg(li.content order by li.sort_order)
    from public.service_list_items li
    where li.service_id = s.id and li.kind = 'audience'
  ), '[]'::jsonb) as who_its_for,
  coalesce((
    select jsonb_agg(li.content order by li.sort_order)
    from public.service_list_items li
    where li.service_id = s.id and li.kind = 'inclusion'
  ), '[]'::jsonb) as what_included,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'title', st.title,
      'description', st.description
    ) order by st.sort_order)
    from public.service_steps st
    where st.service_id = s.id
  ), '[]'::jsonb) as how_it_works,
  coalesce((
    select jsonb_agg(li.content order by li.sort_order)
    from public.service_list_items li
    where li.service_id = s.id and li.kind = 'deliverable'
  ), '[]'::jsonb) as deliverables,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'category', g.title,
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
          'file', t.key,
          'label', t.name,
          'url', ma.public_url
        ) order by st.sort_order)
        from public.service_technologies st
        join public.technologies t on t.id = st.technology_id
        left join public.media_assets ma on ma.id = t.logo_asset_id
        where st.group_id = g.id
      ), '[]'::jsonb)
    ) order by g.sort_order)
    from public.service_technology_groups g
    where g.service_id = s.id
  ), '[]'::jsonb) as tech_categories,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'question', f.question,
      'answer', f.answer
    ) order by f.sort_order)
    from public.service_faqs f
    where f.service_id = s.id
  ), '[]'::jsonb) as faqs,
  s.seo_title,
  s.seo_description,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id,
      'slug', c.slug,
      'client', c.client,
      'headline', c.headline,
      'challenge', c.challenge,
      'summary', c.card_summary,
      'status', c.status,
      'noindex', c.noindex,
      'publicApprovalStatus', c.public_approval_status
    ) order by sc.sort_order)
    from public.service_case_studies sc
    join public.case_studies c on c.id = sc.case_study_id
    where sc.service_id = s.id
      and c.status = 'published'
      and c.public_approval_status = 'approved'
      and c.noindex = false
  ), '[]'::jsonb) as related_case_studies,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', b.id,
      'slug', b.slug,
      'title', b.title,
      'excerpt', b.excerpt,
      'coverImageUrl', b.cover_image_url,
      'minutesToRead', b.minutes_to_read,
      'firstPublishedDate', b.first_published_at,
      'tags', b.tags,
      'status', b.status
    ) order by sb.sort_order)
    from public.service_blog_posts sb
    join public.blog_posts_delivery b on b.id = sb.blog_post_id
    where sb.service_id = s.id
  ), '[]'::jsonb) as related_blog_posts,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', u.id,
      'slug', u.slug,
      'category', u.category,
      'useCase', u.use_case,
      'explanation', u.explanation,
      'evidenceNote', u.evidence_note,
      'technologies', coalesce((
        select jsonb_agg(jsonb_build_object(
          'key', t.key,
          'name', t.name,
          'url', ma.public_url
        ) order by p.sort_order)
        from public.service_technology_use_case_products p
        join public.technologies t on t.id = p.technology_id
        left join public.media_assets ma on ma.id = t.logo_asset_id
        where p.use_case_id = u.id
      ), '[]'::jsonb)
    ) order by u.sort_order)
    from public.service_technology_use_cases u
    where u.service_id = s.id and u.status = 'published'
  ), '[]'::jsonb) as technology_examples
from public.services s
where s.status = 'published';

grant select on public.services_delivery to anon, authenticated;
