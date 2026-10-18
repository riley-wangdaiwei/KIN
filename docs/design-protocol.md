# KIN Visual Design Protocol
## Reference direction: Revue Faire editorial spreads

**Version:** 2.0  
**Purpose:** A machine-readable implementation brief for a coding agent or designer building the KIN MVP.  
**Visual target:** Closely reproduce the visual grammar of the two supplied Revue Faire reference images: monochrome photographic editorial pages, oversized high-contrast serif typography, unusually dense editorial text, barcode-like graphic blocks, small typewriter-style metadata, strong black shapes, layered/cropped imagery, and intentionally off-grid composition.

> Treat the supplied screenshots as the primary visual source of truth. Match their composition, contrast, density, typography hierarchy, and layering as closely as the KIN content allows. Do not copy Revue Faire's exact title, article text, publication identity, or proprietary page content. Recreate the design grammar with KIN's own content and assets.

---

## 1. Core art direction

```yaml
art_direction:
  name: "KIN / Dense Editorial Publication"
  reference: "Supplied Revue Faire cover and interior spread"
  keywords:
    - monochrome
    - editorial
    - archival
    - photographic
    - typographic
    - overprinted
    - dense
    - asymmetrical
    - literary
    - layered
    - imperfectly aligned
    - publication-like
  feeling:
    - "An independent research / culture magazine, not a startup landing page"
    - "Printed matter scanned or photographed and reassembled digitally"
    - "Content-rich, visually assertive, with deliberate collisions between text and image"
  must_have:
    - full-bleed or near-full-bleed documentary photography
    - oversized black or white high-contrast serif headlines
    - small dense serif editorial paragraphs
    - tiny monospaced metadata and captions
    - black panels or large geometric overlays
    - barcode-like vertical stripe graphics used as recurring visual motifs
    - occasional paperclip / archival / office ephemera motifs
    - vertical or rotated marginal labels
    - overlapping layers, cropped objects, and asymmetric text placement
    - visible shifts between very large type and very small text
  must_not_have:
    - generic SaaS hero layout
    - pale beige lifestyle branding as the default
    - bright colorful accent palette
    - evenly spaced rounded cards in repeated grids
    - large soft shadows
    - pill-shaped UI everywhere
    - gradients used as decoration without a legibility purpose
    - excessive empty whitespace around every section
    - perfectly centered, polished, uniform layouts
```

### The visual principle

**Build the page as an editorial composition, not as a stack of web sections.** Photography, typography, labels, lines, barcodes, and blocks should interact within a shared canvas. Some elements can overlap or run close to the edge. Hierarchy comes from scale, contrast, position, and density—not from rounded cards or colorful backgrounds.

The design should feel intentionally composed and slightly unruly, never randomly cluttered.

---

## 2. Color system

The reference is almost entirely black, white, and grayscale photography. Remove the previous coral accent as a default brand color. KIN may introduce a restrained accent later, but it must not dilute the monochrome reference direction.

```yaml
colors:
  black: "#050505"
  near_black: "#111111"
  charcoal: "#242424"
  mid_gray: "#777777"
  light_gray: "#C8C8C8"
  paper_white: "#F4F3EF"
  white: "#FFFFFF"

  overlays:
    black_photo_overlay: "rgba(0, 0, 0, 0.42)"
    heavy_black_overlay: "rgba(0, 0, 0, 0.68)"
    black_panel: "rgba(0, 0, 0, 0.94)"
    white_wash: "rgba(255, 255, 255, 0.12)"

  usage:
    page_background: "#050505 or #F4F3EF, selected per composition"
    primary_text_on_light: "#050505"
    primary_text_on_dark: "#FFFFFF"
    secondary_text_on_light: "#4A4A4A"
    secondary_text_on_dark: "#C8C8C8"
    rules_on_light: "#777777"
    rules_on_dark: "#777777"
    accent: "none by default"
```

### Color rules

1. Use black and white as structural colors, not just text colors.
2. Use grayscale photography or desaturate selected images to match the references.
3. Text over a photo must remain readable. Use a localized black overlay, shadow-free gradient, black patch, or text placement over a naturally dark region as needed.
4. Do not apply the same dark overlay to every image. The cover reference is a photograph with a darker lower area; the interior reference uses a nearly black field and small image fragments.
5. Use tiny changes in gray for rules, barcode edges, annotations, and metadata.
6. Do not introduce gradients, colored cards, or multiple accent colors unless a future KIN art direction explicitly approves them.

