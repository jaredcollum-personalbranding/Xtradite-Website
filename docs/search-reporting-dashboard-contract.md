# Search reporting and dashboard contract

## Canonical domain and DNS evidence

The canonical host is `https://www.xtradite-digital.co.uk`. The apex must permanently redirect to `www`, HTTP must redirect to HTTPS, and no internal URL, Open Graph URL or sitemap entry may use the apex host.

Before changing DNS, record the purpose and current value of each apex A/ALIAS, `www` CNAME, verification record, nameserver and forwarding rule. Compare these with Vercel domain inspection. Remove Wix or legacy records only after the replacement is confirmed. Attach the final records and four-variant redirect matrix to issue #41.

## Page-type classification

Use these definitions consistently in GA4, Search Console, Bing and the dashboard:

| Page type | Path rule |
|---|---|
| Homepage | `^/$` |
| Service | `^/services/[a-z0-9-]+/?$` |
| Industry | `^/industries/[a-z0-9-]+/?$` |
| Case study | `^/case-studies/[a-z0-9-]+/?$` |
| Insight | `^/insights/[a-z0-9-]+/?$` |
| Location | `^/uk(?:/[a-z0-9-]+){1,4}/?$` |
| Location service | `^/uk(?:/[a-z0-9-]+){4}/services/[a-z0-9-]+/?$` |
| Static | all other indexable canonical paths |

Case-study reporting must distinguish eligible URLs from governed but unavailable records. A `404/noindex` case-study route is an expected exclusion while approval remains incomplete.

## Search Console and Bing setup

1. Verify the domain property through the authoritative DNS provider without committing verification credentials.
2. Submit `https://www.xtradite-digital.co.uk/sitemap.xml`.
3. Confirm discovery of static, services, industries, case studies, insights and locations child sitemaps.
4. Inspect one eligible URL per page type. Do not use an unapproved case study as a successful-indexation fixture.
5. Export submitted, indexed, excluded, discovered-not-indexed and crawled-not-indexed counts by child sitemap.
6. Categorise exclusions as expected governance, actionable technical, duplicate/canonical or content-quality review.

## Brand and non-brand definition

Brand queries contain `xtradite`, `xtradite digital`, common misspellings clearly referring to Xtradite, or Jared Collum in an explicit Xtradite context. All other queries are non-brand. Maintain the brand expression in one documented data-source field rather than creating different filters per chart.

## Dashboard choice

Use Looker Studio for the first release because GA4 and Search Console have supported connectors, stakeholders can review without desktop software, and the current reporting volume does not require a Power BI semantic model. Reconsider Power BI only when finance, CRM or warehouse joins require governed row-level modelling beyond Looker Studio’s practical limits.

## Metric ownership

| Metric | Source of truth |
|---|---|
| Organic sessions and event interactions | GA4 |
| Search impressions, clicks, CTR and position | Search Console; Bing separately |
| Published state, owner and review dates | Supabase governed delivery views |
| Deployment availability | Vercel/GitHub monitor artefacts |
| Qualified enquiry | backend-confirmed submission or CRM outcome |

Do not add CTA clicks to submitted forms as equivalent conversions. Show incomplete data as unavailable, not zero. Display connector freshness and last refresh time on every dashboard page.

## Required views

- Executive: organic sessions, confirmed enquiries, conversion rate, non-brand visibility, eligible indexed URLs and active incidents.
- Search: query and landing-page trends by page type, sitemap, brand status and indexation category.
- Commercial: confirmed enquiries by organic landing page, CTA placement and assisted content journey.
- Governance: content status, publication/review dates, editorial owner, noindex and approval status.

Filters should include date, page type, service, industry and location where populated. Baseline screenshots, access arrangements and any connector limitations remain external acceptance evidence for issues #50 and #51.
