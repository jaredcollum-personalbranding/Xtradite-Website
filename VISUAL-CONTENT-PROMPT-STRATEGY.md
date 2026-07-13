# Xtradite Digital — Visual Content & Prompt Strategy

## 1. The visual idea

**Show the movement from operational complexity to commercial clarity.**

Xtradite Digital should look experienced, practical and commercially sharp—not like a futuristic AI startup or a generic corporate consultancy. Every visual should do one of four jobs:

1. **Prove** — real people, real work, real environments and real outcomes.
2. **Explain** — turn systems, processes and commercial problems into understandable diagrams.
3. **Orient** — help visitors instantly recognise a service, industry or article topic.
4. **Energise** — add controlled motion and warmth without competing with the message.

### Brand visual language

- Warm off-white and cream foundations.
- Blaze orange as the main focal colour.
- Magenta and indigo as secondary accents, used sparingly.
- Deep indigo-black for authority and contrast.
- Rounded forms and connecting paths to suggest movement, systems and joined-up delivery.
- Real texture and human imperfection in photography.
- Bold, simplified geometry in illustration and vectors.
- No glossy “consultants pointing at a glass wall,” neon AI brains, blue holograms, handshakes or anonymous boardroom stock clichés.

## 2. Recommended asset mix

| Asset family | Best role | Recommended share | Style |
|---|---|---:|---|
| Photography | Trust, case studies, About, industry context | 40% | Candid, editorial, naturally lit |
| Illustration | Services, Insights, abstract concepts | 30% | Hand-drawn whiteboard or clean editorial |
| Vector graphics | Icons, process diagrams, data flows, decorative systems | 20% | Minimal, editable, 2–4 colours |
| Video/motion | Homepage hero, process, selected service headers | 10% | Subtle 5–10 second loops |

This balance keeps the site credible and visually rich without making it feel like an image gallery.

## 3. Where each visual belongs

### Homepage

- **Hero:** one restrained photographic or mixed-media loop showing real operational work across commerce, fulfilment and decision-making. Keep generous clear space around the heading.
- **Services:** six matching vector or editorial illustrations—one per service.
- **Five-step process:** one animated line/path system, not five unrelated images.
- **Case studies:** 16:9 real or commissioned photography. Replace the current “Case Study Photography” placeholders.
- **Insights:** retain the established 16:9 hand-drawn whiteboard illustration system.
- **Testimonials:** use real approved portraits only. Do not generate fictional client portraits.

### Services and service detail pages

- One consistent hero illustration per service.
- Small process vectors for “How It Works.”
- Optional 5–7 second motion version of the hero for AI & Automation, Digital Strategy and Project Delivery.
- Do not add decorative photography to every section; the explanation should remain the focus.

### Industries and industry detail pages

- Use documentary-style environmental photography as the dominant medium.
- Retail: shop-floor operations, stock movement, colleague/customer context.
- eCommerce: packing, fulfilment, merchandising and trading operations—not a laptop floating in space.
- Manufacturing: production planning, quality, machinery and teams.
- Consumer goods: product range, warehouse, supply planning and retail execution.
- Professional services: working sessions, analysis and collaborative decision-making.
- Startups: founders/operators solving practical problems in small teams.

### Case studies

- Use real client-approved assets wherever possible.
- If no real client image is available, use an honest **sector editorial image**, not an invented depiction of the named client.
- Add a caption such as “Sector illustration” when a generated image could otherwise be read as documentary evidence.
- Build each detail page around one hero image, one process diagram and one results visual.

### Insights

- Continue the existing framed whiteboard-cover convention at 16:9.
- Each cover should express one argument, not summarise the whole article.
- Use no more than 5–7 visual elements and 0–4 short labels.
- Add the article title in HTML, not inside the generated image.

### About and Contact

- About needs real founder/team photography: portrait, working session, on-location detail and a wider environmental shot.
- Contact needs either no hero visual or one quiet, abstract connection graphic. Avoid a call-centre image.

## 4. The reusable master prompt structure

Use this structure for every generated asset. Delete any line that is not relevant.