---

## 3. Typography system

The reference relies on a distinctive three-layer type system: monumental editorial serif, small serif reading text, and tiny monospaced production metadata. These layers are essential. Do not simplify the system to one heading font plus one sans-serif body font.

```yaml
typography:
  display_serif:
    role:
      - cover_titles
      - main_editorial_titles
      - oversized single words or glyphs
      - pull quotes
    preferred_stack: '"Times New Roman", "Bodoni MT", Didot, Georgia, serif'
    weight: 400
    style: "normal; allow italic only for selected emphasis"
    character: "high-contrast editorial serif"
    letter_spacing: "-0.045em to 0em"
    line_height: "0.78 to 0.98"
    behavior:
      - "Headlines may wrap tightly across several lines."
      - "Allow headlines to crop against the edge when visually intentional."
      - "Allow text to overlap photography or black geometric shapes."
      - "Use extremely large scale on covers and feature openings."

  reading_serif:
    role:
      - editorial_paragraphs
      - article_copy
      - bilingual text blocks
      - artist notes and publication text
    preferred_stack: '"Times New Roman", Georgia, serif'
    weight: 400
    desktop_size: "12px to 15px for dense editorial layouts"
    desktop_line_height: "1.05 to 1.22"
    mobile_size: "12px to 14px where readable"
    mobile_line_height: "1.12 to 1.3"
    behavior:
      - "Use narrow columns instead of a single full-width paragraph."
      - "Allow substantial amounts of text in compact, carefully aligned blocks."
      - "Use paragraph breaks sparingly but preserve reading comprehension."
      - "Avoid modern oversized line-height and generous paragraph spacing."

  micro_mono:
    role:
      - image captions
      - credits
      - issue number
      - ISBN / ISSN-like publication metadata
      - vertical labels
      - language markers
      - small source notes
    preferred_stack: '"Courier New", "Liberation Mono", monospace'
    weight: 400
    size: "8px to 11px"
    line_height: "1.0 to 1.2"
    letter_spacing: "0 to 0.015em"
    behavior:
      - "Use small, typewriter-like captions, often in short compact blocks."
      - "Use on both light and dark fields with sufficient contrast."
      - "Place close to image edges or along margins."

  functional_sans:
    role:
      - navigation
      - form controls
      - buttons
      - accessibility labels
      - interaction hints
    preferred_stack: "Arial, Helvetica, sans-serif"
    size: "12px to 16px"
    line_height: "1.2 to 1.4"
    behavior:
      - "Keep controls simple and quiet so the editorial typography remains dominant."

  size_tokens:
    cover_title: "clamp(3.8rem, 11vw, 9.8rem)"
    giant_glyph: "clamp(12rem, 38vw, 38rem)"
    feature_title: "clamp(3rem, 7vw, 7rem)"
    section_title: "clamp(2rem, 4.6vw, 4.8rem)"
    subheading: "1.1rem to 1.8rem"
    reading_copy: "12px to 15px"
    caption: "8px to 11px"
```

### Typography composition rules

- Put a very large serif headline and a tiny monospaced caption near each other to create scale contrast.
- Use dense reading copy in narrow columns, with a compact line-height inspired by printed editorial pages.
- Use uppercase language tags such as `EN`, `FR`, or issue metadata near the edges when relevant to KIN content.
- Use tiny captions with author or source information, aligned independently from the headline.
- Do not turn all text into serif. Small controls and functional UI should remain legible and compact.
- Do not use bold sans-serif headings as the main visual identity.
- Preserve responsive readability. Desktop text can be dense; mobile text must not become illegible just to retain density.

---

## 4. Layout and composition

