from pathlib import Path
import re

ROOT = Path("frontend")
PUBLISHER = "ca-pub-7308041122340160"

AD_CSS = """.sitewide-ad {
  width: 100%;
  max-width: 1100px;
  min-height: 250px;
  margin: 0 auto var(--space-64);
}

.sitewide-ad__label {
  display: block;
  margin-bottom: var(--space-8);
  color: var(--color-text-muted, #8f8f8f);
  font-size: var(--font-size-xs, 0.75rem);
  line-height: 1;
  letter-spacing: 0.05em;
  text-align: center;
  text-transform: uppercase;
}

.sitewide-ad--multiplex {
  min-height: 280px;
}

@media (max-width: 767px) {
  .sitewide-ad {
    min-height: 200px;
    margin-bottom: var(--space-48);
  }
}
"""

AD_JS = """(() => {
  let loaderCheck = null;

  function hasMarketingConsent() {
    return Boolean(
      window.Cookiebot &&
      Cookiebot.hasResponse &&
      Cookiebot.consent &&
      Cookiebot.consent.marketing
    );
  }

  function adsenseIsAvailable() {
    return Array.isArray(window.adsbygoogle);
  }

  function collapseIfUnfilled(adElement, wrapper) {
    const observer = new MutationObserver(() => {
      const status = adElement.getAttribute('data-ad-status');

      if (status === 'unfilled') {
        wrapper.hidden = true;
        observer.disconnect();
      } else if (status === 'filled') {
        observer.disconnect();
      }
    });

    observer.observe(adElement, {
      attributes: true,
      attributeFilter: ['data-ad-status']
    });
  }

  function initialiseAd(adElement) {
    const wrapper = adElement.closest('.sitewide-ad');

    if (!wrapper || wrapper.dataset.initialised === 'true') {
      return;
    }

    wrapper.hidden = false;

    requestAnimationFrame(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        wrapper.dataset.initialised = 'true';
        collapseIfUnfilled(adElement, wrapper);
      } catch (error) {
        wrapper.hidden = true;
        console.warn('AdSense unit could not be initialised.', error);
      }
    });
  }

  function initialiseEligibleAds() {
    if (!hasMarketingConsent() || !adsenseIsAvailable()) {
      return;
    }

    document.querySelectorAll('.sitewide-ad .adsbygoogle').forEach(initialiseAd);
  }

  function waitForAdSense() {
    if (!hasMarketingConsent()) {
      return;
    }

    if (adsenseIsAvailable()) {
      initialiseEligibleAds();
      return;
    }

    if (loaderCheck) {
      return;
    }

    let attempts = 0;
    loaderCheck = setInterval(() => {
      attempts += 1;
      if (adsenseIsAvailable()) {
        clearInterval(loaderCheck);
        loaderCheck = null;
        initialiseEligibleAds();
      } else if (attempts >= 20) {
        clearInterval(loaderCheck);
        loaderCheck = null;
      }
    }, 500);
  }

  window.addEventListener('CookiebotOnConsentReady', waitForAdSense);
  window.addEventListener('CookiebotOnAccept', waitForAdSense);
  window.addEventListener('CookiebotOnDecline', () => {
    document.querySelectorAll('.sitewide-ad').forEach((ad) => {
      if (ad.dataset.initialised !== 'true') ad.hidden = true;
    });
  });
  document.addEventListener('DOMContentLoaded', waitForAdSense);
})();
"""

DISPLAY = """
  <section class="section-tight" data-sitewide-ad-section>
    <div class="container">
      <aside class="sitewide-ad sitewide-ad--display" aria-label="Advertisement" hidden>
        <span class="sitewide-ad__label">Advertisement</span>
        <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-7308041122340160" data-ad-slot="6205733112" data-ad-format="auto" data-full-width-responsive="true"></ins>
      </aside>
    </div>
  </section>
"""

