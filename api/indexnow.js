const SITE_HOST = "www.xtradite-digital.co.uk";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const ALLOWED_CHANGE_TYPES = new Set(["published", "updated", "archived", "redirected"]);

function secretFrom(req) {
  const header = req.headers?.["x-xtradite-webhook-secret"];
  return Array.isArray(header) ? header[0] : header;
}

function canonicalUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:" || url.hostname !== SITE_HOST) return null;
    if (url.search || url.hash) return null;
    return url.href;
  } catch {
    return null;
  }
}

function eligibleChange(change) {
  if (!change || !ALLOWED_CHANGE_TYPES.has(change.changeType)) return null;
  if (change.status === "draft" || change.noindex === true) return null;
  if (change.revision && change.previousRevision && change.revision === change.previousRevision) return null;
  return canonicalUrl(change.url || change.canonicalUrl || change.canonical_path);
}

async function submit(urlList, key, attempt = 1) {
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      host: SITE_HOST,
      key,
      keyLocation: `https://${SITE_HOST}/api/indexnow-key`,
      urlList
    }),
    signal: AbortSignal.timeout(10000)
  });

  if (response.ok || response.status === 202) return response;
  if (attempt < 3 && (response.status === 429 || response.status >= 500)) {
    await new Promise((resolve) => setTimeout(resolve, 500 * (2 ** (attempt - 1))));
    return submit(urlList, key, attempt + 1);
  }

  const body = await response.text().catch(() => "");
  throw new Error(`IndexNow request failed (${response.status}): ${body.slice(0, 240)}`);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const key = process.env.INDEXNOW_KEY;
  const webhookSecret = process.env.INDEXNOW_WEBHOOK_SECRET;
  if (!key || !webhookSecret || secretFrom(req) !== webhookSecret) {
    res.status(401).json({ error: "Unauthorised" });
    return;
  }

  const rawChanges = Array.isArray(req.body?.changes) ? req.body.changes : [req.body];
  const urls = [...new Set(rawChanges.map(eligibleChange).filter(Boolean))].slice(0, 10000);

  if (!urls.length) {
    res.status(202).json({ submitted: 0, skipped: rawChanges.length, reason: "No eligible material production changes" });
    return;
  }

  try {
    const response = await submit(urls, key);
    console.log("indexnow submission", {
      submittedAt: new Date().toISOString(),
      urlCount: urls.length,
      changeTypes: [...new Set(rawChanges.map((change) => change?.changeType).filter(Boolean))],
      status: response.status
    });
    res.status(202).json({ submitted: urls.length, skipped: rawChanges.length - urls.length });
  } catch (error) {
    console.error("indexnow submission failed", { message: error.message, urlCount: urls.length });
    res.status(502).json({ error: "IndexNow submission failed" });
  }
};

module.exports.canonicalUrl = canonicalUrl;
module.exports.eligibleChange = eligibleChange;