```yaml
layout:
  reference_canvas:
    portrait_ratio: "approximately 0.68 to 0.75 width/height"
    behavior: "poster or magazine page composition"
  website_grid:
    desktop: "12-column editorial grid"
    mobile: "4-column or single-column adapted editorial grid"
    gutters: "12px to 24px"
    column_gaps: "8px to 20px"
    baseline: "allow elements to break the grid deliberately"

  density:
    editorial_sections: "high"
    working_ui: "medium and functional"
    empty_space: "used as contrast, not as the default"

  composition_patterns:
    - "full-bleed photograph with title overprint"
    - "large text occupying one side while a photo fills the other"
    - "near-black page with narrow text blocks and small image fragments"
    - "oversized single glyph or geometric shape crossing several zones"
    - "caption placed away from the headline, near the edge of an image"
    - "vertical marginal text for a date, title, or publication identifier"
    - "barcode blocks overlapping photography or entering from page edges"
    - "paperclip-like line drawings or archive ephemera as occasional annotations"
    - "intentional crop: some graphic objects continue beyond the viewport"
    - "small blocks of source text surrounded by large areas of black"

  rules:
    - "Do not force all elements into identical cards."
    - "Use unequal columns and asymmetric alignment."
    - "Let typography and imagery overlap when they remain understandable."
    - "A composition may be dense in one area and sparse in another."
    - "Edges and margins can be used as active design areas."
    - "Use rules, crop marks, small metadata, and narrow captions as editorial scaffolding."
    - "Do not use arbitrary overlap: every layer must have an explicit visual role."
```

### Important difference between a magazine spread and a web app

Apply the full, dense editorial treatment to marketing surfaces and finished gift publications. The interactive board itself must stay functional: labels need to be selected, dragged, grouped, edited, and read without fighting decorative overlays. Aesthetic layering must not obscure interaction targets or content.

---

## 5. Image treatment and collage grammar

The reference images are not clean product photography in floating cards. They use documentary-looking photographs as a material surface, then layer typography and graphic artefacts over them.

```yaml
image_treatment:
  photography:
    preferred_subjects:
      - "archives, collections, books, print matter, objects, desks, drawers"
      - "artist studios and creative workspaces"
      - "close-up textures and ordinary objects with cultural meaning"
      - "places, personal artefacts, and visual fragments connected to a story"
    color_treatment:
      - "prefer monochrome or desaturated images"
      - "preserve photographic texture and imperfections"
      - "avoid glossy stock-photo lighting"
      - "avoid bright commercial lifestyle imagery"
    crop:
      fit: "cover"
      rules:
        - "Use strong intentional crops."
        - "Let part of an object or image run beyond the composition when useful."
        - "Do not distort or stretch images."

  overlays:
    hero:
      - "Place title directly over photography."
      - "Use a translucent dark overlay only where required for contrast."
      - "Prefer a darkened lower gradient when title sits at the bottom."
      - "Allow large black shapes to cover parts of the image."
    interior:
      - "Use near-black fields with small photographs entering from the edge."
      - "Allow image fragments to act like cut-outs or pasted material."

  graphic_motifs:
    barcode:
      description: "High-contrast vertical stripe blocks, sometimes clipped at edges."
      placement: "top edge, right edge, or overlapping a photograph"
      behavior: "decorative unless a real scan workflow is implemented"
    paperclip:
      description: "Thin white or black outline drawings resembling office paperclips."
      placement: "margins or open areas of dark editorial pages"
      behavior: "decorative; use sparingly"
    oversized_shape:
      description: "Very large black letters, cross-like forms, rules, or abstract geometric shapes."
      placement: "cover or selected feature pages"
      behavior: "partially obscure imagery, but do not obscure critical product information"
    marginalia:
      description: "Tiny side labels, vertical title fragments, author credits, page IDs."
      placement: "at edges or near image/text boundaries"
      behavior: "supports the printed-publication feeling"
```

### Do not overuse the motifs

Barcodes, paperclips, giant glyphs, and rotated labels are signature devices from the supplied references, not a requirement to add all of them to every section. Choose one or two motifs per composition. Avoid turning the design into a decorative collage template.

---

## 6. Page archetypes

### A. Cover / landing feature

Use a full-bleed or nearly full-bleed grayscale photo. Place the KIN title or central statement in very large serif type over the photograph. Add small monospaced credits, publication-style metadata, and one or two barcode or geometric motifs. Text may cross the image; the title can sit partly near the edge.

For KIN, use relationship-oriented copy such as:

- `A GIFT STARTS WITH THE LITTLE THINGS.`
- `COLLECT THE FRAGMENTS. FIND THE STORY.`
- `MAKE SOMETHING ONLY YOU COULD GIVE.`

