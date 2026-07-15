# SEO endpoint incident runbook

## Alert source

The scheduled **SEO endpoint monitor** checks the homepage, robots file, sitemap index and every child sitemap twice before failing. Its artefact contains status, final URL, response time, content type, TLS result and body-marker result for each endpoint.

## Triage sequence

1. Open the failed GitHub Actions run and download `seo-endpoint-monitor-*`.
2. Identify the affected Vercel deployment and commit from the production project.
3. Inspect Vercel build logs first when the deployment is not `READY`; inspect runtime logs when a `READY` deployment returns `5xx`.
4. Run `SEO_BASE_URL=<deployment-url> node scripts/monitor-seo-endpoints.js` against the deployment URL to distinguish deployment failure from DNS or alias failure.
5. Check the Supabase project status and run the sitemap delivery queries when only dynamic sitemaps fail.
6. Compare apex, `www`, HTTP and HTTPS responses when the final hostname or TLS check fails.
7. Do not alter live editorial approval states to make a sitemap pass.

## Failure classification

- **DNS/alias:** canonical host does not resolve or redirects through an unexpected host.
- **Deployment/build:** latest Vercel deployment is `ERROR`, `CANCELLED` or absent.
- **Runtime/function:** deployment is `READY` but one or more functions return `5xx`.
- **Supabase/content:** functions run but governed queries fail or return an invalid payload.
- **Template/build output:** endpoints return HTML or malformed XML instead of the required content type and marker.

## Rollback decision

Roll back only when a release introduces a critical endpoint, publication, canonical or evidence-control regression and a forward fix cannot be validated immediately. Roll the frontend back to the last known `READY` production deployment. Do not roll back live Supabase publication or evidence-control migrations.

Record:

- failed route;
- HTTP status and content type;
- viewport where relevant;
- deployment ID and commit;
- first observed time;
- rollback or forward-fix decision.

## Recovery verification

1. Confirm the replacement deployment is `READY`.
2. Run the endpoint monitor manually and require a complete pass.
3. Verify representative service, industry and insight routes.
4. Verify every case-study route remains fail-closed unless explicit approval exists.
5. Confirm canonical, robots and sitemap URLs use `https://www.xtradite-digital.co.uk`.
6. Attach the monitor artefact and relevant screenshots/log extracts to the incident issue.

## Ownership

GitHub Actions failures are the default alert channel. Repository notifications must remain enabled for the release owner. A second monitored destination may be added through organisation-level notification or incident tooling without committing credentials to the repository.