```text
Use case: [photorealistic-natural / stylized-concept / infographic-diagram / logo-brand]
Asset type: [homepage hero / case-study card / service illustration / article cover / video loop]
Business context: UK digital consultancy helping retail, ecommerce and manufacturing operators improve commercial and operational performance.
Primary request: [one clear visual idea]
Scene/backdrop: [specific real environment or simple graphic background]
Subject: [one main subject plus only essential supporting elements]
Style/medium: [editorial photography / hand-drawn whiteboard / flat vector / cinematic video]
Composition/framing: [aspect ratio, viewpoint, subject scale and required clear space]
Lighting/mood: [natural, capable, optimistic, calm urgency]
Colour palette: warm off-white, blaze orange, restrained magenta and indigo, deep indigo-black
Materials/textures: [real skin, worn fabric, paper grain, ink line, matte geometry]
Motion: [subject movement, camera movement, start/end continuity—video only]
Constraints: commercially credible; clear at mobile size; no embedded text unless supplied verbatim
Avoid: corporate stock-photo staging; handshakes; glass-board pointing; neon AI imagery; blue holograms; excessive screens; illegible UI; logos; trademarks; watermark
```

### Consistency lock

Append this to all assets in the same family:

```text
Match the supplied Xtradite visual reference: warm editorial palette, blaze-orange focal accent, restrained magenta and indigo, deep indigo-black linework, confident negative space, rounded geometry and subtle tactile texture. Keep line weight, colour proportions, lighting and visual density consistent with the reference. Do not introduce a new visual style.
```

Generate one approved **style anchor** for photography, illustration and vectors before producing a full batch. Reuse the approved anchor as a style reference.

## 5. Photography strategy and prompts

### Photography direction

- Prefer a real UK location and natural daylight.
- Use 35mm or 50mm editorial framing; occasional 24mm environmental wides.
- Show people absorbed in work rather than looking at camera.
- Include believable operational detail, but avoid readable confidential data.
- Cast should feel representative of real UK operators and teams.
- Retain realistic skin, fabric, surfaces and small imperfections.
- Leave visual breathing room for page headings where required.

### P1 — Homepage hero

```text
Use case: photorealistic-natural
Asset type: Xtradite Digital homepage hero, wide 16:9 crop
Business context: practical UK consultancy for retail, ecommerce and manufacturing growth
Primary request: an experienced digital operator working alongside a small client team to resolve a real operational problem
Scene/backdrop: bright UK operations workspace adjoining an ecommerce fulfilment area; shelves, parcels and a planning table visible but understated
Subject: three diverse professionals reviewing a simple printed workflow and operational data together; candid concentration; natural gestures
Style/medium: premium editorial documentary photography, photorealistic
Composition/framing: wide 35mm environmental shot; people grouped in the right half; generous calm negative space in the left half for website copy; full hands visible
Lighting/mood: soft natural window light; warm, capable and forward-moving; realistic contrast
Colour palette: warm neutrals with one subtle blaze-orange object and very restrained magenta/indigo accents
Materials/textures: real paper, cardboard, fabric, timber and skin texture
Constraints: credible UK business environment; no readable company data; no one looking at camera; no embedded text
Avoid: posed boardroom scene; handshakes; suits; glossy stock-photo smiles; floating graphics; holograms; neon blue; distorted hands; logos; watermark
```

### P2 — Case-study sector photography template

```text
Use case: photorealistic-natural
Asset type: case-study card and detail-page editorial image, 16:9
Primary request: a credible editorial view of [INDUSTRY OPERATION] illustrating [THE OPERATIONAL CHALLENGE]
Scene/backdrop: [SPECIFIC REAL WORKING ENVIRONMENT]
Subject: [OPERATOR OR PROCESS] actively [REAL ACTION]
Style/medium: candid British business documentary photography; natural texture; restrained colour grade
Composition/framing: medium-wide 35mm shot; clear focal subject; safe central crop for cards; no critical detail at edges
Lighting/mood: available light; purposeful and grounded
Colour palette: warm neutral environment with a subtle orange focal detail
Constraints: generic sector scene only unless supplied with real client-approved reference material; no invented client branding; no readable private data; no embedded text
Avoid: staged stock-photo interaction; exaggerated drama; unsafe working practice; logos; watermark
```

### P3 — About-page portrait shot list

Do not use AI to create the founder’s likeness. Brief a photographer to capture:

1. Waist-up environmental portrait, looking to camera, soft window light.
2. Candid working image reviewing a delivery plan or operational dashboard.
3. Wide workplace portrait with meaningful environmental context.
4. Detail image of hands, notebook and working materials.
5. Horizontal conversational image with clear space for a quote.

Shoot RAW, both portrait and landscape, with uncluttered backgrounds and no client-confidential screens.

## 6. Illustration strategy and prompts

Use two related illustration modes:

- **Service illustration:** clean editorial geometry, matte surfaces, limited palette.
- **Insights cover:** hand-drawn whiteboard/marker diagrams with a lightly imperfect human line.