Do not use all three as simultaneous hero headlines. Select one main statement and treat the other lines as editorial secondary content.

### B. Black editorial page

Use a near-black background with small white serif paragraphs in narrow columns. Include a few tiny monospaced metadata blocks, one or two barcode graphics, and occasional line-drawn ephemera. A large region of black can remain empty, but it should feel like part of the composition rather than generic landing-page whitespace.

### C. Image + question page

Place a large serif question on one side and an image or image fragment on the other. Keep the caption close to the image. Use unequal columns and small metadata. This pattern is useful for KIN's `Me?`, `Them?`, and `The Gift?` prompts, artist stories, and product introductions.

### D. Product / gift package page

Treat the gift as an editorial feature, not a standard ecommerce card. Compose a strong title, a descriptive image, compact information on the occasion and artist, and a short but content-rich explanation of why the package fits the relationship. Place price, preorder status, and CTA in a clearly identifiable utility zone.

### E. Artist profile

Show artist name and statement with work samples placed asymmetrically. Use compact credits, labels, work descriptions, process notes, licensing information, and clear calls to collaborate or purchase. The page should read like a contributor profile in an independent publication.

### F. Zine / finished gift presentation

Use an editorial page system: strong cover, compact credits, varied column layouts, image fragments, narrative text, and small page identifiers. Do not apply decorative barcodes or paperclips to every page. The content and story determine the composition.

---

## 7. KIN whiteboard: visual treatment with usability protected

The home page is the working curation board, not a static magazine cover. It should share the same monochrome visual language while remaining an easy-to-use canvas.

```yaml
whiteboard:
  canvas:
    background: "#F4F3EF or #FFFFFF"
    texture: "optional subtle paper grain, almost imperceptible"
    grid: "very faint or off by default"
  labels:
    background: "#F4F3EF"
    foreground: "#050505"
    border: "1px solid #777777"
    typography: "compact reading serif or simple functional sans"
    selected:
      background: "#FFFFFF"
      border: "2px solid #050505"
      additional_cue: "small corner mark, checkbox, or selected icon"
  frames:
    border: "1px solid #777777"
    title: "small monospaced uppercase or compact serif"
    background: "transparent or very light gray"
  curation_components:
    lines: "black or dark gray, thin and intentional"
    arrows: "simple, high-contrast line art"
    labels: "small uppercase or monospace captions"
  popup:
    style: "editorial overlay over the board"
    title: "oversized serif headline"
    instructions: "short, dense serif or sans copy"
    background: "white or black, no rounded SaaS card aesthetic"
  controls:
    style: "compact, plain, clearly interactive"
    focus_state: "high-contrast outline"
```

### Board-specific rules

- Use the editorial design language in the initial example-board popup and in the transition from the board to gift curation.
- Keep labels visually distinct and easy to select. Do not put body text over labels or overlay decorative graphics across active areas.
- Keep `Me?`, `Them?`, and `The Gift?` as large but compact editorial prompts, preferably placed in a fixed side panel or top strip while the board stays visible.
- Selected labels and frames must have a strong non-color indicator as well as a color/outline change.
- Do not make the board itself a dense poster. The board is an instrument for collecting and arranging; the gift/zine output is where the visual language can become fully expressive.

---

## 8. Interaction and motion

```yaml
interaction:
  transition_duration: "120ms to 220ms"
  easing: "ease-out"
  behavior:
    - "Immediate feedback when a label is selected."
    - "Use thin outlines, inverse color, or corner markers for selection."
    - "Animate frame expansion or selection subtly."
    - "Keep drag-and-drop predictable and reversible."
    - "Preserve the board state when progressing between Me, Them, and The Gift."
  avoid:
    - "continuous animation"
    - "decorative parallax"
    - "long transitions that block interaction"
    - "animations that move unrelated labels"
    - "color-only state changes"
```

---

## 9. Responsive behavior

Desktop should preserve the reference's layered magazine composition. Tablet should simplify the layering but keep strong typographic contrast. Mobile should retain the visual identity without reproducing desktop overlap literally when it harms legibility.

