-- Move the UK location catalogue from repository constants into Supabase.
-- Public API access is read-only and restricted to published rows through RLS.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.location_nations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.location_regions (
  id uuid primary key default gen_random_uuid(),
  nation_id uuid not null references public.location_nations(id) on delete cascade,
  name text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (nation_id, slug)
);

create table public.location_counties (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.location_regions(id) on delete cascade,
  name text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (region_id, slug)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  county_id uuid not null references public.location_counties(id) on delete cascade,
  name text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  latitude numeric(9,6) not null check (latitude between -90 and 90),
  longitude numeric(9,6) not null check (longitude between -180 and 180),
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  local_intro text,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (county_id, slug)
);

create table public.location_services (
  location_id uuid not null references public.locations(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  local_intro text,
  seo_title text,
  seo_description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (location_id, service_id)
);

alter table public.services
  add column if not exists location_search_label text;

update public.services
set location_search_label = case slug
  when 'ai-automation' then 'AI automation consultancy'
  when 'digital-strategy' then 'digital strategy consultancy'
  when 'ecommerce-growth' then 'ecommerce growth consultancy'
  when 'operational-excellence' then 'operational excellence consultancy'
  when 'fractional-leadership' then 'fractional digital leadership'
  when 'project-delivery' then 'digital project delivery consultancy'
  else coalesce(location_search_label, title)
end;

create index location_regions_nation_id_idx on public.location_regions(nation_id);
create index location_counties_region_id_idx on public.location_counties(region_id);
create index locations_county_id_idx on public.locations(county_id);
create index locations_status_idx on public.locations(status);
create index location_services_service_id_idx on public.location_services(service_id);
create index location_services_status_idx on public.location_services(status);

alter table public.location_nations enable row level security;
alter table public.location_regions enable row level security;
alter table public.location_counties enable row level security;
alter table public.locations enable row level security;
alter table public.location_services enable row level security;

create policy "Public read published location nations"
  on public.location_nations for select to anon, authenticated using (status = 'published');
create policy "Public read published location regions"
  on public.location_regions for select to anon, authenticated using (status = 'published');
create policy "Public read published location counties"
  on public.location_counties for select to anon, authenticated using (status = 'published');
create policy "Public read published locations"
  on public.locations for select to anon, authenticated using (status = 'published');
create policy "Public read published location services"
  on public.location_services for select to anon, authenticated using (status = 'published');

grant select on public.location_nations, public.location_regions, public.location_counties,
  public.locations, public.location_services to anon, authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger location_nations_set_updated_at before update on public.location_nations
  for each row execute function private.set_updated_at();
create trigger location_regions_set_updated_at before update on public.location_regions
  for each row execute function private.set_updated_at();
create trigger location_counties_set_updated_at before update on public.location_counties
  for each row execute function private.set_updated_at();
create trigger locations_set_updated_at before update on public.locations
  for each row execute function private.set_updated_at();
create trigger location_services_set_updated_at before update on public.location_services
  for each row execute function private.set_updated_at();

create view public.location_routes_delivery
with (security_invoker = true)
as
select
  l.id as location_id,
  l.name,
  l.slug,
  l.latitude,
  l.longitude,
  l.local_intro,
  l.seo_title,
  l.seo_description,
  greatest(l.updated_at, c.updated_at, r.updated_at, n.updated_at) as updated_at,
  c.id as county_id,
  c.name as county,
  c.slug as county_slug,
  r.id as region_id,
  r.name as region,
  r.slug as region_slug,
  n.id as nation_id,
  n.name as nation,
  n.slug as nation_slug
from public.locations l
join public.location_counties c on c.id = l.county_id and c.status = 'published'
join public.location_regions r on r.id = c.region_id and r.status = 'published'
join public.location_nations n on n.id = r.nation_id and n.status = 'published'
where l.status = 'published';

create view public.location_service_routes_delivery
with (security_invoker = true)
as
select
  ls.location_id,
  ls.service_id,
  ls.local_intro,
  ls.seo_title,
  ls.seo_description,
  ls.sort_order,
  greatest(ls.updated_at, l.updated_at, s.updated_at) as updated_at,
  l.name,
  l.slug,
  l.latitude,
  l.longitude,
  l.county,
  l.county_slug,
  l.region,
  l.region_slug,
  l.nation,
  l.nation_slug,
  s.slug as service_slug,
  s.title as service_title,
  s.category as service_category,
  s.summary as service_summary,
  s.hero_subheading as service_hero_subheading,
  coalesce(s.location_search_label, s.title) as service_search_label,
  s.status as service_status
from public.location_services ls
join public.location_routes_delivery l on l.location_id = ls.location_id
join public.services s on s.id = ls.service_id
where ls.status = 'published' and s.status = 'published';

grant select on public.location_routes_delivery, public.location_service_routes_delivery
  to anon, authenticated;

create temporary table location_seed (
  name text not null,
  nation text not null,
  region text not null,
  county text not null,
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null
) on commit drop;

insert into location_seed (name, nation, region, county, latitude, longitude) values
  ('Derby', 'England', 'East Midlands', 'Derbyshire', 52.9225, -1.4746),
  ('Chesterfield', 'England', 'East Midlands', 'Derbyshire', 53.2350, -1.4210),
  ('Buxton', 'England', 'East Midlands', 'Derbyshire', 53.2591, -1.9103),
  ('Leicester', 'England', 'East Midlands', 'Leicestershire', 52.6369, -1.1398),
  ('Loughborough', 'England', 'East Midlands', 'Leicestershire', 52.7721, -1.2062),
  ('Lincoln', 'England', 'East Midlands', 'Lincolnshire', 53.2307, -0.5406),
  ('Grantham', 'England', 'East Midlands', 'Lincolnshire', 52.9125, -0.6436),
  ('Boston', 'England', 'East Midlands', 'Lincolnshire', 52.9789, -0.0266),
  ('Northampton', 'England', 'East Midlands', 'Northamptonshire', 52.2405, -0.9027),
  ('Nottingham', 'England', 'East Midlands', 'Nottinghamshire', 52.9548, -1.1581),
  ('Mansfield', 'England', 'East Midlands', 'Nottinghamshire', 53.1472, -1.1987),
  ('Bedford', 'England', 'East of England', 'Bedfordshire', 52.1364, -0.4607),
  ('Luton', 'England', 'East of England', 'Bedfordshire', 51.8787, -0.4200),
  ('Cambridge', 'England', 'East of England', 'Cambridgeshire', 52.2053, 0.1218),
  ('Peterborough', 'England', 'East of England', 'Cambridgeshire', 52.5695, -0.2405),
  ('Chelmsford', 'England', 'East of England', 'Essex', 51.7356, 0.4685),
  ('Colchester', 'England', 'East of England', 'Essex', 51.8892, 0.9042),
  ('Southend-on-Sea', 'England', 'East of England', 'Essex', 51.5459, 0.7077),
  ('St Albans', 'England', 'East of England', 'Hertfordshire', 51.7520, -0.3360),
  ('Watford', 'England', 'East of England', 'Hertfordshire', 51.6565, -0.3903),
  ('Norwich', 'England', 'East of England', 'Norfolk', 52.6309, 1.2974),
  ('King''s Lynn', 'England', 'East of England', 'Norfolk', 52.7517, 0.3952),
  ('Ipswich', 'England', 'East of England', 'Suffolk', 52.0567, 1.1482),
  ('Bury St Edmunds', 'England', 'East of England', 'Suffolk', 52.2469, 0.7113),
  ('London', 'England', 'London', 'Greater London', 51.5074, -0.1278),
  ('Westminster', 'England', 'London', 'Greater London', 51.4975, -0.1357),
  ('Camden', 'England', 'London', 'Greater London', 51.5390, -0.1426),
  ('Islington', 'England', 'London', 'Greater London', 51.5380, -0.1027),
  ('Croydon', 'England', 'London', 'Greater London', 51.3762, -0.0982),
  ('Barnet', 'England', 'London', 'Greater London', 51.6252, -0.1517),
  ('Newcastle upon Tyne', 'England', 'North East', 'Tyne and Wear', 54.9783, -1.6178),
  ('Sunderland', 'England', 'North East', 'Tyne and Wear', 54.9069, -1.3838),
  ('Durham', 'England', 'North East', 'County Durham', 54.7753, -1.5849),
  ('Middlesbrough', 'England', 'North East', 'Teesside', 54.5742, -1.2350),
  ('Darlington', 'England', 'North East', 'County Durham', 54.5236, -1.5595),
  ('Manchester', 'England', 'North West', 'Greater Manchester', 53.4808, -2.2426),
  ('Salford', 'England', 'North West', 'Greater Manchester', 53.4875, -2.2901),
  ('Stockport', 'England', 'North West', 'Greater Manchester', 53.4106, -2.1575),
  ('Bolton', 'England', 'North West', 'Greater Manchester', 53.5769, -2.4282),
  ('Liverpool', 'England', 'North West', 'Merseyside', 53.4084, -2.9916),
  ('Chester', 'England', 'North West', 'Cheshire', 53.1934, -2.8931),
  ('Warrington', 'England', 'North West', 'Cheshire', 53.3900, -2.5960),
  ('Preston', 'England', 'North West', 'Lancashire', 53.7632, -2.7031),
  ('Lancaster', 'England', 'North West', 'Lancashire', 54.0470, -2.8010),
  ('Blackpool', 'England', 'North West', 'Lancashire', 53.8175, -3.0357),
  ('Carlisle', 'England', 'North West', 'Cumbria', 54.8925, -2.9329),
  ('Brighton and Hove', 'England', 'South East', 'East Sussex', 50.8225, -0.1372),
  ('Hove', 'England', 'South East', 'East Sussex', 50.8279, -0.1687),
  ('Lewes', 'England', 'South East', 'East Sussex', 50.8739, 0.0088),
  ('Eastbourne', 'England', 'South East', 'East Sussex', 50.7680, 0.2905),
  ('Hastings', 'England', 'South East', 'East Sussex', 50.8543, 0.5735),
  ('Worthing', 'England', 'South East', 'West Sussex', 50.8179, -0.3729),
  ('Crawley', 'England', 'South East', 'West Sussex', 51.1091, -0.1872),
  ('Horsham', 'England', 'South East', 'West Sussex', 51.0629, -0.3259),
  ('Guildford', 'England', 'South East', 'Surrey', 51.2362, -0.5704),
  ('Woking', 'England', 'South East', 'Surrey', 51.3168, -0.5600),
  ('Reading', 'England', 'South East', 'Berkshire', 51.4543, -0.9781),
  ('Slough', 'England', 'South East', 'Berkshire', 51.5105, -0.5950),
  ('Oxford', 'England', 'South East', 'Oxfordshire', 51.7520, -1.2577),
  ('Milton Keynes', 'England', 'South East', 'Buckinghamshire', 52.0406, -0.7594),
  ('Southampton', 'England', 'South East', 'Hampshire', 50.9097, -1.4044),
  ('Portsmouth', 'England', 'South East', 'Hampshire', 50.8198, -1.0880),
  ('Winchester', 'England', 'South East', 'Hampshire', 51.0598, -1.3101),
  ('Maidstone', 'England', 'South East', 'Kent', 51.2704, 0.5227),
  ('Canterbury', 'England', 'South East', 'Kent', 51.2802, 1.0789),
  ('Dover', 'England', 'South East', 'Kent', 51.1279, 1.3134),
  ('Bristol', 'England', 'South West', 'Bristol', 51.4545, -2.5879),
  ('Bath', 'England', 'South West', 'Somerset', 51.3811, -2.3590),
  ('Gloucester', 'England', 'South West', 'Gloucestershire', 51.8642, -2.2382),
  ('Cheltenham', 'England', 'South West', 'Gloucestershire', 51.8994, -2.0783),
  ('Exeter', 'England', 'South West', 'Devon', 50.7184, -3.5339),
  ('Plymouth', 'England', 'South West', 'Devon', 50.3755, -4.1427),
  ('Bournemouth', 'England', 'South West', 'Dorset', 50.7192, -1.8808),
  ('Poole', 'England', 'South West', 'Dorset', 50.7151, -1.9872),
  ('Swindon', 'England', 'South West', 'Wiltshire', 51.5558, -1.7797),
  ('Salisbury', 'England', 'South West', 'Wiltshire', 51.0688, -1.7945),
  ('Truro', 'England', 'South West', 'Cornwall', 50.2632, -5.0510),
  ('Birmingham', 'England', 'West Midlands', 'West Midlands', 52.4862, -1.8904),
  ('Coventry', 'England', 'West Midlands', 'West Midlands', 52.4068, -1.5197),
  ('Wolverhampton', 'England', 'West Midlands', 'West Midlands', 52.5870, -2.1288),
  ('Solihull', 'England', 'West Midlands', 'West Midlands', 52.4118, -1.7776),
  ('Worcester', 'England', 'West Midlands', 'Worcestershire', 52.1936, -2.2216),
  ('Hereford', 'England', 'West Midlands', 'Herefordshire', 52.0565, -2.7160),
  ('Stoke-on-Trent', 'England', 'West Midlands', 'Staffordshire', 53.0027, -2.1794),
  ('Shrewsbury', 'England', 'West Midlands', 'Shropshire', 52.7073, -2.7553),
  ('Telford', 'England', 'West Midlands', 'Telford and Wrekin', 52.6778, -2.4674),
  ('Leeds', 'England', 'Yorkshire and Humber', 'West Yorkshire', 53.8008, -1.5491),
  ('Bradford', 'England', 'Yorkshire and Humber', 'West Yorkshire', 53.7950, -1.7594),
  ('Wakefield', 'England', 'Yorkshire and Humber', 'West Yorkshire', 53.6833, -1.4977),
  ('Sheffield', 'England', 'Yorkshire and Humber', 'South Yorkshire', 53.3811, -1.4701),
  ('Doncaster', 'England', 'Yorkshire and Humber', 'South Yorkshire', 53.5228, -1.1285),
  ('York', 'England', 'Yorkshire and Humber', 'North Yorkshire', 53.9590, -1.0815),
  ('Harrogate', 'England', 'Yorkshire and Humber', 'North Yorkshire', 53.9921, -1.5418),
  ('Hull', 'England', 'Yorkshire and Humber', 'East Riding of Yorkshire', 53.7676, -0.3274),
  ('Edinburgh', 'Scotland', 'Central Scotland', 'City of Edinburgh', 55.9533, -3.1883),
  ('Glasgow', 'Scotland', 'West Scotland', 'Glasgow City', 55.8642, -4.2518),
  ('Stirling', 'Scotland', 'Central Scotland', 'Stirling', 56.1165, -3.9369),
  ('Aberdeen', 'Scotland', 'North East Scotland', 'Aberdeen City', 57.1497, -2.0943),
  ('Dundee', 'Scotland', 'North East Scotland', 'Dundee City', 56.4620, -2.9707),
  ('Inverness', 'Scotland', 'Highlands', 'Highland', 57.4778, -4.2247),
  ('Perth', 'Scotland', 'Central Scotland', 'Perth and Kinross', 56.3950, -3.4308),
  ('Paisley', 'Scotland', 'West Scotland', 'Renfrewshire', 55.8473, -4.4401),
  ('Ayr', 'Scotland', 'West Scotland', 'South Ayrshire', 55.4586, -4.6292),
  ('Dumfries', 'Scotland', 'South Scotland', 'Dumfries and Galloway', 55.0709, -3.6051),
  ('Cardiff', 'Wales', 'South East Wales', 'Cardiff', 51.4816, -3.1791),
  ('Newport', 'Wales', 'South East Wales', 'Newport', 51.5842, -2.9977),
  ('Swansea', 'Wales', 'South West Wales', 'Swansea', 51.6214, -3.9436),
  ('Wrexham', 'Wales', 'North Wales', 'Wrexham', 53.0430, -2.9916),
  ('Bangor', 'Wales', 'North Wales', 'Gwynedd', 53.2274, -4.1293),
  ('Aberystwyth', 'Wales', 'Mid Wales', 'Ceredigion', 52.4153, -4.0829),
  ('Llandudno', 'Wales', 'North Wales', 'Conwy', 53.3241, -3.8276),
  ('Bridgend', 'Wales', 'South East Wales', 'Bridgend', 51.5043, -3.5769),
  ('Carmarthen', 'Wales', 'West Wales', 'Carmarthenshire', 51.8560, -4.3120),
  ('Belfast', 'Northern Ireland', 'Belfast Region', 'County Antrim', 54.5973, -5.9301),
  ('Derry', 'Northern Ireland', 'County Londonderry', 'County Londonderry', 54.9966, -7.3086),
  ('Lisburn', 'Northern Ireland', 'Belfast Region', 'County Antrim', 54.5162, -6.0580),
  ('Newry', 'Northern Ireland', 'County Down', 'County Down', 54.1751, -6.3402),
  ('Armagh', 'Northern Ireland', 'County Armagh', 'County Armagh', 54.3503, -6.6528),
  ('Bangor NI', 'Northern Ireland', 'County Down', 'County Down', 54.6534, -5.6680),
  ('Ballymena', 'Northern Ireland', 'County Antrim', 'County Antrim', 54.8654, -6.2804),
  ('Coleraine', 'Northern Ireland', 'County Londonderry', 'County Londonderry', 55.1333, -6.6667),
  ('Enniskillen', 'Northern Ireland', 'County Fermanagh', 'County Fermanagh', 54.3438, -7.6315),
  ('Omagh', 'Northern Ireland', 'County Tyrone', 'County Tyrone', 54.6000, -7.3000);

insert into public.location_nations (name, slug)
select distinct nation,
  trim(both '-' from regexp_replace(replace(lower(nation), '&', 'and'), '[^a-z0-9]+', '-', 'g'))
from location_seed
on conflict (slug) do update set name = excluded.name;

insert into public.location_regions (nation_id, name, slug)
select distinct n.id, seed.region,
  trim(both '-' from regexp_replace(replace(lower(seed.region), '&', 'and'), '[^a-z0-9]+', '-', 'g'))
from location_seed seed
join public.location_nations n
  on n.slug = trim(both '-' from regexp_replace(replace(lower(seed.nation), '&', 'and'), '[^a-z0-9]+', '-', 'g'))
on conflict (nation_id, slug) do update set name = excluded.name;

insert into public.location_counties (region_id, name, slug)
select distinct r.id, seed.county,
  trim(both '-' from regexp_replace(replace(lower(seed.county), '&', 'and'), '[^a-z0-9]+', '-', 'g'))
from location_seed seed
join public.location_nations n
  on n.slug = trim(both '-' from regexp_replace(replace(lower(seed.nation), '&', 'and'), '[^a-z0-9]+', '-', 'g'))
join public.location_regions r
  on r.nation_id = n.id
 and r.slug = trim(both '-' from regexp_replace(replace(lower(seed.region), '&', 'and'), '[^a-z0-9]+', '-', 'g'))
on conflict (region_id, slug) do update set name = excluded.name;

insert into public.locations (county_id, name, slug, latitude, longitude)
select c.id, seed.name,
  trim(both '-' from regexp_replace(replace(lower(seed.name), '&', 'and'), '[^a-z0-9]+', '-', 'g')),
  seed.latitude, seed.longitude
from location_seed seed
join public.location_nations n
  on n.slug = trim(both '-' from regexp_replace(replace(lower(seed.nation), '&', 'and'), '[^a-z0-9]+', '-', 'g'))
join public.location_regions r
  on r.nation_id = n.id
 and r.slug = trim(both '-' from regexp_replace(replace(lower(seed.region), '&', 'and'), '[^a-z0-9]+', '-', 'g'))
join public.location_counties c
  on c.region_id = r.id
 and c.slug = trim(both '-' from regexp_replace(replace(lower(seed.county), '&', 'and'), '[^a-z0-9]+', '-', 'g'))
on conflict (county_id, slug) do update
set name = excluded.name, latitude = excluded.latitude, longitude = excluded.longitude;

insert into public.location_services (location_id, service_id, sort_order)
select l.id, s.id, row_number() over (partition by l.id order by s.sort_order, s.title)::integer
from public.locations l
cross join public.services s
where l.status = 'published' and s.status = 'published'
on conflict (location_id, service_id) do update set sort_order = excluded.sort_order;