### I1 — Six service illustration prompts

Use the shared suffix below after each primary request.

| Service | Primary visual metaphor |
|---|---|
| AI & Automation | disconnected manual tasks flowing into one clear automated pathway, with human oversight |
| Digital Strategy | a complex field of possible routes resolving into one prioritised commercial roadmap |
| eCommerce Growth | product discovery, conversion, fulfilment and retention connected as one growth loop |
| Operational Excellence | tangled hand-offs becoming a smooth, measurable operating system |
| Fractional Leadership | an experienced guide aligning several teams around one direction and cadence |
| Project Delivery | a plan moving through milestones, dependencies and controlled launch |

```text
Use case: stylized-concept
Asset type: Xtradite service-page hero illustration, landscape 4:3
Primary request: [INSERT THE SERVICE METAPHOR ABOVE]
Style/medium: sophisticated editorial illustration; bold simplified geometry; subtle paper grain; mostly flat colour with very soft depth; not childish and not isometric SaaS clip art
Composition/framing: one clear central system with open margins; readable at 360px wide; maximum 7 major elements
Colour palette: warm off-white background, deep indigo-black forms, blaze-orange focal path, restrained magenta and indigo secondary nodes
Constraints: communicate the idea visually without words; consistent rounded geometry and line weight; no embedded text
Avoid: brains, robots, rockets, light bulbs, puzzle pieces, targets, ladders, floating UI screens, gradients on every object, logos, watermark
```

### I2 — Insights whiteboard-cover template

```text
Use case: infographic-diagram
Asset type: Xtradite Insights article cover, exact 16:9 composition
Article argument: [ONE-SENTENCE THESIS]
Primary visual metaphor: [ONE SYSTEM OR CAUSE-AND-EFFECT DIAGRAM]
Scene/backdrop: warm off-white whiteboard or heavy paper surface with a subtle timber frame
Style/medium: intelligent hand-drawn whiteboard illustration; dark indigo marker line; blaze-orange emphasis; sparse magenta and indigo annotations; slightly imperfect but deliberate strokes
Composition/framing: one large central diagram, 5–7 elements maximum, generous outer margin, all artwork safely inside frame
Text (verbatim): "[OPTIONAL LABEL 1]", "[OPTIONAL LABEL 2]", "[OPTIONAL LABEL 3]"
Constraints: render supplied labels exactly once; no article title inside image; simple enough to understand at card size; strong visual hierarchy
Avoid: dense infographic; tiny writing; corporate icon library; photorealism; extra words; logos; watermark
```

### I3 — Example for “Why growth slows when systems don’t speak to each other”

```text
Use case: infographic-diagram
Asset type: Xtradite Insights article cover, exact 16:9 composition
Article argument: disconnected systems create queues, duplicate work and delayed commercial decisions
Primary request: three separate operational islands—Orders, Stock and Finance—sending conflicting hand-drawn paths into a visible bottleneck, then one clean orange connected path emerging on the other side
Scene/backdrop: warm off-white whiteboard with a subtle timber frame
Style/medium: intelligent hand-drawn marker diagram; deep indigo line; blaze-orange solution path; sparse magenta warning marks
Composition/framing: left-to-right flow; three simple source nodes, one central bottleneck, one clear outcome; generous safe margins
Text (verbatim): "ORDERS", "STOCK", "FINANCE"
Constraints: spell all labels exactly; no other text; understandable at thumbnail size
Avoid: computers talking to each other; robot imagery; dense arrows; logos; watermark
```

## 7. Vector strategy and prompts

Vectors should be created as genuine editable SVGs, then manually simplified. Use them for service symbols, industry symbols, process diagrams and subtle section decoration—not as fake photography.

### Vector system rules

- 24×24 or 32×32 grid for icons; 2px equivalent stroke.
- Rounded line caps and joins.
- Maximum 2 colours per icon; maximum 4 per larger scene.
- Strong silhouette at 24px.
- Avoid text, masks, raster effects and excessive anchor points.
- Convert decorative strokes only where browser consistency requires it.
- Run every SVG through accessibility and security review before publishing.

### V1 — Service icon template

```text
Asset type: editable SVG service icon for [SERVICE]
Primary request: a minimal symbol representing [CONCEPT]
Style/medium: clean flat vector; rounded monoline geometry; consistent 2px stroke; simple balanced negative space
Composition/framing: centred on a 24×24 grid with 2px safe padding; recognisable at favicon scale
Colour palette: deep indigo-black with one blaze-orange accent
Constraints: 2 colours maximum; 3–6 simple paths; no text; no background; no gradients; no shadows; no raster content
Avoid: generic light bulb, rocket, brain, target, puzzle piece, excessive nodes, trademarks
```

