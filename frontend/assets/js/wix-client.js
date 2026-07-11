/**
 * REST transport for Wix Headless — plain fetch, JSON in / JSON out. No SDK, no build step.
 * WIX_CLIENT_ID is the site's public headless OAuth client id (buyer-facing, mints anonymous
 * visitor tokens only — not a secret, safe to hardcode).
 *
 * Site: Xtradite Digital — H... (siteId 9f424aed-f9a6-4cf1-aaaa-5bb610a9defb)
 */

export const WIX_CLIENT_ID = "e5a63007-6df2-4cb4-9899-d4efc71031df";

export const WIX_API_BASE = "https://www.wixapis.com";
const OAUTH_TOKEN_URL = `${WIX_API_BASE}/oauth2/token`;

const TOKEN_STORAGE_KEY = `wix-visitor-token-${WIX_CLIENT_ID}`;
let tokenCache = null;

function loadToken() {
  if (tokenCache) return tokenCache;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (raw) tokenCache = JSON.parse(raw);
  } catch {
    /* ignore disabled/full storage */
  }
  return tokenCache;
}

function saveToken(t) {
  tokenCache = t;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(t));
  } catch {
    /* ignore */
  }
}

async function mintToken(body) {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Wix OAuth failed: ${res.status}`);
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

async function getAccessToken() {
  const cached = loadToken();
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.accessToken;

  if (cached?.refreshToken) {
    try {
      const refreshed = await mintToken({ clientId: WIX_CLIENT_ID, grantType: "refresh_token", refreshToken: cached.refreshToken });
      saveToken(refreshed);
      return refreshed.accessToken;
    } catch {
      /* refresh failed — fall through to a fresh anonymous visitor */
    }
  }
  const fresh = await mintToken({ clientId: WIX_CLIENT_ID, grantType: "anonymous" });
  saveToken(fresh);
  return fresh.accessToken;
}

/**
 * Core transport.
 * @param {string} path
 * @param {{ method?: "GET"|"POST"|"PUT"|"DELETE", body?: unknown, query?: Record<string, string | undefined> }} [options]
 */
export async function wixApiRequest(path, options = {}) {
  const { method = "POST", body, query } = options;
  const token = await getAccessToken();

  const url = new URL(path.startsWith("http") ? path : `${WIX_API_BASE}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      if (Array.isArray(v)) {
        for (const item of v) url.searchParams.append(k, item);
      } else {
        url.searchParams.set(k, v);
      }
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 402) {
    console.warn("Wix: Payment required (402) — this API needs an active plan/premium feature.");
    return;
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Wix API error ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined;
  return await res.json();
}
