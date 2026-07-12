// Server-side GA4 Measurement Protocol hit for the contact form conversion.
// Sent from forms.js right after a successful Supabase insert, so the lead is recorded
// even when the visitor's browser blocks gtag.js (ad blockers, Safari ITP, etc.).
// Requires GA_MP_API_SECRET set as a Vercel environment variable — never hardcode the
// Measurement Protocol secret in source, it can be used to write fake events into GA4.
const MEASUREMENT_ID = "G-WYXTKGJ9JS";

function getClientIdFromCookie(cookieHeader) {
  const match = /(?:^|;\s*)_ga=([^;]+)/.exec(cookieHeader || "");
  if (!match) return null;
  const parts = match[1].split(".");
  if (parts.length < 4) return null;
  return `${parts[2]}.${parts[3]}`;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiSecret = process.env.GA_MP_API_SECRET;
  if (!apiSecret) {
    console.error("track-lead: GA_MP_API_SECRET is not configured");
    res.status(204).end();
    return;
  }

  const clientId = getClientIdFromCookie(req.headers.cookie) || `${Date.now()}.${Math.floor(Math.random() * 1e9)}`;

  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${apiSecret}`,
      {
        method: "POST",
        body: JSON.stringify({
          client_id: clientId,
          events: [{ name: "generate_lead", params: { form_name: "contact" } }],
        }),
      }
    );
  } catch (e) {
    console.error("track-lead: failed to reach Measurement Protocol", e);
  }

  res.status(204).end();
};
