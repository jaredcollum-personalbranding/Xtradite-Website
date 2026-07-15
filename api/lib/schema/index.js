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

function person() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: "Jared Collum",
    jobTitle: "Founder and Digital Consultant",
    url: `${SITE_URL}/about/`,
    worksFor: { "@id": ORGANISATION_ID },
    knowsAbout: [
      "Digital strategy",
      "Ecommerce",
      "Customer lifecycle management",
      "Analytics",
      "AI enablement and automation",
      "Digital operations"
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

function normaliseEntity(value) {
  if (typeof value === "string") {
    const name = value.trim();
    return name ? { "@type": "Thing", name } : undefined;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;

  const name = typeof value.name === "string" ? value.name.trim() : "";
  const type = typeof value["@type"] === "string"
    ? value["@type"].trim()
    : typeof value.type === "string"
      ? value.type.trim()
      : "Thing";
  const url = typeof value.url === "string" && /^https?:\/\//i.test(value.url) ? value.url : undefined;
  const id = typeof value["@id"] === "string" && /^https?:\/\//i.test(value["@id"]) ? value["@id"] : undefined;

  if (!name && !id) return undefined;
  return compact({ "@type": type || "Thing", "@id": id, name, url });
}

function normaliseEntityList(value) {
  if (!Array.isArray(value)) return [];
  return value.map(normaliseEntity).filter(Boolean);
}

function pick(object, ...keys) {
  for (const key of keys) {
    if (object && object[key] !== undefined && object[key] !== null) return object[key];
  }
  return undefined;
}

function eligibleRelatedCaseStudy(item) {
  return pick(item, "status") === "published"
    && pick(item, "public_approval_status", "publicApprovalStatus") === "approved"
    && pick(item, "noindex") !== true
    && Boolean(pick(item, "slug"));
}

function faqEntity(items, canonical) {
  if (!Array.isArray(items)) return undefined;
  const mainEntity = items.map((item) => {
    const question = pick(item, "question", "title", "q");
    const answer = pick(item, "answer", "response", "description", "a");
    if (!question || !answer) return undefined;
    return {
      "@type": "Question",
      name: String(question),
      acceptedAnswer: {
        "@type": "Answer",
        text: String(answer).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      }
    };
  }).filter(Boolean);
  if (!mainEntity.length) return undefined;
  return { "@type": "FAQPage", "@id": `${canonical}#faq`, mainEntity };
}

function additionalEntitiesFor(type, item, canonical) {
  const entities = [];
  if (type === "service") {
    const faq = faqEntity(item.faqs, canonical);
    if (faq) entities.push(faq);

    const related = Array.isArray(item.related_case_studies)
      ? item.related_case_studies.filter(eligibleRelatedCaseStudy)
      : [];
    related.forEach((caseStudy) => {
      entities.push({
        "@type": ["Article", "CreativeWork"],
        "@id": `${SITE_URL}/case-studies/${encodeURIComponent(caseStudy.slug)}#primary`,
        url: `${SITE_URL}/case-studies/${encodeURIComponent(caseStudy.slug)}`,
        name: caseStudy.headline || caseStudy.client
      });
    });
  }

  if (type === "industry" && Array.isArray(item.related_services) && item.related_services.length) {
    const itemListElement = item.related_services.map((service, index) => {
      if (!service?.slug || !service?.title) return undefined;
      return {
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Service",
          "@id": `${SITE_URL}/services/${encodeURIComponent(service.slug)}#primary`,
          url: `${SITE_URL}/services/${encodeURIComponent(service.slug)}`,
          name: service.title
        }
      };
    }).filter(Boolean);
    if (itemListElement.length) entities.push({
      "@type": "ItemList",
      "@id": `${canonical}#related-services`,
      name: `Services relevant to ${item.title}`,
      itemListElement
    });
  }

  return entities;
}

function buildGraph({ canonical, title, description, pageType = "WebPage", primaryEntity, additionalEntities = [], breadcrumbItems = [] }) {
  const pageId = `${canonical}#webpage`;
  const graph = [organisation(), person(), website(), {
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
  if (Array.isArray(additionalEntities)) graph.push(...additionalEntities);

  return compact({ "@context": "https://schema.org", "@graph": graph });
}

function primaryEntityFor(type, item, canonical, description) {
  const entityId = `${canonical}#primary`;
  if (type === "service") {
    const configuredPrimary = normaliseEntity(item.primary_entity);
    const about = normaliseEntityList(item.about_entities);
    const mentions = normaliseEntityList(item.mention_entities);
    return compact({
      "@type": "Service",
      "@id": entityId,
      name: item.title,
      serviceType: configuredPrimary?.name || item.category || item.title,
      description,
      url: canonical,
      provider: { "@id": ORGANISATION_ID },
      areaServed: { "@type": "Country", name: "United Kingdom" },
      about,
      mentions,
      subjectOf: Array.isArray(item.related_case_studies)
        ? item.related_case_studies.filter(eligibleRelatedCaseStudy).map((caseStudy) => ({
            "@id": `${SITE_URL}/case-studies/${encodeURIComponent(caseStudy.slug)}#primary`
          }))
        : [],
      mainEntityOfPage: { "@id": `${canonical}#webpage` }
    });
  }
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
  organisation,
  person,
  website,
  buildGraph,
  primaryEntityFor,
  additionalEntitiesFor,
  compact,
  normaliseEntity,
  normaliseEntityList
};