```yaml
responsive:
  desktop:
    - "Allow full-bleed images and layered overprint."
    - "Use asymmetrical columns and large display type."
    - "Place metadata on edges and use occasional vertical text."
  tablet:
    - "Reduce oversized type and limit simultaneous overlays."
    - "Keep image/text relationships but reduce column count."
  mobile:
    - "Stack dense text and image fragments when required."
    - "Keep the main title dominant but prevent critical clipping."
    - "Keep metadata small but legible; never shrink body text below a readable size just to imitate the reference."
    - "Use only essential barcode or paperclip motifs."
    - "Keep board labels and controls touch-friendly."
```

---

## 10. Accessibility and implementation requirements

- Ensure text contrast meets WCAG AA wherever practical; any intentional overlap must remain readable.
- Do not place important copy beneath opaque barcode graphics or oversized shapes.
- Provide keyboard access to all interactive controls.
- The whiteboard must support focus states, selection states, and clear feedback beyond color alone.
- Provide text alternatives for meaningful images; decorative motifs should be hidden from assistive technology.
- Respect `prefers-reduced-motion`.
- Use semantic HTML for headings, paragraphs, buttons, labels, and forms.
- Do not use screenshots of text as a substitute for real selectable/searchable HTML content.

---

## 11. CSS token starter

Use these tokens as a starting point. Fine-tune only after comparing the implementation against the supplied reference images.

```css
:root {
  --kin-black: #050505;
  --kin-near-black: #111111;
  --kin-charcoal: #242424;
  --kin-mid-gray: #777777;
  --kin-light-gray: #C8C8C8;
  --kin-paper: #F4F3EF;
  --kin-white: #FFFFFF;

  --kin-overlay: rgba(0, 0, 0, 0.42);
  --kin-overlay-heavy: rgba(0, 0, 0, 0.68);

  --kin-display-serif: "Times New Roman", "Bodoni MT", Didot, Georgia, serif;
  --kin-reading-serif: "Times New Roman", Georgia, serif;
  --kin-micro-mono: "Courier New", "Liberation Mono", monospace;
  --kin-ui-sans: Arial, Helvetica, sans-serif;

  --kin-page-gutter: clamp(12px, 2.2vw, 24px);
  --kin-column-gap: clamp(8px, 1.4vw, 20px);
  --kin-section-gap: clamp(28px, 4vw, 64px);

  --kin-title-cover: clamp(3.8rem, 11vw, 9.8rem);
  --kin-title-feature: clamp(3rem, 7vw, 7rem);
  --kin-title-section: clamp(2rem, 4.6vw, 4.8rem);
  --kin-copy-size: clamp(0.75rem, 0.85vw, 0.9375rem);
  --kin-caption-size: 0.625rem;
}

.kin-editorial-title {
  font-family: var(--kin-display-serif);
  font-weight: 400;
  line-height: 0.88;
  letter-spacing: -0.035em;
}

.kin-editorial-copy {
  font-family: var(--kin-reading-serif);
  font-size: var(--kin-copy-size);
  line-height: 1.15;
}

.kin-metadata {
  font-family: var(--kin-micro-mono);
  font-size: var(--kin-caption-size);
  line-height: 1.1;
}

.kin-fullbleed-image {
  position: relative;
  isolation: isolate;
  background-size: cover;
  background-position: center;
}

.kin-fullbleed-image::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: var(--kin-overlay);
  pointer-events: none;
}
```

Implementation note: the pseudo-element layering above assumes the image is applied to a separate background layer or adjusted with `z-index`. Do not allow the overlay to sit above the actual headline or interactive content.

---

## 12. Final directive for the coding agent

```text
Follow the supplied Revue Faire references as closely as practical in visual grammar.
Prioritize, in this order:
1. Black-and-white photographic editorial surfaces.
2. Monumental high-contrast serif typography and tight line breaks.
3. Dense small serif reading text and tiny monospaced metadata.
4. Layered image/text overlaps, asymmetrical alignment, deliberate cropping.
5. Barcode graphics, paperclip-like line drawings, and marginal publication metadata.
6. Compact margins and strong changes in visual scale.

Do not replace this reference with a generic “editorial website” template.
Do not use the previous coral accent palette as the default.
Do not turn every page into a poster: apply the strongest treatment to the homepage introduction, gift pages, artist/editorial pages, and finished zines. Keep the working curation board clear enough to use.
Use KIN's own content and imagery, but match the supplied reference's visual grammar closely.
```
