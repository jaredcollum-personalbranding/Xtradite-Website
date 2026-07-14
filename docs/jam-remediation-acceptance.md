# Jam remediation acceptance — issue #66

## Source recordings

- Original design feedback: `afbfbf91-8882-4d1c-9be9-1be493d5cd7e`
- Post-release verification: `04988f0a-03dd-4377-8e23-665190d94bdf`

Automated accessibility, route and viewport checks are necessary but do not constitute visual acceptance. Every item below requires a current production screenshot or recording before issue #66 may be closed.

## Remediation map

| Original timestamp | Requirement | Source control | Manual acceptance |
|---|---|---|---|
| 00:05 / 00:52 | Headings remain proportionate and contained | Container-aware typography and `overflow-wrap` rules; service and case-study heading tests | Compare desktop and mobile heading containment |
| 00:17 / 00:24 | Eyebrow alignment follows section context | Shared section-head and eyebrow variants | Check centred and left-aligned examples |
| 00:18 | Replace generic homepage process with useful work/storytelling | Homepage now uses governance principles and approved-only case-study delivery | Confirm no generic five-card process remains |
| 00:48 | Remove page-change header flicker | Build-time fallback mega-menu in `scripts/inject-jam.js` | Record navigation across home, service, industry and insight routes |
| 01:04 / 01:26 / 02:05 | Prevent broken multi-row pills and selectors | Retired service tab/location layers; shared rectangular tab rules remain | Check every remaining tablist at 1536, 768 and 390 widths |
| 01:12 | Prevent stretched text containers | `min-width:0`, balanced headings and intrinsic grids | Check longest card and heading content |
| 01:39 | Use desktop delivery space effectively | One CMS-preserving process accordion with scroll activation | Record each service; confirm one stage opens without rewritten copy |
| 01:40 | Remove technology side rail and nested scrollbar | Technology examples render in normal document flow | Confirm no nested technology scrollbar |
| 02:20 | Roll out approved FAQ pattern | Shared `design-system.js`; service-specific enhancer follows the same numbered pattern | Compare home, service, industry and location FAQs |
| 02:37 | Contain long case-study titles | Case-study heading rules and approved-only delivery | Verify after the first case study is independently approved |
| 02:38 | Explain chart context without invention | Public metrics require approved/qualified evidence; no inferred baseline/timeframe logic | Verify each approved chart against its evidence record |
| 02:47 | Clarify operational constraint visual | Capacity-constraint visual uses governed challenge text and contribution wording | Verify against each approved case study |
| 02:54 | Put controls before active content and default first tab | Shared tab system and case-study presentation controls | Keyboard and visual check |
| 03:40 | Mega-menu remains above and interactive across folds | Build-time mega markup plus shared layering/focus controls | Test pointer path, keyboard, Escape and focus-out |
| 04:03 | Presentation typography and autoplay | Case-study presentation player uses 1600 ms only in viewport and pauses for focus/reduced motion | Verify when an approved presentation is public |
| 04:31 | Standardise submenu type | Shared mega-menu markup and CSS | Compare service, industry and project-insight entries |

## Evidence-integrity controls added

- No generated service ROI, capacity, payback, leverage or delivery-window figures.
- Service process content is read from Supabase and is never replaced with hardcoded phases.
- Case studies and metrics fail closed until independent public approval.
- Homepage proof figures and placeholder testimonials are absent.
- Draft, blocked, future and noindex records are excluded from public delivery surfaces.
- Service canonical, robots and entity fields are applied by the server renderer.

## Required production evidence

Capture the following after a successful deployment:

1. Homepage at 1536×826, 768×1024 and 390×844.
2. One service with the longest heading and all process/FAQ states.
3. Mega-menu over homepage, service and industry content.
4. Case-study index empty-review state.
5. Direct request to a blocked case-study route returning 404/noindex.
6. Services sitemap containing only canonical indexable services.
7. Reduced-motion service and case-study interactions.

Do not close issue #66 solely because automated checks pass. Link the production deployment and attach the evidence above.
