# Jam refinement implementation and acceptance map

This document maps GitHub issues #57–#62 to the implementation on `feat/jam-work-packages-57-62`. Pull request #63 remains unmerged until the acceptance evidence has been reviewed.

## #57 — Global typography, layout stability and shared CSS loading

Implemented through:

- `scripts/inject-jam.js`
- `scripts/validate-jam-foundation.js`
- `frontend/assets/css/jam-refinement.css`
- Existing shared component stylesheets injected into every HTML `<head>` during the build

Controls:

- Shared styles are present before first paint.
- Runtime stylesheet injection and runtime mojibake repair are removed from generated `site.js`.
- Common encoding artefacts and invalid CSS property spellings fail the build.
- Container-aware `clamp()` typography, balanced wrapping and intrinsic grid sizing are required by validation.

## #58 — Homepage hero and featured-work storytelling

Implemented through:

- `frontend/index.html`
- `frontend/assets/js/pages/home.js`
- `frontend/assets/css/jam-refinement.css`

Controls:

- Hero communicates `diagnose → design → deliver → improve` with reduced-motion support.
- Proof points form part of the same opening narrative.
- Featured work is loaded from published Supabase case studies.
- Explicit featured flags are preferred; otherwise records are ranked by content completeness.
- Homepage copy does not invent missing constraints, interventions, metrics or timeframes.
- Links use clean case-study routes.
- Loading, incomplete, empty and error states are explicit.

## #59 — Tabs, FAQs and mega-menu interactions

Implemented through:

- `frontend/assets/js/design-system.js`
- `frontend/assets/css/tabs.css`
- `frontend/assets/css/mega-menu.css`
- Shared FAQ styles in the existing design system

Controls:

- Tabs support click, roving focus, arrow keys, Home and End.
- Inactive panels are hidden, inert and marked `aria-hidden`.
- FAQs use deterministic control/panel relationships, buttons, numbered labels, `aria-expanded`, arrow navigation and inert closed panels.
- Mega-menu panels use the shared layered header, Escape close with focus return and focus-out close.

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

The suite covers homepage, service, case-study, case-studies index and industry routes. It records heading/body overflow, console errors, same-origin request failures, keyboard interactions, ARIA state, reduced-motion behaviour and required screenshots. It also captures production-versus-branch screenshots for the homepage, representative service page and longest case-study headline.

## Supabase changes

No new destructive database change is introduced by PR #63. The additive technology-use-case migration was applied previously and remains the source for service technology examples.

## Acceptance results

Pending the GitHub Actions run and Vercel preview availability.
