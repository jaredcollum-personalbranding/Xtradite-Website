from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"

PUBLISHER_ID = "ca-pub-7308041122340160"
COOKIEBOT_ID = "07680bbc-6c7e-4a44-9d8b-a2ff6766646c"
GA4_ID = "G-WYXTKGJ9JS"

HEAD_BLOCK_TEMPLATE = '''<meta name="google-adsense-account" content="{publisher_id}">
<!-- Google Consent Mode defaults: must run before Cookiebot and Google tags -->
<script>
  window.dataLayer = window.dataLayer || [];

  function gtag() {{
    dataLayer.push(arguments);
  }}

  gtag("consent", "default", {{
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
    security_storage: "granted",
    wait_for_update: 500
  }});

  gtag("set", "ads_data_redaction", true);
  gtag("set", "url_passthrough", false);
</script>

<!-- Cookiebot CMP -->
<script
  id="Cookiebot"
  src="https://consent.cookiebot.com/uc.js"
  data-cbid="{cookiebot_id}"
  data-blockingmode="auto"
  data-framework="IAB"
  type="text/javascript"
></script>

<!-- Synchronise genuine Cookiebot choices with Google Consent Mode -->
<script>
  function updateGoogleConsentFromCookiebot() {{
    if (!window.Cookiebot || !Cookiebot.hasResponse) {{
      return;
    }}

    const marketingGranted = Cookiebot.consent.marketing === true;
    const statisticsGranted = Cookiebot.consent.statistics === true;
    const preferencesGranted = Cookiebot.consent.preferences === true;

    gtag("consent", "update", {{
      ad_storage: marketingGranted ? "granted" : "denied",
      ad_user_data: marketingGranted ? "granted" : "denied",
      ad_personalization: marketingGranted ? "granted" : "denied",
      analytics_storage: statisticsGranted ? "granted" : "denied",
      functionality_storage: preferencesGranted ? "granted" : "denied",
      personalization_storage: preferencesGranted ? "granted" : "denied",
      security_storage: "granted"
    }});

    gtag("set", "ads_data_redaction", !marketingGranted);
  }}

  window.addEventListener(
    "CookiebotOnConsentReady",
    updateGoogleConsentFromCookiebot
  );

  window.addEventListener(
    "CookiebotOnAccept",
    updateGoogleConsentFromCookiebot
  );

  window.addEventListener(
    "CookiebotOnDecline",
    updateGoogleConsentFromCookiebot
  );
</script>

<!-- Google Analytics -->
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id={ga4_id}"
></script>
<script>
  gtag("js", new Date());
  gtag("config", "{ga4_id}");
</script>

<!-- Google AdSense -->
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={publisher_id}"
  crossorigin="anonymous"
></script>
'''

REGION_RE = re.compile(
    r'<meta\s+name=["\']google-adsense-account["\'][^>]*>.*?(?=<title>)',
    re.IGNORECASE | re.DOTALL,
)

SPEED_RE = re.compile(
    r'<script\b[^>]*\bsrc=["\'][^"\']*speed-insights-init\.js["\'][^>]*>\s*</script>',
    re.IGNORECASE,
)

AUTO_EVENT_RE = re.compile(
    r'^\s*(?:window\.)?dataLayer\.push\(\s*\{\s*event\s*:\s*["\']'
    r'cookie_consent_(?:preferences|statistics|marketing|update)["\']\s*\}\s*\);?\s*$',
    re.IGNORECASE | re.MULTILINE,
)


def relative_speed_script(html: str) -> str:
    match = SPEED_RE.search(html)
    if match:
        return match.group(0)
    return '<script src="assets/js/speed-insights-init.js" defer></script>'


def migrate_html(path: Path) -> bool:
    original = path.read_text(encoding="utf-8-sig")
    speed_script = relative_speed_script(original)

    block = HEAD_BLOCK_TEMPLATE.format(
        publisher_id=PUBLISHER_ID,
        cookiebot_id=COOKIEBOT_ID,
        ga4_id=GA4_ID,
    )
    replacement = f"{block}\n<!-- Vercel Speed Insights -->\n{speed_script}\n"

    updated, count = REGION_RE.subn(replacement, original, count=1)
    if count != 1:
        print(f"SKIP: no replaceable consent region in {path.relative_to(ROOT)}")
        return False

    updated = AUTO_EVENT_RE.sub("", updated)

    # Remove any duplicate Speed Insights tag left outside the replaced region.
    speed_matches = list(SPEED_RE.finditer(updated))
    if len(speed_matches) > 1:
        first = speed_matches[0]
        parts = [updated[: first.end()]]
        cursor = first.end()
        for duplicate in speed_matches[1:]:
            parts.append(updated[cursor : duplicate.start()])
            cursor = duplicate.end()
        parts.append(updated[cursor:])
        updated = "".join(parts)

    if updated == original:
        return False

    path.write_text(updated, encoding="utf-8")
    print(f"UPDATED: {path.relative_to(ROOT)}")
    return True


def validate(files: list[Path]) -> None:
    failures: list[str] = []

    for path in files:
        html = path.read_text(encoding="utf-8")
        rel = str(path.relative_to(ROOT))

        required = [
            'gtag("consent", "default"',
            'data-blockingmode="auto"',
            'data-framework="IAB"',
            'Cookiebot.hasResponse',
            'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
        ]
        for token in required:
            if token not in html:
                failures.append(f"{rel}: missing {token}")

        forbidden = [
            'type="text/plain" data-cookieconsent="statistics"',
            'type="text/plain" data-cookieconsent="marketing"',
            'cookie_consent_preferences',
            'cookie_consent_statistics',
            'cookie_consent_marketing',
            'cookie_consent_update',
        ]
        for token in forbidden:
            if token in html:
                failures.append(f"{rel}: forbidden legacy token {token}")

        default_pos = html.find('gtag("consent", "default"')
        cookiebot_pos = html.find('id="Cookiebot"')
        analytics_pos = html.find('www.googletagmanager.com/gtag/js')
        adsense_pos = html.find('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')
        if not (0 <= default_pos < cookiebot_pos < analytics_pos < adsense_pos):
            failures.append(f"{rel}: consent/CMP/Google tag ordering is incorrect")

    if failures:
        raise SystemExit("\n".join(failures))


def main() -> None:
    html_files = sorted(FRONTEND.rglob("*.html"))
    changed = sum(migrate_html(path) for path in html_files)
    validate(html_files)
    print(f"Consent migration complete: {changed} file(s) changed; {len(html_files)} validated.")


if __name__ == "__main__":
    main()