### V2 — Five-step process diagram

```text
Asset type: editable SVG website process diagram, responsive horizontal desktop and stackable mobile
Primary request: five connected stages representing Discover, Assess, Design, Deliver and Optimise; the final stage loops subtly back toward the first to suggest continuous improvement
Style/medium: minimal editorial vector diagram; rounded nodes; confident monoline connectors; tactile but clean
Composition/framing: five evenly spaced nodes on one flowing path; each node visually distinct without relying on text; clear mobile stacking order
Colour palette: deep indigo-black structure, blaze-orange active path, restrained magenta and indigo secondary accents, transparent background
Constraints: no embedded labels in the artwork; HTML will supply accessible text; no gradients; no shadows; editable paths
Avoid: arrows crossing; busy decoration; corporate clip art; logos
```

### V3 — Background connection motif

```text
Asset type: seamless decorative SVG section motif
Primary request: a sparse network of rounded paths and small nodes suggesting systems becoming connected and orderly
Style/medium: minimal monoline vector pattern
Composition/framing: low-density, asymmetric, seamless edges, large areas of empty space
Colour palette: blaze orange, magenta and indigo at very low opacity on transparent background
Constraints: decorative only; must not resemble a data chart; no text; no gradient; no dominant focal point
```

## 8. Video and motion strategy

Motion should demonstrate change, not merely decorate the page. Keep homepage loops to **5–10 seconds**, muted, seamless and slow enough not to distract from the headline.

### Web delivery requirements

- Produce a 16:9 master and test a 4:5 mobile crop.
- Keep camera motion minimal.
- Export muted WebM and MP4 fallbacks.
- Provide a compressed poster frame.
- Honour `prefers-reduced-motion` and never autoplay sound.
- Lazy-load below-the-fold video.
- Avoid small generated text, interfaces and detailed hand interactions.

### M1 — Homepage operational loop

First generate or photograph an approved still frame, then use it as the first-frame reference.

```text
Asset type: muted seamless homepage hero video loop, 16:9, 6 seconds
Primary request: the supplied editorial operations scene comes gently to life
Subject motion: one colleague slides a printed workflow slightly toward the group; another makes a small natural pointing gesture; a fulfilment colleague moves softly out of focus in the background
Camera motion: nearly static camera with an extremely slow 2% push-in
Lighting/mood: stable soft window light; capable, warm and calm
Timing: hold the opening composition for 0.5 seconds; one subtle coordinated action; settle back into a frame visually compatible with the opening
Composition: preserve clear headline space; preserve every person’s identity, clothing and position
Constraints: realistic physics and hands; no new people or objects; no screen changes; no camera shake; no audio; seamless loop
Avoid: dramatic gestures; talking mouths; time-lapse; floating interface; flicker; morphing; logos; text; watermark
```

### M2 — Abstract service loop

```text
Asset type: muted service-page illustration loop, 16:9, 5 seconds
Primary request: disconnected deep-indigo nodes gradually organise as one blaze-orange path travels through them, creating a clear connected operating flow
Style/medium: premium flat editorial motion graphic with subtle paper grain
Motion: slow sequential connection from left to right; one gentle pulse at completion; last frame returns naturally to the first
Camera: locked
Colour palette: Xtradite warm off-white, blaze orange, deep indigo-black, restrained magenta and indigo
Constraints: 6 nodes maximum; no text; no icons changing shape; no particles; no 3D camera; seamless loop
Avoid: fast motion; glowing cyber effects; loading-spinner feel; logos; watermark
```

### M3 — Five-step process animation brief

Build this deterministically as SVG/CSS/Lottie rather than generative video:

1. The connecting path draws from Discover to Optimise on scroll.
2. Each node gains its orange accent as it becomes active.
3. Duration: approximately 1.8 seconds once triggered.
4. Run once, then remain complete.
5. Reduced-motion users see the completed static diagram.

## 9. Generation workflow

### Phase 1 — Establish the system

1. Build a one-page visual reference board using the site palette, typography and 6–10 approved examples.
2. Generate three homepage hero directions: documentary photo, mixed photo/graphic and pure editorial illustration.
3. Approve one photography grade, one illustration style and one vector grammar.
4. Save those three approved outputs as style anchors.

### Phase 2 — Produce a minimum viable library

Produce in this order:

