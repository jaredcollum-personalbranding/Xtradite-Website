(() => {
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
