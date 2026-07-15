const PUBLIC_STATUS = "published";
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function firstDefined(record, keys) {
  for (const key of keys) {
    if (record?.[key] !== undefined) return record[key];
  }
  return undefined;
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidSlug(value) {
  return typeof value === "string" && SLUG_PATTERN.test(value);
}

function isPublished(record) {
  return firstDefined(record, ["status", "service_status", "serviceStatus"]) === PUBLIC_STATUS;
}

function isEffectiveDate(value, now = new Date()) {
  if (!value) return false;
  const publishedAt = new Date(value);
  const effectiveAt = now instanceof Date ? now : new Date(now);
  return Number.isFinite(publishedAt.getTime())
    && Number.isFinite(effectiveAt.getTime())
    && publishedAt.getTime() <= effectiveAt.getTime();
}

function isPublicBlogPost(record, { now = new Date() } = {}) {
  const publishedAt = firstDefined(record, ["first_published_at", "firstPublishedAt", "firstPublishedDate"]);
  return isPublished(record) && isEffectiveDate(publishedAt, now);
}

function isPublicRelationshipTarget(record, { type = "generic", now = new Date() } = {}) {
  if (!record || !isValidSlug(record.slug)) return false;
  if (type === "blog") return isPublicBlogPost(record, { now });
  return isPublished(record);
}

function isIndexingApproved(record) {
  return firstDefined(record, ["is_indexable", "isIndexable"]) === true;
}

function hasCompleteMetadata(record) {
  return hasText(firstDefined(record, ["local_intro", "localIntro"]))
    && hasText(firstDefined(record, ["seo_title", "seoTitle"]))
    && hasText(firstDefined(record, ["seo_description", "seoDescription"]));
}

function hasValidLocationRoute(record) {
  return [
    firstDefined(record, ["nation_slug", "nationSlug"]),
    firstDefined(record, ["region_slug", "regionSlug"]),
    firstDefined(record, ["county_slug", "countySlug"]),
    record?.slug,
  ].every(isValidSlug);
}

function hasValidCoordinates(record) {
  const latitude = Number(record?.latitude);
  const longitude = Number(record?.longitude);
  return Number.isFinite(latitude)
    && latitude >= -90
    && latitude <= 90
    && Number.isFinite(longitude)
    && longitude >= -180
    && longitude <= 180;
}

function isEligibleLocation(record) {
  return Boolean(record)
    && isPublished(record)
    && isIndexingApproved(record)
    && hasCompleteMetadata(record)
    && hasValidLocationRoute(record)
    && hasValidCoordinates(record);
}

function isEligibleLocationService(record, { eligibleLocationIds = new Set() } = {}) {
  const locationId = firstDefined(record, ["location_id", "locationId"]);
  const relationshipStatus = firstDefined(record, ["relationship_status", "relationshipStatus", "status"]);
  const serviceStatus = firstDefined(record, ["service_status", "serviceStatus"]);
  const serviceSlug = firstDefined(record, ["service_slug", "serviceSlug", "slug"]);

  return Boolean(record)
    && eligibleLocationIds.has(locationId)
    && relationshipStatus === PUBLIC_STATUS
    && serviceStatus === PUBLIC_STATUS
    && isIndexingApproved(record)
    && hasCompleteMetadata(record)
    && isValidSlug(serviceSlug);
}

function filterPublicRelationshipTargets(records, options) {
  return (Array.isArray(records) ? records : []).filter((record) => isPublicRelationshipTarget(record, options));
}

module.exports = {
  PUBLIC_STATUS,
  SLUG_PATTERN,
  filterPublicRelationshipTargets,
  hasCompleteMetadata,
  hasText,
  hasValidCoordinates,
  hasValidLocationRoute,
  isEffectiveDate,
  isEligibleLocation,
  isEligibleLocationService,
  isIndexingApproved,
  isPublicBlogPost,
  isPublicRelationshipTarget,
  isPublished,
  isValidSlug,
};