1. One homepage hero still and poster frame.
2. Six service hero illustrations.
3. Six case-study card images.
4. Six industry hero images.
5. One five-step process vector.
6. Covers for the 12 highest-value Insights posts.
7. One homepage hero motion loop.

This is enough to transform the visual experience without filling every gap at once.

### Phase 3 — Iterate correctly

- Generate four rough directions for a single asset.
- Select composition before polishing style.
- Change one variable per revision: subject, crop, palette or detail—not all four.
- Re-state invariants on every edit.
- Review at desktop size, 360px mobile width and card-thumbnail size.
- Reject any asset that requires the caption to explain what it depicts.

### Phase 4 — Production QA

For every asset verify:

- The visual has one clear job and focal point.
- Faces, hands, equipment and workplace practices are plausible.
- No confidential, trademarked or nonsensical content appears.
- Colour contrast and text legibility remain strong when overlaid nearby.
- Crop works at all breakpoints.
- Alt text describes purpose, not aesthetics.
- File is correctly licensed and provenance is recorded.
- AI-generated editorial imagery is not presented as documentary proof.

## 10. File and content standards

### Recommended masters

| Use | Master ratio | Suggested master |
|---|---:|---:|
| Homepage hero | 16:9 | 2400×1350 |
| Section/industry hero | 3:2 or 16:9 | 1800×1200 or 1920×1080 |
| Card image | 16:9 | 1600×900 |
| Social/Open Graph | 1.91:1 | 1200×630 |
| Portrait/social crop | 4:5 | 1080×1350 |
| Icon | square SVG | 24×24 viewBox |

### Delivery formats

- Photography/illustration: AVIF first, WebP fallback where needed.
- Transparent raster: WebP/PNG only when alpha is genuinely required.
- Icons and diagrams: sanitised SVG.
- Video: WebM plus MP4 fallback and AVIF/WebP poster.
- Keep original high-resolution masters outside the deployed asset folder.

### Naming

```text
[page]-[section]-[subject]-[ratio]-v[number].[ext]
home-hero-operations-team-16x9-v01.avif
service-ai-automation-connected-flow-4x3-v01.webp
case-study-fashion-fulfilment-16x9-v01.avif
insight-inventory-accuracy-whiteboard-16x9-v01.webp
process-discover-to-optimise-v01.svg
```

### Alt-text patterns

- Informative photo: `Operations team reviewing a fulfilment workflow beside a packing area.`
- Case-study sector image: `Fashion fulfilment operation used as a sector illustration.`
- Diagram: describe the takeaway, e.g. `Five connected stages from discovery through optimisation.`
- Decorative vector: empty alt text (`alt=""`) and hidden from assistive technology.

## 11. Where to generate the content

### Best practical route

- **Photography:** commission one half-day brand shoot for About and homepage trust imagery; collect client-approved images for case studies. Use generative image tools for generic sector/editorial scenes only.
- **Raster concepts and illustration:** generate directly with an image model, using one approved style reference and the prompts above. Xtradite can also generate these assets iteratively inside Codex.
- **Vectors:** Adobe Firefly Text to Vector can produce downloadable editable SVGs; refine them in Illustrator or Figma before deployment.
- **Video:** Adobe Firefly supports text/image-to-video, first and last keyframes and camera-motion controls; use an approved still as the first frame for consistency.
- **Finishing and layout:** use Figma for crop testing, visual QA and vector cleanup; Illustrator is preferable for complex SVG path cleanup.

Useful official references:

- Adobe Firefly overview: https://helpx.adobe.com/firefly/web/get-started/learn-the-basics/adobe-firefly-overview.html
- Firefly image-to-video workflow: https://helpx.adobe.com/firefly/web/work-with-audio-and-video/work-with-video/generate-videos-using-images.html
- Firefly text-to-vector workflow: https://helpx.adobe.com/firefly/web/generate-vectors/text-to-vector/generate-vectors-using-text-prompts.html
- Figma vectorisation guidance: https://help.figma.com/hc/en-us/articles/38031452710807-Convert-static-images-to-vector-layers

## 12. First production sprint

Start with these five items because they will create the largest visible improvement:

1. Replace the homepage’s empty hero with one approved still.
2. Replace every case-study photography placeholder with real or clearly labelled sector imagery.
3. Produce one style anchor and then six service illustrations as a set.
4. Complete the top 12 Insights whiteboard covers using one repeatable template.
5. Add one subtle homepage loop only after the still, crop and page performance are proven.

Do not generate the entire library in one batch before approving the anchors. Consistency will improve more from a strong reference and a controlled prompt system than from longer prompts.
