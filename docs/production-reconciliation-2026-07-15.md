# Production reconciliation — 15 July 2026

## Scope

This reconciliation covers issues #36, #39 and #40. No Vercel production deployment, editorial content record or approval state was changed. One least-privilege Supabase migration was applied after browser acceptance exposed a broken delivery-view permission contract.

## GitHub and Vercel

- GitHub `main` remains `5e9597d7398a432d2114be6ed44ba0cf2df61e4c`.
- The currently identified `READY` Vercel production deployment remains based on `fc391651b2cafcbb7975ee7205beb7664ec8d9ae`.
- The production deployment is therefore behind GitHub `main`.
- Recent Vercel `ERROR` records belong to preview commits on the superseded `chore/branch-and-pipeline-cleanup` branch, not to PR #76 and not to production.
- PR #76 must not be described as deployed until it is reviewed, merged and a `READY` production deployment is verified.

## Supabase migration history

Production project `bmhkdyshluiloorgnwoy` reports these applied migrations, in order:

1. `20260712005432_add_service_detail_content_columns`
2. `20260712071859_case_study_depth`
3. `20260713062516_add_case_study_editorial_fields`
4. `20260713062812_expose_case_study_editorial_fields`
5. `20260713064502_create_case_study_media`
6. `20260713064606_map_case_study_media_assets`
7. `20260713064645_expose_case_study_media_read_only`
8. `20260713082603_location_content_source`
9. `20260713085332_add_industry_seo_metadata`
10. `20260713085843_enforce_blog_publish_dates`
11. `20260713233123_add_fractional_leadership_consumer_goods`
12. `20260714005612_seo_aeo_geo_content_governance`
13. `20260714005642_restrict_content_review_access`
14. `20260714005719_index_seo_governance_foreign_keys`
15. `20260714010043_repair_case_study_seo_encoding`
16. `20260714010117_make_seo_governance_objects_read_only`
17. `20260714023145_service_technology_use_cases`
18. `20260714032116_enforce_scheduled_publication_and_canonical_insight_links`
19. `20260714140225_gold_seal_publication_controls`
20. `20260714181000_case_study_evidence_publication_gate`
21. `20260714181803_service_delivery_governance_fields`
22. `20260715015000_harden_public_delivery_views`

The final migration is included in PR #76 and has been applied to the connected production project. It makes the four filtered delivery views the sole anonymous/authenticated content contract, grants them `SELECT` only, and removes public privileges from their underlying CMS and evidence tables.

Validation under `SET ROLE anon` returns:

- 6 services;
- 6 industries;
- 13 currently eligible insights;
- 0 case studies.

The verified public grants on the four delivery views are `SELECT` only. No public grant remains on the corresponding services, industries, case studies or blog-post base tables.

## Governed content state

| Content type | Total | Marked published | `noindex` |
|---|---:|---:|---:|
| Services | 6 | 6 | 0 |
| Industries | 6 | 6 | 0 |
| Case studies | 6 | 5 | 0 |
| Insights | 17 | 17 | 0 |

The governed sitemap view currently contains:

- 6 services;
- 6 industries;
- 13 currently eligible insights;
- 0 case studies.

All six case studies remain `changes_required` and all six have `public_primary_metric_approved = false`. The frontend and sitemap continue to fail closed irrespective of the legacy `published` field.

## Supabase advisers

### Security

The initial adviser run reported:

- one informational finding: `content_reviews` has RLS enabled with no policy;
- GraphQL exposure warnings for tables and delivery views with public grants.

The delivery-view migration removes public base-table access and limits the governed delivery views to `SELECT`. Security-definer delivery views are intentional: each view has an explicit public projection and its own publication/evidence filters. The remaining governance-table and `content_reviews` findings require a separate policy review rather than an automatic broad grant change.

Remediation references:

- https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- https://supabase.com/docs/guides/database/database-linter?lint=0026_pg_graphql_anon_table_exposed
- https://supabase.com/docs/guides/database/database-linter?lint=0027_pg_graphql_authenticated_table_exposed

### Performance

The adviser reports informational unused-index findings only. No index has been removed: newly introduced governance and location indexes may not yet have accumulated representative production use, and removal requires query-plan evidence rather than a single unused-index snapshot.

Remediation reference:

- https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index

## Release position

PR #76 supplies a reproducible `npm ci` build, automated release gates, endpoint monitoring and governed rendering. Remaining production acceptance must happen after merge:

1. create and verify a `READY` Vercel production deployment from the merged commit;
2. run the production endpoint monitor and representative route checks;
3. verify canonical apex/`www` routing with the authoritative DNS provider;
4. attach manual Jam screenshots to issue #66;
5. configure and verify external analytics, search reporting and IndexNow secrets.
