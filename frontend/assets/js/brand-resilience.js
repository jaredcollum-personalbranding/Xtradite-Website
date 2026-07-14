(() => {
  "use strict";

  const SITE_URL = "https://www.xtradite-digital.co.uk";
  const SOCIAL_IMAGE = `${SITE_URL}/assets/brand/xtradite-social-share.svg`;
  const FAVICON = `${SITE_URL}/assets/brand/favicon.svg`;

  function ensureLink(selector, attributes) {
    let element = document.head.querySelector(selector);
    if (!element) {
      element = document.createElement("link");
      document.head.appendChild(element);
    }
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  function ensureMeta(selector, attributes) {
    let element = document.head.querySelector(selector);
    if (!element) {
      element = document.createElement("meta");
      document.head.appendChild(element);
    }
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  function prepareLogo(image) {
    if (!(image instanceof HTMLImageElement) || image.dataset.brandReady === "true") return;
    image.dataset.brandReady = "true";
    const footer = Boolean(image.closest(".site-footer"));
    image.alt = image.alt || "Xtradite Digital";
    image.decoding = "async";
    image.loading = footer ? "lazy" : "eager";
    image.fetchPriority = footer ? "low" : "high";
    image.addEventListener("error", () => image.setAttribute("data-image-error", "true"), { once: true });
  }

  function prepareBrandAssets(root = document) {
    root.querySelectorAll?.("img.logo-img").forEach(prepareLogo);
  }

  function prepareMetadata() {
    ensureLink('link[rel="icon"][type="image/svg+xml"]', { rel: "icon", type: "image/svg+xml", href: FAVICON });
    ensureMeta('meta[name="theme-color"]', { name: "theme-color", content: "#0D0D0D" });

    if (!document.head.querySelector('meta[property="og:image"]')) {
      ensureMeta('meta[property="og:image"]', { property: "og:image", content: SOCIAL_IMAGE });
      ensureMeta('meta[property="og:image:width"]', { property: "og:image:width", content: "1200" });
      ensureMeta('meta[property="og:image:height"]', { property: "og:image:height", content: "630" });
      ensureMeta('meta[property="og:image:alt"]', { property: "og:image:alt", content: "Xtradite Digital — practical consultancy for measurable growth" });
    }
    if (!document.head.querySelector('meta[name="twitter:image"]')) {
      ensureMeta('meta[name="twitter:image"]', { name: "twitter:image", content: SOCIAL_IMAGE });
    }
  }

  function prepareFooter() {
    document.querySelectorAll(".site-footer .footer-bottom span").forEach((element) => {
      element.innerHTML = element.innerHTML.replace(/©\s*\d{4}/, `&copy; ${new Date().getFullYear()}`);
    });
    document.querySelectorAll('.footer-social a[href="#"]').forEach((link) => {
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("tabindex", "-1");
      link.addEventListener("click", (event) => event.preventDefault());
    });
  }

  prepareMetadata();
  prepareBrandAssets();
  prepareFooter();

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (!(node instanceof Element)) return;
      prepareBrandAssets(node.matches("img.logo-img") ? node.parentElement : node);
    }));
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
