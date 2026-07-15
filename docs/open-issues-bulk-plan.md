# Open issues bulk implementation plan

This branch starts from the current production `main` baseline and consolidates code-addressable work across issues #36–#53 and #66.

## Included in code

- reproducible dependency lock and frozen-install CI;
- server-rendered primary content and connected schema contracts;
- raw-HTML, schema, canonical, sitemap and link acceptance checks;
- consent-aware GA4 event instrumentation;
- endpoint monitoring workflow and incident runbook;
- IndexNow notification infrastructure with secret-only configuration;
- canonical-host and reporting configuration documentation;
- service/case-study evidence safeguards and consolidated service rendering;
- release-quality workflow and auditable reports.

## Operational gates that remain external

A pull request cannot truthfully complete DNS-provider changes, Google Search Console or Bing ownership, dashboard access, production deployment evidence, editorial approval, or screenshot-based Jam acceptance. The implementation supplies the code, workflows, checks and runbooks required for those steps, while the relevant issues remain open until external evidence is attached.

## Governance constraints

- Do not import Phase 4A service revisions or Phase 4D industry revisions.
- Do not alter live Supabase editorial records or approval states.
- Keep all case studies fail-closed until public approval and a primary metric are explicitly approved.
- Do not emit unsupported reviews, ratings, local-office claims, commercial estimates or generated performance figures.
