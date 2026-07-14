# Jam refinement implementation and acceptance map

This document maps GitHub issues #57–#62 to the completed implementation merged through pull request #63 into `main` as commit `5f416ff85843a989ae0a3474326cedfcca279cd9`.

## #57 — Global typography, layout stability and shared CSS loading

Implemented through:

- `scripts/inject-jam.js`
- `scripts/validate-jam-foundation.js`
- `frontend/assets/css/jam-refinement.css`
- Existing shared component stylesheets injected into every HTML `<head>` during the build
- Source-level removal of runtime stylesheet injection and mojibake repair from `frontend/assets/js/site.js`

Controls:

- Shared styles are present before first paint.
- Runtime stylesheet injection and runtime mojibake repair are absent from source and generated output.
- Common encoding artefacts and invalid CSS property spellings fail the build.
- Container-aware `clamp()` typography, balanced wrapping and intrinsic grid sizing are required by validation.

## #58 — Homepage hero and featured-work storytelling

Implemented through:

- `frontend/index.html`
- `frontend/assets/js/pages/home.js`
- `frontend/assets/css/jam-refinement.css`

Controls:

- The hero communicates `diagnose → design → deliver → improve` with reduced-motion support.
- Proof points form part of the same opening narrative.
- Featured work is loaded from published Supabase case studies.
- Explicit featured flags are preferred; otherwise records are ranked by content completeness.
- Homepage copy does not invent missing constraints, interventions, metrics or timeframes.
- Links use clean case-study routes.
- Loading, incomplete, empty and error states are explicit.

## #59 — Tabs, FAQs and mega-menu interactions

Implemented through:

- `frontend/assets/js/design-system.js`
- `frontend/assets/js/enquiry.js`
- `frontend/assets/css/tabs.css`
- `frontend/assets/css/mega-menu.css`
- `frontend/assets/css/mobile.css`
- Shared FAQ styles in the existing design system

Controls:

- Tabs support click, roving focus, arrow keys, Home and End.
- Inactive panels are hidden, inert and marked `aria-hidden`.
- FAQs use deterministic control/panel relationships, buttons, numbered labels, `aria-expanded`, arrow navigation and inert closed panels.
- Mega-menu panels use the shared layered header, Escape close with focus return and focus-out close.
- Dynamically inserted menu panels synchronise their inert state.
- The closed mobile navigation and closed enquiry interfaces are excluded from the keyboard order.
- The mobile navigation toggle meets the 44 × 44 pixel touch-target requirement.

## #60 — Service delivery storytelling and technology content model

Implemented through:

- `frontend/assets/js/pages/service-template-v3.js`
- `frontend/assets/js/pages/service-delivery-timeline.js`
- `frontend/assets/css/service-template-v3.css`
- `frontend/assets/css/service-delivery-timeline-v2.css`
- `supabase/migrations/20260714021500_service_technology_use_cases.sql`

Controls:

- Desktop delivery stages activate sequentially through Intersection Observer.
- Mobile uses manual accordion behaviour.
- Reduced-motion desktop uses a manual, non-scroll-driven mode.
- Only one delivery phase is expanded.
- Technology examples appear inside the engagement tabs rather than a side rail.
- Supabase supplies use case, category, explanation, evidence note, related technologies, order and publication state.
- Copy distinguishes compatible workflow environments from verified native integrations.

## #61 — Case-study heroes, charts and approach presentations

Implemented through:

- `frontend/assets/js/pages/case-study-detail.js`
- `frontend/assets/js/pages/case-study-experience.js`
- `frontend/assets/js/presentation-player.js`
- `frontend/assets/css/case-study-experience.css`
- `frontend/assets/css/jam-refinement.css`

Controls:

- Long hero headings use container-aware type and flexible layout.
- Evidence cards explain the measure, starting point, change, period/status and commercial meaning.
- Missing raw baselines use an explicitly labelled index rather than an invented value.
- The operating-ceiling graphic is a labelled demand/capacity constraint diagram with accessible text.
- Approach controls precede progress and active content.
- Autoplay uses 1600ms while visible and pauses for user interaction, keyboard focus, hidden tabs and reduced motion.

## #62 — Responsive, accessibility and Vercel acceptance testing

Implemented through:

- `.github/workflows/jam-acceptance.yml`
- `scripts/run-jam-acceptance.mjs`
- `scripts/run-jam-accessibility.mjs`
- `scripts/capture-jam-required-screenshots.mjs`
- `scripts/validate-jam-foundation.js`

Automated matrix:

- 1536 × 826
- 1440 × 900
- 1280 × 800
- 1024 × 768
- 768 × 1024
- 430 × 932
- 390 × 844
- 360 × 800

The suite covers homepage, service, case-study, case-studies index and industry routes. It records heading/body overflow, console errors, same-origin request failures, keyboard interactions, ARIA state, reduced-motion behaviour, representative colour contrast and primary touch targets. It also captures production-versus-branch screenshots for the homepage, representative service page and longest case-study headline.

## Final acceptance results

Exact tested implementation commit: `1b44feaa5c8cb4bfa6ea2c92f06741958a5ae66e`

GitHub Actions run: `29304413940`

Acceptance artefact: `jam-acceptance-51cadf950898824337c3b7be3bd4e09401110655`

- Production build and Jam foundation validator: passed.
- Required viewports: 8/8.
- Pages per viewport: 5.
- Page/viewport combinations: 40.
- Recorded screenshots: 57.
- Required evidence screenshots: 11/11.
- Interaction checks: 9/9 passed.
- Reduced-motion checks: 2/2 passed.
- Accessibility checks: 30/30 passed.
- Touch-target groups: 6/6 passed.
- Representative contrast groups: 6/6 passed.
- Keyboard traversal groups: 6/6 passed.
- Heading/body overflow failures: 0.
- Application console errors: 0.
- Same-origin request failures: 0.

Required screenshots include:

- Homepage hero.
- Homepage featured work.
- Service tabs.
- Service timeline.
- Service technology content.
- FAQ component.
- Case-study hero.
- Case-study charts.
- Case-study timeline.
- Mega-menu.
- Case-studies presentation.

## Vercel acceptance

The branch preview reached `READY` and the homepage and representative service routes returned HTTP 200 with build-injected critical CSS present in the original HTML. This merged documentation update was committed to `main` to trigger the production release after the earlier account build-rate limit.

## Supabase changes and advisers

No new destructive database change was introduced by PR #63. The additive technology-use-case migration was applied previously and remains the source for service technology examples.

The Supabase adviser review identified existing informational or warning-level items rather than migration failures:

- `content_reviews` has RLS enabled without public policies, consistent with its private editorial purpose.
- Some public delivery tables and views are exposed through read-only roles for website delivery.
- Several indexes are currently reported as unused, including the new service-technology index; these should be reassessed after production traffic rather than removed before launch.

## Release status

The programme, all six child issues and pull request #63 are complete and merged. The GitHub acceptance suite is green. The production release is tracked against the latest `main` commit created by this record update.

Production was re-triggered on 14 July 2026 after Jam recording `04988f0a-03dd-4377-8e23-665190d94bdf` showed that the live deployment was still serving the pre-merge template and desktop interaction bundle.