MULTIPLEX = """
  <section class="section-tight" data-sitewide-ad-section>
    <div class="container">
      <aside class="sitewide-ad sitewide-ad--multiplex" aria-label="Advertisement" hidden>
        <span class="sitewide-ad__label">Advertisement</span>
        <ins class="adsbygoogle" style="display:block" data-ad-format="autorelaxed" data-ad-client="ca-pub-7308041122340160" data-ad-slot="2190466483"></ins>
      </aside>
    </div>
  </section>
"""

DISPLAY_PAGES = {"index.html", "about.html", "services.html", "case-studies.html"}
MULTIPLEX_PAGES = {
    "service-detail.html", "case-study-detail.html",
    "services/ai-automation.html", "services/digital-strategy.html",
    "services/ecommerce-growth.html", "services/fractional-leadership.html",
    "services/operational-excellence.html", "services/project-delivery.html",
}
EXCLUDED = {"contact.html", "legal/cookies.html", "legal/privacy.html", "legal/terms.html"}


def depth_prefix(path: Path) -> str:
    return "../" * (len(path.relative_to(ROOT).parts) - 1)


def replace_adsense_loader(html: str) -> str:
    pattern = re.compile(
        r"\s*<!-- Google AdSense -->\s*<script\b[^>]*src=[\"']https://pagead2\.googlesyndication\.com/pagead/js/adsbygoogle\.js\?client=ca-pub-7308041122340160[\"'][^>]*>\s*</script>",
        re.I | re.S,
    )
    return pattern.sub("", html)


def enhance_bridge(html: str) -> str:
    if "function loadAdSenseAfterConsent()" in html:
        return html

    marker = '  function updateGoogleConsentFromCookiebot() {'
    loader = f'''  function loadAdSenseAfterConsent() {{
    if (
      !window.Cookiebot ||
      !Cookiebot.hasResponse ||
      !Cookiebot.consent.marketing ||
      document.getElementById("adsense-loader")
    ) {{
      return;
    }}

    const script = document.createElement("script");
    script.id = "adsense-loader";
    script.async = true;
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={PUBLISHER}";
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  }}

'''
    html = html.replace(marker, loader + marker, 1)
    html = html.replace(
        '    gtag("set", "ads_data_redaction", !marketingGranted);',
        '    gtag("set", "ads_data_redaction", !marketingGranted);\n\n    if (marketingGranted) {\n      loadAdSenseAfterConsent();\n    }',
        1,
    )
    return html


def add_assets(html: str, path: Path) -> str:
    prefix = depth_prefix(path)
    css = f'<link rel="stylesheet" href="{prefix}assets/css/adsense.css">'
    js = f'<script src="{prefix}assets/js/adsense-units.js" defer></script>'
    if css not in html:
        html = html.replace('<link rel="stylesheet" href="' + prefix + 'assets/css/main.css">', '<link rel="stylesheet" href="' + prefix + 'assets/css/main.css">\n' + css, 1)
    if js not in html:
        html = html.replace('</body>', js + '\n</body>', 1)
    return html


def add_placement(html: str, markup: str) -> str:
    if 'data-sitewide-ad-section' in html:
        return html
    return html.replace('</main>', markup + '\n</main>', 1)


(ROOT / "assets/css/adsense.css").write_text(AD_CSS, encoding="utf-8")
(ROOT / "assets/js/adsense-units.js").write_text(AD_JS, encoding="utf-8")

for path in ROOT.rglob("*.html"):
    rel = path.relative_to(ROOT).as_posix()
    html = path.read_text(encoding="utf-8-sig")
    html = replace_adsense_loader(html)
    html = enhance_bridge(html)

    if rel not in EXCLUDED:
        html = add_assets(html, path)

    if rel in DISPLAY_PAGES:
        html = add_placement(html, DISPLAY)
    elif rel in MULTIPLEX_PAGES:
        html = add_placement(html, MULTIPLEX)

    path.write_text(html, encoding="utf-8")

# Validation
for path in ROOT.rglob("*.html"):
    html = path.read_text(encoding="utf-8")
    assert 'data-cookieconsent="ignore"' not in html
    assert 'src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js' not in html
    assert html.count('function loadAdSenseAfterConsent()') == 1

print("Sitewide AdSense implementation completed and validated.")
