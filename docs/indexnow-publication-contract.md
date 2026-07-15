# IndexNow publication contract

## Configuration

Configure these only in Vercel production environment variables:

- `INDEXNOW_KEY`: the IndexNow key for `www.xtradite-digital.co.uk`.
- `INDEXNOW_WEBHOOK_SECRET`: a high-entropy shared secret used by the trusted publication workflow.

The key verification route is `/api/indexnow-key`. No secret or service-role credential belongs in source control or browser code.

## Trusted request

Send `POST /api/indexnow` with the header `x-xtradite-webhook-secret` and either one change or a `changes` array:

```json
{
  "changes": [
    {
      "url": "https://www.xtradite-digital.co.uk/insights/example",
      "changeType": "updated",
      "status": "published",
      "noindex": false,
      "revision": "2026-07-15T10:15:00Z",
      "previousRevision": "2026-07-14T09:00:00Z"
    }
  ]
}
```

Allowed change types are `published`, `updated`, `archived` and `redirected`. The endpoint rejects preview/apex/query-string URLs, draft or noindex records, unsupported change types and unchanged revisions. Eligible URLs are deduplicated and submitted in a batch with bounded retries for throttling and temporary server errors.

## Publication integration

The preferred trigger is the governed publication workflow after a state transition or material revision is committed. Ordinary database saves must not invoke the endpoint. For archived or redirected records, submit the affected former canonical URL so participating engines can recrawl its removal or redirect response.

## Audit evidence

Vercel function logs record submission time, URL count, change types and response status without logging the key, webhook secret or full payload. End-to-end acceptance requires:

1. verify `/api/indexnow-key` after production environment variables are configured;
2. submit one newly published test URL;
3. repeat the same revision and confirm it is skipped by the publication caller or unchanged-revision rule;
4. submit an archived/redirected URL;
5. attach response and Vercel log evidence to issue #53.
