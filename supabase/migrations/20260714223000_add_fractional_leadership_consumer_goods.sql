begin;

-- Keep Consumer Goods related services in a deliberate commercial sequence:
-- operational improvement, strategy, leadership, then project delivery.
update public.service_industries si
set sort_order = 4
from public.services s, public.industries i
where si.service_id = s.id
  and si.industry_id = i.id
  and s.slug = 'project-delivery'
  and i.slug = 'consumer-goods'
  and si.sort_order = 3;

insert into public.service_industries (service_id, industry_id, sort_order)
select s.id, i.id, 3
from public.services s
cross join public.industries i
where s.slug = 'fractional-leadership'
  and i.slug = 'consumer-goods'
on conflict (service_id, industry_id)
do update set sort_order = excluded.sort_order;

commit;
