const SITE_URL = "https://www.xtradite-digital.co.uk";
const ORGANISATION_ID = `${SITE_URL}/#organisation`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const PERSON_ID = `${SITE_URL}/about/#jared-collum`;

function compact(value) {
  if (Array.isArray(value)) return value.map(compact).filter((item) => item !== undefined);
  if (value && typeof value === "object") {
    const output = {};
    Object.entries(value).forEach(([key, item]) => {
      const cleaned = compact(item);
      if (cleaned !== undefined && cleaned !== "" && !(Array.isArray(cleaned) && !cleaned.length)) output[key] = cleaned;
    });
    return output;
  }
  return value === null || value === undefined || value === "" ? undefined : value;
}

function organisation() {
  return {
    "@type": "Organization",
    "@id": ORGANISATION_ID,
    name: "Xtradite Digital",
    legalName: "Xtradite Digital",
    url: `${SITE_URL}/`,
    logo: {
      "@type": "ImageObject",
      url: "https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/Branding/wordmark-caps-light.png"
    },
    founder: { "@id": PERSON_ID },
    areaServed: { "@type": "Country", name: "United Kingdom" },
    knowsAbout: [
      "Digital strategy",
      "AI enablement and automation",
      "Ecommerce growth",
      "Operational excellence",
      "Fractional leadership",
      "Digital project delivery"
    ]
  };
}

function website() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: "Xtradite Digital",
    publisher: { "@id": ORGANISATION_ID },
    inLanguage: "en-GB"
  };
}

function breadcrumbs(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

function buildGraph({ canonical, title, description, pageType = "WebPage", primaryEntity, breadcrumbItems = [] }) {
  const pageId = `${canonical}#webpage`;
  const graph = [organisation(), website(), {
    "@type": pageType,
    "@id": pageId,
    url: canonical,
    name: title,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    about: primaryEntity?.["@id"] ? { "@id": primaryEntity["@id"] } : undefined,
    primaryImageOfPage: primaryEntity?.image ? { "@type": "ImageObject", url: primaryEntity.image } : undefined,
    inLanguage: "en-GB"
  }];

  if (breadcrumbItems.length > 1) graph.push({ ...breadcrumbs(breadcrumbItems), "@id": `${canonical}#breadcrumb` });
  if (primaryEntity) graph.push(primaryEntity);

  return compact({ "@context": "https://schema.org", "@graph": graph });
}

function primaryEntityFor(type, item, canonical, description) {
  const entityId = `${canonical}#primary`;
  if (type === "industry") {
    return compact({
      "@type": "CollectionPage",
      "@id": entityId,
      name: item.title,
      description,
      url: canonical,
      mainEntityOfPage: { "@id": `${canonical}#webpage` },
      provider: { "@id": ORGANISATION_ID }
    });
  }
  if (type === "case-study") {
    return compact({
      "@type": ["Article", "CreativeWork"],
      "@id": entityId,
      headline: item.headline || item.client,
      name: item.client,
      description,
      about: item.industry,
      datePublished: item.published_at,
      dateModified: item.updated_at,
      author: { "@id": ORGANISATION_ID },
      publisher: { "@id": ORGANISATION_ID },
      mainEntityOfPage: { "@id": `${canonical}#webpage` }
    });
  }
  if (type === "insight") {
    return compact({
      "@type": "BlogPosting",
      "@id": entityId,
      headline: item.title,
      description,
      image: item.cover_image_url,
      datePublished: item.first_published_at,
      dateModified: item.updated_at,
      author: { "@id": PERSON_ID },
      publisher: { "@id": ORGANISATION_ID },
      articleSection: Array.isArray(item.tags) ? item.tags[0] : undefined,
      keywords: Array.isArray(item.tags) ? item.tags.join(", ") : undefined,
      wordCount: typeof item.content_text === "string" ? item.content_text.trim().split(/\s+/).filter(Boolean).length : undefined,
      mainEntityOfPage: { "@id": `${canonical}#webpage` }
    });
  }
  return undefined;
}

module.exports = {
  SITE_URL,
  ORGANISATION_ID,
  WEBSITE_ID,
  PERSON_ID,
  buildGraph,
  primaryEntityFor,
  compact
};
