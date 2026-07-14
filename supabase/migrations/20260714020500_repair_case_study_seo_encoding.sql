update public.case_studies
set seo_title = replace(seo_title, 'â€”', '—'),
    seo_description = replace(seo_description, 'Â£', '£'),
    updated_at = now()
where coalesce(seo_title, '') like '%â€”%'
   or coalesce(seo_description, '') like '%Â£%';
